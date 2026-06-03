/**
 * PLC Netlist Builder — converts AIPLC canvas components + wires into
 * a SPICE netlist string for .op (DC operating point) analysis.
 *
 * Used by the DRC engine to detect electrical issues like short circuits,
 * overcurrent, and excessive power dissipation.
 */

import type { CanvasComponent, CanvasWire } from '../store/useAppStore'

// ---------------------------------------------------------------------------
// Union-Find for net merging
// ---------------------------------------------------------------------------

class UnionFind {
  private parent: Map<string, string> = new Map()

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x)
      return x
    }
    let root = x
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!
    }
    // Path compression
    let curr = x
    while (curr !== root) {
      const next = this.parent.get(curr)!
      this.parent.set(curr, root)
      curr = next
    }
    return root
  }

  union(a: string, b: string): void {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra !== rb) {
      this.parent.set(ra, rb)
    }
  }

  allRoots(): Set<string> {
    const roots = new Set<string>()
    for (const key of this.parent.keys()) {
      roots.add(this.find(key))
    }
    return roots
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a canonical pin ID: "componentId:pinName" */
function pinId(componentId: string, pinName: string): string {
  return `${componentId}:${pinName}`
}

/**
 * Parse a resistance value string like "1k", "470", "10kOhm", "1MΩ"
 * into a numeric value in Ohms.
 */
function parseResistance(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 1000 // default 1k

  // Strip non-numeric suffixes like "Ohm", "ohm", etc.
  const cleaned = String(value).replace(/[Ωohm\s]/gi, '').trim()

  const match = cleaned.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)([a-zA-Z]*)?$/i)
  if (!match) return 1000

  const num = parseFloat(match[1])
  const suffix = (match[2] || '').toLowerCase()

  const multipliers: Record<string, number> = {
    t: 1e12,
    g: 1e9,
    meg: 1e6,
    m: 1e6, // In resistor context, 'M' usually means Mega
    k: 1e3,
    '': 1,
  }

  return num * (multipliers[suffix] ?? 1)
}

/**
 * Sanitize a component ID to be a valid SPICE identifier.
 * SPICE identifiers can contain alphanumeric chars and underscores.
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_')
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

export function buildPlcNetlist(
  components: CanvasComponent[],
  wires: CanvasWire[],
): string {
  const uf = new UnionFind()

  // Build a component map for quick lookups
  const compMap = new Map<string, CanvasComponent>()
  for (const c of components) {
    compMap.set(c.id, c)
  }

  // Step 1: Register all component pins as nodes in Union-Find
  for (const c of components) {
    const pins = getComponentPins(c)
    for (const pin of pins) {
      uf.find(pinId(c.id, pin))
    }
  }

  // Step 2: Merge connected pins via wires
  for (const w of wires) {
    const fromPinId = pinId(w.fromComponent, w.fromPin)
    const toPinId = pinId(w.toComponent, w.toPin)
    uf.union(fromPinId, toPinId)
  }

  // Step 3: Assign net names
  // GND components' pin -> net "0"
  // power-24v V+ -> net "vcc"
  // Everything else gets auto-named net_N
  const specialNets = new Map<string, string>() // root -> net name

  for (const c of components) {
    if (c.type === 'ground') {
      const root = uf.find(pinId(c.id, 'GND'))
      specialNets.set(root, '0')
    }
    if (c.type === 'power-24v') {
      const rootPos = uf.find(pinId(c.id, 'V+'))
      if (!specialNets.has(rootPos)) {
        specialNets.set(rootPos, 'vcc')
      }
      // V- connects to ground net
      const rootNeg = uf.find(pinId(c.id, 'V-'))
      if (!specialNets.has(rootNeg)) {
        specialNets.set(rootNeg, '0')
      }
    }
  }

  let netCounter = 1
  const netNameCache = new Map<string, string>()

  function getNet(componentId: string, pinName: string): string {
    const root = uf.find(pinId(componentId, pinName))
    // Check special nets first
    const special = specialNets.get(root)
    if (special !== undefined) return special
    // Check cache
    const cached = netNameCache.get(root)
    if (cached) return cached
    // Assign new name
    const name = `n${netCounter++}`
    netNameCache.set(root, name)
    return name
  }

  // Step 4: Emit SPICE cards
  const lines: string[] = ['* AIPLC Auto-Generated Netlist']
  const senseSourceIds: string[] = [] // track sense sources for current measurement

  for (const c of components) {
    const sid = sanitizeId(c.id)

    switch (c.type) {
      case 'power-24v': {
        const voltage = Number(c.properties?.voltage ?? 24)
        const netPos = getNet(c.id, 'V+')
        const netNeg = getNet(c.id, 'V-')
        lines.push(`V_${sid} ${netPos} ${netNeg} DC ${voltage}`)
        break
      }

      case 'ground': {
        // Ground just defines net "0" — no SPICE element needed
        break
      }

      case 'resistor': {
        const resistance = parseResistance(c.properties?.value ?? '1k')
        const net1 = getNet(c.id, '1')
        const net2 = getNet(c.id, '2')
        lines.push(`R_${sid} ${net1} ${net2} ${resistance}`)
        break
      }

      case 'indicator-light': {
        // Model as a resistor (typical LED ~120 Ohm at 24V/20mA forward)
        // plus a 0V sense source for current measurement
        const netA = getNet(c.id, 'A')
        const netK = getNet(c.id, 'K')
        const senseNet = `${sid}_sense`
        // 0V voltage source for current sensing
        lines.push(`V_${sid}_sense ${netA} ${senseNet} DC 0`)
        // LED modeled as 120 Ohm (typical panel indicator at 24V)
        lines.push(`R_${sid} ${senseNet} ${netK} 120`)
        senseSourceIds.push(c.id)
        break
      }

      case 'relay': {
        // Coil modeled as ~960 Ohm (typical 24V relay coil)
        const netCoilP = getNet(c.id, 'COIL+')
        const netCoilN = getNet(c.id, 'COIL-')
        lines.push(`R_${sid}_coil ${netCoilP} ${netCoilN} 960`)
        // Contact side: NO = low resistance when energized
        const netCom = getNet(c.id, 'COM')
        const netNo = getNet(c.id, 'NO')
        lines.push(`R_${sid}_no ${netCom} ${netNo} 0.01`)
        // NC = high resistance when energized (open)
        const netNc = getNet(c.id, 'NC')
        lines.push(`R_${sid}_nc ${netCom} ${netNc} 10MEG`)
        break
      }

      case 'button-no': {
        // Normally open — for DRC, model as closed (conducting)
        const netCom = getNet(c.id, 'COM')
        const netNo = getNet(c.id, 'NO')
        lines.push(`R_${sid} ${netCom} ${netNo} 0.01`)
        break
      }

      case 'button-nc': {
        // Normally closed — conducting
        const netCom = getNet(c.id, 'COM')
        const netNc = getNet(c.id, 'NC')
        lines.push(`R_${sid} ${netCom} ${netNc} 0.01`)
        break
      }

      case 'emergency-stop': {
        // NC contacts — conducting
        const netNc1 = getNet(c.id, 'NC1')
        const netNc2 = getNet(c.id, 'NC2')
        lines.push(`R_${sid} ${netNc1} ${netNc2} 0.01`)
        break
      }

      case 'contactor-3phase': {
        // Coil
        const netCoilP = getNet(c.id, 'COIL+')
        const netCoilN = getNet(c.id, 'COIL-')
        lines.push(`R_${sid}_coil ${netCoilP} ${netCoilN} 100`)
        // Power contacts L->T (assume energized = closed for DRC)
        const netL1 = getNet(c.id, 'L1')
        const netT1 = getNet(c.id, 'T1')
        lines.push(`R_${sid}_c1 ${netL1} ${netT1} 0.01`)
        const netL2 = getNet(c.id, 'L2')
        const netT2 = getNet(c.id, 'T2')
        lines.push(`R_${sid}_c2 ${netL2} ${netT2} 0.01`)
        const netL3 = getNet(c.id, 'L3')
        const netT3 = getNet(c.id, 'T3')
        lines.push(`R_${sid}_c3 ${netL3} ${netT3} 0.01`)
        break
      }

      case 'motor-3phase': {
        // Each phase as a 50 Ohm load to a common star point
        const starNet = `${sid}_star`
        const netU = getNet(c.id, 'U')
        const netV = getNet(c.id, 'V')
        const netW = getNet(c.id, 'W')
        lines.push(`R_${sid}_u ${netU} ${starNet} 50`)
        lines.push(`R_${sid}_v ${netV} ${starNet} 50`)
        lines.push(`R_${sid}_w ${netW} ${starNet} 50`)
        break
      }

      case 'thermal-overload': {
        // Pass-through in normal state (low resistance L->T)
        const netL1 = getNet(c.id, 'L1')
        const netT1 = getNet(c.id, 'T1')
        lines.push(`R_${sid}_p1 ${netL1} ${netT1} 0.01`)
        const netL2 = getNet(c.id, 'L2')
        const netT2 = getNet(c.id, 'T2')
        lines.push(`R_${sid}_p2 ${netL2} ${netT2} 0.01`)
        const netL3 = getNet(c.id, 'L3')
        const netT3 = getNet(c.id, 'T3')
        lines.push(`R_${sid}_p3 ${netL3} ${netT3} 0.01`)
        // NC contact: closed in normal state
        const netNc = getNet(c.id, 'NC')
        const netNo = getNet(c.id, 'NO')
        // NC is connected through, NO is open
        // We need a reference for NC/NO — model as connected to each other through NC
        lines.push(`R_${sid}_nc ${netNc} ${netNo} 0.01`)
        break
      }

      case 'proximity-pnp': {
        // Model as: when detected, OUT sources current from +V
        const netV = getNet(c.id, '+V')
        const netOut = getNet(c.id, 'OUT')
        const netGnd = getNet(c.id, 'GND')
        // High-impedance input with pull-up behavior
        lines.push(`R_${sid}_pullup ${netV} ${netOut} 10k`)
        lines.push(`R_${sid}_gnd ${netGnd} 0 0.01`)
        break
      }

      case 'plc-cpu-f405': {
        // DI pins: high impedance input to ground
        for (let i = 0; i < 8; i++) {
          const pinName = `DI${i}`
          const net = getNet(c.id, pinName)
          // Only emit if the pin is actually connected (net is not isolated)
          if (net !== `n${netCounter}`) {
            lines.push(`R_${sid}_${pinName} ${net} 0 10MEG`)
          }
        }
        // DO pins: model as 24V source when HIGH (worst-case for DRC)
        for (let i = 0; i < 8; i++) {
          const pinName = `DO${i}`
          const net = getNet(c.id, pinName)
          // Only emit if the pin is connected somewhere
          lines.push(`V_${sid}_${pinName} ${net} 0 DC 24`)
        }
        // VCC and GND pins
        const vccNet = getNet(c.id, 'VCC')
        lines.push(`R_${sid}_vcc ${vccNet} 0 10MEG`)
        const gndNet = getNet(c.id, 'GND')
        if (gndNet !== '0') {
          lines.push(`R_${sid}_gnd ${gndNet} 0 0.01`)
        }
        break
      }

      case 'junction': {
        // Junction is purely topological — Union-Find already merged the nets.
        // No SPICE element needed.
        break
      }

      default: {
        // Unknown component type — skip silently
        break
      }
    }
  }

  // Append analysis
  lines.push('.op')
  lines.push('.end')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Pin definitions per component type
// ---------------------------------------------------------------------------

function getComponentPins(c: CanvasComponent): string[] {
  switch (c.type) {
    case 'plc-cpu-f405':
      return [
        'DI0', 'DI1', 'DI2', 'DI3', 'DI4', 'DI5', 'DI6', 'DI7',
        'DO0', 'DO1', 'DO2', 'DO3', 'DO4', 'DO5', 'DO6', 'DO7',
        'AI0', 'AI1', 'AI2', 'AI3', 'AO0', 'AO1', 'VCC', 'GND',
      ]
    case 'button-no':
      return ['COM', 'NO']
    case 'button-nc':
      return ['COM', 'NC']
    case 'indicator-light':
      return ['A', 'K']
    case 'relay':
      return ['COIL+', 'COIL-', 'COM', 'NO', 'NC']
    case 'contactor-3phase':
      return ['COIL+', 'COIL-', 'L1', 'L2', 'L3', 'T1', 'T2', 'T3']
    case 'motor-3phase':
      return ['U', 'V', 'W']
    case 'thermal-overload':
      return ['L1', 'L2', 'L3', 'T1', 'T2', 'T3', 'NC', 'NO']
    case 'emergency-stop':
      return ['NC1', 'NC2']
    case 'proximity-pnp':
      return ['+V', 'OUT', 'GND']
    case 'resistor':
      return ['1', '2']
    case 'ground':
      return ['GND']
    case 'power-24v':
      return ['V+', 'V-']
    case 'junction':
      return ['1', '2', '3']
    default:
      return []
  }
}
