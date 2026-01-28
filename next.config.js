// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['pdfkit'],
    experimental: {
    serverComponentsExternalPackages: ['pdfkit'],
  },
  reactStrictMode: true,
  eslint: {
    // Desabilita ESLint durante o build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig