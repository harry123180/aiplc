/* ──────────────────────────────────────────────────────────
   WorkspaceExplorer — dockable side-panel (232px expanded, 48px rail).
   Two tabs: 檔案 (project tree) and 副程式 (symbol outline).
   Ported from mock-explorer.jsx.
   ────────────────────────────────────────────────────────── */

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileCode,
  BookOpen,
  Sliders,
  FolderOpen,
  Search,
  Plus,
  Cpu,
} from 'lucide-react'

/* ── Data ──────────────────────────────────────────────── */

interface TreeNode {
  id: string
  kind: 'folder' | 'c' | 'h' | 'cfg'
  name: string
  active?: boolean
  dirty?: boolean
  open?: boolean
  children?: TreeNode[]
}

const PROJECT = {
  name: 'motor_fwd_rev',
  tree: [
    {
      id: 'src', kind: 'folder' as const, name: 'src', open: true, children: [
        { id: 'main', kind: 'c' as const, name: 'main.c', active: true, dirty: true },
        { id: 'sbr', kind: 'c' as const, name: 'subroutines.c' },
        { id: 'isr', kind: 'c' as const, name: 'interrupts.c' },
      ],
    },
    {
      id: 'inc', kind: 'folder' as const, name: 'include', open: true, children: [
        { id: 'aiplc', kind: 'h' as const, name: 'aiplc.h' },
        { id: 'ioc', kind: 'h' as const, name: 'io_config.h' },
      ],
    },
    {
      id: 'cfg', kind: 'folder' as const, name: 'config', open: false, children: [
        { id: 'iomap', kind: 'cfg' as const, name: 'io_map.json' },
        { id: 'mb', kind: 'cfg' as const, name: 'modbus.cfg' },
      ],
    },
  ] as TreeNode[],
}

interface OutlineEntry {
  name: string
  kind: 'fn' | 'sbr' | 'var' | 'def'
  sig: string
  line: number
  active?: boolean
}

const OUTLINE: OutlineEntry[] = [
  { name: 'PLC_Init', kind: 'fn', sig: 'void()', line: 6 },
  { name: 'PLC_Scan', kind: 'fn', sig: 'void()', line: 12, active: true },
  { name: 'SBR_Forward', kind: 'sbr', sig: '副程式', line: 31 },
  { name: 'SBR_Reverse', kind: 'sbr', sig: '副程式', line: 44 },
  { name: 'SBR_EStop', kind: 'sbr', sig: '副程式', line: 58 },
  { name: 'SBR_Overload', kind: 'sbr', sig: '副程式', line: 67 },
  { name: 'SBR_Interlock', kind: 'sbr', sig: '副程式', line: 79 },
  { name: 'run_timer', kind: 'var', sig: 'int', line: 4 },
  { name: 'MOTOR_MAX_A', kind: 'def', sig: '#define', line: 2 },
]

const FILE_TINT: Record<string, string> = { c: '#2d6be4', h: '#7c3aed', cfg: '#f59e0b' }

const SYM: Record<string, { badge: string; color: string; bg: string }> = {
  fn:  { badge: 'ƒ', color: '#2d6be4', bg: '#eaf1fd' },
  sbr: { badge: '⊂', color: '#0077a3', bg: '#e6f7fd' },
  var: { badge: 'x', color: '#15803d', bg: '#eafaf0' },
  def: { badge: '#', color: '#b45309', bg: '#fff7ed' },
}

/* ── File icon component (lucide-based) ────────────────── */
function FileIcon({ kind }: { kind: string }) {
  const color = FILE_TINT[kind] ?? 'var(--qp-text-muted, #6b7280)'
  switch (kind) {
    case 'c':   return <FileCode size={14} color={color} />
    case 'h':   return <BookOpen size={14} color={color} />
    case 'cfg': return <Sliders size={14} color={color} />
    default:    return <FileCode size={14} color={color} />
  }
}

/* ── Tree row ──────────────────────────────────────────── */
function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(node.open !== false)
  const pad = 12 + depth * 14

  if (node.kind === 'folder') {
    return (
      <div>
        <button
          className="ws-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            width: '100%',
            height: 30,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
            fontSize: 13,
            color: 'var(--qp-text-body, #374151)',
            paddingLeft: pad,
            paddingRight: 12,
          }}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown
            size={13}
            color="var(--qp-text-dim, #9ca3af)"
            style={{
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 150ms',
            }}
          />
          <FolderOpen size={14} color="var(--qp-primary-light, #2d6be4)" />
          <span className="ws-name" style={{ fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {node.name}
          </span>
        </button>
        {open && node.children?.map((c) => <TreeRow key={c.id} node={c} depth={depth + 1} />)}
      </div>
    )
  }

  return (
    <button
      className={`ws-row ws-file${node.active ? ' active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        width: '100%',
        height: 30,
        border: 'none',
        background: node.active ? 'var(--qp-bg-tint, #f0f5ff)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
        fontSize: 13,
        color: node.active ? 'var(--qp-primary, #1a4fa0)' : 'var(--qp-text-body, #374151)',
        fontWeight: node.active ? 600 : 400,
        paddingLeft: pad + 14,
        paddingRight: 12,
        boxShadow: node.active ? 'inset 2px 0 0 var(--qp-primary, #1a4fa0)' : 'none',
      }}
      title={node.name}
    >
      <FileIcon kind={node.kind} />
      <span className="ws-name" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {node.name}
      </span>
      {node.dirty && (
        <span
          className="ws-dot"
          title="未存檔"
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--qp-accent, #00c2ff)',
            flexShrink: 0,
          }}
        />
      )}
    </button>
  )
}

/* ── Props ─────────────────────────────────────────────── */
interface WorkspaceExplorerProps {
  collapsed: boolean
  onToggle: () => void
}

/* ── Main component ────────────────────────────────────── */
export default function WorkspaceExplorer({ collapsed, onToggle }: WorkspaceExplorerProps) {
  const [tab, setTab] = useState<'files' | 'outline'>('files')
  const [q, setQ] = useState('')

  /* ── Collapsed rail ────────────────────────── */
  if (collapsed) {
    return (
      <div
        className="ws-rail"
        style={{
          width: 48,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: '8px 0',
          borderRight: '1px solid var(--qp-border, #e5e7eb)',
          background: 'var(--qp-bg-alt, #f8fafc)',
        }}
      >
        <button
          className="qp-icon-btn"
          style={{ width: 32, height: 32, marginBottom: 6 }}
          onClick={onToggle}
          title="展開 Workspace"
        >
          <ChevronRight size={16} />
        </button>
        <button
          className="ws-rail-btn"
          title="專案檔案"
          onClick={() => { onToggle(); setTab('files') }}
          style={{
            width: 36, height: 36, border: 'none', background: 'transparent',
            borderRadius: 'var(--qp-r-sm, 8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--qp-text-muted, #6b7280)',
          }}
        >
          <FolderOpen size={18} />
        </button>
        <button
          className="ws-rail-btn"
          title="副程式 / 大綱"
          onClick={() => { onToggle(); setTab('outline') }}
          style={{
            width: 36, height: 36, border: 'none', background: 'transparent',
            borderRadius: 'var(--qp-r-sm, 8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--qp-text-muted, #6b7280)',
          }}
        >
          <Sliders size={18} />
        </button>
        <button
          className="ws-rail-btn"
          title="搜尋"
          onClick={() => { onToggle(); setTab('outline') }}
          style={{
            width: 36, height: 36, border: 'none', background: 'transparent',
            borderRadius: 'var(--qp-r-sm, 8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--qp-text-muted, #6b7280)',
          }}
        >
          <Search size={18} />
        </button>
      </div>
    )
  }

  /* ── Outline filtering ─────────────────────── */
  const fns = OUTLINE.filter((s) => s.kind === 'fn' || s.kind === 'sbr')
  const others = OUTLINE.filter((s) => s.kind === 'var' || s.kind === 'def')
  const matchO = (s: OutlineEntry) => q.trim() === '' || s.name.toLowerCase().includes(q.toLowerCase())

  /* ── Expanded panel ────────────────────────── */
  return (
    <div
      className="ws-panel"
      style={{
        width: 232,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--qp-border, #e5e7eb)',
        background: 'var(--qp-bg-alt, #f8fafc)',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        className="ws-head"
        style={{
          padding: '11px 12px 10px',
          borderBottom: '1px solid var(--qp-border, #e5e7eb)',
          background: 'var(--qp-bg, #fff)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span
            className="qp-eyebrow"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--qp-primary-light, #2d6be4)',
            }}
          >
            WORKSPACE
          </span>
          <button
            className="qp-icon-btn"
            style={{ width: 26, height: 26, border: 'none' }}
            onClick={onToggle}
            title="收合 Workspace"
          >
            <ChevronLeft size={15} />
          </button>
        </div>

        {/* Project badge */}
        <div
          className="ws-project"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--qp-text-strong, #0d1f3c)',
          }}
        >
          <Cpu size={14} color="var(--qp-primary, #1a4fa0)" />
          <span>{PROJECT.name}</span>
          <span
            className="ws-proj-badge"
            style={{
              marginLeft: 'auto',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--qp-primary, #1a4fa0)',
              background: 'var(--qp-bg-tint, #f0f5ff)',
              border: '1px solid #cfe0f5',
              borderRadius: 100,
              padding: '1px 8px',
            }}
          >
            PLC
          </span>
        </div>

        {/* Tabs */}
        <div className="lib-tabs" style={{ display: 'flex', gap: 4, marginTop: 9 }}>
          <button
            className={tab === 'files' ? 'active' : ''}
            onClick={() => setTab('files')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flex: 1,
              justifyContent: 'center',
              height: 28,
              border: '1px solid var(--qp-border, #e5e7eb)',
              background: tab === 'files' ? 'var(--qp-bg-tint, #f0f5ff)' : 'var(--qp-bg, #fff)',
              borderRadius: 'var(--qp-r-sm, 8px)',
              cursor: 'pointer',
              fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
              fontSize: 12,
              fontWeight: 600,
              color: tab === 'files' ? 'var(--qp-primary, #1a4fa0)' : 'var(--qp-text-muted, #6b7280)',
              borderColor: tab === 'files' ? '#bcd2f5' : 'var(--qp-border, #e5e7eb)',
            }}
          >
            <FolderOpen size={12} />檔案
          </button>
          <button
            className={tab === 'outline' ? 'active' : ''}
            onClick={() => setTab('outline')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flex: 1,
              justifyContent: 'center',
              height: 28,
              border: '1px solid var(--qp-border, #e5e7eb)',
              background: tab === 'outline' ? 'var(--qp-bg-tint, #f0f5ff)' : 'var(--qp-bg, #fff)',
              borderRadius: 'var(--qp-r-sm, 8px)',
              cursor: 'pointer',
              fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
              fontSize: 12,
              fontWeight: 600,
              color: tab === 'outline' ? 'var(--qp-primary, #1a4fa0)' : 'var(--qp-text-muted, #6b7280)',
              borderColor: tab === 'outline' ? '#bcd2f5' : 'var(--qp-border, #e5e7eb)',
            }}
          >
            <Sliders size={12} />副程式
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className="ws-body code-scroll"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 8 }}
      >
        {/* Files tab */}
        {tab === 'files' && (
          <div style={{ paddingTop: 4 }}>
            {PROJECT.tree.map((n) => (
              <TreeRow key={n.id} node={n} depth={0} />
            ))}
            <button
              className="ws-add"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                width: 'calc(100% - 16px)',
                margin: '6px 8px 0',
                height: 30,
                padding: '0 10px',
                border: '1px dashed var(--qp-border-strong, #d4dae3)',
                borderRadius: 'var(--qp-r-sm, 8px)',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--qp-text-dim, #9ca3af)',
              }}
            >
              <Plus size={13} />新增檔案
            </button>
          </div>
        )}

        {/* Outline tab */}
        {tab === 'outline' && (
          <div>
            {/* Search */}
            <div
              className="ws-search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                margin: '8px 10px',
                padding: '0 9px',
                height: 32,
                border: '1.5px solid var(--qp-border, #e5e7eb)',
                borderRadius: 'var(--qp-r-sm, 8px)',
                background: 'var(--qp-bg, #fff)',
              }}
            >
              <Search size={13} color="var(--qp-text-dim, #9ca3af)" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜尋符號 / 副程式…"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: "var(--qp-font-sans, 'Inter', sans-serif)",
                  fontSize: '12.5px',
                  color: 'var(--qp-text, #1a1a2e)',
                  minWidth: 0,
                }}
              />
            </div>

            {/* Functions + Subroutines section */}
            <div
              className="ws-osec"
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--qp-text-dim, #9ca3af)',
                padding: '10px 14px 5px',
              }}
            >
              main.c · 函式與副程式
            </div>
            {fns.filter(matchO).map((s, i) => {
              const m = SYM[s.kind]
              return (
                <button
                  key={i}
                  className={`ws-sym${s.active ? ' active' : ''}`}
                  title={`第 ${s.line} 行`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    height: 32,
                    padding: '0 14px',
                    border: 'none',
                    background: s.active ? 'var(--qp-bg-tint, #f0f5ff)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: s.active ? 'inset 2px 0 0 var(--qp-primary, #1a4fa0)' : 'none',
                  }}
                >
                  <span
                    className="ws-badge"
                    style={{
                      width: 19,
                      height: 19,
                      flexShrink: 0,
                      borderRadius: 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "var(--qp-font-mono, 'JetBrains Mono', monospace)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: m.color,
                      background: m.bg,
                    }}
                  >
                    {m.badge}
                  </span>
                  <span
                    className="ws-sym-name"
                    style={{
                      flex: 1,
                      fontSize: '12.5px',
                      fontWeight: 500,
                      color: 'var(--qp-text, #1a1a2e)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: "var(--qp-font-mono, 'JetBrains Mono', monospace)",
                    }}
                  >
                    {s.name}
                  </span>
                  <span
                    className="ws-sym-sig"
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--qp-text-dim, #9ca3af)',
                      fontFamily: "var(--qp-font-mono, 'JetBrains Mono', monospace)",
                      flexShrink: 0,
                    }}
                  >
                    {s.sig}
                  </span>
                </button>
              )
            })}

            {/* Variables & defines section */}
            {others.filter(matchO).length > 0 && (
              <div
                className="ws-osec"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--qp-text-dim, #9ca3af)',
                  padding: '10px 14px 5px',
                }}
              >
                變數與定義
              </div>
            )}
            {others.filter(matchO).map((s, i) => {
              const m = SYM[s.kind]
              return (
                <button
                  key={i}
                  className="ws-sym"
                  title={`第 ${s.line} 行`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    height: 32,
                    padding: '0 14px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    className="ws-badge"
                    style={{
                      width: 19,
                      height: 19,
                      flexShrink: 0,
                      borderRadius: 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "var(--qp-font-mono, 'JetBrains Mono', monospace)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: m.color,
                      background: m.bg,
                    }}
                  >
                    {m.badge}
                  </span>
                  <span
                    className="ws-sym-name"
                    style={{
                      flex: 1,
                      fontSize: '12.5px',
                      fontWeight: 500,
                      color: 'var(--qp-text, #1a1a2e)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: "var(--qp-font-mono, 'JetBrains Mono', monospace)",
                    }}
                  >
                    {s.name}
                  </span>
                  <span
                    className="ws-sym-sig"
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--qp-text-dim, #9ca3af)',
                      fontFamily: "var(--qp-font-mono, 'JetBrains Mono', monospace)",
                      flexShrink: 0,
                    }}
                  >
                    {s.sig}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
