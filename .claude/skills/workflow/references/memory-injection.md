# Memory Injection SOP - Tu Hermes memory_manager.py

> **Pattern source:** Hermes Agent `memory_manager.py` (653 lines)
> **Principle:** Single integration point for all memory operations

## Hermes Memory Architecture

```
MemoryManager (single integration point)
  |-- prefetch_all(user_message) -> Load relevant memory before each turn
  |-- sync_all()                  -> Save memory after each turn
  |-- StreamingContextScrubber    -> Filter memory-context tags from stream
```

## MEKONG Memory Mapping

| Hermes Feature | MEKONG Equivalent |
|---|---|
| prefetch_all(user_message) | session-intel.sh - load best goal + gate status |
| sync_all() | Goal state persistence after each me solo |
| StreamingContextScrubber | Evidence JSON sanitization |
| nudge_interval: 10 | Gate progress nudge each session |
| memory_char_limit: 2200 | Goal file max description length |
| user_char_limit: 1375 | User context summary max length |

## Session Persistence

Hermes stores session state in SQLite via _persist_session():
  -> MEKONG: state/gates/goal-*.json (evidence contracts)
  -> MEKONG: state/evidence/*.json (per-gate evidence)

## Key Insight

Hermes uses **streaming context scrubber** to remove memory-context tags from
streaming output. MEKONG applies same pattern to sanitize evidence JSON -
removing internal tracking fields before presenting to user.
