import Header from './components/Header'
import McpSettingsModal from './components/McpSettingsModal'
import ChatDock from './components/chat/ChatDock'
import WorkArea from './components/layout/WorkArea'
import UnifiedBottomDock from './components/layout/UnifiedBottomDock'
import useAppStore from './store/useAppStore'

/* ── Main App ─────────────────────────────────────────── */
export default function App() {
  const {
    viewMode,
    isChatOpen,
    setChatOpen,
    isMcpModalOpen,
  } = useAppStore()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Header />

      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          position: 'relative',
        }}
      >
        {/* Main work area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <WorkArea viewMode={viewMode} />
          <UnifiedBottomDock />
        </div>

        {/* Chat dock — push layout, not overlay */}
        {isChatOpen && <ChatDock isOpen={isChatOpen} onClose={() => setChatOpen(false)} />}
      </div>

      {isMcpModalOpen && <McpSettingsModal />}
    </div>
  )
}
