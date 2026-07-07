#!/usr/bin/env bash
# Deploy Ultracode to Cloudflare via Wrangler (static export)
# Assumes: logged into `wrangler whoami`
set -euo pipefail

echo "🔧 Building Next.js static export..."
node node_modules/next/dist/bin/next build

echo "📦 Creating '_routes.json' for SPA fallback..."
cat > out/_routes.json << 'JSON'
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_next/static/*"]
}
JSON

echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages project create ultracode 2>/dev/null || true
wrangler pages deploy out --project-name ultracode

echo "✅ Done! Live at: https://ultracode.pages.dev"
