/* mock-ui.jsx — icons, code editor, AI chat, serial/console/errors panels.
   Exports to window for the layout-direction files to consume. */
const { useState, useRef, useEffect } = React;

/* ───────────────────────── Icon set (lucide-ish, 24px stroke) ───────────────────────── */
const ICON_PATHS = {
  code:        'M16 18l6-6-6-6M8 6l-6 6 6 6',
  split:       'M3 4h7v16H3zM14 4h7v16h-7z',
  circuit:     'M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M5 5h14v14H5zM9 9h6v6H9z',
  play:        'M6 4l14 8-14 8z',
  stop:        'M6 6h12v12H6z',
  shield:      'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z M9 12l2 2 4-4',
  chat:        'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  settings:    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6h.09A1.65 1.65 0 0 0 9.5 3V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.51 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8.6a1.65 1.65 0 0 0 1.51 1.4H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  undo:        'M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 0 10h-3',
  redo:        'M15 14l5-5-5-5 M20 9H9a5 5 0 0 0 0 10h3',
  x:           'M18 6L6 18M6 6l12 12',
  expand:      'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  shrink:      'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
  chevDown:    'M6 9l6 6 6-6',
  chevRight:   'M9 6l6 6-6 6',
  chevLeft:    'M15 6l-6 6 6 6',
  send:        'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  bot:         'M12 8V4H8 M4 8h16v12H4z M2 14h2M20 14h2M9 13v2M15 13v2',
  user:        'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  wrench:      'M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.5 2.5-2.8-.7-.7-2.8z',
  plus:        'M12 5v14M5 12h14',
  zoomIn:      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3M11 8v6M8 11h6',
  zoomOut:     'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3M8 11h6',
  fit:         'M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3',
  files:       'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM15 2v5h5',
  terminal:    'M4 17l6-6-6-6M12 19h8',
  alert:       'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4M12 17h.01',
  monitor:     'M3 4h18v12H3zM8 20h8M12 16v4',
  panelRight:  'M3 4h18v16H3z M15 4v16',
  panelBottom: 'M3 4h18v16H3z M3 14h18',
  sparkles:    'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4M5 17v3M6.5 18.5h-3',
  rotate:      'M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5',
  trash:       'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
  sliders:     'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  search:      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  save:        'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8M7 3v5h8',
  cpu:         'M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M5 5h14v14H5zM9 9h6v6H9z',
  io:          'M4 6h16M4 12h16M4 18h16M8 4v4M14 10v4M10 16v4',
  refresh:     'M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16',
  lightbulb:   'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.6 1 1.4 1 2.3h6c0-.9.4-1.7 1-2.3A7 7 0 0 0 12 2z',
  book:        'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z',
  dots:        'M12 6h.01M12 12h.01M12 18h.01',
};
function Icon({ name, size = 18, color = 'currentColor', stroke = 2, fill = 'none', style }) {
  const d = ICON_PATHS[name] || '';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}

/* ───────────────────────── Code editor mock ───────────────────────── */
const CODE_LINES = [
  '#include "aiplc.h"',
  '',
  '// 馬達正反轉控制 — 啟動 / 停止 / 急停互鎖',
  'static int run_timer = 0;',
  '',
  'void PLC_Init(void) {',
  '    DO_Write(0, false);   // KM1 正轉',
  '    DO_Write(1, false);   // KM2 反轉',
  '    Serial_Print("Motor control ready");',
  '}',
  '',
  'void PLC_Scan(void) {',
  '    bool start = DI_Read(0);   // 啟動按鈕 NO',
  '    bool stop  = DI_Read(1);   // 停止按鈕 NC',
  '    bool estop = DI_Read(2);   // 急停 NC',
  '',
  '    if (!stop || !estop) {',
  '        DO_Write(0, false);',
  '        DO_Write(1, false);',
  '        return;',
  '    }',
  '',
  '    if (start && !DO_Read(1)) {',
  '        DO_Write(0, true);     // 正轉 ON（互鎖）',
  '        Timer_Start(0, 500);',
  '    }',
  '}',
];
const KW = new Set(['void','bool','int','if','else','while','for','return','true','false','static','const','uint16_t','uint32_t','int32_t','uint8_t','include']);
const HAL = new Set(['DI_Read','DO_Write','DO_Read','DO_Toggle','AI_Read','AO_Write','Timer_Start','Timer_Done','Timer_Reset','Counter_Up','Counter_Value','Serial_Print','PLC_Init','PLC_Scan','Modbus_Init']);
function highlight(line) {
  const out = [];
  const ci = line.indexOf('//');
  let code = line, comment = '';
  if (ci >= 0) { code = line.slice(0, ci); comment = line.slice(ci); }
  const re = /("(?:[^"\\]|\\.)*")|(\b\d+\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z0-9_"]+)/g;
  let m, k = 0;
  while ((m = re.exec(code)) !== null) {
    let cls = 'punc', txt = m[0];
    if (m[1]) cls = 'str';
    else if (m[2]) cls = 'num';
    else if (m[3]) { cls = HAL.has(m[3]) ? 'fn' : KW.has(m[3]) ? 'kw' : 'id'; }
    else if (m[4]) cls = 'ws';
    out.push(<span key={k++} className={'tk-' + cls}>{txt}</span>);
  }
  if (comment) out.push(<span key={k++} className="tk-com">{comment}</span>);
  return out;
}

function CodeMock({ compact }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--code-bg)' }}>
      <div className="panel-head" style={{ background: 'var(--code-bg-2)', borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', padding: 0, position: 'relative' }}>
        <div className="file-tab" style={{ background: 'var(--code-bg)', borderColor: 'rgba(255,255,255,0.07)', color: '#dce8fb', position: 'relative' }}>
          <span className="seam" />
          <Icon name="code" size={14} color="var(--qp-accent)" />
          main.c
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--qp-accent)', marginLeft: 4 }} />
        </div>
        <span style={{ marginLeft: 'auto', marginRight: 12, fontSize: 11, fontFamily: 'var(--qp-font-mono)', color: '#5b7090' }}>C · UTF-8 · aiplc.h</span>
      </div>
      <div className="code-scroll" style={{ flex: 1, overflow: 'auto', fontFamily: 'var(--qp-font-mono)', fontSize: compact ? 12 : 13, lineHeight: compact ? 1.55 : 1.7, padding: '10px 0' }}>
        {CODE_LINES.map((ln, i) => (
          <div key={i} style={{ display: 'flex', minHeight: compact ? 19 : 22, paddingRight: 16 }}
               className="code-row">
            <span style={{ width: 46, flexShrink: 0, textAlign: 'right', paddingRight: 14, color: 'var(--code-gutter)', userSelect: 'none' }}>{i + 1}</span>
            <code style={{ whiteSpace: 'pre', color: 'var(--code-text)' }}>{highlight(ln)}{ln === '' ? '\u00A0' : ''}</code>
          </div>
        ))}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}

/* ───────────────────────── AI Chat ───────────────────────── */
const CHAT_THREAD = [
  { role: 'user', text: '幫我做一個馬達正反轉控制，有啟動、停止跟急停按鈕' },
  { role: 'assistant', text: '好的，我先在 Canvas 放上 PLC CPU、按鈕與接觸器並完成接線，再生成對應的 C 程式碼。' },
  { role: 'tool', name: 'canvas_add_component', args: '{ "type": "plc-cpu-f405", "x": 320, "y": 160 }', open: false },
  { role: 'tool', name: 'canvas_add_wire', args: '{ "from": "btn_start.NO", "to": "cpu.DI0" }', open: false },
  { role: 'tool', name: 'editor_set_code', args: '{ "lines": 26, "function": "PLC_Scan" }', open: false },
  { role: 'assistant', text: '✓ 已放置 6 個元件並完成接線\n✓ 程式碼已寫入 main.c（含正反轉互鎖）\n\n按 Run 即可開始 QEMU 模擬。需要我加上過載保護嗎？' },
];
const SUGGEST = ['加上熱過載保護', '解釋互鎖邏輯', '產生 I/O 對應表'];

function ChatMessage({ m }) {
  const [open, setOpen] = useState(!!m.open);
  if (m.role === 'tool') {
    return (
      <div style={{ display: 'flex', marginBottom: 10 }}>
        <div className="tool-card">
          <button className="tc-head" onClick={() => setOpen(o => !o)}>
            <Icon name="wrench" size={13} color="var(--qp-primary)" />
            <span style={{ flex: 1 }}>{m.name}</span>
            <Icon name={open ? 'chevDown' : 'chevRight'} size={13} color="var(--qp-primary)" />
          </button>
          {open && <div className="tc-body">{m.args}</div>}
        </div>
      </div>
    );
  }
  const isUser = m.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 8, marginBottom: 12 }}>
      {!isUser && (
        <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--qp-bg-tint)', border: '1px solid #cfe0f5' }}>
          <Icon name="sparkles" size={15} color="var(--qp-primary)" />
        </div>
      )}
      <div className={isUser ? 'bubble-user' : 'bubble-ai'} style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
    </div>
  );
}

function ChatMock({ onClose, onExpand, onCollapse, expanded, fullscreen, density }) {
  const [val, setVal] = useState('');
  const bodyRef = useRef(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--qp-bg-alt)' }}>
      <div className="panel-head" style={{ background: 'var(--qp-bg)', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--qp-grad-cta)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={13} color="#fff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span className="qp-eyebrow" style={{ fontSize: 9 }}>AI ASSISTANT</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--qp-text)' }}>千鉑助手</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onCollapse && (
            <button className="qp-icon-btn" style={{ width: 28, height: 28 }} onClick={onCollapse} title="縮起 AI Chat">
              <Icon name="panelRight" size={15} />
            </button>
          )}
          {onExpand && (
            <button className="qp-icon-btn" style={{ width: 28, height: 28 }} onClick={onExpand} title={fullscreen ? '退出全螢幕' : '全螢幕'}>
              <Icon name={fullscreen ? 'shrink' : 'expand'} size={15} />
            </button>
          )}
          {onClose && (
            <button className="qp-icon-btn" style={{ width: 28, height: 28 }} onClick={onClose} title="關閉 AI Chat">
              <Icon name="x" size={15} />
            </button>
          )}
        </div>
      </div>

      <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: 16, minHeight: 0 }}>
        <div style={{ maxWidth: fullscreen ? 760 : '100%', margin: '0 auto' }}>
          {CHAT_THREAD.map((m, i) => <ChatMessage key={i} m={m} />)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--qp-text-dim)', fontSize: 12, padding: '4px 0 2px 36px' }}>
            <span className="status-pill" style={{ background: '#eafaf0', color: '#15803d', padding: '2px 9px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--qp-success)' }} className="live-dot" />
              模擬就緒
            </span>
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '10px 14px', borderTop: '1px solid var(--qp-border)', background: 'var(--qp-bg)' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
          {SUGGEST.map(s => (
            <button key={s} className="qp-chip" onClick={() => setVal(s)}>
              <Icon name="lightbulb" size={12} color="var(--qp-primary-light)" />{s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: 6, borderRadius: 'var(--qp-r-lg)', border: '1.5px solid var(--qp-border)', background: 'var(--qp-bg-alt)' }}>
          <textarea
            value={val} onChange={e => setVal(e.target.value)}
            placeholder="描述你的控制需求，或請 AI 修改線路與程式…"
            rows={1}
            style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--qp-font-sans)', fontSize: 13, color: 'var(--qp-text)', padding: '6px 8px', maxHeight: 120 }}
          />
          <button className="qp-icon-btn" style={{ background: val.trim() ? 'var(--qp-primary)' : 'var(--qp-border)', borderColor: 'transparent', color: '#fff', width: 34, height: 34 }}>
            <Icon name="send" size={15} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Serial / Console / Errors ───────────────────────── */
function SerialMock({ sim }) {
  const lines = [
    { ts: '00:00.012', cls: 'ok', t: 'Motor control ready' },
    { ts: '00:00.518', cls: 'info', t: 'DI0=1  啟動按鈕按下' },
    { ts: '00:00.520', cls: '', t: 'DO0=1  KM1 正轉 ON' },
    { ts: '00:01.020', cls: 'info', t: 'Timer[0] elapsed 500ms' },
    { ts: '00:03.244', cls: 'warn', t: 'AI0 = 7.8A  負載偏高' },
    { ts: '00:04.001', cls: '', t: 'Forward running…' },
  ];
  return (
    <div className="terminal code-scroll">
      {lines.map((l, i) => (
        <div key={i}><span className="ts">{l.ts} </span><span className={l.cls}>{l.t}</span></div>
      ))}
      {sim && <div><span className="ts">{'> '}</span><span className="live-dot" style={{ color: 'var(--qp-accent)' }}>_</span></div>}
    </div>
  );
}
function ConsoleMock() {
  const lines = [
    { cls: 'ts', t: '$ arm-none-eabi-gcc -O2 main.c -o build/firmware.elf' },
    { cls: '', t: 'compiling aiplc HAL…' },
    { cls: 'ok', t: '✓ build succeeded   text=12.4KB  data=1.1KB  bss=2.0KB' },
    { cls: 'info', t: '→ flashing QEMU STM32F405 target' },
  ];
  return (
    <div className="terminal code-scroll">
      {lines.map((l, i) => <div key={i}><span className={l.cls || ''}>{l.t}</span></div>)}
    </div>
  );
}
function ErrorsMock() {
  const issues = [
    { sev: 'warning', t: 'DO0 與 DO1 同時導通風險 — 建議加入互鎖檢查', c: 'INTERLOCK' },
    { sev: 'info', t: '已通過 6 項規則，0 個錯誤', c: 'OK' },
  ];
  return (
    <div style={{ padding: 12, overflowY: 'auto', height: '100%' }}>
      {issues.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 9, padding: '9px 12px', marginBottom: 7, borderRadius: 'var(--qp-r-sm)',
          borderLeft: `3px solid ${it.sev === 'warning' ? 'var(--qp-warn)' : 'var(--qp-success)'}`,
          background: it.sev === 'warning' ? '#fffbeb' : '#f0fdf4' }}>
          <Icon name={it.sev === 'warning' ? 'alert' : 'shield'} size={15} color={it.sev === 'warning' ? 'var(--qp-warn)' : 'var(--qp-success)'} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--qp-text)', lineHeight: 1.45 }}>{it.t}</div>
            <div style={{ fontSize: 10.5, fontFamily: 'var(--qp-font-mono)', color: 'var(--qp-text-dim)', marginTop: 2 }}>{it.c}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

window.AIPLC = Object.assign(window.AIPLC || {}, {
  Icon, CodeMock, ChatMock, SerialMock, ConsoleMock, ErrorsMock,
});
