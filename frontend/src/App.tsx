import { useRef } from 'react'
import Header from './components/Header'
import EditorPanel from './components/EditorPanel'
import CanvasPanel from './components/CanvasPanel'
import SerialMonitor from './components/SerialMonitor'
import McpSettingsModal from './components/McpSettingsModal'
import ResizeHandle from './components/ResizeHandle'
import BottomPanel from './components/BottomPanel'
import AIChatDrawer from './components/AIChatDrawer'
import CompilationConsole from './components/CompilationConsole'
import useAppStore from './store/useAppStore'
import { Terminal, AlertTriangle, Monitor } from 'lucide-react'

/* ── DRC Errors list (inline) ─────────────────────────── */
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
            borderLeft: `3px solid ${issue.severity === 'error' ? 'var(--color-red)' : 'var(--color-yellow)'}`,
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

/* ── Main App ─────────────────────────────────────────── */
export default function App() {
  const {
    leftPanelWidth,
    setLeftPanelWidth,
    leftBottomPanelHeight,
    setLeftBottomPanelHeight,
    rightBottomPanelHeight,
    setRightBottomPanelHeight,
    leftBottomTab,
    setLeftBottomTab,
    rightBottomTab,
    setRightBottomTab,
    isChatOpen,
    setChatOpen,
    isMcpModalOpen,
  } = useAppStore()

  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* Header */}
      <Header />

      {/* Main content area */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          position: 'relative',
        }}
      >
        {/* LEFT PANEL: Editor + Bottom (Console / Errors) */}
        <div
          style={{
            width: `${leftPanelWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 200,
            borderRight: '1px solid var(--color-border)',
          }}
        >
          {/* Editor area */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <EditorPanel />
          </div>

          {/* Left bottom panel */}
          <BottomPanel
            tabs={[
              { id: 'console', label: 'Console', icon: <Terminal size={14} /> },
              { id: 'errors', label: 'Errors', icon: <AlertTriangle size={14} /> },
            ]}
            activeTab={leftBottomTab}
            onTabChange={(tab) => setLeftBottomTab(tab as 'console' | 'errors')}
            height={leftBottomPanelHeight}
            onHeightChange={setLeftBottomPanelHeight}
          >
            {leftBottomTab === 'console' ? <CompilationConsole /> : <DrcErrorsList />}
          </BottomPanel>
        </div>

        {/* VERTICAL SPLITTER */}
        <ResizeHandle
          direction="vertical"
          onDrag={(delta) => {
            if (!containerRef.current) return
            const containerWidth = containerRef.current.getBoundingClientRect().width
            const deltaPct = (delta / containerWidth) * 100
            setLeftPanelWidth(Math.max(20, Math.min(80, leftPanelWidth + deltaPct)))
          }}
        />

        {/* RIGHT PANEL: Canvas + Bottom (Serial) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 200,
          }}
        >
          {/* Canvas area */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <CanvasPanel />
          </div>

          {/* Right bottom panel */}
          <BottomPanel
            tabs={[
              { id: 'serial', label: 'Serial Monitor', icon: <Monitor size={14} /> },
            ]}
            activeTab={rightBottomTab}
            onTabChange={(tab) => setRightBottomTab(tab as 'serial')}
            height={rightBottomPanelHeight}
            onHeightChange={setRightBottomPanelHeight}
          >
            <SerialMonitor />
          </BottomPanel>
        </div>

        {/* AI CHAT DRAWER */}
        <AIChatDrawer isOpen={isChatOpen} onClose={() => setChatOpen(false)} />
      </div>

      {/* Modals */}
      {isMcpModalOpen && <McpSettingsModal />}
    </div>
  )
}
