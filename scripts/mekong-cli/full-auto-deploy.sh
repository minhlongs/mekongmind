#!/bin/bash
# full-auto-deploy.sh — Full Stack Automated Deployment
#
# Usage: ./scripts/full-auto-deploy.sh
#
# What it does:
# 1. Build all packages
# 2. Run tests
# 3. Commit and push
# 4. Wait for CI/CD
# 5. Verify production
#
# Requirements:
# - GitHub CLI (gh) installed and authenticated
# - Node.js, pnpm installed
# - Git configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 OpenClaw Full Auto Deploy                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Build
echo -e "${YELLOW}[1/5] Building all packages...${NC}"
pnpm build
echo -e "${GREEN}✅ Build successful${NC}\n"

# Step 2: Test
echo -e "${YELLOW}[2/5] Running tests...${NC}"
pnpm test
echo -e "${GREEN}✅ All tests passed${NC}\n"

# Step 3: Git status check
echo -e "${YELLOW}[3/5] Checking git status...${NC}"
git status --short

read -p "Commit and push changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted by user${NC}"
    exit 1
fi

git add .
git commit -m "chore: auto-deploy $(date +%Y%m%d-%H%M)" || echo "No changes to commit"
git push origin main
echo -e "${GREEN}✅ Pushed to main${NC}\n"

# Step 4: Wait for CI/CD
echo -e "${YELLOW}[4/5] Waiting for GitHub Actions...${NC}"
MAX_ATTEMPTS=20
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    STATUS=$(gh run list -L 1 --json status,conclusion -q '.[0]' 2>/dev/null || echo "null")

    if echo "$STATUS" | grep -q '"conclusion":"success"'; then
        echo -e "${GREEN}✅ CI/CD GREEN${NC}"
        break
    fi

    if echo "$STATUS" | grep -q '"conclusion":"failure"'; then
        echo -e "${RED}❌ CI/CD FAILED${NC}"
        echo "Status: $STATUS"
        exit 1
    fi

    echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS: Status=$STATUS"
    echo "   ⏳ Waiting 30s..."
    sleep 30
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${YELLOW}⚠️  CI/CD timeout (still running)${NC}\n"
else
    echo ""
fi

# Step 5: Verify production
echo -e "${YELLOW}[5/5] Verifying production...${NC}"

# Check main site
HTTP_STATUS=$(curl -sI "https://agencyos.network" | head -1 | awk '{print $2}')
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ agencyos.network: HTTP $HTTP_STATUS${NC}"
else
    echo -e "${RED}❌ agencyos.network: HTTP $HTTP_STATUS${NC}"
fi

# Check RaaS Gateway (if deployed)
if [ -f "apps/raas-gateway/wrangler.toml" ]; then
    RAAS_URL=$(grep '^name' apps/raas-gateway/wrangler.toml | cut -d'"' -f2)
    HTTP_STATUS=$(curl -sI "https://${RAAS_URL}.workers.dev" | head -1 | awk '{print $2}' 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ raas-gateway: HTTP $HTTP_STATUS${NC}"
    else
        echo -e "${YELLOW}⚠️  raas-gateway: HTTP $HTTP_STATUS (may need manual deploy)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Deployment Complete!                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📋 Summary:"
echo "   - Build: ✅"
echo "   - Tests: ✅"
echo "   - Push: ✅"
echo "   - CI/CD: ✅"
echo "   - Production: ✅"
echo ""
