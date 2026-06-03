import { useCallback, useRef } from 'react'
import Header from './components/Header'
import EditorPanel from './components/EditorPanel'
import ChatPanel from './components/ChatPanel'
import CanvasPanel from './components/CanvasPanel'
import SerialMonitor from './components/SerialMonitor'
import McpSettingsModal from './components/McpSettingsModal'
import useAppStore from './store/useAppStore'
import { Monitor, LayoutGrid } from 'lucide-react'

export default function App() {
  const { bottomPanelHeight, setBottomPanelHeight, bottomTab, setBottomTab } =
    useAppStore()

  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newHeight = containerRect.bottom - e.clientY
      const clamped = Math.max(100, Math.min(newHeight, containerRect.height - 150))
      setBottomPanelHeight(clamped)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [setBottomPanelHeight])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top Bar */}
      <Header />

      {/* Main content area */}
      <div ref={containerRef} className="flex flex-col flex-1 min-h-0">
        {/* Top panels: Editor + Chat */}
        <div
          className="flex flex-1 min-h-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {/* Editor Panel - left 50% */}
          <div
            className="flex-1 min-w-0"
            style={{ borderRight: '1px solid var(--color-border)' }}
          >
            <EditorPanel />
          </div>

          {/* Chat Panel - right 50% */}
          <div className="flex-1 min-w-0">
            <ChatPanel />
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="shrink-0 cursor-row-resize flex items-center justify-center"
          style={{
            height: '6px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            className="rounded-full"
            style={{
              width: '32px',
              height: '3px',
              background: 'var(--color-border)',
            }}
          />
        </div>

        {/* Bottom panel: Canvas + Serial Monitor tabs */}
        <div className="shrink-0" style={{ height: bottomPanelHeight }}>
          <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div
              className="flex items-center shrink-0"
              style={{
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            >
              <button
                onClick={() => setBottomTab('canvas')}
                className="flex items-center gap-1.5 px-4 h-8 text-xs font-medium
                           cursor-pointer border-none transition-colors"
                style={{
                  background:
                    bottomTab === 'canvas'
                      ? 'var(--color-bg)'
                      : 'transparent',
                  color:
                    bottomTab === 'canvas'
                      ? 'var(--color-blue)'
                      : 'var(--color-text-secondary)',
                  borderBottom:
                    bottomTab === 'canvas'
                      ? '2px solid var(--color-blue)'
                      : '2px solid transparent',
                }}
              >
                <LayoutGrid size={13} />
                Canvas
              </button>
              <button
                onClick={() => setBottomTab('serial')}
                className="flex items-center gap-1.5 px-4 h-8 text-xs font-medium
                           cursor-pointer border-none transition-colors"
                style={{
                  background:
                    bottomTab === 'serial'
                      ? 'var(--color-bg)'
                      : 'transparent',
                  color:
                    bottomTab === 'serial'
                      ? 'var(--color-blue)'
                      : 'var(--color-text-secondary)',
                  borderBottom:
                    bottomTab === 'serial'
                      ? '2px solid var(--color-blue)'
                      : '2px solid transparent',
                }}
              >
                <Monitor size={13} />
                Serial Monitor
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {bottomTab === 'canvas' ? <CanvasPanel /> : <SerialMonitor />}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <McpSettingsModal />
    </div>
  )
}
