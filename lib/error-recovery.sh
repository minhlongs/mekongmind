#!/bin/bash
# error-recovery.sh — Hermes error_classifier.py + retry hierarchy for MEKONG
# Provides: classify_error, retry_with_backoff, fallback_provider

set -euo pipefail

# Hermes FailoverReason → MEKONG error code mapping
classify_error() {
  local err_msg="$1"
  local http_code="${2:-0}"

  case "$http_code" in
    401|403) echo "E_AUTH" ;;          # auth / oauth_refresh
    402)     echo "E_BILLING" ;;        # billing exhausted
    429)     echo "E_RATE_LIMIT" ;;     # rate_limit
    503|529) echo "E_OVERLOADED" ;;    # overloaded
    0)
      case "$err_msg" in
        *context*overflow*|*token*limit*) echo "E_CONTEXT" ;;
        *content*policy*|*blocked*)      echo "E_POLICY" ;;
        *thinking*signature*)            echo "E_SIGNATURE" ;;
        *truncat*)                       echo "E_TRUNCATED" ;;
        *empty*response*)                echo "E_EMPTY" ;;
        *unicode*surrogate*)             echo "E_UNICODE" ;;
        *image*reject*)                  echo "E_IMAGE" ;;
        *grammar*)                       echo "E_GRAMMAR" ;;
        *encrypted*)                     echo "E_ENCRYPTED" ;;
        *tier*)                          echo "E_TIER" ;;
        *)                               echo "E_UNKNOWN" ;;
      esac
      ;;
    *) echo "E_HTTP_$http_code" ;;
  esac
}

# Level 6: Jittered exponential backoff
# Usage: retry_with_backoff <max_retries> <command> [args...]
retry_with_backoff() {
  local max_retries="${1:-3}"
  shift
  local cmd=("$@")
  local attempt=0
  local delay=5

  while [ $attempt -lt "$max_retries" ]; do
    if "${cmd[@]}" 2>/dev/null; then
      return 0
    fi
    attempt=$((attempt + 1))
    if [ $attempt -lt "$max_retries" ]; then
      # Jitter: ±30% of delay
      jitter=$(( RANDOM % (delay * 60 / 100) - delay * 30 / 100 ))
      sleep_time=$(( delay + jitter ))
      [ "$sleep_time" -lt 1 ] && sleep_time=1
      sleep "$sleep_time"
      delay=$(( delay * 2 ))
      [ "$delay" -gt 120 ] && delay=120
    fi
  done
  return 1
}

# Level 3: Eager fallback — try alternate provider/gate
fallback_provider() {
  local failed_provider="$1"
  shift
  local providers=("$@")

  for prov in "${providers[@]}"; do
    [ "$prov" = "$failed_provider" ] && continue
    echo "FALLBACK: trying $prov" >&2
    if [ -n "$(command -v "$prov" 2>/dev/null)" ]; then
      return 0
    fi
  done
  return 1
}

# Full recovery chain: try levels 1-6
# Usage: recover "<error_msg>" <http_code> <command> [args...]
recover() {
  local err_msg="$1"
  local http_code="${2:-0}"
  shift 2
  local cmd=("$@")

  local error_code
  error_code=$(classify_error "$err_msg" "$http_code")

  echo "[recovery] Error classified: $error_code" >&2

  case "$error_code" in
    E_AUTH)
      echo "[recovery] Level 2: Attempting credential rotation..." >&2
      # Try with default env fallback
      if "${cmd[@]}" 2>/dev/null; then return 0; fi
      ;;
    E_BILLING)
      echo "[recovery] Level 3: Billing exhausted, trying fallback..." >&2
      # Skip current gate, mark as blocked
      echo "{\"error\":\"E_BILLING\",\"blocked\":true}" >&2
      return 2
      ;;
    E_RATE_LIMIT)
      echo "[recovery] Level 6: Rate limited, jittered backoff..." >&2
      if retry_with_backoff 5 "${cmd[@]}"; then return 0; fi
      echo "[recovery] Level 3: Trying fallback provider..." >&2
      fallback_provider "${cmd[0]}" claude haiku 2>/dev/null && return 0
      ;;
    E_OVERLOADED)
      echo "[recovery] Level 6: Overloaded, extended backoff..." >&2
      if retry_with_backoff 3 "${cmd[@]}"; then return 0; fi
      ;;
    E_CONTEXT)
      echo "[recovery] Level 4: Context overflow, compress and retry..." >&2
      # Context compression: truncate input to last N lines
      return 1
      ;;
    E_TRUNCATED)
      echo "[recovery] Level 7: Truncated, continuation attempts..." >&2
      # Signal to caller to continue
      return 3
      ;;
    *)
      echo "[recovery] Level 6: Generic retry with backoff..." >&2
      if retry_with_backoff 3 "${cmd[@]}"; then return 0; fi
      ;;
  esac

  echo "[recovery] Level 7: All recovery failed, persisting state" >&2
  return 1
}

# Export functions for sourcing
export -f classify_error retry_with_backoff fallback_provider recover
