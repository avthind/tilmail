'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CardCanvas from '@/components/CardCanvas'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { loadCard } from '@/lib/firebase'
import { useAppStore } from '@/store/appStore'
import styles from './card.module.css'

function CardViewerPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { mode, setMode } = useAppStore()

  useEffect(() => {
    // Set document title and meta tags for static export compatibility
    document.title = 'I made you a postcard! | TILmail'
    
    // Update meta tags for better social sharing
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const attr = isProperty ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attr}="${property}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attr, property)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }
    
    // Open Graph tags
    updateMetaTag('og:title', 'I made you a postcard!')
    updateMetaTag('og:description', 'I made you a postcard! Check it out on TILmail.')
    updateMetaTag('og:type', 'website')
    updateMetaTag('og:site_name', 'TILmail')
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', false)
    updateMetaTag('twitter:title', 'I made you a postcard!', false)
    updateMetaTag('twitter:description', 'I made you a postcard! Check it out on TILmail.', false)
    
    // Standard meta description
    updateMetaTag('description', 'I made you a postcard! Check it out on TILmail.', false)
    
    // Check window.location for direct card URLs (e.g., /card/abc123 or /tilmail/card/abc123)
    const getCardId = () => {
      if (typeof window === 'undefined') return null
      
      const pathname = window.location.pathname
      const href = window.location.href
      
      // Try to match /card/ID or /tilmail/card/ID pattern
      let cardId: string | null = null
      
      // Method 1: Check pathname directly
      const pathMatch = pathname.match(/(?:^\/tilmail)?\/card\/([^\/\?]+)/)
      if (pathMatch && pathMatch[1]) {
        cardId = pathMatch[1]
      }
      
      // Method 2: Check full href (most reliable - works even with Firebase rewrites)
      if (!cardId) {
        const hrefMatch = href.match(/(?:^\/tilmail)?\/card\/([^\/\?\#]+)/)
        if (hrefMatch && hrefMatch[1]) {
          cardId = hrefMatch[1]
        }
      }
      
      return cardId
    }
    
    const cardId = getCardId()
    
    if (cardId && cardId.length > 0) {
      // Clear existing decorations first
      useAppStore.setState({ 
        decorations: { front: [], back: [] },
        mode: 'front',
        currentTool: null,
        selectedDecoration: null
      })
      
      loadCard(cardId)
        .then((data) => {
          if (data && data.decorations) {
            // Ensure front and back are arrays
            const normalizedDecorations = {
              front: Array.isArray(data.decorations.front) ? data.decorations.front : [],
              back: Array.isArray(data.decorations.back) ? data.decorations.back : []
            }
            useAppStore.setState({ decorations: normalizedDecorations })
          } else {
            setError('Card has no decorations')
          }
          setLoading(false)
        })
        .catch((err) => {
          // Log to error tracking if available
          if (typeof window !== 'undefined') {
            const Sentry = (window as any).Sentry || (window as any).__SENTRY__
            if (Sentry && Sentry.captureException) {
              Sentry.captureException(err, {
                tags: { component: 'CardViewerPage', action: 'loadCard' }
              })
            }
          }
          setError('Card not found')
          setLoading(false)
        })
    } else {
      setLoading(false)
      setError('No card ID provided')
    }
  }, [])

  const handleFlip = () => {
    setMode(mode === 'front' ? 'back' : 'front')
  }

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
      <CardCanvas readOnly={true} />
      
      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button className={styles.flipButton} onClick={handleFlip} aria-label="Flip card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>Flip Card</span>
        </button>
        
        <Link 
          href="/" 
          className={styles.sendButton}
          aria-label="Create and send your own card"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
            <span>Send Yours</span>
          </Link>
      </div>

      {/* Left Corner Branding */}
      <div className={styles.attributionContainer}>
        <div className={styles.attribution}>
          Brought to you by theinvitelab.com
        </div>
        <div className={styles.attribution}>
          Stickers sourced from blush.design
        </div>
      </div>

      {/* Right Corner Social Links */}
      <div className={styles.socialLinks}>
        <div className={styles.socialRow}>
        <a href="https://www.instagram.com/t.invitelab/?next=%2F" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
        <a href="https://www.facebook.com/profile.php?id=61583886026486" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
        </a>
        <a href="https://www.tiktok.com/@t.invitelab?_r=1&_t=ZT-91iF3BJ1Dzr" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"></path>
          </svg>
        </a>
        </div>
        <div className={styles.socialRow}>
          <a href="https://x.com/theinvitelab" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </svg>
          </a>
          <a href="https://www.linkedin.com/company/109032199/admin/dashboard/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
          <a href="https://www.pinterest.com/0cnae689fabuzo0uiyem2jurbkue8i/" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8-.1-.8-.18-2.03.03-2.9.2-.9 1.3-5.98 1.3-5.98s-.33-.66-.33-1.63c0-1.53.89-2.67 2-2.67.94 0 1.4.71 1.4 1.56 0 .94-.6 2.35-.91 3.65-.26 1.1.55 2 1.63 2 1.96 0 3.47-2.07 3.47-5.06 0-2.64-1.9-4.49-4.61-4.49-3.14 0-4.98 2.35-4.98 4.78 0 .93.36 1.93.81 2.53.09.11.1.21.08.32l-.33 1.35c-.03.12-.1.15-.23.09-1.1-.51-1.79-2.11-1.79-3.4 0-2.78 2.02-5.33 5.83-5.33 3.06 0 5.44 2.18 5.44 5.09 0 3.04-1.91 5.49-4.56 5.49-.89 0-1.73-.46-2.02-1.04l-.49 1.87c-.18.7-.67 1.58-.98 2.12.74.23 1.52.35 2.33.35 5.52 0 10-4.48 10-10S17.52 2 12 2z"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

// Wrap with ErrorBoundary
function CardViewerPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <CardViewerPage />
    </ErrorBoundary>
  )
}

export default CardViewerPageWithErrorBoundary

