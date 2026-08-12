# Phase 3 Review: Code Reviewer → Planner Gate Report
**Date:** 2026-07-09

## Verdict: BLOCKED — 2 Critical Database Issues + 1 Security Finding

The implementation shape is correct (async 202 trigger, SSE polling, deprecated old stream, Inngest 5-step job), but **two schema-column mismatches cause runtime D1 errors on every review creation and every review completion**. Additionally, GitHub OAuth tokens transit through Inngest's event bus as plaintext — a trust-boundary violation.

## Critical (block deploy)

### C1: `pull_number INTEGER NOT NULL` receives NULL
- **File:** `src/db/schema.ts:37` + `app/api/repos/.../review/trigger/route.ts:62`
- **Impact:** Every review creation hard-fails at D1 with constraint violation BEFORE Inngest is contacted
- **Fix:** Change schema to `pull_number INTEGER` (nullable) — repositories have no PR concept until linked

### C2: Missing `payload` column in Step 4 UPDATE
- **File:** `src/forest/inngest/review-job.ts:331-333` + `src/db/schema.ts:33-44`
- **Impact:** Background function fails at every review completion — `no such column: payload`
- **Fix:** Add `payload TEXT` to schema

## High Priority

### H1: GitHub OAuth token transmitted through Inngest event bus
- **Files:** `src/forest/inngest/types.ts:48` → `trigger/route.ts:81` → `review-job.ts:115`
- **Impact:** User GitHub token (`repo` scope) persisted in Inngest.dev storage for replay/retry
- **Fix:** Store token in D1 `repos` table, pass `repoId` only in event

### H2: Inngest client always truthy without event key
- **File:** `src/forest/inngest/client.ts:12-14`
- **Impact:** Without INNGEST_EVENT_KEY, events silently dropped; reviews stay `pending` forever
- **Fix:** Export as `Inngest | undefined`, guard in trigger + job

### H3: Duplicate type definition drift risk
- **Files:** `src/forest/inngest/types.ts` + `src/forest/inngest/review-job.ts:5-16`
- **Fix:** Import from types.ts directly

### H4: Re-entrant setTimeout leak on stream cancel
- **File:** `app/api/reviews/[id]/events/route.ts:145+148`
- **Fix:** Store timeout ref, clear in cancel()

## Medium/Low

- M1: `as any[]` in review-job.ts:211,263 — project no-any rule violation
- M2: Trigger response `{jobId, status, startedAt}` missing `reviewId` per Phase 3 contract
- M3: Logger no-ops in production → invisible Inngest failures

## Questions for Planner

1. `pull_number`: nullable INTEGER, or sentinel value (e.g., 0)?
2. `payload` column: add now or defer?
3. GitHub token: D1 encrypted column vs CF Secrets?
4. Unify `jobId` / `reviewId` in trigger response contract?
