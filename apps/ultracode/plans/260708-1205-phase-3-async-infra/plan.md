---
title: "Phase 3 - Async Infrastructure: Inngest Background Jobs"
description: "Offload LLM review execution from the 30-second CPU-limited CF Worker request thread into Inngest background functions. Eliminates timeout risk for large repos, adds retry/backoff, and enables real-time progress via SSE polling. Low risk: no D1 schema changes, backwards-compatible 301 redirect from old stream endpoint."
status: pending
priority: P1
branch: "main"
tags: [async, inngest, background-jobs, streaming, review, cloudflare-workers]
blockedBy: []
blocks: []
created: "2026-07-08T04:40:33.424Z"
createdBy: "ck:plan"
source: skill
---

# Phase 3 - Async Infrastructure: Inngest Background Jobs

## Overview

Current architecture runs LLM code review synchronously inside the request thread. Cloudflare Workers enforces a 30-second CPU time limit per request — a review on a repo with many files can exceed this, causing hard failures with no retry. This phase introduces Inngest background functions to run reviews off-thread with built-in retry, timeout, and step-level granularity. The client polls a new SSE endpoint for real-time progress.

## Problem

- `POST /api/repos/{owner}/{repo}/review/stream` runs `llmClient.streamReview()` synchronously
- CF Workers CPU limit: ~30s per request → hard timeout on large repos
- No retry on failure — if the Worker times out, the review state is lost
- No progress visibility — client shows "reviewing" until completion or timeout
- No separation of concerns — LLM logic, DB writes, and HTTP transport are all in one handler

## Solution

New async flow:
1. `POST /api/repos/{owner}/{repo}/review/trigger` validates, persists a `pending` Review in D1, enqueues an Inngest job → returns `202 Accepted` with `jobId`
2. Inngest background function (`review-job.ts`) executes LLM review across 4 steps (fetch files, analyze chunks, aggregate findings, store results)
3. Client polls `GET /api/reviews/{id}/events?stream=true` (SSE) for real-time status and findings
4. Old `POST /api/repos/{owner}/{repo}/review/stream` is **deprecated** (301 redirect to new trigger) but kept during migration

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Inngest Setup & Config](./phase-01-inngest-setup-config.md) | Pending |
| 2 | [Refactor Review Trigger to Async Job](./phase-02-refactor-review-trigger-to-async-job.md) | Pending |
| 3 | [Inngest Review Background Function](./phase-03-inngest-review-background-function.md) | Pending |
| 4 | [Client-Side Polling + Pending State](./phase-04-client-side-polling-pending-state.md) | Pending |
| 5 | [Test + Verify](./phase-05-test-verify.md) | Pending |

## Dependencies

- **Phase 2 complete** — all APIs, DB schema, and UI must be functional and tested
- `inngest` npm package (server + client)
- Inngest Cloud account (free tier: 500 events/month) or self-hosted Inngest server

## Files

### Create
- `src/forest/inngest/client.ts` — Inngest CF Workers client singleton
- `src/forest/inngest/index.ts` — App export wiring Inngest client to Serve handler
- `src/forest/inngest/review-job.ts` — Background function: `REVIEW_JOB_APP` with 4 step functions
- `src/forest/inngest/types.ts` — Inngest event + step payload types
- `app/api/repos/[owner]/[repo]/review/trigger/route.ts` — New async trigger endpoint
- `app/api/reviews/[id]/events/route.ts` — SSE endpoint for review event streaming
- `app/api/inngest/route.ts` — Inngest webhook ingest endpoint
- `src/hooks/use-review-stream.ts` — React hook for SSE polling

### Modify
- `app/(dashboard)/reviews/[id]/page.tsx` — Add polling for pending reviews; show progress
- `app/(dashboard)/repos/[owner]/[repo]/page.tsx` — Button calls new trigger endpoint; handle 202
- `app/(dashboard)/repos/page.tsx` — Consistent button flow change
- `next.config.ts` — Inngest Serve handler integration

### Delete
- `app/api/repos/[owner]/[repo]/review/stream/route.ts` — Replace with trigger; old stream deprecated

## Backwards Compatibility

- Old `POST .../review/stream` returns HTTP 301 → new `POST .../review/trigger` (6-month deprecation window)
- SSE stream at `GET /api/reviews/{id}/events?stream=true` is new — no breaking change to existing clients
- Review detail page (`reviews/[id]/page.tsx`) remains fully compatible; adds polling enhancement for `pending` status

## Rollback

1. Revert trigger route, events route, and Inngest client files (git revert)
2. Restore deprecated `review/stream/route.ts` from git if already deleted
3. Remove `inngest` package: `pnpm remove inngest`
4. Remove `src/forest/inngest/` directory
5. No D1 schema changes in Phase 3 — no rollback migration needed

## Open Questions

- Inngest Cloud free tier (500 events/month) — may need self-hosted for production scale; resolve before go-live
- SSE stream duration — CF Workers can hold SSE up to ~100s; long reviews require reconnection logic (handled in client hook)
