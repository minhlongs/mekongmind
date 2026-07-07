#!/bin/bash
# integrate-hermes.sh — One-command setup for full MEKONG + Hermes integration
# Creates all configs, symlinks, and bootstrap files needed.
#
# Usage: ./integrate-hermes.sh [--dry-run]

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
OLLAMA_MODEL="${MEKONG_MODEL:-qwen3.6:35b-cc-65k}"

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
    DRY_RUN=true
fi

log() { echo "=== integrate-hermes.sh ===" "$@"; }
exec_cmd() { if [ "$DRY_RUN" = false ]; then eval "$@"; else log "Would run: $@"; fi; }

log "Setting up MEKONG + Hermes deep integration..."
echo ""

# ── Step 1: Ensure Ollama is running ────────────────────────

if ! curl -s --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
    log "⚠ Ollama not detected. Start with: ollama serve"
    log "   Waiting for you to start it before continuing..."
    while ! curl -s --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; do
        sleep 5
    done
    log "✓ Ollama detected."
else
    log "✓ Ollama running at http://localhost:11434"
fi

# ── Step 2: Verify required files exist ─────────────────────

log "Checking integration files..."

declare -A FILES=(
    ["bin/hermes-launch.sh"]="Layer 1: Unified LLM Launcher"
    ["lib/hermes-bridge.sh"]="Layer 2: MEKONG → Hermes Bridge"
    ["lib/hermes-mcp-server.sh"]="Layer 3: MCP Server for state access"
)

for file in "${!FILES[@]}"; do
     path="$PROJECT_ROOT/$file"
    if [ -f "$path" ]; then
        log "✓ $file (${FILES[$file]})"
    else
         log "✗ $file MISSING — skipping this integration step"
    fi
done

echo ""

# ── Step 3: Make scripts executable ─────────────────────────

log "Setting permissions..."
chmod +x "$PROJECT_ROOT/bin/hermes-launch.sh" 2>/dev/null || true
chmod +x "$PROJECT_ROOT/lib/hermes-bridge.sh" 2>/dev/null || true
chmod +x "$PROJECT_ROOT/lib/hermes-mcp-server.sh" 2>/dev/null || true
log "✓ All scripts marked executable."

echo ""

# ── Step 4: Create MCP config for Hermes ────────────────────

MCP_CONFIG="$HERMES_HOME/mcp-config.json"

if [ -f "$MCP_CONFIG" ]; then
    log "ℹ MCP config already exists at $MCP_CONFIG (skipping)"
else
    if [ -f "$PROJECT_ROOT/lib/hermes-mcp-server.sh" ]; then
        cat > "$MCP_CONFIG" <<'EOF_MCP'
{
   "mcpServers": {
     "me-deep-wrapper": {
       "command": "/bin/bash",
       "args": ["/Users/macbook/Documents/me-deep-wrapper/lib/hermes-mcp-server.sh"],
       "env": {
         "PROJECT_ROOT": "/Users/macbook/Documents/me-deep-wrapper",
         "HERMES_HOME": "/Users/macbook/.hermes"
       },
       "tools": [
         {"name": "me_list_goals"},
         {"name": "me_read_goal"},
         {"name": "me_read_department_ledger"},
         {"name": "me_write_evidence"},
         {"name": "me_query_sop_chain"},
         {"name": "me_check_bottlenecks"},
         {"name": "me_update_department_state"}
       ]
     }
   }
}
EOF_MCP
        log "✓ Created MCP config at $MCP_CONFIG"
    fi
fi

echo ""

# ── Step 5: Create symlinks for easy access ────────────────

log "Creating convenience aliases..."

BASHRC="$HOME/.bashrc"
ZSHRC="$HOME/.zshrc"

ALIAS_ENTRY='
# MEKONG + Hermes Integration
alias me-launch="bash ~/Documents/me-deep-wrapper/bin/hermes-launch.sh"
alias me-bridge="bash ~/Documents/me-deep-wrapper/lib/hermes-bridge.sh"
alias me-state="cd ~/Documents/me-deep-wrapper/state && pwd && ls -la"
'

for rc_file in "$BASHRC" "$ZSHRC"; do
    if [ -f "$rc_file" ]; then
        if ! grep -q "me-launch" "$rc_file" 2>/dev/null; then
            echo "$ALIAS_ENTRY" >> "$rc_file"
            log "✓ Added aliases to $rc_file"
        fi
    else
        echo "$ALIAS_ENTRY" > "$rc_file"
        log "✗ Created new $rc_file with MEKONG aliases"
    fi
done

echo ""

# ── Step 6: Create state directories if needed ─────────────

log "Ensuring state directories exist..."
mkdir -p "$PROJECT_ROOT/state/departments"
mkdir -p "$PROJECT_ROOT/state/gates"
mkdir -p "$PROJECT_ROOT/state/revenue"
mkdir -p "$PROJECT_ROOT/state/products"
mkdir -p "$PROJECT_ROOT/sops/departments"
log "✓ State directories ready."

echo ""

# ── Step 7: Create integration test goal if none exists ───

GOAL_FILE="$PROJECT_ROOT/state/goal-integration-test.md"
if [ ! -f "$GOAL_FILE" ]; then
    cat > "$GOAL_FILE" <<'EOF_GOAL'
Status: active
Mode: integration-test
Department: engineering-factory, hermes-agent
Model: qwen3.6:35b-cc-65k
---
# Integration Test Goal

This goal validates the full MEKONG + Hermes deep integration pipeline.

## Departments Involved
- **engineering-factory**: Build a simple CLI tool (MEKONG responsibility)
- **hermes-agent**: Execute coding tasks via Hermes (bridge responsibility)
- **quality-compliance**: Validate output quality
- **sales-revenue**: Mock first revenue evidence

## Expected Flow
1. MEKONG creates goal state → `state/goal-integration-test.md`
2. Engineering-factory department processes SOP chain
3. When coding task arises, bridge to Hermes via `hermes-bridge.sh`
4. Hermes executes with ollama-launch model and returns evidence
5. Evidence contract validated against SOP requirements
6. Gate advances if all fields present

## Validation Checklist
- [ ] Ollama running on port 11434
- [ ] MEKONG wrapper accessible (`me <command>`)  
- [ ] Hermes agent accessible (`hermes chat -q "test"`)
- [ ] Bridge script functional (`lib/hermes-bridge.sh "hello world"`)
- [ ] State directories created under `state/`
EOF_GOAL

    log "✓ Created test goal file at $GOAL_FILE"
fi

echo ""

# ── Step 8: Summary & Next Steps ───────────────────────────

log "Integration setup complete!"
echo ""
cat <<'SUMMARY'

╔═══════════════════════════════════════════╗
║        Integration Ready!                  ║
╠═══════════════════════════════════════════╣
║                                               ║
║  MEKONG Wrapper:                            ║
║    - bin/me (main CLI)                   ║
║    - lib/hermes-bridge.sh            ║
║                                               ║
║  Hermes Integration:                           ║
║     - Skills loaded: mekongmind           ║
║     - MCP config: $HERMES_HOME/mcp-config.json               ║
║                                               ║
║  Next Steps:                               ║
║     1. Source your shell:                        ║
║            source ~/.bashrc (or ~/.zshrc)    ║
║                                               ║
║     2. Test MEKONG:                                ║
║            me goal show                         ║
║                                               ║
║     3. Test Bridge:                               ║
║            bash lib/hermes-bridge.sh "hello"   ║
║                                               ║
║     4. Check Status:                              ║
║            bash bin/hermes-launch.sh status    ║
║                                               ║
╚═══════════════════════════════════════════╝

SUMMARY
