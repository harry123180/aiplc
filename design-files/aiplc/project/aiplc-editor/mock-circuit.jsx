/* mock-circuit.jsx — industrial circuit schematic (motor fwd/rev control) with a
   scalable, searchable component LIBRARY panel + zoom controls.
   `sim` energizes wires & indicators. */
const { useState: useStateC } = React;
const IconC = window.AIPLC.Icon;

/* ───────────────────────── component catalog (scales to hundreds) ───────────────────────── */
const CATALOG = [
  { id: 'ctrl', name: '控制器', items: [
    { n: 'PLC CPU F405', p: '26 pin', g: 'cpu', c: '#1a4fa0', fav: true },
    { n: 'PLC CPU F407', p: '34 pin', g: 'cpu', c: '#1a4fa0' },
    { n: 'DI 擴充模組 ×16', p: '18 pin', g: 'cpu', c: '#1a4fa0' },
    { n: 'DO 擴充模組 ×16', p: '18 pin', g: 'cpu', c: '#1a4fa0' },
    { n: 'AI/AO 類比模組', p: '12 pin', g: 'cpu', c: '#1a4fa0' },
  ]},
  { id: 'in', name: '輸入元件', items: [
    { n: '按鈕 NO（常開）', p: '2 pin', g: 'btn', c: '#64748b', fav: true },
    { n: '按鈕 NC（常閉）', p: '2 pin', g: 'btnc', c: '#64748b', fav: true },
    { n: '自鎖切換開關', p: '2 pin', g: 'sw', c: '#64748b' },
    { n: '旋鈕選擇開關', p: '3 pin', g: 'sw', c: '#64748b' },
    { n: '極限開關', p: '3 pin', g: 'btn', c: '#64748b' },
    { n: '腳踏開關', p: '2 pin', g: 'btn', c: '#64748b' },
  ]},
  { id: 'out', name: '輸出元件', items: [
    { n: '指示燈（紅／黃／綠）', p: '2 pin', g: 'led', c: '#22c55e', fav: true },
    { n: '蜂鳴器', p: '2 pin', g: 'buz', c: '#22c55e' },
    { n: '繼電器 SPDT', p: '5 pin', g: 'relay', c: '#f59e0b', fav: true },
    { n: '接觸器 3相', p: '8 pin', g: 'relay', c: '#f59e0b' },
    { n: '電磁閥', p: '2 pin', g: 'sol', c: '#f59e0b' },
    { n: '7 段顯示器', p: '10 pin', g: 'seg', c: '#22c55e' },
  ]},
  { id: 'safe', name: '保護 / 安全', items: [
    { n: '急停按鈕', p: '2 pin', g: 'estop', c: '#e53e3e', fav: true },
    { n: '熱過載繼電器', p: '8 pin', g: 'relay', c: '#e53e3e' },
    { n: '無熔絲斷路器', p: '2 pin', g: 'cb', c: '#e53e3e' },
    { n: '保險絲', p: '2 pin', g: 'fuse', c: '#e53e3e' },
    { n: '安全門開關', p: '4 pin', g: 'btn', c: '#e53e3e' },
  ]},
  { id: 'sensor', name: '感測器', items: [
    { n: '近接開關 PNP', p: '3 pin', g: 'sensor', c: '#0077a3' },
    { n: '近接開關 NPN', p: '3 pin', g: 'sensor', c: '#0077a3' },
    { n: '光電感測器', p: '4 pin', g: 'sensor', c: '#0077a3' },
    { n: '溫度感測 PT100', p: '3 pin', g: 'sensor', c: '#0077a3' },
    { n: '壓力傳感器', p: '3 pin', g: 'sensor', c: '#0077a3' },
    { n: '旋轉編碼器', p: '6 pin', g: 'enc', c: '#0077a3' },
  ]},
  { id: 'load', name: '負載 / 馬達', items: [
    { n: '三相感應馬達', p: '3 pin', g: 'motor', c: '#1a4fa0', fav: true },
    { n: '步進馬達', p: '4 pin', g: 'motor', c: '#1a4fa0' },
    { n: '伺服馬達', p: '6 pin', g: 'motor', c: '#1a4fa0' },
    { n: '工業加熱器', p: '2 pin', g: 'heat', c: '#1a4fa0' },
  ]},
  { id: 'power', name: '電源', items: [
    { n: '24V DC 電源', p: '2 pin', g: 'power', c: '#e53e3e', fav: true },
    { n: '5V DC 電源', p: '2 pin', g: 'power', c: '#e53e3e' },
    { n: '接地 GND', p: '1 pin', g: 'gnd', c: '#334155' },
    { n: '變壓器', p: '4 pin', g: 'tx', c: '#e53e3e' },
  ]},
  { id: 'comm', name: '通訊', items: [
    { n: 'Modbus RTU', p: '3 pin', g: 'comm', c: '#7c3aed' },
    { n: 'RS-485 收發器', p: '4 pin', g: 'comm', c: '#7c3aed' },
    { n: 'CAN 匯流排', p: '2 pin', g: 'comm', c: '#7c3aed' },
  ]},
  { id: 'passive', name: '被動元件', items: [
    { n: '電阻', p: '2 pin', g: 'res', c: '#5c6bc0' },
    { n: '電容', p: '2 pin', g: 'cap', c: '#5c6bc0' },
    { n: '二極體', p: '2 pin', g: 'diode', c: '#5c6bc0' },
    { n: '接線端子', p: '3 pin', g: 'junction', c: '#334155' },
  ]},
];
const CAT_ICON = { ctrl: 'cpu', in: 'io', out: 'lightbulb', safe: 'shield', sensor: 'search', load: 'refresh', power: 'play', comm: 'monitor', passive: 'dots' };

/* tiny symbol thumbnail (28×28) */
function MiniSymbol({ g, c }) {
  const common = { strokeWidth: 1.6, stroke: c, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  let body;
  switch (g) {
    case 'cpu': body = (<g><rect x="7" y="7" width="14" height="14" rx="2" fill={c} opacity="0.9" /><path d="M11 7V4M17 7V4M11 24v-3M17 24v-3M7 11H4M7 17H4M24 11h-3M24 17h-3" {...common} fill="none" /></g>); break;
    case 'btn': body = (<g><path d="M5 16h6M17 16h6" {...common} /><path d="M11 16l5-3" {...common} /><circle cx="11" cy="16" r="1.6" {...common} /><circle cx="17" cy="16" r="1.6" {...common} /></g>); break;
    case 'btnc': body = (<g><path d="M5 16h18" {...common} /><path d="M12 12l4 8" stroke="#e53e3e" strokeWidth="1.6" /><circle cx="11" cy="16" r="1.6" {...common} /><circle cx="17" cy="16" r="1.6" {...common} /></g>); break;
    case 'sw': body = (<g><path d="M5 16h6M17 16h6" {...common} /><path d="M11 16l6-4" {...common} /><circle cx="11" cy="16" r="1.6" {...common} /></g>); break;
    case 'led': body = (<g><circle cx="14" cy="14" r="8" {...common} /><path d="M9 14h10M14 9v10" {...common} /></g>); break;
    case 'buz': body = (<g><path d="M7 11h5l5-4v14l-5-4H7z" {...common} /><path d="M20 10c2 2 2 6 0 8" {...common} /></g>); break;
    case 'relay': body = (<g><rect x="6" y="8" width="16" height="12" rx="2" {...common} /><path d="M9 14h3m4 0h3" {...common} /></g>); break;
    case 'sol': body = (<g><rect x="8" y="8" width="12" height="12" rx="2" {...common} /><path d="M11 8v12M14 8v12M17 8v12" {...common} /></g>); break;
    case 'seg': body = (<g><rect x="8" y="6" width="12" height="16" rx="2" {...common} /><path d="M11 10h6M11 14h6M11 18h6" {...common} /></g>); break;
    case 'estop': body = (<g><circle cx="14" cy="14" r="8" fill={c} /><path d="M11 11l6 6M17 11l-6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></g>); break;
    case 'cb': body = (<g><path d="M8 20L18 8" {...common} /><circle cx="8" cy="20" r="1.8" {...common} /><circle cx="18" cy="8" r="1.8" {...common} /></g>); break;
    case 'fuse': body = (<g><rect x="6" y="11" width="16" height="6" rx="3" {...common} /><path d="M9 14h10" {...common} /></g>); break;
    case 'sensor': body = (<g><path d="M14 6l8 8-8 8-8-8z" {...common} /><circle cx="14" cy="14" r="2.4" fill={c} stroke="none" /></g>); break;
    case 'enc': body = (<g><circle cx="14" cy="14" r="8" {...common} /><path d="M14 6v4M14 18v4M6 14h4M18 14h4" {...common} /></g>); break;
    case 'motor': body = (<g><circle cx="14" cy="14" r="8" {...common} /><text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill={c} fontFamily="Inter">M</text></g>); break;
    case 'heat': body = (<g><rect x="6" y="9" width="16" height="10" rx="2" {...common} /><path d="M10 12c1 1 1 3 0 4M14 12c1 1 1 3 0 4M18 12c1 1 1 3 0 4" {...common} /></g>); break;
    case 'power': body = (<g><rect x="6" y="9" width="16" height="10" rx="2" {...common} /><path d="M10 14h3M11.5 12.5v3M16 14h2" {...common} /></g>); break;
    case 'gnd': body = (<g><path d="M14 6v8M9 14h10M11 18h6M13 21h2" {...common} /></g>); break;
    case 'tx': body = (<g><circle cx="11" cy="14" r="5" {...common} /><circle cx="17" cy="14" r="5" {...common} /></g>); break;
    case 'comm': body = (<g><path d="M5 17c3-6 5-6 8 0s5 6 8 0" {...common} /></g>); break;
    case 'res': body = (<g><path d="M5 14h3l2-4 3 8 3-8 2 4h3" {...common} /></g>); break;
    case 'cap': body = (<g><path d="M5 14h7M16 14h7M12 8v12M16 8v12" {...common} /></g>); break;
    case 'diode': body = (<g><path d="M5 14h6M11 9l8 5-8 5zM19 9v10M19 14h4" {...common} /></g>); break;
    case 'junction': body = (<g><circle cx="14" cy="14" r="3" fill={c} stroke="none" /><path d="M14 6v5M14 17v5M6 14h5M17 14h5" {...common} /></g>); break;
    default: body = (<rect x="7" y="7" width="14" height="14" rx="2" {...common} />);
  }
  return <svg width="28" height="28" viewBox="0 0 28 28">{body}</svg>;
}

function LibItem({ it }) {
  return (
    <div className="lib-item" title={`${it.n} · ${it.p}\n點擊放置或拖曳至畫布`}>
      <div className="lib-thumb" style={{ background: it.c + '14' }}><MiniSymbol g={it.g} c={it.c} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lib-name">{it.n}</div>
        <div className="lib-pin">{it.p}</div>
      </div>
      <span className="lib-add"><IconC name="plus" size={14} color="var(--qp-primary)" /></span>
    </div>
  );
}

function ComponentLibrary({ collapsed, setCollapsed }) {
  const [query, setQuery] = useStateC('');
  const [open, setOpen] = useStateC({ ctrl: true, in: true, out: true });
  const [tab, setTab] = useStateC('all'); // all | fav

  if (collapsed) {
    return (
      <div className="lib-rail">
        <button className="qp-icon-btn" style={{ width: 32, height: 32, marginBottom: 6 }} onClick={() => setCollapsed(false)} title="展開元件庫">
          <IconC name="chevRight" size={16} />
        </button>
        {CATALOG.map(cat => (
          <button key={cat.id} className="lib-rail-btn" title={cat.name}
            onClick={() => { setCollapsed(false); setOpen(o => ({ ...o, [cat.id]: true })); }}>
            <IconC name={CAT_ICON[cat.id] || 'dots'} size={17} />
          </button>
        ))}
      </div>
    );
  }

  const q = query.trim();
  const filtered = CATALOG.map(cat => ({
    ...cat,
    list: cat.items.filter(it => (tab === 'fav' ? it.fav : true) && (q === '' || it.n.includes(q) || cat.name.includes(q))),
  })).filter(cat => cat.list.length > 0);
  const total = CATALOG.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="lib-panel">
      <div className="lib-head">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span className="qp-eyebrow">元件庫 · {total}</span>
          <button className="qp-icon-btn" style={{ width: 26, height: 26, border: 'none' }} onClick={() => setCollapsed(true)} title="收合元件庫">
            <IconC name="chevLeft" size={15} />
          </button>
        </div>
        <div className="lib-search">
          <IconC name="search" size={14} color="var(--qp-text-dim)" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜尋元件…" />
          {q && <button className="lib-clear" onClick={() => setQuery('')}><IconC name="x" size={13} /></button>}
        </div>
        <div className="lib-tabs">
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>全部</button>
          <button className={tab === 'fav' ? 'active' : ''} onClick={() => setTab('fav')}>
            <IconC name="lightbulb" size={12} />常用
          </button>
        </div>
      </div>

      <div className="lib-body code-scroll">
        {filtered.length === 0 && <div className="lib-empty">找不到「{q}」相關元件</div>}
        {filtered.map(cat => {
          const isOpen = q !== '' || open[cat.id];
          return (
            <div key={cat.id} className="lib-group">
              <button className="lib-group-head" onClick={() => setOpen(o => ({ ...o, [cat.id]: !o[cat.id] }))}>
                <IconC name={isOpen ? 'chevDown' : 'chevRight'} size={13} color="var(--qp-text-dim)" />
                <IconC name={CAT_ICON[cat.id] || 'dots'} size={14} color="var(--qp-primary-light)" />
                <span style={{ flex: 1, textAlign: 'left' }}>{cat.name}</span>
                <span className="lib-count">{cat.list.length}</span>
              </button>
              {isOpen && <div>{cat.list.map((it, i) => <LibItem key={i} it={it} />)}</div>}
            </div>
          );
        })}
      </div>

      <div className="lib-foot">
        <IconC name="plus" size={12} color="var(--qp-text-dim)" />
        點擊或拖曳至畫布放置
      </div>
    </div>
  );
}

/* ── component symbols (on canvas) ── */
function SymPower({ on }) {
  return (
    <g>
      <rect width="64" height="36" rx="8" fill="#fff" stroke={on ? '#e53e3e' : '#cbd5e1'} strokeWidth="1.5" />
      <text x="20" y="23" textAnchor="middle" fontSize="13" fontWeight="700" fill="#e53e3e" fontFamily="Inter">24V</text>
      <text x="48" y="23" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1a4fa0" fontFamily="Inter">−</text>
      <circle cx="14" cy="36" r="3.5" fill="#e53e3e" /><circle cx="50" cy="36" r="3.5" fill="#1a4fa0" />
    </g>
  );
}
function SymButton({ label, nc }) {
  return (
    <g>
      <rect width="64" height="44" rx="9" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
      <text x="32" y="15" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569" fontFamily="Inter">{label}</text>
      <line x1="14" y1="30" x2="26" y2="30" stroke="#334155" strokeWidth="1.8" />
      {nc
        ? <><line x1="38" y1="30" x2="50" y2="30" stroke="#334155" strokeWidth="1.8" /><line x1="28" y1="24" x2="34" y2="36" stroke="#e53e3e" strokeWidth="1.8" /></>
        : <line x1="38" y1="30" x2="48" y2="24" stroke="#334155" strokeWidth="1.8" />}
      <circle cx="28" cy="30" r="2.4" fill="none" stroke="#334155" /><circle cx="36" cy="30" r="2.4" fill="none" stroke="#334155" />
      <circle cx="0" cy="22" r="3.5" fill="#22c55e" /><circle cx="64" cy="22" r="3.5" fill="#22c55e" />
    </g>
  );
}
function SymEStop() {
  return (
    <g>
      <circle cx="22" cy="22" r="20" fill="#e53e3e" stroke="#b91c1c" strokeWidth="2" />
      <circle cx="22" cy="22" r="12" fill="#dc2626" stroke="#fff" strokeWidth="1.5" />
      <text x="22" y="-6" textAnchor="middle" fontSize="9" fontWeight="700" fill="#b91c1c" fontFamily="Inter">E-STOP</text>
      <circle cx="0" cy="22" r="3.5" fill="#e53e3e" /><circle cx="44" cy="22" r="3.5" fill="#e53e3e" />
    </g>
  );
}
function SymPLC({ energizedDI, energizedDO }) {
  return (
    <g>
      <rect width="130" height="210" rx="12" fill="#0d1f3c" stroke="#1a4fa0" strokeWidth="2" />
      <rect x="0" y="0" width="130" height="3" rx="1.5" fill="url(#seamGrad)" />
      <text x="65" y="26" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="Inter">PLC CPU</text>
      <text x="65" y="40" textAnchor="middle" fontSize="9" fill="#7da2dd" fontFamily="Inter">STM32F405</text>
      <text x="65" y="60" textAnchor="middle" fontSize="8" fill="#00c2ff" fontFamily="JetBrains Mono" letterSpacing="1.5">AIPLC · QianPro</text>
      {[0,1,2,3].map(i => (
        <g key={'di'+i}>
          <circle cx="0" cy={90 + i*28} r="4" fill={energizedDI.includes(i) ? '#00c2ff' : '#22c55e'} />
          <text x="11" y={94 + i*28} fontSize="8.5" fill="#aebfda" fontFamily="JetBrains Mono">DI{i}</text>
        </g>
      ))}
      {[0,1,2,3].map(i => (
        <g key={'do'+i}>
          <circle cx="130" cy={90 + i*28} r="4" fill={energizedDO.includes(i) ? '#00c2ff' : '#e2604a'} />
          <text x="119" y={94 + i*28} fontSize="8.5" fill="#aebfda" fontFamily="JetBrains Mono" textAnchor="end">DO{i}</text>
        </g>
      ))}
    </g>
  );
}
function SymRelay({ label, on }) {
  return (
    <g>
      <rect width="76" height="58" rx="10" fill={on ? '#fff7ed' : '#fff'} stroke={on ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.6" />
      <text x="38" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#b45309" fontFamily="Inter">{label}</text>
      <rect x="22" y="24" width="32" height="16" rx="3" fill="none" stroke={on ? '#f59e0b' : '#94a3b8'} strokeWidth="1.5" />
      <path d="M26 32h6m4 0h6" stroke={on ? '#f59e0b' : '#94a3b8'} strokeWidth="1.5" />
      {on && <circle cx="38" cy="48" r="3" fill="#f59e0b" className="live-dot" />}
      <circle cx="0" cy="20" r="3.5" fill="#e53e3e" /><circle cx="0" cy="40" r="3.5" fill="#1a4fa0" />
      <circle cx="76" cy="29" r="3.5" fill="#22c55e" />
    </g>
  );
}
function SymMotor({ on }) {
  return (
    <g>
      <circle cx="36" cy="36" r="34" fill="#fff" stroke="#1a4fa0" strokeWidth="2.5" />
      {on && <circle cx="36" cy="36" r="34" fill="none" stroke="#00c2ff" strokeWidth="2.5" strokeDasharray="5 6" className="spin-ring" />}
      <text x="36" y="40" textAnchor="middle" fontSize="26" fontWeight="700" fill="#1a4fa0" fontFamily="Inter">M</text>
      <text x="36" y="56" textAnchor="middle" fontSize="11" fill="#1a4fa0" fontFamily="Inter">3~</text>
      <circle cx="14" cy="2" r="3.5" fill="#e53e3e" /><circle cx="36" cy="2" r="3.5" fill="#22c55e" /><circle cx="58" cy="2" r="3.5" fill="#1a4fa0" />
    </g>
  );
}
function SymLED({ color, on, label }) {
  return (
    <g>
      {on && <circle cx="16" cy="16" r="22" fill={color} opacity="0.22" />}
      <circle cx="16" cy="16" r="15" fill={on ? color : '#eef2f7'} stroke={color} strokeWidth="2.5" />
      <text x="16" y="44" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b" fontFamily="Inter">{label}</text>
      <circle cx="16" cy="0" r="3.5" fill="#e53e3e" /><circle cx="16" cy="32" r="3.5" fill="#1a4fa0" />
    </g>
  );
}
function Wire({ d, on }) {
  return (
    <>
      <path d={d} fill="none" stroke={on ? '#00c2ff' : '#1a4fa0'} strokeWidth={on ? 2.6 : 1.8}
            strokeLinejoin="round" strokeLinecap="round" opacity={on ? 1 : 0.8} />
      {on && <path d={d} fill="none" stroke="#bff0ff" strokeWidth="2.6" strokeLinejoin="round"
                   strokeDasharray="3 9" style={{ animation: 'qp-flow 0.6s linear infinite' }} />}
    </>
  );
}

function CircuitMock({ sim, zoom = 100, onZoom, big }) {
  const [libCollapsed, setLibCollapsed] = useStateC(false);
  const eDI = sim ? [0] : [];
  const eDO = sim ? [0] : [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderBottom: '1px solid var(--qp-border)', background: 'var(--qp-bg)', flexShrink: 0 }}>
        <span className="panel-head" style={{ border: 'none', height: 'auto', padding: 0, gap: 7, color: 'var(--qp-text)' }}>
          <IconC name="circuit" size={15} color="var(--qp-primary)" />線路圖
        </span>
        <span style={{ fontSize: 11, color: 'var(--qp-text-dim)', fontFamily: 'var(--qp-font-mono)' }}>6 元件 · 8 接線</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
          <button className="qp-icon-btn" style={{ width: 28, height: 28 }} onClick={() => onZoom && onZoom(zoom - 10)} title="縮小"><IconC name="zoomOut" size={14} /></button>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--qp-text-muted)', minWidth: 38, textAlign: 'center' }}>{zoom}%</span>
          <button className="qp-icon-btn" style={{ width: 28, height: 28 }} onClick={() => onZoom && onZoom(zoom + 10)} title="放大"><IconC name="zoomIn" size={14} /></button>
          <button className="qp-icon-btn" style={{ width: 28, height: 28 }} onClick={() => onZoom && onZoom(100)} title="符合畫面"><IconC name="fit" size={14} /></button>
        </div>
      </div>

      {/* library + canvas */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <ComponentLibrary collapsed={libCollapsed} setCollapsed={setLibCollapsed} />
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#fff', minWidth: 0 }}>
          {sim && (
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
              <span className="status-pill" style={{ background: 'rgba(0,194,255,0.12)', color: '#0077a3', border: '1px solid rgba(0,194,255,0.35)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--qp-accent)' }} className="live-dot" />
                QEMU 模擬執行中 — GPIO 即時狀態
              </span>
            </div>
          )}
          <svg width="100%" height="100%" viewBox="0 0 780 440" preserveAspectRatio="xMidYMid meet"
               style={{ transform: `scale(${zoom/100})`, transformOrigin: 'center', transition: 'transform 0.18s var(--qp-ease)' }}>
            <defs>
              <pattern id="dotgrid" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="11" cy="11" r="0.9" fill="#dbe2ec" />
              </pattern>
              <linearGradient id="seamGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#1a4fa0" /><stop offset="1" stopColor="#00c2ff" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="780" height="440" fill="url(#dotgrid)" />
            <g>
              <Wire d="M 90 178 L 250 178" on={sim} />
              <Wire d="M 90 248 L 200 248 L 200 206 L 250 206" on={false} />
              <Wire d="M 90 318 L 180 318 L 180 234 L 250 234" on={false} />
              <Wire d="M 380 178 L 430 178 L 430 150 L 450 150" on={sim} />
              <Wire d="M 380 206 L 415 206 L 415 280 L 450 280" on={false} />
              <Wire d="M 526 150 L 560 150 L 560 90 L 593 90" on={sim} />
              <Wire d="M 526 280 L 560 280 L 560 200 L 615 200" on={false} />
              <Wire d="M 104 76 L 250 76 L 250 90" on={sim} />
            </g>
            <g transform="translate(40,40)"><SymPower on={sim} /></g>
            <g transform="translate(40,156)"><SymButton label="START NO" /></g>
            <g transform="translate(40,226)"><SymButton label="STOP NC" nc /></g>
            <g transform="translate(40,296)"><SymEStop /></g>
            <g transform="translate(250,90)"><SymPLC energizedDI={eDI} energizedDO={eDO} /></g>
            <g transform="translate(450,121)"><SymRelay label="KM1 正轉" on={sim} /></g>
            <g transform="translate(450,251)"><SymRelay label="KM2 反轉" on={false} /></g>
            <g transform="translate(607,164)"><SymMotor on={sim} /></g>
            <g transform="translate(544,60)"><SymLED color="#22c55e" on={sim} label="FWD" /></g>
            <g transform="translate(544,330)"><SymLED color="#2d6be4" on={false} label="REV" /></g>
          </svg>
        </div>
      </div>
    </div>
  );
}

window.AIPLC = Object.assign(window.AIPLC || {}, { CircuitMock });
