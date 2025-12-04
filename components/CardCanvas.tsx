'use client'

import { useRef, useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { getStickerData } from './StickerPicker'
import styles from './CardCanvas.module.css'

// Card dimensions matching the 3D postcard
const CARD_WIDTH = 480 // pixels
const CARD_HEIGHT = 320 // pixels (2.4:1.6 ratio)

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected decoration
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDecoration) {
        e.preventDefault()
        removeDecoration(selectedDecoration.face, selectedDecoration.id)
        setSelectedDecoration(null)
      }
      // ESC to deselect
      if (e.key === 'Escape') {
        setSelectedDecoration(null)
        setEditingTextId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedDecoration, removeDecoration, setSelectedDecoration])

  // Track previous state to avoid unnecessary redraws
  const prevDecorationsRef = useRef(decorations)
  const prevModeRef = useRef(mode)
  const prevSelectedDecorationRef = useRef(selectedDecoration)

  // Draw all decorations on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size (only once)
    const needsInit = canvas.width !== CARD_WIDTH || canvas.height !== CARD_HEIGHT
    if (needsInit) {
      canvas.width = CARD_WIDTH
      canvas.height = CARD_HEIGHT
      // Initialize with white background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
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
        return !prevDec || dec.id !== prevDec.id || dec.x !== prevDec.x || dec.y !== prevDec.y
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

    // Skip redraw if nothing changed
    if (!decorationsChanged && !selectionChanged) {
      return
    }

    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // If flipping, only show white background (hide all decorations)
    if (isFlipping) {
      // Don't update refs during flip - keep previous state
      return
    }

    // Draw all decorations
    const drawDecorations = async () => {
      // Re-fill background with white
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const decoration of faceDecorations) {
        // Show selection indicators in grab mode or when text tool is active and text is selected
        const isSelected = selectedDecoration?.face === face && selectedDecoration?.id === decoration.id
        const showFullSelection = currentTool === 'grab' && isSelected
        const showTextSelection = currentTool === 'text' && isSelected && decoration.type === 'text'

        if (decoration.type === 'sticker') {
          const scale = decoration.data.scale || 0.15
          const stickerSize = 64 * scale
          const x = (decoration.x + CARD_WIDTH / 2)
          const y = (decoration.y + CARD_HEIGHT / 2)

          // Draw selection border (only in grab mode for stickers)
          if (showFullSelection) {
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
          const fontStyle = fontWeight === 'italic' ? 'italic' : 'normal'
          
          ctx.font = `${fontWeight === 'bold' ? 'bold ' : ''}${fontStyle} ${fontSize}px ${fontFamily}`
          ctx.fillStyle = decoration.data.color || '#000000'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const x = (decoration.x + CARD_WIDTH / 2)
          const y = (decoration.y + CARD_HEIGHT / 2)

          // Draw selection border
          if (showTextSelection || showFullSelection) {
            const textWidth = ctx.measureText(decoration.data.text || '').width
            const textHeight = fontSize
            
            ctx.strokeStyle = '#6a9c89'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.strokeRect(
              x - textWidth / 2 - 8,
              y - textHeight / 2 - 8,
              textWidth + 16,
              textHeight + 16
            )
            ctx.setLineDash([])
          }

          if (decoration.data.textDecoration === 'underline') {
            ctx.strokeStyle = decoration.data.color || '#000000'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(x - 50, y + fontSize / 2)
            ctx.lineTo(x + 50, y + fontSize / 2)
            ctx.stroke()
          }

          ctx.fillText(decoration.data.text || '', x, y)
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
            if (showFullSelection && minX !== Infinity) {
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
  }, [decorations, displayMode, selectedDecoration, drawSettings, isFlipping, currentTool])

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
            textDecoration: textSettings.textDecoration || 'none',
          },
        }
        addDecoration(face, newDecoration)
        // Auto-select and start editing immediately
        setSelectedDecoration({ face, id: newDecoration.id })
        setEditingTextId(newDecoration.id)
        setEditingTextValue('Your text…')
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
    setEditingTextValue(e.target.value)
  }

  const handleTextInputBlur = () => {
    if (selectedTextDecoration && editingTextId) {
      const face = selectedDecoration!.face
      updateDecoration(face, editingTextId, {
        ...selectedTextDecoration.data,
        text: editingTextValue || 'Your text…',
      })
    }
    setEditingTextId(null)
  }

  const handleTextInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
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
            className={styles.textInput}
            style={{
              left: `${(selectedTextDecoration.x + CARD_WIDTH / 2)}px`,
              top: `${(selectedTextDecoration.y + CARD_HEIGHT / 2)}px`,
              fontSize: `${selectedTextDecoration.data.fontSize || 24}px`,
              fontFamily: selectedTextDecoration.data.fontFamily || 'Arial, sans-serif',
              color: selectedTextDecoration.data.color || '#000000',
              fontWeight: selectedTextDecoration.data.fontWeight || 'normal',
              fontStyle: selectedTextDecoration.data.fontWeight === 'italic' ? 'italic' : 'normal',
              textDecoration: selectedTextDecoration.data.textDecoration === 'underline' ? 'underline' : 'none',
              transform: 'translate(-50%, -50%)',
            }}
            autoFocus
          />
        )}
      </div>
    </>
  )
}
