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

    // Validate environment variables
    import('@/lib/env')
      .then(({ validateEnv }) => {
        try {
          validateEnv()
        } catch (error) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Environment validation warning:', error)
          }
        }
      })
      .catch(() => {
        // Silently fail if module can't be loaded
      })
  }, [])

  return null
}

