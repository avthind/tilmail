import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TILmail - View Card',
  description: 'View a shared digital postcard',
}

export default function CardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

