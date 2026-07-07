#!/usr/bin/env bash
# model-router.sh — Smart model allocation for MEKONG_WRAPPER
# Compatible with bash (primary) and zsh (via typeset -A)

# Shell compatibility: use typeset -A for associative arrays (works in bash 4+ and zsh)
# If running under zsh, ensure KSH_ARRAYS is not set (would break subscript syntax)
if [ -n "${ZSH_VERSION:-}" ]; then
    unsetopt KSH_ARRAINS 2>/dev/null || true
    typeset +g g 2>/dev/null || true  # zsh type check
fi
# Routes each task type to the optimal model from 5 allowed Claude models.
# Integrates with Hermes Agent for multi-provider support + parallel subagents.
#
# Shell compat: detect zsh and use typeset -A instead of declare -A
# (declare -A is bash-only; typeset -A works in both bash and zsh)

# ── Shell Detection ─────────────────────────────────────────────────────────
_ME_SHELL="${BASH_VERSION:+bash}"
[ -z "$_ME_SHELL" ] && _ME_SHELL="$(basename "$SHELL" 2>/dev/null || echo bash)"

# Use typeset -A for associative arrays (works in bash 4+ and zsh)
# Bash: typeset -A is alias for declare -A
# Zsh: typeset -A creates associative array
_ARRAY_DECL="typeset -A"

#
# ALLOWED MODELS (user quota only — no other providers):
#   claude-opus-4-8    $15/M  critical  highest reasoning
#   claude-opus-4-7    $15/M  critical  deep reasoning
#   claude-opus-4-6    $15/M  critical  strategic reasoning
#   claude-sonnet-4-6  $3/M   high/med  90% of work
#   claude-haiku-4-5   $0.80/M low      cheap/fast
#
# HERMES_BIN routes ALL calls through claude.zunef.com proxy:
#   base_url: https://claude.zunef.com
#   model:    claude-sonnet-4-6 (etc.)
#
# Priority: critical > high > medium > low > batch
# Goal: Max agentic loop velocity, min cost per task

# ── Allowed Models (user quota only) ───────────────────────────────────────
# Format: model_id|display|cost_per_1M_input|tier
typeset -A ALLOWED_MODELS=(
  ["claude-opus-4-8"]="claude-opus-4-8|Opus 4.8|15.00|critical"
  ["claude-opus-4-7"]="claude-opus-4-7|Opus 4.7|15.00|critical"
  ["claude-opus-4-6"]="claude-opus-4-6|Opus 4.6|15.00|critical"
  ["claude-sonnet-4-6"]="claude-sonnet-4-6|Sonnet 4.6|3.00|high"
  ["claude-haiku-4-5"]="claude-haiku-4-5|Haiku 4.5|0.80|low"
)

# ── Task Registry (maps 18 task types → one of 5 allowed models) ───────────
# Format: task_type|tier|model_id|reason
typeset -A TASK_REGISTRY=(
# CRITICAL — Opus family for deep strategic reasoning
  ["ceo-decision"]="critical|claude-opus-4-8|Highest-stakes CEO decisions"
  ["product-strategy"]="critical|claude-opus-4-7|Product strategy and vision"
  ["complex-reasoning"]="critical|claude-opus-4-6|Multi-step reasoning tasks"

# HIGH — Sonnet for complex implementation
  ["architecture"]="high|claude-sonnet-4-6|System design and architecture"
  ["complex-coding"]="high|claude-sonnet-4-6|Complex implementation tasks"
  ["fullstack-developer"]="high|claude-sonnet-4-6|MVP build via fullstack agent"

# MEDIUM — Sonnet for standard work
  ["code-generation"]="medium|claude-sonnet-4-6|Standard code generation"
  ["sales-copy"]="medium|claude-sonnet-4-6|Marketing and sales copy"
  ["business-analysis"]="medium|claude-sonnet-4-6|Business docs and proposals"
  ["blueprint"]="medium|claude-sonnet-4-6|Product blueprint generation"
  ["architect"]="medium|claude-sonnet-4-6|Architecture via architect agent"
  ["business-analyst"]="medium|claude-sonnet-4-6|Analysis via business-analyst agent"

# LOW — Haiku for cheap/fast tasks
  ["code-review"]="low|claude-haiku-4-5|Quick code review"
  ["research"]="low|claude-haiku-4-5|Quick research and lookup"
  ["boilerplate"]="low|claude-haiku-4-5|Boilerplate generation"
  ["tests"]="low|claude-haiku-4-5|Unit test generation"
  ["docs"]="low|claude-haiku-4-5|Documentation writing"

# BATCH — Haiku for parallel fanout (cheapest available)
  ["fanout"]="batch|claude-haiku-4-5|Parallel fanout tasks"
  ["batch-analysis"]="batch|claude-haiku-4-5|Parallel batch analysis"
)

# ── Proxy Configuration ─────────────────────────────────────────────────────
# All model calls route through claude.zunef.com — the user's API proxy
HERMES_PROXY_URL="${HERMES_PROXY_URL:-https://claude.zunef.com}"
HERMES_API_KEY="${HERMES_API_KEY:-}"
# Provider label for Hermes CLI calls
HERMES_PROVIDER_LABEL="${HERMES_PROVIDER_LABEL:-anthropic}"

# ── Hermes Agent Bridge ────────────────────────────────────────────────────
HERMES_BIN="${HERMES_BIN:-$(command -v hermes 2>/dev/null || echo '')}"
HERMES_ENABLED="${HERMES_ENABLED:-auto}" # auto|force|disable
HERMES_TIMEOUT="${HERMES_TIMEOUT:-120}"  # seconds per task

hermes_available() {
  [ -n "$HERMES_BIN" ] && [ -x "$HERMES_BIN" ] && return 0
  return 1
}

# ── Cost Table (per 1M input tokens, USD) ──────────────────────────────────
typeset -A MODEL_COSTS=(
  ["claude-opus-4-8"]="15.00"
  ["claude-opus-4-7"]="15.00"
  ["claude-opus-4-6"]="15.00"
  ["claude-sonnet-4-6"]="3.00"
  ["claude-haiku-4-5"]="0.80"
)

# ── Model Router ────────────────────────────────────────────────────────────
# Usage: route_model <task_type> [fallback_type]
# Output: "tier model_id cost reason"
route_model() {
  local task_type="${1:-code-generation}"
  local fallback="${2:-code-generation}"

  local entry="${TASK_REGISTRY[$task_type]:-}"
  if [ -z "$entry" ]; then
    log_debug "Router: unknown task_type=$task_type, fallback=$fallback"
    entry="${TASK_REGISTRY[$fallback]:-}"
  fi
  if [ -z "$entry" ]; then
    # Safe fallback: cheapest capable model from allowed set
    echo "medium claude-sonnet-4-6 3.00 Standard fallback"
    return
  fi

  local tier="${entry%%|*}"
  local rest="${entry#*|}"
  local model="${rest%%|*}"
  rest="${rest#*|}"
  local reason="$rest"
  local cost="${MODEL_COSTS[$model]:-3.00}"

  echo "${tier} ${model} ${cost} ${reason}"
}

# ── Hermes Execution Bridge ─────────────────────────────────────────────────
# Usage: hermes_exec <task_type> <prompt> [timeout_s]
# Routes through Hermes Agent with proxy base_url.
# Falls back to claude -p if Hermes unavailable.
hermes_exec() {
  local task_type="${1:-code-generation}"
  local prompt="${2:-}"
  local timeout="${3:-$HERMES_TIMEOUT}"

  if [ "$HERMES_ENABLED" = "disable" ]; then
    return 1
  fi

  # Route to optimal model from allowed 5
  local route
  route=$(route_model "$task_type")
  local tier="${route%% *}"
  route="${route#* }"
  local model="${route%% *}"
  route="${route#* }"
  local cost="${route%% *}"
  route="${route#* }"
  local reason="$route"

  log_info "Router[$tier]: $task_type → $model (\$$cost/1M tok) | $reason"

  # Try Hermes first (routes through proxy base_url)
  if hermes_available; then
    local output rc=0

    # Build Hermes command with proxy config
    # Hermes supports: -m provider:model and --config-key value
    # We set ANTHROPIC_BASE_URL env var so Hermes routes all anthropic
    # model calls through claude.zunef.com
    local hermes_env=""
    if [ -n "$HERMES_PROXY_URL" ]; then
      hermes_env="ANTHROPIC_BASE_URL=$HERMES_PROXY_URL ANTHROPIC_API_KEY=${HERMES_API_KEY:-}"
    fi

    # Use Hermes -m for model selection
    # Hermes auto-reads provider config from its settings
    output=$(timeout "${timeout}s" env $hermes_env "$HERMES_BIN" -m "${HERMES_PROVIDER_LABEL}:${model}" -p "$prompt" 2>&1) || rc=$?

    if [ "$rc" -eq 0 ]; then
      echo "$output"
      return 0
    elif [ "$rc" -eq 124 ]; then
      log_warn "Hermes timeout after ${timeout}s for $task_type, falling back"
    else
      log_debug "Hermes rc=$rc for $task_type, falling back"
    fi
  fi

  # Fallback: direct claude -p with proxy base_url
  if command -v claude >/dev/null 2>&1; then
    log_debug "Fallback: claude -p --model $model via proxy"
    local claude_env=""
    if [ -n "$HERMES_PROXY_URL" ]; then
      claude_env="ANTHROPIC_BASE_URL=$HERMES_PROXY_URL ANTHROPIC_API_KEY=${HERMES_API_KEY:-}"
    fi
    timeout "${timeout}s" env $claude_env claude -p --model "$model" "$prompt" 2>&1
    return $?
  fi

  log_error "No agent available for $task_type (Hermes+claude both missing)"
  return 1
}

# ── Smart Exec Wrapper (replaces bare claude -p calls) ──────────────────────
# Usage: smart_exec <task_type> <prompt> [--agent <name>] [--tools <list>] [--timeout <s>]
# Replaces: claude -p --agent X "prompt"
# With: smart_exec X "prompt" (auto-routes model + picks best backend)
smart_exec() {
  local task_type="${1:-code-generation}"
  local prompt="${2:-}"
  local agent_flag=""
  local tools_flag=""
  local timeout_val=""
  local model_override=""
  shift 2 || true
  while [ $# -gt 0 ]; do
    case "$1" in
      --agent) agent_flag="$2"; shift 2 ;;
      --tools) tools_flag="$2"; shift 2 ;;
      --timeout) timeout_val="$2"; shift 2 ;;
      --model) model_override="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

# Resolve model: explicit override or auto-route
local route tier model cost reason
if [ -n "$model_override" ]; then
  model="$model_override"
  # Derive tier/cost from model name — no MODEL_COSTS lookup needed
  case "$model" in
    claude-opus*)  tier="critical"; cost="15.00"; reason="[explicit:critical]" ;;
    claude-sonnet*) tier="high"; cost="3.00"; reason="[explicit:high]" ;;
    claude-haiku*) tier="low"; cost="0.80"; reason="[explicit:low]" ;;
    *)            tier="medium"; cost="3.00"; reason="[explicit:fallback]" ;;
  esac
else
  route=$(route_model "$task_type")
  tier="${route%% *}"
  route="${route#* }"
  model="${route%% *}"
  route="${route#* }"
  cost="${route%% *}"
  route="${route#* }"
  reason="$route"
fi

  log_info "Router[$tier]: $task_type -> $model (\$$cost/1M tok) $reason"

  # Build proxy env
  local proxy_env=""
  if [ -n "$HERMES_PROXY_URL" ]; then
    proxy_env="ANTHROPIC_BASE_URL=$HERMES_PROXY_URL ANTHROPIC_API_KEY=${HERMES_API_KEY:-}"
  fi

  # If Hermes is force-mode and available, use it
  if [ "$HERMES_ENABLED" = "force" ] && hermes_available; then
    hermes_exec "$task_type" "$prompt" "${timeout_val:-$HERMES_TIMEOUT}"
    return $?
  fi

  # Build command — always route through proxy env
  local cmd
  if [ -n "$agent_flag" ] && command -v claude >/dev/null 2>&1; then
    cmd=(env $proxy_env timeout "${timeout_val:-$HERMES_TIMEOUT}s" claude -p --agent "$agent_flag" --model "$model")
    [ -n "$tools_flag" ] && cmd+=(--allowedTools "$tools_flag")
    cmd+=("$prompt")
  elif command -v claude >/dev/null 2>&1; then
    cmd=(env $proxy_env timeout "${timeout_val:-$HERMES_TIMEOUT}s" claude -p --model "$model" "$prompt")
  else
    log_error "No claude CLI found"
    return 1
  fi

  "${cmd[@]}" 2>&1
}

# ── Parallel Execution (Fanout) ─────────────────────────────────────────────
# Usage: parallel_exec "name:task_type:prompt" ["name2:task_type2:prompt2" ...]
# Each task runs in its own subprocess with optimal model routing.
# Returns newline-separated JSON results.
parallel_exec() {
  if [ $# -eq 0 ]; then
    log_warn "parallel_exec: no tasks provided"
    return 1
  fi

  local tasks=("$@")
  local n=${#tasks[@]}
  local pids=()
  local tmpdir
  tmpdir=$(mktemp -d -t me-parallel-XXXXXX)
  local start_ts
  start_ts=$(date +%s)

  log_info "Parallel[auto]: spawning $n agents with model routing"

  for i in "${!tasks[@]}"; do
    local task="${tasks[$i]}"
    local name="${task%%:*}"
    local rest="${task#*:}"
    local task_type="${rest%%:*}"
    local prompt="${rest#*:}"

 # Route model BEFORE subshell — associative arrays don't survive fork
 local route
 route=$(route_model "$task_type")
 local tier="${route%% *}"
 route="${route#* }"
 local model="${route%% *}"
 route="${route#* }"
 local cost="${route%% *}"
 route="${route#* }"
 local reason="$route"

 # Subsafe logging
 log_info " [$i/$((n-1))] $name -> $tier | $model (\$$cost/1M) [pid=${pids[$i]}]"

 # Background worker — pass resolved model to avoid declare -A in subshell
 (
  local t0 t1 duration_s output rc=0
  t0=$(date +%s)

  # smart_exec with --model skips route_model re-lookup in subshell
  output=$(smart_exec "$task_type" "$prompt" --model "$model" --timeout 180 2>&1) || rc=$?

  t1=$(date +%s)
  duration_s=$((t1 - t0))

  python3 -c "
import json,sys
data = {
 'id': $i,
 'name': sys.argv[1],
 'task_type': sys.argv[2],
 'model': sys.argv[3],
 'tier': sys.argv[4],
 'cost_per_1M': sys.argv[5],
 'rc': $rc,
 'duration_s': $duration_s,
 'output': (sys.argv[6] or '')[:5000]
}
print(json.dumps(data, ensure_ascii=False))
" "$name" "$task_type" "$model" "$tier" "$cost" "$output" > "$tmpdir/result_$i.json" 2>/dev/null || \
   echo "{\"id\":$i,\"name\":\"$name\",\"rc\":$rc}" > "$tmpdir/result_$i.json"
 ) &
 log_info " [$i/$((n-1))] $name -> $tier | $model (\$$cost/1M) [pid=${pids[$i]}]"
 pids+=($!)
done

  # Wait for all
  local all_rc=0
  for pid in "${pids[@]}"; do
    wait "$pid" || all_rc=1
  done

  local total_duration=$(( $(date +%s) - start_ts ))

  # Collect results
  local results="[]"
  for i in $(seq 0 $((n - 1))); do
    if [ -f "$tmpdir/result_$i.json" ]; then
      local r
      r=$(cat "$tmpdir/result_$i.json")
      results=$(python3 -c "
import json,sys
r=json.loads(sys.argv[1])
arr=json.loads(sys.argv[2])
arr.append(r)
print(json.dumps(arr, ensure_ascii=False))
" "$r" "$results" 2>/dev/null || echo "$results")
    fi
  done

  rm -rf "$tmpdir"
  log_info "Parallel[auto]: $n tasks completed in ${total_duration}s (rc=$all_rc)"

  echo "$results"
  return $all_rc
}

# ── Sequential Pipeline (ordered steps, each with optimal model) ────────────
# Usage: pipeline_exec "name:task_type:prompt" ["name2:task_type2:prompt2" ...]
pipeline_exec() {
  if [ $# -eq 0 ]; then
    return 0
  fi

  local steps=("$@")
  local n=${#steps[@]}
  local results="[]"
  local start_ts
  start_ts=$(date +%s)

  log_info "Pipeline[auto]: $n sequential steps with model routing"

  for i in "${!steps[@]}"; do
    local step="${steps[$i]}"
    local name="${step%%:*}"
    local rest="${step#*:}"
    local task_type="${rest%%:*}"
    local prompt="${rest#*:}"

    log_info "  [$((i+1))/$n] $name (type=$task_type)"

    local t0 t1 duration_s output rc=0
    t0=$(date +%s)

    output=$(smart_exec "$task_type" "$prompt" --timeout 180 2>&1) || rc=$?

    t1=$(date +%s)
    duration_s=$((t1 - t0))

    # Get model info for this step
    local route
    route=$(route_model "$task_type")
    local tier="${route%% *}"
    route="${route#* }"
    local model="${route%% *}"
    route="${route#* }"
    local cost="${route%% *}"

    results=$(python3 -c "
import json,sys
r = {
  'id': $i,
  'name': sys.argv[1],
  'task_type': sys.argv[2],
  'model': sys.argv[3],
  'tier': sys.argv[4],
  'cost_per_1M': sys.argv[5],
  'rc': $rc,
  'duration_s': $duration_s
}
arr = json.loads(sys.stdin.read())
arr.append(r)
print(json.dumps(arr))
" "$name" "$task_type" "$model" "$tier" "$cost" <<< "$results" 2>/dev/null)

    log_info "  [$((i+1))/$n] ✓ $name in ${duration_s}s (rc=$rc) → $model"
  done

  local total_duration=$(( $(date +%s) - start_ts ))
  log_info "Pipeline[auto]: $n steps completed in ${total_duration}s"

  echo "$results"
}

# ── Cost Estimator ──────────────────────────────────────────────────────────
estimate_cost() {
  local task_type="${1:-code-generation}"
  local est_tokens="${2:-50000}"

  local route
  route=$(route_model "$task_type")
  local cost="${route##* }"
  python3 -c "print(f'\${float(\"$cost\") * float(\"$est_tokens\") / 1000000:.4f}')" 2>/dev/null || echo "~$cost"
}

# ── Model Report ────────────────────────────────────────────────────────────
model_report() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════╗"
  echo "║           MEKONG MODEL ROUTER — Allowed Models & Matrix           ║"
  echo "╠══════════════════════════════════════════════════════════════════════╣"
  printf "║ %-20s │ %-14s │ %-9s │ %-9s ║\n" "Model" "Tier" "\$/1M tok" "Use For"
  echo "╠══════════════════════════════════════════════════════════════════════╣"
  printf "║ %-20s │ %-14s │ \$%7.2f │ %-9s ║\n" "claude-opus-4-8"   "critical" "15.00" "CEO decisions"
  printf "║ %-20s │ %-14s │ \$%7.2f │ %-9s ║\n" "claude-opus-4-7"   "critical" "15.00" "Strategy"
  printf "║ %-20s │ %-14s │ \$%7.2f │ %-9s ║\n" "claude-opus-4-6"   "critical" "15.00" "Reasoning"
  printf "║ %-20s │ %-14s │ \$%7.2f │ %-9s ║\n" "claude-sonnet-4-6" "high/med"  "3.00" "Main workhorse"
  printf "║ %-20s │ %-14s │ \$%7.2f │ %-9s ║\n" "claude-haiku-4-5"  "low"       "0.80" "Cheap/fast"
  echo "╚══════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "── Task → Model Routing ───────────────────────────────────────────────"
  printf "  %-24s │ %-14s │ %-20s │ %s\n" "Task Type" "Tier" "Model" "Reason"
  printf "  %-24s │ %-14s │ %-20s │ %s\n" "------------------------" "--------------" "--------------------" "-------------------"

  local sorted_keys
  sorted_keys=$(printf '%s\n' "${!TASK_REGISTRY[@]}" | sort)
  for key in $sorted_keys; do
    local entry="${TASK_REGISTRY[$key]}"
    local tier="${entry%%|*}"
    local rest="${entry#*|}"
    local model="${rest%%|*}"
    rest="${rest#*|}"
    local reason="$rest"
    local cost="${MODEL_COSTS[$model]:-3.00}"
    printf "  %-24s │ %-14s │ %-20s │ %s\n" "$key" "$tier" "$model (\$$cost/1M)" "$reason"
  done

  echo ""
  echo "── Infrastructure ────────────────────────────────────────────────────"
  echo "  Hermes Agent:    $(hermes_available && echo '✓ INSTALLED' || echo '✗ NOT FOUND')"
  echo "  Hermes mode:     $HERMES_ENABLED"
  echo "  Proxy base_url:  $HERMES_PROXY_URL"
  echo "  Provider label:  $HERMES_PROVIDER_LABEL"
  echo "  Claude CLI:      $(command -v claude >/dev/null 2>&1 && echo '✓ FOUND' || echo '✗ NOT FOUND')"
  echo ""
  echo "── Env Vars ──────────────────────────────────────────────────────────"
  echo "  HERMES_BIN=<path>              Path to hermes binary"
  echo "  HERMES_ENABLED=auto|force|disable"
  echo "  HERMES_TIMEOUT=120             Timeout per task (seconds)"
  echo "  HERMES_PROXY_URL=<url>         API proxy base URL (default: claude.zunef.com)"
  echo "  HERMES_API_KEY=<key>           API key for proxy"
  echo "  HERMES_PROVIDER_LABEL=anthropic"
  echo ""
  echo "── Usage in me-deep-wrapper ─────────────────────────────────────────"
  echo "  me role forge <slug> --parallel  # Parallel fanout forge"
  echo "  me role blueprint <slug>         # Auto-routes to architect"
  echo "  me role sell <slug>              # Auto-routes to business-analyst"
  echo "  me model report                  # Show this matrix"
  echo "  me model route <task_type>       # Route a specific task"
  echo ""
}

# ── Logging helpers ─────────────────────────────────────────────────────────
log_debug() {
  [ "${DEBUG:-0}" = "1" ] && echo -e "\033[2m[router] $*\033[0m" >&2 || true
}

# ── Init ────────────────────────────────────────────────────────────────────
if [ "${BASH_SOURCE[0]}" != "$0" ]; then
  log_debug "model-router.sh loaded — ${#TASK_REGISTRY[@]} task types, ${#ALLOWED_MODELS[@]} allowed models"
  log_debug "Allowed: claude-opus-4-8, claude-opus-4-7, claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5"
  log_debug "Proxy: $HERMES_PROXY_URL"
  log_debug "Hermes: $(hermes_available && echo 'available' || echo 'unavailable')"
fi

export -f route_model hermes_exec hermes_available smart_exec
export -f parallel_exec pipeline_exec estimate_cost model_report
export TASK_REGISTRY ALLOWED_MODELS MODEL_COSTS
export HERMES_BIN HERMES_ENABLED HERMES_TIMEOUT
export HERMES_PROXY_URL HERMES_API_KEY HERMES_PROVIDER_LABEL
