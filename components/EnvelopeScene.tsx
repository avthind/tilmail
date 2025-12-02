'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import Envelope from './Envelope'
import Postcard from './Postcard'
import EnvelopeClickHandler from './EnvelopeClickHandler'
import { useAppStore } from '@/store/appStore'

export default function EnvelopeScene() {
  const { isEnvelopeOpen, mode } = useAppStore()
  const controlsRef = useRef<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const envelopeRef = useRef<THREE.Group>(null)

  // Rotate envelope to show front or back view based on mode
  const targetRotation = useRef(0)
  
  useEffect(() => {
    if (mode === 'envelope-front') {
      targetRotation.current = 0
    } else if (mode === 'envelope-back') {
      targetRotation.current = Math.PI
    }
  }, [mode])

  useFrame(() => {
    if (envelopeRef.current) {
      envelopeRef.current.rotation.y = THREE.MathUtils.lerp(
        envelopeRef.current.rotation.y,
        targetRotation.current,
        0.1
      )
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      {isEnvelopeOpen && (
        <pointLight position={[0, 0, 2]} intensity={0.5} color="#FFEDE1" />
      )}
      
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI - Math.PI / 3}
        onStart={() => setIsDragging(true)}
        onEnd={() => setIsDragging(false)}
      />

      <group ref={envelopeRef}>
        <Envelope isOpen={isEnvelopeOpen} />
        {isEnvelopeOpen && <Postcard />}
      </group>
      <EnvelopeClickHandler />
    </>
  )
}
