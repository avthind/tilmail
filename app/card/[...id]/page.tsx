import CardViewerClient from './CardViewerClient'

// Required for static export with dynamic routes
export async function generateStaticParams() {
  return []
}

export default function CardViewerPage() {
  return <CardViewerClient />
}
