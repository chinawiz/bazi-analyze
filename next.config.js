/** @type {import('next').NextConfig} */
const nextConfig = {
  // 配置实验性功能
  experimental: {
    // 禁用Turbopack
    turbo: {
      enabled: false
    }
  }
};

module.exports = nextConfig; 