/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

interface EnvConfig {
  firebase: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
  sentry?: {
    dsn: string
  }
}

const requiredFirebaseVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const

export function validateEnv(): EnvConfig {
  const missing: string[] = []
  const invalid: string[] = []
  const config: EnvConfig = {
    firebase: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    }
  }

  // Validate Firebase environment variables
  // Note: Use direct property access (not dynamic) so Next.js can replace them at build time
  const envValues: Record<string, string> = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  }

  for (const varName of requiredFirebaseVars) {
    const value = envValues[varName]
    
    if (!value || value.trim() === '') {
      missing.push(varName)
    } else if (value === 'demo-key' || value.toLowerCase().includes('demo') || value.toLowerCase().includes('placeholder')) {
      invalid.push(varName)
    } else {
      // Valid value - map to config object
      const key = varName.replace('NEXT_PUBLIC_FIREBASE_', '').toLowerCase()
      if (key === 'apikey') {
        config.firebase.apiKey = value
      } else if (key === 'authdomain') {
        config.firebase.authDomain = value
      } else if (key === 'projectid') {
        config.firebase.projectId = value
      } else if (key === 'storagebucket') {
        config.firebase.storageBucket = value
      } else if (key === 'messagingsenderid') {
        config.firebase.messagingSenderId = value
      } else if (key === 'appid') {
        config.firebase.appId = value
      }
    }
  }

  // Check Sentry DSN (optional)
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (sentryDsn && sentryDsn !== '') {
    config.sentry = { dsn: sentryDsn }
  }

  // Log validation results
  if (missing.length > 0 || invalid.length > 0) {
    const issues: string[] = []
    if (missing.length > 0) {
      issues.push(`Missing: ${missing.join(', ')}`)
    }
    if (invalid.length > 0) {
      issues.push(`Invalid (contains demo/placeholder): ${invalid.join(', ')}`)
    }
    
    const errorMessage = `Environment variable issues: ${issues.join('; ')}`
    
    if (process.env.NODE_ENV === 'production') {
      console.error(`[ENV VALIDATION] ${errorMessage}`)
      console.error('[ENV VALIDATION] App will attempt to use fallback values. Some features may not work correctly.')
    } else {
      console.warn(`[ENV VALIDATION] ⚠️  ${errorMessage}`)
      console.warn('[ENV VALIDATION] Please check your .env.local file. See ENV_SETUP.md for instructions.')
    }
  } else {
    // All variables are valid - show success message in both dev and production
    console.log('[ENV VALIDATION] ✅ All environment variables are set correctly')
  }

  return config
}

