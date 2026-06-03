/* ──────────────────────────────────────────────────────────
   UnifiedBottomDock — single bottom dock replacing the two
   separate BottomPanel instances.
   Collapsed: 30px status bar.
   Expanded:  resizable 120-440px with Console / Errors / Serial tabs.
   ────────────────────────────────────────────────────────── */

import { useCallback } from 'react'
import { Terminal, AlertTriangle, Monitor, X, ChevronUp } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import CompilationConsole from '../CompilationConsole'
import SerialMonitor from '../SerialMonitor'
import ResizeHandle from '../ResizeHandle'

/* ── DRC Errors list ─────────────────────────────────────── */
function DrcErrorsList() {
  const { drcResults } = useAppStore()
  if (!drcResults || drcResults.issues.length === 0) {
    return (
      <div style={{ padding: 16, color: 'var(--color-text-secondary)', fontSize: 13 }}>
        No issues found
      </div>
    )
  }
  return (
    <div style={{ padding: 8, overflowY: 'auto', height: '100%' }}>
      {drcResults.issues.map((issue, i) => (
        <div
          key={i}
          style={{
            padding: '8px 12px',
            marginBottom: 4,
            borderLeft: `3px solid ${issue.severity === 'error' ? 'var(--color-red, #EF4444)' : 'var(--color-yellow, #F59E0B)'}`,
            background: issue.severity === 'error' ? '#FEE2E2' : '#FEF3C7',
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          {issue.message}
        </div>
      ))}
    </div>
  )
}

/* ── Tab definition ──────────────────────────────────────── */
type DockTab = 'console' | 'errors' | 'serial'

const TABS: Array<{ id: DockTab; label: string; icon: React.ReactNode }> = [
  { id: 'console', label: 'Console', icon: <Terminal size={13} /> },
  { id: 'errors', label: 'Errors', icon: <AlertTriangle size={13} /> },
  { id: 'serial', label: 'Serial', icon: <Monitor size={13} /> },
]

/* ── Main component ──────────────────────────────────────── */
export default function UnifiedBottomDock() {
  const {
    bottomDockOpen,
    setBottomDockOpen,
    bottomDockTab,
    setBottomDockTab,
    bottomDockHeight,
    setBottomDockHeight,
    isSimulating,
    drcResults,
  } = useAppStore()

  /* Resize drag handler (dragging up = bigger) */
  const handleDrag = useCallback(
    (delta: number) => {
      setBottomDockHeight(Math.max(120, Math.min(440, bottomDockHeight - delta)))
    },
    [bottomDockHeight, setBottomDockHeight],
  )

  /* Status helpers */
  const errorCount = drcResults?.issues.filter((i) => i.severity === 'error').length ?? 0
  const statusText = isSimulating
    ? 'Simulating...'
    : errorCount > 0
      ? `${errorCount} error${errorCount > 1 ? 's' : ''}`
      : 'Ready'
  const statusBg = isSimulating
    ? '#eafaf0'
    : errorCount > 0
      ? '#FEE2E2'
      : '#f0f5ff'
  const statusColor = isSimulating
    ? '#15803d'
    : errorCount > 0
      ? '#EF4444'
      : 'var(--color-text-secondary, #6b7280)'

  /* ── Collapsed state: 30px status bar ── */
  if (!bottomDockOpen) {
    return (
      <div
        onClick={() => setBottomDockOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 30,
          padding: '0 12px',
          borderTop: '1px solid var(--color-border, #e5e7eb)',
          background: 'var(--color-bg, #fff)',
          flexShrink: 0,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 100,
            background: '#f0f5ff',
            color: 'var(--color-blue, #2d6be4)',
            border: '1px solid #cfe0f5',
          }}
        >
          <Terminal size={12} />
          Console
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 100,
            background: statusBg,
            color: statusColor,
          }}
        >
          {isSimulating && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#15803d',
                flexShrink: 0,
              }}
            />
          )}
          {statusText}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-text-secondary, #9ca3af)',
          }}
        >
          <ChevronUp size={14} />
        </span>
      </div>
    )
  }

  /* ── Expanded state ── */
  return (
    <div
      style={{
        height: bottomDockHeight,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid var(--color-border, #e5e7eb)',
        background: 'var(--color-bg, #fff)',
      }}
    >
      {/* Top resize handle */}
      <ResizeHandle direction="horizontal" onDrag={handleDrag} />

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 32,
          paddingLeft: 8,
          paddingRight: 8,
          borderBottom: '1px solid var(--color-border, #e5e7eb)',
          background: 'var(--color-surface, #f8f9fa)',
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => {
          const isActive = t.id === bottomDockTab
          return (
            <button
              key={t.id}
              className="dock-tab"
              onClick={() => setBottomDockTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '0 12px',
                height: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-text, #1a1a2e)' : 'var(--color-text-secondary, #6b7280)',
                borderBottom: isActive ? '2px solid var(--color-blue, #2d6be4)' : '2px solid transparent',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{t.icon}</span>
              {t.label}
              {/* Error badge on Errors tab */}
              {t.id === 'errors' && errorCount > 0 && !isActive && (
                <span
                  style={{
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    borderRadius: 10,
                    padding: '0 5px',
                    minWidth: 15,
                    textAlign: 'center',
                    marginLeft: 2,
                  }}
                >
                  {errorCount}
                </span>
              )}
            </button>
          )
        })}

        {/* Close button */}
        <button
          onClick={() => setBottomDockOpen(false)}
          title="Collapse"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            marginLeft: 'auto',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: 4,
            color: 'var(--color-text-secondary, #6b7280)',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-border, #e5e7eb)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {bottomDockTab === 'console' && <CompilationConsole />}
        {bottomDockTab === 'errors' && <DrcErrorsList />}
        {bottomDockTab === 'serial' && <SerialMonitor />}
      </div>
    </div>
  )
}
