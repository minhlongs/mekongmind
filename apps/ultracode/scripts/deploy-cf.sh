#!/usr/bin/env bash
# Deploy Ultracode to Cloudflare Workers via OpenNext adapter
set -euo pipefail

echo "🔧 Building Next.js app with OpenNext adapter..."
pnpm exec opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion --skipWranglerConfigCheck

echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy --config infra/wrangler.toml

echo "✅ Done!"
