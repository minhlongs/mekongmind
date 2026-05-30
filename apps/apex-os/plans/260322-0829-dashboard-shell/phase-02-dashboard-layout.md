---
title: "Phase 2: Dashboard Layout"
description: "Create responsive dashboard layout with header, sidebar, main content"
status: pending
priority: P2
effort: 40m
---

# Phase 2: Dashboard Layout

## Context
- Work context: /Users/macbook/mekong-cli/apps/apex-os
- Uses TailwindCSS for styling
- Auth guard hook from Phase 1

## Requirements
1. **Header component** (`dashboard-header.tsx`)
   - Logo/brand on left
   - User email in center/right
   - Sign out button
2. **Sidebar component** (`dashboard-sidebar.tsx`)
   - Navigation links
   - Collapses on mobile (hidden by default, toggle button)
   - Active state for current route
3. **Layout component** (`dashboard-layout.tsx`)
   - Combines header, sidebar, main content
   - Responsive: sidebar hidden on mobile, visible on md+
   - Main content area with proper padding

## Implementation Steps

### 1. Create components directory
```bash
mkdir -p src/components/dashboard
```

### 2. Dashboard Header
**File:** `src/components/dashboard/dashboard-header.tsx`

```typescript
import { useAuth } from '../../contexts/auth-context'

interface DashboardHeaderProps {
  onToggleSidebar?: () => void
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="lg:hidden p-2">
            ☰
          </button>
          <h1 className="text-xl font-bold text-indigo-900">ApexOS</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:inline">
            {user?.email}
          </span>
          <button
            onClick={() => signOut()}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
```

### 3. Dashboard Sidebar
**File:** `src/components/dashboard/dashboard-sidebar.tsx`

```typescript
interface DashboardSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Profile', href: '/dashboard/profile' },
  { label: 'Settings', href: '/dashboard/settings' },
]

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white border-r
          transform transition-transform duration-200
          lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  )
}
```

### 4. Dashboard Layout
**File:** `src/components/dashboard/dashboard-layout.tsx`

```typescript
import { useState } from 'react'
import { DashboardHeader } from './dashboard-header'
import { DashboardSidebar } from './dashboard-sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## Success Criteria
- [ ] Three components created in `src/components/dashboard/`
- [ ] Header shows user email and sign out button
- [ ] Sidebar responsive (hidden mobile, visible desktop)
- [ ] Layout combines all components
- [ ] TypeScript compiles: `pnpm typecheck`

## Related Files
- Creates: `src/components/dashboard/dashboard-header.tsx`
- Creates: `src/components/dashboard/dashboard-sidebar.tsx`
- Creates: `src/components/dashboard/dashboard-layout.tsx`
