/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/', destination: '/vi', permanent: false },
    ]
  },
}

module.exports = nextConfig
