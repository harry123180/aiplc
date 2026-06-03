import { useCallback } from 'react'
import ResizeHandle from './ResizeHandle'

interface BottomPanelTab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface BottomPanelProps {
  tabs: BottomPanelTab[]
  activeTab: string
  onTabChange: (id: string) => void
  height: number
  onHeightChange: (newHeight: number) => void
  minHeight?: number
  maxHeight?: number
  children: React.ReactNode
}

export default function BottomPanel({
  tabs,
  activeTab,
  onTabChange,
  height,
  onHeightChange,
  minHeight = 80,
  maxHeight = 400,
  children,
}: BottomPanelProps) {
  const handleDrag = useCallback(
    (delta: number) => {
      // Dragging up (negative delta) should increase height
      const newHeight = Math.min(maxHeight, Math.max(minHeight, height - delta))
      onHeightChange(newHeight)
    },
    [height, onHeightChange, minHeight, maxHeight],
  )

  return (
    <div
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        background: 'var(--color-bg)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      {/* Resize handle */}
      <ResizeHandle direction="horizontal" onDrag={handleDrag} />

      {/* Tab bar */}
      <div
        style={{
          height: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          paddingLeft: 8,
          paddingRight: 8,
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0 12px',
                height: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                borderBottom: isActive ? '2px solid var(--color-blue)' : '2px solid transparent',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {tab.icon && (
                <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
              )}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}
