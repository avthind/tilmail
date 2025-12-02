'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useAppStore } from '@/store/appStore'
import { getStickerData } from './StickerPicker'
import * as THREE from 'three'

export default function EnvelopeClickHandler() {
  const { gl, camera, scene } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const { currentTool, selectedSticker, mode, addDecoration, updateDecoration, decorations, textSettings } = useAppStore()
  const lastTapRef = useRef<number>(0)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (!currentTool) return

      const rect = gl.domElement.getBoundingClientRect()
      let x: number, y: number
      const now = Date.now()

      if ('touches' in event) {
        x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1
        y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1
      } else {
        x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      }

      mouse.current.set(x, y)
      raycaster.current.setFromCamera(mouse.current, camera)

      const intersects = raycaster.current.intersectObjects(scene.children, true)
      
      if (intersects.length > 0) {
        const face = mode === 'envelope-front' ? 'front' : mode === 'envelope-back' ? 'back' : 'postcard'
        const point = intersects[0].point
        
        if (currentTool === 'sticker' && selectedSticker) {
          // Place sticker at intersection point
          const stickerData = getStickerData(selectedSticker)
          if (stickerData) {
            addDecoration(face, {
              type: 'sticker',
              id: `sticker-${Date.now()}`,
              x: point.x,
              y: point.y,
              data: stickerData,
              scale: 0.15,
              rotation: 0,
            })
          }
        } else if (currentTool === 'text') {
          // Check for double tap
          const timeSinceLastTap = now - lastTapRef.current
          if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            // Double tap - find nearby text to edit
            const faceDecorations = decorations[face]
            const textDecoration = faceDecorations.find((d) => {
              if (d.type !== 'text') return false
              const distance = Math.sqrt(
                Math.pow(d.x - point.x, 2) + Math.pow(d.y - point.y, 2)
              )
              return distance < 0.5 // Within 0.5 units
            })
            
            if (textDecoration) {
              // Edit existing text
              const newText = prompt('Edit text:', textDecoration.data.text || '')
              if (newText !== null) {
                updateDecoration(face, textDecoration.id, {
                  ...textDecoration.data,
                  text: newText,
                })
              }
            }
          } else {
            // Single tap - place new text
            addDecoration(face, {
              type: 'text',
              id: `text-${Date.now()}`,
              x: point.x,
              y: point.y,
              data: {
                text: 'Your text…',
                fontSize: textSettings.fontSize,
                color: textSettings.color,
                fontFamily: textSettings.fontFamily,
                fontWeight: textSettings.fontWeight || 'normal',
                textDecoration: textSettings.textDecoration || 'none',
              },
            })
          }
          lastTapRef.current = now
        }
      }
    }

    const canvas = gl.domElement
    canvas.addEventListener('click', handleClick as any)
    canvas.addEventListener('touchend', handleClick as any)

    return () => {
      canvas.removeEventListener('click', handleClick as any)
      canvas.removeEventListener('touchend', handleClick as any)
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
      }
    }
  }, [gl, camera, scene, currentTool, selectedSticker, mode, addDecoration, updateDecoration, decorations])

  return null
}
