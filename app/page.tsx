'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import CardCanvas from '@/components/CardCanvas'
import Toolbar from '@/components/Toolbar'
import SendModal from '@/components/SendModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAppStore } from '@/store/appStore'
import { loadCard } from '@/lib/firebase'
import styles from './page.module.css'
import cardStyles from './card/card.module.css'

export default function Home() {
  const { showSendModal, setShowSendModal, decorations, setMode, mode } = useAppStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isCardViewer, setIsCardViewer] = useState(false)
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  // Check if this is a card viewer URL and load the card
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkCardUrl = () => {
        // Get the actual URL - Firebase rewrites might affect pathname, so check href directly
        const pathname = window.location.pathname
        const href = window.location.href
        const hash = window.location.hash
        
        // Try to match /card/ID pattern from the actual URL
        let cardId: string | null = null
        
        // Method 1: Check pathname directly (works if not rewritten)
        const pathMatch = pathname.match(/\/card\/([^\/\?]+)/)
        if (pathMatch && pathMatch[1]) {
          cardId = pathMatch[1]
        }
        
        // Method 2: Check full href (most reliable - works even with Firebase rewrites)
        if (!cardId) {
          const hrefMatch = href.match(/\/card\/([^\/\?\#]+)/)
          if (hrefMatch && hrefMatch[1]) {
            cardId = hrefMatch[1]
          }
        }
        
        // Method 3: Check hash (in case URL is rewritten)
        if (!cardId && hash) {
          const hashMatch = hash.match(/\/card\/([^\/\?]+)/)
          if (hashMatch && hashMatch[1]) {
            cardId = hashMatch[1]
          }
        }
        
        if (cardId) {
          setIsCardViewer(true)
          setCardLoading(true)
          setCardError(null)
          
          // Clear existing decorations first
          useAppStore.setState({ 
            decorations: { front: [], back: [] },
            mode: 'front',
            currentTool: null,
            selectedDecoration: null
          })
          
          // Load the card data
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
                setCardError('Card has no decorations')
              }
              setCardLoading(false)
            })
            .catch((err) => {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error'
              // Log to error tracking if available
              if (typeof window !== 'undefined') {
                const Sentry = (window as any).Sentry || (window as any).__SENTRY__
                if (Sentry && Sentry.captureException) {
                  Sentry.captureException(err, {
                    tags: { component: 'CardViewer', action: 'loadCard' }
                  })
                }
              }
              setCardError(`Card not found: ${errorMessage}`)
              setCardLoading(false)
            })
        } else {
          setIsCardViewer(false)
        }
      }
      
      // Check immediately
      checkCardUrl()
      
      // Also check after a delay in case URL isn't ready yet
      const timeoutId = setTimeout(checkCardUrl, 200)
      
      // Listen for popstate events (back/forward navigation)
      window.addEventListener('popstate', checkCardUrl)
      
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('popstate', checkCardUrl)
      }
    }
  }, [pathname])

  // If this is a card viewer, show viewer UI instead of editor
  if (isCardViewer) {
    
    const handleFlip = () => {
      setMode(mode === 'front' ? 'back' : 'front')
    }

    if (cardLoading) {
      return (
        <div className={cardStyles.container} style={{ minHeight: '100vh', background: 'var(--pale-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '4px solid var(--light-mint)', 
              borderTop: '4px solid var(--medium-teal)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <div style={{ fontSize: '16px', color: 'var(--dark-teal)', fontWeight: 500 }}>
              Loading card...
            </div>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )
    }

    if (cardError) {
      return (
        <div className={cardStyles.container} style={{ minHeight: '100vh', background: 'var(--pale-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--dark-teal)', marginBottom: '12px' }}>
              Card Not Found
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--grey-600)', marginBottom: '24px' }}>
              {cardError}
            </p>
            <a 
              href="/" 
              style={{ 
                display: 'inline-block',
                padding: '12px 24px',
                background: 'var(--medium-teal)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--dark-teal)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--medium-teal)'
              }}
            >
              Create Your Own Card
            </a>
          </div>
        </div>
      )
    }

    // Render card even if no decorations (might be loading or empty card)
    const hasDecorations = decorations && (decorations.front?.length > 0 || decorations.back?.length > 0)
    
    return (
      <div className={cardStyles.container} style={{ minHeight: '100vh', background: 'var(--pale-mint)' }}>
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            position: 'fixed', 
            top: '10px', 
            left: '10px', 
            background: 'rgba(255,255,255,0.9)', 
            padding: '10px', 
            zIndex: 9999,
            fontSize: '12px',
            color: '#000'
          }}>
            <div>Card Viewer Mode: {isCardViewer ? 'YES' : 'NO'}</div>
            <div>Loading: {cardLoading ? 'YES' : 'NO'}</div>
            <div>Error: {cardError || 'None'}</div>
            <div>Has Decorations: {hasDecorations ? 'YES' : 'NO'}</div>
            <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
          </div>
        )}
        
        <CardCanvas readOnly={true} />
        
        {/* Action Buttons */}
        <div className={cardStyles.actionButtons}>
          <button className={cardStyles.flipButton} onClick={handleFlip} aria-label="Flip card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Flip Card</span>
          </button>
          
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={cardStyles.sendButton}
            aria-label="Create and send your own card"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Send Yours</span>
          </a>
        </div>

        {/* Left Corner Branding */}
        <div className={cardStyles.attribution}>
          Brought to you by theinvitelab.com
        </div>

        {/* Right Corner Social Links */}
        <div className={cardStyles.socialLinks}>
          <a href="https://www.instagram.com/t.invitelab/?next=%2F" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="https://www.facebook.com/profile.php?id=61583886026486" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href="https://www.tiktok.com/@t.invitelab?_r=1&_t=ZT-91iF3BJ1Dzr" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
          <a href="https://x.com/theinvitelab" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://www.linkedin.com/company/109032199/admin/dashboard/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a href="https://www.pinterest.com/0cnae689fabuzo0uiyem2jurbkue8i/" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.001 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
          </a>
        </div>
      </div>
    )
  }

  return (
    <main className={styles.main}>
      <CardCanvas />
      <Toolbar />
      {showSendModal && (
        <SendModal onClose={() => setShowSendModal(false)} />
      )}
      
      {/* Attribution */}
      <div className={styles.attribution}>
        Brought to you by theinvitelab.com
      </div>

      {/* Social Media Icons */}
      <div className={styles.socialLinks}>
        <a href="https://www.instagram.com/t.invitelab/?next=%2F" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
        <a href="https://www.facebook.com/profile.php?id=61583886026486" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <a href="https://www.tiktok.com/@t.invitelab?_r=1&_t=ZT-91iF3BJ1Dzr" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        </a>
        <a href="https://x.com/theinvitelab" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <a href="https://www.linkedin.com/company/109032199/admin/dashboard/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        <a href="https://www.pinterest.com/0cnae689fabuzo0uiyem2jurbkue8i/" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.001 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
        </a>
      </div>
    </main>
  )
}

