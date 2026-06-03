import { useCallback, useRef } from 'react'
import useChatDockStore from '../../store/useChatDockStore'
import ChatRail from './ChatRail'
import ChatPanel from '../ChatPanel'

interface ChatDockProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatDock({ isOpen, onClose }: ChatDockProps) {
  const { collapsed, setCollapsed, fullscreen, setFullscreen, width, setWidth } =
    useChatDockStore()
  const draggingRef = useRef(false)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingRef.current) return
      // Moving left increases width, moving right decreases
      setWidth(width - e.movementX)
    },
    [width, setWidth],
  )

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [handleMouseMove])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      draggingRef.current = true
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [handleMouseMove, handleMouseUp],
  )

  const handleClose = useCallback(() => {
    setFullscreen(false)
    onClose()
  }, [setFullscreen, onClose])

  const handleToggleFullscreen = useCallback(() => {
    setFullscreen(!fullscreen)
  }, [fullscreen, setFullscreen])

  const handleCollapse = useCallback(() => {
    setCollapsed(true)
  }, [setCollapsed])

  const handleExpand = useCallback(() => {
    setCollapsed(false)
  }, [setCollapsed])

  if (!isOpen) return null

  // Fullscreen mode
  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8000,
          background: 'rgba(10,22,40,0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
        }}
        onClick={(e) => {
          // Close fullscreen when clicking backdrop
          if (e.target === e.currentTarget) setFullscreen(false)
        }}
      >
        <div
          style={{
            width: 'min(960px, 100%)',
            height: '100%',
            borderRadius: 'var(--qp-r-2xl)',
            boxShadow: 'var(--qp-shadow-md)',
            border: '1px solid var(--qp-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--qp-bg)',
          }}
        >
          <ChatPanel
            onClose={handleClose}
            onToggleFullscreen={handleToggleFullscreen}
            onCollapse={undefined}
            fullscreen={true}
          />
        </div>
      </div>
    )
  }

  // Collapsed rail
  if (collapsed) {
    return <ChatRail onExpand={handleExpand} />
  }

  // Normal right-docked panel
  return (
    <>
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: 6,
          cursor: 'col-resize',
          flexShrink: 0,
          background: 'transparent',
          position: 'relative',
          zIndex: 5,
          transition: 'background var(--qp-dur-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(45,107,228,0.25)'
        }}
        onMouseLeave={(e) => {
          if (!draggingRef.current) {
            e.currentTarget.style.background = 'transparent'
          }
        }}
      />
      {/* Chat panel */}
      <div
        style={{
          width,
          flexShrink: 0,
          borderLeft: '1px solid var(--qp-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--qp-bg)',
        }}
      >
        <ChatPanel
          onClose={handleClose}
          onToggleFullscreen={handleToggleFullscreen}
          onCollapse={handleCollapse}
          fullscreen={false}
        />
      </div>
    </>
  )
}
