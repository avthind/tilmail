/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For static export (Firebase Hosting)
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
