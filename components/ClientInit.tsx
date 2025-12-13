'use client'

import { useEffect } from 'react'

/**
 * Client-side initialization component
 * Handles Sentry and environment validation initialization
 */
export default function ClientInit() {
  useEffect(() => {
    // Initialize Sentry (gracefully handles if not installed)
    import('@/lib/sentry')
      .then(({ initSentry }) => {
        initSentry()
      })
      .catch(() => {
        // Silently fail if module can't be loaded or Sentry not installed
      })

    // Validate environment variables (runs once on client-side)
    import('@/lib/env')
      .then(({ validateEnv }) => {
        try {
          validateEnv()
        } catch (error) {
          // Log errors but don't crash the app
          if (process.env.NODE_ENV === 'development') {
            console.error('[ENV VALIDATION] Validation error:', error)
          }
        }
      })
      .catch(() => {
        // Silently fail if module can't be loaded
      })
  }, [])

  return null
}

