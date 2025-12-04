'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import CardCanvas from '@/components/CardCanvas'
import { loadCard } from '@/lib/firebase'
import { useAppStore } from '@/store/appStore'
import styles from './page.module.css'

export default function CardViewerPage() {
  const params = useParams()
  const cardId = params.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cardId) {
      loadCard(cardId)
        .then((data) => {
          if (data && data.decorations) {
            useAppStore.setState({ decorations: data.decorations })
          }
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

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <CardCanvas />
    </div>
  )
}

