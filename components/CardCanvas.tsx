'use client'

import { useRef, useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { getStickerData } from './StickerPicker'
import styles from './CardCanvas.module.css'

// Card dimensions matching the 3D postcard
const CARD_WIDTH = 480 // pixels
const CARD_HEIGHT = 320 // pixels (2.4:1.6 ratio)
const CARD_BACKGROUND_COLOR = '#F5E6D3' // Card background color (light beige)

interface CardCanvasProps {
  readOnly?: boolean
}

export default function CardCanvas({ readOnly = false }: CardCanvasProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const {
    mode,
    currentTool,
    selectedSticker,
    decorations,
    selectedDecoration,
    setSelectedDecoration,
    removeDecoration,
    addDecoration,
    textSettings,
    updateDecoration,
    updateDecorationWithoutHistory,
    updateDecorationPosition,
    saveDecorationPositionToHistory,
    addToHistory,
    drawSettings,
  } = useAppStore()
  
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragOriginalDecoration, setDragOriginalDecoration] = useState<any>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingTextValue, setEditingTextValue] = useState('')
  const [isFlipping, setIsFlipping] = useState(false)
  const [displayMode, setDisplayMode] = useState(mode) // Mode to display (may lag behind actual mode during flip)
  const [hoveredDecoration, setHoveredDecoration] = useState<{ face: 'front' | 'back', id: string } | null>(null)
  const lastTapRef = useRef<{ timestamp: number; x: number; y: number } | null>(null)
  const justFinishedDrawingRef = useRef(false) // Track if we just finished drawing to skip redraw
  const previousModeRef = useRef(mode)

  // Trigger flip animation when mode changes
  useEffect(() => {
    if (previousModeRef.current !== mode) {
      // Start flip - keep showing old side, hide decorations
      setIsFlipping(true)
      // Don't update displayMode yet - keep showing old side
      const timer = setTimeout(() => {
        // After flip completes, switch to new side and show decorations
        setIsFlipping(false)
        setDisplayMode(mode)
      }, 600) // Match animation duration
      previousModeRef.current = mode
      return () => clearTimeout(timer)
    }
  }, [mode])

  // Update displayMode when not flipping (sync with actual mode)
  useEffect(() => {
    if (!isFlipping) {
      setDisplayMode(mode)
    }
  }, [mode, isFlipping])

  // Save and clear editing state when switching away from text tool
  useEffect(() => {
    if (currentTool !== 'text') {
      // Handle text that was being edited
      if (editingTextId) {
        // Save the text before clearing edit mode
        const decoration = decorations.front.find(d => d.id === editingTextId && d.type === 'text') ||
                           decorations.back.find(d => d.id === editingTextId && d.type === 'text')
        if (decoration) {
          const face = decorations.front.find(d => d.id === editingTextId) ? 'front' : 'back'
          // Use editingTextValue if it exists, otherwise use the decoration's current text
          const textToSave = editingTextValue || decoration.data.text || ''
          
          // If text is still placeholder or empty, remove it (user didn't actually add content)
          if (textToSave === 'Your text…' || textToSave.trim() === '') {
            removeDecoration(face, editingTextId)
          } else {
            updateDecoration(face, editingTextId, {
              ...decoration.data,
              text: textToSave,
            })
          }
        }
        setEditingTextId(null)
        setEditingTextValue('')
      }
      
      // Check ALL text decorations for placeholder text that should be removed
      // Check both faces to catch placeholder text on either side
      // Use a snapshot of decorations at the time of tool switch
      const decorationsSnapshot = { ...decorations }
      const editingTextIdSnapshot = editingTextId
      
      ;(['front', 'back'] as const).forEach((face) => {
        const faceDecorations = decorationsSnapshot[face] || []
        
        // Collect IDs of placeholder text to remove (don't modify while iterating)
        const placeholderTextIds: string[] = []
        faceDecorations.forEach((decoration) => {
          if (decoration.type === 'text' && 
              decoration.data.text === 'Your text…' && 
              decoration.id !== editingTextIdSnapshot) {
            // Mark for removal
            placeholderTextIds.push(decoration.id)
          }
        })
        
        // Remove all placeholder text decorations
        placeholderTextIds.forEach((id) => {
          removeDecoration(face, id)
        })
      })
    }
  }, [currentTool, editingTextId, editingTextValue, decorations, updateDecoration, removeDecoration])
  
  // Note: Placeholder text cleanup is handled in the tool switch effect above
  // We don't clean up after undo/redo to avoid creating history loops
  
  // Force canvas redraw when currentTool changes to ensure borders update
  useEffect(() => {
    // Trigger a redraw by updating a ref or forcing a state change
    // The draw function already has currentTool in dependencies, but this ensures immediate update
    if (canvasRef.current) {
      // Force a redraw by accessing the canvas
      const canvas = canvasRef.current
      // This will trigger the draw function through the useEffect that watches decorations/currentTool
    }
  }, [currentTool])

  // Update canvas size on window resize to respect responsive CSS
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const container = canvas.parentElement
      const containerRect = container?.getBoundingClientRect()
      const displayWidth = containerRect?.width || CARD_WIDTH
      const displayHeight = containerRect?.height || CARD_HEIGHT
      
      // Update CSS size to match container
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
    }

    // Initial size update after a brief delay to ensure CSS has applied
    const timeoutId = setTimeout(handleResize, 100)
    
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // ESC to deselect
      if (e.key === 'Escape') {
        setSelectedDecoration(null)
        setEditingTextId(null)
        return
      }
      
      // Arrow key nudging (only when decoration is selected and not editing text)
      if (selectedDecoration && !editingTextId && currentTool === 'grab') {
        const isArrowKey = e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight'
        if (isArrowKey) {
          e.preventDefault()
          
          const nudgeAmount = e.shiftKey ? 10 : 1 // Shift = 10px, normal = 1px
          let deltaX = 0
          let deltaY = 0
          
          if (e.key === 'ArrowUp') deltaY = -nudgeAmount
          else if (e.key === 'ArrowDown') deltaY = nudgeAmount
          else if (e.key === 'ArrowLeft') deltaX = -nudgeAmount
          else if (e.key === 'ArrowRight') deltaX = nudgeAmount
          
          const decoration = decorations[selectedDecoration.face].find(d => d.id === selectedDecoration.id)
          if (decoration) {
            const newX = decoration.x + deltaX
            const newY = decoration.y + deltaY
            
            if (decoration.type === 'drawing' && decoration.data.paths) {
              // For drawings, update all path points
              const updatedPaths = decoration.data.paths.map((path: number[][]) =>
                path.map((point: number[]) => [point[0] + deltaX, point[1] + deltaY])
              )
              updateDecorationWithoutHistory(selectedDecoration.face, decoration.id, {
                ...decoration.data,
                paths: updatedPaths,
              })
            }
            
            // Update position
            updateDecorationPosition(selectedDecoration.face, decoration.id, newX, newY)
            
            // Save to history after nudge
            setTimeout(() => {
              saveDecorationPositionToHistory(selectedDecoration.face, selectedDecoration.id)
            }, 0)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedDecoration, selectedDecoration, editingTextId, currentTool, decorations, updateDecorationPosition, updateDecorationWithoutHistory, saveDecorationPositionToHistory])

  // Track previous state to avoid unnecessary redraws
  const prevDecorationsRef = useRef(decorations)
  const prevModeRef = useRef(mode)
  const prevSelectedDecorationRef = useRef(selectedDecoration)
  const prevToolRef = useRef(currentTool)
  const prevDrawSettingsRef = useRef(drawSettings)
  const isInitialMountRef = useRef(true)
  const isSavingDrawingRef = useRef(false) // Prevent duplicate saves when handleMouseUp is called multiple times

  // Draw all decorations on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size accounting for device pixel ratio (for crisp rendering on high-DPI displays)
    const dpr = window.devicePixelRatio || 1
    
    // Get the container's computed size (respects CSS media queries)
    const container = canvas.parentElement
    const containerRect = container?.getBoundingClientRect()
    const displayWidth = containerRect?.width || CARD_WIDTH
    const displayHeight = containerRect?.height || CARD_HEIGHT
    
    const needsInit = canvas.width !== CARD_WIDTH * dpr || canvas.height !== CARD_HEIGHT * dpr
    if (needsInit) {
      // Set internal resolution to account for device pixel ratio (always use full size for rendering)
      canvas.width = CARD_WIDTH * dpr
      canvas.height = CARD_HEIGHT * dpr
      // Set CSS size to match container's display size (respects responsive CSS)
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
    } else {
      // Update CSS size if container size changed (e.g., window resize)
      if (canvas.style.width !== `${displayWidth}px` || canvas.style.height !== `${displayHeight}px`) {
        canvas.style.width = `${displayWidth}px`
        canvas.style.height = `${displayHeight}px`
      }
    }
    // Always ensure context is scaled (setting canvas.width resets the context, so re-apply scale)
    ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform first
    ctx.scale(dpr, dpr)
    
    // Fill background immediately (before any other operations) to prevent white flash
    ctx.fillStyle = CARD_BACKGROUND_COLOR
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Use displayMode (which may lag during flip) to determine which face to show
    const face = displayMode === 'front' ? 'front' : 'back'
    const faceDecorations = decorations[face]
    const prevFace = prevModeRef.current === 'front' ? 'front' : 'back'
    const prevFaceDecorations = prevDecorationsRef.current[prevFace]
    
    // If we just finished drawing, the decoration is already on canvas
    // But we still need to redraw to show all decorations properly
    if (justFinishedDrawingRef.current) {
      justFinishedDrawingRef.current = false
      // Continue to redraw to ensure all decorations are visible
    }

    // Check if decorations actually changed (more efficient comparison)
    const modeChanged = displayMode !== prevModeRef.current
    
    // Force redraw on initial mount or when decorations are loaded (especially in viewer mode)
    const isInitialMount = isInitialMountRef.current
    
    // Check if decorations object reference changed (indicates decorations were loaded/replaced)
    const decorationsObjectChanged = decorations !== prevDecorationsRef.current
    
    // Check if decorations went from empty to loaded (common in viewer mode)
    // This is critical for viewer mode - when decorations are loaded, we need to redraw
    const prevFaceWasEmpty = !prevFaceDecorations || prevFaceDecorations.length === 0
    const faceNowHasDecorations = faceDecorations && faceDecorations.length > 0
    const decorationsLoaded = prevFaceWasEmpty && faceNowHasDecorations
    
    // Also check if the entire decorations object has any decorations now (for both faces)
    // This catches cases where decorations are loaded but the comparison above might miss it
    const hasAnyDecorations = (decorations.front && decorations.front.length > 0) || 
                              (decorations.back && decorations.back.length > 0)
    const prevHadNoDecorationsAtAll = (!prevDecorationsRef.current.front || prevDecorationsRef.current.front.length === 0) &&
                                      (!prevDecorationsRef.current.back || prevDecorationsRef.current.back.length === 0)
    const decorationsJustLoaded = prevHadNoDecorationsAtAll && hasAnyDecorations
    
    const decorationsChanged = 
      isInitialMount ||
      decorationsObjectChanged ||
      decorationsLoaded ||
      decorationsJustLoaded ||
      modeChanged ||
      faceDecorations.length !== prevFaceDecorations.length ||
      faceDecorations.some((dec, i) => {
        const prevDec = prevFaceDecorations[i]
        if (!prevDec || dec.id !== prevDec.id || dec.x !== prevDec.x || dec.y !== prevDec.y) {
          return true
        }
        // Also check if decoration data changed (for real-time appearance updates)
        if (dec.type !== prevDec.type) {
          return true
        }
        // Deep compare data object for changes (font size, color, etc.)
        const dataChanged = JSON.stringify(dec.data) !== JSON.stringify(prevDec.data)
        return dataChanged
      })
    
    // Mark that initial mount is complete after first render
    if (isInitialMount) {
      isInitialMountRef.current = false
    }
    
    // Check if only selection changed (simple reference/ID comparison)
    // Redraw selection changes if in grab mode or text tool with text selected
    const selectionChanged = 
      (currentTool === 'grab' || (currentTool === 'text' && selectedDecoration && 
        faceDecorations.find(d => d.id === selectedDecoration.id && d.type === 'text'))) &&
      ((selectedDecoration?.face !== prevSelectedDecorationRef.current?.face) ||
       (selectedDecoration?.id !== prevSelectedDecorationRef.current?.id))

    // If only selection changed, check if we need to redraw
    if (!decorationsChanged && selectionChanged) {
      // Check if the selected decoration type needs visual selection indicators
      // In grab mode, all decoration types show selection indicators
      // In text tool mode, only text shows selection indicators
      const needsRedraw = selectedDecoration && (() => {
        const dec = faceDecorations.find(d => d.id === selectedDecoration.id)
        if (currentTool === 'grab') {
        return dec && (dec.type === 'sticker' || dec.type === 'text' || dec.type === 'drawing')
        } else if (currentTool === 'text') {
          return dec && dec.type === 'text'
        }
        return false
      })() || prevSelectedDecorationRef.current && (() => {
        const prevDec = prevFaceDecorations.find(d => d.id === prevSelectedDecorationRef.current!.id)
        // Need to redraw to remove previous selection indicator
        if (prevDec) {
          if (currentTool === 'grab') {
            return prevDec.type === 'sticker' || prevDec.type === 'text' || prevDec.type === 'drawing'
          } else if (currentTool === 'text') {
            return prevDec.type === 'text'
          }
        }
        return false
      })()

      if (!needsRedraw) {
        prevSelectedDecorationRef.current = selectedDecoration
        return
      }
    }

    // Check if currentTool changed (need to redraw borders when tool changes)
    const toolChanged = currentTool !== prevToolRef.current
    
    // Check if drawSettings changed (need to redraw to ensure drawings stay visible)
    const drawSettingsChanged = 
      drawSettings.color !== prevDrawSettingsRef.current.color ||
      drawSettings.lineWidth !== prevDrawSettingsRef.current.lineWidth ||
      drawSettings.smoothing !== prevDrawSettingsRef.current.smoothing
    
    // Check if we're currently drawing (need to redraw to show current path)
    const isCurrentlyDrawing = isDrawing && currentTool === 'draw' && currentPath.length > 0
    
    // Check if we're currently dragging (need to redraw to show moved decoration)
    const isCurrentlyDragging = isDragging && currentTool === 'grab'
    
    // Check if we're editing text (need to redraw to show updated text)
    const isCurrentlyEditing = editingTextId !== null
    
    // If flipping, only show white background (hide all decorations)
    if (isFlipping) {
      // Clear canvas with card background color
      ctx.fillStyle = CARD_BACKGROUND_COLOR
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
      // Don't update refs during flip - keep previous state
      return
    }
    
    // Only clear and redraw everything if decorations actually changed
    // For selection/tool changes, we'll do incremental updates
    // Also force full redraw if drawSettings changed to ensure drawings stay visible
    // Force full redraw when tool changes to ensure all decorations (especially drawings) stay visible
    // Also force full redraw when draw tool or text tool is active to ensure decorations are always visible
    // For sticker tool, toolChanged handles it when switching to it, and decorationsChanged handles it when placing
    // Include grab tool to ensure decorations are always visible when moving/selecting
    const needsFullRedraw = decorationsChanged || modeChanged || drawSettingsChanged || toolChanged || currentTool === 'draw' || currentTool === 'text' || currentTool === 'grab'
    
    // Track which decorations need incremental updates
    let idsToUpdate: string[] = []
    
    // Clear canvas if doing full redraw OR if currently drawing (need clean slate for drawing)
    // Always clear for full redraws to ensure all decorations are properly redrawn
    if (needsFullRedraw || isCurrentlyDrawing) {
      // Clear canvas with card background color
      // Use logical dimensions after context scaling
      ctx.fillStyle = CARD_BACKGROUND_COLOR
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
    } else {
      // For incremental updates (selection changes only), only update affected areas
      // Skip full redraw if nothing significant changed
      // Note: drawSettingsChanged and toolChanged are handled above with needsFullRedraw
      if (!selectionChanged && !isCurrentlyDrawing && !isCurrentlyDragging && !isCurrentlyEditing) {
        return
      }
      
      // Helper function to calculate bounding box for a decoration (including selection indicator)
      const getDecorationBounds = (dec: any, includeSelection: boolean) => {
        const x = (dec.x + CARD_WIDTH / 2)
        const y = (dec.y + CARD_HEIGHT / 2)
        const padding = includeSelection ? 8 : 0
        
        if (dec.type === 'sticker') {
          const scale = dec.data.scale || 0.15
          const size = 64 * scale
          return {
            x: x - size / 2 - padding,
            y: y - size / 2 - padding,
            width: size + padding * 2,
            height: size + padding * 2
          }
        } else if (dec.type === 'text') {
          ctx.font = `${dec.data.fontWeight === 'bold' ? 'bold ' : ''}${dec.data.fontStyle || 'normal'} ${dec.data.fontSize || 24}px ${dec.data.fontFamily || 'Arial, sans-serif'}`
          const text = dec.data.text || ''
          const lines = text.split('\n')
          const fontSize = dec.data.fontSize || 24
          const lineHeight = fontSize * 1.2
          // Calculate width of longest line
          let maxTextWidth = 0
          lines.forEach((line: string) => {
            const lineWidth = ctx.measureText(line).width
            maxTextWidth = Math.max(maxTextWidth, lineWidth)
          })
          const textWidth = maxTextWidth
          const textHeight = lines.length * lineHeight
          return {
            x: x - textWidth / 2 - padding,
            y: y - textHeight / 2 - padding,
            width: textWidth + padding * 2,
            height: textHeight + padding * 2
          }
        } else if (dec.type === 'drawing' && dec.data.paths) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          dec.data.paths.forEach((path: number[][]) => {
            path.forEach((point: number[]) => {
              const px = point[0] + CARD_WIDTH / 2
              const py = point[1] + CARD_HEIGHT / 2
              minX = Math.min(minX, px)
              minY = Math.min(minY, py)
              maxX = Math.max(maxX, px)
              maxY = Math.max(maxY, py)
            })
          })
          if (minX !== Infinity) {
            return {
              x: minX - padding,
              y: minY - padding,
              width: maxX - minX + padding * 2,
              height: maxY - minY + padding * 2
            }
          }
        }
        return null
      }
      
      // Helper function to erase an area by filling with background
      const eraseArea = (bounds: { x: number, y: number, width: number, height: number }) => {
        ctx.fillStyle = CARD_BACKGROUND_COLOR
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
      }
      
      // Find decorations that need updates
      idsToUpdate = []
      
      // Previous selection that needs to be removed
      if (prevSelectedDecorationRef.current && prevToolRef.current) {
        const prevDec = prevFaceDecorations.find(d => d.id === prevSelectedDecorationRef.current!.id)
        if (prevDec) {
          const hadIndicator = 
            (prevToolRef.current === 'grab' && (prevDec.type === 'sticker' || prevDec.type === 'text' || prevDec.type === 'drawing')) ||
            (prevToolRef.current === 'text' && prevDec.type === 'text')
          
          if (hadIndicator) {
            idsToUpdate.push(prevDec.id)
            // Erase the area where the old selection indicator was
            const bounds = getDecorationBounds(prevDec, true)
            if (bounds) {
              eraseArea(bounds)
            }
          }
        }
      }
      
      // Current selection that needs to be drawn
      if (selectedDecoration && currentTool) {
        const currentDec = faceDecorations.find(d => d.id === selectedDecoration.id)
        if (currentDec) {
          // Check if we need to show selection indicator based on tool and decoration type
          // Use type assertion to avoid TypeScript narrowing issues in this context
          const tool = currentTool as 'sticker' | 'text' | 'draw' | 'grab' | null
          let needsIndicator = false
          if (tool === 'grab') {
            needsIndicator = currentDec.type === 'sticker' || currentDec.type === 'text' || currentDec.type === 'drawing'
          } else if (tool === 'text') {
            needsIndicator = currentDec.type === 'text'
          }
          
          if (needsIndicator && !idsToUpdate.includes(currentDec.id)) {
            idsToUpdate.push(currentDec.id)
            // Erase the area first
            const bounds = getDecorationBounds(currentDec, true)
            if (bounds) {
              eraseArea(bounds)
            }
          }
        }
      }
      
      // If dragging, update the decoration being moved
      if (isDragging && selectedDecoration) {
        const draggedDec = faceDecorations.find(d => d.id === selectedDecoration.id)
        if (draggedDec && !idsToUpdate.includes(draggedDec.id)) {
          idsToUpdate.push(draggedDec.id)
          // Erase old position (from previous state)
          const prevDec = prevFaceDecorations.find(d => d.id === selectedDecoration.id)
          if (prevDec) {
            const bounds = getDecorationBounds(prevDec, true)
            if (bounds) {
              eraseArea(bounds)
            }
          }
        }
      }
    }

    // Draw all decorations
    const drawDecorations = async (onlyChanged?: { face: 'front' | 'back', ids: string[] }) => {
      // Only clear background if doing full redraw or currently drawing
      // Always clear for full redraws to ensure all decorations are properly redrawn
      if (needsFullRedraw || isCurrentlyDrawing || !onlyChanged) {
        // Re-fill background with card background color
        // Use logical dimensions after context scaling
        ctx.fillStyle = CARD_BACKGROUND_COLOR
        ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
      }

      // If onlyChanged is specified, only redraw those specific decorations
      const decorationsToDraw = onlyChanged 
        ? faceDecorations.filter(d => onlyChanged.ids.includes(d.id))
        : faceDecorations

      for (const decoration of decorationsToDraw) {
        // Show selection indicators only when the appropriate tool is active
        const isSelected = selectedDecoration?.face === face && selectedDecoration?.id === decoration.id
        // Only show grab mode selection when grab tool is active
        const showFullSelection = currentTool === 'grab' && isSelected
        // Only show text tool selection when text tool is active
        const showTextSelection = currentTool === 'text' && isSelected && decoration.type === 'text'
        // Only allow editing when text tool is selected
        const isEditing = currentTool === 'text' && decoration.type === 'text' && editingTextId === decoration.id

        if (decoration.type === 'sticker') {
          const scale = decoration.data.scale || 0.15
          const stickerSize = 64 * scale
          const x = (decoration.x + CARD_WIDTH / 2)
          const y = (decoration.y + CARD_HEIGHT / 2)

          // Draw selection border (only in grab mode for stickers, not in read-only)
          if (!readOnly && currentTool === 'grab' && showFullSelection) {
            const borderX = x - stickerSize / 2 - 8
            const borderY = y - stickerSize / 2 - 8
            const borderWidth = stickerSize + 16
            const borderHeight = stickerSize + 16
            
            ctx.strokeStyle = '#6a9c89'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.strokeRect(borderX, borderY, borderWidth, borderHeight)
            ctx.setLineDash([])
            
            // Draw delete button (X) in top-right corner
            const deleteBtnSize = 20
            const deleteBtnX = borderX + borderWidth
            const deleteBtnY = borderY
            
            // Background circle
            ctx.fillStyle = '#ff4444'
            ctx.beginPath()
            ctx.arc(deleteBtnX, deleteBtnY, deleteBtnSize / 2, 0, Math.PI * 2)
            ctx.fill()
            
            // X icon
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.lineCap = 'round'
            const crossSize = 8
            ctx.beginPath()
            ctx.moveTo(deleteBtnX - crossSize / 2, deleteBtnY - crossSize / 2)
            ctx.lineTo(deleteBtnX + crossSize / 2, deleteBtnY + crossSize / 2)
            ctx.moveTo(deleteBtnX + crossSize / 2, deleteBtnY - crossSize / 2)
            ctx.lineTo(deleteBtnX - crossSize / 2, deleteBtnY + crossSize / 2)
            ctx.stroke()
          }

          // Draw sticker
          if (decoration.data.url) {
            try {
              const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const image = new Image()
                image.crossOrigin = 'anonymous'
                image.onload = () => resolve(image)
                image.onerror = reject
                image.src = decoration.data.url
              })
              ctx.drawImage(
                img,
                x - stickerSize / 2,
                y - stickerSize / 2,
                stickerSize,
                stickerSize
              )
            } catch (err) {
              // Fallback circle
              ctx.fillStyle = decoration.data.color || '#ff6b6b'
              ctx.beginPath()
              ctx.arc(x, y, stickerSize / 2, 0, Math.PI * 2)
              ctx.fill()
            }
          } else {
            ctx.fillStyle = decoration.data.color || '#ff6b6b'
            ctx.beginPath()
            ctx.arc(x, y, stickerSize / 2, 0, Math.PI * 2)
            ctx.fill()
          }
        } else if (decoration.type === 'text') {
          const fontSize = decoration.data.fontSize || 24
          const fontFamily = decoration.data.fontFamily || 'Arial, sans-serif'
          const fontWeight = decoration.data.fontWeight || 'normal'
          const fontStyle = decoration.data.fontStyle || 'normal'
          
          ctx.font = `${fontWeight === 'bold' ? 'bold ' : ''}${fontStyle} ${fontSize}px ${fontFamily}`
          ctx.fillStyle = decoration.data.color || '#000000'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const x = (decoration.x + CARD_WIDTH / 2)
          const y = (decoration.y + CARD_HEIGHT / 2)

          // Measure text width and height for proper underline and border positioning (support multi-line)
          const text = decoration.data.text || ''
          const lines = text.split('\n')
          const lineHeight = fontSize * 1.2
          // Calculate width of longest line
          let maxTextWidth = 0
          lines.forEach((line: string) => {
            const lineWidth = ctx.measureText(line).width
            maxTextWidth = Math.max(maxTextWidth, lineWidth)
          })
          const textWidth = maxTextWidth
          const textHeight = lines.length * lineHeight
            
          // Draw selection border
          // Only show borders when the appropriate tool is explicitly active and not in read-only mode
          // Text tool: No canvas border - only textarea border when editing
          // Grab tool: dotted border for selection
          if (!readOnly && currentTool === 'grab' && showFullSelection) {
            // Grab tool: dotted border for selection
            const borderX = x - textWidth / 2 - 8
            const borderY = y - textHeight / 2 - 8
            const borderWidth = textWidth + 16
            const borderHeight = textHeight + 16
            
            ctx.strokeStyle = '#6a9c89'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5]) // Dotted line
            ctx.strokeRect(borderX, borderY, borderWidth, borderHeight)
            ctx.setLineDash([])
            
            // Draw delete button (X) in top-right corner
            const deleteBtnSize = 20
            const deleteBtnX = borderX + borderWidth
            const deleteBtnY = borderY
            
            // Background circle
            ctx.fillStyle = '#ff4444'
            ctx.beginPath()
            ctx.arc(deleteBtnX, deleteBtnY, deleteBtnSize / 2, 0, Math.PI * 2)
            ctx.fill()
            
            // X icon
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.lineCap = 'round'
            const crossSize = 8
            ctx.beginPath()
            ctx.moveTo(deleteBtnX - crossSize / 2, deleteBtnY - crossSize / 2)
            ctx.lineTo(deleteBtnX + crossSize / 2, deleteBtnY + crossSize / 2)
            ctx.moveTo(deleteBtnX + crossSize / 2, deleteBtnY - crossSize / 2)
            ctx.lineTo(deleteBtnX - crossSize / 2, deleteBtnY + crossSize / 2)
            ctx.stroke()
          }

          // Don't draw text on canvas when editing - the input field handles it
          // This makes it look like you're editing directly on the canvas
          const isCurrentlyEditing = editingTextId === decoration.id && currentTool === 'text'
          
          if (!isCurrentlyEditing) {
            // Draw text - support multi-line text
            const text = decoration.data.text || ''
            const lines = text.split('\n')
            const lineHeight = fontSize * 1.2 // Line height with some spacing
            const totalHeight = lines.length * lineHeight
            const startY = y - (totalHeight - lineHeight) / 2 // Center multi-line text vertically
            
            lines.forEach((line: string, index: number) => {
              const lineY = startY + (index * lineHeight)
              ctx.fillText(line, x, lineY)
            })
            
            // Draw underline after text, using actual text width
            if (decoration.data.textDecoration === 'underline') {
              ctx.strokeStyle = decoration.data.color || '#000000'
              ctx.lineWidth = Math.max(1, fontSize / 20) // Scale underline thickness with font size
              ctx.beginPath()
              const underlineY = startY + (lines.length - 1) * lineHeight + fontSize / 2 + 2 // Position below last line
              ctx.moveTo(x - textWidth / 2, underlineY)
              ctx.lineTo(x + textWidth / 2, underlineY)
              ctx.stroke()
            }
          }
        } else if (decoration.type === 'drawing') {
          if (decoration.data.paths) {
            ctx.strokeStyle = decoration.data.color || '#000000'
            ctx.lineWidth = decoration.data.lineWidth || 2
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            
            // Calculate bounding box for selection indicator
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
            
            decoration.data.paths.forEach((path: number[][]) => {
              if (path.length > 0) {
                ctx.beginPath()
                const startX = (path[0][0] + CARD_WIDTH / 2)
                const startY = (path[0][1] + CARD_HEIGHT / 2)
                ctx.moveTo(startX, startY)
                
                // Update bounding box
                minX = Math.min(minX, startX)
                minY = Math.min(minY, startY)
                maxX = Math.max(maxX, startX)
                maxY = Math.max(maxY, startY)
                
                for (let i = 1; i < path.length; i++) {
                  const x = (path[i][0] + CARD_WIDTH / 2)
                  const y = (path[i][1] + CARD_HEIGHT / 2)
                  ctx.lineTo(x, y)
                  
                  // Update bounding box
                  minX = Math.min(minX, x)
                  minY = Math.min(minY, y)
                  maxX = Math.max(maxX, x)
                  maxY = Math.max(maxY, y)
                }
                ctx.stroke()
              }
            })
            
            // Draw selection border and delete button if selected (only in grab mode, not in read-only)
            if (!readOnly && currentTool === 'grab' && showFullSelection && minX !== Infinity) {
              const padding = 8
              const borderX = minX - padding
              const borderY = minY - padding
              const borderWidth = maxX - minX + padding * 2
              const borderHeight = maxY - minY + padding * 2
              
              ctx.strokeStyle = '#6a9c89'
              ctx.lineWidth = 2
              ctx.setLineDash([5, 5])
              ctx.strokeRect(borderX, borderY, borderWidth, borderHeight)
              ctx.setLineDash([])
              
              // Draw delete button (X) in top-right corner
              const deleteBtnSize = 20
              const deleteBtnX = borderX + borderWidth
              const deleteBtnY = borderY
              
              // Background circle
              ctx.fillStyle = '#ff4444'
              ctx.beginPath()
              ctx.arc(deleteBtnX, deleteBtnY, deleteBtnSize / 2, 0, Math.PI * 2)
              ctx.fill()
              
              // X icon
              ctx.strokeStyle = '#ffffff'
              ctx.lineWidth = 2
              ctx.lineCap = 'round'
              const crossSize = 8
              ctx.beginPath()
              ctx.moveTo(deleteBtnX - crossSize / 2, deleteBtnY - crossSize / 2)
              ctx.lineTo(deleteBtnX + crossSize / 2, deleteBtnY + crossSize / 2)
              ctx.moveTo(deleteBtnX + crossSize / 2, deleteBtnY - crossSize / 2)
              ctx.lineTo(deleteBtnX - crossSize / 2, deleteBtnY + crossSize / 2)
              ctx.stroke()
            }
          }
        }
      }
    }
    
    // Draw decorations (full redraw or incremental)
    ;(async () => {
      // Always redraw all decorations when draw tool, text tool, or grab tool is active or when drawing to ensure they're visible
      // For sticker tool, only redraw when switching to it (handled by toolChanged in needsFullRedraw)
      const tool = currentTool as 'sticker' | 'text' | 'draw' | 'grab' | null
      if (needsFullRedraw || isCurrentlyDrawing || tool === 'draw' || tool === 'text' || tool === 'grab') {
        // Full redraw - draw all decorations
        await drawDecorations()
      } else if (idsToUpdate.length > 0) {
        // Incremental update - only redraw decorations that need updates
        // Areas have already been erased above
        await drawDecorations({ face, ids: idsToUpdate })
      } else if (faceNowHasDecorations && (prevFaceWasEmpty || isInitialMount)) {
        // If decorations exist but weren't there before, always draw them
        // This is critical for viewer mode - ensures decorations show immediately on load
        await drawDecorations()
      }
      
      // Draw current path if drawing (after all decorations are drawn)
      if (isDrawing && currentPath.length > 1 && currentTool === 'draw') {
        ctx.strokeStyle = drawSettings.color
        ctx.lineWidth = drawSettings.lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(currentPath[0].x, currentPath[0].y)
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y)
        }
        ctx.stroke()
      }
    })()
    
    // Update refs after redraw
    prevDecorationsRef.current = decorations
    prevModeRef.current = displayMode
    prevSelectedDecorationRef.current = selectedDecoration
    prevToolRef.current = currentTool
    prevDrawSettingsRef.current = drawSettings
  }, [decorations, displayMode, selectedDecoration, drawSettings, isFlipping, currentTool, editingTextId, isDrawing, currentPath, isDragging, editingTextValue])

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in e) {
      if (e.touches.length > 1) return null // Two fingers = ignore
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = ((clientX - rect.left) / rect.width) * CARD_WIDTH
    const y = ((clientY - rect.top) / rect.height) * CARD_HEIGHT

    // Convert to card coordinate system (center at 0,0)
    const cardX = x - CARD_WIDTH / 2
    const cardY = y - CARD_HEIGHT / 2

    return { x: cardX, y: cardY, canvasX: x, canvasY: y }
  }

  const findDecorationAtPoint = (coords: { x: number; y: number }) => {
    // Use displayMode to match what's being rendered
    const face = displayMode === 'front' ? 'front' : 'back'
    const faceDecorations = decorations[face]
    
    // Check decorations in reverse order (top-most first)
    for (let i = faceDecorations.length - 1; i >= 0; i--) {
      const d = faceDecorations[i]
      const distance = Math.sqrt(
        Math.pow(d.x - coords.x, 2) + Math.pow(d.y - coords.y, 2)
      )
      
      // Better hit detection based on type
      if (d.type === 'sticker') {
        const scale = d.data.scale || 0.15
        const hitRadius = (64 * scale) / 2 + 5 // Sticker radius + padding
        if (distance < hitRadius) {
          return d
        }
      } else if (d.type === 'text') {
        // Approximate text bounds
        const hitRadius = (d.data.fontSize || 24) / 2 + 10
        if (distance < hitRadius) {
          return d
        }
      } else if (d.type === 'drawing' && d.data.paths) {
        // Check if click is within bounding box or near any path
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        d.data.paths.forEach((path: number[][]) => {
          path.forEach((point: number[]) => {
            minX = Math.min(minX, point[0])
            minY = Math.min(minY, point[1])
            maxX = Math.max(maxX, point[0])
            maxY = Math.max(maxY, point[1])
          })
        })
        
        // Check if click is within bounding box with padding
        const padding = 10
        if (coords.x >= minX - padding && coords.x <= maxX + padding &&
            coords.y >= minY - padding && coords.y <= maxY + padding) {
          // Also check if click is near any path point
          const lineWidth = d.data.lineWidth || 2
          const hitRadius = lineWidth / 2 + 10
          for (const path of d.data.paths) {
            for (const point of path) {
              const pointDistance = Math.sqrt(
                Math.pow(coords.x - point[0], 2) + Math.pow(coords.y - point[1], 2)
              )
              if (pointDistance < hitRadius) {
                return d
              }
            }
          }
        }
      }
    }
    return null
  }

  // Helper function to check if click is on delete button
  const isClickOnDeleteButton = (coords: { canvasX: number; canvasY: number }, dec: any): boolean => {
    if (!dec || currentTool !== 'grab' || !selectedDecoration || selectedDecoration.id !== dec.id) return false
    
    const bounds = (() => {
      const x = (dec.x + CARD_WIDTH / 2)
      const y = (dec.y + CARD_HEIGHT / 2)
      const padding = 8
      
      if (dec.type === 'sticker') {
        const scale = dec.data.scale || 0.15
        const size = 64 * scale
        return {
          x: x - size / 2 - padding,
          y: y - size / 2 - padding,
          width: size + padding * 2,
          height: size + padding * 2
        }
      } else if (dec.type === 'text') {
        const canvas = canvasRef.current
        if (!canvas) return null
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        
        const fontSize = dec.data.fontSize || 24
        const fontFamily = dec.data.fontFamily || 'Arial, sans-serif'
        const fontWeight = dec.data.fontWeight || 'normal'
        const fontStyle = dec.data.fontStyle || 'normal'
        ctx.font = `${fontWeight === 'bold' ? 'bold ' : ''}${fontStyle} ${fontSize}px ${fontFamily}`
        const text = dec.data.text || ''
        const lines = text.split('\n')
        const lineHeight = fontSize * 1.2
        // Calculate width of longest line
        let maxTextWidth = 0
        lines.forEach((line: string) => {
          const lineWidth = ctx.measureText(line).width
          maxTextWidth = Math.max(maxTextWidth, lineWidth)
        })
        const textWidth = maxTextWidth
        const textHeight = lines.length * lineHeight
        
        return {
          x: x - textWidth / 2 - padding,
          y: y - textHeight / 2 - padding,
          width: textWidth + padding * 2,
          height: textHeight + padding * 2
        }
      } else if (dec.type === 'drawing' && dec.data.paths) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        dec.data.paths.forEach((path: number[][]) => {
          path.forEach((point: number[]) => {
            const px = point[0] + CARD_WIDTH / 2
            const py = point[1] + CARD_HEIGHT / 2
            minX = Math.min(minX, px)
            minY = Math.min(minY, py)
            maxX = Math.max(maxX, px)
            maxY = Math.max(maxY, py)
          })
        })
        if (minX === Infinity) return null
        return {
          x: minX - padding,
          y: minY - padding,
          width: maxX - minX + padding * 2,
          height: maxY - minY + padding * 2
        }
      }
      return null
    })()
    
    if (!bounds) return false
    
    const deleteBtnSize = 20
    const deleteBtnX = bounds.x + bounds.width
    const deleteBtnY = bounds.y
    const hitRadius = deleteBtnSize / 2
    
    const distance = Math.sqrt(
      Math.pow(coords.canvasX - deleteBtnX, 2) + Math.pow(coords.canvasY - deleteBtnY, 2)
    )
    
    return distance < hitRadius
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Stop event propagation to prevent click-outside handlers from closing the tool
    e.stopPropagation()
    
    const coords = getCanvasCoordinates(e)
    if (!coords) return

    // Start drawing (draw over decorations, don't select them)
    if (currentTool === 'draw') {
      setIsDrawing(true)
      setCurrentPath([{ x: coords.canvasX, y: coords.canvasY }])
      return
    }

    // Check if clicking on delete button of currently selected decoration (in grab mode)
    if (currentTool === 'grab' && selectedDecoration) {
      const face = selectedDecoration.face
      const selectedDec = decorations[face].find(d => d.id === selectedDecoration.id)
      if (selectedDec && isClickOnDeleteButton(coords, selectedDec)) {
        removeDecoration(face, selectedDecoration.id)
        setSelectedDecoration(null)
        return
      }
    }
    
    const decoration = findDecorationAtPoint(coords)
    
    // Text tool: clicking on existing text selects it
    if (decoration && decoration.type === 'text' && currentTool === 'text') {
      const face = displayMode === 'front' ? 'front' : 'back'
      const isAlreadySelected = selectedDecoration?.face === face && selectedDecoration?.id === decoration.id
      
      setSelectedDecoration({ face, id: decoration.id })
      
      // If text is already selected, single-click should start editing (industry standard)
      // Otherwise, just select it (user can double-click or click again to edit)
      if (isAlreadySelected) {
        setEditingTextId(decoration.id)
        setEditingTextValue(decoration.data.text || '')
        // Trigger width calculation after a brief delay to ensure textarea is rendered
        setTimeout(() => {
          if (textareaRef.current) {
            handleTextInputInput({ currentTarget: textareaRef.current } as any)
          }
        }, 0)
      }
      return
    }
    
    // Only allow decoration selection/interaction in grab mode
    if (decoration && currentTool === 'grab') {
      // Use displayMode to match the face being rendered
      const face = displayMode === 'front' ? 'front' : 'back'
      
      // Select decoration and set up for dragging
      setSelectedDecoration({ face, id: decoration.id })
      setIsDragging(true)
      setDragStart({ x: coords.x, y: coords.y })
      // Store original decoration state for accurate delta calculation
      setDragOriginalDecoration(JSON.parse(JSON.stringify(decoration)))
    } else if (!decoration) {
      // Clicked on empty space
      // Check if we need to remove placeholder text that was never edited
      if (currentTool === 'text' && selectedDecoration) {
        const selectedDec = decorations[selectedDecoration.face]?.find(
          d => d.id === selectedDecoration.id && d.type === 'text'
        )
        // If selected text has placeholder and wasn't being edited, remove it
        if (selectedDec && selectedDec.data.text === 'Your text…' && !editingTextId) {
          removeDecoration(selectedDecoration.face, selectedDecoration.id)
        }
      }
      
      // In grab mode, don't place new items
      if (currentTool === 'grab') {
        // Deselect if clicking empty space in grab mode
        setSelectedDecoration(null)
        return
      }
      if (currentTool === 'sticker' && selectedSticker) {
        const stickerData = getStickerData(selectedSticker)
        if (stickerData) {
          const face = mode === 'front' ? 'front' : 'back'
          const newDecoration = {
            type: 'sticker' as const,
            id: `sticker-${Date.now()}`,
            x: coords.x,
            y: coords.y,
            data: stickerData,
            scale: 0.5,
            rotation: 0,
          }
          
          // Draw the sticker directly on canvas immediately to prevent flickering
          // This keeps the sticker visible without clearing and redrawing everything
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx) {
              const scale = newDecoration.scale || 0.5
              const stickerSize = 64 * scale
              const x = coords.canvasX
              const y = coords.canvasY
              
              // Draw sticker image - for data URLs, load synchronously
              if (stickerData.url) {
                const img = new Image()
                // For data URLs, image loads instantly, so we can draw synchronously
                img.onload = () => {
                  ctx.drawImage(
                    img,
                    x - stickerSize / 2,
                    y - stickerSize / 2,
                    stickerSize,
                    stickerSize
                  )
                }
                img.onerror = () => {
                  // Fallback circle if image fails
                  ctx.fillStyle = stickerData.color || '#ff6b6b'
                  ctx.beginPath()
                  ctx.arc(x, y, stickerSize / 2, 0, Math.PI * 2)
                  ctx.fill()
                }
                img.src = stickerData.url
                
                // For data URLs, check if already loaded and draw immediately
                if (img.complete && img.naturalWidth > 0) {
                  ctx.drawImage(
                    img,
                    x - stickerSize / 2,
                    y - stickerSize / 2,
                    stickerSize,
                    stickerSize
                  )
                }
              }
            }
          }
          
          // Draw sticker immediately, then add to decorations
          // The immediate draw prevents flicker by showing the sticker right away
          // The full redraw that follows will redraw everything properly
          addDecoration(face, newDecoration)
          // Keep sticker selected for placing more instances (industry standard)
          // Don't auto-select decoration - user can use grab tool if they want to move it
        }
      } else if (currentTool === 'text') {
        // Save and clear any existing text editing before adding new text
        if (editingTextId) {
          // Save the currently editing text before adding new one
          const decoration = decorations.front.find(d => d.id === editingTextId && d.type === 'text') ||
                           decorations.back.find(d => d.id === editingTextId && d.type === 'text')
          if (decoration) {
            const face = decorations.front.find(d => d.id === editingTextId) ? 'front' : 'back'
            // Use editingTextValue if it exists, otherwise use the decoration's current text
            const textToSave = editingTextValue || decoration.data.text || ''
            
            // If text is still placeholder or empty, remove it (user didn't actually add content)
            if (textToSave === 'Your text…' || textToSave.trim() === '') {
              removeDecoration(face, editingTextId)
            } else {
              updateDecoration(face, editingTextId, {
                ...decoration.data,
                text: textToSave,
              })
            }
          }
          setEditingTextId(null)
          setEditingTextValue('')
        }
        
        // Also check if there's a selected text with placeholder that wasn't being edited
        if (selectedDecoration && !editingTextId) {
          const selectedDec = decorations[selectedDecoration.face]?.find(
            d => d.id === selectedDecoration.id && d.type === 'text'
          )
          // If selected text has placeholder and wasn't being edited, remove it
          if (selectedDec && selectedDec.data.text === 'Your text…') {
            removeDecoration(selectedDecoration.face, selectedDecoration.id)
          }
        }
        
        const face = mode === 'front' ? 'front' : 'back'
        const newDecoration = {
          type: 'text' as const,
          id: `text-${Date.now()}`,
          x: coords.x,
          y: coords.y,
          data: {
            text: 'Your text…',
            fontSize: textSettings.fontSize,
            color: textSettings.color,
            fontFamily: textSettings.fontFamily,
            fontWeight: textSettings.fontWeight || 'normal',
            fontStyle: 'normal',
            textDecoration: textSettings.textDecoration || 'none',
          },
        }
        addDecoration(face, newDecoration)
        // Auto-select and immediately start editing new text (industry standard)
        // Use a small delay to ensure the decoration is in the store before we try to find it
        setTimeout(() => {
          setSelectedDecoration({ face, id: newDecoration.id })
          setEditingTextId(newDecoration.id)
          setEditingTextValue('Your text…')
          // Trigger width calculation after a brief delay to ensure textarea is rendered
          setTimeout(() => {
            if (textareaRef.current) {
              handleTextInputInput({ currentTarget: textareaRef.current } as any)
            }
          }, 0)
        }, 0)
      } else {
        setSelectedDecoration(null)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Disable interactions in read-only mode
    if (readOnly) return
    
    const coords = getCanvasCoordinates(e)
    if (!coords) return

    // Update hover state for grab mode
    if (currentTool === 'grab' && !isDragging && !isDrawing) {
      const decoration = findDecorationAtPoint(coords)
      if (decoration) {
        setHoveredDecoration({ face: mode === 'front' ? 'front' : 'back', id: decoration.id })
      } else {
        setHoveredDecoration(null)
      }
    } else if (!isDragging && !isDrawing) {
      setHoveredDecoration(null)
    }

    if (isDrawing && currentTool === 'draw') {
      // Add point to current path state
      setCurrentPath((prev) => [...prev, { x: coords.canvasX, y: coords.canvasY }])
      // Trigger redraw to show all decorations + current drawing path
      // The redraw will handle drawing the current path along with all decorations
      return
    }

    // Drag decoration (only in grab mode)
    if (isDragging && selectedDecoration && dragStart && dragOriginalDecoration && currentTool === 'grab') {
      const face = selectedDecoration.face
      const decoration = decorations[face].find(d => d.id === selectedDecoration.id)
      if (decoration && dragOriginalDecoration) {
        // Calculate delta from original mouse position to current mouse position
        const deltaX = coords.x - dragStart.x
        const deltaY = coords.y - dragStart.y
        const newX = dragOriginalDecoration.x + deltaX
        const newY = dragOriginalDecoration.y + deltaY
        
        if (decoration.type === 'drawing' && dragOriginalDecoration.data.paths) {
          // For drawings, update all path points from original paths
          const updatedPaths = dragOriginalDecoration.data.paths.map((path: number[][]) =>
            path.map((point: number[]) => [point[0] + deltaX, point[1] + deltaY])
          )
          // Update without saving to history (will save when drag ends)
          updateDecorationWithoutHistory(face, decoration.id, {
            ...dragOriginalDecoration.data,
            paths: updatedPaths,
          })
          // Also update the x, y position
          updateDecorationPosition(face, decoration.id, newX, newY)
        } else if (decoration.type === 'sticker' || decoration.type === 'text') {
          // Update position directly for stickers and text
          updateDecorationPosition(face, decoration.id, newX, newY)
        }
      }
    }
  }

  // Smooth path using moving average algorithm
  const smoothPath = (points: { x: number; y: number }[], smoothing: number): { x: number; y: number }[] => {
    // If no smoothing or too few points, return original
    if (points.length < 2 || smoothing === 0) return points
    
    // Convert smoothing (0-100) to window size (1-10)
    const windowSize = Math.max(1, Math.min(10, Math.floor(smoothing / 10)))
    const smoothed: { x: number; y: number }[] = []
    
    for (let i = 0; i < points.length; i++) {
      let sumX = 0
      let sumY = 0
      let count = 0
      
      // Average points within window
      for (let j = Math.max(0, i - windowSize); j <= Math.min(points.length - 1, i + windowSize); j++) {
        sumX += points[j].x
        sumY += points[j].y
        count++
      }
      
      // Ensure we have valid coordinates
      if (count > 0 && isFinite(sumX) && isFinite(sumY)) {
        smoothed.push({
          x: sumX / count,
          y: sumY / count,
        })
      } else {
        // Fallback to original point if smoothing produces invalid result
        smoothed.push(points[i])
      }
    }
    
    // Ensure we have at least 2 points
    return smoothed.length >= 2 ? smoothed : points
  }

  const handleMouseUp = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    // Disable interactions in read-only mode
    if (readOnly) return
    
    // Check if we're about to save a drawing
    const isAboutToSaveDrawing = isDrawing && currentPath.length > 0 && currentTool === 'draw'
    
    // Prevent duplicate saves when handleMouseUp is called multiple times (mouseUp, mouseLeave, touchEnd)
    if (isAboutToSaveDrawing && isSavingDrawingRef.current) {
      return
    }
    
    // Mark that we're saving BEFORE processing to prevent race conditions
    if (isAboutToSaveDrawing) {
      isSavingDrawingRef.current = true
    }
    
    if (isAboutToSaveDrawing) {
      const face = mode === 'front' ? 'front' : 'back'
      
      // Apply smoothing to path before saving
      const smoothedPath = smoothPath(currentPath, drawSettings.smoothing || 0)
      
      // Use smoothed path if valid, otherwise fall back to original
      const pathToSave = smoothedPath.length >= 2 ? smoothedPath : currentPath
      
      // Ensure we have at least 2 points for a valid path
      if (pathToSave.length >= 2) {
        // Convert canvas coordinates to card coordinates and ensure they're valid
        const cardPath = pathToSave
          .map(p => {
            // Ensure coordinates are valid numbers
            if (!isFinite(p.x) || !isFinite(p.y)) {
              return null
            }
            // Clamp coordinates to valid canvas bounds
            const clampedX = Math.max(0, Math.min(CARD_WIDTH, p.x))
            const clampedY = Math.max(0, Math.min(CARD_HEIGHT, p.y))
            // Convert to card coordinate system (centered at 0,0)
            return [clampedX - CARD_WIDTH / 2, clampedY - CARD_HEIGHT / 2]
          })
          .filter((point): point is number[] => {
            // Remove null/invalid points and duplicate consecutive points
            if (point === null) return false
            return true
          })
          .filter((point, index, arr) => {
            // Remove duplicate consecutive points
            if (index === 0) return true
            const prev = arr[index - 1]
            return point[0] !== prev[0] || point[1] !== prev[1]
          })
        
        // Only save if we still have at least 2 points after filtering
        if (cardPath.length >= 2) {
          // Draw the saved decoration directly on canvas immediately (no redraw needed)
          // This keeps the drawing visible without clearing and redrawing everything
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx) {
              // Draw the saved path directly onto the canvas
              ctx.strokeStyle = drawSettings.color
              ctx.lineWidth = drawSettings.lineWidth
              ctx.lineCap = 'round'
              ctx.lineJoin = 'round'
              ctx.beginPath()
              
              const startX = cardPath[0][0] + CARD_WIDTH / 2
              const startY = cardPath[0][1] + CARD_HEIGHT / 2
              ctx.moveTo(startX, startY)
              
              for (let i = 1; i < cardPath.length; i++) {
                const x = cardPath[i][0] + CARD_WIDTH / 2
                const y = cardPath[i][1] + CARD_HEIGHT / 2
                ctx.lineTo(x, y)
              }
              ctx.stroke()
            }
          }
          
          // Each stroke is saved as a separate decoration for individual undo
          addDecoration(face, {
            type: 'drawing',
            id: `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
            x: 0,
            y: 0,
            data: {
              paths: [cardPath],
              color: drawSettings.color,
              lineWidth: drawSettings.lineWidth,
            },
          })
        }
      }
      
      // Clear current path after saving (the drawing is now saved as decoration)
      setCurrentPath([])
      // Reset the saving flag after a short delay to allow the state update to complete
      setTimeout(() => {
        isSavingDrawingRef.current = false
      }, 100)
    } else {
      // Reset flag immediately if not saving a drawing
      isSavingDrawingRef.current = false
    }
    setIsDrawing(false)
    
    // Save to history when drag ends (if we were dragging)
    if (isDragging && selectedDecoration && currentTool === 'grab') {
      // The decoration is already updated (via updateDecorationWithoutHistory/updateDecorationPosition during drag)
      // Save current state to history - this should preserve all decorations
      const face = selectedDecoration.face
      saveDecorationPositionToHistory(face, selectedDecoration.id)
    }
    
    setIsDragging(false)
    setDragStart(null)
    setDragOriginalDecoration(null)
    // Clear hover state on mouse up
    setHoveredDecoration(null)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Disable interactions in read-only mode
    if (readOnly) return
    if (e.touches.length > 1) return // Ignore multi-touch
    handleMouseDown(e as any)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 1) {
      // Multi-touch - stop drawing/dragging
      setIsDrawing(false)
      setIsDragging(false)
      return
    }
    handleMouseMove(e as any)
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Disable interactions in read-only mode
    if (readOnly) {
      handleMouseUp()
      return
    }

    // Only detect double-tap when text tool is active
    if (currentTool === 'text') {
      const coords = getCanvasCoordinates(e)
      if (coords) {
        const now = Date.now()
        const lastTap = lastTapRef.current

        // Check if this is a double-tap
        // Double-tap: two taps within 300ms and within 50px of each other
        if (lastTap && 
            (now - lastTap.timestamp) < 300 &&
            Math.abs(coords.x - lastTap.x) < 50 &&
            Math.abs(coords.y - lastTap.y) < 50) {
          
          // It's a double-tap! Find text decoration and edit it
          const decoration = findDecorationAtPoint(coords)
          if (decoration && decoration.type === 'text') {
            const face = displayMode === 'front' ? 'front' : 'back'
            setSelectedDecoration({ face, id: decoration.id })
            setEditingTextId(decoration.id)
            setEditingTextValue(decoration.data.text || '')
            // Trigger width calculation after a brief delay to ensure textarea is rendered
            setTimeout(() => {
              if (textareaRef.current) {
                handleTextInputInput({ currentTarget: textareaRef.current } as any)
              }
            }, 0)
            
            // Clear the ref to prevent triple-tap issues
            lastTapRef.current = null
            // Don't continue with normal touch handling for double-tap
            return
          }
        } else {
          // Single tap - store for potential double-tap
          lastTapRef.current = {
            timestamp: now,
            x: coords.x,
            y: coords.y
          }
          
          // Clear after timeout so next tap is treated as fresh
          setTimeout(() => {
            lastTapRef.current = null
          }, 300)
        }
      }
    }

    // Continue with normal touch end handling
    handleMouseUp()
  }

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only allow double-click to edit when text tool is selected
    if (currentTool !== 'text') return
    
    const coords = getCanvasCoordinates(e)
    if (!coords) return

    const decoration = findDecorationAtPoint(coords)
    if (decoration && decoration.type === 'text') {
      const face = displayMode === 'front' ? 'front' : 'back'
      setSelectedDecoration({ face, id: decoration.id })
      setEditingTextId(decoration.id)
      setEditingTextValue(decoration.data.text || '')
      // Trigger width calculation after a brief delay to ensure textarea is rendered
      setTimeout(() => {
        if (textareaRef.current) {
          handleTextInputInput({ currentTarget: textareaRef.current } as any)
        }
      }, 0)
    }
  }


  // Text editing input (positioned absolutely)
  const selectedTextDecoration = selectedDecoration && editingTextId
    ? decorations[selectedDecoration.face]?.find(d => d.id === editingTextId && d.type === 'text')
    : null

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value
    
    // Auto-clear placeholder text when user starts typing
    // If the current value is the placeholder and user types, replace it with what they typed
    if (editingTextValue === 'Your text…' && newValue !== 'Your text…' && newValue.length > 0) {
      // User started typing - if they typed a single character, use just that
      // If they typed multiple (e.g., paste), use what they typed
      if (newValue.length === 1 || !newValue.includes('Your text…')) {
        // User typed a new character - replace placeholder
        newValue = newValue.replace('Your text…', '')
      }
    }
    
    setEditingTextValue(newValue)
    
    // Update canvas text in real-time as user types (without saving to history)
    // History will be saved when editing is complete (on blur/Enter)
    if (selectedTextDecoration && editingTextId) {
      const face = selectedDecoration!.face
      updateDecorationWithoutHistory(face, editingTextId, {
        ...selectedTextDecoration.data,
        text: newValue || '',
      })
    }
  }
  
  const handleTextInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If placeholder is selected and user types, clear it first
    if (editingTextValue === 'Your text…' && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      // User typed a character while placeholder is shown - clear it
      setEditingTextValue('')
      e.preventDefault()
      // Insert the character manually
      const textarea = e.currentTarget
      const newValue = e.key
      setEditingTextValue(newValue)
      if (selectedTextDecoration && editingTextId) {
        const face = selectedDecoration!.face
        // Update without history - will save to history on blur/Enter
        updateDecorationWithoutHistory(face, editingTextId, {
          ...selectedTextDecoration.data,
          text: newValue,
        })
      }
      // Move cursor to end
      setTimeout(() => {
        textarea.setSelectionRange(newValue.length, newValue.length)
      }, 0)
      return
    }
    
    // Escape key - finish editing
    if (e.key === 'Escape') {
      e.preventDefault()
      if (editingTextId && selectedTextDecoration) {
        const face = selectedDecoration!.face
        // Ensure text is saved (it's already updated during typing)
        updateDecorationWithoutHistory(face, editingTextId, {
          ...selectedTextDecoration.data,
          text: editingTextValue || '',
        })
        // Save current state to history
        addToHistory()
      }
      // Small delay to ensure decoration is updated before blur
      setTimeout(() => {
        e.currentTarget.blur()
      }, 0)
    }
    // Enter key - allow default behavior (line break in textarea)
    // No need to handle Enter specially - textarea handles it naturally
  }
  
  const handleTextInputInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    // Auto-resize textarea to fit content (height and width)
    const textarea = e.currentTarget
    
    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
    
    // Calculate width based on content
    // Use canvas to measure text width for accurate sizing
    if (canvasRef.current && selectedTextDecoration) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        const fontSize = selectedTextDecoration.data.fontSize || 24
        const fontFamily = selectedTextDecoration.data.fontFamily || 'Arial, sans-serif'
        const fontWeight = selectedTextDecoration.data.fontWeight || 'normal'
        const fontStyle = selectedTextDecoration.data.fontStyle || 'normal'
        
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
        
        // Measure the longest line in the text
        const lines = textarea.value.split('\n')
        let maxWidth = 0
        lines.forEach((line: string) => {
          const metrics = ctx.measureText(line || ' ')
          const width = metrics.width
          if (width > maxWidth) {
            maxWidth = width
          }
        })
        
        // Set width with some padding, but no fixed min-width
        // Ensure minimum width for empty text (at least 1 character width)
        const minWidth = ctx.measureText(' ').width
        const calculatedWidth = Math.max(maxWidth, minWidth) + 20 // 20px padding
        const maxWidthLimit = CARD_WIDTH - 40
        
        textarea.style.width = `${Math.min(calculatedWidth, maxWidthLimit)}px`
      }
    }
  }

  const handleTextInputBlur = () => {
    // Save text before clearing edit mode
    // Use editingTextId directly to find the decoration, don't rely on selectedDecoration
    // which might have changed if user clicked to place new text
    if (editingTextId) {
      // Find the decoration in both faces (front and back) since we don't know which face
      const decoration = decorations.front.find(d => d.id === editingTextId && d.type === 'text') ||
                         decorations.back.find(d => d.id === editingTextId && d.type === 'text')
      
      if (decoration) {
        // Determine which face this decoration belongs to
        const face = decorations.front.find(d => d.id === editingTextId) ? 'front' : 'back'
        
        // If text is still placeholder or empty, remove it (user didn't actually add content)
        const finalText = editingTextValue || ''
        if (finalText === 'Your text…' || finalText.trim() === '') {
          removeDecoration(face, editingTextId)
        } else {
          // Text is already updated via updateDecorationWithoutHistory during typing
          // Just ensure it's saved and update history
          // State was already saved to history when editing started
          // Final update to ensure text is correct
          updateDecorationWithoutHistory(face, editingTextId, {
            ...decoration.data,
            text: finalText,
          })
          // Save current state to history (with the edited text)
          addToHistory()
        }
      }
    }
    // Clear editing state after a small delay to ensure canvas has time to redraw
    // The text should already be saved from the onChange handler, but we save again here to be sure
    setTimeout(() => {
      setEditingTextId(null)
    }, 0)
  }


  return (
    <>
      <div className={`${styles.cardCanvasContainer} ${isFlipping ? styles.flipping : ''}`}>
        <canvas
          ref={canvasRef}
          className={styles.cardCanvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={(e) => handleMouseUp(e)}
          onMouseLeave={() => handleMouseUp()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: isDragging ? 'grabbing' :
                    (currentTool === 'grab' && hoveredDecoration) ? 'grab' :
                    currentTool === 'grab' ? 'default' :
                    currentTool === 'sticker' && selectedSticker ? 'crosshair' :
                    currentTool === 'text' ? 'text' :
                    currentTool === 'draw' ? 'crosshair' : 'default'
          }}
        />
        {selectedTextDecoration && editingTextId && (
          <textarea
            ref={textareaRef}
            value={editingTextValue}
            onChange={handleTextInputChange}
            onInput={handleTextInputInput}
            onBlur={handleTextInputBlur}
            onKeyDown={handleTextInputKeyDown}
            onFocus={(e) => {
              // Select all text when focused (including placeholder) so user can immediately type
              if (editingTextValue === 'Your text…') {
                e.target.select()
              }
              // Calculate initial width on focus
              handleTextInputInput(e as any)
            }}
            className={styles.textInput}
            style={{
              left: `${(selectedTextDecoration.x + CARD_WIDTH / 2)}px`,
              top: `${(selectedTextDecoration.y + CARD_HEIGHT / 2)}px`,
              fontSize: `${selectedTextDecoration.data.fontSize || 24}px`,
              fontFamily: selectedTextDecoration.data.fontFamily || 'Arial, sans-serif',
              color: selectedTextDecoration.data.color || '#000000',
              fontWeight: selectedTextDecoration.data.fontWeight || 'normal',
              fontStyle: selectedTextDecoration.data.fontStyle || 'normal',
              textDecoration: selectedTextDecoration.data.textDecoration === 'underline' ? 'underline' : 'none',
              transform: 'translate(-50%, -50%)',
              background: 'transparent',
              border: '1px solid rgba(106, 156, 137, 0.3)',
              borderRadius: '2px',
              resize: 'none',
              overflow: 'hidden',
              width: 'auto',
              maxWidth: `${CARD_WIDTH - 40}px`,
              padding: '2px 4px',
              textAlign: 'center',
              lineHeight: '1.2',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
            autoFocus
            rows={1}
          />
        )}
      </div>
    </>
  )
}
