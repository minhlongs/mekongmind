# Code Review — RaaS Gateway

**Date:** 2026-03-21 | **Scope:** Security, correctness, code quality

---

## Files Reviewed
`src/index.ts`, `src/services/auth-service.ts`, `src/services/billing-service.ts`,
`src/services/credit-service.ts`, `src/routes/billing.ts`, `src/routes/credits.ts`,
`src/middleware/auth.ts`, `src/middleware/rate-limiter.ts`, `src/middleware/auth-rate-limit.ts`

---

## Overall Assessment

Solid foundation. Parameterized queries throughout, proper HMAC verification, idempotency
via `webhook_events` table. Three issues require immediate attention; the rest are medium/low.

---

## Critical Issues

### 1. HMAC Signature Comparison — Timing Attack (billing-service.ts:100)
```ts
return signature === expectedSig;  // String equality = timing oracle
```
**Impact:** Attacker can brute-force webhook secret byte-by-byte via timing differences.
**Fix:** Use constant-time comparison:
```ts
const sigBytes = new TextEncoder().encode(signature);
const expBytes = new TextEncoder().encode(expectedSig);
if (sigBytes.length !== expBytes.length) return false;
const xorKey = await crypto.subtle.importKey('raw', expBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
// Or simpler: use a dedicated HMAC verify key imported with ['verify'] usage
```
Minimal fix: compare using `crypto.subtle.verify` with a HMAC `verify` key instead of `sign`.

### 2. Webhook Signature Bypassed in Dev Mode (billing-service.ts:77–80)
```ts
if (!secret) {
  console.warn('No POLAR_WEBHOOK_SECRET configured, skipping verification');
  return true;
}
```
**Impact:** If secret is accidentally missing in prod (misconfigured env), all webhooks are accepted —
including forged credit allocation events worth real money.
**Fix:** Return `false` (reject) when secret is missing, not `true`. Fail closed, not open.

---

## High Priority

### 3. Credit Deduction is NOT Atomic (credit-service.ts:83–103)
Two separate D1 statements: `SELECT balance` → `UPDATE balance`. No transaction wrapper.
Race condition: two concurrent deductions could both pass the balance check and overdraw account.
D1 supports `BEGIN/COMMIT` via `.batch()`. Wrap both statements in a D1 batch or use a single
`UPDATE tenants SET balance = balance - ? WHERE id = ? AND balance >= ?` with `changes` check.

### 4. `topup` Endpoint Has No Admin Guard (credits.ts:105–133)
Any authenticated tenant can call `POST /v1/credits/topup` and add up to 1000 credits to their
own account. Comment says "admin only, for testing" but no role/permission check enforces it.
**Fix:** Add `if (!tenant.permissions.includes('admin')) return 403` or remove in production.

### 5. Webhook IP Rate Limit Fails Open (auth-rate-limit.ts:72–76)
```ts
} catch (error) {
  // Fail open - allow request if KV fails
  await next();
}
```
If KV is unavailable, all rate limiting is bypassed. For the webhook endpoint this means an
attacker can DDoS credit allocations during a KV outage.
**Fix:** Fail closed (return 503) or log + alert; do not silently pass through.

---

## Medium Priority

### 6. Redundant Expiry Check in JWT Validation (auth-service.ts:27–29)
`jose.jwtVerify` already validates `exp`. The manual re-check `jwtPayload.exp < Date.now() / 1000`
is dead code and adds confusion. Remove it.

### 7. `getApiKeys` Leaks `key_hash` Column (auth-service.ts:194–197)
Comment says "key_hash is excluded" but the spread `...r` copies ALL fields returned by the query.
`key_hash` is excluded from the SELECT list which is correct, but the comment is misleading and
the type `Omit<ApiKeyRecord, 'key_hash'>` is a lie at runtime — callers assume the guarantee holds.
Verify no callers pass the result to an untrusted surface.

### 8. `extractTenantId` Uses `(data as any)` (billing-service.ts:179)
Bypasses type safety. If Polar changes payload structure, a malformed `tenant_id` could be injected
silently. Validate/sanitize the extracted `tenantId` before using it in DB calls (check UUID format).

### 9. `addCredits` Auto-Creates Tenant on First Credit (credit-service.ts:176–183)
A Polar webhook for an unknown `tenant_id` silently creates a new tenant row with placeholder email
`${tenantId}@raas.local`. This could create ghost tenants for forged or misconfigured external_id values.
Emit a warning and fail the event instead of creating unknown tenants.

---

## Low Priority

### 10. `any` Types in credit-service.ts (lines 242, 250)
`getUsageLogs` returns `Promise<any[]>` and uses `any[]` for bindings. Define a `UsageLog` interface.

### 11. `response: any` in billing.ts:116
Type the webhook response object to avoid accidental field exposure.

### 12. `parseInt` Without Validation on Query Params (credits.ts:48–49)
`parseInt('abc')` returns `NaN`. `Math.min(NaN, 200)` returns `NaN`. D1 LIMIT on NaN may throw or
return unexpected results. Add `|| 50` fallback after parseInt.

---

## Positive Observations
- All DB queries use parameterized `.bind()` — zero SQL injection risk
- Replay attack prevention: timestamp window (5 min) + idempotency table — correct
- JWT uses `issuer` + `audience` claims validation — correct
- API keys stored as SHA-256 hashes, never plaintext — correct
- Rate limiting headers (`X-RateLimit-Remaining`, `Retry-After`) set correctly
- Error handler in index.ts does not leak stack traces to client — correct

---

## Recommended Actions (Priority Order)

1. Fix HMAC timing attack — replace `===` with `crypto.subtle.verify`
2. Fail closed on missing `POLAR_WEBHOOK_SECRET` — return `false`
3. Make credit deduction atomic — D1 batch or single conditional UPDATE
4. Add admin permission check on `/topup` endpoint
5. Fail closed on KV error in `authRateLimit`
6. Validate `tenantId` UUID format after extraction; don't auto-create unknown tenants
7. Remove redundant JWT expiry check; fix `any` types

---

## Unresolved Questions

- Is `authRateLimit` intentionally IP-based (not tenant-based) for the webhook endpoint? If Polar uses a fixed egress IP pool, 100 req/min per IP might block legitimate burst deliveries.
- Is `POST /v1/credits/topup` intended to be removed before production, or gated behind an admin tier?
- Does D1 support `BEGIN/COMMIT` in the current Workers runtime? If not, what is the preferred atomicity pattern?
