---
phase: 5
title: "Test + Verify"
status: pending
priority: P2
dependencies: [1, 2, 3, 4]
---

# Phase 5: Test + Verify

## Overview

End-to-end verification of the async review pipeline: trigger → background processing → SSE streaming → completion. Validates build, correctness, and rollback readiness.

## Requirements
- Functional: Full round-trip test of async review flow; old endpoint 301 redirects; SSE stream delivers events
- Non-functional: Build passes; no TypeScript errors; no regression in Phase 2 functionality

## Implementation Steps

1. **Verify build**
   ```bash
   cd apps/ultracode && pnpm run build
   ```
   - Must exit 0 with zero TypeScript errors
   - All new files (`src/forest/inngest/`, `app/api/inngest/`, `app/api/repos/.../review/trigger/`) resolve imports cleanly

2. **Test build output includes Inngest routes**
   - Check `.next/server/app/api/inngest/route.js` exists in build output
   - Check `.next/server/app/api/repos/.../review/trigger/route.js` exists

3. **Verify D1 schema validation**
   - Run dev server, trigger a review, confirm D1 `reviews` row has `status = 'pending'`
   - Confirm `github_access_token` column exists and contains non-null value

4. **Functional smoke test (local)**
   - Start `pnpm dev` on :3000
   - Login via GitHub OAuth (local redirect)
   - Navigate to a connected repo, click "Start Review"
   - Confirm: POST returns 202, review page shows pending spinner, SSE events appear in Network tab
   - Wait for completion → findings displayed
   - If LLM not funded: verify graceful error path (review status → `failed`, error message shown)

5. **Verify 301 redirect from old endpoint**
   ```bash
   curl -i -X POST http://localhost:3000/api/repos/owner/repo/review/stream \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   - Expected: `HTTP/1.1 301` with `Location: .../review/trigger`

6. **Verify old endpoint still functional (deprecation period)**
   - The 301 redirect should point clients to the new endpoint
   - No silent failures: if a client ignores the redirect, it gets a clear deprecation message

7. **Rollback verification**
   - `git stash` the Inngest changes → build still passes → old stream endpoint functions
   - `git stash pop` to restore
   - Confirm: removing `src/forest/inngest/` + trigger route leaves no orphan imports

8. **Run existing test suite**
   ```bash
   cd apps/ultracode && pnpm test
   ```
   - All Phase 2 tests must still pass (no regression)
   - New tests for trigger endpoint (if any exist)

9. **Lint + type-check**
   ```bash
   cd apps/ultracode && pnpm run lint && pnpm run type-check
   ```

## Success Criteria
- [ ] `pnpm run build` passes with 0 errors
- [ ] `pnpm test` passes all tests (Phase 2 regression-free)
- [ ] `pnpm run lint` passes with 0 warnings
- [ ] `pnpm run type-check` passes
- [ ] Local smoke test: full async review lifecycle completes (pending → in_progress → completed)
- [ ] Old endpoint returns 301 redirect
- [ ] No `:any` types in new files
- [ ] No `console.log` in new files (use logger utility)
- [ ] Rollback procedure tested and documented

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Inngest Cloud not connected → events not processed | High | Dev mode: InngestServe logs to console; production: verify account + key |
| LLM API key not available in local env | Medium | Mock/fallback: trigger enqueues successfully; LLM call skipped in smoke test |
| D1 limit exceeded on local dev | Low | Dev DB has generous limit; use different DB for load test |
| SSE timing differences on CI | Medium | SSE test requires running server; mark as manual in CI (Playwright for full E2E) |
