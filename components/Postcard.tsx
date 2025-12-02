'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/store/appStore'
import EnvelopeFace from './EnvelopeFace'

export default function Postcard() {
  const cardRef = useRef<THREE.Group>(null)
  const { isEnvelopeOpen } = useAppStore()

  useFrame(() => {
    if (cardRef.current) {
      const targetZ = isEnvelopeOpen ? 0.5 : -0.2
      cardRef.current.position.z = THREE.MathUtils.lerp(
        cardRef.current.position.z,
        targetZ,
        0.1
      )
    }
  })

  return (
    <group ref={cardRef} position={[0, 0, -0.2]}>
      <mesh>
        <boxGeometry args={[1.8, 1.2, 0.05]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* Postcard decoration */}
      <EnvelopeFace
        face="postcard"
        position={[0, 0, 0.026]}
        rotation={[0, 0, 0]}
        size={[1.8, 1.2]}
      />
    </group>
  )
}

