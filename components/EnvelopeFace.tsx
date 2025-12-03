'use client'

import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '@/store/appStore'

interface EnvelopeFaceProps {
  face: 'front' | 'back'
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
}

export default function EnvelopeFace({
  face,
  position,
  rotation,
  size,
}: EnvelopeFaceProps) {
  const { decorations, selectedDecoration } = useAppStore()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  // Create canvas for this face
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    // Initialize with white background immediately
    const ctx = c.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, c.width, c.height)
    }
    return c
  }, [])

  useEffect(() => {
    canvasRef.current = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Always start with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Update texture immediately
    if (textureRef.current) {
      textureRef.current.needsUpdate = true
    }

    // Draw decorations
    const faceDecorations = decorations[face]
    
    // Use async function to handle image loading
    const drawDecorations = async () => {
      // Clear and fill canvas with white background (already done above, but ensure it's there)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      for (const decoration of faceDecorations) {
        const isSelected = selectedDecoration?.face === face && selectedDecoration?.id === decoration.id
        const scale = decoration.data.scale || 0.1
        const x = ((decoration.x + size[0] / 2) / size[0]) * canvas.width
        const y = ((decoration.y + size[1] / 2) / size[1]) * canvas.height
        
        if (decoration.type === 'sticker') {
          // Draw sticker
          const stickerSize = 64 * scale // Base size from SVG
          
          // Draw selection border if selected
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
            
            // Trash icon background circle
            ctx.fillStyle = '#ff4444'
            ctx.beginPath()
            ctx.arc(trashX, trashY, trashSize / 2, 0, Math.PI * 2)
            ctx.fill()
            
            // Trash icon (X)
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
          
          // Draw placeholder circle for sticker
          ctx.fillStyle = decoration.data.color || '#ff6b6b'
          ctx.beginPath()
          ctx.arc(x, y, 20 * scale, 0, Math.PI * 2)
          ctx.fill()
          
          // If URL provided, try to load image
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
                x - (img.width * scale) / 2,
                y - (img.height * scale) / 2,
                img.width * scale,
                img.height * scale
              )
            } catch (err) {
              // Fallback to placeholder
              console.warn('Failed to load sticker image:', err)
            }
          }
        } else if (decoration.type === 'text') {
          // Draw text
          const fontFamily = decoration.data.fontFamily || 'Arial, sans-serif'
          const fontWeight = decoration.data.fontWeight || 'normal'
          const fontSize = decoration.data.fontSize || 24
          const fontStyle = fontWeight === 'italic' ? 'italic' : 'normal'
          ctx.font = `${fontWeight === 'bold' ? 'bold ' : ''}${fontStyle} ${fontSize}px ${fontFamily}`
          ctx.fillStyle = decoration.data.color || '#000000'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const x = ((decoration.x + size[0] / 2) / size[0]) * canvas.width
          const y = ((decoration.y + size[1] / 2) / size[1]) * canvas.height
          
          if (decoration.data.textDecoration === 'underline') {
            ctx.strokeStyle = decoration.data.color || '#000000'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(x - 50, y + fontSize / 2)
            ctx.lineTo(x + 50, y + fontSize / 2)
            ctx.stroke()
          }
          
          ctx.fillText(decoration.data.text || '', x, y)
          
          // Draw selection border for text if selected
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
        } else if (decoration.type === 'drawing') {
          // Draw drawing paths
          if (decoration.data.paths) {
            ctx.strokeStyle = decoration.data.color || '#000000'
            ctx.lineWidth = decoration.data.lineWidth || 2
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            decoration.data.paths.forEach((path: number[][]) => {
              if (path.length > 0) {
                ctx.beginPath()
                const startX = ((path[0][0] + size[0] / 2) / size[0]) * canvas.width
                const startY = ((path[0][1] + size[1] / 2) / size[1]) * canvas.height
                ctx.moveTo(startX, startY)
                for (let i = 1; i < path.length; i++) {
                  const x = ((path[i][0] + size[0] / 2) / size[0]) * canvas.width
                  const y = ((path[i][1] + size[1] / 2) / size[1]) * canvas.height
                  ctx.lineTo(x, y)
                }
                ctx.stroke()
              }
            })
          }
        }
      }
      
      if (textureRef.current) {
        textureRef.current.needsUpdate = true
      }
    }
    
    drawDecorations().then(() => {
      if (textureRef.current) {
        textureRef.current.needsUpdate = true
      }
    })
  }, [canvas, decorations, face, size, selectedDecoration])

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    textureRef.current = tex
    // Ensure texture is updated immediately with white background
    setTimeout(() => {
      tex.needsUpdate = true
    }, 0)
    return tex
  }, [canvas])

  return (
    <mesh 
      position={position} 
      rotation={rotation}
      userData={{ isEnvelopeFace: true, face }}
    >
      <planeGeometry args={size} />
      <meshStandardMaterial map={texture} color="#FFFFFF" />
    </mesh>
  )
}
