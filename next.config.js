// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ A LINHA QUE DAVA ERRO FOI REMOVIDA DAQUI
  
  experimental: {
    // ✅ É aqui que ela deve ficar na versão 14
    serverComponentsExternalPackages: ['pdfkit'],
  },
  reactStrictMode: true,
  eslint: {
    // Desabilita ESLint durante o build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig