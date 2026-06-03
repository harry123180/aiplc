import { useEffect } from 'react'
import { Settings, Play, Square, Shield, MessageSquare, Undo2, Redo2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { runDrc } from '../utils/circuitVerifier'
import DrcVerificationModal from './DrcVerificationModal'

export default function Header() {
  const {
    isSimulating,
    setIsSimulating,
    setMcpModalOpen,
    drcResults,
    setDrcResults,
    isDrcModalOpen,
    setDrcModalOpen,
    isChatOpen,
    setChatOpen,
    clearHighlights,
    undoStack,
    redoStack,
  } = useAppStore()

  const canUndoNow = undoStack.length > 0
  const canRedoNow = redoStack.length > 0

  // Global keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useAppStore.getState().undo()
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        useAppStore.getState().redo()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Count DRC errors/warnings for badge indicator
  const drcErrors = drcResults?.issues.filter((i) => i.severity === 'error').length ?? 0
  const drcWarnings = drcResults?.issues.filter((i) => i.severity === 'warning').length ?? 0

  const handleDrcCheck = () => {
    const { components, wires, code } = useAppStore.getState()
    const result = runDrc(components, wires, code)
    setDrcResults(result)
    setDrcModalOpen(true)
  }

  const handleRun = () => {
    if (isSimulating) {
      setIsSimulating(false)
      return
    }
    // Run DRC first
    const { components, wires, code } = useAppStore.getState()
    const result = runDrc(components, wires, code)
    setDrcResults(result)
    if (!result.passed) {
      setDrcModalOpen(true) // show modal, block run
      return
    }
    // If passed (may have warnings), proceed to simulate
    setIsSimulating(true)
  }

  const handleDrcClose = () => {
    setDrcModalOpen(false)
    clearHighlights()
  }

  const handleDrcRunAnyway = () => {
    setDrcModalOpen(false)
    clearHighlights()
    setIsSimulating(true)
  }

  return (
    <>
      <header
        className="flex items-center justify-between px-5 h-12 border-b"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-bg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded"
            style={{ background: 'var(--color-blue)' }}
          >
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <h1
            className="text-lg font-semibold tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            AIPLC
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            onClick={() => useAppStore.getState().undo()}
            disabled={!canUndoNow}
            className="flex items-center justify-center w-8 h-8 rounded-lg
                       transition-colors cursor-pointer border"
            style={{
              color: canUndoNow ? 'var(--color-text-secondary)' : '#BDBDBD',
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg)',
              cursor: canUndoNow ? 'pointer' : 'default',
              opacity: canUndoNow ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (canUndoNow) e.currentTarget.style.background = 'var(--color-surface)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-bg)'
            }}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={() => useAppStore.getState().redo()}
            disabled={!canRedoNow}
            className="flex items-center justify-center w-8 h-8 rounded-lg
                       transition-colors cursor-pointer border"
            style={{
              color: canRedoNow ? 'var(--color-text-secondary)' : '#BDBDBD',
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg)',
              cursor: canRedoNow ? 'pointer' : 'default',
              opacity: canRedoNow ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (canRedoNow) e.currentTarget.style.background = 'var(--color-surface)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-bg)'
            }}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>

          <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />

          <button
            onClick={() => setMcpModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                       transition-colors cursor-pointer border"
            style={{
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-bg)'
            }}
          >
            <Settings size={16} />
            MCP Settings
          </button>

          {/* DRC Check button */}
          <button
            onClick={handleDrcCheck}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                       transition-colors cursor-pointer border"
            style={{
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-bg)'
            }}
            title="Design Rule Check"
          >
            <Shield size={16} />
            Check
            {/* DRC badge indicator */}
            {drcResults && (drcErrors > 0 || drcWarnings > 0) && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                style={{
                  background: drcErrors > 0 ? 'var(--color-red)' : 'var(--color-yellow)',
                }}
              />
            )}
          </button>

          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white
                       rounded-lg transition-colors cursor-pointer border-none"
            style={{
              background: isSimulating ? 'var(--color-red)' : 'var(--color-blue)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            {isSimulating ? <Square size={16} /> : <Play size={16} />}
            {isSimulating ? 'Stop' : 'Run'}
          </button>

          {/* AI Chat toggle */}
          <button
            onClick={() => setChatOpen(!isChatOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                       transition-colors cursor-pointer border"
            style={{
              color: isChatOpen ? 'var(--color-blue)' : 'var(--color-text-secondary)',
              borderColor: isChatOpen ? 'var(--color-blue)' : 'var(--color-border)',
              background: isChatOpen ? '#E8F0FE' : 'var(--color-bg)',
            }}
            onMouseEnter={(e) => {
              if (!isChatOpen) {
                e.currentTarget.style.background = 'var(--color-surface)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isChatOpen) {
                e.currentTarget.style.background = 'var(--color-bg)'
              }
            }}
            title="Toggle AI Chat"
          >
            <MessageSquare size={16} />
          </button>
        </div>
      </header>

      {/* DRC Verification Modal */}
      {isDrcModalOpen && drcResults && (
        <DrcVerificationModal
          onClose={handleDrcClose}
          onRunAnyway={handleDrcRunAnyway}
        />
      )}
    </>
  )
}
