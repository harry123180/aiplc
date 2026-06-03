import { useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'

function getLineColor(line: string): string {
  const lower = line.toLowerCase()
  if (lower.includes('error')) return '#EF4444'
  if (lower.includes('warning') || lower.includes('warn')) return '#F59E0B'
  if (lower.includes('success') || line.includes('✓') || lower.includes('ok')) return '#34A853'
  return '#D4D4D4'
}

export default function CompilationConsole() {
  const { compilationOutput, clearCompilation } = useAppStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [compilationOutput])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 12,
          paddingRight: 12,
          height: 32,
          flexShrink: 0,
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
          }}
        >
          Compilation Output
        </span>
        <button
          onClick={clearCompilation}
          title="Clear output"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            border: 'none',
            background: 'transparent',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
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
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 8,
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          fontSize: 12,
          lineHeight: '20px',
          minHeight: 0,
          background: '#1E1E1E',
          color: '#D4D4D4',
        }}
      >
        {compilationOutput.length === 0 ? (
          <span style={{ color: '#666' }}>
            Compilation Console — waiting for build output...
          </span>
        ) : (
          compilationOutput.map((line, i) => (
            <div key={i} style={{ color: getLineColor(line) }}>
              <span style={{ color: '#666', marginRight: 8 }}>
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
