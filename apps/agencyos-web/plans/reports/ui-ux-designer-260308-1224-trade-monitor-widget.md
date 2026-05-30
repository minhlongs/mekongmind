# ui-ux-designer-260308-1224-trade-monitor-widget.md

**Date:** 2026-03-08
**Agent:** ui-ux-designer
**Mission:** AgencyOS Dashboard - Trade Monitor Widget Implementation

---

## Summary

Implemented complete trade monitoring dashboard widget cho AgencyOS với:
- RaaS Metrics Client library
- TradeMonitorWidget React component
- Real-time metrics visualization
- Tier-based feature gating (FREE/PRO/ENTERPRISE)

---

## Files Created

### 1. `/apps/agencyos-web/lib/raas-metrics-client.ts`

**Purpose:** Client library để fetch trade metrics từ RaaS Gateway

**Features:**
- `getTradeMetrics(tenantId)` - Fetch trade execution metrics
- `getLatencyPercentiles(tenantId)` - Fetch p50/p95/p99 latency data
- `getAnomalies(tenantId)` - Fetch anomaly alerts (ENTERPRISE only)
- `subscribeToUpdates(callback)` - Real-time updates via WebSocket/polling
- `setTier(tier)` - Configure tier-based features
- `mk_` API key authentication support

**Tier Features:**

| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Realtime updates | ❌ | ✅ | ✅ |
| Latency percentiles | ❌ | ✅ | ✅ |
| Anomaly detection | ❌ | ❌ | ✅ |
| Polling interval | 10s | 5s | 2s |
| History depth | 10 | 50 | 200 |

**Authentication:**
- Supports `mk_` prefix API keys via `X-API-Key` header
- Supports Bearer token format via `Authorization` header
- Auto-detects format based on key prefix

---

### 2. `/apps/agencyos-web/components/trading/TradeMonitorWidget.tsx`

**Purpose:** Dashboard widget hiển thị trade execution metrics

**Props:**
```typescript
interface TradeMonitorWidgetProps {
  tenantId: string
  apiKey: string // mk_ API key
  tier?: 'free' | 'pro' | 'enterprise'
  className?: string
  showHeader?: boolean
  compact?: boolean
}
```

**Components:**

#### LatencySparkline
- SVG sparkline chart cho latency visualization
- Customizable color and height
- Renders p95 latency trend

#### ErrorRateIndicator
- Color coding: green (<1%), yellow (<5%), red (>5%)
- Trend indicator (up/down/stable)
- Visual feedback cho error rate health

#### SyncStatusBadge
- Status: synced/syncing/error
- Animated spin icon cho syncing state
- Displays sync latency

#### AnomalyAlertBanner
- ENTERPRISE-only feature
- Severity-based styling (low/medium/high/critical)
- Shows expected vs actual values

**Main Widget Features:**
- Real-time metrics display
- Latency percentiles (p50, p95, p99)
- Trade success rate
- Sparkline chart (PRO+)
- Anomaly alerts (ENTERPRISE)
- Tier badge indicator
- Loading and error states
- Dark mode compatible
- Responsive design (mobile-friendly)

---

## Design Decisions

### 1. Color Coding Strategy

**Error Rate:**
- Green (<1%): Healthy
- Yellow (<5%): Warning
- Red (>5%): Critical

**Rationale:** Industry standard SRE thresholds for error budgets.

### 2. Tier-Based Progressive Disclosure

**FREE:** Basic metrics only (error rate, trade count, sync status)
**PRO:** + Latency percentiles, sparkline chart, faster polling
**ENTERPRISE:** + Anomaly detection, fastest polling, priority support

**Rationale:** Aligns with RaaS billing tiers, provides clear upgrade path.

### 3. WebSocket + Polling Fallback

- PRO/ENTERPRISE: Attempt WebSocket first, fallback to polling
- FREE: Polling only (10s interval)
- Auto-reconnect on WebSocket disconnect

**Rationale:** Balances real-time experience with reliability.

### 4. Component Architecture

- Pure functional components with React hooks
- Client-side rendering ('use client' directive)
- Tailwind CSS for styling (consistent with agencyos-web)
- Lucide React icons (existing project dependency)

---

## Usage Example

```tsx
// app/dashboard/page.tsx
import { TradeMonitorWidget } from '@/components/trading/TradeMonitorWidget'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TradeMonitorWidget
        tenantId="tenant_123"
        apiKey="mk_test_abc123xyz"
        tier="pro"
        className="max-w-4xl"
      />
    </div>
  )
}
```

---

## Build Verification

```
✓ TypeScript compilation passed
✓ Next.js build successful
✓ No ESLint errors
✓ Static page generation completed
```

---

## API Integration

**RaaS Gateway Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/metrics/trades` | GET | Fetch trade execution metrics |
| `/v1/metrics/latency` | GET | Fetch latency percentiles with history |
| `/v1/metrics/anomalies` | GET | Fetch anomaly alerts (ENTERPRISE) |
| `/v1/metrics/ws` | WebSocket | Real-time metrics stream |

**Headers:**
```
Content-Type: application/json
X-API-Key: mk_test_abc123xyz
```

---

## Visual Design

### Widget Layout

```
┌─────────────────────────────────────────────────────┐
│  Activity Icon  Trade Monitor      [Synced 12ms]   │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐│
│  │ Error    │  │ Latency  │  │ Trades   │  │Spark││
│  │ Rate     │  │ P50/P95  │  │ 123/125  │  │line ││
│  │ 0.8% ↓   │  │ P99      │  │ 98.4%    │  │Chart││
│  └──────────┘  └──────────┘  └──────────┘  └─────┘│
├─────────────────────────────────────────────────────┤
│  Real-time updates                     [PRO]       │
└─────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

- Mobile (< 768px): 2 columns, compact layout
- Tablet (768px - 1024px): 2-3 columns
- Desktop (> 1024px): 4 columns, full layout

---

## Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_RAAS_GATEWAY_URL=https://raas.agencyos.network
NEXT_PUBLIC_RAAS_API_KEY=mk_test_xxx
NEXT_PUBLIC_RAAS_TENANT_ID=tenant_xxx
```

---

## Next Steps (Recommended)

1. **Backend API Implementation** - Create `/v1/metrics/*` endpoints in RaaS Gateway
2. **WebSocket Server** - Implement real-time streaming for PRO/ENTERPRISE
3. **Anomaly Detection** - Build ML-based anomaly detection for ENTERPRISE tier
4. **Historical Data** - Add time-range selection and historical charts
5. **Alerting** - Integrate with notification systems (Slack, email, SMS)

---

## Unresolved Questions

1. **RaaS Gateway backend endpoints** - Need to implement `/v1/metrics/*` routes?
2. **WebSocket server** - Should this be in RaaS Gateway or separate service?
3. **Data source** - Where do trade metrics originate? (algo-trader execution engine?)
4. **Anomaly detection thresholds** - What are the specific thresholds for each severity?
5. **Data retention** - How long to keep latency history in memory/DB?

---

## Files Reference

| File | Absolute Path |
|------|---------------|
| RaaS Metrics Client | `/Users/macbookprom1/mekong-cli/apps/agencyos-web/lib/raas-metrics-client.ts` |
| TradeMonitorWidget | `/Users/macbookprom1/mekong-cli/apps/agencyos-web/components/trading/TradeMonitorWidget.tsx` |

---

**Status:** ✅ Complete - Build passing, ready for backend integration
