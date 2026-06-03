import { Settings, Play, Square } from 'lucide-react'
import useAppStore from '../store/useAppStore'

export default function Header() {
  const { isSimulating, setIsSimulating, setMcpModalOpen } = useAppStore()

  const handleRun = () => {
    setIsSimulating(!isSimulating)
  }

  return (
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
      </div>
    </header>
  )
}
