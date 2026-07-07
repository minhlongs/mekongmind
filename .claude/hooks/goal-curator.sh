#!/bin/bash
# ──────────────────────────────────────────────────────────────
# .claude/hooks/goal-curator.sh — SessionEnd hook wrapper
# Calls lib/goal-curator.sh when no active gate exists
# Hermes: idle-triggered maintenance (curator.py pattern)
# ──────────────────────────────────────────────────────────────
set -uo pipefail

REPO="/Users/macbook/Documents/me-deep-wrapper"
cd "$REPO" 2>/dev/null || exit 0

# Source minimal libs
source lib/goal-curator.sh 2>/dev/null || true

MODE="${1:---dry-run}"

echo ""
echo -e "\033[1;36m[goal-curator] Session end — running idle maintenance...\033[0m"

# Check if there's an active gate
HAS_ACTIVE=$(python3 -c "
import glob
for f in sorted(glob.glob('state/gates/goal-*.json')):
  try:
    d = __import__('json').load(open(f))
    if any(g.get('status') in ('active','running') for g in d.get('gates',[])):
      print('yes'); break
  except: pass
" 2>/dev/null)

if [ "$HAS_ACTIVE" = "yes" ]; then
  echo -e " \033[2m[goal-curator] Active gate exists, skipping maintenance\033[0m"
  exit 0
fi

echo -e " \033[2m[goal-curator] No active gate, running curator...\033[0m"

# Run curator in dry-run mode by default
if [ "$MODE" = "--apply" ]; then
  echo -e " \033[1;33m⚠ Running in APPLY mode — files will be moved!\033[0m"
  lib/goal-curator.sh --apply
else
  echo -e " \033[2mDry-run mode (use --apply to execute)\033[0m"
  lib/goal-curator.sh --dry-run
fi

echo ""
exit 0
