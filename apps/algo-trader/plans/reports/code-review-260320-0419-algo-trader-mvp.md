# Code Review: Algo-Trader MVP Implementations

**Date:** 2026-03-20
**Reviewer:** code-reviewer agent
**Scope:** Alert system, Monitoring, CI/CD, Metrics

---

## Review Summary

| Category | Status | Issues |
|----------|--------|--------|
| Security | ⚠️ MODERATE | 3 findings |
| Performance | ✅ GOOD | 2 minor |
| Code Quality | ⚠️ MODERATE | 4 findings |
| Type Safety | ⚠️ MODERATE | 7 `any` types |
| Error Handling | ✅ GOOD | 1 suggestion |

---

## [CRITICAL] Security Findings

### 1. Environment Variable Exposure Risk — `src/config/env.ts`

**Evidence:**
- `POLAR_API_KEY`, `POLAR_WEBHOOK_SECRET`, `TWILIO_AUTH_TOKEN`, `SENDGRID_API_KEY`, `TELEGRAM_BOT_TOKEN` all accessed directly
- Default fallback to empty string `''` masks missing configuration

**Impact:** Silent failures when env vars missing; potential credential leakage if error messages expose values.

**Recommendation:**
```typescript
// Instead of:
POLAR_API_KEY: process.env.POLAR_API_KEY || ''

// Use validation:
POLAR_API_KEY: process.env.POLAR_API_KEY ||
  (() => { throw new Error('POLAR_API_KEY required') })()
```

---

### 2. Admin Auth Bypass — `src/middleware/admin-auth.ts`

**Evidence:**
```typescript
const ADMIN_API_KEYS =
  (process.env.ADMIN_API_KEYS || '').split(',').filter(Boolean)
const DEFAULT_ADMIN_KEY = process.env.ADMIN_API_KEY;
```

**Impact:** If `ADMIN_API_KEYS` is empty and `ADMIN_API_KEY` undefined, middleware may allow unauthorized access depending on implementation.

**Recommendation:** Add explicit validation:
```typescript
if (!DEFAULT_ADMIN_KEY && ADMIN_API_KEYS.length === 0) {
  throw new Error('No admin API keys configured');
}
```

---

### 3. Telegram Bot Token Handling — `src/telegram/bot.ts`

**Evidence:**
```typescript
botToken: process.env.TELEGRAM_BOT_TOKEN || ''
```

**Impact:** Empty token allows bot to initialize but fail silently at runtime.

**Recommendation:** Return `false` from `initialize()` with clear error message; log warning without exposing token value.

---

## [IMPORTANT] Performance & Reliability

### 4. Memory Leak Risk — `src/telegram/bot.ts` (Line 25-27)

**Evidence:**
```typescript
private userSessions: Map<number, UserSession> = new Map();
private lastSendTime: Map<number, number> = new Map();
```

**Impact:** Maps grow indefinitely with no cleanup. Long-running service = memory bloat.

**Recommendation:**
- Add LRU cache with TTL (e.g., 24h expiry)
- Implement periodic cleanup: `setInterval(() => cleanup(), 3600000)`

---

### 5. Rate Limit State Not Persisted — `src/notifications/*.ts`

**Evidence:**
```typescript
private lastSendTime: number = 0;  // Lost on restart
private dailyCounts: Map<string, { count: number; date: string }> = new Map();
```

**Impact:** Service restart resets rate limits and daily counters → users may receive duplicate alerts or exceed limits.

**Recommendation:** Store counters in Redis with TTL:
```typescript
await redis.setex(`sms:daily:${recipient}`, 86400, count);
```

---

## [MODERATE] Code Quality

### 6. DRY Violation — Alert Body Generation

**Evidence:** Identical alert body logic duplicated across:
- `src/notifications/email-service.ts` (lines 134-160, 163-231)
- `src/notifications/sms-service.ts` (lines 127-143)
- `src/telegram/bot.ts` (lines 366-374)
- `src/middleware/threshold-alerts.ts` (lines 179-212)

**Recommendation:** Extract to shared utility:
```typescript
// src/notifications/alert-formatter.ts
export function formatThresholdAlert({...}): { subject: string; body: string; html?: string }
```

---

### 7. Incomplete Error Handling — `src/api/routes/health.ts`

**Evidence:**
```typescript
} catch (error) {
  return res.status(503).json({...});  // Only catches Redis
}
// PostgreSQL check has no error return, continues silently
```

**Impact:** Health check may return "healthy" even if PostgreSQL is down.

**Recommendation:**
```typescript
if (postgresOk === 'error') {
  return res.status(503).json({ status: 'degraded', postgres: 'error', ... });
}
```

---

### 8. Test Mock Inconsistency — `src/api/__tests__/api.test.ts`

**Evidence:**
```typescript
// Line 35-37: Redis mock returns object
vi.mock('../../redis', () => ({
  getRedisClient: () => mockRedis,
}));

// But actual health.ts expects direct method calls
```

**Impact:** Tests pass but may not reflect real behavior if Redis client interface changes.

**Recommendation:** Use `vi.mocked()` type-safe mocks:
```typescript
import { vi } from 'vitest';
const mockRedis = vi.mocked(getRedisClient());
```

---

## [LOW] Type Safety

### 9. Implicit `any` Types — 7 occurrences

**Locations:**
| File | Line | Pattern |
|------|------|---------|
| `src/telegram/bot.ts` | 220 | `(ctx.message as any)?.text` |
| `src/telegram/bot.ts` | 257 | `(ctx.message as any)?.text` |
| `src/api/__tests__/api.test.ts` | 10 | `vi.fn().mockResolvedValue({})` |
| `src/api/__tests__/api.test.ts` | 47-51 | `vi.mock()` without explicit types |
| `src/middleware/prometheus-metrics.ts` | 157 | `error` untyped in catch |
| `src/notifications/email-service.ts` | 54 | `error` untyped |
| `src/notifications/sms-service.ts` | 55 | `error` untyped |

**Recommendation:** Enable `strict: true` in `tsconfig.json` and add explicit types:
```typescript
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
}
```

---

## Positive Observations

| Practice | Example |
|----------|---------|
| ✅ Singleton Pattern | All services use proper singleton getInstance() |
| ✅ Rate Limiting | Email/SMS/Telegram all implement rate limiting |
| ✅ Prometheus Integration | Comprehensive custom metrics for trading |
| ✅ Alert Routing | Alertmanager config with severity-based routing |
| ✅ CI/CD Pipeline | Multi-stage: typecheck → test → build → smoke → deploy |
| ✅ Health Endpoints | `/health`, `/health/metrics`, `/metrics` separation |
| ✅ Dead Letter Queues | Queue consumers configured with DLQ fallback |

---

## Edge Cases Discovered

1. **Redis INFO parsing failure** — `health.ts` line 66-70 assumes `:` separator always present
2. **Telegram chat ID not found** — `dispatchAlert` sends to non-existent chat IDs silently fails
3. **Daily counter reset** — In-memory daily limits reset on service restart
4. **SMS daily limit timezone** — Uses ISO date string which may differ by timezone
5. **Prometheus scrape timeout** — 5s timeout may be too short for complex metric collection

---

## Recommended Actions (Prioritized)

1. **[P0]** Persist rate limit counters to Redis for crash resilience
2. **[P0]** Add env var validation at service startup (fail fast on missing keys)
3. **[P1]** Extract duplicated alert formatting logic to shared module
4. **[P1]** Implement LRU cache for Telegram user sessions with TTL
5. **[P2]** Add explicit type annotations for all catch blocks
6. **[P2]** Fix health check to return degraded status for partial failures
7. **[P3]** Enable `strict: true` TypeScript and fix all implicit `any` types

---

## Metrics

| Metric | Value |
|--------|-------|
| Files Reviewed | 15 |
| LOC Analyzed | ~2,100 |
| Security Issues | 3 (Critical: 0, Important: 3) |
| Performance Issues | 2 |
| Code Smells | 4 |
| Type Safety Issues | 7 `any` types |
| Test Coverage | ~65% (estimated from mock patterns) |
| Linting Issues | Not run (no ESLint config found) |

---

## Unresolved Questions

1. Is `src/api/gateway.ts` the actual entry point or is there a separate server bootstrap?
2. What is the expected behavior when Redis is unavailable — should alerts queue locally?
3. Are there integration tests for the full alert pipeline (threshold → email/SMS/Telegram)?
4. What is the target for test coverage? Currently appears incomplete for notification services.

---

## Appendix: File Inventory

| Category | Files |
|----------|-------|
| Notifications | `email-service.ts`, `sms-service.ts`, `index.ts`, `__tests__/notification-services.test.ts` |
| Telegram | `bot.ts` |
| Middleware | `threshold-alerts.ts`, `prometheus-metrics.ts`, `error-handler.ts` |
| API | `health.ts`, `__tests__/api.test.ts` |
| Monitoring | `prometheus.yml`, `alerts.yml`, `alertmanager.yml` |
| CI/CD | `ci-cd.yml`, `pre-build-check.sh` |
| Config | `wrangler.toml` |

---

_Report generated by code-reviewer agent for Algo-Trader MVP_
