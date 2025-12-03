'use client'

import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import Postcard from './Postcard'
import { CardData } from '@/lib/firebase'
import { useAppStore } from '@/store/appStore'
import { useEffect } from 'react'

interface EnvelopeViewerProps {
  cardData: CardData
}

export default function EnvelopeViewer({ cardData }: EnvelopeViewerProps) {
  useEffect(() => {
    // Load decorations from card data
    if (cardData.decorations) {
      useAppStore.setState({ decorations: cardData.decorations })
    }
  }, [cardData])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.4} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        rotateSpeed={1}
      />

      <Postcard />
    </>
  )
}
