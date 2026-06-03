import { useEffect } from 'react'
import { Settings, Play, Square, Shield, MessageSquare, Undo2, Redo2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { runDrc } from '../utils/circuitVerifier'
import { simulationClient } from '../services/simulationClient'
import DrcVerificationModal from './DrcVerificationModal'
import BrandMark from './ui/BrandMark'
import SegmentedControl from './ui/SegmentedControl'

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
    viewMode,
    setViewMode,
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

  const handleDrcCheck = async () => {
    const { components, wires, code } = useAppStore.getState()
    const result = await runDrc(components, wires, code)
    setDrcResults(result)
    setDrcModalOpen(true)
  }

  const handleRun = async () => {
    if (isSimulating) {
      // Stop simulation
      simulationClient.stop()
      simulationClient.disconnect()
      setIsSimulating(false)
      return
    }
    // Run DRC first
    const { components, wires, code, addSerialLine, clearSerial } = useAppStore.getState()
    const result = await runDrc(components, wires, code)
    setDrcResults(result)
    if (!result.passed) {
      setDrcModalOpen(true) // show modal, block run
      return
    }
    // Compile the code before simulating
    const { addCompilationLine, clearCompilation, setBottomDockOpen, setBottomDockTab } = useAppStore.getState()
    clearCompilation()
    addCompilationLine('[INFO] Compiling...')

    try {
      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const compileResult = await resp.json()

      if (compileResult.output) {
        compileResult.output.split('\n').forEach((line: string) => {
          if (line.trim()) addCompilationLine(line)
        })
      }

      if (!compileResult.success) {
        addCompilationLine('[ERROR] Compilation failed')
        setBottomDockOpen(true)
        setBottomDockTab('console')
        return
      }

      addCompilationLine('[OK] Compilation successful')
    } catch (err) {
      addCompilationLine(`[ERROR] Compile request failed: ${err}`)
      setBottomDockOpen(true)
      setBottomDockTab('console')
      return
    }

    // If compilation passed, proceed to simulate
    clearSerial()
    try {
      await simulationClient.connect({
        onSerialOutput: (text) => {
          useAppStore.getState().addSerialLine(text.replace(/\n$/, ''))
        },
        onGpioChange: (pin, state) => {
          console.log(`[GPIO] pin ${pin} = ${state}`)
        },
        onSystemEvent: (event) => {
          if (event === 'booted') {
            useAppStore.getState().addSerialLine('[SYSTEM] PLC simulation started')
          } else if (event === 'stopped') {
            useAppStore.getState().addSerialLine('[SYSTEM] PLC simulation stopped')
          }
        },
      })
      simulationClient.start(code)
      setIsSimulating(true)
    } catch {
      addSerialLine('[ERROR] Failed to connect to simulation server')
    }
  }

  const handleDrcClose = () => {
    setDrcModalOpen(false)
    clearHighlights()
  }

  const handleDrcRunAnyway = async () => {
    setDrcModalOpen(false)
    clearHighlights()
    const { code, addSerialLine, clearSerial, addCompilationLine, clearCompilation, setBottomDockOpen: setDockOpen, setBottomDockTab: setDockTab } = useAppStore.getState()

    // Compile the code first
    clearCompilation()
    addCompilationLine('[INFO] Compiling...')

    try {
      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const compileResult = await resp.json()

      if (compileResult.output) {
        compileResult.output.split('\n').forEach((line: string) => {
          if (line.trim()) addCompilationLine(line)
        })
      }

      if (!compileResult.success) {
        addCompilationLine('[ERROR] Compilation failed')
        setDockOpen(true)
        setDockTab('console')
        return
      }

      addCompilationLine('[OK] Compilation successful')
    } catch (err) {
      addCompilationLine(`[ERROR] Compile request failed: ${err}`)
      setDockOpen(true)
      setDockTab('console')
      return
    }

    // If compilation passed, proceed to simulate
    clearSerial()
    try {
      await simulationClient.connect({
        onSerialOutput: (text) => {
          useAppStore.getState().addSerialLine(text.replace(/\n$/, ''))
        },
        onGpioChange: (pin, state) => {
          console.log(`[GPIO] pin ${pin} = ${state}`)
        },
        onSystemEvent: (event) => {
          if (event === 'booted') {
            useAppStore.getState().addSerialLine('[SYSTEM] PLC simulation started')
          } else if (event === 'stopped') {
            useAppStore.getState().addSerialLine('[SYSTEM] PLC simulation stopped')
          }
        },
      })
      simulationClient.start(code)
      setIsSimulating(true)
    } catch {
      addSerialLine('[ERROR] Failed to connect to simulation server')
    }
  }

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          height: 58,
          padding: '0 18px',
          borderBottom: '1px solid var(--qp-border)',
          background: 'var(--qp-header)',
          boxShadow: 'var(--qp-shadow-sm)',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        {/* Left: Brand + divider + Undo/Redo */}
        <BrandMark />

        <div style={{ width: 1, height: 24, background: 'var(--qp-border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            className="qp-icon-btn"
            onClick={() => useAppStore.getState().undo()}
            disabled={!canUndoNow}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            className="qp-icon-btn"
            onClick={() => useAppStore.getState().redo()}
            disabled={!canRedoNow}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={15} />
          </button>
        </div>

        {/* Center: Segmented Control */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <SegmentedControl
            view={viewMode}
            onChange={setViewMode}
            isSimulating={isSimulating}
          />
        </div>

        {/* Right: Settings + Check + Run/Stop + Chat toggle */}
        <button
          className="qp-icon-btn"
          onClick={() => setMcpModalOpen(true)}
          title="設定"
        >
          <Settings size={16} />
        </button>

        <button
          className="qp-btn"
          onClick={handleDrcCheck}
          title="Design Rule Check"
          style={{ position: 'relative' }}
        >
          <Shield size={15} />
          檢查
          {/* DRC badge indicator */}
          {drcResults && (drcErrors > 0 || drcWarnings > 0) && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: drcErrors > 0 ? 'var(--qp-error)' : 'var(--qp-warn)',
              }}
            />
          )}
        </button>

        <button
          className={`qp-btn ${isSimulating ? 'qp-btn-stop' : 'qp-btn-run'}`}
          onClick={handleRun}
        >
          {isSimulating ? <Square size={15} /> : <Play size={15} fill="currentColor" stroke="none" />}
          {isSimulating ? '停止模擬' : '執行'}
        </button>

        <button
          className={`qp-icon-btn${isChatOpen ? ' active' : ''}`}
          onClick={() => setChatOpen(!isChatOpen)}
          title="Toggle AI Chat"
        >
          <MessageSquare size={16} />
        </button>
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
