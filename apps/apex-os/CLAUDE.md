# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ApexOS** — AI-powered copy-trading platform for Southeast Asia. Next.js 16 application deployed to Cloudflare Pages with D1 database. Monorepo located at `/Users/macbook/mekongmind`.

**Tech Stack:**
- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Better Auth with custom D1 adapter
- Cloudflare Workers + D1 (SQLite)
- next-intl for i18n (Vietnamese/English)
- Zustand for state management (in package.json, not yet used)

**Deployment Target:** Cloudflare Pages (via OpenNext)

---

## Common Development Commands

From `/Users/macbook/mekongmind/apps/apex-os`:

```bash
# Development
pnpm dev                    # Start local dev server at localhost:3000
pnpm build                 # Production build (outputs to .next)
pnpm start                # Start production server
pnpm lint                 # ESLint check

# Testing
pnpm test                 # Run all Jest tests once
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Run tests with coverage report

# Database (D1)
wrangler d1 execute apex-os-db --file src/database/migrations/001_initial_schema_d1.sql   # Apply schema
wrangler d1 execute apex-os-db --command "SELECT * FROM profiles"                           # Query DB
wrangler d1 export apex-os-db --output dump.sql                                             # Export data

# Local D1 dev (via wrangler)
wrangler dev              # Local Cloudflare Workers dev with D1

# Single test file
pnpm test path/to/file.test.ts

# Single test by name
pnpm test -t "test name pattern"
```

---

## Architecture

### Routing & i18n
- Locale-based routing: `[locale]` dynamic segment (`/vi`, `/en`)
- Supported locales: `vi`, `en` (defined in `src/i18n/request.ts`)
- Root layout: `src/app/[locale]/layout.tsx` wraps pages with `NextIntlClientProvider`
- Messages loaded from `src/i18n/messages/{locale}.json`

### Database Layer
- **Cloudflare D1** (SQLite) — not Supabase
- Schema in `src/database/migrations/001_initial_schema_d1.sql`
- Tables: `profiles`, `signals`, `copy_relationships`, `paper_accounts`, `referrals`
- Better Auth adapter in `src/lib/auth/adapters/d1-adapter.ts` — custom implementation without kysely

### Authentication
- **Better Auth** v4 with custom D1 adapter
- Factory pattern: `src/lib/auth/auth-factory.ts` creates auth instance
- Route handler: `src/app/api/auth/[...all]/route.ts` (catch-all for all auth endpoints)
- Client-side context: `src/contexts/auth-context.tsx` — provides `useAuth()` hook

### Component Conventions
- Server components by default; client components only when using React hooks
- Client components marked with `'use client'` directive
- Dashboard uses shared layout components in `src/components/dashboard/`
- Tailwind brand colors defined in `tailwind.config.js` (`brand.500` primary)

---

## Critical Known Issues

1. **Dashboard uses react-router-dom** — `DashboardSidebar` imports `NavLink` from `react-router-dom`, which is incompatible with Next.js App Router. Must replace with Next.js `Link` and `usePathname` from `next/navigation`.

2. **Hardcoded locale paths** — Landing page uses `/vi/login`, `/vi/signup` links. Should use locale-aware navigation: `href={`/${locale}/login`} or better, `useRouter().push('/login')` with locale preserved.

3. **Root layout hardcoded lang** — `src/app/layout.tsx` sets `lang="vi"` hardcoded. Should derive from locale in `[locale]` layout.

4. **TypeScript module resolution** — `tsconfig.json` uses path alias `@/*` → `./src/*`. Ensure imports use `@/` prefix for src-relative paths.

5. **Better Auth D1 adapter** — uses D1 interface typed inline; ensure `globalThis.DB` binding exists in Cloudflare Workers runtime.

---

## File Structure

```
src/
├── app/
│   ├── [locale]/           # Locale-scoped pages
│   │   ├── landing/page.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx      # Locale layout with i18n provider
│   ├── api/
│   │   └── auth/[...all]/route.ts   # Better Auth handler
│   └── layout.tsx          # Root layout (currently hardcoded lang)
├── components/
│   └── dashboard/          # Dashboard shell (needs Next.js routing fix)
├── contexts/
│   └── auth-context.tsx    # Auth React context
├── database/
│   └── migrations/         # SQL schema files
├── i18n/
│   ├── request.ts          # next-intl config
│   └── messages/           # vi.json, en.json
└── lib/
    └── auth/
        ├── auth-factory.ts # Better Auth factory
        └── adapters/
            └── d1-adapter.ts  # Custom D1 adapter
```

---

## Environment Variables

From `.env.example`:
```bash
# Auth (Better Auth)
BETTER_AUTH_SECRET=random-32-char-secret

# Cloudflare
CF_ACCOUNT_ID=your-account
CF_API_TOKEN=your-api-token

# D1 Database
D1_DATABASE=apex-os-db
```

Note: The `.env.example` in repo is outdated (references Supabase). Use actual env vars for Cloudflare D1.

---

## Testing Strategy

- Jest + React Testing Library configured (`jest.config.js`)
- Tests should live alongside source files as `*.test.ts`/`*.test.tsx` or in `__tests__/`
- Coverage target: 70% minimum
- No E2E tests yet (Playwright not configured)

---

## Deployment Notes

- Built for Cloudflare Pages using OpenNext (`@opennextjs/cloudflare`)
- Config: `open-next.config.ts` + `wrangler.toml`
- Build output: `.next/` + `open-next/` worker bundle
- Apply migrations with `wrangler d1 execute` before first deploy

---

## Style Guide

- TypeScript strict mode (`strict: true`)
- React Server Components by default
- Tailwind CSS for styling; use brand color palette
- i18n: wrap UI text in `useTranslations()` hooks
- Error handling: try/catch with meaningful messages; avoid silent failures

---

## Git Workflow

Use conventional commits:
```bash
git commit -m "feat: add user profile page"
git commit -m "fix: correct locale navigation in landing"
git commit -m "refactor: replace react-router-dom with next/link"
```
