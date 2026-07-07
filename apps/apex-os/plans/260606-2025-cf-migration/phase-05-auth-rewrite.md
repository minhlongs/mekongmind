# Phase 5: Auth Context Rewrite
**Priority:** High
**Status:** Pending
**Dependencies:** Phase 3, Phase 4

## Requirements
Update all components to use Better Auth instead of Supabase auth.

## Files to Modify
1. `src/app/[locale]/login/page.tsx` — Use Better Auth signIn
2. `src/app/[locale]/signup/page.tsx` — Use Better Auth signUp
3. `src/components/dashboard/*` — Use auth session from Better Auth
4. `src/app/[locale]/layout.tsx` — Add session provider

## Pattern Change
```tsx
// Before (Supabase)
const { signIn, signUp } = useAuth()

// After (Better Auth)
const { signIn, signUp } = useAuth() // same API, different impl
```

## Files to Delete
- `src/contexts/auth-context.tsx`
- `src/lib/supabase/` (after all references removed)

## Success Criteria
- Login/signup forms work with Better Auth
- Dashboard shows user data from D1
- No Supabase imports remain in source
