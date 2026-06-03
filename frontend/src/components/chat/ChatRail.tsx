import { ChevronLeft, Sparkles } from 'lucide-react'

interface ChatRailProps {
  onExpand: () => void
}

export default function ChatRail({ onExpand }: ChatRailProps) {
  return (
    <div
      className="chat-rail"
      onClick={onExpand}
      title="展開 AI Chat"
      style={{
        width: 46,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderLeft: '1px solid var(--qp-border)',
        background: 'var(--qp-navy-800)',
        cursor: 'pointer',
        transition: 'background var(--qp-dur-fast) var(--qp-ease)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--qp-navy-700)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--qp-navy-800)'
      }}
    >
      {/* Gradient icon */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'var(--qp-grad-cta)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--qp-shadow-sm)',
        }}
      >
        <Sparkles size={17} color="#fff" />
      </div>

      {/* Vertical label */}
      <div
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '4px',
          color: 'var(--qp-text-dim)',
          marginBottom: 'auto',
        }}
      >
        AI 助手
      </div>

      {/* Chevron */}
      <ChevronLeft size={15} color="var(--qp-text-dim)" />
    </div>
  )
}
