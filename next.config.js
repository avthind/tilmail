// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For static export (Firebase Hosting)
  output: 'export',
  // Base path for subpath deployment (only in production)
  // In development, access at http://localhost:8005/
  // In production, access at /tilmail/
  basePath: process.env.NODE_ENV === 'production' ? '/tilmail' : '',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
