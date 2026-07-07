#!/bin/bash
# ──────────────────────────────────────────────────────────────
# .claude/hooks/error-recovery.sh — Hook event error handler
# Integrates: error-recovery.sh, memory-injection.sh
# Triggers: SessionStart (log session), PostToolUse (on error)
# ──────────────────────────────────────────────────────────────
set -uo pipefail

REPO="/Users/macbook/Documents/me-deep-wrapper"
cd "$REPO" 2>/dev/null || exit 0

# Source Hermes-pattern libs
for lib in lib/error-recovery.sh lib/memory-injection.sh lib/context-injection.sh; do
  [ -f "$lib" ] && source "$lib" 2>/dev/null || true
done

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m'
CYAN='\033[0;36m' DIM='\033[2m' RESET='\033[0m'

EVENT="${1:-session-start}"
TOOL_NAME="${2:-unknown}"
ERR_MSG="${3:-}"
HTTP_CODE="${4:-0}"

case "$EVENT" in
  session-start)
    echo -e "${DIM}[error-recovery] Session started — recovery system armed${RESET}"
    # Log session start to memory
    memory_decide "session" "Session started" "Event: $EVENT, time: $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>/dev/null || true
    exit 0
    ;;
  post-tool-use|post-tool-error)
    if [ -z "$ERR_MSG" ]; then
      # No error to recover from
      exit 0
    fi

    echo ""
    echo -e "${YELLOW}[error-recovery] Tool error detected:${RESET} $TOOL_NAME"
    echo -e " ${DIM}Message: $ERR_MSG${RESET}"
    echo -e " ${DIM}HTTP code: $HTTP_CODE${RESET}"

    # Classify the error
    ERROR_CODE=$(classify_error "$ERR_MSG" "$HTTP_CODE")
    echo -e " ${CYAN}Classified: $ERROR_CODE${RESET}"

    # Log to memory for pattern tracking
    memory_learn "error" "Error $ERROR_CODE from $TOOL_NAME: ${ERR_MSG:0:80}" "$EVENT" 2>/dev/null || true

    # Attempt recovery based on error type
    case "$ERROR_CODE" in
      E_AUTH)
        echo -e " ${YELLOW}→ Attempting credential rotation...${RESET}"
        credential_rotate "default" 2>/dev/null || true
        ;;
      E_RATE_LIMIT)
        echo -e " ${YELLOW}→ Rate limited, backing off...${RESET}"
        retry_with_backoff 5 "echo retry" 2>/dev/null || true
        ;;
      E_CONTEXT)
        echo -e " ${YELLOW}→ Context overflow — inject compressed context${RESET}"
        inject_context "Plan" 2>/dev/null | head -5 || true
        ;;
      E_OVERLOADED)
        echo -e " ${YELLOW}→ Provider overloaded — waiting before retry${RESET}"
        sleep $((RANDOM % 10 + 5))
        ;;
      *)
        echo -e " ${DIM}→ Generic error — logged to memory for analysis${RESET}"
        ;;
    esac

    # Check error frequency — alert if same error repeats
    ERROR_FREQ=$(memory_recall "$ERROR_CODE" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$ERROR_FREQ" -gt 3 ]; then
      echo -e " ${RED}⚠ Repeated error ($ERROR_FREQ occurrences) — consider escalation${RESET}"
      memory_learn "escalation-needed" "Error $ERROR_CODE repeated $ERROR_FREQ times from $TOOL_NAME" "alert" 2>/dev/null || true
    fi

    exit 0
    ;;
  *)
    echo -e "${DIM}[error-recovery] Unknown event: $EVENT${RESET}"
    exit 0
    ;;
esac
