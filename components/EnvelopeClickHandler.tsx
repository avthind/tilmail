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
  const { currentTool, selectedSticker, mode, addDecoration, updateDecoration, decorations, textSettings, selectedDecoration, setSelectedDecoration, removeDecoration } = useAppStore()
  const lastTapRef = useRef<number>(0)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent | TouchEvent) => {
      // Allow clicking even without tool to select/deselect decorations
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
      
      // Find the EnvelopeFace plane (not the box mesh)
      const faceIntersection = intersects.find(int => {
        return int.object.userData?.isEnvelopeFace === true
      })
      
      if (faceIntersection) {
        const face = mode === 'front' ? 'front' : 'back'
        const intersection = faceIntersection
        
        // Verify we're clicking on the correct face
        const clickedFace = intersection.object.userData?.face
        if (clickedFace !== face) {
          // Clicked on wrong face (back when front is active, etc.)
          return
        }
        
        // Convert world point to local coordinates on the plane
        const worldPoint = intersection.point.clone()
        const localPoint = new THREE.Vector3()
        intersection.object.worldToLocal(localPoint.copy(worldPoint))
        
        // Postcard size is [2.4, 1.6], so coordinates range from -1.2 to 1.2 in X and -0.8 to 0.8 in Y
        const cardWidth = 2.4
        const cardHeight = 1.6
        const localX = Math.max(-cardWidth / 2, Math.min(cardWidth / 2, localPoint.x))
        const localY = Math.max(-cardHeight / 2, Math.min(cardHeight / 2, localPoint.y))
        
        // Check if clicking on an existing decoration
        const faceDecorations = decorations[face]
        const clickedDecoration = faceDecorations.find((d) => {
          const distance = Math.sqrt(Math.pow(d.x - localX, 2) + Math.pow(d.y - localY, 2))
          // Check if click is within decoration bounds (approximate size based on type)
          const hitRadius = d.type === 'sticker' ? 0.3 : d.type === 'text' ? 0.4 : 0.2
          return distance < hitRadius
        })
        
        if (clickedDecoration) {
          // Check if clicking on trash icon (top-right corner)
          const decorationX = clickedDecoration.x
          const decorationY = clickedDecoration.y
          const stickerSize = clickedDecoration.type === 'sticker' ? 0.3 : 0.4
          const trashX = decorationX + stickerSize / 2 + 0.05
          const trashY = decorationY - stickerSize / 2 - 0.05
          const clickDistance = Math.sqrt(Math.pow(localX - trashX, 2) + Math.pow(localY - trashY, 2))
          
          if (clickDistance < 0.08) {
            // Clicked on trash icon - delete decoration
            removeDecoration(face, clickedDecoration.id)
            setSelectedDecoration(null)
            return
          }
          
          // Clicked on existing decoration - select it
          setSelectedDecoration({ face, id: clickedDecoration.id })
          return
        }
        
        // Clicked on empty space - deselect if no tool active, or place new decoration
        if (!currentTool) {
          setSelectedDecoration(null)
          return
        }
        
        if (currentTool === 'sticker' && selectedSticker) {
          // Industry standard: Place sticker and keep it selected for multiple placements
          const stickerData = getStickerData(selectedSticker)
          if (stickerData) {
            addDecoration(face, {
              type: 'sticker',
              id: `sticker-${Date.now()}`,
              x: localX,
              y: localY,
              data: stickerData,
              scale: 0.15,
              rotation: 0,
            })
            // Keep sticker selected so user can place more instances
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
                Math.pow(d.x - localX, 2) + Math.pow(d.y - localY, 2)
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
              x: localX,
              y: localY,
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
        } else {
          // Clicked on empty space with tool active - deselect decoration
          setSelectedDecoration(null)
        }
      } else {
        // Clicked outside canvas or on box mesh - deselect
        setSelectedDecoration(null)
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
  }, [gl, camera, scene, currentTool, selectedSticker, mode, addDecoration, updateDecoration, decorations, textSettings, selectedDecoration, setSelectedDecoration, removeDecoration])

  return null
}
