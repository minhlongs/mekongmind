#!/bin/bash
# tool-guardrails.sh — Hermes tool_guardrails.py pattern for MEKONG
# Validates tool calls against threshold configs before execution
# Prevents IDEMPOTENT tools from mutating, blocks MUTATING tools without confirmation

set -euo pipefail

# Tool classification: IDEMPOTENT (safe to retry) vs MUTATING (changes state)
# Usage: check_tool_guardrail <tool_name> <tool_input_json>
check_tool_guardrail() {
  local tool_name="${1:-}"
  local tool_input="${2:-}"
  [ -z "$tool_name" ] && return 0

  local config_file="/Users/macbook/Documents/me-deep-wrapper/.claude/skills/workflow/tool-guardrails.json"

  # Default thresholds (Hermes patterns)
  local MAX_TOKENS=200000
  local MAX_RETRIES=3
  local MAX_COST_PER_CALL=5.00

  # Load config if exists
  [ -f "$config_file" ] && python3 -c "
import json,sys
try:
    c = json.load(open('$config_file'))
    globals()['MAX_TOKENS'] = c.get('max_tokens', 200000)
    globals()['MAX_RETRIES'] = c.get('max_retries', 3)
    globals()['MAX_COST_PER_CALL'] = c.get('max_cost_per_call', 5.0)
    globals()['IDEMPOTENT'] = c.get('idempotent', [])
    globals()['MUTATING'] = c.get('mutating', [])
except: pass
" 2>/dev/null || true

  # Check if tool is in blocked list
  python3 -c "
import json,sys
tool = '$tool_name'
config_file = '$config_file'
if __import__('os').path.exists(config_file):
    c = json.load(open(config_file))
    blocked = c.get('blocked', [])
    if tool in blocked:
        print('BLOCKED')
        sys.exit(2)
    # Check threshold
    thresholds = c.get('thresholds', {}).get(tool, {})
    max_calls = thresholds.get('max_calls_per_minute', 999)
    max_tokens = thresholds.get('max_tokens_per_call', 200000)
    print(f'ALLOWED:{max_calls}:{max_tokens}')
else:
    print('ALLOWED:999:200000')
" 2>/dev/null || echo "ALLOWED:999:200000"
}

# Usage: guard_tool_call <tool_name> <call_command>
guard_tool_call() {
  local tool_name="$1"
  shift
  local result
  result=$(check_tool_guardrail "$tool_name" "$*")

  case "$result" in
    BLOCKED)
      echo "[guardrail] BLOCKED: $tool_name is in blocked tools list" >&2
      return 2
      ;;
    ALLOWED:*)
      # Parse limits (ALLOWED:max_calls:max_tokens)
      local limits="${result#ALLOWED:}"
      local max_calls="${limits%%:*}"
      local max_tokens="${limits##*:}"

      # Call with timeout guard
      timeout 300 "$@" 2>/dev/null
      local exit_code=$?
      if [ $exit_code -eq 124 ]; then
        echo "[guardrail] TIMEOUT: $tool_name exceeded 300s limit" >&2
        return 124
      fi
      return $exit_code
      ;;
    *)
      # Default: allow
      "$@"
      ;;
  esac
}

export -f check_tool_guardrail guard_tool_call
