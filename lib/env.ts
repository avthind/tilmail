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
  for (const varName of requiredFirebaseVars) {
    const value = process.env[varName]
    if (!value || value === 'demo-key' || value.includes('demo')) {
      missing.push(varName)
    } else {
      // Map to config object
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

  // In production, fail fast if required vars are missing
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    const errorMessage = `Missing or invalid required environment variables: ${missing.join(', ')}`
    console.error(errorMessage)
    throw new Error(errorMessage)
  }

  // In development, warn but don't fail
  if (missing.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(`⚠️  Missing environment variables (using defaults): ${missing.join(', ')}`)
  }

  return config
}

