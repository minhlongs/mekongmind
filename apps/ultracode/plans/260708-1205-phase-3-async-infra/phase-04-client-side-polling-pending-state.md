---
phase: 4
title: "Client-Side Polling + Pending State"
status: pending
priority: P2
dependencies: [2, 3]
---

# Phase 4: Client-Side Polling + Pending State

## Overview

The review detail page and repo page need to handle the new async lifecycle: trigger → pending → in_progress → completed. This phase adds the SSE streaming endpoint and updates client components to poll for progress and display results when ready.

## Requirements
- Functional: SSE endpoint streams review lifecycle events; client polls/pushes updates to UI; pending state shows progress indicator
- Non-functional: SSE reconnects on disconnect; no stale data displayed; smooth transition from pending to completed

## Architecture

```
┌──────────────┐      SSE (Server-Sent Events)      ┌─────────────────┐
│  Browser     │────────────────────────────────────▶│  /api/reviews/  │
│  (React)     │   GET /api/reviews/{id}/events?     │  {id}/events    │
│              │   stream=true                        │  route.ts       │
│  usePolling()│◀────────────────────────────────────│                 │
│  hook        │   event: status, findingsCount,     │  Queries D1     │
│              │   event: completed with findings     │  for updates    │
└──────────────┘                                      └─────────────────┘
```

## Flow

1. User clicks "Start Review" → POST trigger → gets `202 { jobId }`
2. Client navigates to review page or shows inline pending state
3. `useSSE` hook opens `EventSource` to `/api/reviews/{id}/events?stream=true`
4. On `review/progress` event: update local state (status, findingsCount)
5. On `review/completed` event: close SSE, fetch final review data, render findings
6. On `review/failed` event: close SSE, show error message with retry button
7. SSE reconnect on `close` (not `error`) — re-subscribe with lastEventId

## File Ownership

| File | Action | Owner |
|------|--------|-------|
| `app/api/reviews/[id]/events/route.ts` | Create | Phase 4 |
| `app/(dashboard)/repos/[owner]/[repo]/page.tsx` | Modify | Phase 4 |
| `app/(dashboard)/repos/page.tsx` | Modify | Phase 4 |
| `app/(dashboard)/reviews/[id]/page.tsx` | Modify (add SSE hook) | Phase 4 |
| `src/hooks/use-review-stream.ts` | Create | Phase 4 |

## Implementation Steps

1. **Create `app/api/reviews/[id]/events/route.ts`**
   - Route: `GET /api/reviews/{id}/events?stream=true`
   - Verify session (must own the review's repo)
   - Create `ReadableStream` with SSE content-type: `text/event-stream`
   - Poll D1 every 2s for review status + findings count changes
   - Emit events:
     - `data: {"type":"status","status":"pending","findingsCount":0}`
     - `data: {"type":"status","status":"in_progress","findingsCount":N}`
     - `data: {"type":"completed","reviewId":"...","findingsCount":N}` — then close stream
     - `data: {"type":"error","message":"..."}` — then close stream
   - Keep connection alive with SSE comment heartbeats every 15s: `: heartbeat\n\n`
   - Close when review status is `completed` or `failed` or after 10 minutes (hard limit)

2. **Create `src/hooks/use-review-stream.ts`**
   - Custom hook: `useReviewStream(reviewId, onEvent, onComplete, onError)`
   - Opens `EventSource` to `/api/reviews/${reviewId}/events?stream=true`
   - On `message`: parse JSON, dispatch to `onEvent`
   - On `review/completed`: call `onComplete(findings)`, close source
   - On `review/failed`: call `onError(message)`, close source
   - On `error` (network): auto-reconnect after 3s with exponential backoff (max 30s)
   - Cleanup: close EventSource on unmount
   - Return: `{ connected, error, retryCount }`

3. **Update review detail page (`reviews/[id]/page.tsx`)**
   - Server component fetches initial review data (unchanged)
   - Client component wraps findings displayarea
   - Diff: if `review.status === 'pending' || 'in_progress'`, render `<PendingState />` and activate `useReviewStream`
   - `<PendingState />` shows: spinning indicator, "Analyzing repo..." text, findings count so far
   - On `onComplete`: state update triggers re-fetch of review data → renders findings
   - On `onError`: show error banner with "Retry" button (retries triggers are in Phase 5)

4. **Update repo page (`repos/[owner]/[repo]/page.tsx`)**
   - After "Start Review" POST returns 202, navigate to review list or show inline success notification
   - Button state: disable + show "Review started..." while `pending`

5. **Update repos page (`repos/page.tsx`)**
   - Same button state change for Connect Repo flow
   - `openConnect()` flow triggers async; UI reflects pending state

## Success Criteria
- [ ] `GET /api/reviews/{id}/events?stream=true` opens SSE stream with correct content-type
- [ ] Status events appear in browser console in real time
- [ ] `useReviewStream` auto-reconnects after network interruption
- [ ] Review detail page transitions from pending spinner → findings list without full page reload
- [ ] Repo page button disables after trigger, re-enables after review completes

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| SSE not supported in some environments | Low | Polyfill via polling (fallback: 3s interval long-poll) |
| EventSource reconnection storms | Medium | Exponential backoff capped at 30s; close on completed/failed |
| Stale data if client disconnects > 5 min | Low | Re-fetch from API on reconnect; D1 is source of truth |
