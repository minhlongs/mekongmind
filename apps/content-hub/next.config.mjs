/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [] },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" }
  }
};
export default nextConfig;
