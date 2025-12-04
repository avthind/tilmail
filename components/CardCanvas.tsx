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
  const lastTapRef = useRef<number>(0)
  const justFinishedDrawingRef = useRef(false) // Track if we just finished drawing to skip redraw
  const previousModeRef = useRef(mode)

  // Trigger flip animation when mode changes
  useEffect(() => {
    if (previousModeRef.current !== mode) {
      setIsFlipping(true)
      const timer = setTimeout(() => {
        setIsFlipping(false)
      }, 600) // Match animation duration
      previousModeRef.current = mode
      return () => clearTimeout(timer)
    }
  }, [mode])

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

    // Check if we actually need to redraw
    const face = mode === 'front' ? 'front' : 'back'
    const faceDecorations = decorations[face]
    const prevFaceDecorations = prevDecorationsRef.current[face]
    
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
    const decorationsChanged = 
      faceDecorations.length !== prevFaceDecorations.length ||
      mode !== prevModeRef.current ||
      faceDecorations.some((dec, i) => {
        const prevDec = prevFaceDecorations[i]
        return !prevDec || dec.id !== prevDec.id || dec.x !== prevDec.x || dec.y !== prevDec.y
      })

    // Check if only selection changed (simple reference/ID comparison)
    const selectionChanged = 
      (selectedDecoration?.face !== prevSelectedDecorationRef.current?.face) ||
      (selectedDecoration?.id !== prevSelectedDecorationRef.current?.id)

    // If only selection changed, check if we need to redraw
    if (!decorationsChanged && selectionChanged) {
      // Check if the selected decoration type needs visual selection indicators
      const needsRedraw = selectedDecoration && (() => {
        const dec = faceDecorations.find(d => d.id === selectedDecoration.id)
        // Only stickers and text show selection indicators
        return dec && (dec.type === 'sticker' || dec.type === 'text')
      })() || prevSelectedDecorationRef.current && (() => {
        const prevDec = prevFaceDecorations.find(d => d.id === prevSelectedDecorationRef.current!.id)
        // Need to redraw to remove previous selection indicator
        return prevDec && (prevDec.type === 'sticker' || prevDec.type === 'text')
      })()

      if (!needsRedraw) {
        // Drawing decorations don't show selection indicators, so skip redraw
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

    // Draw all decorations
    const drawDecorations = async () => {
      // Re-fill background with white
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const decoration of faceDecorations) {
        const isSelected = selectedDecoration?.face === face && selectedDecoration?.id === decoration.id

        if (decoration.type === 'sticker') {
          const scale = decoration.data.scale || 0.15
          const stickerSize = 64 * scale
          const x = (decoration.x + CARD_WIDTH / 2)
          const y = (decoration.y + CARD_HEIGHT / 2)

          // Draw selection border
          if (isSelected) {
            ctx.strokeStyle = '#6a9c89'
            ctx.lineWidth = 3
            ctx.setLineDash([])
            ctx.strokeRect(
              x - stickerSize / 2 - 8,
              y - stickerSize / 2 - 8,
              stickerSize + 16,
              stickerSize + 16
            )

            // Draw trash icon
            const trashSize = 24
            const trashX = x + stickerSize / 2 + 4
            const trashY = y - stickerSize / 2 - 4

            ctx.fillStyle = '#ff4444'
            ctx.beginPath()
            ctx.arc(trashX, trashY, trashSize / 2, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(trashX - 6, trashY - 6)
            ctx.lineTo(trashX + 6, trashY + 6)
            ctx.moveTo(trashX + 6, trashY - 6)
            ctx.lineTo(trashX - 6, trashY + 6)
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
          const fontStyle = fontWeight === 'italic' ? 'italic' : 'normal'
          
          ctx.font = `${fontWeight === 'bold' ? 'bold ' : ''}${fontStyle} ${fontSize}px ${fontFamily}`
          ctx.fillStyle = decoration.data.color || '#000000'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const x = (decoration.x + CARD_WIDTH / 2)
          const y = (decoration.y + CARD_HEIGHT / 2)

          // Draw selection border
          if (isSelected) {
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

            // Draw trash icon
            const trashSize = 20
            const trashX = x + textWidth / 2 + 4
            const trashY = y - textHeight / 2 - 4

            ctx.fillStyle = '#ff4444'
            ctx.beginPath()
            ctx.arc(trashX, trashY, trashSize / 2, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(trashX - 5, trashY - 5)
            ctx.lineTo(trashX + 5, trashY + 5)
            ctx.moveTo(trashX + 5, trashY - 5)
            ctx.lineTo(trashX - 5, trashY + 5)
            ctx.stroke()
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
            decoration.data.paths.forEach((path: number[][]) => {
              if (path.length > 0) {
                ctx.beginPath()
                const startX = (path[0][0] + CARD_WIDTH / 2)
                const startY = (path[0][1] + CARD_HEIGHT / 2)
                ctx.moveTo(startX, startY)
                for (let i = 1; i < path.length; i++) {
                  const x = (path[i][0] + CARD_WIDTH / 2)
                  const y = (path[i][1] + CARD_HEIGHT / 2)
                  ctx.lineTo(x, y)
                }
                ctx.stroke()
              }
            })
          }
        }
      }

      // Don't draw current path here - it's drawn directly in handleMouseMove
      // This prevents flashing/vibrating while drawing
    }

    drawDecorations()
    
    // Update refs after redraw
    prevDecorationsRef.current = decorations
    prevModeRef.current = mode
    prevSelectedDecorationRef.current = selectedDecoration
  }, [decorations, mode, selectedDecoration, drawSettings])

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
    const face = mode === 'front' ? 'front' : 'back'
    const faceDecorations = decorations[face]
    
    // Check decorations in reverse order (top-most first)
    for (let i = faceDecorations.length - 1; i >= 0; i--) {
      const d = faceDecorations[i]
      const distance = Math.sqrt(
        Math.pow(d.x - coords.x, 2) + Math.pow(d.y - coords.y, 2)
      )
      
      // Better hit detection based on type
      let hitRadius: number
      if (d.type === 'sticker') {
        const scale = d.data.scale || 0.15
        hitRadius = (64 * scale) / 2 + 5 // Sticker radius + padding
      } else if (d.type === 'text') {
        // Approximate text bounds
        hitRadius = (d.data.fontSize || 24) / 2 + 10
      } else {
        hitRadius = 20 // Drawing
      }
      
      if (distance < hitRadius) {
        return d
      }
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)
    if (!coords) return

    // Don't start drawing if clicking on a decoration
    if (currentTool === 'draw') {
      const decoration = findDecorationAtPoint(coords)
      if (decoration) {
        // Select decoration instead of drawing
        setSelectedDecoration({ face: mode === 'front' ? 'front' : 'back', id: decoration.id })
        setIsDrawing(false)
        return
      }
      // Start drawing
      setIsDrawing(true)
      setCurrentPath([{ x: coords.canvasX, y: coords.canvasY }])
      return
    }

    const decoration = findDecorationAtPoint(coords)
    
    if (decoration) {
      // Check if clicking on trash icon
      const face = mode === 'front' ? 'front' : 'back'
      const stickerSize = decoration.type === 'sticker' ? 30 : 40
      const trashX = decoration.x + stickerSize / 2 + 5
      const trashY = decoration.y - stickerSize / 2 - 5
      const clickDistance = Math.sqrt(
        Math.pow(coords.x - trashX, 2) + Math.pow(coords.y - trashY, 2)
      )

      if (clickDistance < 12 && selectedDecoration?.id === decoration.id) {
        removeDecoration(face, decoration.id)
        setSelectedDecoration(null)
        return
      }

      // Start dragging or select
      if (decoration.type === 'text' || decoration.type === 'sticker') {
        setSelectedDecoration({ face, id: decoration.id })
        setIsDragging(true)
        setDragStart({ x: coords.x, y: coords.y })
      } else {
        setSelectedDecoration({ face, id: decoration.id })
      }
    } else {
      // Clicked on empty space
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
            scale: 0.15,
            rotation: 0,
          }
          addDecoration(face, newDecoration)
          // Auto-select newly placed sticker
          setSelectedDecoration({ face, id: newDecoration.id })
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
        // Auto-select and start editing
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

    // Drag decoration
    if (isDragging && selectedDecoration && dragStart) {
      const face = selectedDecoration.face
      const decoration = decorations[face].find(d => d.id === selectedDecoration.id)
      if (decoration && (decoration.type === 'sticker' || decoration.type === 'text')) {
        const deltaX = coords.x - dragStart.x
        const deltaY = coords.y - dragStart.y
        
        // Update position directly
        updateDecorationPosition(face, decoration.id, decoration.x + deltaX, decoration.y + deltaY)
      }
      setDragStart({ x: coords.x, y: coords.y })
    }
  }

  const handleMouseUp = () => {
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
      const face = mode === 'front' ? 'front' : 'back'
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
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: isDragging ? 'grabbing' :
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
