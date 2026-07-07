import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: "/Users/macbook/mekongmind/apps/ultracode",
  // Static export to avoid SSR/RSC context issues (Node 26 + React 19 compat)
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default config;
