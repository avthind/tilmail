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

interface HistoryState {
  decorations: FaceDecorations
  timestamp: number
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
    smoothing: number // 0-100, 0 = no smoothing, 100 = maximum smoothing
  }
  textSettings: {
    fontFamily: string
    fontSize: number
    color: string
    fontWeight?: string
    textDecoration?: string
  }
  // Undo/Redo
  history: HistoryState[]
  historyIndex: number
  clipboard: Decoration | null
  setMode: (mode: DecorationMode) => void
  setTool: (tool: 'sticker' | 'text' | 'draw' | 'grab' | null) => void
  setSelectedSticker: (sticker: string | null) => void
  setSelectedDecoration: (decoration: { face: 'front' | 'back', id: string } | null) => void
  setDrawSettings: (settings: { color: string; lineWidth: number; smoothing?: number }) => void
  setTextSettings: (settings: { fontFamily: string; fontSize: number; color: string; fontWeight?: string; textDecoration?: string }) => void
  addDecoration: (face: 'front' | 'back', decoration: Decoration) => void
  removeDecoration: (face: 'front' | 'back', id: string) => void
  updateDecoration: (face: 'front' | 'back', id: string, data: any) => void
  updateDecorationWithoutHistory: (face: 'front' | 'back', id: string, data: any) => void
  updateDecorationPosition: (face: 'front' | 'back', id: string, x: number, y: number) => void
  updateDecorationScale: (face: 'front' | 'back', id: string, scale: number) => void
  updateDecorationRotation: (face: 'front' | 'back', id: string, rotation: number) => void
  saveDecorationPositionToHistory: (face: 'front' | 'back', id: string) => void
  setShowSendModal: (show: boolean) => void
  // History management
  addToHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  // Clipboard
  copyDecoration: () => void
  pasteDecoration: () => void
  duplicateDecoration: () => void
  reset: () => void
}

const initialDecorations: FaceDecorations = {
  front: [],
  back: [],
}

const MAX_HISTORY = 50 // Limit history size

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'front',
  decorations: initialDecorations,
  showSendModal: false,
  currentTool: null,
  selectedSticker: null,
  selectedDecoration: null,
  drawSettings: {
    color: '#4A4A4A', // Dark gray
    lineWidth: 4,
    smoothing: 50, // Default medium smoothing
  },
  textSettings: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    color: '#4A4A4A', // Dark gray - matches first color in TextTool COLORS array
    fontWeight: 'normal',
    textDecoration: 'none',
  },
  history: [{ decorations: initialDecorations, timestamp: Date.now() }],
  historyIndex: 0,
  clipboard: null,
  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ currentTool: tool }),
  setSelectedSticker: (sticker) => set({ selectedSticker: sticker }),
  setSelectedDecoration: (decoration) => set({ selectedDecoration: decoration }),
  setDrawSettings: (settings) => set((state) => ({ 
    drawSettings: { ...state.drawSettings, ...settings }
  })),
  setTextSettings: (settings) => set({ textSettings: settings }),
  addDecoration: (face, decoration) => {
    const state = get()
    // Add the decoration first
    const newDecorations = {
        ...state.decorations,
        [face]: [...state.decorations[face], decoration],
    }
    
    // Save the NEW state (with decoration) to history
    // History index should point to the state AFTER the change
    const historyState: HistoryState = {
      decorations: JSON.parse(JSON.stringify(newDecorations)),
      timestamp: Date.now(),
    }
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(historyState)
    const limitedHistory = newHistory.slice(-MAX_HISTORY)
    
    set({
      decorations: newDecorations,
      history: limitedHistory,
      // History index points to the state AFTER the change
      // When undoing, we go to history[historyIndex - 1], which is the state before the change
      historyIndex: limitedHistory.length - 1,
    })
  },
  removeDecoration: (face, id) => {
    const state = get()
    // Save current state to history before change
    const historyState: HistoryState = {
      decorations: JSON.parse(JSON.stringify(state.decorations)),
      timestamp: Date.now(),
    }
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(historyState)
    const limitedHistory = newHistory.slice(-MAX_HISTORY)
    
    set({
      decorations: {
        ...state.decorations,
        [face]: state.decorations[face].filter((d) => d.id !== id),
      },
      history: limitedHistory,
      historyIndex: limitedHistory.length - 1,
    })
  },
  updateDecoration: (face, id, data) => {
    const state = get()
    // Save current state to history before change
    const historyState: HistoryState = {
      decorations: JSON.parse(JSON.stringify(state.decorations)),
      timestamp: Date.now(),
    }
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(historyState)
    const limitedHistory = newHistory.slice(-MAX_HISTORY)
    
    set({
      decorations: {
        ...state.decorations,
        [face]: state.decorations[face].map((d) =>
          d.id === id ? { ...d, data } : d
        ),
      },
      history: limitedHistory,
      historyIndex: limitedHistory.length - 1,
    })
  },
  updateDecorationWithoutHistory: (face, id, data) => {
    // Update decoration without saving to history (for real-time updates like typing)
    set((state) => ({
      decorations: {
        ...state.decorations,
        [face]: state.decorations[face].map((d) =>
          d.id === id ? { ...d, data } : d
        ),
      },
    }))
  },
  updateDecorationPosition: (face, id, x, y) => {
    set((state) => ({
      decorations: {
        ...state.decorations,
        [face]: state.decorations[face].map((d) =>
          d.id === id ? { ...d, x, y } : d
        ),
      },
    }))
    // Note: Position updates don't add to history (too frequent during drag)
    // Use saveDecorationPositionToHistory() when drag ends
  },
  updateDecorationScale: (face, id, scale) => {
    set((state) => ({
      decorations: {
        ...state.decorations,
        [face]: state.decorations[face].map((d) =>
          d.id === id ? { ...d, scale } : d
        ),
      },
    }))
  },
  updateDecorationRotation: (face, id, rotation) => {
    set((state) => ({
      decorations: {
        ...state.decorations,
        [face]: state.decorations[face].map((d) =>
          d.id === id ? { ...d, rotation } : d
        ),
      },
    }))
  },
  saveDecorationPositionToHistory: (face, id) => {
    // Save current state to history after position change (when drag ends)
    const state = get()
    const decoration = state.decorations[face].find((d) => d.id === id)
    if (!decoration) return
    
    // Save current state to history
    const historyState: HistoryState = {
      decorations: JSON.parse(JSON.stringify(state.decorations)),
      timestamp: Date.now(),
    }
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(historyState)
    const limitedHistory = newHistory.slice(-MAX_HISTORY)
    
    // Only update history and historyIndex, preserve all other state including decorations
    set((currentState) => ({
      ...currentState, // Preserve all existing state (decorations, mode, etc.)
      history: limitedHistory,
      historyIndex: limitedHistory.length - 1,
    }))
  },
  setShowSendModal: (show) => set({ showSendModal: show }),
  addToHistory: () => {
    const state = get()
    const currentState: HistoryState = {
      decorations: JSON.parse(JSON.stringify(state.decorations)), // Deep copy
      timestamp: Date.now(),
    }
    
    // Remove any history after current index (when undoing then making new change)
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(currentState)
    
    // Limit history size
    const limitedHistory = newHistory.slice(-MAX_HISTORY)
    
    set({
      history: limitedHistory,
      historyIndex: limitedHistory.length - 1,
    })
  },
  undo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      // Find the previous state with real content (skip placeholder-only states)
      let newIndex = state.historyIndex - 1
      let previousState = state.history[newIndex]
      
      // Skip states that only contain placeholder text (to avoid empty clicks)
      while (newIndex > 0) {
        const hasRealContent = 
          previousState.decorations.front.some(d => !(d.type === 'text' && d.data.text === 'Your text…')) ||
          previousState.decorations.back.some(d => !(d.type === 'text' && d.data.text === 'Your text…'))
        
        if (hasRealContent) {
          break
        }
        
        // Skip to previous state
        newIndex--
        if (newIndex >= 0) {
          previousState = state.history[newIndex]
        } else {
          break
        }
      }
      
      // Filter out placeholder text when restoring from history
      const filteredDecorations: FaceDecorations = {
        front: previousState.decorations.front.filter(
          (d) => !(d.type === 'text' && d.data.text === 'Your text…')
        ),
        back: previousState.decorations.back.filter(
          (d) => !(d.type === 'text' && d.data.text === 'Your text…')
        ),
      }
      
      set({
        decorations: JSON.parse(JSON.stringify(filteredDecorations)),
        historyIndex: newIndex,
        selectedDecoration: null, // Deselect on undo
      })
    }
  },
  redo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      // Find the next state with real content (skip placeholder-only states)
      let newIndex = state.historyIndex + 1
      let nextState = state.history[newIndex]
      
      // Skip states that only contain placeholder text (to avoid empty clicks)
      while (newIndex < state.history.length - 1) {
        const hasRealContent = 
          nextState.decorations.front.some(d => !(d.type === 'text' && d.data.text === 'Your text…')) ||
          nextState.decorations.back.some(d => !(d.type === 'text' && d.data.text === 'Your text…'))
        
        if (hasRealContent) {
          break
        }
        
        // Skip to next state
        newIndex++
        if (newIndex < state.history.length) {
          nextState = state.history[newIndex]
        } else {
          break
        }
      }
      
      // Filter out placeholder text when restoring from history
      const filteredDecorations: FaceDecorations = {
        front: nextState.decorations.front.filter(
          (d) => !(d.type === 'text' && d.data.text === 'Your text…')
        ),
        back: nextState.decorations.back.filter(
          (d) => !(d.type === 'text' && d.data.text === 'Your text…')
        ),
      }
      
      set({
        decorations: JSON.parse(JSON.stringify(filteredDecorations)),
        historyIndex: newIndex,
        selectedDecoration: null, // Deselect on redo
      })
    }
  },
  canUndo: () => {
    const state = get()
    return state.historyIndex > 0
  },
  canRedo: () => {
    const state = get()
    return state.historyIndex < state.history.length - 1
  },
  copyDecoration: () => {
    const state = get()
    if (state.selectedDecoration) {
      const decoration = state.decorations[state.selectedDecoration.face].find(
        (d) => d.id === state.selectedDecoration!.id
      )
      if (decoration) {
        set({ clipboard: JSON.parse(JSON.stringify(decoration)) })
      }
    }
  },
  pasteDecoration: () => {
    const state = get()
    if (state.clipboard) {
      const newDecoration: Decoration = {
        ...state.clipboard,
        id: `${state.clipboard.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: state.clipboard.x + 20, // Offset slightly
        y: state.clipboard.y + 20,
      }
      get().addDecoration(state.mode, newDecoration)
      set({ selectedDecoration: { face: state.mode, id: newDecoration.id } })
    }
  },
  duplicateDecoration: () => {
    const state = get()
    if (state.selectedDecoration) {
      const decoration = state.decorations[state.selectedDecoration.face].find(
        (d) => d.id === state.selectedDecoration!.id
      )
      if (decoration) {
        const newDecoration: Decoration = {
          ...decoration,
          id: `${decoration.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: decoration.x + 20,
          y: decoration.y + 20,
        }
        get().addDecoration(state.selectedDecoration.face, newDecoration)
        set({ selectedDecoration: { face: state.selectedDecoration.face, id: newDecoration.id } })
      }
    }
  },
  reset: () =>
    set({
      decorations: initialDecorations,
      mode: 'front',
      currentTool: null,
      selectedSticker: null,
      selectedDecoration: null,
      history: [{ decorations: initialDecorations, timestamp: Date.now() }],
      historyIndex: 0,
      clipboard: null,
    }),
}))
