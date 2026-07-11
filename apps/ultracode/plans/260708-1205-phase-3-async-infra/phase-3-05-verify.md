# Phase 3.5: Test + Verify

**Owner:** Full stack
**Effort:** 2h
**Blocker:** All Phase 3 phases complete

## Verification Checklist

### Build & Type Check

```bash
pnpm run build          # 0 TypeScript errors
pnpm run type-check     # tsc --noEmit clean
pnpm run lint           # ESLint clean (src/**, app/**
```

### Manual E2E Flow

1. **Start Inngest dev server:** `npx inngest start` (port 8288)
2. **Start Next.js dev:** `pnpm run dev` (port 3001)
3. **Authenticate** via GitHub OAuth → reach `/dashboard/repos`
4. **Connect a repo** (if not done in Phase 2)
5. **Trigger review:** Click "Run Review" on a repo
   - Expected: immediate `202` response with `{ reviewId }`
   - Repos page shows "Review running..." with pulse indicator
6. **Wait for completion:**
   - Inngest dashboard shows function execution
   - After ~15-30s, review status updates to `completed`
   - Browser auto-redirects or SSE fires → findings visible
7. **Verify D1 data:**
   - `reviews` table: status = 'completed', findings_count > 0
   - `findings` table: N rows linked to reviewId
   - No orphan rows (all findings have valid review_id)
8. **Check Inngest dashboard:**
   - Event `review/requested` triggered
   - Function `review-requested` shows steps: fetch-pr-diff → llm-stream → parse → store
   - No errors in step execution

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No API keys configured | `inngest.send()` stores event; Inngest function fails with clear error |
| Invalid repo | `POST /review` returns 404 |
| Unauthenticated | Returns 401 |
| LLM returns unparseable JSON | Review completed with single "info" finding containing raw text |
| Inngest dev server not running | `inngest.send()` throws; route returns 500 with error message |
| Large repo (>500 lines) | Completes within 30s request (now async, so no timeout) |

### Rollback Validation

If issues arise:
```bash
# Revert to synchronous flow:
git revert HEAD~5  # reverts all Phase 3 phases
pnpm run build     # confirm build still passes
# Old review/stream route functions as before
```

### Acceptance Criteria

- [x] `pnpm run build` → 0 TypeScript errors
- [x] `pnpm run type-check` → clean
- [x] `pnpm run lint` → clean
- [x] `POST /api/repos/{owner}/{repo}/review` returns 202 with `{ reviewId, status: "queued" }`
- [x] Inngest function executes within 60s of event trigger
- [x] Review status transitions: `queued` → `completed`
- [x] Findings stored in D1 (reviews + findings tables)
- [x] `GET /api/reviews/{id}/stream` returns SSE with findings on completion
- [x] Dashboard shows "Review running..." state during processing
- [x] Dashboard shows findings after completion
- [x] Old `review/stream` route still functional (deprecated but returns 301)
- [x] No `:any` types in new code
- [x] No `console.log` in production paths

## Post-Verification

Once verified:
1. Merge to main
2. Deploy: `pnpm run deploy`
3. Inngest production config: create event key in Inngest cloud dashboard
4. Update production env: `INNGEST_EVENT_KEY=<production-key>`
5. Monitor Inngest dashboard for function execution in production
6. After 1 week stable, remove deprecated `review/stream` route
