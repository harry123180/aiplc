/* ──────────────────────────────────────────────────────────
   WorkArea — switches between code / split / circuit views.
   - code:    WorkspaceExplorer (expanded) + EditorPanel
   - split:   WorkspaceExplorer (rail)     + EditorPanel + ResizeHandle + CanvasPanel
   - circuit: ComponentLibrary  (expanded) + CanvasPanel
   ────────────────────────────────────────────────────────── */

import { useRef, useEffect, useCallback } from 'react'
import useAppStore from '../../store/useAppStore'
import type { ViewMode } from '../../store/useAppStore'
import EditorPanel from '../EditorPanel'
import CanvasPanel from '../CanvasPanel'
import ResizeHandle from '../ResizeHandle'
import WorkspaceExplorer from '../editor/WorkspaceExplorer'
import ComponentLibrary from '../simulator/ComponentLibrary'

interface WorkAreaProps {
  viewMode: ViewMode
}

export default function WorkArea({ viewMode }: WorkAreaProps) {
  const {
    codeSplitPercent,
    setCodeSplitPercent,
    wsExplorerCollapsed,
    setWsExplorerCollapsed,
    compLibraryCollapsed,
    setCompLibraryCollapsed,
    recordAddComponent,
  } = useAppStore()

  const rowRef = useRef<HTMLDivElement>(null)

  /* Auto-collapse explorer in split mode to save space */
  useEffect(() => {
    if (viewMode === 'split') {
      setWsExplorerCollapsed(true)
    }
  }, [viewMode, setWsExplorerCollapsed])

  /* Split drag handler */
  const handleSplitDrag = useCallback(
    (delta: number) => {
      const w = rowRef.current ? rowRef.current.getBoundingClientRect().width : 1000
      const deltaPct = (delta / w) * 100
      setCodeSplitPercent(Math.max(25, Math.min(75, codeSplitPercent + deltaPct)))
    },
    [codeSplitPercent, setCodeSplitPercent],
  )

  /* Component add handler for ComponentLibrary */
  const handleAddComponent = useCallback(
    (type: string) => {
      const id = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      recordAddComponent({ id, type, x: 300, y: 200 })
    },
    [recordAddComponent],
  )

  /* ── code view ───────────────────────── */
  if (viewMode === 'code') {
    return (
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <WorkspaceExplorer
          collapsed={wsExplorerCollapsed}
          onToggle={() => setWsExplorerCollapsed(!wsExplorerCollapsed)}
        />
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <EditorPanel />
        </div>
      </div>
    )
  }

  /* ── circuit view ────────────────────── */
  if (viewMode === 'circuit') {
    return (
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <ComponentLibrary
          collapsed={compLibraryCollapsed}
          onToggle={() => setCompLibraryCollapsed(!compLibraryCollapsed)}
          onAddComponent={handleAddComponent}
        />
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <CanvasPanel />
        </div>
      </div>
    )
  }

  /* ── split view ──────────────────────── */
  return (
    <div ref={rowRef} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      <WorkspaceExplorer
        collapsed={wsExplorerCollapsed}
        onToggle={() => setWsExplorerCollapsed(!wsExplorerCollapsed)}
      />
      <div style={{ width: `${codeSplitPercent}%`, minWidth: 200, minHeight: 0 }}>
        <EditorPanel />
      </div>
      <ResizeHandle direction="vertical" onDrag={handleSplitDrag} />
      <div style={{ flex: 1, minWidth: 240, minHeight: 0 }}>
        <CanvasPanel />
      </div>
    </div>
  )
}
