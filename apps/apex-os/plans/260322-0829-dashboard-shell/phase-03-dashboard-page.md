---
title: "Phase 3: Dashboard Page"
description: "Create dashboard page with user profile section"
status: complete
priority: P2
effort: 30m
---

# Phase 3: Dashboard Page

## Context
- Work context: /Users/macbook/mekong-cli/apps/apex-os
- Layout components from Phase 2
- Auth guard hook from Phase 1

## Requirements
1. **Dashboard page** at `/dashboard`
   - Uses `useRequireAuth()` hook (redirects if not authenticated)
   - Shows loading state while checking auth
   - Displays user profile card with:
     - Email address
     - Account created date
     - Account info section
   - Uses `DashboardLayout` wrapper

## Implementation Steps

### 1. Create dashboard page
**File:** `src/pages/dashboard-page.tsx`

```typescript
import { useRequireAuth } from '../hooks/use-require-auth'
import { DashboardLayout } from '../components/dashboard/dashboard-layout'
import { useAuth } from '../contexts/auth-context'

export function DashboardPage() {
  const user = useRequireAuth()
  const { loading } = useAuth()

  // Loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Welcome to ApexOS
        </h2>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Account Information
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-base text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Account Created
              </dt>
              <dd className="text-base text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Account ID
              </dt>
              <dd className="text-base text-gray-900 font-mono text-sm">
                {user.id}
              </dd>
            </div>
          </dl>
        </div>

        {/* Placeholder for future widgets */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Getting Started
          </h3>
          <p className="text-gray-600">
            Your dashboard is ready. More features coming soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
```

## Success Criteria
- [x] Page created at `src/pages/dashboard-page.tsx`
- [x] Uses `useRequireAuth()` for auth protection
- [x] Shows loading spinner while checking auth
- [x] Displays user email, created date, account ID
- [x] Wrapped in `DashboardLayout`
- [x] TypeScript compiles: `pnpm typecheck`

## Related Files
- Creates: `src/pages/dashboard-page.tsx`
- Uses: `src/hooks/use-require-auth.ts`
- Uses: `src/components/dashboard/dashboard-layout.tsx`
- Uses: `src/contexts/auth-context.tsx`
