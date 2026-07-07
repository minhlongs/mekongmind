#!/bin/bash
# agent-patterns.sh — Routing patterns for MEKONG_WRAPPER deep wrapper (v2 unified)
# Maps CLI + command → specialized agent
# Registry source: agents/registry.json (canonical, v2 schema)

REGISTRY="$(dirname "$(dirname "$(readlink -f "$0" || echo "$0")")")/agents/registry.json"

# ── Core routing functions ────────────────────────────────────────────────────

resolve_agent() {
    local cli="${1:-mekong}"
    local cmd="${2:-}"

    # 1) Fast path: unified command_to_agent map (v2 registry)
    if [ -f "$REGISTRY" ]; then
        local agent
        agent=$(python3 -c "
import json,sys
with open(sys.argv[1]) as f: data=json.load(f)
cmd=sys.argv[2]
c=data.get('command_to_agent',{})
agent=c.get(cmd,'')
if not agent: agent=c.get(cmd.lower(),'')
print(agent)
" "$REGISTRY" "$cmd" 2>/dev/null)
        if [ -n "$agent" ]; then
            echo "$agent"
            return 0
        fi
    fi

    # 2) Harness pattern shortcuts (only for idea/goal CLI)
    case "$cli" in
        idea|goal)
        case "$cmd" in
            pipeline|deploy) echo "orchestrator"; return ;;
            review|audit|itgc|sox) echo "code-reviewer"; return ;;
            raas|sales|revenue) echo "business-analyst"; return ;;
            plan|pattern) echo "planner"; return ;;
        esac
        ;;
    esac

    # 3) Fallback: search unified_agents by domain/commands overlap
    if [ -f "$REGISTRY" ]; then
        local agent
        agent=$(python3 -c "
import json,sys
with open(sys.argv[1]) as f: data=json.load(f)
cmd=sys.argv[2].lower().replace('-','').replace('_','')
for a in data.get('unified_agents',[]):
    aid=a['id'].lower().replace('-','').replace('_','')
    if aid==cmd:
        print(a['id']); sys.exit(0)
    cmds=a.get('commands','').lower().replace('-','').replace('_','')
    if cmd in cmds:
        print(a['id']); sys.exit(0)
print('')
" "$REGISTRY" "$cmd" 2>/dev/null)
        if [ -n "$agent" ]; then
            echo "$agent"
            return 0
        fi
    fi

    # 4) Ultimate fallback
    echo ""
}

# List agents by source (v2 unified registry)
list_agents() {
    local src="${1:---all}"
    python3 -c "
import json,sys
with open(sys.argv[1]) as f: data=json.load(f)
src=sys.argv[2]
agents=data.get('unified_agents',[])
if src in ('--all',''):
    for a in agents: print(a['id'])
elif src=='--mekong':
    for a in agents:
        s=a.get('source','')
        if s in ('mekong-cli','mekong-cli+claudekit'): print(a['id'])
elif src in ('--ck','--claudekit'):
    for a in agents:
        s=a.get('source','')
        if s in ('claudekit','mekong-cli+claudekit'): print(a['id'])
elif src=='--harness':
    for a in agents:
        if a.get('source','')=='me-wrapper': print(a['id'])
elif src=='--deprecated':
    for a in agents:
        if a.get('deprecated'): print(a['id'])
" "$REGISTRY" "$src" 2>/dev/null
}

# Return "domain|source|path|deprecated" for a given agent id (v2)
agent_info() {
    local id="${1:-}"
    python3 -c "
import json,sys
with open(sys.argv[1]) as f: data=json.load(f)
id=sys.argv[2]
for a in data.get('unified_agents',[]):
    if a['id']==id:
        dep=' (deprecated->'+a.get('replaced_by','')+')' if a.get('deprecated') else ''
        print(a.get('domain','')+'|'+a.get('source','')+'|'+a.get('path','')+dep)
        sys.exit(0)
print('||')
" "$REGISTRY" "$id" 2>/dev/null
}

# Route an idea/goal to an agent based on keyword (v2)
route_idea() {
    local keyword="${1:-}"
    python3 -c "
import json,sys
with open(sys.argv[1]) as f: data=json.load(f)
kw=sys.argv[2].lower()
for a in data.get('unified_agents',[]):
    if kw in a.get('domain','').lower() or kw in a['id'].lower():
        print(a['id']); sys.exit(0)
print('orchestrator')
" "$REGISTRY" "$keyword" 2>/dev/null
}

# ── Harness pattern selection ─────────────────────────────────────────────────

apply_harness_pattern() {
    local pattern="${1:-}"
    local task="${2:-}"
    local ltask matched=""
    ltask=$(printf '%s' "$task" | tr '[:upper:]' '[:lower:]')
    if [ "$pattern" = "auto" ]; then
        if printf '%s' "$ltask" | grep -Eq 'deploy|release|build|ship|cd|deploying'; then
            matched="pipeline"
        elif printf '%s' "$ltask" | grep -Eq 'iterate|refine|polish|vòng|lặp|sửa lại'; then
            matched="iterative-refiner"
        elif printf '%s' "$ltask" | grep -Eq 'plan|strategy|roadmap|overview|chiến lược|lộ trình'; then
            matched="orchestrator"
        elif printf '%s' "$ltask" | grep -Eq 'expert|special|complex|chuyên sâu|phức tạp|nhiều khía cạnh'; then
            matched="expert-pool"
        elif printf '%s' "$ltask" | grep -Eq 'review|đánh giá|kiểm tra|qa|audit'; then
            matched="producer-reviewer"
        elif printf '%s' "$ltask" | grep -Eq 'fanout|fan-in|song song|đồng thời|phân tán'; then
            matched="fanout-fanin"
        elif printf '%s' "$ltask" | grep -Eq 'supervisor|quản lý|phê duyệt|approve|giam sat'; then
            matched="supervisor"
        elif printf '%s' "$ltask" | grep -Eq 'hierarch|lần lượt|tầng|tier|layer|cấp'; then
            matched="hierarchical"
        fi
        [ -z "$matched" ] && matched="orchestrator"
        echo "$matched"
        return 0
    fi
    case "$pattern" in
        pipeline|iterative-refiner|orchestrator|expert-pool|producer-reviewer|fanout-fanin|supervisor|hierarchical)
            echo "$pattern" ;;
        *) echo "" ;;
    esac
}

# ── Registry command catalog helpers (v2) ────────────────────────────────────

_registry_json() { cat "$REGISTRY" 2>/dev/null || echo "{}"; }
_jq() {
    if command -v jq >/dev/null 2>&1; then jq -r "$@"; else
        python3 -c "import sys,json; d=json.load(sys.stdin); print($*)"
    fi
}

# list_commands [prefix] — prints "command -> agent_id"
list_commands() {
    local prefix="${1:-}"
    if [ -n "$prefix" ]; then
        _registry_json | _jq -r --arg q "$prefix" '(.command_to_agent // {}) | to_entries[] | select(.key|test($q;"i")) | "\(.key) -> \(.value)"'
    else
        _registry_json | _jq -r '(.command_to_agent // {}) | to_entries[] | "\(.key) -> \(.value)"'
    fi
}

# command_to_agent <cmd> — echo agent_id
command_to_agent() {
    local cmd="$1" agent=""
    agent=$(_registry_json | _jq -r '(.command_to_agent // {})["'"$cmd"'"] // empty')
    if [ -n "$agent" ]; then echo "$agent"; return; fi
    local lc; lc=$(printf '%s' "$cmd" | tr '[:upper:]' '[:lower:]')
    agent=$(_registry_json | _jq -r '(.command_to_agent // {}) | to_entries[] | select(.key|ascii_downcase=="'"$lc"'") | .value' | head -1)
    echo "${agent:-}"
}

# registry_count — echo "total <n>" then per-source breakdown (v2)
registry_count() {
    _registry_json | python3 -c "
import json,sys
from collections import Counter
with open(sys.stdin) as f: data=json.load(f)
agents=data.get('unified_agents',[])
c=Counter(a.get('source','unknown') for a in agents)
print('total ' + str(len(agents)))
for src,n in sorted(c.items()): print(src + ' ' + str(n))
" 2>/dev/null
}

# registry_list <cli> — TSV: agent_id commands path
registry_list() {
    local cli="$1"
    _registry_json | _jq -r --arg c "$cli" '.[$c][] | [.id, (.commands // .domain // ""), (.path // "")] | @tsv'
}

# ── Department & SOP functions ────────────────────────────────────────────────

# registry_departments — TSV: id owner_agent metric
registry_departments() {
    _registry_json | _jq -r '(.mekongmind_departments // [])[] | [.id, .owner_agent, .metric] | @tsv'
}

# registry_department_sop <department-id>
registry_department_sop() {
    local dept="${1:-}"
    _registry_json | _jq -r --arg d "$dept" '
    (.mekongmind_departments // [])
    | map(select(.id==$d or .name==$d))
    | first
    | if . == null then empty else
    "Department: \(.id)\nOwner: \(.owner_agent)\nMission: \(.mission)\nCommands: \((.owns_commands // []) | join(", "))\nSOP: \((.sop_chain // []) | join(" -> "))\nGateArtifact: \(.gate_artifact // "")\nSOPFile: \(.sop_file // "")\nMetric: \(.metric)"
    end'
}

# registry_department_blueprint <department-id>
registry_department_blueprint() {
    local dept="${1:-}"
    _registry_json | _jq -r --arg d "$dept" '
    (.mekongmind_departments // [])
    | map(select(.id==$d or .name==$d))
    | first
    | if . == null then empty else
    . as $dept
    | (.operating_blueprint // {}) as $b
    | "Department: \($dept.id)\nOwner: \($dept.owner_agent)\nGateArtifact: \($dept.gate_artifact)\nInputs: \((($b.upstream_inputs // []) | join(", ")))\nDecisionRights: \((($b.decision_rights // []) | join(", ")))\nOutputArtifacts: \((($b.output_artifacts // []) | join(", ")))\nHandoffTargets: \((($b.handoff_targets // []) | join(" -> ")))\nAutomationCadence: \($b.automation_cadence // "")\nEscalationTriggers: \((($b.escalation_triggers // []) | join(", ")))\nSuccessDefinition: \($b.success_definition // "")"
    end'
}

# registry_department_owner <department-id>
registry_department_owner() {
    local dept="${1:-}"
    _registry_json | _jq -r --arg d "$dept" '
    (.mekongmind_departments // [])
    | map(select(.id==$d or .name==$d))
    | first
    | .owner_agent // empty'
}

# registry_department_gate <department-id>
registry_department_gate() {
    local dept="${1:-}"
    _registry_json | _jq -r --arg d "$dept" '
    (.mekongmind_departments // [])
    | map(select(.id==$d or .name==$d))
    | first
    | .gate_artifact // empty'
}

# registry_department_sop_file <department-id>
registry_department_sop_file() {
    local dept="${1:-}"
    _registry_json | _jq -r --arg d "$dept" '
    (.mekongmind_departments // [])
    | map(select(.id==$d or .name==$d))
    | first
    | .sop_file // empty'
}

# ── Operating model functions ─────────────────────────────────────────────────

# registry_operating_model
registry_operating_model() {
    _registry_json | _jq -r '
    .mekongmind_operating_model as $m
    | "Identity: \($m.identity // "")",
    "Target: \($m.target // "")",
    "",
    "SourceRoles:",
    (($m.source_roles // [])[] | "- \(.source): \(.role) | owns=\((.owns // []) | join(", "))"),
    "",
    "Lifecycle:",
    (($m.lifecycle // [])[] | "- \(.stage): departments=\((.departments // []) | join(" -> ")) | gate=\(.gate) | outcome=\(.outcome)"),
    "",
    "Invariants:",
    (($m.invariants // [])[] | "- \(.)")'
}

# registry_operating_layers [filter]
registry_operating_layers() {
    local filter="${1:-}"
    _registry_json | _jq -r --arg q "$filter" '
    (.mekongmind_operating_model.operating_layers // [])
    | map(select(
        $q == ""
        or .layer == $q
        or (.name | test($q; "i"))
        or ((.departments // []) | index($q))
        or ((.commands // []) | index($q))
      ))
    | .[]
    | "Layer: \(.layer)\nName: \(.name)\nPurpose: \(.purpose)\nSourceMix: \((.source_mix // []) | join(" + "))\nDepartments: \((.departments // []) | join(" -> "))\nCommands: \((.commands // []) | join(", "))\nSOPFocus: \((.sop_focus // []) | join(" -> "))\nEntrySignal: \(.entry_signal)\nExitGate: \(.exit_gate)\nHandoffTo: \((.handoff_to // []) | join(" -> "))\nFailureSignal: \(.failure_signal)\n---"'
}

# registry_revenue_ladder — TSV milestone target_mrr gate departments evidence focus bottleneck
registry_revenue_ladder() {
    _registry_json | _jq -r '
    (.mekongmind_operating_model.revenue_ladder // [])
    | .[]
    | [ .milestone,
      (.target_mrr | tostring),
      .gate,
      ((.departments // []) | join(" -> ")),
      .evidence,
      ((.sop_focus // []) | join(" -> ")),
      .next_bottleneck
    ] | @tsv'
}

# registry_local_llm_runtime [filter]
registry_local_llm_runtime() {
    local filter="${1:-}"
    python3 - "$REGISTRY" "$filter" <<'PY'
import json
import re
import sys

path, query = sys.argv[1:3]
with open(path) as f:
    data = json.load(f)
runtime = data.get("mekongmind_local_llm_runtime", {})
pattern = re.compile(re.escape(query), re.I) if query else None

def hit(*parts):
    if not pattern:
        return True
    return bool(pattern.search(" ".join(str(p) for p in parts if p is not None)))

print(f"Purpose: {runtime.get('purpose', '')}")
print(f"ProviderPriority: {' -> '.join(runtime.get('provider_priority', []))}")
print("")
print("HardwareProfiles:")
for profile in runtime.get("hardware_profiles", []):
    if hit(profile.get("id"), profile.get("machine"), profile.get("safe_model_band"), profile.get("notes")):
        print(f"- {profile.get('id')}: {profile.get('machine')}")
        print(f"  runtime: {profile.get('primary_runtime')} | secondary={', '.join(profile.get('secondary_runtimes', []))}")
        print(f"  safe: {profile.get('safe_model_band')}")
        print(f"  burst: {profile.get('burst_model_band')}")
        print(f"  notes: {profile.get('notes')}")
print("")
print("ModelPolicy:")
for policy in runtime.get("installed_model_policy", []):
    if hit(policy.get("role"), policy.get("model"), policy.get("why"), " ".join(policy.get("departments", []))):
        print(f"- {policy.get('role')}: {policy.get('model')} via {policy.get('runtime')}")
        print(f"  departments: {' -> '.join(policy.get('departments', []))}")
        print(f"  commands: {', '.join(policy.get('commands', []))}")
        print(f"  why: {policy.get('why')}")
        print(f"  context: {policy.get('context_policy')}")
print("")
print("SOPLoopPolicy:")
for key, value in runtime.get("sop_loop_policy", {}).items():
    if hit(key, value):
        print(f"- {key}: {value}")
print("")
print("NoGapInvariants:")
for invariant in runtime.get("no_gap_invariants", []):
    if hit(invariant):
        print(f"- {invariant}")
print("")
print("FailureModes:")
for item in runtime.get("failure_modes", []):
    if hit(item.get("signal"), item.get("fallback")):
        print(f"- {item.get('signal')}: {item.get('fallback')}")
print("")
print("InspectionCommands:")
for command in runtime.get("inspection_commands", []):
    print(f"- {command}")
PY
}

# ── Department mesh functions ─────────────────────────────────────────────────

# registry_department_mesh [filter]
registry_department_mesh() {
    local filter="${1:-}"
    python3 - "$REGISTRY" "$filter" <<'PY'
import json, re, sys
path, q = sys.argv[1:3]
with open(path) as f: data = json.load(f)
for dept_entry in data.get("mekongmind_department_capability_mesh", []):
    dept_name = dept_entry.get("department", "")
    for cell in dept_entry.get("cells", []):
        haystack = " ".join([
            dept_name, cell.get("sop_stage", ""), cell.get("gate", ""),
            " ".join(cell.get("commands", [])),
            " ".join(cell.get("agents", [])),
            cell.get("proof", ""),
            " ".join(cell.get("handoff", [])),
            cell.get("failure_signal", ""),
        ])
        if q and not re.search(q, haystack, re.I):
            continue
        print("\t".join([
            dept_name,
            cell.get("sop_stage", ""),
            cell.get("gate", ""),
            ", ".join(cell.get("commands", [])),
            ", ".join(cell.get("agents", [])),
            cell.get("proof", ""),
            " -> ".join(cell.get("handoff", [])),
            cell.get("failure_signal", ""),
        ]))
PY
}

# registry_department_brief <department>
registry_department_brief() {
    local department="${1:-}"
    python3 - "$REGISTRY" "$department" <<'PY'
import json, sys
path, department = sys.argv[1:3]
with open(path) as f: data = json.load(f)
departments = {d["id"]: d for d in data.get("mekongmind_departments", [])}
dept = departments.get(department)
if not dept: raise SystemExit(0)
contract = next((c for c in data.get("mekongmind_evidence_contracts", []) if c.get("department") == department), {})
mesh = next((m for m in data.get("mekongmind_department_capability_mesh", []) if m.get("department") == department), {})
blueprint = dept.get("operating_blueprint", {})
def join(items, sep=", "): return sep.join(items) if items else "none"
print(f"Department: {department}")
print(f"Owner: {dept.get('owner_agent', '')}")
print(f"SupportAgents: {join(dept.get('support_agents', []))}")
print(f"Mission: {dept.get('mission', '')}")
print(f"Gate: {dept.get('gate_artifact', '')}")
print(f"SOPFile: {dept.get('sop_file', '')}")
print(f"Metric: {dept.get('metric', '')}")
print(f"Inputs: {join(blueprint.get('upstream_inputs', []))}")
print(f"DecisionRights: {join(blueprint.get('decision_rights', []))}")
print(f"OutputArtifacts: {join(blueprint.get('output_artifacts', []))}")
print(f"HandoffTargets: {join(blueprint.get('handoff_targets', []), ' -> ')}")
print(f"EvidenceArtifact: {contract.get('artifact_path', 'none')}")
print(f"RequiredFields: {join(contract.get('required_fields', []))}")
print(f"ProofRule: {contract.get('proof_rule', 'none')}")
print("SOPCells:")
for cell in mesh.get("cells", []):
    print(f"- {cell.get('sop_stage', '')} | commands={join(cell.get('commands', []))} | agents={join(cell.get('agents', []))} | proof={cell.get('proof', '')} | handoff={join(cell.get('handoff', []), ' -> ')} | failure={cell.get('failure_signal', '')}")
PY
}

# ── Room system functions ─────────────────────────────────────────────────────

registry_department_rooms() {
    local filter="${1:-}"
    python3 - "$REGISTRY" "$filter" <<'PY'
import json, re, sys
path, q = sys.argv[1:3]
with open(path) as f: data = json.load(f)
departments = {d["id"]: d for d in data.get("mekongmind_departments", [])}
contracts = {c["department"]: c for c in data.get("mekongmind_evidence_contracts", [])}
def join(items, sep=", "): return sep.join(items) if items else "none"
for room in data.get("mekongmind_department_room_system", []):
    dept_id = room.get("department", "")
    dept = departments.get(dept_id, {})
    contract = contracts.get(dept_id, {})
    haystack = " ".join([
        dept_id, room.get("room_type", ""), room.get("queue_policy", ""),
        room.get("intake_contract", ""),
        " ".join(room.get("checkpoint_stack", [])),
        " ".join(dept.get("owns_commands", [])),
        room.get("decision_loop", ""), room.get("done_when", ""),
    ])
    if q and not re.search(q, haystack, re.I): continue
    print("\t".join([
        dept_id, room.get("room_type", ""), room.get("queue_policy", ""),
        room.get("wip_limit", ""), room.get("intake_contract", ""),
        room.get("operating_cadence", ""),
        join(room.get("checkpoint_stack", []), " -> "),
        room.get("decision_loop", ""), room.get("escalation_policy", ""),
        join(room.get("anti_chaos_rules", []), "; "), room.get("done_when", ""),
        dept.get("gate_artifact", ""), contract.get("artifact_path", ""),
    ]))
PY
}

registry_department_room_brief() {
    local department="${1:-}"
    python3 - "$REGISTRY" "$department" <<'PY'
import json, sys
path, department = sys.argv[1:3]
with open(path) as f: data = json.load(f)
departments = {d["id"]: d for d in data.get("mekongmind_departments", [])}
dept = departments.get(department)
room = next((r for r in data.get("mekongmind_department_room_system", []) if r.get("department") == department), None)
if not dept or not room: raise SystemExit(0)
def join(items, sep=", "): return sep.join(items) if items else "none"
print(f"Department: {department}")
print(f"RoomType: {room.get('room_type', '')}")
print(f"Owner: {dept.get('owner_agent', '')}")
print(f"SupportAgents: {join(dept.get('support_agents', []))}")
print(f"Commands: {join(dept.get('owns_commands', []))}")
print(f"Gate: {dept.get('gate_artifact', '')}")
print(f"QueuePolicy: {room.get('queue_policy', '')}")
print(f"WIPLimit: {room.get('wip_limit', '')}")
print(f"IntakeContract: {room.get('intake_contract', '')}")
print(f"Cadence: {room.get('operating_cadence', '')}")
print(f"Checkpoints: {join(room.get('checkpoint_stack', []), ' -> ')}")
print(f"DecisionLoop: {room.get('decision_loop', '')}")
print(f"Escalation: {room.get('escalation_policy', '')}")
print(f"AntiChaos: {join(room.get('anti_chaos_rules', []), '; ')}")
print(f"DoneWhen: {room.get('done_when', '')}")
PY
}

# ── Gate doctrine functions ───────────────────────────────────────────────────

registry_gate_doctrine() {
    local filter="${1:-}"
    _registry_json | _jq -r --arg q "$filter" '
    (.mekongmind_gate_execution_doctrine // [])
    | map(select(
        $q == ""
        or .gate == $q
        or ((.required_departments // []) | index($q))
        or ((.allowed_command_groups // []) | index($q))
        or ((.required_sop_stages // []) | index($q))
      ))
    | .[]
    | [ .gate, .purpose, .entry_signal, .exit_signal,
        ((.required_departments // []) | join(" -> ")),
        ((.required_sop_stages // []) | join(" -> ")),
        ((.allowed_command_groups // []) | join(", ")),
        ((.blocked_until_pass // []) | join("; ")),
        ((.proof_artifacts // []) | join(", ")),
        .next_gate, .failure_signal
    ] | @tsv'
}

# ── Source fusion functions ──────────────────────────────────────────────────

registry_source_fusion() {
    local filter="${1:-}"
    _registry_json | _jq -r --arg q "$filter" '
    (.mekongmind_source_fusion_matrix // [])
    | map(select(
        $q == ""
        or .source == $q
        or (.source | test($q; "i"))
        or ((.primary_departments // []) | index($q))
        or ((.command_groups // []) | index($q))
        or ((.control_layers // []) | index($q))
      ))
    | .[]
    | [ .source, .legacy_strength, .legacy_failure_if_alone, .merged_role,
        ((.primary_departments // []) | join(" -> ")),
        ((.command_groups // []) | join(", ")),
        ((.control_layers // []) | join(" -> ")),
        .mrr_contribution, .anti_pattern
    ] | @tsv'
}

# ── Operating map (CEO view) ──────────────────────────────────────────────────

registry_operating_map() {
    local filter="${1:-}"
    python3 - "$REGISTRY" "$filter" <<'PY'
import json, re, sys
path, q = sys.argv[1:3]
with open(path) as f: data = json.load(f)
model = data.get("mekongmind_operating_model", {})
doctrine_by_gate = {d.get("gate"): d for d in data.get("mekongmind_gate_execution_doctrine", [])}
milestones_by_gate = {}
for step in model.get("revenue_ladder", []):
    milestones_by_gate.setdefault(step.get("gate", ""), []).append(step.get("milestone", ""))
source_controls = {}
for source in data.get("mekongmind_source_fusion_matrix", []):
    source_controls[source.get("source", "")] = source.get("control_layers", [])
for layer in model.get("operating_layers", []):
    gate = layer.get("exit_gate", "")
    doctrine = doctrine_by_gate.get(gate, {})
    sources = layer.get("source_mix", [])
    controls = []
    for s in sources: controls.extend(source_controls.get(s, []))
    controls = list(dict.fromkeys(controls))
    milestones = milestones_by_gate.get(gate, [])
    row = {
        "layer": layer.get("layer", ""),
        "name": layer.get("name", ""),
        "gate": gate,
        "departments": layer.get("departments", []),
        "source_mix": sources,
        "commands": layer.get("commands", []),
        "sop_focus": layer.get("sop_focus", []),
        "proof": doctrine.get("proof_artifacts", []),
        "blocked": doctrine.get("blocked_until_pass", []),
        "next_gate": doctrine.get("next_gate", ""),
        "milestones": milestones,
        "controls": controls,
        "failure": layer.get("failure_signal", ""),
    }
    haystack = " ".join([
        row["layer"], row["name"], row["gate"], row["next_gate"],
        " ".join(row["departments"]), " ".join(row["source_mix"]),
        " ".join(row["commands"]), " ".join(row["sop_focus"]),
        " ".join(row["milestones"]), " ".join(row["controls"]),
    ])
    if q and not re.search(q, haystack, re.I): continue
    def join_or(items, sep): return sep.join(items) if items else "none"
    print("\t".join([
        row["layer"], row["name"], row["gate"],
        join_or(row["departments"], " -> "),
        " + ".join(row["source_mix"]),
        ", ".join(row["commands"]),
        join_or(row["sop_focus"], " -> "),
        join_or(row["proof"], ", "),
        join_or(row["blocked"], "; "),
        row["next_gate"] or "none",
        join_or(row["milestones"], " -> "),
        join_or(row["controls"], " -> "),
        row["failure"] or "none",
    ]))
PY
}

# registry_execution_journey [layer|gate|department|command|source] — end-to-end CEO trace from idea to MRR.
registry_execution_journey() {
    local filter="${1:-}"
    python3 - "$REGISTRY" "$filter" <<'PY'
import json, re, sys

path, q = sys.argv[1:3]
with open(path) as f:
    data = json.load(f)

departments = {d["id"]: d for d in data.get("mekongmind_departments", [])}
rooms = {r["department"]: r for r in data.get("mekongmind_department_room_system", [])}
contracts = {c["department"]: c for c in data.get("mekongmind_evidence_contracts", [])}
doctrine_by_gate = {d["gate"]: d for d in data.get("mekongmind_gate_execution_doctrine", [])}
mesh_by_department = {m["department"]: m.get("cells", []) for m in data.get("mekongmind_department_capability_mesh", [])}
milestones_by_gate = {}
for step in data.get("mekongmind_operating_model", {}).get("revenue_ladder", []):
    milestones_by_gate.setdefault(step.get("gate", ""), []).append(step.get("milestone", ""))

def join(items, sep=", "):
    return sep.join(items) if items else "none"

for layer in data.get("mekongmind_operating_model", {}).get("operating_layers", []):
    gate = layer.get("exit_gate", "")
    doctrine = doctrine_by_gate.get(gate, {})
    layer_departments = layer.get("departments", [])
    for department_id in layer_departments:
        dept = departments.get(department_id, {})
        room = rooms.get(department_id, {})
        contract = contracts.get(department_id, {})
        cells = mesh_by_department.get(department_id, [])
        sop_cells = [cell.get("sop_stage", "") for cell in cells]
        cell_commands = []
        cell_agents = []
        for cell in cells:
            cell_commands.extend(cell.get("commands", []))
            cell_agents.extend(cell.get("agents", []))
        cell_commands = list(dict.fromkeys(cell_commands))
        cell_agents = list(dict.fromkeys(cell_agents))
        haystack = " ".join([
            layer.get("layer", ""),
            layer.get("name", ""),
            gate,
            department_id,
            join(layer.get("source_mix", [])),
            join(layer.get("commands", [])),
            join(cell_commands),
            room.get("room_type", ""),
            room.get("queue_policy", ""),
            join(sop_cells),
            join(milestones_by_gate.get(gate, [])),
        ])
        if q and not re.search(q, haystack, re.I):
            continue
        print("\t".join([
            layer.get("layer", ""),
            layer.get("name", ""),
            gate,
            department_id,
            dept.get("owner_agent", ""),
            join(layer.get("source_mix", []), " + "),
            room.get("room_type", "none"),
            room.get("queue_policy", "none"),
            join(room.get("checkpoint_stack", []), " -> "),
            join(sop_cells, " -> "),
            join(cell_commands),
            join(cell_agents),
            contract.get("artifact_path", "none"),
            contract.get("proof_rule", "none"),
            join(doctrine.get("blocked_until_pass", []), "; "),
            doctrine.get("next_gate", "none"),
            join(milestones_by_gate.get(gate, []), " -> "),
            layer.get("failure_signal", "none"),
        ]))
PY
}

# ── Evidence contract functions ───────────────────────────────────────────────

registry_evidence_contracts() {
    local filter="${1:-}"
    _registry_json | _jq -r --arg q "$filter" '
    (.mekongmind_evidence_contracts // [])
    | map(select($q == "" or .department == $q or .gate == $q))
    | .[]
    | "Department: \(.department)\nGate: \(.gate)\nArtifactPath: \(.artifact_path)\nRequiredFields: \((.required_fields // []) | join(", "))\nProofRule: \(.proof_rule)\n---"'
}

registry_evidence_contract_fields() {
    local department="${1:-}"
    _registry_json | _jq -r --arg d "$department" '
    (.mekongmind_evidence_contracts // [])
    | map(select(.department == $d))
    | first
    | (.required_fields // [])[]
    '
}

# ── Command routing functions ─────────────────────────────────────────────────

command_to_department() {
    local cmd="${1:-}"
    python3 - "$REGISTRY" "$cmd" <<'PY'
import json, re, sys
path, cmd = sys.argv[1:3]
with open(path) as f: data = json.load(f)
cmd_l = cmd.lower()
departments = data.get("mekongmind_departments", [])
command_map = data.get("command_to_agent", {})
exact = [d for d in departments if cmd in d.get("owns_commands", [])]
if len(exact) == 1:
    print(exact[0]["id"]); raise SystemExit(0)
agent = command_map.get(cmd) or command_map.get(cmd_l)
if agent:
    owner = [d for d in departments if d.get("owner_agent") == agent]
    if len(owner) == 1:
        print(owner[0]["id"]); raise SystemExit(0)
    support = [d for d in departments if agent in d.get("support_agents", [])]
    if len(support) == 1:
        print(support[0]["id"]); raise SystemExit(0)
if exact:
    print(exact[0]["id"]); raise SystemExit(0)
taxonomy = [
    ("ceo-command", r"idea|ideation|goal|plan|planner|chain|solo|harness|pattern|pipeline|supervisor|step|command|registry|agents|runtime|resolve|mekong|claudekit|cli|workflow|thinking"),
    ("market-intelligence", r"research|analy[sz]e|analysis|investigate|search|find|competitive|competitor|oracle"),
    ("product-strategy", r"business|requirements|product|design|architecture|figma|ux|ui|a11y|accessibility|wcag"),
    ("engineering-factory", r"web|frontend|backend|api|database|db|sql|postgres|postgresql|mongodb|mongoose|nosql|oracle|oracledb|next|nextjs|nest|nestjs|loopback|node|nodejs|react|sdk|ai|stream|kafka|messaging|schema|ssr|fullstack|codebase|refactor|simplify|generics|css|styling|tailwind|vite|webpack|typescript|type-system|types|tsc|google|gemini"),
    ("quality-compliance", r"review|test|testing|unit|vitest|lint|quality|audit|sox|itgc|verify|compliance|jest|playwright|e2e|perf|performance|standards|cleanup|code-quality|code-review|debug|troubleshoot|trace"),
    ("platform-operations", r"deploy|devops|github|actions|docker|compose|container|infrastructure|branch|merge|logging|schedule|shell|hooks|build"),
    ("growth-marketing", r"marketing|content|launch|growth|experiment|seo|ads|campaign"),
    ("sales-revenue", r"sales|revenue|finance|pricing|checkout|billing|mrr"),
    ("customer-success", r"support|tracking|triage|customer|onboarding|fulfillment"),
    ("knowledge-memory", r"docs|documentation|journal|notes|memo|memory"),
]
for dept, pattern in taxonomy:
    if re.search(rf"(^|[-_:])({pattern})([-_:]|$)", cmd_l):
        print(dept); raise SystemExit(0)
print("")
PY
}

# command_route <cmd> — TSV: command agent department gate sop_file
command_route() {
    local cmd="${1:-}"
    local agent dept
    agent=$(command_to_agent "$cmd")
    dept=$(command_to_department "$cmd")
    _registry_json | _jq -r --arg c "$cmd" --arg a "$agent" --arg d "$dept" '
    (.mekongmind_departments // [])
    | map(select(.id==$d))
    | first
    | [$c, $a, $d, (.gate_artifact // ""), (.sop_file // "")]
    | @tsv'
}

# command_gate_policy <command> [current-gate]
command_gate_policy() {
    local cmd="${1:-}"
    local current_gate="${2:-}"
    python3 - "$REGISTRY" "$cmd" "$current_gate" <<'PY'
import json, subprocess, sys
path, command, current_gate = sys.argv[1:4]
root = path.rsplit("/agents/", 1)[0]
with open(path) as f: data = json.load(f)
def sh(script):
    return subprocess.check_output(["bash", "-c", script], text=True).strip()
agent = data.get("command_to_agent", {}).get(command, "")
if not agent:
    agent = data.get("command_to_agent", {}).get(command.lower(), "")
department = sh(f'source "{root}/lib/agent-patterns.sh" >/dev/null 2>&1; command_to_department "{command}"')
departments = {d["id"]: d for d in data.get("mekongmind_departments", [])}
route_gate = departments.get(department, {}).get("gate_artifact", "")
doctrines = data.get("mekongmind_gate_execution_doctrine", [])
allowed_gates = []
proofs = []
blocked = []
for doctrine in doctrines:
    commands = set(doctrine.get("allowed_command_groups", []))
    depts = set(doctrine.get("required_departments", []))
    stages = set(doctrine.get("required_sop_stages", []))
    if command in commands or department in depts or command in stages:
        allowed_gates.append(doctrine.get("gate", ""))
        proofs.extend(doctrine.get("proof_artifacts", []))
        blocked.extend(doctrine.get("blocked_until_pass", []))
if not current_gate: current_gate = route_gate
decision = "BLOCK"
reason = "command is not allowed by any gate doctrine"
if current_gate in allowed_gates:
    decision = "ALLOW"
    reason = f"command belongs to {department} and is allowed inside {current_gate}"
elif allowed_gates:
    reason = f"current gate {current_gate} must move to one of: {', '.join(allowed_gates)}"
def uniq(items):
    out, seen = [], set()
    for item in items:
        if item and item not in seen: seen.add(item); out.append(item)
    return out
print("\t".join([
    command, agent, department, route_gate, current_gate,
    decision, " -> ".join(uniq(allowed_gates)),
    ", ".join(uniq(proofs)), "; ".join(uniq(blocked)), reason,
]))
PY
}

# ── Audit functions ───────────────────────────────────────────────────────────

command_audit() {
    local prefix="${1:-}"
    python3 - "$REGISTRY" "$prefix" <<'PY'
import json, re, subprocess, sys
path, prefix = sys.argv[1:3]
with open(path) as f: data = json.load(f)
departments = {d["id"]: d for d in data.get("mekongmind_departments", [])}
stage_by_department = {}
for stage in data.get("mekongmind_operating_model", {}).get("lifecycle", []):
    for d in stage.get("departments", []):
        stage_by_department[d] = stage.get("stage", "")
agent_sources = {}
for agent in data.get("unified_agents", []):
    agent_sources.setdefault(agent["id"], set()).add(agent.get("source", "unknown"))
def cmd_to_dept(cmd):
    safe = cmd.replace('"', '\\"')
    script = f'source "{path.rsplit("/agents/", 1)[0]}/lib/agent-patterns.sh" >/dev/null 2>&1; command_to_department "{safe}"'
    return subprocess.check_output(["bash", "-c", script], text=True).strip()
rows = []
for cmd, agent in sorted(data.get("command_to_agent", {}).items()):
    if prefix and not re.search(prefix, cmd, re.I): continue
    department = cmd_to_dept(cmd)
    dept = departments.get(department, {})
    source = "+".join(sorted(agent_sources.get(agent, {"unknown"})))
    rows.append((cmd, agent, source, department, stage_by_department.get(department, ""), dept.get("gate_artifact", ""), dept.get("sop_file", "")))
for row in rows: print("\t".join(row))
PY
}

command_audit_summary() {
    command_audit "${1:-}" | python3 -c "
import collections, sys
rows = [line.rstrip('\n').split('\t') for line in sys.stdin if line.strip()]
print(f'Commands: {len(rows)}')
for idx, label in ((2, 'Source'), (4, 'Stage'), (3, 'Department')):
    counts = collections.Counter(row[idx] or 'unmapped' for row in rows)
    print(f'{label}Coverage:')
    for key, count in sorted(counts.items()):
        print(f'- {key}: {count}')
"
}

command_capability_map() {
    local prefix="${1:-}"
    python3 - "$REGISTRY" "$prefix" <<'PY'
import collections, json, re, subprocess, sys
path, prefix = sys.argv[1:3]
with open(path) as f: data = json.load(f)
root = path.rsplit("/agents/", 1)[0]
departments = {d["id"]: d for d in data.get("mekongmind_departments", [])}
stage_by_department = {}
for stage in data.get("mekongmind_operating_model", {}).get("lifecycle", []):
    for d in stage.get("departments", []):
        stage_by_department[d] = stage.get("stage", "")
agent_sources = {}
for agent in data.get("unified_agents", []):
    agent_sources.setdefault(agent["id"], set()).add(agent.get("source", "unknown"))
def cmd_to_dept(cmd):
    safe = cmd.replace('"', '\\"')
    script = f'source "{root}/lib/agent-patterns.sh" >/dev/null 2>&1; command_to_department "{safe}"'
    return subprocess.check_output(["bash", "-c", script], text=True).strip()
groups = collections.defaultdict(lambda: {"commands": [], "agents": set(), "sources": set()})
for command, agent in sorted(data.get("command_to_agent", {}).items()):
    if prefix and not re.search(prefix, command, re.I): continue
    department = cmd_to_dept(command)
    dept = departments.get(department, {})
    stage = stage_by_department.get(department, "")
    gate = dept.get("gate_artifact", "")
    key = (stage, department, gate)
    groups[key]["commands"].append(command)
    groups[key]["agents"].add(agent)
    groups[key]["sources"].update(agent_sources.get(agent, {"unknown"}))
for (stage, department, gate), group in sorted(groups.items()):
    print("\t".join([
        stage, department, gate,
        "+".join(sorted(group["sources"])),
        str(len(group["commands"])),
        ", ".join(group["commands"]),
        ", ".join(sorted(group["agents"])),
    ]))
PY
}

list_command_routes() {
    local prefix="${1:-}"
    local cmd agent dept gate
    while IFS=$'\t' read -r cmd agent; do
        [ -z "$cmd" ] && continue
        if [ -n "$prefix" ] && ! printf '%s' "$cmd" | grep -qiE "$prefix"; then continue; fi
        dept=$(command_to_department "$cmd")
        gate=$(registry_department_gate "$dept" 2>/dev/null || true)
        printf "%s -> %s -> %s -> %s\n" "$cmd" "$agent" "$dept" "$gate"
    done < <(_registry_json | _jq -r '(.command_to_agent // {}) | to_entries[] | [.key, .value] | @tsv' | sort)
}

# ── Handoff graph ─────────────────────────────────────────────────────────────

registry_handoff_graph() {
    local mode="${1:-text}"
    python3 - "$REGISTRY" "$mode" <<'PY'
import json, sys
path, mode = sys.argv[1:3]
with open(path) as f: data = json.load(f)
departments = {d["id"]: d for d in data.get("mekongmind_departments", [])}
stage_by_department = {}
for layer in data.get("mekongmind_operating_model", {}).get("operating_layers", []):
    for d in layer.get("departments", []):
        stage_by_department[d] = layer.get("layer", "")
edges = []
for did, dept in departments.items():
    blueprint = dept.get("operating_blueprint", {})
    for target in blueprint.get("handoff_targets", []):
        if target not in departments: continue
        edges.append({"from": did, "to": target, "gate": dept.get("gate_artifact", ""), "stage": stage_by_department.get(did, "")})
if mode == "--mermaid":
    print("flowchart LR")
    for did, dept in departments.items():
        label = dept.get("name", did).replace('"', "'")
        print(f' {did.replace("-", "_")}["{label}"]')
    for edge in edges:
        src = edge["from"].replace("-", "_")
        dst = edge["to"].replace("-", "_")
        print(f' {src} -- "{edge["gate"]}" --> {dst}')
else:
    for edge in edges:
        print("\t".join([edge["from"], edge["to"], edge["stage"], edge["gate"]]))
PY
}
