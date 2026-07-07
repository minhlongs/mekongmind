# Error Recovery Chain SOP — Từ Hermes conversation_loop.py

> **Pattern source:** Hermes Agent `conversation_loop.py` (4836 lines) + `error_classifier.py`
> **Principle:** Never silently fail — always retry with escalation

## Retry Hierarchy (giữ nguyên thứ tự Hermes)

```
Level 1: Local validation fix
  → JSON parse error, trailing content, malformed evidence
  → Fix: truncate/clean, retry once

Level 2: Credential rotation
  → 401/403 auth errors
  → Fix: rotate credential pool, retry

Level 3: Eager fallback (rate limit / billing)
  → 429 rate limit, 402 billing exhausted
  → Fix: fallback to alternate gate/provider

Level 4: Context compression
  → Context overflow, token limit
  → Fix: compress context, retry with smaller payload

Level 5: Provider-specific recovery
  → Anthropic 401 refresh, thinking signature recovery
  → Fix: strip reasoning_details, refresh session

Level 6: Jittered backoff
  → 503/529 overloaded
  → Fix: exponential backoff (5s base, 120s cap), retry

Level 7: Session persist + abort
  → All recovery failed
  → Fix: save state, surface error to user
```

## Hermes FailoverReason → MEKONG Error Codes

| Hermes `FailoverReason` | HTTP-ish | MEKONG Error | Recovery |
|---|---|---|---|
| `auth` | 401/403 | `E_AUTH` | Re-auth / rotate credential |
| `billing` | 402 | `E_BILLING` | Abort current, fallback gate |
| `rate_limit` | 429 | `E_RATE_LIMIT` | Backoff → rotate → fallback |
| `overloaded` | 503/529 | `E_OVERLOADED` | Backoff, retry |
| `context_overflow` | — | `E_CONTEXT` | Compress context |
| `content_policy_blocked` | — | `E_POLICY` | Rephrase or skip gate |
| `thinking_signature` | 400 | `E_SIGNATURE` | Strip reasoning_details |
| `llama_cpp_grammar_pattern` | — | `E_GRAMMAR` | Strip pattern from tools |
| `unicode_surrogate` | — | `E_UNICODE` | Sanitize + retry 3x |
| `image_rejected` | — | `E_IMAGE` | Strip images, text-only retry |
| `truncation` | — | `E_TRUNCATED` | 3 continuation attempts |
| `empty_response` | — | `E_EMPTY` | Nudge → prefill → retry → fallback |
| `oauth_refresh` | 401 | `E_OAUTH` | Refresh token, retry |
| `encrypted_reasoning` | — | `E_ENCRYPTED` | Replay recovery |
| `long_context_tier` | — | `E_TIER` | Downgrade context tier |

## Implementation Pattern

```python
# Pseudocode từ Hermes conversation_loop
def recover(error, state):
    classified = error_classifier.classify(error)

    if classified.reason == FailoverReason.auth:
        return credential_pool.rotate_and_retry(state)

    if classified.reason == FailoverReason.rate_limit:
        if classified.should_activate_fallback:
            return activate_fallback_provider()
        return jittered_backoff_retry(state)

    if classified.reason == FailoverReason.context_overflow:
        compressed = context_compressor.compress(state.messages)
        return retry_with(compressed)

    # ... fallthrough
    return persist_and_abort(state)
```

## MEKONG Integration

- **SessionStart hook** → detects auth errors, surfaces to user
- **PostToolUse hook** → retries with backoff on rate limit
- **PreToolUse hook** → validates credentials before expensive ops
- **goal-executor.sh** → fallback gate selection on billing/rate limit
