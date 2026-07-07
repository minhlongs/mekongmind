#!/bin/bash
# context-injection.sh — Hermes context_compressor.py pattern for MEKONG
# Selective context injection per step type (Plan/Allocate/Supervise/Report)
# Compresses goal state + department status + evidence summary

set -euo pipefail

REPO="/Users/macbook/Documents/me-deep-wrapper"
cd "$REPO" 2>/dev/null || exit 1

# Inject context for a given step type
# Usage: inject_context <step_type> [goal_file]
inject_context() {
  local step_type="${1:-Plan}"
  local goal_file="${2:-}"
  [ -z "$goal_file" ] && goal_file=$(source lib/goal-executor.sh 2>/dev/null; latest_goal_file)

  if [ -z "$goal_file" ] || [ ! -f "$goal_file" ]; then
    echo "ERROR: No goal file found" >&2
    return 1
  fi

  local ctx=""
  # 1. Goal header (always)
  ctx+="=== GOAL ===$(grep '^# Goal:' "$goal_file" | sed 's/^# Goal: */ /')\n"
  ctx+="Status: $(grep '^Status:' "$goal_file" | sed 's/^Status: *//')\n"
  ctx+="CurrentGate: $(grep '^CurrentGate:' "$goal_file" | sed 's/^CurrentGate: *//')\n\n"

  # 2. Step-type specific context
  case "$step_type" in
    Plan)
      ctx+="=== DEPARTMENT STATUS ===\n"
      for d in CEO Market Product Engineering Quality Ops Growth Sales CS Knowledge; do
        status=$(grep -l "^${d}:" "$goal_file" 2>/dev/null | head -1 | xargs grep "^${d}:" 2>/dev/null | sed "s/^${d}: *//" || echo "idle")
        ctx+="  ${d}: ${status}\n"
      done
      ctx+="\n=== EVIDENCE SUMMARY ===\n"
      for e in state/evidence/*.json; do
        [ -f "$e" ] || continue
        s=$(python3 -c "import json;d=json.load(open('$e'));print(d.get('status','unknown'))" 2>/dev/null || echo "?")
        ctx+="  $(basename $e .json): ${s}\n"
      done
      ;;
    Allocate)
      ctx+="=== AVAILABLE AGENTS ===\n"
      if [ -f "agents/registry.json" ]; then
        python3 -c "
import json
try:
    reg = json.load(open('agents/registry.json'))
    for agent in reg.get('agents', reg.get('tools', []))[:10]:
        name = agent.get('name', agent.get('id', '?'))
        desc = agent.get('description', '')[:60]
        print(f'  {name}: {desc}')
except: print('  (registry unavailable)')
" 2>/dev/null
      fi
      ctx+="\n=== CURRENT GATE REQUIREMENTS ===\n"
      python3 -c "
import json,glob
for jf in sorted(glob.glob('state/gates/goal-*.json')):
    try:
        d = json.load(open(jf))
        gid = d.get('goal_id','')
        if gid.endswith('011704') or gid == 'goal-20260605-011704':
            for g in d.get('gates',[]):
                if g.get('status') in ('active','pending'):
                    print(f'  {g[\"id\"]}: {g.get(\"status\",\"?\")}')
    except: pass
" 2>/dev/null || echo "  (no active gate)"
      ;;
    Supervise)
      ctx+="=== STEP PROGRESS ===\n"
      ctx+="Steps done: $(grep '^Steps:' "$goal_file" | sed 's/^Steps: *//')\n"
      ctx+="TotalSteps: $(grep '^TotalSteps:' "$goal_file" | sed 's/^TotalSteps: *//')\n"
      ctx+="\n=== RECENT OUTPUTS ===\n"
      for f in $(ls -t /Users/macbook/Documents/me-deep-wrapper/tasks/ 2>/dev/null | head -5); do
        ctx+="  ${f}\n"
      done
      ;;
    Report)
      ctx+="=== COMPLETION METRICS ===\n"
      python3 -c "
import glob, json
passed = 0
total = 0
for jf in sorted(glob.glob('state/gates/goal-*.json')):
    try:
        d = json.load(open(jf))
        gid = d.get('goal_id','')
        if gid.endswith('011704') or gid == 'goal-20260605-011704':
            gates = d.get('gates',[])
            total = len(gates)
            passed = sum(1 for g in gates if g.get('status')=='passed')
            for g in gates:
                print(f'  {g[\"id\"]}: {g[\"status\"]}')
    except: pass
print(f'  Progress: {passed}/{total} gates')
" 2>/dev/null || echo "  (no data)"
      ;;
  esac

  printf "$ctx"
}

# Export
export -f inject_context
