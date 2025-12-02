import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TILMail - 3D Envelope & Postcard',
  description: 'Create and share personalized 3D digital postcards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

