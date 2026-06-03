/* mock-explorer.jsx — project Workspace: file tree + symbol/function (副程式) outline.
   Collapsible to an icon rail. Mirrors the circuit-side component library. */
const { useState: useStateX } = React;
const IconX = window.AIPLC.Icon;

/* project structure — a real PLC project: several files, many subroutines */
const PROJECT = {
  name: 'motor_fwd_rev',
  tree: [
    { id: 'src', kind: 'folder', name: 'src', open: true, children: [
      { id: 'main', kind: 'c', name: 'main.c', active: true, dirty: true },
      { id: 'sbr', kind: 'c', name: 'subroutines.c' },
      { id: 'isr', kind: 'c', name: 'interrupts.c' },
    ]},
    { id: 'inc', kind: 'folder', name: 'include', open: true, children: [
      { id: 'aiplc', kind: 'h', name: 'aiplc.h' },
      { id: 'ioc', kind: 'h', name: 'io_config.h' },
    ]},
    { id: 'cfg', kind: 'folder', name: 'config', open: false, children: [
      { id: 'iomap', kind: 'cfg', name: 'io_map.json' },
      { id: 'mb', kind: 'cfg', name: 'modbus.cfg' },
    ]},
  ],
};

/* symbol outline for the active file — many 副程式 */
const OUTLINE = [
  { name: 'PLC_Init', kind: 'fn', sig: 'void()', line: 6 },
  { name: 'PLC_Scan', kind: 'fn', sig: 'void()', line: 12, active: true },
  { name: 'SBR_Forward', kind: 'sbr', sig: '副程式', line: 31 },
  { name: 'SBR_Reverse', kind: 'sbr', sig: '副程式', line: 44 },
  { name: 'SBR_EStop', kind: 'sbr', sig: '副程式', line: 58 },
  { name: 'SBR_Overload', kind: 'sbr', sig: '副程式', line: 67 },
  { name: 'SBR_Interlock', kind: 'sbr', sig: '副程式', line: 79 },
  { name: 'run_timer', kind: 'var', sig: 'int', line: 4 },
  { name: 'MOTOR_MAX_A', kind: 'def', sig: '#define', line: 2 },
];

const FILE_ICON = { c: 'code', h: 'book', cfg: 'sliders', folder: 'files' };
const FILE_TINT = { c: '#2d6be4', h: '#7c3aed', cfg: '#f59e0b' };
const SYM = {
  fn:  { badge: 'ƒ', color: '#2d6be4', bg: '#eaf1fd' },
  sbr: { badge: '⊂', color: '#0077a3', bg: '#e6f7fd' },
  var: { badge: 'x', color: '#15803d', bg: '#eafaf0' },
  def: { badge: '#', color: '#b45309', bg: '#fff7ed' },
};

function TreeRow({ node, depth }) {
  const [open, setOpen] = useStateX(node.open !== false);
  const pad = 12 + depth * 14;
  if (node.kind === 'folder') {
    return (
      <div>
        <button className="ws-row" style={{ paddingLeft: pad }} onClick={() => setOpen(o => !o)}>
          <IconX name={open ? 'chevDown' : 'chevRight'} size={13} color="var(--qp-text-dim)" />
          <IconX name="files" size={14} color="var(--qp-primary-light)" />
          <span className="ws-name" style={{ fontWeight: 600 }}>{node.name}</span>
        </button>
        {open && node.children.map(c => <TreeRow key={c.id} node={c} depth={depth + 1} />)}
      </div>
    );
  }
  return (
    <button className={'ws-row ws-file' + (node.active ? ' active' : '')} style={{ paddingLeft: pad + 14 }} title={node.name}>
      <IconX name={FILE_ICON[node.kind] || 'code'} size={14} color={FILE_TINT[node.kind] || 'var(--qp-text-muted)'} />
      <span className="ws-name">{node.name}</span>
      {node.dirty && <span className="ws-dot" title="未存檔" />}
    </button>
  );
}

function WorkspaceExplorer({ collapsed, setCollapsed }) {
  const [tab, setTab] = useStateX('files'); // files | outline
  const [q, setQ] = useStateX('');

  if (collapsed) {
    return (
      <div className="ws-rail">
        <button className="qp-icon-btn" style={{ width: 32, height: 32, marginBottom: 6 }} onClick={() => setCollapsed(false)} title="展開 Workspace">
          <IconX name="chevRight" size={16} />
        </button>
        <button className="ws-rail-btn" title="專案檔案" onClick={() => { setCollapsed(false); setTab('files'); }}><IconX name="files" size={18} /></button>
        <button className="ws-rail-btn" title="副程式 / 大綱" onClick={() => { setCollapsed(false); setTab('outline'); }}><IconX name="sliders" size={18} /></button>
        <button className="ws-rail-btn" title="搜尋" onClick={() => { setCollapsed(false); setTab('outline'); }}><IconX name="search" size={18} /></button>
      </div>
    );
  }

  const fns = OUTLINE.filter(s => s.kind === 'fn' || s.kind === 'sbr');
  const others = OUTLINE.filter(s => s.kind === 'var' || s.kind === 'def');
  const matchO = (s) => q.trim() === '' || s.name.toLowerCase().includes(q.toLowerCase());

  return (
    <div className="ws-panel">
      <div className="ws-head">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span className="qp-eyebrow">WORKSPACE</span>
          <button className="qp-icon-btn" style={{ width: 26, height: 26, border: 'none' }} onClick={() => setCollapsed(true)} title="收合 Workspace">
            <IconX name="chevLeft" size={15} />
          </button>
        </div>
        <div className="ws-project">
          <IconX name="cpu" size={14} color="var(--qp-primary)" />
          <span>{PROJECT.name}</span>
          <span className="ws-proj-badge">PLC</span>
        </div>
        <div className="lib-tabs" style={{ marginTop: 9 }}>
          <button className={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}>
            <IconX name="files" size={12} />檔案
          </button>
          <button className={tab === 'outline' ? 'active' : ''} onClick={() => setTab('outline')}>
            <IconX name="sliders" size={12} />副程式
          </button>
        </div>
      </div>

      <div className="ws-body code-scroll">
        {tab === 'files' && (
          <div style={{ paddingTop: 4 }}>
            {PROJECT.tree.map(n => <TreeRow key={n.id} node={n} depth={0} />)}
            <button className="ws-add"><IconX name="plus" size={13} />新增檔案</button>
          </div>
        )}
        {tab === 'outline' && (
          <div>
            <div className="ws-search">
              <IconX name="search" size={13} color="var(--qp-text-dim)" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜尋符號 / 副程式…" />
            </div>
            <div className="ws-osec">main.c · 函式與副程式</div>
            {fns.filter(matchO).map((s, i) => {
              const m = SYM[s.kind];
              return (
                <button key={i} className={'ws-sym' + (s.active ? ' active' : '')} title={`第 ${s.line} 行`}>
                  <span className="ws-badge" style={{ color: m.color, background: m.bg }}>{m.badge}</span>
                  <span className="ws-sym-name">{s.name}</span>
                  <span className="ws-sym-sig">{s.sig}</span>
                </button>
              );
            })}
            {others.filter(matchO).length > 0 && <div className="ws-osec">變數與定義</div>}
            {others.filter(matchO).map((s, i) => {
              const m = SYM[s.kind];
              return (
                <button key={i} className="ws-sym" title={`第 ${s.line} 行`}>
                  <span className="ws-badge" style={{ color: m.color, background: m.bg }}>{m.badge}</span>
                  <span className="ws-sym-name">{s.name}</span>
                  <span className="ws-sym-sig">{s.sig}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

window.AIPLC = Object.assign(window.AIPLC || {}, { WorkspaceExplorer });
