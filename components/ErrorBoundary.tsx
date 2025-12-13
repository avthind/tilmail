'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking if available
    // Check for Sentry in multiple ways to handle different initialization patterns
    if (typeof window !== 'undefined') {
      const Sentry = (window as any).Sentry || (window as any).__SENTRY__
      if (Sentry && Sentry.captureException) {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack
            }
          }
        })
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          background: 'var(--pale-mint)',
          color: 'var(--dark-teal)'
        }}>
          <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '24px', fontSize: '16px', color: 'var(--grey-600)' }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.href = '/'
            }}
            style={{
              padding: '12px 24px',
              background: 'var(--medium-teal)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--dark-teal)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--medium-teal)'
            }}
          >
            Go Home
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

