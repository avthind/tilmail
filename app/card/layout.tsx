import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'I made you a postcard! | TILmail',
  description: 'I made you a postcard! Check it out on TILmail.',
  openGraph: {
    title: 'I made you a postcard!',
    description: 'I made you a postcard! Check it out on TILmail.',
    type: 'website',
    siteName: 'TILmail',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'I made you a postcard!',
    description: 'I made you a postcard! Check it out on TILmail.',
  },
}

export default function CardLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}

