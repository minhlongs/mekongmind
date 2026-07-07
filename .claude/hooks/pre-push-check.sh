#!/bin/bash
# ──────────────────────────────────────────────────────────────
# pre-push-check.sh — PreToolUse hook (Hermes-enhanced)
# Chạy TRƯỚC khi git push
# Hermes: error-recovery, memory-injection, credential-pool
# ──────────────────────────────────────────────────────────────
set -uo pipefail

REPO="/Users/macbook/Documents/me-deep-wrapper"
cd "$REPO" 2>/dev/null || exit 0

# Source Hermes-pattern libs
for lib in lib/goal-executor.sh lib/error-recovery.sh lib/memory-injection.sh lib/credential-pool.sh lib/tool-guardrails.sh; do
  [ -f "$lib" ] && source "$lib" 2>/dev/null || true
done

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' RESET='\033[0m'
CYAN='\033[0;36m' DIM='\033[2m'

echo ""
printf '%b[pre-push-check]%b Validating push...\n' "$YELLOW" "$RESET"

BLOCK=0

# ── 1. Check for uncommitted evidence changes ───────────────
UNCOMMITTED=$(git diff --name-only 2>/dev/null | grep -c "state/evidence/" || true)
if [ "$UNCOMMITTED" -gt 0 ]; then
  printf ' %b✗ Uncommitted evidence changes (%d files)%b\n' "$RED" "$UNCOMMITTED" "$RESET"
  memory_learn "push-blocked" "Uncommitted evidence changes ($UNCOMMITTED files)" "pre-push" 2>/dev/null || true
  BLOCK=1
else
  printf ' Evidence: %b✓ clean%b\n' "$GREEN" "$RESET"
fi

# ── 2. Check tests pass with error recovery ─────────────────
if [ -d mvp ] && [ -f mvp/package.json ]; then
  printf ' Tests: '
  cd mvp
  if npm test 2>/dev/null; then
    printf '%b✓ pass%b\n' "$GREEN" "$RESET"
  else
    printf '%b✗ FAIL%b\n' "$RED" "$RESET"
    memory_learn "push-blocked" "Tests failed before push" "pre-push" 2>/dev/null || true
    BLOCK=1
  fi
  cd "$REPO"
fi

# ── 3. Credential hygiene: ensure no secrets in diff ─────────
SECRETS=$(git diff --cached --name-only 2>/dev/null | xargs grep -l "API_KEY\|SECRET\|PASSWORD\|TOKEN" 2>/dev/null | grep -v ".env.example" || true)
if [ -n "$SECRETS" ]; then
  printf ' %b✗ Potential secrets detected in:%b\n' "$RED" "$RESET"
  echo "$SECRETS" | while read -r f; do printf '   %s\n' "$f"; done
  memory_learn "push-blocked" "Potential secrets in staged files" "security" 2>/dev/null || true
  BLOCK=1
fi

# ── 4. Guardrail: check push rate limits ────────────────────
PUSH_RATE=$(git log --oneline --since="1 hour ago" 2>/dev/null | wc -l | tr -d ' ')
if [ "$PUSH_RATE" -gt 10 ]; then
  printf ' %b⚠ High push rate (%d pushes/hour)%b\n' "$YELLOW" "$PUSH_RATE" "$RESET"
  printf ' %b• Waiting 60s before push...%b\n' "$CYAN" "$RESET"
  sleep 60
fi

if [ "$BLOCK" -eq 1 ]; then
  printf '%b⊘ Push blocked. Fix above issues first.%b\n' "$RED" "$RESET"
  exit 1
fi

printf '%b✓ Push approved%b\n' "$GREEN" "$RESET"
echo ""
