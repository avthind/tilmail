'use client'

import { useRef, useEffect } from 'react'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import Postcard from './Postcard'
import { useAppStore } from '@/store/appStore'

export default function EnvelopeScene() {
  const controlsRef = useRef<any>(null)
  const { mode } = useAppStore()
  const previousModeRef = useRef(mode)

  // Reset camera/controls when mode changes
  useEffect(() => {
    if (previousModeRef.current !== mode && controlsRef.current) {
      // Reset OrbitControls to default position
      controlsRef.current.reset()
    }
    previousModeRef.current = mode
  }, [mode])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[5, 5, 5]} intensity={1.0} />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} />
      
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        rotateSpeed={1}
      />

      <Postcard />
    </>
  )
}
