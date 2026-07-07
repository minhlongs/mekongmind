# Phase 3: Better Auth + KV Setup
**Priority:** High
**Status:** Pending
**Dependencies:** Phase 2

## Requirements
Implement Better Auth with KV session storage.

## Files to Create
1. `src/lib/auth/index.ts` — Better Auth instance
2. `src/lib/auth/auth-client.ts` — Client-side auth hook
3. `src/middleware.ts` — Session refresh (replaces middleware.ts)

## Auth Config
```typescript
// src/lib/auth/index.ts
import { betterAuth } from 'better-auth'
import { drizzle } from 'better-auth/adapters/d1'
import { kv } from '@cloudflare/workers-types' // type only

export const auth = betterAuth({
  database: drizzle(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  session: { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
})
```

## Files to Delete
- `src/contexts/auth-context.tsx` (replaced by auth-client.ts)
- `src/lib/supabase/` directory (after migration complete)

## Success Criteria
- Better Auth instance works
- Register/login/logout functional
- Sessions stored in KV
- Middleware refreshes session on each request
