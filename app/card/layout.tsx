import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TILmail - Create & Share Digital Postcards',
  description: 'Create and share personalized digital postcards',
}

export default function CardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

