/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
    // 禁用Turbopack
    turbo: {
      enabled: false
    }
  }
};

module.exports = nextConfig; 