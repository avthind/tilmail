'use client'

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useAppStore } from '@/store/appStore'
import EnvelopeFace from './EnvelopeFace'

export default function Postcard() {
  const cardRef = useRef<THREE.Group>(null)
  const { mode } = useAppStore()

  // Update rotation instantly when mode changes (no animation)
  useEffect(() => {
    if (cardRef.current) {
      // Set rotation instantly without animation
      cardRef.current.rotation.x = 0
      cardRef.current.rotation.y = mode === 'back' ? Math.PI : 0
      cardRef.current.rotation.z = 0
    }
  }, [mode])

  return (
    <group ref={cardRef} position={[0, 0, 0]}>
      {/* Postcard mesh - visual only, interactions handled by 2D canvas overlay */}
      <mesh raycast={() => null}>
        <boxGeometry args={[2.4, 1.6, 0.005]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Front face - visual only */}
      <EnvelopeFace
        face="front"
        position={[0, 0, 0.003]}
        rotation={[0, 0, 0]}
        size={[2.4, 1.6]}
      />
      
      {/* Back face - visual only */}
      <EnvelopeFace
        face="back"
        position={[0, 0, -0.003]}
        rotation={[0, Math.PI, 0]}
        size={[2.4, 1.6]}
      />
    </group>
  )
}
