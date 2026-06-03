import { useCallback, useRef } from 'react'

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical'
  onDrag: (delta: number) => void
  onDragEnd?: () => void
}

export default function ResizeHandle({ direction, onDrag, onDragEnd }: ResizeHandleProps) {
  const draggingRef = useRef(false)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingRef.current) return
      const delta = direction === 'vertical' ? e.movementX : e.movementY
      onDrag(delta)
    },
    [direction, onDrag],
  )

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    onDragEnd?.()
  }, [handleMouseMove, onDragEnd])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      draggingRef.current = true
      document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [direction, handleMouseMove, handleMouseUp],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!draggingRef.current || !lastTouchRef.current) return
      const touch = e.touches[0]
      const delta =
        direction === 'vertical'
          ? touch.clientX - lastTouchRef.current.x
          : touch.clientY - lastTouchRef.current.y
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
      onDrag(delta)
    },
    [direction, onDrag],
  )

  const handleTouchEnd = useCallback(() => {
    draggingRef.current = false
    lastTouchRef.current = null
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    onDragEnd?.()
  }, [handleTouchMove, onDragEnd])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      draggingRef.current = true
      const touch = e.touches[0]
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    },
    [handleTouchMove, handleTouchEnd],
  )

  const isVertical = direction === 'vertical'

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        width: isVertical ? 5 : '100%',
        height: isVertical ? '100%' : 5,
        background: 'var(--color-surface)',
        cursor: isVertical ? 'col-resize' : 'row-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 5,
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-blue)'
      }}
      onMouseLeave={(e) => {
        if (!draggingRef.current) {
          e.currentTarget.style.background = 'var(--color-surface)'
        }
      }}
    >
      {/* Grip indicator */}
      <div
        style={{
          width: isVertical ? 2 : 24,
          height: isVertical ? 24 : 2,
          borderRadius: 1,
          background: 'var(--color-border)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
