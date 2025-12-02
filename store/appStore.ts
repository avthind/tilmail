import { create } from 'zustand'

export type DecorationMode = 'envelope-front' | 'envelope-back' | 'postcard'

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
  postcard: Decoration[]
}

interface AppState {
  mode: DecorationMode
  decorations: FaceDecorations
  isEnvelopeOpen: boolean
  showSendModal: boolean
  currentTool: 'sticker' | 'text' | 'draw' | null
  selectedSticker: string | null
  textSettings: {
    fontFamily: string
    fontSize: number
    color: string
    fontWeight?: string
    textDecoration?: string
  }
  setMode: (mode: DecorationMode) => void
  setTool: (tool: 'sticker' | 'text' | 'draw' | null) => void
  setSelectedSticker: (sticker: string | null) => void
  setTextSettings: (settings: { fontFamily: string; fontSize: number; color: string; fontWeight?: string; textDecoration?: string }) => void
  addDecoration: (face: 'front' | 'back' | 'postcard', decoration: Decoration) => void
  removeDecoration: (face: 'front' | 'back' | 'postcard', id: string) => void
  updateDecoration: (face: 'front' | 'back' | 'postcard', id: string, data: any) => void
  openEnvelope: () => void
  closeEnvelope: () => void
  setShowSendModal: (show: boolean) => void
  reset: () => void
}

const initialDecorations: FaceDecorations = {
  front: [],
  back: [],
  postcard: [],
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'envelope-front',
  decorations: initialDecorations,
  isEnvelopeOpen: false,
  showSendModal: false,
  currentTool: null,
  selectedSticker: null,
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
  openEnvelope: () => set({ isEnvelopeOpen: true }),
  closeEnvelope: () => set({ isEnvelopeOpen: false }),
  setShowSendModal: (show) => set({ showSendModal: show }),
  reset: () =>
    set({
      decorations: initialDecorations,
      mode: 'envelope-front',
      isEnvelopeOpen: false,
      currentTool: null,
      selectedSticker: null,
    }),
}))

