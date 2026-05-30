---
title: "Phase 4: Update Routes"
description: "Wire up protected dashboard route in app.tsx"
status: pending
priority: P2
effort: 10m
---

# Phase 4: Update Routes

## Context
- Work context: /Users/macbook/mekong-cli/apps/apex-os
- All components and hooks created in Phases 1-3

## Requirements
1. Update `src/app/app.tsx`:
   - Import `DashboardPage` instead of inline component
   - Remove old inline `Dashboard` function
   - Route `/dashboard` to `DashboardPage` component
   - Keep existing routes (`/`, `/login`, `/signup`)

## Implementation Steps

### 1. Update app.tsx
**File:** `src/app/app.tsx`

Replace the current file content to:

```typescript
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from '../contexts/auth-context'
import { LoginPage } from '../pages/login-page'
import { SignupPage } from '../pages/signup-page'
import { DashboardPage } from '../pages/dashboard-page'

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-900">ApexOS</h1>
          <div className="space-x-4">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800">Login</Link>
            <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Sign Up</Link>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-indigo-900 mb-4">Revenue As A Service</h2>
        <p className="text-xl text-gray-600 mb-8">Build your $1M ARR business with AI agents</p>
        <Link to="/signup" className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-indigo-700 inline-block">
          Get Started
        </Link>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

Key changes:
- Remove old inline `Dashboard` function (lines 6-24 in original)
- Add import for `DashboardPage`
- Update `/dashboard` route to use `DashboardPage`

## Success Criteria
- [ ] Old inline `Dashboard` component removed
- [ ] `DashboardPage` imported and used
- [ ] All routes working correctly
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] `pnpm dev` runs without errors

## Related Files
- Modifies: `src/app/app.tsx`
