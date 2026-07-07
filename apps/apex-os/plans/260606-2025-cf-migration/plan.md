# Implementation Plan: Cloudflare Migration
**Ngày:** 2026-06-06
**Mục tiêu:** Chuyển apex-os từ Supabase sang Cloudflare-only stack
**Phạm vi:** Auth, Database, Storage, Deploy

---

## Progress

| Phase | Status | Notes |
|-------|--------|-------|
| 0. Prerequisites | ⚠️ Partial | wrangler 4.76.0 installed, login pending (browser OAuth) |
| 1. CF Resource Setup | ⏸️ Blocked | Needs wrangler login |
| 2. Remove Supabase deps | ✅ Done | auth-helpers-nextjs removed |
| 3. Better Auth + KV | 🔄 Stub | Auth instance stubbed (no D1 yet) |
| 4. D1 Schema | ⏸️ Blocked | Needs CF resources |
| 5. Auth Context Rewrite | 🔄 Partial | Client stub with fetch stubs |
| 6. OpenNext Deploy | 🔄 Config ready | open-next.config.ts created |

## Completed
- Upgraded Next.js 14.2 → 16.2.6
- Upgraded next-intl 3.26.5 → 4.12.0
- Installed @opennextjs/cloudflare 1.19.11
- Removed src/lib/supabase/ directory
- Created auth API routes (stub mode)
- Created open-next.config.ts
- Fixed next.config.js (removed supabase remotePatterns)
- Build compiles GREEN ✅

## Blocked
- wrangler login (needs browser)
- D1 database creation
- Better Auth real impl (needs D1 + KV)
