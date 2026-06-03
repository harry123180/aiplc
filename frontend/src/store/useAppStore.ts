import { create } from 'zustand'

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

interface AppState {
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
  wires: CanvasWire[]
  setWires: (wires: CanvasWire[]) => void
  addCanvasWire: (wire: CanvasWire) => void
  removeCanvasWire: (id: string) => void

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

  // Panel layout
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
}

let messageIdCounter = 0

const useAppStore = create<AppState>((set) => ({
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
  wires: [],
  setWires: (wires) => set({ wires }),
  addCanvasWire: (wire) =>
    set((state) => ({ wires: [...state.wires, wire] })),
  removeCanvasWire: (id) =>
    set((state) => ({ wires: state.wires.filter((w) => w.id !== id) })),

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
  setIsSimulating: (isSimulating) => set({ isSimulating }),

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
}))

export default useAppStore
