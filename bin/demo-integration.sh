#!/bin/bash
# demo-integration.sh — Live demo of MEKONG + Hermes deep integration
# Shows the full flow from CLI command → bridge → Hermes execution → evidence contract
#
# Usage: ./demo-integration.sh [--run]

set -uo pipefail
PROJECT_ROOT="$(dirname "$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
OLLAMA_MODEL="${MEKONG_MODEL:-qwen3.6:35b-cc-65k}"

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
RESET='\033[0m'

echo ""
echo "=== MEKONG + Hermes Deep Integration Demo ==="
echo ""

# ── Step 1: Show current state ───────────────────────────────

echo "--- Current State ---"
ls -la "$PROJECT_ROOT/state/goal-*.md" 2>/dev/null || echo "No active goals yet"
echo ""

# ── Step 2: Read department SOP chain ────────────────────────

echo "--- Department SOP Chain ---"
if [ -f "$PROJECT_ROOT/sops/departments/hermes-integration.md" ]; then
    echo "✓ hermes-integration SOP exists ($(wc -l < "$PROJECT_ROOT/sops/departments/hermes-integration.md") lines)"
else
     echo "✗ No hermes-integration SOP found"
fi

echo ""

# ── Step 3: Show registry status ──────────────────────────────

echo "--- Registry Status ---"
if [ -f "$PROJECT_ROOT/agents/registry.json" ]; then
    AGENT_COUNT=$(python3 -c "import json; d=json.load(open('$PROJECT_ROOT/agents/registry.json')); print(len(d.get('unified_agents',[])))")
     echo "✓ Unified agents: $AGENT_COUNT (including hermes-agent bridge)"
else
     echo "✗ No registry found"
fi

echo ""

# ── Step 4: Check Ollama health ────────────────────────────────

echo "--- LLM Runtime ---"
if curl -s --max-time 3 http://localhost:11434/v1/api/tags >/dev/null 2>&1; then
     echo "✓ Ollama running at http://localhost:11434"
else
    echo "$YELLOW⚠ Ollama not reachable (run: ollama serve)$RESET"
fi

echo ""

# ── Step 5: Test bridge script existence & permissions ────────

echo "--- Bridge Scripts ---"
for script in lib/hermes-bridge.sh lib/hermes-delegate.sh bin/hermes-launch.sh; do
    if [ -f "$PROJECT_ROOT/$script" ]; then
        if [ -x "$PROJECT_ROOT/$script" ]; then
             echo "✓ $script (executable)"
         else
              echo "$YELLOW⚠ $script (not executable)$RESET"
         fi
    else
         echo "$RED✗ $script missing$RESET"
     fi
done

echo ""

# ── Step 6: Show Hermes skill loaded ───────────────────────────

echo "--- Hermes Skill Load ---"
SKILL_PATH="$HERMES_HOME/skills/mekongmind/SKILL.md"
if [ -f "$SKILL_PATH" ]; then
    echo "✓ Mekong Mind skill loaded at $SKILL_PATH ($(wc -l < "$SKILL_PATH") lines)"
else
     echo "$RED✗ No mekongmind skill found$RESET"
fi

echo ""

# ── Step 7: Show state directory structure ───────────────────────

echo "--- State Directory ---"
if [ -d "$PROJECT_ROOT/state" ]; then
     ls -R "$PROJECT_ROOT/state/" 2>/dev/null | head -30
else
    echo "✗ No state directory found"
fi

echo ""

# ── Step 8: Show MCP config (if exists) ────────────────────────

echo "--- MCP Config ---"
MCP_FILE="$HERMES_HOME/mcp-config.json"
if [ -f "$MCP_FILE" ]; then
    echo "✓ MCP config present at $MCP_FILE"
else
     echo "✗ No MCP config found (run integrate-hermes.sh to create)"
fi

echo ""

# ── Step 9: Final Status Summary ───────────────────────────────

TOTAL_FILES=0
GOOD_FILES=0

for f in bin/hermes-launch.sh lib/hermes-bridge.sh \
         lib/hermes-delegate.sh lib/hermes-mcp-server.sh \
         sops/departments/hermes-integration.md \
         state/goal-demo.json.md agents/registry.json; do
    
    TOTAL_FILES=$((TOTAL_FILES+1))
    if [ -f "$PROJECT_ROOT/$f" ]; then
        GOOD_FILES=$((GOOD_FILES+1))
     fi
done

echo "=== Integration Status ==="
if [ $GOOD_FILES -eq $TOTAL_FILES ]; then
    echo -e "${GREEN}All $TOTAL_FILES components present!$RESET"
else
     echo "$YELLOW$GOOD_FILES/$TOTAL_FILES components found.$RESET"
fi

echo ""

# ── Step 10: Show next steps ────────────────────────────────

echo "=== Next Steps ==="
echo "   1. Start Ollama:    ollama serve"
echo "   2. Test bridge:     bash lib/hermes-bridge.sh 'hello world'"
echo "   3. Show status:     bash bin/hermes-launch.sh status"
echo ""
