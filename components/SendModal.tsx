'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { saveCard } from '@/lib/firebase'
import styles from './SendModal.module.css'

interface SendModalProps {
  onClose: () => void
}

export default function SendModal({ onClose }: SendModalProps) {
  const { decorations } = useAppStore()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateLink = async () => {
    setLoading(true)
    setError(null)

    try {
      const cardId = await saveCard(decorations)
      const shareUrl = `${window.location.origin}/card/${cardId}`
      setShareLink(shareUrl)
    } catch (err) {
      console.error('Error saving card:', err)
      setError('Failed to generate link')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      alert('Link copied to clipboard!')
    }
  }

  const handleNativeShare = async () => {
    if (!shareLink) {
      await handleGenerateLink()
      return
    }

    const shareData = {
      title: 'Check out my TILMail postcard!',
      text: message || 'I created a postcard for you!',
      url: shareLink,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        handleCopyLink()
      }
    } catch (err) {
      // User cancelled or error - just copy to clipboard
      handleCopyLink()
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 className={styles.title}>Share Your Card</h2>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Message (optional):</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to share..."
              className={styles.textarea}
              rows={3}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {!shareLink && (
            <div className={styles.actions}>
              <button
                className={styles.button}
                onClick={handleGenerateLink}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Share Link'}
              </button>
            </div>
          )}

          {shareLink && (
            <div className={styles.shareSection}>
              <p className={styles.shareLabel}>Share Link:</p>
              <div className={styles.linkContainer}>
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className={styles.linkInput}
                />
                <button className={styles.copyButton} onClick={handleCopyLink}>
                  Copy
                </button>
              </div>
              
              <div className={styles.shareButtons}>
                <button 
                  className={styles.shareButton}
                  onClick={handleNativeShare}
                >
                  📱 Share via iMessage/WhatsApp
                </button>
                <p className={styles.shareHint}>
                  On mobile, this will open your sharing menu (iMessage, WhatsApp, etc.)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
