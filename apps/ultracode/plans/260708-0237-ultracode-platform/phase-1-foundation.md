# Phase 1: Foundation — Extract Landing + D1 + Auth
**Objective:** Migrate from static-only to SSR runtime while preserving the landing page. Wire up D1 database and GitHub OAuth authentication. Deliver a dashboard shell that authenticated users can load.

## Context
- `next.config.ts` currently has `output: "export"` — must be removed for SSR
- Landing page is a single `app/page.tsx` — needs to become a route group alongside the new dashboard
- No DB, no auth, no middleware exists yet
- CF Pages (static) will serve `/`; CF Workers (SSR) will serve `/dashboard/*`, `/auth/*`, `/review/*`

## Files to Modify

### 1. `next.config.ts`
- Remove `output: "export"`
- Remove `images.unoptimized` (SSR needs image optimization)
- Add `outputFileTracingRoot` (keep)
- Keep `trailingSlash: true`

### 2. `middlewares.ts` (NEW)
- CF Pages middleware or Next.js middleware for auth guard on `/dashboard/*`, `/review/*`
- Public routes: `/`, `/auth/*`, `/api/leads`
- Protected routes: everything else

### 3. `src/db/schema.ts` (NEW)
- D1 table definitions matching the 5-table schema from brainstorm
- Export `USERS`, `REPOS`, `REVIEWS`, `FINDINGS`, `SPRINTS` as CREATE TABLE strings
- Include index statements for query performance

### 4. `src/db/client.ts` (NEW)
- Wrapper around `createServerClient()` from `@/seed/db/client` (Sophia pattern) or direct D1 binding
- Expose `getDb()` that returns D1Database instance
- Handle migration check on cold start

### 5. `src/lib/logger.ts` (NEW)
- CF Workers-compatible structured logger
- Export `info()`, `warn()`, `error()` functions
- No console.log in production (quality gate)

### 6. `src/lib/auth.ts` (NEW)
- GitHub OAuth configuration (client ID, client secret from env)
- Export `signIn()`, `signOut()`, `getSession()` helpers
- Session stored in D1 users table

### 7. `app/(marketing)/page.tsx` (MOVE from `app/page.tsx`)
- Move existing landing page into `app/(marketing)/page.tsx`
- All existing content preserved exactly

### 8. `app/(auth)/github/route.ts` (NEW)
- OAuth initiation endpoint
- Redirect to GitHub with correct scopes (repo, read:user)

### 9. `app/(auth)/callback/route.ts` (NEW)
- Handle GitHub OAuth callback
- Exchange code for token
- Create/find user in D1
- Set session cookie
- Redirect to `/dashboard`

### 10. `app/(auth)/signout/route.ts` (NEW)
- Clear session cookie
- Redirect to `/`

### 11. `app/(dashboard)/layout.tsx` (NEW)
- Dashboard shell layout with sidebar nav
- Show user avatar, name, sign out button
- Protected by auth check

### 12. `app/(dashboard)/page.tsx` (NEW)
- Dashboard home: show connected repos list, "Connect Repo" CTA
- Empty state: "Connect your first repo to get started"
- Sidebar with nav items

### 13. `app/(dashboard)/repos/page.tsx` (NEW)
- Repo management page (placeholder for Phase 2)
- List repos, connect new repo button

### 14. `app/api/leads/route.ts` (KEEP, minor update)
- Update success message to match new branding
- Ensure it works with SSR runtime (no static export dependency)

## Environment Variables Required
```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://ultracode.dev (or CF Pages URL)
```

## Out of Scope This Phase
- Inngest async jobs (Phase 3)
- AI review engine (Phase 2)
- OpenRouter / Anthropic LLM routing (Phase 2)
- Pricing / billing / NOWPayments (Phase 3)
- Sprint dashboard (Phase 3)
- Email notifications (Phase 3)

## Acceptance Criteria
1. `pnpm exec next build` exits 0 with zero TypeScript errors
2. `/` serves the landing page (same content as current static export)
3. `/auth/github` redirects to GitHub OAuth
4. `/auth/callback` handles OAuth response and creates session
5. `/dashboard` renders authenticated user shell, redirects unauthenticated to `/auth/github`
6. D1 tables exist (can verify via `wrangler d1 execute`)
7. Session persists across page navigations (cookie-based)
