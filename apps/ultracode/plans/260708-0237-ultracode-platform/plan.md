# Ultracode Platform - Implementation Plan
**Status:** Pending
**Phases:** 4 foundation phases
**Architecture:** Single Next.js 16 app, SSR runtime on CF Workers, D1 for data, Authentik + GitHub OAuth

> **Critical:** Phase 1.md changes `next.config.ts` (static export → SSR), modifies package.json scripts, and restructures the landing page into route groups. This is a bold direction — review Phase 1.md carefully before approving.

## Phases
1. [Phase 1: Foundation - Extract Landing + D1 + Auth](./phase-1-foundation.md)
2. Phase 2: Core Loop - Repo Connect + AI Review (pending draft)
3. Phase 3: Async Infra - Inngest + LLM Routing + History (pending draft)
4. Phase 4: Polish - Pricing + Billing + Beta Onboarding (pending draft)

## Phase 1 Dependencies
- Cloudflare account with D1 + Workers enabled
- GitHub OAuth App registered (client ID + secret)
- Cloudflare API token for D1 migrations

## Phase 1 Deliverables
- Landing page preserved and re-routed to `/`
- D1 database bound to Worker
- GitHub OAuth login flow
- Dashboard shell with repo list view
