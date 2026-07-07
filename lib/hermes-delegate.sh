#!/bin/bash
# hermes-delegate.sh — Delegate MEKONG tasks to Hermes Agent
# This is the actual CLI command that bridges between the two systems.
#
# Usage: me-hermes <task-description> [--toolsets file,terminal]
#
# When called from within a MEKONG SOP chain, it:
# 1. Reads current goal state and department context  
# 2. Builds evidence contract packet for Hermes
# 3. Dispatches task to hermes CLI with proper flags
# 4. Waits for completion and captures output as evidence

set -uo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
OLLAMA_MODEL="${MEKONG_MODEL:-qwen3.6:35b-cc-65k}"

# ── Core delegation function ────────────────────────────────

delegate_to_hermes() {
    local task="$1"
    local toolsets="${2:-file,terminal}"
    
      # Find active goal file
    local goal_file
     goal_file=$(ls -t "$PROJECT_ROOT/state/goal-*.md" 2>/dev/null | head -1)
    
    if [ -z "$goal_file" ]; then
         echo "ERROR: No active MEKONG goal found."
        echo "Create one with: me goal create <name>"
        return 1
    fi
    
     # Build the context packet
    local context=""
     context+="Active Goal State:\n$(cat "$goal_file")\n\n"
    
      # Add department SOP if exists
     local dept_id="hermes-integration"
    local sop_file="$PROJECT_ROOT/sops/departments/${dept_id}.md"
    if [ -f "$sop_file" ]; then
         context+="Department SOP:\n$(cat "$sop_file")\n\n"
    fi
    
     # Add evidence contract template
      context+="Evidence Contract Required:\n"
      context+='{ "department": "'${dept_id}'",\n'
      context+=  '"artifacts": ["<files-created>"],\n'
      context+=  '"proof": "<verification-text>",\n'
      context+='  "bottleneck_status": "passing|blocked|clear",\n'
     context+='  "handoff_to": "<next-department>",\n'
     context+=  '"mrr_contribution": 0,\n'
      context+='  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"\n'
    context+='}'

     # Build full command for Hermes  
    local hermes_cmd="hermes"
    if [ -f "$HERMES_HOME/config.yaml" ]; then
         hermes_cmd+=" --skills mekongmind"
        hermes_cmd+=" chat -q \"$(echo "Task:\n\n${task}\n\nContext:\n\n${context}" | sed 's/"/\\"/g')\""
    fi
    
      # Execute delegation
    echo "=== MEKONG → Hermes Delegation ==="
     echo "Goal: $(basename "$goal_file")"
    echo "Toolsets: $toolsets"
    echo ""
    eval "$hermes_cmd"
    
     local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo ""
         echo "✓ Delegation complete (PID: $(pgrep -f 'hermes.*${task}'))"
    else
        echo ""
        echo "✗ Delegation failed with code: $exit_code"
    fi
    
     return $exit_code
}

# ── Main CLI entry point ────────────────────────────────────

show_usage() {
    cat <<'USAGE_EOF'
Usage: me-hermes <task> [--toolsets LIST]

Delegate a MEKONG task to Hermes Agent for execution.

Examples:
   me-hermes "Build React component for user dashboard"
   me-hermes "Analyze local directory structure and suggest improvements" \
       --toolsets file,terminal,web
   
USAGE_EOF
}

# Parse arguments
TASK=""
TOOLSETS="file,terminal"

while [ $# -gt 0 ]; do
    case "$1" in
        --toolsets) TOOLSETS="$2"; shift ;;
         *) 
             if [ -z "$TASK" ]; then
                  TASK="$*"
                 break
             fi
             ;;
    esac
done

if [ -z "$TASK" ]; then
     show_usage
    exit 1
fi

# Execute delegation  
delegate_to_hermes "$TASK" "$TOOLSETS"
