import { X } from 'lucide-react'
import ChatPanel from './ChatPanel'

interface AIChatDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIChatDrawer({ isOpen, onClose }: AIChatDrawerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 380,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.2s ease-out',
        background: 'var(--color-bg)',
        borderLeft: '1px solid var(--color-border)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 40,
          paddingLeft: 16,
          paddingRight: 8,
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          AI Chat
        </span>
        <button
          onClick={onClose}
          title="Close AI Chat"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            border: 'none',
            background: 'transparent',
            borderRadius: 6,
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
          <X size={16} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      {/* Body — renders the existing ChatPanel */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ChatPanel />
      </div>
    </div>
  )
}
