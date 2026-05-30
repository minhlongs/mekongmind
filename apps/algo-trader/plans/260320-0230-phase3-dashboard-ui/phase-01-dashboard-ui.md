---
title: "Phase 3 - Algo-Trader Dashboard UI Implementation"
description: "Build React + TypeScript dashboard with signals, P&L analytics, admin controls, and real-time WebSocket updates"
status: completed
priority: P1
effort: 8h
branch: HEAD
tags: [dashboard, react, websocket, phase-3, ui]
created: 2026-03-20
completed: 2026-03-20
---

# Phase 3: Dashboard UI Implementation Plan

## Context Links

- **Plan Dir:** `/Users/macbook/mekong-cli/apps/algo-trader/plans/260320-0230-phase3-dashboard-ui/`
- **Reports:** `/Users/macbook/mekong-cli/apps/algo-trader/plans/reports/`
- **Dashboard Src:** `/Users/macbook/mekong-cli/apps/algo-trader/dashboard/src/`
- **API Routes:** `/Users/macbook/mekong-cli/apps/algo-trader/src/api/routes/`

## Overview

**Priority:** P1 (Blocker for MVP release)
**Status:** ✅ Completed
**Description:** Build complete dashboard UI connecting to Phase 1 (Data Layer) and Phase 2 (API Layer) endpoints with real-time WebSocket updates.

## Phase 1 & 2 Summary (Complete)

| Layer | Status | Components |
|-------|--------|------------|
| Phase 1: Data | ✅ Complete | WebSocket feeds, Redis orderbook, spread detection, order execution, P&L tracking, risk controls |
| Phase 2: API | ✅ Complete | REST API `/trades`, `/pnl`, `/signals`, `/admin`, `/health` endpoints, 258 tests passing |
| Phase 3: UI | ✅ Complete | Signals dashboard, P&L analytics, admin controls, real-time updates |

## API Endpoints Reference

```typescript
// GET /api/signals?minSpread=0&limit=50
interface SignalsResponse {
  data: Signal[];
  count: number;
  limit: number;
}
interface Signal {
  id: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;  // spreadPercent
  latency: number;
  timestamp: number;
}

// GET /api/pnl
interface PerformanceMetrics {
  totalPnl: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgTrade: number;
  bestTrade: number;
  worstTrade: number;
}

// GET /api/pnl/daily?date=2026-03-20
interface PnLSummary {
  date: string;
  totalProfit: number;
  totalLoss: number;
  netPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

// GET /api/trades?limit=100&offset=0
interface TradesResponse {
  data: Trade[];
  total: number;
  limit: number;
  offset: number;
}

// GET /api/admin/status
interface AdminStatus {
  trading: boolean;
  circuitBreaker: { state: 'OPEN' | 'CLOSED' | 'HALF_OPEN'; reason?: string };
  drawdown: { isHalted: boolean; currentDrawdown: number; maxDrawdown: number };
  timestamp: number;
}

// POST /api/admin/halt { reason: string }
// POST /api/admin/resume
```

## Key Insights

1. **Existing dashboard infrastructure** - `dashboard/src/` already has working React + TypeScript + Tailwind setup with Zustand store
2. **Wireframe available** - `docs/wireframes/dashboard.html` provides visual reference for layout
3. **Reusable components** - `EquityCurveChart`, `PriceTickerStrip`, `PositionsTableSortable` can be adapted
4. **API-first design** - All Phase 2 endpoints return JSON with consistent error handling

## Requirements

### Functional

1. **Signals Dashboard** - Display live arbitrage signals from `/api/signals`
2. **P&L Analytics** - Charts showing daily/weekly/monthly performance using Recharts
3. **Admin Controls** - Halt/resume trading buttons with circuit breaker status
4. **Real-time Updates** - WebSocket connection for live price/signal updates to Zustand store

### Non-Functional

1. **Type Safety** - Full TypeScript coverage, no `any` types
2. **Performance** - Initial page load < 3s, WebSocket updates at 60fps
3. **Responsive** - Mobile-first, works on 768px+ screens
4. **Error Handling** - Graceful degradation when API unavailable

## Architecture

### Component Hierarchy

```
DashboardPage (main container)
├── TopBar (status, time, connection)
├── StatsRow (4 cards: Equity, Positions, P&L, Strategies)
├── MainGrid (2 columns)
│   ├── EquityCurvePanel (Recharts line chart)
│   ├── SignalsPanel (live arbitrage opportunities)
│   ├── PnLAnalyticsPanel (daily/weekly/monthly tabs)
│   └── AdminControlsPanel (halt/resume, circuit breaker)
├── TradesPanel (recent trades table)
└── Footer (system status, latency, uptime)
```

### Data Flow

```
WebSocket Server → useWebSocketPriceFeed hook → Zustand Store → Components
                      ↓
REST API → useApi hooks → React Query cache → Components
                      ↓
User Actions → API mutations → Backend → WebSocket broadcast
```

## File Ownership

| File | Type | Description |
|------|------|-------------|
| `dashboard/src/pages/dashboard-page.tsx` | Modify | Main dashboard container (already exists, adapt for Phase 3) |
| `dashboard/src/components/signals-panel.tsx` | Create | Live arbitrage signals display |
| `dashboard/src/components/pnl-analytics-chart.tsx` | Create | P&L performance chart with time range tabs |
| `dashboard/src/components/admin-controls.tsx` | Create | Halt/resume buttons, circuit breaker status |
| `dashboard/src/components/stats-row.tsx` | Create | Top stats cards (equity, positions, P&L) |
| `dashboard/src/hooks/use-signals.ts` | Create | API hook for signals polling |
| `dashboard/src/hooks/use-pnl-analytics.ts` | Create | API hook for P&L metrics |
| `dashboard/src/hooks/use-admin-controls.ts` | Create | API hook for admin actions |
| `dashboard/src/stores/dashboard-store.ts` | Create | Dashboard-specific Zustand store (separate from trading) |
| `dashboard/src/lib/api-client.ts` | Create | Axios/fetch wrapper with error handling |

## Implementation Steps

### Step 1: Setup API Client & Type Definitions (1h)

**Files:** `dashboard/src/lib/api-client.ts`, `dashboard/src/types/api.ts`

```typescript
// dashboard/src/lib/api-client.ts
export const apiClient = {
  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, body: unknown): Promise<T>
  // Include: error handling, timeout, retry logic
}

// dashboard/src/types/api.ts
export interface Signal { /* from API */ }
export interface PerformanceMetrics { /* from API */ }
export interface AdminStatus { /* from API */ }
// ... all API response types
```

**Todo:**
- [x] Create `api-client.ts` with typed fetch wrapper
- [x] Define all API response types in `types/api.ts`
- [ ] Add error types and validation with Zod (deferred to Phase 4)

### Step 2: Create API Hooks (1h)

**Files:** `hooks/use-signals.ts`, `hooks/use-pnl-analytics.ts`, `hooks/use-admin-controls.ts`

```typescript
// use-signals.ts - poll /api/signals every 5s
export function useSignals(minSpread = 0, limit = 50) {
  // Return: { signals, loading, error, refresh }
}

// use-pnl-analytics.ts - fetch /api/pnl and /api/pnl/daily
export function usePnlAnalytics() {
  // Return: { metrics, dailySummaries, loading, error }
}

// use-admin-controls.ts - POST /api/admin/halt|resume
export function useAdminControls() {
  // Return: { status, halt, resume, isLoading, error }
}
```

**Todo:**
- [x] Implement `use-signals` with polling (5s interval)
- [x] Implement `use-pnl-analytics` with caching
- [x] Implement `use-admin-controls` with optimistic updates

### Step 3: Build Dashboard Components (3h)

**Files:** `components/stats-row.tsx`, `components/signals-panel.tsx`, `components/pnl-analytics-chart.tsx`, `components/admin-controls.tsx`

```tsx
// StatsRow - 4 stat cards
<StatsRow
  totalEquity={124580}
  openPositions={7}
  todayPnl={1248.50}
  activeStrategies={4}
/>

// SignalsPanel - live arbitrage table
<SignalsPanel signals={signals} onTrade={executeTrade} />

// PnLAnalyticsChart - Recharts line/bar combo
<PnLAnalyticsChart
  metrics={metrics}
  dailySummaries={dailySummaries}
  timeRange="week"  // day | week | month
/>

// AdminControls - halt/resume + status
<AdminControls
  status={adminStatus}
  onHalt={handleHalt}
  onResume={handleResume}
/>
```

**Todo:**
- [x] Build `StatsRow` component with 4 cards
- [x] Build `SignalsPanel` with sortable table
- [x] Build `PnLAnalyticsChart` using Recharts
- [x] Build `AdminControls` with halt/resume buttons
- [x] Install Recharts: `cd dashboard && npm install recharts`

### Step 4: Integrate WebSocket for Real-time Updates (1.5h)

**Files:** `hooks/use-dashboard-websocket.ts`, `stores/dashboard-store.ts`

```typescript
// Connect to WebSocket endpoint (existing or new)
// Subscribe to: price ticks, signal updates, trade executions
// Update Zustand store on message
// Components re-render automatically via store subscription

export function useDashboardWebSocket() {
  // Connect to ws://localhost:8080/ws/dashboard
  // On message: parse → dispatch to store
}
```

**Todo:**
- [x] Create `dashboard-store.ts` for real-time state
- [x] Implement `use-dashboard-websocket` hook
- [x] Wire up store updates to components

### Step 5: Update Main Dashboard Page (1h)

**Files:** `pages/dashboard-page.tsx`

```tsx
// Integrate all components into cohesive layout
// Handle loading states, error boundaries
// Add refresh button, time range selectors
export function DashboardPage() {
  // Use all hooks from Step 2 & 4
  // Render components from Step 3
  // Handle edge cases (no data, errors, disconnected)
}
```

**Todo:**
- [x] Compose all components in `DashboardPage`
- [x] Add error boundaries and loading states
- [x] Add refresh button and manual controls
- [x] Test responsive layout

### Step 6: Write Tests (0.5h)

**Files:** `dashboard/src/components/__tests__/`, `dashboard/src/hooks/__tests__/`

```typescript
// Unit tests for components
describe('<SignalsPanel />', () => {
  it('renders empty state when no signals', () => {})
  it('displays signals sorted by spread', () => {})
  it('calls onTrade when trade button clicked', () => {})
})

// Integration tests for hooks
describe('usePnlAnalytics', () => {
  it('fetches metrics on mount', async () => {})
  it('handles API errors gracefully', async () => {})
})
```

**Todo:**
- [ ] Write component unit tests (Vitest + React Testing Library) - deferred to Phase 4
- [ ] Write hook integration tests - deferred to Phase 4
- [x] Run `npm run dashboard:build` to verify build passes

## Success Criteria

### Functional Verification

| Criteria | How to Verify |
|----------|---------------|
| Dashboard accessible at `localhost:3000/app` | Open browser, navigate to `/app` |
| Signals display live data from `/api/signals` | Check signals table updates every 5s |
| P&L chart renders with Recharts | Verify chart visible, correct time range tabs |
| Admin halt/resume buttons work | Click halt → verify API call → check status updates |
| WebSocket updates propagate to UI | Watch for real-time price/signal updates |

### Technical Verification

```bash
# Build passes with no errors
cd dashboard && npm run build

# No TypeScript errors
cd dashboard && npx tsc --noEmit

# Tests pass
cd dashboard && npm test

# No ESLint errors (if configured)
cd dashboard && npm run lint
```

### Performance Targets

| Metric | Target |
|--------|--------|
| First contentful paint | < 2s |
| Time to interactive | < 3s |
| WebSocket message handling | < 16ms (60fps) |
| Bundle size (gzipped) | < 500KB |

## Tests Required

### Unit Tests (Components)

1. `<SignalsPanel />` - empty state, data display, sort functionality
2. `<PnLAnalyticsChart />` - time range switching, chart rendering
3. `<AdminControls />` - button states, status display, error handling
4. `<StatsRow />` - stat formatting, color coding for P&L

### Integration Tests (Hooks)

1. `useSignals` - polling interval, error retry
2. `usePnlAnalytics` - data fetching, caching
3. `useAdminControls` - mutation, optimistic updates
4. `useDashboardWebSocket` - connection, reconnection, message handling

### E2E Tests (Playwright)

1. Dashboard loads and displays data
2. Halt trading button works end-to-end
3. Signals update in real-time
4. P&L chart switches time ranges

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebSocket connection unstable | Medium | Implement reconnection logic with backoff |
| API rate limiting | Low | Add polling interval configuration, caching |
| Recharts bundle size | Low | Code splitting, lazy load chart component |
| State management complexity | Medium | Keep stores separate, document state flow |

## Security Considerations

1. **Auth** - Dashboard requires authentication (existing `AuthGuard` component)
2. **API Keys** - Never expose API keys in client code
3. **Input Validation** - Validate all API responses with Zod
4. **XSS** - React auto-escapes, but sanitize any HTML content

## Next Steps

After Phase 3 completion:

1. **Phase 4 (Optional):** Advanced features
   - Strategy configuration UI
   - Backtest results visualization
   - Alert rules management
   - Export reports (CSV, PDF)

2. **Production Deploy:**
   - Deploy to Vercel/Cloudflare Pages
   - Configure environment variables
   - Set up monitoring and alerting

## Unresolved Questions

1. **WebSocket endpoint** - Does existing WebSocket server support dashboard subscriptions, or need new `/ws/dashboard` endpoint?
2. **Authentication** - What auth mechanism for dashboard API calls (JWT, API key, session)?
3. **Historical P&L data** - How far back should P&L chart display (7 days, 30 days, all time)?
4. **Refresh rate** - Is 5s polling for signals appropriate, or need faster/slower?
