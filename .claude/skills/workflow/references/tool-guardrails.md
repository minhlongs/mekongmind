# Tool Guardrails SOP - Tu Hermes tool_guardrails.py

> **Pattern source:** Hermes Agent `tool_guardrails.py` (475 lines)
> **Principle:** Detect tool loops before they waste budget

## Thresholds (giu nguyen logic Hermes)

| Metric | Warn After | Hard Stop After |
|---|---|---|
| exact_failure (cung tool, cung loi) | 2 | 5 |
| same_tool_failure (cung tool, loi khac) | 3 | 8 |
| idempotent_no_progress (tool lặp, ko tien trien) | 2 | 5 |

## MEKONG Config (state/sops/tool-guardrails.json)

```json
{
  "tool_loop_guardrails": {
    "warn_after": {
      "exact_failure": 2,
      "same_tool_failure": 3,
      "idempotent_no_progress": 2
    },
    "hard_stop_after": {
      "exact_failure": 5,
      "same_tool_failure": 8,
      "idempotent_no_progress": 5
    },
    "warnings_enabled": true,
    "hard_stop_enabled": false
  }
}
```

## Tool Classification

**IDEMPOTENT_TOOL_NAMES** (safe to retry):
- read_file, search_files, web_search, list_directory
- grep, glob, read_file_lines, read_file_chunk

**MUTATING_TOOL_NAMES** (dangerous to retry):
- terminal, execute_code, write_file, edit_file
- file_delete, run_shell_command

## MEKONG Integration

- **PostToolUse hook** -> Check exact_failure count after each tool use
- **pre-push-check.sh** -> Block on same_tool_failure_halt
- **goal-executor.sh** -> Halt gate on idempotent_no_progress
