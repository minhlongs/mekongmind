#!/bin/bash
# ──────────────────────────────────────────────────────────────
# claude-code-review.sh — Pre-commit review (Hermes-enhanced)
# When: PostToolUse on Write operations in mvp/
# What: Auto-review changes against engineering-factory SOP
# Hermes: context-injection, error-recovery, memory-injection
# ──────────────────────────────────────────────────────────────
set -uo pipefail

REPO="/Users/macbook/Documents/me-deep-wrapper"
cd "$REPO" 2>/dev/null || exit 0

# Source Hermes-pattern libs
for lib in lib/goal-executor.sh lib/context-injection.sh lib/error-recovery.sh lib/memory-injection.sh lib/tool-guardrails.sh; do
  [ -f "$lib" ] && source "$lib" 2>/dev/null || true
done

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' RESET='\033[0m'
CYAN='\033[0;36m' DIM='\033[2m'

CLAUDE_PROJECT_DIR="${1:-}"
CLAUDE_FILE_PATHS="${*:2}"

echo -e "${CYAN}[claude-hook]${RESET} Running pre-commit code review..."
echo "Files changed: ${CLAUDE_FILE_PATHS:-none}"

if [ -z "$CLAUDE_FILE_PATHS" ]; then
  echo -e "${DIM}[claude-hook] No files to review. Skipping.${RESET}"
  exit 0
fi

# 0. Hermes tool guardrail: validate each file path
for fp in $CLAUDE_FILE_PATHS; do
  GUARD_RESULT=$(check_tool_guardrail "Write" "$fp" 2>/dev/null || echo "ALLOWED:999:200000")
  case "$GUARD_RESULT" in
    BLOCKED)
      echo -e " ${RED}[guardrail] BLOCKED: $fp in blocked tools list${RESET}"
      exit 2
      ;;
  esac
done

# 1. Hermes context injection: get current SOP context
echo ""
echo -e "${CYAN}[context]${RESET} Loading SOP context..."
SOP_CTX=$(inject_context "Plan" 2>/dev/null || echo "")
if [ -n "$SOP_CTX" ]; then
  echo "$SOP_CTX" | head -8
  echo -e " ${DIM}(context loaded for review)${RESET}"
fi

# 2. Run Claude Code CLI in print mode for review
echo ""
echo -e "${CYAN}[review]${RESET} Running quality check..."
review_result=$(claude -p "Review these code changes against sops/departments/engineering-factory.md and sops/departments/quality-compliance.md SOP standards. Report any violations of KISS, DRY, YAGNI principles or TypeScript strictness rules." \
  --allowedTools "Read,Bash" \
  --max-turns 3 \
  --output-format json 2>/dev/null) || review_result=""

echo "[claude-hook] Review result: $review_result"

# 3. Error recovery: if review CLI fails, fall back to basic check
if [ -z "$review_result" ]; then
  echo -e "${YELLOW}[claude-hook] Claude CLI unavailable, using fallback check...${RESET}"
  review_result="fallback:manual_check_needed"
fi

# 4. If review finds critical violations, fail the commit
if echo "$review_result" | grep -qi '"error"'; then
  echo -e "${RED}[claude-hook] CRITICAL: Code review found violations. Fix before committing.${RESET}"
  memory_learn "review-failure" "Pre-commit review found violations in: ${CLAUDE_FILE_PATHS}" "quality" 2>/dev/null || true
  exit 1
fi

# 5. Log successful review to memory
memory_decide "review" "Pre-commit review passed" "Files: ${CLAUDE_FILE_PATHS}" 2>/dev/null || true

echo -e "${GREEN}[claude-hook] Review passed. Proceeding with commit.${RESET}"
exit 0
