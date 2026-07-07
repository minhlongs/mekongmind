#!/bin/bash
# ──────────────────────────────────────────────────────────────
# session-intel.sh — MEKONG SessionStart Hook (Hermes-enhanced)
# Shows: best goal, current gate view, evidence gaps, build health
# Hermes: context-injection, memory-injection, credential-pool
# ──────────────────────────────────────────────────────────────
set -uo pipefail

REPO="/Users/macbook/Documents/me-deep-wrapper"
cd "$REPO" 2>/dev/null || exit 0

# Source Hermes-pattern libs
for lib in lib/goal-executor.sh lib/context-injection.sh lib/memory-injection.sh lib/credential-pool.sh lib/error-recovery.sh; do
  [ -f "$lib" ] && source "$lib" 2>/dev/null || true
done

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m'
CYAN='\033[0;36m' BOLD='\033[1m' DIM='\033[2m' RESET='\033[0m'

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD} 🧠 MEKONG SESSION INTEL${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${RESET}"
echo ""

# ── 1. Active Goal (best progress) ──────────────────────────
echo -e "${CYAN}[ACTIVE GOAL]${RESET}"

BEST_GOAL="" BEST_PASSED=0
for f in $(ls -t state/gates/goal-*.json 2>/dev/null || true); do
  N=$(python3 -c "
import json,sys
with open('$f') as fh:
  g=json.load(fh).get('gates',[])
  p=sum(1 for x in g if isinstance(g,list) and x.get('status')=='passed')
print(p)
" 2>/dev/null || echo 0)
  if [ "$N" -gt "$BEST_PASSED" ]; then
    BEST_PASSED="$N"
    BEST_GOAL="$f"
  fi
done

if [ -n "$BEST_GOAL" ]; then
  echo -e " Best: ${BOLD}$(basename "$BEST_GOAL")${RESET} (${BEST_PASSED}/9 gates)"
else
  echo -e " ${DIM}No goal found in state/gates/goal-*.json${RESET}"
fi

# ── 1b. Hermes context injection for current step ────────────
echo ""
echo -e "${CYAN}[CONTEXT INJECTION]${RESET}"
STEP_CTX=$(inject_context "Plan" 2>/dev/null || echo "")
if [ -n "$STEP_CTX" ]; then
  echo "$STEP_CTX" | head -12
  echo -e " ${DIM}(truncated — use inject_context <type> for full view)${RESET}"
else
  echo -e " ${DIM}No context available${RESET}"
fi

# ── 1c. Memory recall — past decisions relevant to current session ──
echo ""
echo -e "${CYAN}[MEMORY RECALL]${RESET}"
MEM_HITS=$(memory_recall "goal" 2>/dev/null || echo "")
if [ -n "$MEM_HITS" ] && [ "$MEM_HITS" != "(no relevant past decisions)" ]; then
  echo " Recent decisions:"
  echo "$MEM_HITS" | head -5 | while IFS= read -r line; do
    printf ' %b• %s%b\n' "$DIM" "$line" "$RESET"
  done
else
  echo -e " ${DIM}No past decisions recalled${RESET}"
fi

# ── 1d. Credential pool health ───────────────────────────────
echo ""
echo -e "${CYAN}[CREDENTIAL POOL]${RESET}"
CRED_HEALTH=$(credential_health 2>/dev/null || echo "")
if [ -n "$CRED_HEALTH" ]; then
  echo " $CRED_HEALTH"
else
  echo -e " ${DIM}Credential pool unavailable${RESET}"
fi

# Check what me solo gate show reads
ME_GOAL=$(python3 -c "
import json
try:
  with open('state/gates/goal-20260604-213942.json') as f:
    d=json.load(f)
    print(f'goal-20260604-213942.json: {sum(1 for g in d.get(\"gates\",[]) if g.get(\"status\")==\"passed\")}/9')
except: print('unknown')
" 2>/dev/null || echo "unknown")
echo -e " ${DIM}me reads: $ME_GOAL${RESET}"
echo ""

# ── 2. Gate Status ──────────────────────────────────────────
echo -e "${CYAN}[GATE STATUS]${RESET}"

GATE_OUTPUT=$(me solo gate show 2>/dev/null || true)

if [ -n "$GATE_OUTPUT" ]; then
  while IFS= read -r line; do
    LOWER=$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')
    if printf '%s' "$LOWER" | grep -qiE "passed|✓|✅"; then
      printf ' %b%s%b\n' "$GREEN" "$line" "$RESET"
    elif printf '%s' "$LOWER" | grep -qiE "active|▶|in_progress"; then
      printf ' %b%s%b\n' "$YELLOW" "$line" "$RESET"
    elif printf '%s' "$LOWER" | grep -qiE "blocked|❌|pending"; then
      printf ' %b%s%b\n' "$RED" "$line" "$RESET"
    elif printf '%s' "$LOWER" | grep -qiE "^---+|^\[gate\]|^Gate"; then
      printf ' %b%s%b\n' "$DIM" "$line" "$RESET"
    else
      printf ' %s\n' "$line"
    fi
  done <<< "$GATE_OUTPUT"
else
  echo " ${DIM}(me solo gate show unavailable)${RESET}"
fi
echo ""

# ── 3. Evidence Gaps ───────────────────────────────────────
echo -e "${CYAN}[EVIDENCE GAPS]${RESET}"

BLOCKERS=$(python3 -c "
import glob,os
for f in sorted(glob.glob('state/evidence/*.json')):
  try:
    with open(f) as fh:
      import json; d=json.load(fh)
      s=d.get('status',d.get('gate_status',''))
      if s in ('blocked','pending','active'):
        print(os.path.basename(f).replace('.json',''))
  except: pass
" 2>/dev/null || true)

if [ -n "$BLOCKERS" ]; then
  echo -e " ${RED}Blocking gates:${RESET}"
  printf ' %b→ %s%b\n' "$RED" "$(echo "$BLOCKERS" | sed 's/^/ /')" "$RESET"
else
  echo -e " ${GREEN}All evidence contracts satisfied${RESET}"
fi
echo ""

# ── 4. Build Health ────────────────────────────────────────
echo -e "${CYAN}[BUILD HEALTH]${RESET}"
if [ -d "$REPO/mvp" ]; then
  cd "$REPO/mvp"
  [ -f package.json ] && {
    [ -d node_modules ] && echo -e " node_modules: ${GREEN}✓${RESET}" \
    || echo -e " node_modules: ${RED}✗ run npm install${RESET}"
    [ -f .env ] && echo -e " .env: ${GREEN}present${RESET}" \
    || echo -e " .env: ${YELLOW}missing${RESET}"
    [ -d dist ] || [ -d build ] || [ -d .next ] \
    && echo -e " Build: ${GREEN}artifacts ✓${RESET}" \
    || echo -e " Build: ${DIM}no artifacts${RESET}"
  }
  cd "$REPO"
else
  echo -e " ${DIM}mvp/ not found${RESET}"
fi

echo ""
echo -e "${BOLD} Quick actions:${RESET}"
echo -e " ${CYAN}me solo next${RESET} → resolve next department"
echo -e " ${CYAN}me solo gate show${RESET} → full gate status"
echo -e " ${CYAN}me solo status${RESET} → session overview"
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${RESET}"
echo ""
