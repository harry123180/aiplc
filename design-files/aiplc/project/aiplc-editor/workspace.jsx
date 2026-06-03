/* workspace.jsx — shared chrome pieces + the code/circuit work area + bottom dock.
   Consumed by the three layout directions. */
const { useState: useS, useRef: useR, useEffect: useE, useCallback: useCb } = React;
const { Icon: I, CodeMock: Code, CircuitMock: Circuit, ChatMock: Chat,
        SerialMock: Serial, ConsoleMock: Console, ErrorsMock: Errors } = window.AIPLC;

/* ── brand mark ── */
function Brand({ dark, compact }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--qp-grad-cta)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--qp-shadow-sm)' }}>
        <img src="assets/qp-logo.svg" alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} />
      </div>
      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: dark ? '#fff' : 'var(--qp-text-strong)', letterSpacing: '-0.01em' }}>AIPLC</span>
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', color: dark ? 'rgba(255,255,255,0.5)' : 'var(--qp-text-dim)' }}>千鉑科技</span>
        </div>
      )}
    </div>
  );
}

/* ── segmented Code / Split / Circuit ── */
function Segmented({ view, setView, onDark, sim }) {
  const items = [
    { id: 'code', label: '程式碼', icon: 'code' },
    { id: 'split', label: '並排', icon: 'split' },
    { id: 'circuit', label: '線路圖', icon: 'circuit' },
  ];
  return (
    <div className={'qp-seg' + (onDark ? ' on-dark' : '')}>
      {items.map(it => (
        <button key={it.id} className={view === it.id ? 'active' : ''} onClick={() => setView(it.id)}
                title={it.label}>
          <I name={it.icon} size={14} />
          <span className="seg-label">{it.label}</span>
          {sim && it.id === 'circuit' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--qp-accent)' }} className="live-dot" />}
        </button>
      ))}
    </div>
  );
}

/* ── run / check / chat controls ── */
function RunControls({ sim, setSim, chatOpen, setChatOpen, onDark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button className="qp-btn" title="Design Rule Check"
              style={onDark ? { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)' } : {}}>
        <I name="shield" size={15} />檢查
      </button>
      <button className={'qp-btn ' + (sim ? 'qp-btn-stop' : 'qp-btn-run')} onClick={() => setSim(!sim)}>
        <I name={sim ? 'stop' : 'play'} size={15} fill={sim ? 'none' : 'currentColor'} stroke={sim ? 'currentColor' : 'none'} />
        {sim ? '停止模擬' : '執行'}
      </button>
      <button className={'qp-btn' + (chatOpen ? ' qp-btn-primary' : '')} onClick={() => setChatOpen(!chatOpen)} title="AI Chat"
              style={!chatOpen && onDark ? { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)' } : {}}>
        <I name="sparkles" size={15} />AI
      </button>
    </div>
  );
}

/* ── generic drag splitter ── */
function useDrag(onDelta) {
  const start = useR(null);
  const onDown = useCb((e) => {
    e.preventDefault();
    start.current = { x: e.clientX, y: e.clientY };
    const move = (ev) => { if (start.current) onDelta(ev.clientX - start.current.x, ev.clientY - start.current.y, start.current); };
    const up = () => { start.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    document.body.style.userSelect = 'none';
  }, [onDelta]);
  return onDown;
}

/* ── bottom dock (console / errors / serial) ── */
function BottomDock({ open, setOpen, tab, setTab, height, setHeight, sim }) {
  const ref = useR(null);
  const onDrag = useDrag((dx, dy) => {
    const h = (ref.current ? ref.current._h0 : height) - dy;
    setHeight(Math.max(120, Math.min(440, h)));
  });
  if (!open) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 30, padding: '0 12px', borderTop: '1px solid var(--qp-border)', background: 'var(--qp-bg)', flexShrink: 0 }}>
        <button className="qp-chip" style={{ padding: '3px 10px' }} onClick={() => setOpen(true)}>
          <I name="terminal" size={12} color="var(--qp-primary)" />主控台
        </button>
        {sim && <span className="status-pill" style={{ background: '#eafaf0', color: '#15803d' }}><span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--qp-success)' }} />Serial 有輸出</span>}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--qp-text-dim)', fontFamily: 'var(--qp-font-mono)' }}>build ✓ · 0 errors · 1 warning</span>
      </div>
    );
  }
  const tabs = [
    { id: 'console', label: 'Console', icon: 'terminal' },
    { id: 'errors', label: 'Errors', icon: 'alert', badge: 1 },
    { id: 'serial', label: 'Serial Monitor', icon: 'monitor' },
  ];
  return (
    <div style={{ height, flexShrink: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--qp-border)', background: 'var(--qp-bg)' }}>
      <div className="resize-y" onMouseDown={(e) => { if (ref.current) ref.current._h0 = height; onDrag(e); }} />
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--qp-border)', flexShrink: 0, paddingRight: 8 }} ref={ref}>
        {tabs.map(t => (
          <button key={t.id} className={'dock-tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>
            <I name={t.icon} size={13} />{t.label}
            {t.badge && tab !== t.id && <span style={{ background: 'var(--qp-warn)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 10, padding: '0 5px', minWidth: 15, textAlign: 'center' }}>{t.badge}</span>}
          </button>
        ))}
        <button className="qp-icon-btn" style={{ width: 26, height: 26, marginLeft: 'auto', border: 'none' }} onClick={() => setOpen(false)} title="收合"><I name="chevDown" size={14} /></button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'console' ? <Console /> : tab === 'errors' ? <Errors /> : <Serial sim={sim} />}
      </div>
    </div>
  );
}

/* ── the code/circuit work area (respects view + split + bottom dock) ── */
function WorkArea({ view, setView, split, setSplit, sim, zoom, setZoom, bottomOpen, setBottomOpen, bottomTab, setBottomTab, bottomH, setBottomH, density }) {
  const rowRef = useR(null);
  const Explorer = window.AIPLC.WorkspaceExplorer;
  const [wsCollapsed, setWsCollapsed] = useS(false);
  // auto-collapse the workspace explorer in the tighter split view
  useE(() => { setWsCollapsed(view === 'split'); }, [view]);
  const onSplitDrag = useDrag((dx) => {
    const w = rowRef.current ? rowRef.current.getBoundingClientRect().width : 1000;
    setSplit(Math.max(25, Math.min(75, split + (dx / w) * 100)));
  });
  const compact = density === 'compact';
  const explorer = <Explorer collapsed={wsCollapsed} setCollapsed={setWsCollapsed} />;

  let content;
  if (view === 'code') content = (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {explorer}
      <div style={{ flex: 1, minWidth: 0, height: '100%' }}><Code compact={compact} /></div>
    </div>
  );
  else if (view === 'circuit') content = <Circuit sim={sim} zoom={zoom} onZoom={setZoom} big />;
  else content = (
    <div ref={rowRef} style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {explorer}
      <div style={{ width: split + '%', minWidth: 200, height: '100%' }}><Code compact={compact} /></div>
      <div className="resize-x" onMouseDown={onSplitDrag} style={{ borderLeft: '1px solid var(--qp-border)', borderRight: '1px solid var(--qp-border)' }} />
      <div style={{ flex: 1, minWidth: 240, height: '100%' }}><Circuit sim={sim} zoom={zoom} onZoom={setZoom} /></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--qp-bg)' }}>
      <div style={{ flex: 1, minHeight: 0 }} className="fade-in" key={view}>{content}</div>
      <BottomDock open={bottomOpen} setOpen={setBottomOpen} tab={bottomTab} setTab={setBottomTab} height={bottomH} setHeight={setBottomH} sim={sim} />
    </div>
  );
}

window.AIPLC = Object.assign(window.AIPLC || {}, {
  Brand, Segmented, RunControls, BottomDock, WorkArea, useDrag,
});
