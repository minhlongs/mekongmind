#!/bin/bash
# hermes-launch.sh — Provider-Agnostic Launcher for MEKONG + Hermes
#
# Switches context between "ceo" (MEKONG) and "coder" (Hermes) modes.
# Model/provider selection delegated to lib/model-router.sh.
# Priority chain: ollama-local → mlx-lm-local → llama.cpp-metal-local → cloud-max-explicit
#
# Env overrides:
#   MEKONG_PROVIDER    Force a specific provider
#   MEKONG_MODEL       Override default model
#   MEKONG_MODEL_ROLE  installed_model_policy role (default: primary-reasoning)

set -uo pipefail
export HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"

WRAPPER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$WRAPPER_DIR/.." 2>/dev/null && pwd)"
MODEL_ROUTER="$PROJECT_ROOT/lib/model-router.sh"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log_info()  { echo -e "${BLUE}[hermes-launch]${RESET} $*"; }
log_ok()    { echo -e "${GREEN}[hermes-launch]✓${RESET} $*"; }
log_warn()  { echo -e "${YELLOW}[hermes-launch]⚠${RESET} $*" >&2; }
log_error() { echo -e "${RED}[hermes-launch]✗${RESET} $*" >&2; }

# ── Provider resolution ───────────────────────────────────────────────────────
resolve_selection() {
    if [ ! -x "$MODEL_ROUTER" ]; then
        log_error "model-router.sh not found at $MODEL_ROUTER"
        return 1
    fi
    "$MODEL_ROUTER" detect
}

# ── Status ────────────────────────────────────────────────────────────────────
show_status() {
    echo "=== Unified LLM Runtime Status ==="
    echo ""

    # Delegate to model-router for comprehensive status
    if [ -x "$MODEL_ROUTER" ]; then
        "$MODEL_ROUTER" status
        return $?
    fi

    # Fallback: basic Ollama-only check
    local OLLAMA_API="${OLLAMA_BASE_URL:-http://127.0.0.1:11434/v1}"
    if curl -sf --max-time 3 "$OLLAMA_API/tags" >/dev/null 2>&1; then
        echo "✓ Ollama running at $OLLAMA_API"
        curl -sf "$OLLAMA_API/tags" | python3 -c "
import sys, json
data=json.load(sys.stdin)
for m in data.get('models',[]): print(f'  - {m.get(\"name\",\"?\")}')
" 2>/dev/null || echo "  (no models)"
    else
        echo "✗ Ollama NOT reachable at $OLLAMA_API"
        echo "  Start with: ollama serve"
    fi

    echo ""
    echo "=== MEKONG Wrapper Config ==="
    echo " Model: ${MEKONG_MODEL:-qwen3.6:35b-cc-65k}"
    echo " Project Root: $PROJECT_ROOT"

    if [ -f "$HERMES_HOME/config.yaml" ]; then
        local h_model h_provider h_base
        h_model=$(grep '^  default:' "$HERMES_HOME/config.yaml" 2>/dev/null | head -1 | sed 's/.*default://' | tr -d ' ')
        h_provider=$(grep '^  provider:' "$HERMES_HOME/config.yaml" 2>/dev/null | head -1 | sed 's/.*provider://' | tr -d ' ')
        h_base=$(grep '^  base_url:' "$HERMES_HOME/config.yaml" 2>/dev/null | head -1 | sed 's/.*base_url://' | tr -d ' ')
        echo " Hermes Model:    ${h_model:-unknown}"
        echo " Hermes Provider: ${h_provider:-none}"
        echo " Hermes Base URL: ${h_base:-none}"
    else
        echo " ✗ No config at $HERMES_HOME/config.yaml"
    fi

    if [ -f "$PROJECT_ROOT/lib/hermes-bridge.sh" ]; then
        echo ""
        echo "✓ MEKONG-Hermes Bridge Script: Active"
    else
        echo ""
        echo "✗ MEKONG-Hermes Bridge Script: Not found (run me hermes setup)"
    fi

    if [ -f "$HERMES_HOME/skills/mekongmind/SKILL.md" ]; then
        echo "✓ Hermes MEKONG Mind Skill: Active"
    else
        echo "✗ Hermes MEKONG Mind Skill: Not found (run me hermes setup)"
    fi

    echo ""
}

# ── Launch Hermes ─────────────────────────────────────────────────────────────
launch_hermes_with_context() {
    local goal_file="${1:-}"

    # Resolve provider/model
    local selection
    selection="$(resolve_selection)" || {
        log_error "No provider available. Run: $0 start"
        return 1
    }

    local provider="${selection%%|*}"
    local model="${selection#*|}"
    model="${model%%|*}"
    local base_url="${selection##*|}"

    log_info "Provider: ${CYAN}$provider${RESET}"
    log_info "Model:    ${CYAN}$model${RESET}"
    log_info "Base URL: $base_url"

    # Ensure provider is running
    "$MODEL_ROUTER" start "$provider" || {
        log_error "Failed to start provider: $provider"
        return 1
    }

    # Build shared context from active goal
    local shared_context=""
    if [ -n "$goal_file" ] && [ -f "$goal_file" ]; then
        shared_context="Active MEKONG Goal: $(cat "$goal_file")"
    else
        local latest_goal
        latest_goal=$(ls -t "$PROJECT_ROOT/state/goal-*.md" 2>/dev/null | head -1)
        if [ -n "$latest_goal" ] && [ -f "$latest_goal" ]; then
            shared_context="Active MEKONG Goal: $(cat "$latest_goal")"
        else
            shared_context="No active MEKONG goal found."
        fi
    fi

    log_info "Context: $shared_context"

    # Set env vars for hermes
    export HERMES_OLLAMA_MODEL="$model"
    export HERMES_MEKONG_CONTEXT="$shared_context"
    export MEKONG_ACTIVE_PROVIDER="$provider"
    export MEKONG_ACTIVE_MODEL="$model"

    # Launch Hermes in chat mode
    hermes -s mekongmind chat

    echo ""
    log_info "Hermes session exited. Returning to MEKONG."
}

# ── Mode switching ────────────────────────────────────────────────────────────
switch_mode() {
    local mode="${1:-}"

    case "$mode" in
        ceo|mekong)
            log_info "Switching to CEO Mode — MEKONG Wrapper active"
            echo "Use 'me <command>' for solo company operations."
            ;;
        coder|hermes)
            launch_hermes_with_context
            ;;
        status)
            show_status
            ;;
        start)
            "$MODEL_ROUTER" start "${2:-}"
            ;;
        config)
            "$MODEL_ROUTER" "${@:2}"
            ;;
        reset-cache)
            log_info "Resetting shared context cache..."
            "$MODEL_ROUTER" detect >/dev/null 2>&1 || true
            # Try to clear ollama context if available
            local api="${OLLAMA_BASE_URL:-http://127.0.0.1:11434/v1}"
            curl -sf --max-time 2 "$api/tags" >/dev/null 2>&1 && \
                curl -sf --request POST "$api/gc" >/dev/null 2>&1 && \
                echo "✓ Context cache cleared." || \
                echo "⚠ Could not clear cache (provider not running)."
            ;;
        *)
            cat <<EOF
${BOLD}hermes-launch.sh — Provider-Agnostic Hermes Launcher${RESET}

Usage: hermes-launch.sh <command> [args]

Commands:
  status      Show unified runtime status (all providers)
  start [p]   Start a provider (default: best available)
  coder       Launch Hermes with MEKONG state context
  ceo         Switch to CEO mode (MEKONG wrapper)
  config      Passthrough to model-router.sh
  reset-cache Clear context cache

Env vars:
  MEKONG_PROVIDER=<provider>     Force provider: ollama-local|mlx-lm-local|llama.cpp-metal-local|cloud-max-explicit
  MEKONG_MODEL=<model:tag>       Override model
  MEKONG_MODEL_ROLE=<role>       Policy role: primary-reasoning|coder-fast|coder-lite|local-critic

Examples:
  hermes-launch.sh status
  hermes-launch.sh start ollama-local
  MEKONG_MODEL=qwen3:1.7b hermes-launch.sh coder
  MEKONG_PROVIDER=mlx-lm-local hermes-launch.sh coder
EOF
            ;;
    esac
}

switch_mode "$@"
