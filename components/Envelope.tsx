'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/store/appStore'
import EnvelopeFace from './EnvelopeFace'

interface EnvelopeProps {
  isOpen: boolean
}

export default function Envelope({ isOpen }: EnvelopeProps) {
  const vFlapRef = useRef<THREE.Group>(null)
  const { decorations } = useAppStore()

  // V flap opens upward when envelope opens
  useFrame(() => {
    if (vFlapRef.current) {
      const targetRotation = isOpen ? Math.PI / 2 : 0
      vFlapRef.current.rotation.x = THREE.MathUtils.lerp(
        vFlapRef.current.rotation.x,
        targetRotation,
        0.1
      )
    }
  })

  // Create V-shaped triangular flap
  const vFlapGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    const width = 2
    const height = 0.4
    const vDepth = 0.25 // Depth of the V cut
    
    // Create V shape: triangle with inverted V at top
    // Bottom left
    shape.moveTo(-width / 2, 0)
    // Top left (with V cut)
    shape.lineTo(-width / 2 + vDepth, height)
    // Center point (bottom of V)
    shape.lineTo(0, height - 0.12)
    // Top right (with V cut)
    shape.lineTo(width / 2 - vDepth, height)
    // Bottom right
    shape.lineTo(width / 2, 0)
    // Close
    shape.lineTo(-width / 2, 0)

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: false,
    })
  }, [])

  return (
    <group position={[0, 0, 0]}>
      {/* Envelope base - simple rectangle */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2, 1.4, 0.1]} />
        <meshStandardMaterial color="#E8DCC6" />
      </mesh>

      {/* Front face decoration - simple rectangle, always visible */}
      <EnvelopeFace
        face="front"
        position={[0, 0, 0.051]}
        rotation={[0, 0, 0]}
        size={[2, 1.4]}
      />

      {/* V-shaped flap on the back - positioned at top, opens upward */}
      <group 
        ref={vFlapRef} 
        position={[0, 0.7, -0.05]} 
        rotation={[0, 0, 0]}
      >
        <mesh geometry={vFlapGeometry}>
          <meshStandardMaterial color="#E8DCC6" />
        </mesh>
        {/* Back face decoration on V flap (visible when closed, on back side) */}
        {!isOpen && (
          <EnvelopeFace
            face="back"
            position={[0, 0.2, 0.051]}
            rotation={[0, 0, 0]}
            size={[2, 0.4]}
          />
        )}
      </group>

      {/* Back face decoration - main body (visible when V flap is open or when viewing back) */}
      <EnvelopeFace
        face="back"
        position={[0, 0, -0.051]}
        rotation={[0, Math.PI, 0]}
        size={[2, 1.4]}
      />
    </group>
  )
}
