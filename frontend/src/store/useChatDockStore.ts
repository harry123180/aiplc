import { create } from 'zustand'

interface ChatDockState {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  fullscreen: boolean
  setFullscreen: (v: boolean) => void
  width: number // default 380, range 300-620
  setWidth: (w: number) => void
}

const useChatDockStore = create<ChatDockState>((set) => ({
  collapsed: false,
  setCollapsed: (collapsed) => set({ collapsed }),
  fullscreen: false,
  setFullscreen: (fullscreen) => set({ fullscreen }),
  width: 380,
  setWidth: (w) => set({ width: Math.max(300, Math.min(620, w)) }),
}))

export default useChatDockStore
