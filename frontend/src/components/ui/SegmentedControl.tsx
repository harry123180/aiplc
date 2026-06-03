import { Code2, Columns2, Cpu } from 'lucide-react'

export type ViewMode = 'code' | 'split' | 'circuit'

interface SegmentedControlProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
  isSimulating: boolean
}

const items: Array<{ id: ViewMode; label: string; icon: typeof Code2 }> = [
  { id: 'code', label: '程式碼', icon: Code2 },
  { id: 'split', label: '並排', icon: Columns2 },
  { id: 'circuit', label: '線路圖', icon: Cpu },
]

export default function SegmentedControl({ view, onChange, isSimulating }: SegmentedControlProps) {
  return (
    <div className="qp-seg">
      {items.map((it) => (
        <button
          key={it.id}
          className={view === it.id ? 'active' : ''}
          onClick={() => onChange(it.id)}
          title={it.label}
        >
          <it.icon size={14} />
          <span className="seg-label">{it.label}</span>
          {isSimulating && it.id === 'circuit' && (
            <span
              className="live-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--qp-accent)',
                display: 'inline-block',
              }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
