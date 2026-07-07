# Mekong Content Hub — Project Roadmap

## Phase 1: Foundation ✅ (2026-06-07)
- [x] Project scaffolding (Next.js + TS + Tailwind)
- [x] Supabase schema (contents table + pgvector + RLS)
- [x] 5 seed records (approved + pending)
- [x] Core API routes (CRUD, enrich, tag, search)
- [x] 3 UI pages (submit, audit, search)
- [x] OpenAI integration (enrich + tag + embedding)
- [x] Unit tests (11/11 pass)
- [x] Build passes (exit 0, 0 TS errors)

## Phase 2: Auth & Multi-tenant (TODO)
- [ ] Better Auth integration (email/OAuth)
- [ ] Department-based access control
- [ ] User roles (employee, manager, admin)
- [ ] Audit log for approval actions

## Phase 3: Advanced Features (TODO)
- [ ] Real-time updates (Supabase Realtime)
- [ ] Batch enrichment queue
- [ ] Content versioning
- [ ] Export (CSV/JSON)
- [ ] Analytics dashboard

## Phase 4: Polish (TODO)
- [ ] ShadCN UI components
- [ ] Dark mode
- [ ] Mobile responsive
- [ ] E2E tests (Playwright)
