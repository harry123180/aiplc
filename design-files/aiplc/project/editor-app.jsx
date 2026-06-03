/* editor-app.jsx — chat dock, the 3 layout directions, app state, tweaks, presenter. */
const { useState: u, useRef: ur, useEffect: ue } = React;
const A = window.AIPLC;
const { Icon: Ic, Brand: Br, Segmented: Seg, RunControls: Run, WorkArea: Work, ChatMock: ChatP, useDrag: drag } = A;

/* ───────── Chat dock (right / bottom / float / fullscreen) ───────── */
function ChatDock({ pos, open, setOpen, fs, setFs, width, setWidth, height, setHeight, density }) {
  const onWDrag = drag((dx) => setWidth(Math.max(300, Math.min(620, width - dx))));
  const onHDrag = drag((dx, dy) => setHeight(Math.max(220, Math.min(560, height - dy))));
  if (!open) return null;

  const panel = (extraStyle, opts = {}) =>
  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--qp-bg)', ...extraStyle }}>
      <ChatP onClose={() => {setFs(false);setOpen(false);}} onExpand={opts.canFs ? () => setFs(!fs) : null} fullscreen={fs} density={density} />
    </div>;


  if (fs) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(10,22,40,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        {panel({ width: 'min(960px, 100%)', height: '100%', borderRadius: 'var(--qp-r-2xl)', boxShadow: 'var(--qp-shadow-md)', border: '1px solid var(--qp-border)' }, { canFs: true })}
      </div>);

  }
  if (pos === 'right') {
    return (
      <>
        <div className="resize-x" onMouseDown={onWDrag} />
        {panel({ width, flexShrink: 0, borderLeft: '1px solid var(--qp-border)' }, { canFs: true })}
      </>);

  }
  if (pos === 'bottom') {
    return (
      <div style={{ height, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="resize-y" onMouseDown={onHDrag} />
        {panel({ flex: 1, minHeight: 0, borderTop: '1px solid var(--qp-border)' }, { canFs: true })}
      </div>);

  }
  /* float */
  return (
    <div style={{ position: 'absolute', right: 18, bottom: 18, zIndex: 60, width: 372, height: 540, maxHeight: 'calc(100% - 36px)' }}>
      {panel({ width: '100%', height: '100%', borderRadius: 'var(--qp-r-2xl)', boxShadow: 'var(--qp-shadow-md)', border: '1px solid var(--qp-border)' }, { canFs: true })}
    </div>);

}

/* ───────── shared work + chat composition (for A & B) ───────── */
function WorkAndChat({ ctx, chatPos }) {
  const work = <Work {...ctx.work} />;
  if (!ctx.chatOpen || chatPos === 'float' || chatPos === 'bottom') {
    return (
      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0 }}>{work}</div>
        {chatPos === 'float' && <ChatDock {...ctx.chat} pos="float" />}
      </div>);

  }
  /* right */
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
      <div style={{ flex: 1, minWidth: 0 }}>{work}</div>
      <ChatDock {...ctx.chat} pos="right" />
    </div>);

}

/* ───────── Direction A — Classic Workbench ───────── */
function DirectionA({ ctx }) {
  const { view, setView, sim, setSim, chatOpen, setChatOpen, chatPos } = ctx;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, height: 58, padding: '0 18px', borderBottom: '1px solid var(--qp-border)', background: 'var(--qp-bg)', boxShadow: 'var(--qp-shadow-sm)', flexShrink: 0, zIndex: 20 }}>
        <Br />
        <div style={{ width: 1, height: 24, background: 'var(--qp-border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="qp-icon-btn"><Ic name="undo" size={15} /></button>
          <button className="qp-icon-btn"><Ic name="redo" size={15} /></button>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Seg view={view} setView={setView} sim={sim} />
        </div>
        <button className="qp-icon-btn" title="設定"><Ic name="settings" size={16} /></button>
        <Run sim={sim} setSim={setSim} chatOpen={chatOpen} setChatOpen={setChatOpen} />
      </header>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <WorkAndChat ctx={ctx} chatPos={chatPos} />
        {chatOpen && chatPos === 'bottom' && <ChatDock {...ctx.chat} pos="bottom" />}
      </div>
    </div>);

}

/* ───────── Direction B — Activity Rail ───────── */
function DirectionB({ ctx }) {
  const { view, setView, sim, setSim, chatOpen, setChatOpen, chatPos } = ctx;
  const railItems = [
  { id: 'files', icon: 'files', label: '檔案' },
  { id: 'code', icon: 'code', label: '程式', view: 'code' },
  { id: 'split', icon: 'split', label: '並排', view: 'split' },
  { id: 'circuit', icon: 'circuit', label: '線路', view: 'circuit' },
  { id: 'io', icon: 'io', label: 'I/O' }];

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* rail */}
      <div style={{ width: 60, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--qp-navy-900)', alignItems: 'center', paddingTop: 12, gap: 2 }}>
        <div style={{ marginBottom: 10 }}><Br dark compact /></div>
        {railItems.map((it) =>
        <button key={it.id} className={'rail-btn' + (it.view === view ? ' active' : '')}
        onClick={() => it.view && setView(it.view)} title={it.label}>
            <Ic name={it.icon} size={19} />{it.label}
          </button>
        )}
        <div style={{ marginTop: 'auto', width: '100%', paddingBottom: 10 }}>
          <button className={'rail-btn' + (chatOpen ? ' active' : '')} onClick={() => setChatOpen(!chatOpen)} title="AI"><Ic name="sparkles" size={19} />AI</button>
          <button className="rail-btn" title="設定"><Ic name="settings" size={19} />設定</button>
        </div>
      </div>
      {/* main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, height: 48, padding: '0 16px', borderBottom: '1px solid var(--qp-border)', background: 'var(--qp-bg)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--qp-text-muted)', fontWeight: 600 }}>
            <span>專案</span><Ic name="chevRight" size={13} /><span style={{ color: 'var(--qp-text)' }}>motor_fwd_rev</span>
            <span style={{ color: 'var(--qp-text-dim)' }}>/</span><span style={{ color: 'var(--qp-primary)' }}>main.c</span>
          </div>
          <div style={{ marginLeft: 'auto' }}><Seg view={view} setView={setView} sim={sim} /></div>
          <div style={{ width: 1, height: 22, background: 'var(--qp-border)' }} />
          <Run sim={sim} setSim={setSim} chatOpen={chatOpen} setChatOpen={setChatOpen} />
        </header>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <WorkAndChat ctx={ctx} chatPos={chatPos} />
          {chatOpen && chatPos === 'bottom' && <ChatDock {...ctx.chat} pos="bottom" />}
        </div>
      </div>
    </div>);

}

/* ───────── Direction C — Focus Stage ───────── */
function DirectionC({ ctx }) {
  const { view, setView, sim, setSim, chatOpen, setChatOpen, chatPos } = ctx;
  const glass = { background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: 'var(--qp-shadow)' };
  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--qp-bg-alt)' }}>
      {/* stage */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1, minWidth: 0, padding: 14, paddingTop: 64 }} data-comment-anchor="318a497df8-div-149-9">
          <div style={{ height: '100%', borderRadius: 'var(--qp-r-2xl)', overflow: 'hidden', border: '1px solid var(--qp-border)', boxShadow: 'var(--qp-shadow)' }}>
            <Work {...ctx.work} />
          </div>
        </div>
        {chatOpen && chatPos === 'right' &&
        <div style={{ width: ctx.chat.width, flexShrink: 0, padding: '64px 14px 14px 0' }}>
            <div style={{ height: '100%', borderRadius: 'var(--qp-r-2xl)', overflow: 'hidden', border: '1px solid var(--qp-border)', boxShadow: 'var(--qp-shadow)' }}>
              <ChatP onClose={() => setChatOpen(false)} onExpand={() => ctx.chat.setFs(!ctx.chat.fs)} fullscreen={ctx.chat.fs} />
            </div>
          </div>
        }
        {chatOpen && chatPos === 'float' && <ChatDock {...ctx.chat} pos="float" />}
        {ctx.chat.fs && <ChatDock {...ctx.chat} pos="float" />}

        {/* floating brand */}
        <div style={{ position: 'absolute', top: 14, left: 14, ...glass, borderRadius: 'var(--qp-r-pill)', padding: '7px 16px 7px 9px' }}>
          <Br />
        </div>
        {/* floating command pill */}
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', ...glass, borderRadius: 'var(--qp-r-pill)', padding: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Seg view={view} setView={setView} sim={sim} />
          <div style={{ width: 1, height: 22, background: 'var(--qp-border)' }} />
          <button className="qp-icon-btn" style={{ border: 'none', background: 'transparent' }} title="檢查"><Ic name="shield" size={16} /></button>
          <button className={'qp-btn ' + (sim ? 'qp-btn-stop' : 'qp-btn-run')} onClick={() => setSim(!sim)} style={{ height: 32 }}>
            <Ic name={sim ? 'stop' : 'play'} size={14} fill={sim ? 'none' : 'currentColor'} stroke={sim ? 'currentColor' : 'none'} />{sim ? '停止' : '執行'}
          </button>
        </div>
        {/* floating right actions */}
        <div style={{ position: 'absolute', top: 14, right: 14, ...glass, borderRadius: 'var(--qp-r-pill)', padding: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className={'qp-btn' + (chatOpen ? ' qp-btn-primary' : '')} onClick={() => setChatOpen(!chatOpen)} style={{ height: 32 }}><Ic name="sparkles" size={15} />AI 助手</button>
          <button className="qp-icon-btn" style={{ border: 'none', background: 'transparent' }} title="設定"><Ic name="settings" size={16} /></button>
        </div>
      </div>
      {chatOpen && chatPos === 'bottom' && <ChatDock {...ctx.chat} pos="bottom" />}
    </div>);

}

/* ───────── App ───────── */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "chatPos": "right",
  "density": "regular",
  "accent": "#1a4fa0"
} /*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [direction, setDirection] = u(() => localStorage.getItem('aiplc_dir') || 'A');
  const [view, setView] = u('split');
  const [sim, setSimRaw] = u(false);
  const [chatOpen, setChatOpen] = u(true);
  const [fs, setFs] = u(false);
  const [chatW, setChatW] = u(380);
  const [chatH, setChatH] = u(300);
  const [zoom, setZoom] = u(100);
  const [bottomOpen, setBottomOpen] = u(false);
  const [bottomTab, setBottomTab] = u('console');
  const [bottomH, setBottomH] = u(200);
  const [split, setSplit] = u(48);

  ue(() => {localStorage.setItem('aiplc_dir', direction);}, [direction]);
  ue(() => {document.documentElement.setAttribute('data-density', t.density);}, [t.density]);
  ue(() => {document.documentElement.style.setProperty('--qp-primary', t.accent);}, [t.accent]);

  // entering sim → focus circuit + serial
  const setSim = (v) => {
    setSimRaw(v);
    if (v) {setView('circuit');setBottomOpen(true);setBottomTab('serial');} else
    {setBottomTab('console');}
  };

  const ctx = {
    view, setView, sim, setSim, chatOpen, setChatOpen, chatPos: t.chatPos,
    chat: { open: chatOpen, setOpen: setChatOpen, fs, setFs, width: chatW, setWidth: setChatW, height: chatH, setHeight: setChatH, density: t.density },
    work: { view, setView, split, setSplit, sim, zoom, setZoom, bottomOpen, setBottomOpen, bottomTab, setBottomTab, bottomH, setBottomH, density: t.density }
  };

  const Dir = direction === 'A' ? DirectionA : direction === 'B' ? DirectionB : DirectionC;

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }} data-density={t.density}>
      <div style={{ flex: 1, minHeight: 0 }}><Dir ctx={ctx} /></div>

      {/* presenter — switch layout direction (not part of product) */}
      <div className="presenter">
        <span className="pl">佈局</span>
        {[['A', '經典工作台'], ['B', '左軌雙欄'], ['C', '聚焦舞台']].map(([k, lab]) =>
        <button key={k} className={direction === k ? 'active' : ''} onClick={() => setDirection(k)}>{k} · {lab}</button>
        )}
      </div>

      <TweaksPanel>
        <TweakSection label="AI Chat" />
        <TweakRadio label="Chat 位置" value={t.chatPos} options={['right', 'bottom', 'float']}
        onChange={(v) => setTweak('chatPos', v)} />
        <TweakSection label="工作區" />
        <TweakRadio label="密度" value={t.density} options={['compact', 'regular', 'comfy']}
        onChange={(v) => setTweak('density', v)} />
        <TweakColor label="品牌主色" value={t.accent}
        options={['#1a4fa0', '#0f3070', '#2d6be4', '#0077a3']}
        onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </div>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);