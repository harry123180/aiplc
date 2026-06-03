import { create } from 'zustand'

export interface CanvasCommand {
  description: string
  undo: () => void
  redo: () => void
}

const MAX_UNDO_STACK = 50

export type MessageRole = 'user' | 'assistant' | 'tool'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  toolName?: string
  toolCallId?: string
  isCollapsed?: boolean
  timestamp: number
}

export interface CanvasComponent {
  id: string
  type: string  // 'plc-cpu-f405', 'button-no', 'button-nc', 'indicator-light', 'relay', 'motor-3phase', 'emergency-stop'
  x: number
  y: number
  properties?: Record<string, unknown>
}

export interface CanvasWire {
  id: string
  fromComponent: string
  fromPin: string
  toComponent: string
  toPin: string
  waypoints?: Array<{ x: number; y: number }>
  color?: string
}

export interface McpSettings {
  serverUrl: string
  apiKey: string
}

// DRC types
export type DrcSeverity = 'error' | 'warning'

export interface DrcIssue {
  severity: DrcSeverity
  code: string               // e.g. 'OUTPUT_SHORT', 'MISSING_POWER'
  message: string            // human-readable Chinese
  componentIds?: string[]    // affected component IDs
  wireIds?: string[]         // affected wire IDs
}

export interface DrcResult {
  passed: boolean            // true if zero errors (warnings OK)
  issues: DrcIssue[]
  timestamp: number
}

export type ViewMode = 'code' | 'split' | 'circuit'
export type Density = 'compact' | 'regular' | 'comfy'

interface AppState {
  // View mode (segmented control)
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  // UI density
  density: Density
  setDensity: (density: Density) => void

  // Editor
  code: string
  setCode: (code: string) => void

  // Chat
  messages: ChatMessage[]
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  toggleMessageCollapse: (id: string) => void
  clearMessages: () => void

  // Canvas
  components: CanvasComponent[]
  setComponents: (components: CanvasComponent[]) => void
  addCanvasComponent: (comp: CanvasComponent) => void
  removeCanvasComponent: (id: string) => void
  updateComponentPosition: (id: string, x: number, y: number) => void
  rotateComponent: (id: string) => void
  wires: CanvasWire[]
  setWires: (wires: CanvasWire[]) => void
  addCanvasWire: (wire: CanvasWire) => void
  removeCanvasWire: (id: string) => void
  addWireWaypoint: (wireId: string, index: number, point: { x: number; y: number }) => void
  updateWireWaypoint: (wireId: string, index: number, point: { x: number; y: number }) => void
  removeWireWaypoint: (wireId: string, index: number) => void

  // MCP Settings
  mcpSettings: McpSettings
  setMcpSettings: (settings: McpSettings) => void
  isMcpModalOpen: boolean
  setMcpModalOpen: (open: boolean) => void

  // Streaming
  isStreaming: boolean
  setStreaming: (v: boolean) => void
  updateLastAssistantMessage: (content: string) => void

  // Simulation
  isSimulating: boolean
  setIsSimulating: (simulating: boolean) => void

  // Serial Monitor
  serialOutput: string[]
  addSerialLine: (line: string) => void
  clearSerial: () => void

  // Panel layout (legacy — kept for compatibility)
  leftPanelWidth: number           // percentage (20-80), default 50
  setLeftPanelWidth: (w: number) => void

  leftBottomPanelHeight: number    // px, default 150
  setLeftBottomPanelHeight: (h: number) => void

  rightBottomPanelHeight: number   // px, default 150
  setRightBottomPanelHeight: (h: number) => void

  leftBottomTab: 'console' | 'errors'    // default 'console'
  setLeftBottomTab: (tab: 'console' | 'errors') => void

  rightBottomTab: 'serial'               // default 'serial' (future: 'oscilloscope')
  setRightBottomTab: (tab: 'serial') => void

  // Unified bottom dock
  bottomDockOpen: boolean                 // default false
  setBottomDockOpen: (open: boolean) => void
  bottomDockTab: 'console' | 'errors' | 'serial'  // default 'console'
  setBottomDockTab: (tab: 'console' | 'errors' | 'serial') => void
  bottomDockHeight: number               // px, default 200
  setBottomDockHeight: (h: number) => void

  // Split view percentage
  codeSplitPercent: number               // default 48
  setCodeSplitPercent: (pct: number) => void

  // Side panel collapse states
  wsExplorerCollapsed: boolean           // default false
  setWsExplorerCollapsed: (v: boolean) => void
  compLibraryCollapsed: boolean          // default false
  setCompLibraryCollapsed: (v: boolean) => void

  // AI Chat drawer
  isChatOpen: boolean              // default true
  setChatOpen: (open: boolean) => void

  // Compilation Console
  compilationOutput: string[]
  addCompilationLine: (line: string) => void
  clearCompilation: () => void

  // DRC
  drcResults: DrcResult | null
  setDrcResults: (results: DrcResult | null) => void
  isDrcModalOpen: boolean
  setDrcModalOpen: (open: boolean) => void

  // Canvas highlighting for DRC
  highlightedComponentIds: string[]
  highlightedWireIds: string[]
  setHighlights: (compIds: string[], wireIds: string[]) => void
  clearHighlights: () => void

  // Undo / Redo
  undoStack: CanvasCommand[]
  redoStack: CanvasCommand[]
  pushCommand: (cmd: CanvasCommand) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Component properties
  updateComponentProperties: (id: string, properties: Record<string, unknown>) => void

  // Recordable canvas actions (push to undo stack automatically)
  recordAddComponent: (comp: CanvasComponent) => void
  recordRemoveComponent: (id: string) => void
  recordAddWire: (wire: CanvasWire) => void
  recordMoveComponent: (id: string, fromX: number, fromY: number, toX: number, toY: number) => void
  recordRotateComponent: (id: string) => void
}

let messageIdCounter = 0

const useAppStore = create<AppState>((set) => ({
  // View mode
  viewMode: 'split' as ViewMode,
  setViewMode: (viewMode) => set({ viewMode }),

  // UI density
  density: 'regular' as Density,
  setDensity: (density) => set({ density }),

  // Editor
  code: `#include "aiplc.h"

// PLC 初始化（開機執行一次）
void PLC_Init() {
    Serial_Print("AIPLC Ready\\n");
}

// PLC 掃描週期（每 ~10ms 執行一次）
void PLC_Scan() {
    // 讀取輸入
    bool start = DI_Read(0);
    bool stop  = DI_Read(1);

    // 控制邏輯
    static bool running = false;
    if (stop)  running = false;
    if (start) running = true;

    // 寫入輸出
    DO_Write(0, running);  // 接觸器
    DO_Write(1, running);  // 運轉指示燈
}`,
  setCode: (code) => set({ code }),

  // Chat
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${++messageIdCounter}`,
          timestamp: Date.now(),
        },
      ],
    })),
  toggleMessageCollapse: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isCollapsed: !m.isCollapsed } : m
      ),
    })),
  clearMessages: () => set({ messages: [] }),

  // Canvas
  components: [],
  setComponents: (components) => set({ components }),
  addCanvasComponent: (comp) =>
    set((state) => ({ components: [...state.components, comp] })),
  removeCanvasComponent: (id) =>
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      wires: state.wires.filter(
        (w) => w.fromComponent !== id && w.toComponent !== id
      ),
    })),
  updateComponentPosition: (id, x, y) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, x, y } : c
      ),
    })),
  rotateComponent: (id) =>
    set((state) => ({
      components: state.components.map((c) => {
        if (c.id !== id) return c
        const currentRotation = ((c.properties?.rotation as number) || 0)
        const newRotation = (currentRotation + 90) % 360
        return { ...c, properties: { ...c.properties, rotation: newRotation } }
      }),
    })),
  wires: [],
  setWires: (wires) => set({ wires }),
  addCanvasWire: (wire) =>
    set((state) => ({ wires: [...state.wires, wire] })),
  removeCanvasWire: (id) =>
    set((state) => ({ wires: state.wires.filter((w) => w.id !== id) })),
  addWireWaypoint: (wireId, index, point) =>
    set((state) => ({
      wires: state.wires.map((w) => {
        if (w.id !== wireId) return w
        const wps = [...(w.waypoints || [])]
        wps.splice(index, 0, point)
        return { ...w, waypoints: wps }
      }),
    })),
  updateWireWaypoint: (wireId, index, point) =>
    set((state) => ({
      wires: state.wires.map((w) => {
        if (w.id !== wireId) return w
        const wps = [...(w.waypoints || [])]
        wps[index] = point
        return { ...w, waypoints: wps }
      }),
    })),
  removeWireWaypoint: (wireId, index) =>
    set((state) => ({
      wires: state.wires.map((w) => {
        if (w.id !== wireId) return w
        const wps = [...(w.waypoints || [])]
        wps.splice(index, 1)
        return { ...w, waypoints: wps.length > 0 ? wps : undefined }
      }),
    })),

  // Component properties
  updateComponentProperties: (id, properties) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, properties: { ...c.properties, ...properties } } : c
      ),
    })),

  // MCP Settings
  mcpSettings: { serverUrl: 'http://localhost:3000', apiKey: '' },
  setMcpSettings: (mcpSettings) => set({ mcpSettings }),
  isMcpModalOpen: false,
  setMcpModalOpen: (isMcpModalOpen) => set({ isMcpModalOpen }),

  // Streaming
  isStreaming: false,
  setStreaming: (isStreaming) => set({ isStreaming }),
  updateLastAssistantMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content: msgs[i].content + content }
          break
        }
      }
      return { messages: msgs }
    }),

  // Simulation
  isSimulating: false,
  setIsSimulating: (isSimulating) => {
    if (isSimulating) {
      set({
        isSimulating,
        viewMode: 'circuit' as ViewMode,
        bottomDockOpen: true,
        bottomDockTab: 'serial' as const,
      })
    } else {
      set({ isSimulating })
    }
  },

  // Serial Monitor
  serialOutput: [],
  addSerialLine: (line) =>
    set((state) => ({ serialOutput: [...state.serialOutput, line] })),
  clearSerial: () => set({ serialOutput: [] }),

  // Panel layout
  leftPanelWidth: 50,
  setLeftPanelWidth: (leftPanelWidth) => set({ leftPanelWidth }),

  leftBottomPanelHeight: 150,
  setLeftBottomPanelHeight: (leftBottomPanelHeight) => set({ leftBottomPanelHeight }),

  rightBottomPanelHeight: 150,
  setRightBottomPanelHeight: (rightBottomPanelHeight) => set({ rightBottomPanelHeight }),

  leftBottomTab: 'console',
  setLeftBottomTab: (leftBottomTab) => set({ leftBottomTab }),

  rightBottomTab: 'serial',
  setRightBottomTab: (rightBottomTab) => set({ rightBottomTab }),

  // Unified bottom dock
  bottomDockOpen: false,
  setBottomDockOpen: (bottomDockOpen) => set({ bottomDockOpen }),
  bottomDockTab: 'console',
  setBottomDockTab: (bottomDockTab) => set({ bottomDockTab }),
  bottomDockHeight: 200,
  setBottomDockHeight: (bottomDockHeight) => set({ bottomDockHeight }),

  // Split view percentage
  codeSplitPercent: 48,
  setCodeSplitPercent: (codeSplitPercent) => set({ codeSplitPercent }),

  // Side panel collapse states
  wsExplorerCollapsed: false,
  setWsExplorerCollapsed: (wsExplorerCollapsed) => set({ wsExplorerCollapsed }),
  compLibraryCollapsed: false,
  setCompLibraryCollapsed: (compLibraryCollapsed) => set({ compLibraryCollapsed }),

  // AI Chat drawer
  isChatOpen: true,
  setChatOpen: (isChatOpen) => set({ isChatOpen }),

  // Compilation Console
  compilationOutput: [],
  addCompilationLine: (line) =>
    set((state) => ({ compilationOutput: [...state.compilationOutput, line] })),
  clearCompilation: () => set({ compilationOutput: [] }),

  // DRC
  drcResults: null,
  setDrcResults: (drcResults) => set({ drcResults }),
  isDrcModalOpen: false,
  setDrcModalOpen: (isDrcModalOpen) => set({ isDrcModalOpen }),

  // Canvas highlighting for DRC
  highlightedComponentIds: [],
  highlightedWireIds: [],
  setHighlights: (highlightedComponentIds, highlightedWireIds) =>
    set({ highlightedComponentIds, highlightedWireIds }),
  clearHighlights: () =>
    set({ highlightedComponentIds: [], highlightedWireIds: [] }),

  // Undo / Redo
  undoStack: [],
  redoStack: [],
  pushCommand: (cmd) =>
    set((state) => ({
      undoStack: [...state.undoStack, cmd].slice(-MAX_UNDO_STACK),
      redoStack: [],
    })),
  undo: () => {
    const { undoStack } = useAppStore.getState()
    if (undoStack.length === 0) return
    const cmd = undoStack[undoStack.length - 1]
    cmd.undo()
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, cmd],
    }))
  },
  redo: () => {
    const { redoStack } = useAppStore.getState()
    if (redoStack.length === 0) return
    const cmd = redoStack[redoStack.length - 1]
    cmd.redo()
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, cmd],
    }))
  },
  canUndo: (): boolean => useAppStore.getState().undoStack.length > 0,
  canRedo: (): boolean => useAppStore.getState().redoStack.length > 0,

  // Recordable canvas actions
  recordAddComponent: (comp) => {
    const { addCanvasComponent, pushCommand, removeCanvasComponent } = useAppStore.getState()
    addCanvasComponent(comp)
    pushCommand({
      description: `Add ${comp.type}`,
      undo: () => removeCanvasComponent(comp.id),
      redo: () => addCanvasComponent(comp),
    })
  },
  recordRemoveComponent: (id) => {
    const { components, wires, removeCanvasComponent, pushCommand, addCanvasComponent, addCanvasWire } = useAppStore.getState()
    const comp = components.find((c) => c.id === id)
    const connectedWires = wires.filter((w) => w.fromComponent === id || w.toComponent === id)
    removeCanvasComponent(id)
    pushCommand({
      description: `Remove ${comp?.type}`,
      undo: () => {
        if (comp) addCanvasComponent(comp)
        connectedWires.forEach((w) => addCanvasWire(w))
      },
      redo: () => removeCanvasComponent(id),
    })
  },
  recordAddWire: (wire) => {
    const { addCanvasWire, pushCommand, removeCanvasWire } = useAppStore.getState()
    addCanvasWire(wire)
    pushCommand({
      description: 'Add wire',
      undo: () => removeCanvasWire(wire.id),
      redo: () => addCanvasWire(wire),
    })
  },
  recordMoveComponent: (id, fromX, fromY, toX, toY) => {
    const { pushCommand, updateComponentPosition } = useAppStore.getState()
    pushCommand({
      description: 'Move component',
      undo: () => updateComponentPosition(id, fromX, fromY),
      redo: () => updateComponentPosition(id, toX, toY),
    })
  },
  recordRotateComponent: (id) => {
    const { components, rotateComponent, pushCommand } = useAppStore.getState()
    const comp = components.find((c) => c.id === id)
    if (!comp) return
    const prevRotation = ((comp.properties?.rotation as number) || 0)
    rotateComponent(id)
    const newRotation = (prevRotation + 90) % 360
    const setRotation = (rotation: number) => {
      useAppStore.setState((state) => ({
        components: state.components.map((c) =>
          c.id === id
            ? { ...c, properties: { ...c.properties, rotation } }
            : c
        ),
      }))
    }
    pushCommand({
      description: 'Rotate component',
      undo: () => setRotation(prevRotation),
      redo: () => setRotation(newRotation),
    })
  },
}))

export default useAppStore
