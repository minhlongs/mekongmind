---
title: "Phase 1: Auth Guard Hook"
description: "Create useRequireAuth hook for protected routes"
status: complete
priority: P2
effort: 20m
---

# Phase 1: Auth Guard Hook

## Context
- Work context: /Users/macbook/mekong-cli/apps/apex-os
- Auth context: `src/contexts/auth-context.tsx` (has `user`, `loading`, `signOut`)

## Requirements
1. Create custom hook `useRequireAuth()` that:
   - Calls `useAuth()` to get auth state
   - Returns `null` while `loading === true`
   - Redirects to `/login` when `!loading && !user`
   - Returns `user` when authenticated

## Implementation Steps

### 1. Create hook file
**File:** `src/hooks/use-require-auth.ts`

```typescript
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

export function useRequireAuth() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  return user
}
```

### 2. Ensure hooks directory exists
```bash
mkdir -p src/hooks
```

## Success Criteria
- [ ] File created at `src/hooks/use-require-auth.ts`
- [ ] Hook uses `useAuth()` from existing context
- [ ] Handles loading state (returns null)
- [ ] Redirects unauthenticated users to `/login`
- [ ] Returns user when authenticated
- [ ] TypeScript compiles: `pnpm typecheck`

## Related Files
- Creates: `src/hooks/use-require-auth.ts`
- Depends on: `src/contexts/auth-context.tsx`, `src/app/app.tsx` (react-router-dom)
