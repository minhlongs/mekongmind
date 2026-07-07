#!/bin/bash
# ──────────────────────────────────────────────────────────────
# post-write-check.sh — PostToolUse hook (Hermes-enhanced)
# Chạy sau mỗi Write vào mvp/**/*.ts
# Hermes: tool-guardrails, error-recovery, memory-injection
# ──────────────────────────────────────────────────────────────
set -uo pipefail

REPO="/Users/macbook/Documents/me-deep-wrapper"
cd "$REPO" 2>/dev/null || exit 0

# Source Hermes-pattern libs
for lib in lib/goal-executor.sh lib/tool-guardrails.sh lib/error-recovery.sh lib/memory-injection.sh; do
  [ -f "$lib" ] && source "$lib" 2>/dev/null || true
done

YELLOW='\033[1;33m' GREEN='\033[0;32m' RED='\033[0;31m' RESET='\033[0m'
CYAN='\033[0;36m' DIM='\033[2m'

# Determine which file was just written (from stdin JSON if available)
TOOL_INPUT=""
TOOL_NAME=""
if [ ! -t 0 ]; then
  TOOL_INPUT=$(cat 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path','')); print(d.get('tool_name',''))" 2>/dev/null || true)
  TOOL_NAME=$(echo "$TOOL_INPUT" | tail -1)
  TOOL_INPUT=$(echo "$TOOL_INPUT" | head -1)
fi

echo ""
printf '%b[post-write-check]%b File: %s\n' "$YELLOW" "$RESET" "${TOOL_INPUT:-unknown}"

# 0. Hermes tool guardrail: validate this write operation
GUARD_RESULT=$(check_tool_guardrail "Write" "$TOOL_INPUT" 2>/dev/null || echo "ALLOWED:999:200000")
case "$GUARD_RESULT" in
  BLOCKED)
    echo -e " ${RED}[guardrail] BLOCKED: Write to ${TOOL_INPUT} is in blocked list${RESET}"
    memory_learn "blocked" "Write blocked by guardrails: ${TOOL_INPUT}" "post-write" 2>/dev/null || true
    exit 2
    ;;
esac

FAIL=0
cd "$REPO/mvp" 2>/dev/null || exit 0

# 1. TypeScript type check
if [ -f tsconfig.json ]; then
  printf ' type check: '
  if npx tsc --noEmit 2>/dev/null; then
    printf '%b✓ pass%b\n' "$GREEN" "$RESET"
  else
    printf '%b✗ FAIL%b\n' "$RED" "$RESET"
    FAIL=1
  fi
fi

# 2. Lint (if configured)
if grep -q '"lint"' package.json 2>/dev/null; then
  printf ' lint: '
  if npm run lint 2>/dev/null; then
    printf '%b✓ pass%b\n' "$GREEN" "$RESET"
  else
    printf '%b✗ FAIL%b\n' "$RED" "$RESET"
    FAIL=1
  fi
fi

# 3. Hermes error recovery: attempt recovery if checks failed
if [ "$FAIL" -eq 1 ]; then
  printf '%b⚠ Post-write checks failed. Attempting recovery...%b\n' "$YELLOW" "$RESET"
  # Log to memory for pattern tracking
  memory_learn "post-write-failure" "TypeScript/lint check failed for ${TOOL_INPUT:-unknown}" "quality" 2>/dev/null || true

  # Level 1: Retry with fresh node_modules (common fix)
  printf ' %b• Retry: clearing cache and re-checking...%b\n' "$CYAN" "$RESET"
  rm -rf node_modules/.cache 2>/dev/null || true
  if npx tsc --noEmit 2>/dev/null; then
    printf ' %b✓ Recovered: type check passes after cache clear%b\n' "$GREEN" "$RESET"
    FAIL=0
  fi
fi

if [ "$FAIL" -eq 1 ]; then
  printf '%b⚠ Post-write checks still failing. Fix before continuing.%b\n' "$YELLOW" "$RESET"
else
  printf '%b✓ Post-write checks passed%b\n' "$GREEN" "$RESET"
fi

echo ""
