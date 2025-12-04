'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/store/appStore'
import EnvelopeFace from './EnvelopeFace'

export default function Postcard() {
  const cardRef = useRef<THREE.Group>(null)
  const { mode } = useAppStore()
  const targetRotationRef = useRef({ y: 0 })
  const [visibleFace, setVisibleFace] = useState<'front' | 'back'>(mode)

  // Update target rotation when mode changes
  useEffect(() => {
    targetRotationRef.current.y = mode === 'back' ? Math.PI : 0
    setVisibleFace(mode)
  }, [mode])

  // Smoothly animate rotation to create flip effect
  // Switch visible face when rotation passes 90 degrees
  useFrame(() => {
    if (cardRef.current) {
      const currentRotation = cardRef.current.rotation.y
      cardRef.current.rotation.y = THREE.MathUtils.lerp(
        currentRotation,
        targetRotationRef.current.y,
        0.15
      )
      
      // Switch face visibility when rotation crosses 90 degrees (π/2)
      const normalizedRotation = ((cardRef.current.rotation.y % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2)
      if (normalizedRotation > Math.PI / 2 && normalizedRotation < (Math.PI * 3) / 2) {
        if (visibleFace !== 'back') setVisibleFace('back')
      } else {
        if (visibleFace !== 'front') setVisibleFace('front')
      }
    }
  })

  return (
    <group ref={cardRef} position={[-1.2, 0, 0]}>
      {/* Only show the face that should be visible */}
      <EnvelopeFace
        face={visibleFace}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        size={[2.4, 1.6]}
      />
    </group>
  )
}
