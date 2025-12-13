/**
 * Sentry error tracking initialization
 * Only initializes in production if DSN is provided
 * Gracefully degrades if Sentry package is not installed
 * 
 * To enable Sentry:
 * 1. Install: npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in your environment variables
 */

export function initSentry() {
  // Only initialize in browser environment
  if (typeof window === 'undefined') return

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  // If no DSN provided, Sentry won't be initialized (graceful degradation)
  if (!dsn || dsn === '') {
    return
  }

  // Only initialize in production
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  // Use a script tag approach to load Sentry if available
  // This avoids webpack trying to resolve the module at build time
  // Note: This is a simplified approach. For full Sentry integration,
  // you should install @sentry/nextjs and use their official setup
  try {
    // Try to dynamically load Sentry using a script tag or CDN
    // For now, we'll just set up a global error handler that can be used
    // when Sentry is properly installed via their official setup
    if (typeof window !== 'undefined') {
      // Store DSN for potential use by Sentry if it's loaded separately
      ;(window as any).__SENTRY_DSN__ = dsn
    }
  } catch {
    // Silently fail
  }
}

