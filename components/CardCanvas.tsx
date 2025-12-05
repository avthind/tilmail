'use client'

import { useRef, useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { getStickerData } from './StickerPicker'
import styles from './CardCanvas.module.css'

// Card dimensions matching the 3D postcard
const CARD_WIDTH = 480 // pixels
const CARD_HEIGHT = 320 // pixels (2.4:1.6 ratio)
const CARD_BACKGROUND_COLOR = '#F5E6D3' // Card background color (light beige)

export default function CardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
    updateDecorationPosition,
    drawSettings,
  } = useAppStore()
  
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingTextValue, setEditingTextValue] = useState('')
  const [isFlipping, setIsFlipping] = useState(false)
  const [displayMode, setDisplayMode] = useState(mode) // Mode to display (may lag behind actual mode during flip)
  const [hoveredDecoration, setHoveredDecoration] = useState<{ face: 'front' | 'back', id: string } | null>(null)
  const lastTapRef = useRef<number>(0)
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to deselect
      if (e.key === 'Escape') {
        setSelectedDecoration(null)
        setEditingTextId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedDecoration])

  // Track previous state to avoid unnecessary redraws
  const prevDecorationsRef = useRef(decorations)
  const prevModeRef = useRef(mode)
  const prevSelectedDecorationRef = useRef(selectedDecoration)
  const prevToolRef = useRef(currentTool)

  // Draw all decorations on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size accounting for device pixel ratio (for crisp rendering on high-DPI displays)
    const dpr = window.devicePixelRatio || 1
    const needsInit = canvas.width !== CARD_WIDTH * dpr || canvas.height !== CARD_HEIGHT * dpr
    if (needsInit) {
      // Set internal resolution to account for device pixel ratio
      canvas.width = CARD_WIDTH * dpr
      canvas.height = CARD_HEIGHT * dpr
      // Scale the context to match device pixel ratio
      ctx.scale(dpr, dpr)
      // Set CSS size to display size (not internal resolution)
      canvas.style.width = `${CARD_WIDTH}px`
      canvas.style.height = `${CARD_HEIGHT}px`
      // Initialize with card background color
      ctx.fillStyle = CARD_BACKGROUND_COLOR
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
    }

    // Use displayMode (which may lag during flip) to determine which face to show
    const face = displayMode === 'front' ? 'front' : 'back'
    const faceDecorations = decorations[face]
    const prevFace = prevModeRef.current === 'front' ? 'front' : 'back'
    const prevFaceDecorations = prevDecorationsRef.current[prevFace]
    
    // If we just finished drawing, the decoration is already on canvas, skip redraw
    if (justFinishedDrawingRef.current) {
      justFinishedDrawingRef.current = false
      // Update refs without redrawing
      prevDecorationsRef.current = decorations
      prevModeRef.current = mode
      prevSelectedDecorationRef.current = selectedDecoration
      return
    }

    // Check if decorations actually changed (more efficient comparison)
    const modeChanged = displayMode !== prevModeRef.current
    const decorationsChanged = 
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
    
    // Skip redraw if nothing changed (but always redraw if tool changed)
    if (!decorationsChanged && !selectionChanged && !toolChanged) {
      return
    }

    // Clear canvas with card background color
    ctx.fillStyle = CARD_BACKGROUND_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // If flipping, only show white background (hide all decorations)
    if (isFlipping) {
      // Don't update refs during flip - keep previous state
      return
    }

    // Draw all decorations
    const drawDecorations = async () => {
      // Re-fill background with card background color
      ctx.fillStyle = CARD_BACKGROUND_COLOR
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const decoration of faceDecorations) {
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

          // Draw selection border (only in grab mode for stickers)
          if (currentTool === 'grab' && showFullSelection) {
            ctx.strokeStyle = '#6a9c89'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.strokeRect(
              x - stickerSize / 2 - 8,
              y - stickerSize / 2 - 8,
              stickerSize + 16,
              stickerSize + 16
            )
            ctx.setLineDash([])
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

          // Measure text width for proper underline and border positioning
            const textWidth = ctx.measureText(decoration.data.text || '').width
            const textHeight = fontSize
            
          // Draw selection border
          // Only show borders when the appropriate tool is explicitly active
          // Text tool: full line border (solid) for selection or editing
          // IMPORTANT: Only draw text border when text tool is ACTIVE
          // Use strict equality and multiple checks to prevent border in other tools
          if (decoration.type === 'text' && currentTool === 'text') {
            // Triple-check: only show if text tool is active AND (editing or selected)
            // This ensures border never shows in other tools
            const toolIsText = currentTool === 'text'
            const isTextEditing = toolIsText && editingTextId === decoration.id
            const isTextSelected = toolIsText && selectedDecoration?.face === face && selectedDecoration?.id === decoration.id
            
            // Final defensive check: ONLY draw if currentTool is explicitly 'text'
            if (toolIsText && (isTextEditing || isTextSelected)) {
              ctx.strokeStyle = '#6a9c89'
              ctx.lineWidth = 2
              ctx.setLineDash([]) // Solid line
              ctx.strokeRect(
                x - textWidth / 2 - 8,
                y - textHeight / 2 - 8,
                textWidth + 16,
                textHeight + 16
              )
            }
          } else if (currentTool === 'grab' && showFullSelection) {
            // Grab tool: dotted border for selection
            ctx.strokeStyle = '#6a9c89'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5]) // Dotted line
            ctx.strokeRect(
              x - textWidth / 2 - 8,
              y - textHeight / 2 - 8,
              textWidth + 16,
              textHeight + 16
            )
            ctx.setLineDash([])
          }

          // Don't draw text on canvas when editing - the input field handles it
          // This makes it look like you're editing directly on the canvas
          const isCurrentlyEditing = editingTextId === decoration.id && currentTool === 'text'
          
          if (!isCurrentlyEditing) {
            // Draw text first
            ctx.fillText(decoration.data.text || '', x, y)
            
            // Draw underline after text, using actual text width
            if (decoration.data.textDecoration === 'underline') {
              ctx.strokeStyle = decoration.data.color || '#000000'
              ctx.lineWidth = Math.max(1, fontSize / 20) // Scale underline thickness with font size
              ctx.beginPath()
              const underlineY = y + fontSize / 2 + 2 // Position below text baseline
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
            
            // Draw selection border and trash icon if selected (only in grab mode)
            if (currentTool === 'grab' && showFullSelection && minX !== Infinity) {
              const padding = 8
              ctx.strokeStyle = '#6a9c89'
              ctx.lineWidth = 2
              ctx.setLineDash([5, 5])
              ctx.strokeRect(
                minX - padding,
                minY - padding,
                maxX - minX + padding * 2,
                maxY - minY + padding * 2
              )
              ctx.setLineDash([])
            }
          }
        }
      }

      // Don't draw current path here - it's drawn directly in handleMouseMove
      // This prevents flashing/vibrating while drawing
    }

    drawDecorations()
    
    // Update refs after redraw
    prevDecorationsRef.current = decorations
    prevModeRef.current = displayMode
    prevSelectedDecorationRef.current = selectedDecoration
    prevToolRef.current = currentTool
  }, [decorations, displayMode, selectedDecoration, drawSettings, isFlipping, currentTool, editingTextId])

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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)
    if (!coords) return

    // Start drawing (draw over decorations, don't select them)
    if (currentTool === 'draw') {
      setIsDrawing(true)
      setCurrentPath([{ x: coords.canvasX, y: coords.canvasY }])
      return
    }

    const decoration = findDecorationAtPoint(coords)
    
    // Text tool: clicking on existing text selects it
    if (decoration && decoration.type === 'text' && currentTool === 'text') {
      const face = displayMode === 'front' ? 'front' : 'back'
      setSelectedDecoration({ face, id: decoration.id })
      // Start editing if double-clicked, otherwise just select
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
        // Auto-select the new text (but don't start editing immediately)
        // User can double-click to edit if they want
        setSelectedDecoration({ face, id: newDecoration.id })
      } else {
        setSelectedDecoration(null)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
      // Draw line segment directly on canvas for real-time feedback
      const canvas = canvasRef.current
      if (canvas && currentPath.length > 0) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.strokeStyle = drawSettings.color
          ctx.lineWidth = drawSettings.lineWidth
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y)
          ctx.lineTo(coords.canvasX, coords.canvasY)
          ctx.stroke()
        }
      }
      
      // Add point to current path state
      setCurrentPath((prev) => [...prev, { x: coords.canvasX, y: coords.canvasY }])
      return
    }

    // Drag decoration (only in grab mode)
    if (isDragging && selectedDecoration && dragStart && currentTool === 'grab') {
      const face = selectedDecoration.face
      const decoration = decorations[face].find(d => d.id === selectedDecoration.id)
      if (decoration) {
        const deltaX = coords.x - dragStart.x
        const deltaY = coords.y - dragStart.y
        
        if (decoration.type === 'drawing' && decoration.data.paths) {
          // For drawings, update all path points
          const updatedPaths = decoration.data.paths.map((path: number[][]) =>
            path.map((point: number[]) => [point[0] + deltaX, point[1] + deltaY])
          )
          updateDecoration(face, decoration.id, {
            ...decoration.data,
            paths: updatedPaths,
          })
          // Also update the x, y position
          updateDecorationPosition(face, decoration.id, decoration.x + deltaX, decoration.y + deltaY)
        } else if (decoration.type === 'sticker' || decoration.type === 'text') {
          // Update position directly for stickers and text
          updateDecorationPosition(face, decoration.id, decoration.x + deltaX, decoration.y + deltaY)
        }
      }
      setDragStart({ x: coords.x, y: coords.y })
    }
  }

  const handleMouseUp = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    
    if (isDrawing && currentPath.length > 0 && currentTool === 'draw') {
      const face = mode === 'front' ? 'front' : 'back'
      // Mark that we just finished drawing to skip redraw
      justFinishedDrawingRef.current = true
      addDecoration(face, {
        type: 'drawing',
        id: `drawing-${Date.now()}`,
        x: 0,
        y: 0,
        data: {
          paths: [currentPath.map(p => [p.x - CARD_WIDTH / 2, p.y - CARD_HEIGHT / 2])],
          color: drawSettings.color,
          lineWidth: drawSettings.lineWidth,
        },
      })
      setCurrentPath([])
      // Don't trigger redraw - the drawing is already on the canvas
    }
    setIsDrawing(false)
    setIsDragging(false)
    setDragStart(null)
    // Clear hover state on mouse up
    setHoveredDecoration(null)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
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

  const handleTouchEnd = () => {
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
    }
  }


  // Text editing input (positioned absolutely)
  const selectedTextDecoration = selectedDecoration && editingTextId
    ? decorations[selectedDecoration.face]?.find(d => d.id === editingTextId && d.type === 'text')
    : null

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Update canvas text in real-time as user types
    if (selectedTextDecoration && editingTextId) {
      const face = selectedDecoration!.face
      updateDecoration(face, editingTextId, {
        ...selectedTextDecoration.data,
        text: newValue || '',
      })
    }
  }
  
  const handleTextInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If placeholder is selected and user types, clear it first
    if (editingTextValue === 'Your text…' && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      // User typed a character while placeholder is shown - clear it
      setEditingTextValue('')
      e.preventDefault()
      // Insert the character manually
      const input = e.currentTarget
      const newValue = e.key
      setEditingTextValue(newValue)
      if (selectedTextDecoration && editingTextId) {
        const face = selectedDecoration!.face
        updateDecoration(face, editingTextId, {
          ...selectedTextDecoration.data,
          text: newValue,
        })
      }
      // Move cursor to end
      setTimeout(() => {
        input.setSelectionRange(newValue.length, newValue.length)
      }, 0)
      return
    }
    
    if (e.key === 'Enter') {
      // Save text before blurring to ensure it's visible immediately
      if (editingTextId && selectedTextDecoration) {
        const face = selectedDecoration!.face
        updateDecoration(face, editingTextId, {
          ...selectedTextDecoration.data,
          text: editingTextValue || '',
        })
      }
      // Small delay to ensure decoration is updated before blur
      setTimeout(() => {
        e.currentTarget.blur()
      }, 0)
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
          // Save the text value from the input field
          // This ensures the text is saved before we clear editingTextId
          updateDecoration(face, editingTextId, {
            ...decoration.data,
            text: finalText,
          })
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
          <input
            type="text"
            value={editingTextValue}
            onChange={handleTextInputChange}
            onBlur={handleTextInputBlur}
            onKeyDown={handleTextInputKeyDown}
            onFocus={(e) => {
              // Select all text when focused (including placeholder) so user can immediately type
              if (editingTextValue === 'Your text…') {
                e.target.select()
              }
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
              border: 'none',
              width: 'auto',
              minWidth: '0',
              padding: '0',
              textAlign: 'center',
            }}
            autoFocus
          />
        )}
      </div>
    </>
  )
}
