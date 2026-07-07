# Context Injection SOP - Tu Hermes agent_init.py + conversation_loop.py

> **Pattern source:** Hermes Agent `agent_init.py` (1657 lines) - 60+ init parameters
> **Principle:** Inject minimal, relevant context per turn - never dump everything

## Hermes Context Injection Pattern

Hermes injects vao moi LLM call:
1. **Soul/personality** -> MEKONG: current goal state
2. **Memory prefetch** -> MEKONG: evidence contracts
3. **Skill hints** -> MEKONG: SOP references
4. **Tool schemas** -> MEKONG: gate validation rules

## MEKONG Implementation (da co trong bin/me)

```bash
# build_claude_context() - selective context injection
build_claude_context() {
  local goal=$(latest_goal_file)
  local gate_status=$(python3 -c "gate analysis...")
  local evidence_gaps=$(python3 -c "evidence check...")

  cat <<GOAL_EOF
=== MEKONG ACTIVE GOAL ===
$(cat "$goal")
=== GATE STATUS ===
$gate_status
=== EVIDENCE GAPS ===
$evidence_gaps
GOAL_EOF
}
```

## Context Compression Rules

| Hermes Rule | MEKONG Equivalent |
|---|---|
| protect_first_n: 3 | Always keep last 3 gate transitions |
| protect_last_n: 20 | Always keep recent 20 evidence entries |
| target_ratio: 0.2 | Compress to 20% of original size |
| threshold: 0.5 | Trigger compression at 50% context usage |
| Provider-aware strategies | Claude Code + Ollama fallback |

## Key Parameters (tu config.yaml)

```
compression:
  enabled: true
  protect_first_n: 3
  protect_last_n: 20
  target_ratio: 0.2
  threshold: 0.5

memory:
  flush_min_turns: 6
  memory_char_limit: 2200
  nudge_interval: 10
  user_char_limit: 1375
```
