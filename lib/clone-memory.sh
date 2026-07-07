#!/usr/bin/env bash
# clone-memory.sh — Clone-memory engine for MEKONG Mind (me-deep-wrapper v1.0.0)
# Allows cloning, listing, diffing, and replaying goal state snapshots.
# Usage:
#   clone-memory clone <goal-id>
#   clone-memory replay <clone-dir> [--execute]
#   clone-memory list
#   clone-memory diff <goal-id> <clone-dir>
set -euo pipefail

# ──────────────────────────────────────────────
# Portable sed helper (GNU + BSD/macOS)
# ──────────────────────────────────────────────
portable_sed() {
  local pattern="$1"; shift
  local file="$1"
  if sed --version >/dev/null 2>&1; then
    sed -i "$pattern" "$file"
  else
    sed -i '' "$pattern" "$file"
  fi
}

# ──────────────────────────────────────────────
# Logging helpers
# ──────────────────────────────────────────────
log_info()  { printf '\033[1;34m[INFO]\033[0m  %s\n' "$*"; }
log_ok()    { printf '\033[1;32m[ OK ]\033[0m  %s\n' "$*"; }
log_warn()  { printf '\033[1;33m[WARN]\033[0m  %s\n' "$*" >&2; }
log_error() { printf '\033[1;31m[ERR ]\033[0m  %s\n' "$*" >&2; }

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_STATE="/Users/macbook/Documents/me-deep-wrapper/state"
SOURCE_GATES="$SOURCE_STATE/gates"
SOURCE_EVIDENCE="$SOURCE_STATE/evidence"
CLONES_DIR="/Users/macbook/mekongmind/state/clones"
METADATA_FILE="clone-meta.json"

# ──────────────────────────────────────────────
# flock_write — atomic writes (flock on Linux, mkdir-lock on macOS)
# ──────────────────────────────────────────────
if command -v flock >/dev/null 2>&1 && [ -f "$SCRIPT_DIR/state-lock.sh" ]; then
  # Linux: delegate to project state-lock.sh which uses flock
  source "$SCRIPT_DIR/state-lock.sh" 2>/dev/null
else
  # macOS fallback: flock not available, use mkdir-based atomic lock
  flock_write() {
    local filepath="${1:?Usage: flock_write <filepath> <content>}"
    local content="${2:-}"
    local lockdir="${filepath}.lockdir"
    mkdir -p "$(dirname "$filepath")"
    local attempts=0
    while ! mkdir "$lockdir" 2>/dev/null; do
      attempts=$((attempts + 1))
      if [ "$attempts" -ge 50 ]; then
        log_error "Lock timeout for $filepath"
        return 1
      fi
      sleep 0.1
    done
    # Write to tmp then mv (atomic on same filesystem)
    local tmpfile="${filepath}.tmp.$$"
    printf '%s' "$content" > "$tmpfile"
    mv "$tmpfile" "$filepath"
    rmdir "$lockdir" 2>/dev/null || true
  }
fi

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

# Resolve a goal-id to its .md file path in SOURCE_STATE
# Handles: goal-YYYYMMDD-HHMMSS, goal-XXXXXX, gate-XXX-YYYYMMDD patterns
resolve_goal_file() {
  local goal_id="$1"

  # Direct match in state root
  if [ -f "$SOURCE_STATE/goal-${goal_id}.md" ]; then
    echo "$SOURCE_STATE/goal-${goal_id}.md"
    return 0
  fi

  # Handle gate-style IDs: gate-fnb-m6m9-20260603 → goal-fnb-m6m9-20260603
  if [[ "$goal_id" == gate-* ]]; then
    local converted="goal-${goal_id#gate-}"
    if [ -f "$SOURCE_STATE/${converted}.md" ]; then
      echo "$SOURCE_STATE/${converted}.md"
      return 0
    fi
  fi

  # Search by basename across state root
  local md_file
  md_file=$(find "$SOURCE_STATE" -maxdepth 1 -name "*${goal_id}*.md" 2>/dev/null | head -1 || true)
  if [ -n "$md_file" ] && [ -f "$md_file" ]; then
    echo "$md_file"
    return 0
  fi

  # Search gates dir for matching JSON, derive .md from basename
  local gate_json base
  gate_json=$(find "$SOURCE_GATES" -name "*${goal_id}*.json" 2>/dev/null | head -1 || true)
  if [ -n "$gate_json" ] && [ -f "$gate_json" ]; then
    base=$(basename "$gate_json" .json)
    base="${base#gate-}"
    if [ -f "$SOURCE_STATE/goal-${base}.md" ]; then
      echo "$SOURCE_STATE/goal-${base}.md"
      return 0
    fi
  fi

  return 1
}

# Collect evidence artifact filenames that exist on disk for a goal
collect_evidence_artifacts() {
  local md_file="$1"
  python3 - "$md_file" "$SOURCE_EVIDENCE" <<'PY'
import os, sys, re

md_file, evidence_dir = sys.argv[1], sys.argv[2]
artifacts = []

with open(md_file) as f:
    content = f.read()

# Find inline evidence file references
for m in re.finditer(r'(state/evidence/[^\s\)]+\.json)', content):
    rel = m.group(1)
    full = os.path.join(os.path.dirname(md_file), rel)
    if os.path.exists(full):
        artifacts.append(full)

# Also scan known artifact filenames in evidence dir
known = [
    "company-blueprint.json", "offer-validated.json", "mvp-live.json",
    "repeatable-channel.json", "fulfillment-stable.json", "scale-ready.json",
    "first-revenue.json", "first-1m-mrr.json", "demo-evidence.json",
]
for k in known:
    full = os.path.join(evidence_dir, k)
    if os.path.exists(full) and full not in artifacts:
        artifacts.append(full)

# Deduplicate preserving order
seen = set()
for a in artifacts:
    if a not in seen:
        seen.add(a)
        print(a)
PY
}

# ──────────────────────────────────────────────
# clone <goal-id>
# ──────────────────────────────────────────────
cmd_clone() {
  local goal_id="${1:-}"
  if [ -z "$goal_id" ]; then
    log_error "Usage: clone-memory clone <goal-id>"
    return 1
  fi

  log_info "Resolving goal: $goal_id"
  local md_file
  md_file=$(resolve_goal_file "$goal_id") || {
    log_error "Goal not found: $goal_id"
    log_error "Searched in: $SOURCE_STATE/"
    return 1
  }
  log_ok "Goal file: $md_file"

  # Resolve gate JSON (may not exist for all goals)
  local gid gate_json=""
  gid=$(basename "$md_file" .md)
  gate_json="$SOURCE_GATES/${gid}.json"
  [ -f "$gate_json" ] || gate_json=""

  # Collect evidence artifacts
  local evidence_files=""
  evidence_files=$(collect_evidence_artifacts "$md_file") || true

  # Build clone directory
  local timestamp
  timestamp=$(date -u +"%Y%m%dT%H%M%SZ")
  local clone_dir="$CLONES_DIR/${gid}-${timestamp}"
  mkdir -p "$clone_dir/artifacts"

  log_info "Cloning to: $clone_dir"

  # Build metadata (use tmp file to capture python3 stdout, then lock-write)
  local meta_tmp meta_content
  meta_tmp=$(mktemp /tmp/clone-mem-meta-XXXXXX.json)
  python3 - "$gid" "$md_file" "$gate_json" "$timestamp" "$goal_id" "$meta_tmp" <<'PY' > "$meta_tmp"
import json, os, sys
from datetime import datetime, timezone

gid, md_file, gate_json, timestamp, requested_id, out_path = sys.argv[1:7]
now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

goal_content = ""
if os.path.exists(md_file):
    with open(md_file) as f:
        goal_content = f.read()

gate_data = {}
if gate_json and os.path.exists(gate_json):
    with open(gate_json) as f:
        gate_data = json.load(f)

# Re-collect evidence filenames (basename only)
evidence_dir = os.path.join(os.path.dirname(md_file), "evidence")
evidence_files = []
known = [
    "company-blueprint.json", "offer-validated.json", "mvp-live.json",
    "repeatable-channel.json", "fulfillment-stable.json", "scale-ready.json",
    "first-revenue.json", "first-1m-mrr.json", "demo-evidence.json",
]
for k in known:
    if os.path.exists(os.path.join(evidence_dir, k)):
        evidence_files.append(k)

meta = {
    "clone_id": f"{gid}-{timestamp}",
    "goal_id": gid,
    "requested_id": requested_id,
    "source_md": md_file,
    "source_gate": gate_json if gate_json else None,
    "timestamp": timestamp,
    "created_at": now,
    "steps_completed": [],
    "gate_ids": [g.get("id","") for g in gate_data.get("gates",[])],
    "current_gate": gate_data.get("current_gate", ""),
    "evidence_artifacts": evidence_files,
    "goal_preview": goal_content[:500] if goal_content else "",
}

with open(out_path, "w") as f:
    json.dump(meta, f, indent=2, sort_keys=True)
    f.write("\n")
PY
  meta_content=$(cat "$meta_tmp")
  rm -f "$meta_tmp"

  if ! flock_write "$clone_dir/$METADATA_FILE" "$meta_content"; then
    log_error "Failed to write clone metadata"
    rm -rf "$clone_dir"
    return 1
  fi
  log_ok "Metadata written"

  # Copy goal .md
  cp "$md_file" "$clone_dir/goal.md"
  log_ok "Goal file copied"

  # Copy gate JSON if present
  if [ -n "$gate_json" ] && [ -f "$gate_json" ]; then
    cp "$gate_json" "$clone_dir/gate-state.json"
    log_ok "Gate state copied"
  fi

  # Copy evidence artifacts
  local copied=0
  while IFS= read -r ev_file; do
    [ -z "$ev_file" ] && continue
    local ev_name
    ev_name=$(basename "$ev_file")
    cp "$ev_file" "$clone_dir/artifacts/$ev_name"
    copied=$((copied + 1))
  done <<< "$evidence_files"

  if [ "$copied" -gt 0 ]; then
    log_ok "Evidence artifacts copied ($copied files)"
  else
    log_warn "No evidence artifacts found"
  fi

  # Initialize replay log
  echo '{"replay_log":[],"status":"pending"}' > "$clone_dir/replay-log.json"

  log_ok "Clone complete: $clone_dir"
  echo "$clone_dir"
}

# ──────────────────────────────────────────────
# replay <clone-dir> [--execute]
# ──────────────────────────────────────────────
cmd_replay() {
  local clone_dir="${1:-}"
  local execute="dry-run"

  # Second arg may be --execute
  if [ "${2:-}" = "--execute" ]; then
    execute="execute"
  fi

  if [ -z "$clone_dir" ]; then
    log_error "Usage: clone-memory replay <clone-dir> [--execute]"
    return 1
  fi

  # Normalize: if a short goal-id was passed, resolve to latest clone
  if [ ! -d "$clone_dir" ]; then
    local candidate
    candidate=$(find "$CLONES_DIR" -maxdepth 1 -type d -name "${clone_dir}-*" 2>/dev/null | sort | tail -1 || true)
    if [ -n "$candidate" ]; then
      log_info "Resolved clone dir: $candidate"
      clone_dir="$candidate"
    else
      log_error "Clone directory not found: $clone_dir"
      log_error "Run 'clone-memory list' to see available clones"
      return 1
    fi
  fi

  local meta_file="$clone_dir/$METADATA_FILE"
  if [ ! -f "$meta_file" ]; then
    log_error "Invalid clone directory: missing $METADATA_FILE"
    return 1
  fi

  # Read goal_id from metadata
  local goal_id
  goal_id=$(python3 - "$meta_file" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    meta = json.load(f)
print(meta.get("goal_id", "unknown"))
PY
)

  log_info "Replaying clone: $(basename "$clone_dir")"
  log_info "Goal ID: $goal_id"

  if [ "$execute" = "execute" ]; then
    log_warn "EXECUTE MODE — changes will be applied to live state"
  else
    log_info "DRY-RUN mode (pass --execute to apply changes)"
  fi

  # Read goal steps from clone
  local goal_file="$clone_dir/goal.md"
  if [ ! -f "$goal_file" ]; then
    log_error "Missing goal.md in clone"
    return 1
  fi

  local steps
  steps=$(grep -E "^Step [0-9]+ Output:" "$goal_file" 2>/dev/null \
    | sed "s/^Step \([0-9]\+\) Output:.*/\1/" \
    | tr '\n' ',' | sed 's/,$//') || steps=""

  if [ -z "$steps" ]; then
    log_warn "No completed steps found in clone goal.md"
  else
    log_info "Steps to replay: $steps"
  fi

  # Read gate state from clone
  local gate_file="$clone_dir/gate-state.json"
  local replay_log="$clone_dir/replay-log.json"
  local now_ts
  now_ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Build replay actions list (write to tmp file to avoid heredoc stdin issue)
  local actions_tmp actions
  actions_tmp=$(mktemp /tmp/clone-mem-actions-XXXXXX.json)
  if [ -f "$gate_file" ]; then
    python3 - "$gate_file" "$execute" "$now_ts" "$actions_tmp" <<'PY'
import json, sys

gate_file, execute_mode, now_ts, out_path = sys.argv[1:5]
with open(gate_file) as f:
    data = json.load(f)

actions = []
for gate in data.get("gates", []):
    gid = gate.get("id", "")
    status = gate.get("status", "pending")
    evidence = gate.get("evidence", [])
    if status == "passed":
        action = {
            "gate_id": gid,
            "action": "record_gate_evidence",
            "status": "passed",
            "source": f"clone-replay:{execute_mode}",
            "evidence_count": len(evidence),
            "timestamp": now_ts,
            "dry_run": execute_mode != "execute",
        }
        if evidence:
            last = evidence[-1]
            action["last_evidence_note"] = last.get("note", "")
        actions.append(action)

with open(out_path, "w") as f:
    json.dump(actions, f, indent=2)
PY
    actions=$(cat "$actions_tmp")
  else
    actions="[]"
    echo "$actions" > "$actions_tmp"
  fi

  # Count actions (guard against empty / invalid JSON)
  local action_count=0
  if python3 -c "import json; json.load(open('$actions_tmp'))" 2>/dev/null; then
    action_count=$(python3 -c "import json; print(len(json.load(open('$actions_tmp'))))")
  fi
  rm -f "$actions_tmp"

  log_info "Replay actions: $action_count"

  if [ "$execute" = "execute" ]; then
    # ── EXECUTE: mutate live state ──────────────────────────────────────────

    # Resolve current live goal file
    local current_goal=""
    current_goal=$(resolve_goal_file "$goal_id" 2>/dev/null || echo "") || true

    if [ -z "$current_goal" ]; then
      log_warn "Current goal file not found for $goal_id — replay log updated only"
    fi

    # Merge clone gate state into live gate state
    if [ -n "$current_goal" ] && [ -f "$gate_file" ]; then
      local live_gate=""
      live_gate=$(python3 - "$current_goal" <<'PY'
import os, sys
md = sys.argv[1]
base = os.path.basename(md).replace('.md', '')
for pfx in ['', 'gate-']:
    p = os.path.join(os.path.dirname(md), 'gates', f'{pfx}{base}.json')
    if os.path.exists(p):
        print(p)
        raise SystemExit(0)
raise SystemExit(1)
PY
) || true

      if [ -n "$live_gate" ] && [ -f "$live_gate" ]; then
        python3 - "$gate_file" "$live_gate" <<'PY'
import json, sys
from datetime import datetime, timezone

clone_gate, live_gate = sys.argv[1], sys.argv[2]
now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

with open(clone_gate) as f:
    clone_data = json.load(f)
with open(live_gate) as f:
    live_data = json.load(f)

clone_gates = {g["id"]: g for g in clone_data.get("gates", [])}
for lg in live_data.get("gates", []):
    cg = clone_gates.get(lg["id"])
    if cg and cg.get("status") == "passed":
        lg["status"] = "passed"
        existing_notes = {e.get("note","") for e in lg.get("evidence", [])}
        for ev in cg.get("evidence", []):
            note = ev.get("note", "")
            if note and note not in existing_notes:
                lg.setdefault("evidence", []).append({
                    "at": now,
                    "source": "clone-replay:execute",
                    "note": f"[replayed from clone] {note}",
                })
        # Advance current_gate if clone is further along
        order = [
            "idea-intake", "company-blueprint", "offer-validated",
            "mvp-live", "first-revenue", "repeatable-channel",
            "fulfillment-stable", "scale-ready", "first-1m-mrr",
        ]
        li = order.index(lg["id"]) if lg["id"] in order else -1
        ci = order.index(live_data.get("current_gate","")) if live_data.get("current_gate","") in order else -1
        if li > ci:
            live_data["current_gate"] = lg["id"]

live_data["updated_at"] = now
live_data["updated_by"] = "clone-replay"

with open(live_gate, "w") as f:
    json.dump(live_data, f, indent=2, sort_keys=True)
    f.write("\n")
PY
        log_ok "Live gate state updated: $live_gate"
      fi
    fi

    # Update replay log
    python3 - "$replay_log" "$actions_tmp" <<'PY' 2>/dev/null || python3 - "$replay_log" "[]" <<'PY'
import json, sys
from datetime import datetime, timezone

replay_log, actions_json = sys.argv[1], sys.argv[2]
now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

with open(replay_log) as f:
    log_data = json.load(f)
log_data["status"] = "executed"
log_data["executed_at"] = now
try:
    actions = json.loads(actions_json)
except Exception:
    actions = []
log_data.setdefault("replay_log", []).append({
    "at": now,
    "mode": "execute",
    "actions": actions,
})
with open(replay_log, "w") as f:
    json.dump(log_data, f, indent=2, sort_keys=True)
    f.write("\n")
PY
    log_ok "Replay executed successfully"

  else
    # ── DRY-RUN: print table of what would happen ───────────────────────────
    python3 - "$actions_tmp" <<'PY' 2>/dev/null || true
import json, sys
try:
    with open(sys.argv[1]) as f:
        actions = json.load(f)
except Exception:
    actions = []
print(f"\n{'Gate':<25} {'Status':<10} {'Source'}")
print("-" * 70)
for a in actions:
    print(f"{a['gate_id']:<25} {a['status']:<10} {a['source']}")
    if a.get("last_evidence_note"):
        print(f"  -> {a['last_evidence_note'][:80]}")
PY
    # Update replay log as dry-run
    python3 - "$replay_log" "$actions_tmp" <<'PY' 2>/dev/null || python3 - "$replay_log" "[]" <<'PY'
import json, sys
from datetime import datetime, timezone

replay_log, actions_json = sys.argv[1], sys.argv[2]
now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
with open(replay_log) as f:
    log_data = json.load(f)
try:
    actions = json.loads(actions_json)
except Exception:
    actions = []
log_data.setdefault("replay_log", []).append({
    "at": now,
    "mode": "dry-run",
    "actions": actions,
})
with open(replay_log, "w") as f:
    json.dump(log_data, f, indent=2, sort_keys=True)
    f.write("\n")
PY
    log_ok "Dry-run complete. Use --execute to apply."
  fi

  rm -f "$actions_tmp" 2>/dev/null || true
}

# ──────────────────────────────────────────────
# list
# ──────────────────────────────────────────────
cmd_list() {
  log_info "Available clones in: $CLONES_DIR"
  echo ""

  if [ ! -d "$CLONES_DIR" ]; then
    log_warn "No clones directory found"
    return 0
  fi

  python3 - "$CLONES_DIR" "$METADATA_FILE" <<'PY'
import json, os, sys

clones_dir, meta_file = sys.argv[1], sys.argv[2]
dirs = sorted([
    d for d in os.listdir(clones_dir)
    if os.path.isdir(os.path.join(clones_dir, d))
    and not d.startswith('.')
])

if not dirs:
    print("  (no clones yet — run 'clone-memory clone <goal-id>' to create one)")
    sys.exit(0)

print(f"{'Clone ID':<50} {'Goal ID':<32} {'Created':<22} {'Evidence'}")
print("-" * 115)
for d in dirs:
    meta_path = os.path.join(clones_dir, d, meta_file)
    if not os.path.exists(meta_path):
        print(f"{d:<50} {'(no meta)':<32} {'':<22} 0 files")
        continue
    try:
        with open(meta_path) as f:
            meta = json.load(f)
        goal_id = meta.get("goal_id", "?")
        created = meta.get("created_at", meta.get("timestamp", "?"))[:19]
        ev_count = len(meta.get("evidence_artifacts", []))
        print(f"{d:<50} {goal_id:<32} {created:<22} {ev_count} artifacts")
    except Exception:
        print(f"{d:<50} {'(parse error)':<32} {'':<22} —")
PY

  local count
  count=$(find "$CLONES_DIR" -maxdepth 1 -type d ! -name "." ! -name ".gitkeep" 2>/dev/null | wc -l | tr -d ' ')
  echo ""
  log_info "Total clones: $count"
}

# ──────────────────────────────────────────────
# diff <goal-id> <clone-dir>
# ──────────────────────────────────────────────
cmd_diff() {
  local goal_id="${1:-}"
  local clone_dir="${2:-}"

  if [ -z "$goal_id" ] || [ -z "$clone_dir" ]; then
    log_error "Usage: clone-memory diff <goal-id> <clone-dir>"
    return 1
  fi

  # Normalize clone dir (accept short goal-id prefix)
  if [ ! -d "$clone_dir" ]; then
    local candidate
    candidate=$(find "$CLONES_DIR" -maxdepth 1 -type d -name "${clone_dir}-*" 2>/dev/null | sort | tail -1 || true)
    if [ -n "$candidate" ]; then
      clone_dir="$candidate"
    else
      log_error "Clone directory not found: $clone_dir"
      return 1
    fi
  fi

  log_info "Diffing current state vs clone: $(basename "$clone_dir")"

  # Resolve current goal
  local current_goal=""
  current_goal=$(resolve_goal_file "$goal_id" 2>/dev/null || echo "") || true
  if [ -z "$current_goal" ]; then
    log_error "Current goal not found: $goal_id"
    return 1
  fi

  local clone_goal="$clone_dir/goal.md"
  local clone_gate="$clone_dir/gate-state.json"

  if [ ! -f "$clone_goal" ]; then
    log_error "Missing goal.md in clone: $clone_dir"
    return 1
  fi

  # Resolve current gate file
  local current_gate=""
  local gid
  gid=$(basename "$current_goal" .md)
  current_gate="$SOURCE_GATES/${gid}.json"
  [ -f "$current_gate" ] || current_gate=""

  python3 - "$current_goal" "$clone_goal" "$current_gate" "$clone_gate" <<'PY'
import json, sys, difflib, os

current_goal, clone_goal, current_gate, clone_gate = sys.argv[1:5]

# --- Goal .md unified diff ---
with open(current_goal) as f:
    current_lines = f.readlines()
with open(clone_goal) as f:
    clone_lines = f.readlines()

diff = list(difflib.unified_diff(
    clone_lines, current_lines,
    fromfile="clone/goal.md", tofile="current/goal.md",
    lineterm=""
))
added   = sum(1 for l in diff if l.startswith('+') and not l.startswith('+++'))
removed = sum(1 for l in diff if l.startswith('-') and not l.startswith('---'))

print(f"\n{'='*60}")
print(f"  Goal .md Diff  (+{added} / -{removed} lines)")
print(f"{'='*60}")
if diff:
    for line in diff[:100]:
        print(line)
    if len(diff) > 100:
        print(f"  ... ({len(diff) - 100} more lines)")
else:
    print("  No changes in goal.md")

# --- Gate state diff ---
gate_changed = False
if current_gate and os.path.exists(current_gate) and clone_gate and os.path.exists(clone_gate):
    with open(current_gate) as f:
        cur = json.load(f)
    with open(clone_gate) as f:
        clo = json.load(f)

    cur_map  = {g["id"]: g for g in cur.get("gates", [])}
    clo_map  = {g["id"]: g for g in clo.get("gates", [])}

    changes = []
    for gid in set(list(cur_map.keys()) + list(clo_map.keys())):
        cs = cur_map.get(gid, {}).get("status", "?")
        cls = clo_map.get(gid, {}).get("status", "?")
        if cs != cls:
            changes.append((gid, cls, cs))

    cur_cg = cur.get("current_gate", "")
    clo_cg = clo.get("current_gate", "")

    print(f"\n{'='*60}")
    print(f"  Gate State Diff  ({len(changes)} status changes)")
    print(f"{'='*60}")
    if cur_cg != clo_cg:
        print(f"  current_gate: {clo_cg} -> {cur_cg}")
        gate_changed = True
    for gid, cls, cs in changes:
        print(f"  {gid:<25} {cls:<12} -> {cs}")
        gate_changed = True
    if not gate_changed:
        print("  No gate status changes")
elif current_gate and not clone_gate:
    print(f"\n  No gate state in clone (current: {current_gate})")
elif clone_gate and not current_gate:
    print(f"\n  No current gate state (clone: {clone_gate})")
else:
    print(f"\n  Gate files not available for comparison")

# --- Evidence artifact presence ---
print(f"\n{'='*60}")
print(f"  Evidence Artifacts  (current vs clone snapshot)")
print(f"{'='*60}")
meta_path = os.path.join(os.path.dirname(clone_goal), "clone-meta.json")
if os.path.exists(meta_path):
    with open(meta_path) as f:
        meta = json.load(f)
    for ev in meta.get("evidence_artifacts", []):
        full = os.path.join("/Users/macbook/Documents/me-deep-wrapper/state/evidence", ev)
        status = "present" if os.path.exists(full) else "MISSING"
        print(f"  {ev:<40} -> {status}")
else:
    print("  No clone metadata found")
PY
}

# ──────────────────────────────────────────────
# Usage / dispatch
# ──────────────────────────────────────────────
usage() {
  cat <<'EOF'
clone-memory.sh — Clone-memory engine for MEKONG Mind v1.0.0

Usage:
  clone-memory clone <goal-id>              Snapshot goal + gate artifacts
  clone-memory replay <clone-dir>           Replay steps (dry-run by default)
  clone-memory replay <clone-dir> --execute  Replay with live state mutation
  clone-memory list                         List all available clones
  clone-memory diff <goal-id> <clone-dir>   Diff current state vs snapshot

State paths:
  Source:  /Users/macbook/Documents/me-deep-wrapper/state/
  Clones:  /Users/macbook/mekongmind/state/clones/

Examples:
  clone-memory clone goal-20260606-042132
  clone-memory list
  clone-memory diff goal-20260606-042132 <clone-dir>
  clone-memory replay <clone-dir> --execute
EOF
}

main() {
  mkdir -p "$CLONES_DIR"

  local cmd="${1:-}"
  shift || true

  case "$cmd" in
    clone)      cmd_clone "$@" ;;
    replay)     cmd_replay "$@" ;;
    list)       cmd_list "$@" ;;
    diff)       cmd_diff "$@" ;;
    -h|--help|help|"") usage ;;
    *)
      log_error "Unknown command: $cmd"
      usage
      return 1
      ;;
  esac
}

main "$@"
