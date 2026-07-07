# MEKONG Mind Bootstrap — Reality-Aligned Plan
**Date:** 2026-06-07 | **Mode:** cook --auto --parallel

## Context
Original plan `260606-1726-mekong-bootstrap` had API route assumptions incompatible with `output: 'export'`. This plan aligns to static-only reality.

## Scout Summary
- **Project:** Next.js 14.2 `output: 'export'` → zero server runtime
- **Deploy:** Cloudflare Pages (`mekong-digital.pages.dev`)
- **Payment:** Polar.sh client-side redirect (polar_cl_* IDs verified)
- **Go engine:** `engine/internal/bootstrap/lifecycle.go` exists, not wired to `bin/me`
- **Shell:** `lib/state-lock.sh` exists, NOT sourced in `lib/goal-executor.sh`
- **Templates:** 6 templates in gallery, checkout links work
- **Landing:** Live — Hero + Pricing + Templates

## Remaining Work (parallelizable groups)

### Group A: Shell/Go Core
- A1: Source `state-lock.sh` in `goal-executor.sh`
- A2: Wire Go orchestrator to `bin/me`

### Group B: RaaS Scripts
- B1: Create `lib/raas-pack.sh`
- B2: Create `lib/clone-memory.sh`

### Group C: Post-Purchase Flow
- C1: Template download page (`/templates/[slug]/download`)
- C2: Evidence artifact on checkout success

## Execution Order
1. Group A (sequential: A1 → A2)
2. Groups B and C in parallel
3. Build + Deploy
4. Verify production
