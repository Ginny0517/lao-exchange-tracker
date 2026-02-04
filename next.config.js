/** @type {import('next').NextConfig} */
const nextConfig = {
  // 確保 TypeScript 嚴格檢查
  typescript: {
    ignoreBuildErrors: false,
  },
  // 排除不需要的目錄
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
