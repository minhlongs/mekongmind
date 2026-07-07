#!/bin/bash
# hermes-bridge.sh — Bridge from MEKONG CLI commands to Hermes agent toolsets  
# Usage: hermes-bridge.sh <task> [--toolsets LIST]
set -o pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"

resolve_toolsets() {
    local task="$1"  
    if echo "$task" | grep -qiE 'browser|web\s+(search|scrape)'; then
        echo "hermes-cli,file,terminal,browser,web"
        return  
    fi
    echo "hermes-cli,file,terminal"
}

build_context() {
    local task="$1" department="${2:-hermes-integration}"
    printf "Department: %s\nTask: %s\nModel: qwen3.6:35b-cc-65k\n" "$department" "$task"
    
    local goal_file
    goal_file=$(ls -t "$PROJECT_ROOT/state/goal-*.md" 2>/dev/null | head -1)  
    if [ -n "$goal_file" ] && [ -f "$goal_file" ]; then
        printf "\nGoal State:\n%s\n" "$(head -30 "$goal_file")"
    fi
}

hermes_delegate() {
    local task="$1"
    local department="${2:-hermes-integration}"
    
    if ! command -v hermes >/dev/null 2>&1; then
        echo "=== Bridge Simulation ===" 
        echo "Task: $task"
        echo "Department: $department"  
        echo "Toolsets: $(resolve_toolsets "$task")"
        echo ""
        echo "In production, this calls: hermes chat -z '...' > output.txt"
        return 0
    fi
    
    local context  
    context="$(build_context "$task" "$department")"
    
    local temp_goal="$PROJECT_ROOT/state/hermes-delegate-$(date +%Y%m%d-%H%M%S).md"
    {
        echo "Status: active"
        echo "Mode: hermes-delegated"  
        echo "Department: $department"
        echo "---"
        echo "$context"
        echo ""
        echo "Task to execute:"
        echo "$task"
    } > "$temp_goal"
    
    local output_file="$PROJECT_ROOT/state/hermes-output.txt"
    
     ( cd "$PROJECT_ROOT" && \
         HERME_HOME="$HERMES_HOME" \  
           hermes chat -z "Execute this task and return JSON:\n\n$task"\ 
        > "$output_file" 2>&1 & ) || true
    
    echo "Delegate started (background)"
     echo "State file: $temp_goal"
    echo "Output: $output_file"
}

TASK="${1:-}"  
shift 2>/dev/null || true

if [ -z "$TASK" ]; then
     echo "Usage: hermes-bridge.sh <task> [--toolsets LIST]"
     exit 0
fi

hermes_delegate "$TASK" "user-specified"
