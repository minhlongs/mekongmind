# Credential Pool & Provider Fallback SOP - Tu Hermes credential_pool.py

> **Pattern source:** Hermes Agent `credential_pool.py` (2183 lines)
> **Principle:** Multi-credential rotation + eager fallback on auth/billing

## Hermes Credential Pool Logic

```
CredentialPool
  |-- get_credential()       -> Round-robin with health check
  |-- report_failure(slot)   -> Mark slot as unhealthy
  |-- rotate_on_auth_error() -> Skip to next healthy slot
  |-- rotate_on_billing()    -> Abort if all exhausted
  |-- eager_fallback()       -> Switch provider entirely
```

## MEKONG Provider Fallback Mapping

| Hermes Concept | MEKONG Equivalent |
|---|---|
| Credential slot | API provider endpoint |
| report_failure(401) | Mark gate as blocked, try fallback |
| report_failure(402) | Abort gate, escalate to me solo next |
| rotate_on_rate_limit | Backoff + retry with delay |
| pool exhaustion | All gates exhausted |
| eager_fallback | me solo next -> alternate gate |

## Fallback Chain (Hermes order)

1. Try same provider with different credential slot
2. Try alternate provider (eager fallback)
3. Compress context and retry
4. Provider-specific recovery (refresh token, etc.)
5. Jittered backoff (5s base, 120s cap)
6. Persist state + abort

## MEKONG Integration

- **me solo next** -> selects fallback gate when current gate fails
- **PostToolUse hook** -> retries with backoff on rate limit
- **SessionStart hook** -> detects auth errors, surfaces to user
