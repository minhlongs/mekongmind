---
title: "ApexOS Phase 3: Dashboard Shell"
description: "Protected dashboard with auth guard, layout, and user profile"
status: complete
priority: P2
effort: 2h
actual: 1.5h
branch: main
tags: [dashboard, auth, ui, phase-3]
created: 2026-03-22
completed: 2026-03-22
---

# Dashboard Shell Implementation Plan

## Overview
Build protected dashboard area with authentication guard, responsive layout, and user profile section.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  /dashboard (Protected Route)                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  AuthGuard Hook                               │  │
│  │  - useAuth() from context                     │  │
│  │  - loading → show spinner                     │  │
│  │  - !user → redirect /login                    │  │
│  │  - user → render Dashboard                    │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Dashboard Layout                             │  │
│  │  ├─ Header (logo, user menu, sign out)       │  │
│  │  ├─ Sidebar (nav links - mobile responsive)  │  │
│  │  └─ Main Content (user profile, widgets)     │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| [Phase 1: Auth Guard Hook](./phase-01-auth-guard-hook.md) | ✅ complete | Create `useRequireAuth()` hook |
| [Phase 2: Dashboard Layout](./phase-02-dashboard-layout.md) | ✅ complete | Header, sidebar, responsive design |
| [Phase 3: Dashboard Page](./phase-03-dashboard-page.md) | ✅ complete | Profile section, sign out button |
| [Phase 4: Update Routes](./phase-04-update-routes.md) | ✅ complete | Wire up protected route in app.tsx |

## Dependencies
- ✅ Auth context exists (`src/contexts/auth-context.tsx`)
- ✅ Login/signup pages exist
- ⏳ Dashboard shell (this plan)
- ⏳ Future: Billing integration (Phase 4+)

## Files to Create
- `src/hooks/use-require-auth.ts` - Auth guard hook
- `src/components/dashboard/dashboard-layout.tsx` - Layout component
- `src/components/dashboard/dashboard-header.tsx` - Header with user menu
- `src/components/dashboard/dashboard-sidebar.tsx` - Responsive nav
- `src/pages/dashboard-page.tsx` - Dashboard page with profile

## Files to Modify
- `src/app/app.tsx` - Add protected route wrapper

## Success Criteria
- [x] Unauthenticated users redirected from /dashboard to /login
- [x] Loading spinner shown while checking auth
- [x] Dashboard layout with header, sidebar, main content
- [x] User email displayed in header
- [x] Sign out button functional
- [x] Mobile responsive (sidebar collapses on small screens)
- [x] TypeScript compiles with 0 errors
- [x] All tests pass

## Risks
| Risk | Mitigation |
|------|------------|
| Auth state race condition | Use `loading` flag from context |
| Mobile sidebar complexity | Use Tailwind responsive utilities |
| Redirect loop | Check `!loading` before redirect |

## Unresolved Questions
- None - requirements clear, existing auth context sufficient
