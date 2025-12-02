'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/store/appStore'
import EnvelopeFace from './EnvelopeFace'

interface EnvelopeProps {
  isOpen: boolean
}

export default function Envelope({ isOpen }: EnvelopeProps) {
  const lidRef = useRef<THREE.Group>(null)
  const { decorations } = useAppStore()

  useFrame(() => {
    if (lidRef.current) {
      const targetRotation = isOpen ? -Math.PI / 2 : 0
      lidRef.current.rotation.x = THREE.MathUtils.lerp(
        lidRef.current.rotation.x,
        targetRotation,
        0.1
      )
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Envelope base */}
      <mesh position={[0, -0.1, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2, 1.4, 0.1]} />
        <meshStandardMaterial color="#F6F1EB" />
      </mesh>

      {/* Envelope lid */}
      <group ref={lidRef} position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[2, 0.6, 0.1]} />
          <meshStandardMaterial color="#F6F1EB" />
        </mesh>
        {/* Front face decoration */}
        <EnvelopeFace
          face="front"
          position={[0, 0, 0.051]}
          rotation={[0, 0, 0]}
          size={[2, 0.6]}
        />
      </group>

      {/* Back face decoration */}
      <EnvelopeFace
        face="back"
        position={[0, -0.1, -0.051]}
        rotation={[0, Math.PI, 0]}
        size={[2, 1.4]}
      />
    </group>
  )
}

