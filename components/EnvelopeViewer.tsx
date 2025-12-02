'use client'

import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import Envelope from './Envelope'
import Postcard from './Postcard'
import { CardData } from '@/lib/firebase'
import { useAppStore } from '@/store/appStore'
import { useEffect } from 'react'

interface EnvelopeViewerProps {
  cardData: CardData
}

export default function EnvelopeViewer({ cardData }: EnvelopeViewerProps) {
  const { openEnvelope } = useAppStore()

  useEffect(() => {
    // Load decorations from card data
    if (cardData.decorations) {
      useAppStore.setState({ decorations: cardData.decorations })
      // Auto-open envelope to show postcard
      setTimeout(() => openEnvelope(), 1000)
    }
  }, [cardData, openEnvelope])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.4} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />

      <Envelope isOpen={true} />
      <Postcard />
    </>
  )
}

