// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For static export (Firebase Hosting)
  output: 'export',
  // Base path for subpath deployment
  basePath: '/tilmail',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
