#!/usr/bin/env bash
# Deploy Mekong IDE Dashboard to Cloudflare Pages.
#
# Prereqs:
#   - wrangler installed:    npm install -g wrangler
#   - logged in:              wrangler login
#   - Cloudflare project:     mekong-ide  (auto-created on first deploy)
#   - Custom domain in CF:    ide.mekongmind.com → Pages project mekong-ide
#
# Usage:
#   ./scripts/deploy-dashboard.sh                # deploy to production
#   ./scripts/deploy-dashboard.sh --preview      # deploy to preview branch
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DASHBOARD="${REPO_ROOT}/apps/dashboard"
PROJECT_NAME="mekong-ide"
BRANCH="production"

if [[ "${1:-}" == "--preview" ]]; then
  BRANCH="preview"
fi

cd "${DASHBOARD}"

echo "==> Mekong IDE Dashboard — deploy"
echo "    project: ${PROJECT_NAME}"
echo "    branch:  ${BRANCH}"
echo "    cwd:     ${DASHBOARD}"
echo

# 1. Install (idempotent)
if [[ ! -d node_modules ]]; then
  echo "==> Installing dependencies"
  npm install --no-audit --no-fund
fi

# 2. Build
echo "==> npm run build"
npm run build

# 3. Deploy
echo "==> wrangler pages deploy"
if ! command -v wrangler >/dev/null 2>&1; then
  echo "    wrangler not found — installing locally"
  npm install --no-save wrangler
  WRANGLER="$(npm bin)/wrangler"
else
  WRANGLER="wrangler"
fi

COMMIT_DIRTY="false"
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    echo "[WARN] Uncommitted changes detected."
    read -p "Deploy dirty state? [y/N] " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] && COMMIT_DIRTY="true"
fi

"${WRANGLER}" pages deploy .next \
  --project-name "${PROJECT_NAME}" \
  --branch "${BRANCH}" \
  --commit-dirty=${COMMIT_DIRTY}

echo
echo "==> Deployed."
echo "    Preview URL: shown above."
echo "    Production:  https://ide.mekongmind.com"
echo "    Configure custom domain in Cloudflare Dashboard → Pages → mekong-ide → Custom domains."
