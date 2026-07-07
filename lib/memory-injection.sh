#!/bin/bash
# memory-injection.sh — Hermes memory_manager.py pattern for MEKONG
# Single integration point for memory operations (inject, recall, archive)
# Stores decision logs, learnings, and reusable patterns

set -euo pipefail

MEMORY_DIR="/Users/macbook/Documents/me-deep-wrapper/state/memory"
DECISIONS_FILE="$MEMORY_DIR/decisions.jsonl"
LEARNINGS_FILE="$MEMORY_DIR/learnings.jsonl"

mkdir -p "$MEMORY_DIR" 2>/dev/null || true

# Inject a decision into memory
# Usage: memory_decide <step_type> <decision_summary> <rationale>
memory_decide() {
  local step_type="${1:-unknown}"
  local decision="${2:-}"
  local rationale="${3:-}"
  [ -z "$decision" ] && return 0

  python3 -c "
import json, sys, datetime
entry = {
    'ts': datetime.datetime.now().isoformat(),
    'step': '$step_type',
    'decision': '''$decision''',
    'rationale': '''$rationale'''
}
with open('$DECISIONS_FILE', 'a') as f:
    f.write(json.dumps(entry) + '\n')
" 2>/dev/null
  echo "[memory] Decision logged: $step_type - $decision"
}

# Recall past decisions relevant to current context
# Usage: memory_recall <query_keyword>
memory_recall() {
  local query="${1:-}"
  [ -z "$query" ] && return 0

  python3 -c "
import json, sys, re
query = '''$query'''.lower()
count = 0
try:
    with open('$DECISIONS_FILE') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try:
                entry = json.loads(line)
                text = (entry.get('decision','') + ' ' + entry.get('rationale','')).lower()
                if query in text:
                    print(f'[{entry.get(\"ts\",\"?\")[:19]}] {entry.get(\"decision\",\"\")}')
                    count += 1
                    if count >= 5: break
            except: pass
except FileNotFoundError: pass
if count == 0:
    print('(no relevant past decisions)')
" 2>/dev/null
}

# Record a learning from execution
# Usage: memory_learn <category> <insight> <applicable_to>
memory_learn() {
  local category="${1:-general}"
  local insight="${2:-}"
  local applicable="${3:-all}"
  [ -z "$insight" ] && return 0

  python3 -c "
import json, sys, datetime
entry = {
    'ts': datetime.datetime.now().isoformat(),
    'category': '$category',
    'insight': '''$insight''',
    'applicable_to': '''$applicable'''
}
with open('$LEARNINGS_FILE', 'a') as f:
    f.write(json.dumps(entry) + '\n')
" 2>/dev/null
  echo "[memory] Learning recorded: $category - ${insight:0:60}"
}

# Get memory stats
memory_stats() {
  python3 -c "
import json, os, sys
dc = 0
lc = 0
try:
    with open('$DECISIONS_FILE') as f:
        dc = sum(1 for _ in f)
except: pass
try:
    with open('$LEARNINGS_FILE') as f:
        lc = sum(1 for _ in f)
except: pass
print(f'Memory Stats: {dc} decisions, {lc} learnings')
print(f'Dir: $MEMORY_DIR')
" 2>/dev/null
}

export -f memory_decide memory_recall memory_learn memory_stats
