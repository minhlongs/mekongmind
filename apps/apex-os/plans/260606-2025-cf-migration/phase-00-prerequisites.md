# Phase 0: Prerequisites
**Priority:** Critical
**Status:** Pending
**Dependencies:** None

## Requirements
1. Install wrangler CLI globally
2. Login to Cloudflare
3. Verify CF account has Pages + D1 + KV + R2 access

## Implementation Steps
1. `npm install -g wrangler`
2. `wrangler login` (opens browser, user confirms)
3. `wrangler whoami` (verify account)

## Success Criteria
- `wrangler --version` returns version
- `wrangler whoami` shows valid account
