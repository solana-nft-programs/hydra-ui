/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    MAINNET_PRIMARY: process.env.MAINNET_PRIMARY,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false }
    return config
  },
}

module.exports = nextConfig
