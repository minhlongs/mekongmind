#!/bin/bash
# hermes-mcp-server.sh — MEKONG Mind MCP Server for Hermes Agent
# Provides read/write access to MEKONG state, SOP gates, and department ledger
# via standard MCP tools that Hermes can call directly.

set -uo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEKONG_STATE="$PROJECT_ROOT/state"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"

# ── State Access Functions ────────────────────────────────────────

# Read goal state file
read_goal() {
    local goal_id="${1:-}"
    if [ -z "$goal_id" ]; then
        ls -t "$MEKONG_STATE"/goal-*.md 2>/dev/null | head -1
        return
    fi
    echo "$MEKONG_STATE/goal-${goal_id}.md"
}

# Read department state for a goal
read_department() {
    local goal_file="$1"
    local dept="${2:-}"
    local gid
    gid=$(basename "$goal_file" .md)
    if [ -z "$dept" ]; then
        ls -t "$MEKONG_STATE"/departments/"${gid}".json 2>/dev/null | head -1
    else
        echo "$MEKONG_STATE/departments/${gid}.${dept}.json"
    fi
}

# Read SOP gate evidence
read_gate() {
    local goal_file="$1"
    local gid
    gid=$(basename "$goal_file" .md)
    echo "$MEKONG_STATE/gates/${gid}.json"
}

# Write to department ledger (append/update)
write_department_ledger() {
    local goal_file="$1"
    local dept_id="$2"
    local action="$3"  # e.g., "start", "complete", "evidence_added"
    local gid
    gid=$(basename "$goal_file" .md)
    
    mkdir -p "$MEKONG_STATE/departments"
    local ledger_file="$MEKONG_STATE/departments/${gid}.ledger.json"
    
    if [ -f "$ledger_file" ]; then
        echo "Existing ledger found: $ledger_file (append mode)" >&2
    else
        echo '{"actions": []}' > "$ledger_file"
    fi
    
    # Append action entry with timestamp
    local ts=$(date +%Y-%m-%dT%H:%M:%S)
    sed -i '' "s/}\]/{\"action\": \"${action}\", \"dept\": \"${dept_id}\", \"time\": \"${ts}\"}]/" "$ledger_file" 2>/dev/null || \
        echo "{\"action\": \"${action}\", \"dept\": \"${dept_id}\", \"time\": \"${ts}\"}" >> "$ledger_file"
    
    echo "Ledger updated: $ledger_file"
}

# Validate evidence contract fields against SOP requirements
validate_evidence() {
    local goal_file="$1"
    local evidence_json="${2:-}"
    
    if [ -z "$evidence_json" ]; then
        echo "Usage: validate_evidence <goal-file> <evidence-json>" >&2
        return 1
    fi
    
    # Basic validation check (expandable for strict mode)
    if python3 -c "import json; json.load(open('$evidence_json'))" 2>/dev/null; then
        echo "Evidence JSON valid."
        # TODO: Add field-level validation against SOP contract
    else
        echo "Invalid JSON in evidence file." >&2
        return 1
    fi
}

# ── MCP Server Main Loop ────────────────────────────────────────

handle_request() {
    local request="$1"
    
      # Parse tool name from request (simple grep-based for shell)
     if echo "$request" | grep -q 'list_goals'; then
         echo "Listing all MEKONG goals..."
         ls -t "$MEKONG_STATE"/goal-*.md 2>/dev/null || echo "No active goals found."
         
     elif echo "$request" | grep -q 'read_department'; then
         local dept_id=$(echo "$request" | sed 's/.*dept_id:\s*//' | sed 's/\s*$//')
         local goal_file=$(ls -t "$MEKONG_STATE"/goal-*.md 2>/dev/null | head -1)
         read_department "$goal_file" "$dept_id"
         
     elif echo "$request" | grep -q 'advance_gate'; then
         local goal_id=$(echo "$request" | sed 's/.*goal_id:\s*//' | sed 's/\s*$//')
         local evidence="$MEKONG_STATE/gates/${goal_id}.json"
         echo "Validating gate for goal: $goal_id"
         validate_evidence "$goal_file" "$evidence" || exit 1
         
     elif echo "$request" | grep -q 'hermes_bridge_status'; then
         echo "MEKONG-Hermes Bridge Status:"
         [ -f "$PROJECT_ROOT/lib/hermes-bridge.sh" ] && echo "  ✓ Bridge Script: Active" || echo "  ✗ Bridge Script: Missing"
         [ -f "$HERMES_HOME/skills/mekongmind/SKILL.md" ] && echo "  ✓ Mekong Mind Skill: Active" || echo "  ✗ Mekong Mind Skill: Missing"
         [ -d "$MEKONG_STATE/departments" ] && echo "  ✓ Department Ledger: Ready" || echo "  ✗ Department Ledger: Not initialized"
         
     else
         echo "Unknown tool call. Available tools:"
         echo "- list_goals"
         echo "- read_department"
         echo "- advance_gate"
         echo "- hermes_bridge_status"
     fi
}

# Read stdin and process as MCP requests (simplified single-line format)
while IFS= read -r line || [ -n "$line" ]; do
    handle_request "$line"
done
