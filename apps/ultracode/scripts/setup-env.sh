#!/usr/bin/env bash
# Setup .env file by reading values interactively (hidden input)
set -euo pipefail

ENV_FILE="$(dirname "$0")/../.env"

echo "🔐 Setting up .env file for OpenNext build-time inlining"
echo "   (Inputs are hidden — they will be saved to .env which is gitignored)"
echo ""

read -rsp "GITHUB_CLIENT_ID: " GITHUB_CLIENT_ID
echo ""
read -rsp "GITHUB_CLIENT_SECRET: " GITHUB_CLIENT_SECRET
echo ""
read -rsp "GITHUB_CALLBACK_URL (default: https://ultracode.agencyos-openclaw.workers.dev/auth/callback): " GITHUB_CALLBACK_URL
GITHUB_CALLBACK_URL="${GITHUB_CALLBACK_URL:-https://ultracode.agencyos-openclaw.workers.dev/auth/callback}"
echo ""
read -rsp "JWT_SECRET (min 32 chars): " JWT_SECRET
echo ""
read -rsp "OPENAI_API_KEY: " OPENAI_API_KEY
echo ""

cat > "$ENV_FILE" <<EOF
# Build-time env vars for OpenNext (inlined at next build)
# This file is gitignored — DO NOT commit
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
GITHUB_CALLBACK_URL=${GITHUB_CALLBACK_URL}
JWT_SECRET=${JWT_SECRET}
OPENAI_API_KEY=${OPENAI_API_KEY}
EOF

chmod 600 "$ENV_FILE"
echo "✅ .env written to $ENV_FILE"
echo "   Next: pnpm build (will inline these vars) → pnpm run deploy:full"
