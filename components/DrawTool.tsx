'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import styles from './DrawTool.module.css'

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Yellow', value: '#ffd700' },
  { name: 'Pink', value: '#ffb6c1' },
  { name: 'Blue', value: '#87ceeb' },
]

const SIZES = [
  { name: 'Thin', value: 2 },
  { name: 'Medium', value: 4 },
  { name: 'Thick', value: 8 },
]

export default function DrawTool() {
  const { mode, addDecoration } = useAppStore()
  const [color, setColor] = useState(COLORS[0].value)
  const [lineWidth, setLineWidth] = useState(SIZES[1].value)
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentPath, setCurrentPath] = useState<number[][]>([])
  const [paths, setPaths] = useState<number[][]>([])
  const [history, setHistory] = useState<number[][][]>([])
  const [redoHistory, setRedoHistory] = useState<number[][][]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 512
    canvas.height = 512

    // Clear and draw all paths
    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    paths.forEach((path) => {
      if (path.length > 0) {
        ctx.beginPath()
        ctx.moveTo(path[0][0], path[0][1])
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i][0], path[i][1])
        }
        ctx.stroke()
      }
    })

    // Draw current path
    if (currentPath.length > 0) {
      ctx.beginPath()
      ctx.moveTo(currentPath[0][0], currentPath[0][1])
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i][0], currentPath[i][1])
      }
      ctx.stroke()
    }
  }, [paths, currentPath, color, lineWidth])

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    let x: number, y: number

    if ('touches' in e) {
      // Two fingers = move/zoom canvas (do not draw)
      if (e.touches.length > 1) return null
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    // Scale to canvas size
    x = (x / rect.width) * canvas.width
    y = (y / rect.height) * canvas.height

    return [x, y]
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const coords = getCoordinates(e)
    if (coords) {
      setIsDrawing(true)
      setCurrentPath([coords])
      setRedoHistory([]) // Clear redo history when starting new stroke
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return

    const coords = getCoordinates(e)
    if (coords) {
      setCurrentPath((prev) => [...prev, coords])
    }
  }

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 0) {
      setHistory((prev) => [...prev, paths])
      setPaths((prev) => [...prev, currentPath])
      setCurrentPath([])
    }
    setIsDrawing(false)
  }

  const handleSave = () => {
    if (paths.length === 0 && currentPath.length === 0) return

    const face = mode === 'envelope-front' ? 'front' : mode === 'envelope-back' ? 'back' : 'postcard'
    const decoration = {
      type: 'drawing' as const,
      id: `drawing-${Date.now()}`,
      x: 0,
      y: 0,
      data: {
        paths: [...paths, currentPath].filter((p) => p.length > 0),
        color,
        lineWidth,
      },
    }

    addDecoration(face, decoration)
    setPaths([])
    setCurrentPath([])
    setHistory([])
    setRedoHistory([])
  }

  const handleUndo = () => {
    if (currentPath.length > 0) {
      setCurrentPath([])
    } else if (paths.length > 0) {
      const newPaths = paths.slice(0, -1)
      setRedoHistory((prev) => [...prev, paths])
      setPaths(newPaths)
      if (history.length > 0) {
        setHistory((prev) => prev.slice(0, -1))
      }
    }
  }

  const handleRedo = () => {
    if (redoHistory.length > 0) {
      const lastState = redoHistory[redoHistory.length - 1]
      setPaths(lastState)
      setHistory((prev) => [...prev, paths])
      setRedoHistory((prev) => prev.slice(0, -1))
    }
  }

  const handleDelete = () => {
    setPaths([])
    setCurrentPath([])
    setHistory([])
    setRedoHistory([])
  }

  return (
    <div className={styles.drawTool}>
      <div className={styles.colorPicker}>
        {COLORS.map((c) => (
          <button
            key={c.value}
            className={`${styles.colorButton} ${color === c.value ? styles.active : ''}`}
            style={{ backgroundColor: c.value }}
            onClick={() => setColor(c.value)}
            aria-label={c.name}
            title={c.name}
          />
        ))}
      </div>
      <div className={styles.sizePicker}>
        {SIZES.map((s) => (
          <button
            key={s.value}
            className={`${styles.sizeButton} ${lineWidth === s.value ? styles.active : ''}`}
            onClick={() => setLineWidth(s.value)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className={styles.actions}>
        <button
          className={styles.undoButton}
          onClick={handleUndo}
          disabled={paths.length === 0 && currentPath.length === 0}
        >
          Undo
        </button>
        <button
          className={styles.redoButton}
          onClick={handleRedo}
          disabled={redoHistory.length === 0}
        >
          Redo
        </button>
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          disabled={paths.length === 0 && currentPath.length === 0}
        >
          Trash
        </button>
        <button className={styles.saveButton} onClick={handleSave}>
          Apply to {mode === 'envelope-front' ? 'Front' : mode === 'envelope-back' ? 'Back' : 'Card'}
        </button>
      </div>
    </div>
  )
}
