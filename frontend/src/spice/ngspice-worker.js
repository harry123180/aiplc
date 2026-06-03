/**
 * AIPLC ngspice Web Worker
 *
 * Loads the vendored ngspice WASM build and exposes a minimal message API
 * for .op (DC operating point) analysis used by the circuit DRC engine.
 *
 * Messages IN:
 *   { type: 'init' }                         -> boot ngspice WASM
 *   { type: 'run', netlist: string }          -> load netlist, run .op, return vectors
 *
 * Messages OUT:
 *   { type: 'ready' }
 *   { type: 'result', vectors: Record<string,number[]>, variableNames: string[] }
 *   { type: 'error', message: string }
 *
 * Based on Velxio's ngspice-interactive-worker.js but stripped down to the
 * minimum needed for AIPLC's DRC checks.
 */

/* global Module, HEAPU32, HEAPU8, HEAP32, HEAPF64, FS, _malloc, _free */

const MODEL_FILES = [
  'analog.cm', 'digital.cm', 'spice2poly.cm',
  'table.cm', 'tlines.cm', 'xtradev.cm', 'xtraevt.cm',
];

// vector_info struct offsets
const VECTOR_INFO_REALDATA_OFFSET = 12;
const VECTOR_INFO_IMAGDATA_OFFSET = 16;
const VECTOR_INFO_LENGTH_OFFSET = 20;

const ASSET_BASE = '/wasm/ngspice-interactive/';

let api = null;
let callbackPointers = null;
let ngspiceInitialized = false;
let moduleReady = null;
let filesystemReady = false;

// Stdout/stderr capture for command execution
let capturedStdout = [];
let capturedStderr = [];

// ── Message handler ─────────────────────────────────────────────────────

self.addEventListener('message', async (event) => {
  const data = event.data || {};

  try {
    if (data.type === 'init') {
      await ensureSession();
      self.postMessage({ type: 'ready' });
      return;
    }

    if (data.type === 'run') {
      await ensureSession();
      const result = await runNetlist(data.netlist || '');
      self.postMessage({ type: 'result', ...result });
      return;
    }

    self.postMessage({ type: 'error', message: `Unknown message type: ${data.type}` });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// ── Core logic ──────────────────────────────────────────────────────────

async function runNetlist(netlist) {
  if (!netlist.trim()) {
    throw new Error('Netlist is empty.');
  }

  // Reset previous circuit
  if (ngspiceInitialized && api) {
    api.reset();
    ngspiceInitialized = false;
    initializeNgspice();
  }

  // Load netlist via ngSpice_Circ
  const lines = buildCircuitLines(netlist);
  const allocations = allocateCStringArray(lines);

  try {
    const rc = api.circ(allocations.arrayPointer);
    if (rc !== 0) {
      throw new Error(`ngSpice_Circ failed (rc=${rc}). Check netlist syntax.`);
    }
  } finally {
    freeCStringArray(allocations);
  }

  // Run the .op analysis
  capturedStdout = [];
  capturedStderr = [];
  api.command('op');

  // Read all vectors from the current plot
  const curPlot = api.curPlot();
  if (!curPlot) {
    throw new Error('No plot available after analysis.');
  }

  const vecNames = readAllVecNames(curPlot);
  const vectors = {};
  const variableNames = [];

  for (const vecName of vecNames) {
    const qualifiedName = `${curPlot}.${vecName}`;
    const infoPtr = api.getVecInfo(qualifiedName);
    if (!infoPtr) continue;

    const length = HEAP32[(infoPtr + VECTOR_INFO_LENGTH_OFFSET) >> 2];
    if (length <= 0) continue;

    const realDataPtr = HEAPU32[(infoPtr + VECTOR_INFO_REALDATA_OFFSET) >> 2];
    if (!realDataPtr) continue;

    const values = [];
    for (let i = 0; i < length; i++) {
      values.push(HEAPF64[(realDataPtr >> 3) + i]);
    }

    // Normalize name to lowercase for consistent lookup
    const key = vecName.toLowerCase();
    vectors[key] = values;
    variableNames.push(key);
  }

  return { vectors, variableNames };
}

// ── Netlist preprocessing ───────────────────────────────────────────────

function buildCircuitLines(netlist) {
  const lines = netlist.replace(/\r/g, '').split('\n');
  const hasEnd = lines.some((line) => /^\s*\.end\s*$/i.test(line));
  if (!hasEnd) {
    lines.push('.end');
  }
  return lines;
}

// ── Session & module setup ──────────────────────────────────────────────

async function ensureSession() {
  await ensureModule();

  if (!filesystemReady) {
    await stageFilesystem();
    filesystemReady = true;
  }

  if (!callbackPointers) {
    registerCallbacks();
  }

  if (!ngspiceInitialized) {
    initializeNgspice();
  }
}

async function ensureModule() {
  if (moduleReady) return moduleReady;

  moduleReady = new Promise((resolve, reject) => {
    self.Module = {
      noInitialRun: true,
      locateFile: (path) => {
        if (path.endsWith('.wasm')) {
          return resolveUrl('ngspice-lib.wasm');
        }
        return path;
      },
      print: (text) => {
        capturedStdout.push(text);
      },
      printErr: (text) => {
        if (!text.includes('keepRuntimeAlive() is set')) {
          capturedStderr.push(text);
        }
      },
      onRuntimeInitialized: () => {
        bindApi();
        resolve();
      },
    };

    try {
      importScripts(resolveUrl('ngspice-lib.js'));
    } catch (error) {
      reject(error);
    }
  });

  return moduleReady;
}

function bindApi() {
  api = {
    init: Module.cwrap('ngSpice_Init', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']),
    command: Module.cwrap('ngSpice_Command', 'number', ['string']),
    circ: Module.cwrap('ngSpice_Circ', 'number', ['number']),
    curPlot: Module.cwrap('ngSpice_CurPlot', 'string', []),
    allPlots: Module.cwrap('ngSpice_AllPlots', 'number', []),
    allVecs: Module.cwrap('ngSpice_AllVecs', 'number', ['string']),
    getVecInfo: Module.cwrap('ngGet_Vec_Info', 'number', ['string']),
    reset: Module.cwrap('ngSpice_Reset', 'number', []),
    nospiceinit: Module.cwrap('ngSpice_nospiceinit', 'number', []),
    setInputPath: Module.cwrap('ngCM_Input_Path', 'number', ['string']),
  };
}

function registerCallbacks() {
  callbackPointers = {
    print: Module.addFunction(onPrint, 'iiii'),
    status: Module.addFunction(onStatus, 'iiii'),
    exit: Module.addFunction(onControlledExit, 'iiiiii'),
    data: Module.addFunction(onData, 'iiiii'),
    dataInit: Module.addFunction(onDataInit, 'iiii'),
    bg: Module.addFunction(onBackground, 'iiii'),
  };
}

function initializeNgspice() {
  api.nospiceinit();
  const rc = api.init(
    callbackPointers.print,
    callbackPointers.status,
    callbackPointers.exit,
    callbackPointers.data,
    callbackPointers.dataInit,
    callbackPointers.bg,
    0,
  );
  if (rc !== 0) {
    throw new Error(`ngSpice_Init failed (rc=${rc}).`);
  }
  api.setInputPath('/');
  api.command('set xspice_enabled');
  api.command('source /spinit');
  api.command('set noaskquit');
  ngspiceInitialized = true;
}

// ── Callbacks (minimal — we don't need progress for .op) ────────────────

function onPrint(messagePtr) {
  const text = Module.UTF8ToString(messagePtr);
  const isStderr = text.startsWith('stderr ');
  const body = isStderr ? text.slice(7) : (text.startsWith('stdout ') ? text.slice(7) : text);
  if (isStderr) {
    capturedStderr.push(body);
  } else {
    capturedStdout.push(body);
  }
  return 0;
}

function onStatus() { return 0; }
function onControlledExit() { return 0; }
function onData() { return 0; }
function onDataInit() { return 0; }
function onBackground() { return 0; }

// ── Filesystem staging ──────────────────────────────────────────────────

async function stageFilesystem() {
  ensurePath('/usr/local/lib/ngspice');
  ensurePath('/usr/local/share/ngspice/scripts');

  for (const name of MODEL_FILES) {
    const data = await fetchBinary(name);
    FS.writeFile(`/usr/local/lib/ngspice/${name}`, new Uint8Array(data));
  }

  const spinitText = await fetchText('spinit');
  FS.writeFile('/usr/local/share/ngspice/scripts/spinit', spinitText);
  FS.writeFile('/spinit', spinitText);
}

// ── Utility ─────────────────────────────────────────────────────────────

function readAllVecNames(plotName) {
  const vecsPtr = api.allVecs(plotName);
  if (!vecsPtr) return [];
  const names = [];
  for (let i = 0; i < 4096; i++) {
    const strPtr = HEAPU32[(vecsPtr >> 2) + i];
    if (!strPtr) break;
    names.push(Module.UTF8ToString(strPtr));
  }
  return names;
}

function allocateCStringArray(lines) {
  const stringPointers = lines.map((line) => allocateCString(line));
  const arrayPointer = _malloc((stringPointers.length + 1) * 4);
  stringPointers.forEach((pointer, index) => {
    HEAPU32[(arrayPointer >> 2) + index] = pointer;
  });
  HEAPU32[(arrayPointer >> 2) + stringPointers.length] = 0;
  return { arrayPointer, stringPointers };
}

function freeCStringArray({ arrayPointer, stringPointers }) {
  stringPointers.forEach((pointer) => _free(pointer));
  _free(arrayPointer);
}

function allocateCString(value) {
  const length = Module.lengthBytesUTF8(value) + 1;
  const pointer = _malloc(length);
  Module.stringToUTF8(value, pointer, length);
  return pointer;
}

function resolveUrl(fileName) {
  return new URL(`${ASSET_BASE}${fileName}`, self.location.href).toString();
}

async function fetchBinary(fileName) {
  const response = await fetch(resolveUrl(fileName));
  if (!response.ok) throw new Error(`Failed to fetch ${fileName}: ${response.status}`);
  return response.arrayBuffer();
}

async function fetchText(fileName) {
  const response = await fetch(resolveUrl(fileName));
  if (!response.ok) throw new Error(`Failed to fetch ${fileName}: ${response.status}`);
  return response.text();
}

function ensurePath(path) {
  const parts = path.split('/').filter(Boolean);
  let current = '/';
  for (const part of parts) {
    FS.createPath(current, part, true, true);
    current = current === '/' ? `/${part}` : `${current}/${part}`;
  }
}
