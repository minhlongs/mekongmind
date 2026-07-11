---
phase: 2
title: "Refactor Review Trigger to Async Job"
status: pending
priority: P2
dependencies: [1]
---

# Phase 2: Refactor Review Trigger to Async Job

## Overview

Replace the synchronous `POST /api/repos/{owner}/{repo}/review/stream` endpoint with a new async trigger that validates the request, persists a `pending` Review in D1, enqueues an Inngest job, and immediately returns `202 Accepted`. The old stream endpoint is deprecated with a 301 redirect.

## Requirements
- Functional: New endpoint validates session, repo ownership, creates Review record, sends Inngest event, returns jobId; 301 redirect from old endpoint
- Non-functional: Response time < 2s (no LLM call in request thread); supports concurrent triggers per repo

## Architecture

```
Client                         Worker
  │                              │
  │  POST /review/trigger        │
  │  { owner, repo }             │
  │─────────────────────────────▶│
  │                              │  1. Verify session
  │                              │  2. Lookup repo + token
  │                              │  3. INSERT review (pending)
  │                              │  4. inngestClient.send(...)
  │                              │  5. RETURN 202 { jobId }
  │  ◀─ 202 { jobId }           │
  │                              │
  │  (background)                │
  │              Inngest picks up│
  │              └─▶ review-job.ts│
  │                              │
```

## File Ownership

| File | Action | Owner |
|------|--------|-------|
| `app/api/repos/[owner]/[repo]/review/trigger/route.ts` | Create | Phase 2 |
| `app/api/repos/[owner]/[repo]/review/stream/route.ts` | Modify (301 redirect) | Phase 2 |

## Implementation Steps

1. **Create `app/api/repos/[owner]/[repo]/review/trigger/route.ts`**
   - Route: `POST /api/repos/[owner]/[repo]/review/trigger`
   - Use `createServerClient()` for D1 (sync, no await)
   - Call `getCurrentUser()` from `@/seed/auth/better-auth-session` to verify session
   - Lookup repo by `user_id = session.sub + full_name = {owner}/{repo}`
   - Verify the repo belongs to the authenticated user
   - Read `github_access_token` from users row (needed by Inngest job)
   - Generate `reviewId = crypto.randomUUID()`
   - INSERT into reviews: `{ id, repo_id, pull_number: null, title, status: 'pending', findings_count: 0, started_at: now }`
   - Enqueue Inngest event: `await inngestClient.send({ name: 'review/triggered', data: { repoId, pullNumber, userId, reviewId, githubAccessToken } })`
   - Return `NextResponse.json({ jobId: reviewId, status: 'pending' }, { status: 202 })`

2. **Deprecate old stream endpoint**
   - Edit `app/api/repos/[owner]/[repo]/review/stream/route.ts`
   - On any `POST`: return `NextResponse.json({ error: 'Deprecated', redirect: '/api/repos/{owner}/{repo}/review/trigger' }, { status: 301 })`
   - Keep GET handler (if any) intact for backwards compat

3. **Error handling**
   - 401 if not authenticated
   - 403 if repo not owned by user
   - 404 if repo not found
   - 409 if a review is already `pending` for this repo (prevent double-trigger)
   - 500 on DB error or Inngest enqueue failure

## Success Criteria
- [ ] `POST /api/repos/{owner}/{repo}/review/trigger` returns 202 with `{ jobId, status: 'pending' }`
- [ ] Review record appears in D1 with `status = 'pending'` immediately after response
- [ ] Inngest event received in dashboard (or logged to console if no dashboard connected yet)
- [ ] Old `POST .../review/stream` returns 301 with redirect hint
- [ ] 401/403/404 error paths all return correct status codes

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Inngest not initialized → send() throws | Medium | Guard: only send if client initialized; log warning, still return 202 |
| Duplicate trigger while review pending | Low | 409 check on reviews WHERE repo_id = ? AND status = 'pending' |
| Token not stored → Inngest job has no GitHub access | Low | Schema + callback already store token (Phase 2 fix) |
