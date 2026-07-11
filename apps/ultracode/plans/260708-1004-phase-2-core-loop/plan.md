---
title: Phase 2 - Core Loop: Repo Connect + AI Review Engine
description: Connect GitHub repos and run streaming AI code reviews
status: pending
priority: P1
effort: 16h
branch: main
tags: [core-loop, llm, github, streaming, review]
created: 2026-07-08
---

# Phase 2: Core Loop — Repo Connect + AI Review Engine

Delivers the product's core value: connect a GitHub repo, run an AI-powered code review with streaming findings.

## Phase Dependencies

- Phase 1 Foundation complete (D1, auth, dashboard shell)
- Working `getSession()`, `getDb()`, `@/lib/logger`
- `.env.local` with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `JWT_SECRET`

## Phases

| # | Phase | Effort | Blocker |
|---|-------|--------|---------|
| 1 | [LLM Client (`src/forest/llm/client.ts`)](./phase-2-01-llm-client.md) | 4h | none |
| 2 | [GitHub Repo API (`app/api/repos/`)](./phase-2-02-github-repos-api.md) | 3h | Phase 1 |
| 3 | [Review Stream API (`app/api/repos/.../review/stream/`)](./phase-2-03-review-stream-api.md) | 5h | Phase 1, 2 |
| 4 | [Reviews CRUD API (`app/api/reviews/`)](./phase-2-04-reviews-api.md) | 2h | Phase 1 |
| 5 | [Dashboard UI: Repos Page](./phase-2-05-repos-ui.md) | 4h | Phase 2, 3 |
| 6 | [Dashboard UI: Reviews Pages](./phase-2-06-reviews-ui.md) | 3h | Phase 4, 5 |
| 7 | [Env + E2E + Verification](./phase-2-07-verify.md) | 2h | all |

## File Ownership

| File | Owner Phase | Type |
|------|-------------|------|
| `src/forest/llm/client.ts` | Phase 1 | new |
| `app/api/repos/github/route.ts` | Phase 2 | new |
| `app/api/repos/register/route.ts` | Phase 2 | new |
| `app/api/repos/[owner]/[repo]/review/stream/route.ts` | Phase 3 | new |
| `app/api/reviews/route.ts` | Phase 4 | new |
| `app/api/reviews/[id]/route.ts` | Phase 4 | new |
| `app/(dashboard)/repos/page.tsx` | Phase 5 | replace |
| `app/(dashboard)/reviews/page.tsx` | Phase 6 | new |
| `app/(dashboard)/reviews/[id]/page.tsx` | Phase 6 | new |
| `app/(dashboard)/layout.tsx` | Phase 6 | update nav only |

## Backwards Compatibility

- No existing routes removed or broken
- Existing `(dashboard)/repos/page.tsx` placeholder replaced — no callers
- New routes added under `/api/repos/*` and `/api/reviews/*`
- Nav updates additive (add `/reviews` link)

## Rollback

| Phase | Rollback |
|-------|---------|
| LLM client | Delete `src/forest/llm/client.ts`, remove env vars |
| Repo APIs | Delete `app/api/repos/` directory |
| Review stream | Delete routes, no D1 data loss (findings/reviews rows are historical) |
| Review CRUD | Delete routes |
| Repos UI | Restore `app/(dashboard)/repos/page.tsx` from git |
| Reviews UI | Delete pages, restore layout.tsx from git |
| Verify | Revert .env.example changes |

## Acceptance Criteria

1. `pnpm exec next build` → 0 TypeScript errors
2. `/dashboard/repos` renders repo list from GitHub API
3. "Connect Repo" → GitHub OAuth flow → repo select modal → D1 insert
4. "Run Review" → streaming SSE response → findings appear client-side in real-time
5. Review + findings persisted in D1 (reviews + findings tables)
6. `/dashboard/reviews` shows history joined with repo names
7. `/dashboard/reviews/[id]` shows severity-badged findings
8. No `:any` types, no `console.log` in production code paths
