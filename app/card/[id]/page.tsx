'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import EnvelopeViewer from '@/components/EnvelopeViewer'
import { loadCard } from '@/lib/firebase'
import styles from './page.module.css'

export default function CardViewerPage() {
  const params = useParams()
  const cardId = params.id as string
  const [cardData, setCardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cardId) {
      loadCard(cardId)
        .then((data) => {
          setCardData(data)
          setLoading(false)
        })
        .catch((err) => {
          setError('Card not found')
          setLoading(false)
        })
    }
  }, [cardId])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading card...</div>
      </div>
    )
  }

  if (error || !cardData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Card not found'}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <EnvelopeViewer cardData={cardData} />
        </Suspense>
      </Canvas>
    </div>
  )
}

