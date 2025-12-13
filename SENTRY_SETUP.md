# Sentry Error Tracking Setup

This app includes optional Sentry error tracking support. The app will work fine without Sentry, but adding it provides better error monitoring in production.

## Setup Instructions

### 1. Install Sentry Package

```bash
npm install @sentry/nextjs
```

### 2. Initialize Sentry

Create or update `sentry.client.config.ts` in the root directory:

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException
      if (error instanceof Error && error.message.includes('Card not found')) {
        return null
      }
    }
    return event
  },
})
```

### 3. Set Environment Variable

Add to your `.env.local` or production environment:

```
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

### 4. Get Your Sentry DSN

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project
3. Copy your DSN from the project settings

## Current Implementation

The app currently includes:
- ✅ Error boundary integration (ready for Sentry)
- ✅ Error capture hooks in key components
- ✅ Graceful degradation (works without Sentry)
- ⚠️ Basic initialization (needs full Sentry setup for production)

## Notes

- The app will work perfectly fine without Sentry installed
- Error boundaries will still catch and display errors gracefully
- To enable full error tracking, follow the setup above

