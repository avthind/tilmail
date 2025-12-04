import { create } from 'zustand'

export type DecorationMode = 'front' | 'back'

export interface Decoration {
  type: 'sticker' | 'text' | 'drawing'
  id: string
  x: number
  y: number
  data: any
  rotation?: number
  scale?: number
}

export interface FaceDecorations {
  front: Decoration[]
  back: Decoration[]
}

interface AppState {
  mode: DecorationMode
  decorations: FaceDecorations
  showSendModal: boolean
  currentTool: 'sticker' | 'text' | 'draw' | 'grab' | null
  selectedSticker: string | null
  selectedDecoration: { face: 'front' | 'back', id: string } | null
  drawSettings: {
    color: string
    lineWidth: number
  }
  textSettings: {
    fontFamily: string
    fontSize: number
    color: string
    fontWeight?: string
    textDecoration?: string
  }
  setMode: (mode: DecorationMode) => void
  setTool: (tool: 'sticker' | 'text' | 'draw' | 'grab' | null) => void
  setSelectedSticker: (sticker: string | null) => void
  setSelectedDecoration: (decoration: { face: 'front' | 'back', id: string } | null) => void
  setDrawSettings: (settings: { color: string; lineWidth: number }) => void
  setTextSettings: (settings: { fontFamily: string; fontSize: number; color: string; fontWeight?: string; textDecoration?: string }) => void
  addDecoration: (face: 'front' | 'back', decoration: Decoration) => void
  removeDecoration: (face: 'front' | 'back', id: string) => void
  updateDecoration: (face: 'front' | 'back', id: string, data: any) => void
  updateDecorationPosition: (face: 'front' | 'back', id: string, x: number, y: number) => void
  setShowSendModal: (show: boolean) => void
  reset: () => void
}

const initialDecorations: FaceDecorations = {
  front: [],
  back: [],
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'front',
  decorations: initialDecorations,
  showSendModal: false,
  currentTool: null,
  selectedSticker: null,
  selectedDecoration: null,
  drawSettings: {
    color: '#4A4A4A', // Dark gray
    lineWidth: 4,
  },
  textSettings: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    color: '#000000',
    fontWeight: 'normal',
    textDecoration: 'none',
  },
  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ currentTool: tool }),
  setSelectedSticker: (sticker) => set({ selectedSticker: sticker }),
  setSelectedDecoration: (decoration) => set({ selectedDecoration: decoration }),
  setDrawSettings: (settings) => set({ drawSettings: settings }),
  setTextSettings: (settings) => set({ textSettings: settings }),
  addDecoration: (face, decoration) =>
    set((state) => ({
      decorations: {
        ...state.decorations,
        [face]: [...state.decorations[face], decoration],
      },
    })),
  removeDecoration: (face, id) =>
    set((state) => ({
      decorations: {
        ...state.decorations,
        [face]: state.decorations[face].filter((d) => d.id !== id),
      },
    })),
  updateDecoration: (face, id, data) =>
    set((state) => ({
      decorations: {
        ...state.decorations,
        [face]: state.decorations[face].map((d) =>
          d.id === id ? { ...d, data } : d
        ),
      },
    })),
  updateDecorationPosition: (face, id, x, y) =>
    set((state) => ({
      decorations: {
        ...state.decorations,
        [face]: state.decorations[face].map((d) =>
          d.id === id ? { ...d, x, y } : d
        ),
      },
    })),
  setShowSendModal: (show) => set({ showSendModal: show }),
  reset: () =>
    set({
      decorations: initialDecorations,
      mode: 'front',
      currentTool: null,
      selectedSticker: null,
      selectedDecoration: null,
    }),
}))
