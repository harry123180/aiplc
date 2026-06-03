import { useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'

export default function SerialMonitor() {
  const { serialOutput, clearSerial } = useAppStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [serialOutput])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 h-8 shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Output
        </span>
        <button
          onClick={clearSerial}
          className="p-1 rounded transition-colors cursor-pointer border-none bg-transparent"
          title="Clear output"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-border)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Trash2 size={13} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      {/* Terminal output */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs leading-5 min-h-0"
        style={{
          background: '#1E1E1E',
          color: '#D4D4D4',
        }}
      >
        {serialOutput.length === 0 ? (
          <span style={{ color: '#666' }}>
            Serial Monitor — waiting for output...
          </span>
        ) : (
          serialOutput.map((line, i) => (
            <div key={i}>
              <span style={{ color: '#666', marginRight: '8px' }}>
                [{String(i + 1).padStart(3, '0')}]
              </span>
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
