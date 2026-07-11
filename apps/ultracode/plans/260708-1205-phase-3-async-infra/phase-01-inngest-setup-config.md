---
phase: 1
title: "Inngest Setup & Config"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Inngest Setup & Config

## Overview

Install and configure Inngest to run as a Cloudflare Worker-side background function framework. Wire the Inngest client, create the app export, and add the webhook ingestion route.

## Requirements
- Functional: Inngest client initializes on CF Worker, webhook route receives events, Serve handler exports app
- Non-functional: Zero added cold-start latency; Inngest serves from same Worker instance; no external network dependencies for development

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare Worker (Next.js + Inngest Serve)        │
│                                                      │
│  next.config.ts → middleware rewrites               │
│  → Inngest Serve handler at /api/inngest             │
│                                                      │
│  src/forest/inngest/:                                │
│    client.ts  → inngest.create() singleton           │
│    index.ts   → inngest.serve(app)(req, res)         │
│    types.ts   → event schemas                        │
└─────────────────────────────────────────────────────┘
```

## File Ownership

| File | Action | Owner |
|------|--------|-------|
| `src/forest/inngest/client.ts` | Create | Phase 1 |
| `src/forest/inngest/index.ts` | Create | Phase 1 |
| `src/forest/inngest/types.ts` | Create | Phase 1 |
| `app/api/inngest/route.ts` | Create | Phase 1 |
| `package.json` | Modify (add dep) | Phase 1 |
| `next.config.ts` | Modify (Serve handler) | Phase 1 |

## Implementation Steps

1. **Install dependency**
   ```bash
   cd apps/ultracode && pnpm add inngest
   ```

2. **Create `src/forest/inngest/types.ts`** — define event payload types:
   - `ReviewJobEvent` — { repoId: string, pullNumber: number, userId: string, trigger: 'manual' | 'scheduled' }
   - `ReviewProgressEvent` — { reviewId: string, status: string, findingsFound: number }

3. **Create `src/forest/inngest/client.ts`** — singleton Inngest client:
   - Import `{ inngest } from 'inngest'`
   - Initialize with `serve()` and sign key from `process.env.INNGEST_EVENT_KEY` (with fallback warning for dev)
   - Export `inngestClient` singleton

4. **Create `src/forest/inngest/index.ts`** — app export:
   - Import `inngestClient`, `REVIEW_JOB_APP` (created in Phase 3)
   - Export `const app = inngestClient.createApp(...)`
   - Export default handler wiring for Next.js

5. **Create `app/api/inngest/route.ts`** — webhook ingestion endpoint:
   - Route: GET/POST `/api/inngest`
   - Use `app.handler()` from Inngest Serve to handle both health checks (GET) and event delivery (POST)

6. **Add `INNGEST_EVENT_KEY` to `.env.example`** and `.env.local` (placeholder value; actual key from Inngest dashboard)

7. **Update `next.config.ts`** to include the Inngest Serve handler via middleware or route config

## Success Criteria
- [ ] `pnpm add inngest` succeeds, lockfile updated
- [ ] `client.ts` exports a working singleton (no runtime errors)
- [ ] `GET /api/inngest` returns Inngest health check response
- [ ] Dev server starts without import errors from new files
- [ ] TypeScript: `npx tsc --noEmit` passes zero errors for new files

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Inngest Event Key not set in production | High | `.env.example` with placeholder; CI/CD validates |
| Next.js 16 route config conflicts with Inngest handler | Medium | Use route segment (`/api/inngest/route.ts`), not middleware |
| Cold start overhead | Low | Inngest processes within same CF Worker; no cold-start penalty |
