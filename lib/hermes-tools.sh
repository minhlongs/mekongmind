# ============================================================================
# hermes-tools.sh — Hermes Agent Tool Integration for MEKONG_WRAPPER
# ============================================================================
# Provides Hermes-style structured tool definitions that wrap the existing
# agent dispatch mechanism (resolve_agent → claude -p --agent).
# Each of the 58 registry agents becomes a callable Hermes tool.
#
# Source this file: source lib/hermes-tools.sh
#
# Commands:
#   hermes_idea "<desc>"              Create idea goal with Hermes tools
#   hermes_run_step N <goal>          Execute step N with Hermes dispatch
#   hermes_workflow_idea "<desc>"     Full workflow: idea → goal → step 1
#   hermes_list_tools                 List all available agents/tools
#   hermes_tool_info <agent_id>       Show details for one agent/tool
#   hermes_export_tools [file]        Export tool definitions to JSON
#   hermes_run_chain <chain.yaml>     Run goal chain with Hermes dispatch
#   hermes_tool_definitions           Print JSON tool definitions to stdout
#   hermes_status                     Show integration status
# ============================================================================

if [[ "${__HERMES_TOOLS_LOADED:-}" == "1" ]]; then
  return 0
fi
__HERMES_TOOLS_LOADED=1

# ---- Dependencies ----
_hermes_registry="${REGISTRY_FILE:-$(dirname "${BASH_SOURCE[0]}")/../agents/registry.json}"
_hermes_goal_executor="$(dirname "${BASH_SOURCE[0]}")/goal-executor.sh"
_hermes_agent_patterns="$(dirname "${BASH_SOURCE[0]}")/agent-patterns.sh"

# ---- JSON Tool Definitions ----

# Output Hermes-format tool definitions JSON array from registry
hermes_tool_definitions() {
  local registry="${1:-$_hermes_registry}"

  if [[ ! -f "$registry" ]]; then
    echo "ERROR: registry not found at $registry" >&2
    echo "[]"
    return 1
  fi

  python3 - "$registry" <<'PY'
import json, sys

registry_path = sys.argv[1]

try:
    with open(registry_path) as f:
        registry = json.load(f)
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)

tools = []
for agent in registry.get("unified_agents", []):
    agent_id = agent.get("id", "")
    if not agent_id:
        continue
    domain = agent.get("domain", "")
    commands = agent.get("commands", "")
    source = agent.get("source", "")
    parts = []
    if commands:
        parts.append(f"Commands: {commands}")
    if domain:
        parts.append(f"Domain: {domain}")
    desc = " | ".join(parts) if parts else agent_id
    # Truncate to Hermes-friendly length
    if len(desc) > 200:
        desc = desc[:197] + "..."
    tools.append({
        "type": "function",
        "function": {
            "name": agent_id,
            "description": desc,
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": "The specific task or question for this agent"
                    },
                    "context": {
                        "type": "string",
                        "description": "Goal description, current gate, prior step outputs"
                    },
                    "constraints": {
                        "type": "string",
                        "description": "Hard constraints: budget, timeline, compliance, non-goals"
                    },
                    "output_format": {
                        "type": "string",
                        "description": "Expected output: markdown report, JSON evidence, plan"
                    },
                    "goal_file": {
                        "type": "string",
                        "description": "Path to the goal markdown file being executed"
                    },
                    "step_number": {
                        "type": "integer",
                        "description": "Current step number in the goal sequence"
                    }
                },
                "required": ["task"]
            }
        }
    })

if not tools:
    print(json.dumps([], indent=2))
else:
    print(json.dumps(tools, indent=2))

print(f"\n# Total Hermes tools: {len(tools)}", file=sys.stderr)
PY
}

# Compact single-line JSON (for piping)
hermes_tool_definitions_compact() {
  local registry="${1:-$_hermes_registry}"
  python3 - "$registry" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    registry = json.load(f)
tools = []
for agent in registry.get("unified_agents", []):
    agent_id = agent.get("id", "")
    if not agent_id:
        continue
    domain = agent.get("domain", "")
    commands = agent.get("commands", "")
    parts = []
    if commands:
        parts.append(f"Commands: {commands}")
    if domain:
        parts.append(f"Domain: {domain}")
    desc = (" | ".join(parts) if parts else agent_id)[:250]
    tools.append({
        "type": "function",
        "function": {
            "name": agent_id,
            "description": desc,
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {"type": "string", "description": f"Task for {agent.get('name', agent_id)}"},
                    "context": {"type": "string", "description": "Goal context"},
                    "constraints": {"type": "string", "description": "Constraints"},
                    "output_format": {"type": "string", "description": "Output format"},
                    "goal_file": {"type": "string", "description": "Goal file path"},
                    "step_number": {"type": "integer", "description": "Step number"}
                },
                "required": ["task"]
            }
        }
    })
print(json.dumps(tools, separators=(',', ':')))
print(f"\n# {len(tools)} tools registered", file=sys.stderr)
PY
}

# ---- Hermes-Enhanced Step Execution ----

_hermes_build_preamble() {
  local tools_json="$1"
  local goal_file="$2"
  local step_num="$3"
  local goal_content="${4:-}"

  python3 - "$tools_json" "$goal_file" "$step_num" "$goal_content" <<'PY'
import json, sys

tools_json, goal_file, step_num, goal_content = sys.argv[1:5]

try:
    tools = json.loads(tools_json)
except Exception:
    tools = []

preamble = """You are a structured agent executor in the MekongMind CEO Solo Company Orchestrator.

## Current Execution Context
- Goal file: {goal_file}
- Step number: {step_num}
- Goal content: {goal_snippet}

## Tool Catalog
""".format(
    goal_file=goal_file,
    step_num=step_num,
    goal_snippet=(goal_content[:500] + "..." if len(goal_content) > 500 else goal_content) if goal_content else "(no goal content)"
)

for tool in tools:
    fn = tool.get("function", {})
    name = fn.get("name", "unknown")
    desc = fn.get("description", "")
    preamble += f"- **{name}**: {desc}\n"

preamble += """
## Output Requirements
1. Complete the task for the assigned agent
2. Your final line MUST be: "Step {step_num} Output: <your complete result>"
3. Reference evidence artifacts in state/evidence/ when applicable
4. Follow gate contracts — do not skip required evidence
""".format(step_num=step_num)

print(preamble)
PY
}

# Execute one step with Hermes tool injection
# Usage: hermes_run_step <step_number> [goal_file] [mode]
#   mode: hermes (default) | auto | raw
hermes_run_step() {
  local step_num="${1:-}"
  local goal_file="${2:-}"
  local mode="${3:-hermes}"

  if [[ -z "$step_num" ]]; then
    echo "ERROR: step number required. Usage: hermes_run_step N [goal_file] [mode]" >&2
    return 1
  fi

  # Resolve goal file
  if [[ -z "$goal_file" ]]; then
    goal_file="$(latest_goal_file 2>/dev/null || true)"
    if [[ -z "$goal_file" ]]; then
      echo "ERROR: no goal file found. Create one: hermes_idea <description>" >&2
      return 1
    fi
  fi
  if [[ ! -f "$goal_file" ]]; then
    echo "ERROR: goal file not found: $goal_file" >&2
    return 1
  fi

  # Extract step N text from goal file
  local step_text=""
  step_text=$(python3 - "$goal_file" "$step_num" <<'PY'
import re, sys
goal_file, step_num = sys.argv[1:3]
try:
    n = int(step_num)
except ValueError:
    print("")
    sys.exit(0)

text = open(goal_file).read()

# Try JSON Steps array
m = re.search(r'Steps:\s*\[([^\]]*)\]', text)
if m:
    raw = m.group(1).strip()
    if raw:
        parts = [p.strip().strip('"').strip("'") for p in raw.split(',')]
        if n <= len(parts) and parts[n-1]:
            print(parts[n-1])
            sys.exit(0)

# Try "Step N: text" format
pattern = re.compile(r'(?im)^\s*step\s+(\d+)\s*[:\-]\s*(.+)$', re.M)
matches = {int(g): g2.strip() for g, g2 in pattern.findall(text)}
if n in matches:
    print(matches[n])
    sys.exit(0)

# Try numbered list
pattern2 = re.compile(r'(?m)^\s*(\d+)\.\s+(.+)$', re.M)
matches2 = {int(g): g2.strip() for g, g2 in pattern2.findall(text)}
if n in matches2:
    print(matches2[n])
    sys.exit(0)

print("")
PY
)

  if [[ -z "$step_text" ]]; then
    echo "ERROR: step $step_num not found in goal file" >&2
    return 1
  fi

  # Resolve agent using existing resolution
  local agent=""
  agent=$(resolve_agent "$step_text" 2>/dev/null || echo "planner")

  # Goal content for context
  local goal_content=""
  goal_content=$(head -50 "$goal_file" 2>/dev/null || true)

  # Build Hermes tool preamble
  local tools_json=""
  tools_json=$(hermes_tool_definitions_compact "$_hermes_registry" 2>/dev/null || echo "[]")

  local preamble=""
  preamble=$(_hermes_build_preamble "$tools_json" "$goal_file" "$step_num" "$goal_content")

  # Structured prompt for Hermes dispatch
  local structured_prompt="${preamble}

---

## Step Execution

**Step:** ${step_num}
**Task:** ${step_text}
**Assigned Agent:** ${agent}
**Goal File:** ${goal_file}

Execute this step. Your response MUST end with:
    Step ${step_num} Output: <complete result>"

  echo "[hermes] Step $step_num → agent=$agent → $(basename "$goal_file")"

  # Dispatch via claude -p with Hermes-enhanced prompt
  local rc=0
  local output=""
  output=$(claude -p --agent "$agent" "$structured_prompt" 2>&1) || rc=$?

  if [[ $rc -eq 0 ]]; then
    # Write output to goal file
    printf "Step %s Output: %s\n" "$step_num" "$output" >> "$goal_file"
    mark_step_done "$goal_file" "$step_num" "$output" 2>/dev/null || true

    echo ""
    echo "=== Step $step_num Complete ==="
    echo "--- Last 15 lines of output ---"
    echo "$output" | tail -15
    return 0
  else
    echo "ERROR: step $step_num failed (rc=$rc)" >&2
    echo "$output" >&2
    return $rc
  fi
}

# ---- Hermes Idea Command ----

# Create idea goal with Hermes tools enabled
hermes_idea() {
  local goal_desc="${1:-}"
  if [[ -z "$goal_desc" ]]; then
    echo "ERROR: idea description required. Usage: hermes_idea <description>" >&2
    return 1
  fi

  local goal_file=""
  goal_file=$(create_idea_goal "$goal_desc" "hermes-tools" 2>/dev/null)

  if [[ -n "$goal_file" ]] && [[ -f "$goal_file" ]]; then
    cat >> "$goal_file" <<EOF

## Hermes Agent Integration
- Mode: hermes-tools
- Tool source: agents/registry.json
- Execute: hermes_run_step N <goal_file>
- Dispatch: claude -p --agent with structured tool preamble
EOF
    echo "Goal: $goal_file"
    echo "Next: hermes_run_step 1 $goal_file"
    return 0
  fi

  echo "ERROR: failed to create goal" >&2
  return 1
}

# ---- Tool Listing and Info ----

# List tools as a table
hermes_list_tools() {
    # Detect if $1 is a format keyword or a file path
    local _fmt_check="${1:-}"
    if [[ "$_fmt_check" =~ ^(table|json|count)$ ]]; then
        local format="$_fmt_check"
        local registry="${2:-$_hermes_registry}"
    else
        local registry="${1:-$_hermes_registry}"
        local format="${2:-table}"
    fi

  case "$format" in
    json)
      hermes_tool_definitions "$registry" 2>/dev/null
      ;;
    count)
      python3 - "$registry" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    registry = json.load(f)
print(len(registry.get("unified_agents", [])))
PY
      ;;
    table|*)
      python3 - "$registry" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    registry = json.load(f)

agents = registry.get("unified_agents", [])
print(f"{'ID':<30} {'Name':<22} {'Department':<22} {'Role'}")
print("─" * 100)
for agent in sorted(agents, key=lambda a: a.get("domain", "")):
    aid = agent.get("id", "")
    domain = agent.get("domain", "")[:22]
    cmds = agent.get("commands", "")[:22]
    src = agent.get("source", "")
    print(f"{aid:<30} {domain:<22} {cmds:<22} {src}")
print(f"\nTotal: {len(agents)} agents available as Hermes tools")
PY
      ;;
  esac
}

# Show detailed info for one agent
hermes_tool_info() {
  local agent_id="$1"
  local registry="${2:-$_hermes_registry}"

  if [[ -z "$agent_id" ]]; then
    echo "ERROR: agent ID required" >&2
    return 1
  fi

  python3 - "$registry" "$agent_id" <<'PY'
import json, sys
registry_path, agent_id = sys.argv[1:3]

with open(registry_path) as f:
    registry = json.load(f)

agent = None
for a in registry.get("unified_agents", []):
    if a.get("id") == agent_id:
        agent = a
        break

if not agent:
    for cmd, aid in registry.get("command_to_agent", {}).items():
        if aid == agent_id:
            agent = {"id": agent_id, "name": cmd, "role": "command-route", "department": "command", "description": f"Routed from command: {cmd}"}
            break

if not agent:
    print(f"Agent not found: {agent_id}")
    sys.exit(1)

print(f"Tool:       {agent.get('id', agent_id)}")
print(f"Name:       {agent.get('name', '-')}")
print(f"Role:       {agent.get('role', '-')}")
print(f"Department: {agent.get('department', '-')}")
print(f"Model:      {agent.get('model', 'default')}")
print(f"Source:     {agent.get('source', '-')}")
print(f"Layer:      {agent.get('layer', '-')}")
print()
print(f"Description: {agent.get('description', 'No description')}")
PY
}

# ---- Full Workflow ----

# Complete workflow: idea → goal → execute step 1
hermes_workflow_idea() {
  local goal_desc="${1:-}"
  local pattern="${2:-auto}"

  if [[ -z "$goal_desc" ]]; then
    echo "ERROR: idea description required" >&2
    return 1
  fi

  echo "=== Hermes Workflow: idea → goal → step 1 ==="
  echo ""

  # 1. Create goal
  echo "[1/3] Creating goal..."
  local goal_file=""
  if [[ "$pattern" == "auto" ]]; then
    local detected=""
    detected=$(apply_harness_pattern "$goal_desc" 2>/dev/null || echo "orchestrator")
    goal_file=$(create_idea_goal "$goal_desc" "$detected")
    echo "  Pattern: $detected"
  else
    goal_file=$(create_idea_goal "$goal_desc" "$pattern")
    echo "  Pattern: $pattern"
  fi
  echo "  Goal: $goal_file"
  echo ""

  # 2. Show tool count
  echo "[2/3] Hermes tools loaded..."
  local count
  count=$(hermes_list_tools "$_hermes_registry" "count" 2>/dev/null || echo "?")
  echo "  $count agents registered as tools"
  echo ""

  # 3. Execute step 1
  echo "[3/3] Executing step 1..."
  hermes_run_step 1 "$goal_file" "hermes"
  return $?
}

# ---- Chain Runner ----

hermes_run_chain() {
  local chain_file="${1:-}"
  if [[ -z "$chain_file" ]]; then
    echo "ERROR: chain file required" >&2
    return 1
  fi
  if [[ ! -f "$chain_file" ]]; then
    echo "ERROR: chain file not found: $chain_file" >&2
    return 1
  fi

  echo "[hermes] Running chain: $chain_file"

  local goals=()
  while IFS= read -r line; do
    goals+=("$line")
  done < <(grep -E '^\s*- goal:' "$chain_file" | sed 's/.*goal:\s*//' | sed 's/"//g' | sed "s/'//g")

  if [[ ${#goals[@]} -eq 0 ]]; then
    echo "ERROR: no goals found in chain" >&2
    return 1
  fi

  echo "[hermes] Chain has ${#goals[@]} goals"
  local i=1
  for goal_desc in "${goals[@]}"; do
    echo "[hermes] Goal $i: $goal_desc"
    hermes_workflow_idea "$goal_desc" "auto" || return 1
    i=$((i + 1))
    echo ""
  done

  echo "[hermes] Chain complete"
}

# ---- Export ----

hermes_export_tools() {
  local output_file="${1:-$(dirname "$_hermes_registry")/../hermes-tools.json}"
  mkdir -p "$(dirname "$output_file")"
  hermes_tool_definitions "$_hermes_registry" 2>/dev/null > "$output_file"
  local count
  count=$(python3 -c "import json; d=json.load(open('$output_file')); print(len(d))" 2>/dev/null || echo "?")
  echo "Exported $count tools to: $output_file"
}

# ---- Status ----

hermes_status() {
  cat <<EOF
=== Hermes Agent Integration ===

Registry:   $_hermes_registry
Tools:      $(hermes_list_tools "$_hermes_registry" "count" 2>/dev/null || echo "?") agents as Hermes tools

Commands:
  hermes_idea "<desc>"              Create idea goal with Hermes tools
  hermes_run_step N [goal]          Execute step N with Hermes dispatch
  hermes_workflow_idea "<desc>"     Full: idea → goal → step 1
  hermes_list_tools [format]        List tools (table|json|count)
  hermes_tool_info <agent_id>       Show agent details
  hermes_export_tools [file]        Export JSON tool definitions
  hermes_run_chain <chain.yaml>     Run goal chain with Hermes
  hermes_tool_definitions           Print JSON tool definitions
  hermes_status                     This status output

Integration:
  Source:    lib/hermes-tools.sh
  Wraps:     resolve_agent → claude -p --agent
  Pattern:   Hermes function-calling schema over MEKONG agent registry
  Registry:  agents/registry.json (58 unified agents)
EOF
}

echo "[hermes-tools] Loaded — $(hermes_list_tools "$_hermes_registry" "count" 2>/dev/null || echo '?') agents as Hermes tools"
