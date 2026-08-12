import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: false,
  output: "standalone",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default config;
