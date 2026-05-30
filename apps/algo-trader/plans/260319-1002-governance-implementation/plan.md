---
title: "RaaS Governance Implementation Plan"
description: "Complete implementation of license management, Polar.sh billing, usage metering, dunning, and audit logging for ROIaaS Phase 2-6"
status: pending
priority: P1
effort: 24h
branch: main
tags: [raas, governance, billing, metering, audit, polar.sh]
created: 2026-03-19
---

# RaaS Governance Implementation Plan

## Executive Summary

**Gap Severity: CRITICAL** - Dashboard UI fully implemented but backend is 100% empty. All 5 governance directories (`src/billing/`, `src/metering/`, `src/middleware/`, `src/audit/`, `src/gate/`) contain zero files. API endpoints return 404.

**Current State:**
- ✅ Dashboard UI: License CRUD, audit log viewer, analytics components complete
- ✅ Spec docs: `docs/license-management.md` defines Phases 2-6
- ❌ Backend: Zero implementation - no routes, no services, no middleware
- ❌ Polar.sh: No webhook integration, no payment sync
- ❌ Metering: No usage tracking, no overage calculation
- ❌ Audit: No audit logging infrastructure

**Business Impact:**
- Cannot monetize RaaS offering without license gates
- No payment → license provisioning automation
- No usage tracking → cannot bill overages or enforce limits
- No audit trail → compliance risk for enterprise customers

---

## Phase Overview

| Phase | Name | Effort | Dependencies | Status |
|-------|------|--------|--------------|--------|
| 2 | License Management API | 6h | None | Pending |
| 3 | Polar.sh Webhook Integration | 4h | Phase 2 | Pending |
| 4 | Usage Metering + Overage | 6h | Phase 2 | Pending |
| 5 | Dunning System | 4h | Phase 3, 4 | Pending |
| 6 | Audit Logging Infrastructure | 4h | Phase 2 | Pending |

---

## Phase 2: License Management API (6h)

### Objective
Implement CRUD API endpoints for license lifecycle management per `docs/license-management.md`.

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/licenses` | Create license | Admin API key |
| GET | `/api/v1/licenses` | List licenses (paginated) | Admin API key |
| GET | `/api/v1/licenses/:id` | Get single license | Admin API key |
| PATCH | `/api/v1/licenses/:id/revoke` | Revoke license | Admin API key |
| DELETE | `/api/v1/licenses/:id` | Delete license | Admin API key |
| GET | `/api/v1/licenses/:id/audit` | Get audit logs | Admin API key |
| GET | `/api/v1/licenses/analytics` | Aggregate analytics | Admin API key |

### Files to Create

```
src/
├── routes/
│   └── licenses.ts                    # Fastify route handlers (all 7 endpoints)
├── services/
│   └── license-service.ts             # Business logic: CRUD, key generation, validation
├── db/
│   ├── schema.ts                      # Prisma schema: License, Subscription, Payment tables
│   └── migrations/
│       └── 20260319_add_license_tables.sql
├── lib/
│   └── license-key-generator.ts       # Key format: raas-{tier}-{random}
└── middleware/
    └── admin-auth.ts                  # X-API-Key validation for admin routes
```

### Implementation Checklist

- [ ] **2.1** Define Prisma schema for `License` table
  - Fields: `id`, `name`, `key`, `tier`, `status`, `tenantId`, `domain`, `expiresAt`, `usageCount`, `maxUsage`, `overageUnits`, `overageAllowed`, `createdAt`, `updatedAt`
- [ ] **2.2** Generate migration: `npx prisma migrate dev --name add_license_tables`
- [ ] **2.3** Create `LicenseKeyGenerator` utility
  - Format: `raas-{tier}-{random16}` where tier = `free`|`rpp`|`rep`
  - Example: `raas-rpp-ABCD1234-WXYZ7890`
- [ ] **2.4** Create `LicenseService` singleton
  - Methods: `create()`, `list()`, `getById()`, `revoke()`, `delete()`, `getAuditLogs()`, `getAnalytics()`
  - Validation: Unique key, tier enum, status transitions
- [ ] **2.5** Create `admin-auth` middleware
  - Validate `X-API-Key` header against `ADMIN_API_KEY` env var
  - Attach admin user to request context
- [ ] **2.6** Implement `src/routes/licenses.ts`
  - Register all 7 endpoints
  - Request validation with Zod schemas
  - Error handling with proper HTTP status codes
- [ ] **2.7** Add route registration to main server
  - Import and register `/api/v1/licenses` routes in `src/index.ts`
- [ ] **2.8** Write unit tests
  - CRUD operations
  - Key uniqueness validation
  - Status transitions (active → revoked)
  - Audit log queries

### Success Criteria

- [ ] All 7 endpoints respond with correct status codes
- [ ] License keys follow spec format (raas-{tier}-{random})
- [ ] Admin auth middleware blocks unauthenticated requests
- [ ] Prisma migration applies successfully to Supabase
- [ ] Unit tests pass (minimum 15 test cases)

### API Examples

**Create License:**
```bash
curl -X POST http://localhost:3000/api/v1/licenses \
  -H "X-API-Key: admin-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Prod License", "tier": "PRO", "tenantId": "t123"}'
```

**Response:**
```json
{
  "id": "lic_abc123",
  "name": "Prod License",
  "key": "raas-rpp-ABCD1234-WXYZ7890",
  "tier": "PRO",
  "status": "active",
  "tenantId": "t123",
  "createdAt": "2026-03-19T10:00:00Z"
}
```

---

## Phase 3: Polar.sh Webhook Integration (4h)

### Objective
Automate license provisioning from Polar.sh subscription events.

### Webhook Events

| Event | Action | License Impact |
|-------|--------|----------------|
| `subscription.created` | Create subscription record | Provision new PRO/ENTERPRISE license |
| `subscription.active` | Update status | Activate license |
| `subscription.updated` | Update tier/period | Upgrade/downgrade license tier |
| `subscription.cancelled` | Mark cancelled | Downgrade to FREE at period end |
| `checkout.created` | Track checkout | No change (pending payment) |
| `payment.success` | Record payment | Maintain current tier |
| `payment.failed` | Record failed | Flag for dunning (Phase 5) |

### Files to Create

```
src/
├── routes/
│   └── webhooks.ts                    # POST /api/v1/webhooks/polar handler
├── services/
│   └── polar-service.ts               # Webhook signature verification, event routing
├── db/
│   └── schema.ts                      # Add: Subscription, Payment tables
└── lib/
    └── polar-types.ts                 # TypeScript types for Polar webhook payloads
```

### Implementation Checklist

- [ ] **3.1** Add Polar.sh types to `src/lib/polar-types.ts`
  - `SubscriptionCreated`, `SubscriptionActive`, `SubscriptionUpdated`, etc.
- [ ] **3.2** Extend Prisma schema
  - `Subscription` table: `id`, `polarId`, `licenseId`, `tier`, `status`, `currentPeriodStart`, `currentPeriodEnd`, `createdAt`
  - `Payment` table: `id`, `polarId`, `licenseId`, `amount`, `currency`, `status`, `createdAt`
- [ ] **3.3** Generate migration: `npx prisma migrate dev --name add_subscription_tables`
- [ ] **3.4** Create `PolarService` singleton
  - Method: `verifyWebhook(payload, signature)` using HMAC-SHA256
  - Method: `handleEvent(eventType, data)` - route to license service
- [ ] **3.5** Implement `src/routes/webhooks.ts`
  - POST `/api/v1/webhooks/polar` endpoint
  - Signature verification middleware
  - Event routing to `PolarService`
- [ ] **3.6** Add env vars to `.env.example`
  - `POLAR_API_KEY=sk_polar_...`
  - `POLAR_WEBHOOK_SECRET=whsec_...`
  - `POLAR_SUCCESS_URL=https://algo-trader.com/upgrade/success`
- [ ] **3.7** Write integration tests
  - Webhook signature verification
  - Each event type handling
  - License auto-provisioning flow

### Success Criteria

- [ ] Webhook endpoint accepts valid Polar.sh signatures
- [ ] Webhook endpoint rejects invalid signatures (HTTP 401)
- [ ] `subscription.active` event provisions PRO license automatically
- [ ] `subscription.cancelled` downgrades license to FREE
- [ ] Subscription and Payment records saved to database

### Webhook Payload Example

```json
{
  "type": "subscription.active",
  "data": {
    "object": {
      "id": "sub_2JZ9X8Y7W6V5U4T3",
      "product_id": "pro-monthly",
      "customer_email": "user@example.com",
      "status": "active",
      "current_period_start": "2026-03-01T00:00:00Z",
      "current_period_end": "2026-04-01T00:00:00Z"
    }
  }
}
```

---

## Phase 4: Usage Metering + Overage Billing (6h)

### Objective
Track daily API usage per license, calculate overage charges, emit threshold alerts.

### Daily Tier Limits

| Tier | API Calls/Day | Overage Price |
|------|---------------|---------------|
| FREE | 100 | N/A (hard block) |
| PRO | 10,000 | $0.01/call over |
| ENTERPRISE | 100,000 | $0.005/call over |

### Files to Create

```
src/
├── services/
│   ├── usage-metering-service.ts      # Track usage, check limits, calculate overage
│   └── overage-calculator.ts          # End-of-day billing calculations
├── middleware/
│   └── usage-tracking.ts              # Auto-track API calls on every request
├── lib/
│   ├── usage-types.ts                 # UsageStatus, UsageRecord, OverAlert types
│   └── constants.ts                   # DAILY_LIMITS, OVERAGE_PRICE_PER_CALL
├── routes/
│   └── usage.ts                       # GET /api/v1/usage/:licenseKey endpoints
└── db/
    └── schema.ts                      # Add: UsageRecord, AlertRule tables
```

### Implementation Checklist

- [ ] **4.1** Define constants in `src/lib/constants.ts`
  - `DAILY_LIMITS = { FREE: 100, PRO: 10000, ENTERPRISE: 100000 }`
  - `OVERAGE_PRICE_PER_CALL = { PRO: 0.01, ENTERPRISE: 0.005 }`
  - `THRESHOLDS = [80, 90, 100]`
- [ ] **4.2** Extend Prisma schema
  - `UsageRecord` table: `id`, `licenseId`, `date`, `endpoint`, `units`, `createdAt`
  - `AlertRule` table: `id`, `licenseId`, `threshold`, `enabled`, `createdAt`
- [ ] **4.3** Generate migration: `npx prisma migrate dev --name add_usage_tables`
- [ ] **4.4** Create `UsageMeteringService` singleton
  - Method: `trackApiCall(licenseKey, endpoint, units)`
  - Method: `getUsageStatus(licenseKey)` - current usage vs limit
  - Method: `calculateOverage(licenseKey)` - cost calculation
  - Event emitter: `on('threshold_alert', callback)` for 80/90/100% alerts
- [ ] **4.5** Create `OverageCalculator` service
  - Method: `calculateOverageSummary(tenantId, period)` - monthly billing
- [ ] **4.6** Create `usage-tracking` middleware
  - Auto-track API calls on every request (exclude: `/health`, `/ready`, `/metrics`)
  - Support `includeComputeTiming` for ML compute minutes
- [ ] **4.7** Implement `src/routes/usage.ts`
  - GET `/api/v1/usage/:licenseKey` - current usage status
  - GET `/api/v1/usage/:licenseKey/breakdown` - endpoint breakdown
  - GET `/api/v1/overage/:licenseKey` - overage charges
  - POST `/api/v1/usage/reset` - admin reset (admin auth required)
- [ ] **4.8** Register middleware in main server
  - Import `usageTrackingPlugin` in `src/index.ts`
- [ ] **4.9** Write unit tests
  - Usage tracking accuracy
  - Overage calculations
  - Threshold alert emissions
  - Middleware exclusion paths

### Success Criteria

- [ ] API calls auto-tracked on every request
- [ ] Usage status accurate to real-time
- [ ] Threshold alerts emit at 80%, 90%, 100%
- [ ] Overage calculations match spec ($0.01/call PRO, $0.005/call ENT)
- [ ] Usage endpoints return correct data

### Usage Tracking Example

```typescript
const metering = UsageMeteringService.getInstance();

// Track API call (automatic via middleware)
await metering.trackApiCall('lic_abc123', '/api/v1/predict', 'user_123');

// Check usage status
const status = metering.getUsageStatus('lic_abc123');
// {
//   licenseKey: 'lic_abc123',
//   date: '2026-03-19',
//   tier: 'pro',
//   dailyLimit: 10000,
//   currentUsage: 1,
//   remaining: 9999,
//   percentUsed: 0.01,
//   isExceeded: false,
//   overageUnits: 0,
//   overageCost: 0
// }
```

---

## Phase 5: Dunning System (4h)

### Objective
Suspend licenses on payment failure, reinstate on payment success.

### Dunning Flow

```
payment.failed → Flag for review → 3 retries over 7 days → subscription.cancelled → license downgrade
payment.success → Clear dunning flag → maintain/restore license tier
```

### Files to Create

```
src/
├── services/
│   └── dunning-service.ts             # Suspension/reinstatement logic
├── lib/
│   └── dunning-types.ts               # DunningState, DunningEvent types
└── routes/
    └── dunning.ts                     # GET /api/v1/dunning/:licenseId (admin view)
```

### Implementation Checklist

- [ ] **5.1** Extend Prisma schema
  - Add `dunningState`, `dunningRetryCount`, `dunningNextRetry` to `License` table
- [ ] **5.2** Generate migration: `npx prisma migrate dev --name add_dunning_fields`
- [ ] **5.3** Create `DunningService` singleton
  - Method: `markPaymentFailed(licenseId)` - flag for dunning
  - Method: `retryPayment(licenseId)` - schedule retry
  - Method: `suspendLicense(licenseId)` - revoke after max retries
  - Method: `reinstateLicense(licenseId, newTier)` - restore on payment success
- [ ] **5.4** Integrate with Polar.sh events
  - Listen `payment.failed` → `DunningService.markPaymentFailed()`
  - Listen `payment.success` → `DunningService.reinstateLicense()`
- [ ] **5.5** Implement `src/routes/dunning.ts`
  - GET `/api/v1/dunning/:licenseId` - dunning status (admin auth)
- [ ] **5.6** Write integration tests
  - Payment failure → suspension flow
  - Payment success → reinstatement flow

### Success Criteria

- [ ] Failed payments trigger dunning workflow
- [ ] License suspended after 3 failed retries
- [ ] Successful payment reinstates license tier
- [ ] Dunning status visible via admin API

---

## Phase 6: Audit Logging Infrastructure (4h)

### Objective
Comprehensive audit trail for license events with IP tracking and metadata capture.

### Event Types

| Event Type | Trigger | Metadata |
|------------|---------|----------|
| `created` | License created | tier, tenantId, creator |
| `activated` | License activated | domain, ipAddress |
| `revoked` | License revoked | reason, adminId |
| `api_call` | API request | endpoint, method, latency |
| `ml_feature` | ML feature used | model, compute_time |
| `rate_limit` | Rate limit hit | limit, current, retry_after |

### Files to Create

```
src/
├── services/
│   └── audit-log-service.ts           # Write/read audit events
├── lib/
│   └── audit-types.ts                 # AuditLog, AuditEvent types
├── middleware/
│   └── audit-logging.ts               # Auto-log API calls
└── db/
    └── schema.ts                      # Add: AuditLog table
```

### Implementation Checklist

- [ ] **6.1** Define Prisma schema for `AuditLog` table
  - Fields: `id`, `licenseId`, `event`, `tier`, `ip`, `metadata`, `createdAt`
  - Indexes: `licenseId`, `event`, `createdAt`
- [ ] **6.2** Generate migration: `npx prisma migrate dev --name add_audit_log_table`
- [ ] **6.3** Define audit types in `src/lib/audit-types.ts`
  - `AuditLog` interface matching DB schema
  - `AuditEvent` enum: `created`, `activated`, `revoked`, `api_call`, `ml_feature`, `rate_limit`
- [ ] **6.4** Create `AuditLogService` singleton
  - Method: `log(event, licenseId, options)` - write audit event
  - Method: `getLogs(licenseId, filters)` - query with pagination
  - Method: `getEventsByType(eventType, limit)` - analytics queries
  - Retention policy: Auto-archive logs older than 90 days
- [ ] **6.5** Create `audit-logging` middleware
  - Auto-log API calls with IP, method, endpoint, latency
  - Skip health checks and metrics endpoints
- [ ] **6.6** Integrate with LicenseService
  - Log `created` on license creation
  - Log `revoked` on license revocation
  - Log `activated` on license activation
- [ ] **6.7** Write unit tests
  - Audit log creation
  - Log queries with filters
  - Retention policy enforcement

### Success Criteria

- [ ] All license events logged with IP and metadata
- [ ] API calls auto-logged via middleware
- [ ] Audit log queries support filtering by event type
- [ ] Retention policy archives old logs
- [ ] Dashboard `GET /api/v1/licenses/:id/audit` returns audit logs

### Audit Log Example

```typescript
const audit = AuditLogService.getInstance();

// Log event
await audit.log('created', 'lic_abc123', {
  tier: 'PRO',
  tenantId: 't123',
  creator: 'admin',
  ip: '192.168.1.1',
});

// Query logs
const logs = await audit.getLogs('lic_abc123', {
  eventType: 'api_call',
  limit: 50,
  cursor: 'cursor_token',
});
```

---

## Testing Requirements

### Unit Tests (per phase)

| Phase | Minimum Tests | Key Scenarios |
|-------|---------------|---------------|
| 2 | 15 | CRUD, key gen, validation, status transitions |
| 3 | 10 | Signature verification, event routing, auto-provisioning |
| 4 | 20 | Usage tracking, overage calc, threshold alerts |
| 5 | 8 | Dunning flow, suspension, reinstatement |
| 6 | 12 | Log creation, queries, retention, middleware |

**Total: 65+ unit tests**

### Integration Tests

- [ ] License creation → Polar webhook → active subscription
- [ ] API calls → usage tracking → overage billing
- [ ] Payment failure → dunning → suspension
- [ ] Payment success → reinstatement
- [ ] Dashboard fetches licenses + audit logs

### E2E Tests

- [ ] User purchases subscription → license auto-provisioned → API access granted
- [ ] User exceeds limit → threshold alert → overage charged
- [ ] Payment fails → dunning → suspension → payment success → reinstatement

---

## Dependencies

### Phase 2 (License API)
- Prisma ORM setup
- Supabase PostgreSQL connection
- Fastify server with route registration

### Phase 3 (Polar.sh)
- Phase 2 complete (LicenseService)
- Polar.sh account + webhook secret

### Phase 4 (Metering)
- Phase 2 complete (LicenseService)
- Fastify middleware registration

### Phase 5 (Dunning)
- Phase 3 complete (Polar webhook events)
- Phase 4 complete (Usage tracking)

### Phase 6 (Audit)
- Phase 2 complete (LicenseService)
- Fastify middleware registration

---

## Environment Variables

Add to `.env.example`:

```bash
# Admin Auth
ADMIN_API_KEY=admin-key-change-me

# Polar.sh
POLAR_API_KEY=sk_polar_...
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_SUCCESS_URL=https://algo-trader.com/upgrade/success

# Usage Metering
USAGE_METERING_ENABLED=true
OVERAGE_ENABLED=true
OVERAGE_PRICE_PER_CALL=0.01

# Alert thresholds
ALERT_THRESHOLD_1=80
ALERT_THRESHOLD_2=90
ALERT_THRESHOLD_3=100

# Database (existing)
DATABASE_URL=postgresql://...
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Polar.sh webhook failures | Licenses not provisioned | Retry queue + manual provisioning endpoint |
| Usage tracking performance | API latency increase | Async tracking, batch inserts |
| Overage billing errors | Revenue loss, customer disputes | Daily reconciliation, manual override API |
| Audit log storage costs | High DB storage | 90-day retention, archive to S3/R2 |

---

## Unresolved Questions

1. **RaaS Gateway Integration**: Should dashboard activate licenses against RaaS Gateway directly or always via local backend?
2. **Multi-tenant isolation**: Should usage tracking be per-tenant or per-license?
3. **Overage billing timing**: End-of-day vs real-time invoicing?
4. **Audit log retention**: 90 days or configurable per tenant?

---

## Effort Summary

| Phase | Effort | Cumulative |
|-------|--------|------------|
| 2 | 6h | 6h |
| 3 | 4h | 10h |
| 4 | 6h | 16h |
| 5 | 4h | 20h |
| 6 | 4h | 24h |

**Total: 24 hours**

---

## Next Steps

1. [ ] Create Phase 2 tasks via TaskCreate
2. [ ] Set up Prisma schema + run first migration
3. [ ] Implement LicenseService + routes
4. [ ] Test endpoints with Postman/curl
5. [ ] Proceed to Phase 3 (Polar.sh integration)
