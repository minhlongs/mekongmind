---
phase: 3
title: "Inngest Review Background Function"
status: pending
priority: P2
dependencies: [1, 2]
---

# Phase 3: Inngest Review Background Function

## Overview

Create the Inngest background function that executes the actual LLM review. This function runs entirely off the request thread with no CPU time limits (Inngest execution is not bound by CF Worker's 30s CPU limit). It fetches repo files via GitHub API, runs LLM analysis, stores findings in D1, and emits progress events.

## Requirements
- Functional: Fetch files from GitHub API, run LLM review via `llmClient.streamReview()`, store findings, update review status
- Non-functional: Each step under 60s (Inngest default timeout); retries on transient failures; progress events emitted per step

## Architecture

```
Inngest Event: review/triggered
  │
  ▼
step.run('fetch-files', async () => {
    GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
    → returns file tree { path, type, sha }
})
  │
  ▼
step.run('run-llm-review', async () => {
    llmClient.streamReview(files, prompt)
    → iterates findings
})
  │
  ▼
step.run('store-findings', async () => {
    INSERT INTO findings (id, review_id, severity, category, title, description, file_path, line_start, line_end, suggestion, status)
    VALUES (...)
    UPDATE reviews SET status = 'completed', findings_count = ?, completed_at = now WHERE id = ?
})
  │
  ▼
step.run('emit-progress', async () => {
    inngestClient.send({ name: 'review/progress', data: { reviewId, status: 'completed', findingsCount } })
})
```

## File Ownership

| File | Action | Owner |
|------|--------|-------|
| `src/forest/inngest/review-job.ts` | Create | Phase 3 |
| `src/forest/inngest/client.ts` | Modify (export REVIEW_JOB_APP) | Phase 3 |

## Implementation Steps

1. **Create `src/forest/inngest/review-job.ts`**
   - Import `{ inngest } from './client'` and `{ REVIEW_TRIGGERED_EVENT }` from `types.ts`
   - Import `{ createServerClient }` from `@/seed/db/client'` (sync)
   - Import `llmClient` from existing LLM client module

   ```typescript
   export const REVIEW_JOB_APP = inngest.createApp()
   ```

2. **Implement `fetch-files` step**
   - Input: `{ repoId, pullNumber, userId, reviewId, githubAccessToken }`
   - Lookup repo from D1 by `repoId` → get `owner`, `repo_name`, `default_branch`
   - Call GitHub API: `GET https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
   - Filter to source files (exclude binaries, lock files, vendored dirs)
   - Limit to max 100 files per review (configurable; prevents mega-review timeouts)
   - Read content of each file (further GitHub API calls or use tree blob SHAs)
   - Return `{ files: Array<{ path, content, language }> }`
   - On failure: throw to trigger Inngest retry (max 3 attempts)

3. **Implement `run-llm-review` step**
   - Input: `{ files, reviewId }` (files passed from previous step via Inngest's step-level data passing)
   - Call `llmClient.streamReview({ files, prompt: REVIEW_PROMPT })`
   - Accumulate findings as they stream in
   - Return `{ findings: Finding[] }`
   - On failure: throw to trigger retry

4. **Implement `store-findings` step**
   - Input: `{ reviewId, findings }`
   - Batch INSERT into `findings` table (one INSERT per finding, or batch in single transaction)
   - Map LLM output fields to D1 schema: `severity`, `category`, `title`, `description`, `file_path`, `line_start`, `line_end`, `suggestion`
   - UPDATE `reviews` SET `status = 'completed'`, `findings_count = N`, `completed_at = datetime('now')` WHERE `id = reviewId`
   - Return `{ storedCount, reviewId }`

5. **Implement `emit-progress` step**
   - Input: `{ reviewId, storedCount }`
   - `inngestClient.send({ name: 'review/progress', data: { reviewId: string, status: 'completed', findingsCount: number } })`
   - This event powers the SSE stream in Phase 4

6. **Wire the app**
   - In `client.ts`, add `REVIEW_JOB_APP` to exports
   - Each step: `step.run('step-name', async ({ step, event }) => { ... })`
   - Set timeout per step: 60s (Inngest default); set retry: 3 attempts with exponential backoff

## Step-Level Error Handling

- Each step throws on failure → Inngest retries with backoff (1s, 5s, 25s)
- After 3 failures → job marked `failed`, `reviews.status = 'failed'`
- GitHub API rate limit (5000/hr authenticated) → check `X-RateLimit-Remaining` header; if 0, wait until reset or fail gracefully
- LLM API failure → retry; if persistent, mark review as `failed` with error message in D1

## Success Criteria
- [ ] `REVIEW_JOB_APP` registers with Inngest without errors
- [ ] Triggered event runs all 4 steps in sequence
- [ ] Findings correctly stored in D1 with proper foreign key to review
- [ ] Review status transitions: `pending` → `in_progress` → `completed`
- [ ] Gitub API calls authenticated with stored token
- [ ] Retry works: kill process mid-step → Inngest retries from same step

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| GitHub API rate limit exceeded | Medium | Use stored token (5000/hr auth rate limit); skip lock/vendor files to reduce volume |
| LLM streaming fails mid-review | Low | Inngest retries from failed step; findings from prior steps preserved via idempotent inserts |
| Inngest Cloud free tier insufficient | Medium | Monitor event count; self-host before production scale |
| Step timeout on large repo (>100 files) | Low | Hard cap at 100 files per review; configurable via env var |
