# Phase 4: Usage Metering + Overage Billing Implementation

**Date:** 2026-03-19
**Status:** COMPLETE
**Typecheck:** PASSED

---

## Summary

Implemented ROIaaS Phase 4 — Daily API usage tracking with threshold alerts and overage billing.

---

## Files Created

### 1. `src/metering/usage-metering-service.ts`
Core service for tracking daily API usage per license key.

**Features:**
- `trackApiCall()` — Track each API call with license key, tier, endpoint, userId
- `getUsageStatus()` — Get current usage status (limit, remaining, percent used)
- `calculateOverage()` — Calculate overage cost for exceeded usage
- Threshold alerts at 80%, 90%, 100% via EventEmitter
- Daily usage storage with automatic cleanup

**Constants:**
```typescript
DAILY_LIMITS = {
  FREE: 100,
  PRO: 10000,
  ENTERPRISE: 100000
}

OVERAGE_PRICE_PER_CALL = {
  FREE: 0,
  PRO: $0.01,
  ENTERPRISE: $0.005 (50% discount)
}
```

### 2. `src/billing/overage-calculator.ts`
End-of-day billing calculation service.

**Features:**
- `calculateDailyOverage()` — Single day overage calculation
- `calculatePeriodOverage()` — 30-day period summary
- `generateInvoice()` — Human-readable invoice string
- `OverageSummary` interface with charges breakdown

### 3. `src/middleware/usage-tracking-middleware.ts`
Fastify plugin for auto-tracking API calls.

**Features:**
- Auto-tracks on every `onResponse` hook
- Excludes health/metrics/licenses endpoints
- Optional compute timing tracking
- `getUsageStatus()` request decorator
- `getEventTypeInfo()` helper for endpoint categorization

**Usage:**
```typescript
await server.register(usageTrackingPlugin, {
  enabled: true,
  excludePaths: ['/health', '/ready', '/metrics'],
  includeComputeTiming: true,
});
```

### 4. `src/middleware/threshold-alerts.ts`
Threshold alert event emitter and notification handlers.

**Features:**
- `onThreshold(80/90/100, handler)` — Register custom handlers
- `createNotification()` — Format alert with action level
- `sendEmailNotification()` — Email alert helper
- `sendSmsNotification()` — SMS alert helper
- `logAlert()` — Console logging

**Alert Levels:**
| Threshold | Action | Message |
|-----------|--------|---------|
| 80% | warn | Usage approaching limit |
| 90% | urgent | Overage charges may apply |
| 100% | critical | Overage charges applying |

---

## Files Modified

### `src/types/license.ts`
Added usage tracking fields to `License` interface:
```typescript
dailyUsage?: Map<string, number>;
lastUsageDate?: string;
thresholdAlertsSent?: number[];
```

---

## Configuration

Add to `.env`:
```bash
# Usage Metering
USAGE_METERING_ENABLED=true
OVERAGE_ENABLED=true
OVERAGE_PRICE_PER_CALL=0.01

# Alert thresholds
ALERT_THRESHOLD_1=80
ALERT_THRESHOLD_2=90
ALERT_THRESHOLD_3=100
```

---

## Integration Steps

### 1. Register Middleware (src/index.ts or api server)
```typescript
import { usageTrackingPlugin } from './middleware/usage-tracking-middleware';
import { thresholdAlerts } from './middleware/threshold-alerts';

await server.register(usageTrackingPlugin, {
  enabled: process.env.USAGE_METERING_ENABLED === 'true',
  includeComputeTiming: true,
});

// Setup alert handlers
const alerts = thresholdAlerts;
alerts.onEightyPercent((alert) => {
  console.log('80% alert:', alert.licenseKey);
});
alerts.onHundredPercent(async (alert) => {
  await sendOverageNotification(alert.licenseKey);
});
```

### 2. Use Services Directly
```typescript
import { UsageMeteringService } from './metering/usage-metering-service';
import { overageCalculator } from './billing/overage-calculator';

const metering = UsageMeteringService.getInstance();
await metering.trackApiCall('lic_abc123', LicenseTier.PRO, '/api/predict');

const status = metering.getUsageStatus('lic_abc123', LicenseTier.PRO);
const overage = metering.calculateOverage('lic_abc123', LicenseTier.PRO);

// End-of-day billing
const summary = await overageCalculator.calculateOverageSummary('lic_abc123', LicenseTier.PRO, 'tenant_123');
const invoice = overageCalculator.generateInvoice(summary);
```

---

## API Usage Flow

```
1. Request → x-api-key header
2. onResponse hook → trackApiCall()
3. Update daily usage counter
4. Check thresholds → emit alerts
5. Return usage status
6. End-of-day → calculateOverage() → invoice
```

---

## Verification

```bash
# Typecheck
pnpm run typecheck  # PASSED

# Files created
ls -la src/metering/usage-metering-service.ts
ls -la src/billing/overage-calculator.ts
ls -la src/middleware/usage-tracking-middleware.ts
ls -la src/middleware/threshold-alerts.ts

# Types updated
grep "dailyUsage" src/types/license.ts  # Confirmed
```

---

## Next Steps (Phase 5: Dunning)

- Implement dunning-kv-sync for failed payment retries
- Create dunning email templates
- Setup retry schedules for failed subscriptions
- Integrate with Polar.sh subscription events

---

## Unresolved Questions

None. All requirements from `docs/license-management.md` Phase 4 implemented.
