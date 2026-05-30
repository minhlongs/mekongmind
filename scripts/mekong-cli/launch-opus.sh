#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# 🦞 launch-opus.sh — Opus 4.6 (1M context) Launcher
# ═══════════════════════════════════════════════════════════
# Launches Claude Opus directly in Antigravity terminal.
# Bypasses mekong-cli project settings (DashScope/Qwen)
# by running from ~/opus-workspace (clean directory).
#
# Usage (from Antigravity terminal):
#   bash ~/mekong-cli/scripts/launch-opus.sh
#   bash ~/mekong-cli/scripts/launch-opus.sh --resume
#
# Auth: Uses Claude Max OAuth (cashback.mentoring@gmail.com)
# ═══════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ──
OPUS_DIR="$HOME/opus-workspace"
MEKONG_DIR="$HOME/mekong-cli"
MODEL="claude-opus-4-6[1m]"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${CYAN}[opus]${NC} $1"; }
warn() { echo -e "${YELLOW}[opus]${NC} $1"; }
ok() { echo -e "${GREEN}[opus]${NC} $1"; }
err() { echo -e "${RED}[opus]${NC} $1"; }

# ── Setup workspace ──
if [ ! -d "$OPUS_DIR" ]; then
    log "Creating opus workspace at $OPUS_DIR..."
    mkdir -p "$OPUS_DIR/.claude"
fi

# Symlink commands & skills from mekong-cli (no settings.json!)
if [ -d "$MEKONG_DIR/.claude/commands" ]; then
    ln -sf "$MEKONG_DIR/.claude/commands" "$OPUS_DIR/.claude/commands" 2>/dev/null || true
    ok "Commands symlinked"
fi
if [ -d "$MEKONG_DIR/.claude/skills" ]; then
    ln -sf "$MEKONG_DIR/.claude/skills" "$OPUS_DIR/.claude/skills" 2>/dev/null || true
    ok "Skills symlinked"
fi

# Symlink CLAUDE.md for project context
if [ -f "$MEKONG_DIR/CLAUDE.md" ]; then
    ln -sf "$MEKONG_DIR/CLAUDE.md" "$OPUS_DIR/CLAUDE.md" 2>/dev/null || true
    ok "CLAUDE.md symlinked"
fi

# ── Ensure NO DashScope pollution ──
# Remove project settings.json if accidentally created
if [ -f "$OPUS_DIR/.claude/settings.json" ]; then
    warn "Removing DashScope settings from opus-workspace..."
    rm -f "$OPUS_DIR/.claude/settings.json"
fi

# Unset any DashScope env vars that could interfere
unset DASHSCOPE_API_KEY 2>/dev/null || true
unset LLM_BASE_URL 2>/dev/null || true
unset LLM_API_KEY 2>/dev/null || true
unset LLM_MODEL 2>/dev/null || true
unset ANTHROPIC_BASE_URL 2>/dev/null || true

# ── CRITICAL: Isolate from tmux completely ──
# Shell init loads tmux helpers → claude inherits TMUX env → crashes
unset TMUX 2>/dev/null || true
unset TMUX_PANE 2>/dev/null || true
unset TMUX_PLUGIN_MANAGER_PATH 2>/dev/null || true
export TERM=xterm-256color

# ── Find resume session ──
RESUME_FLAG=""
if [ "${1:-}" = "--resume" ] || [ "${1:-}" = "-r" ]; then
    SESSIONS_DIR="$HOME/.claude/projects/-Users-macbook-opus-workspace"
    if [ -d "$SESSIONS_DIR" ]; then
        LATEST=$(ls -t "$SESSIONS_DIR"/*.jsonl 2>/dev/null | head -1)
        if [ -n "$LATEST" ]; then
            SESSION_ID=$(basename "$LATEST" .jsonl)
            RESUME_FLAG="--resume $SESSION_ID"
            ok "Resuming session: $SESSION_ID"
        fi
    fi
    if [ -z "$RESUME_FLAG" ]; then
        warn "No session to resume, starting fresh"
    fi
fi

# ── Launch ──
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🦞 Opus 4.6 (1M) — Antigravity     ║${NC}"
echo -e "${GREEN}║  Auth: Claude Max OAuth              ║${NC}"
echo -e "${GREEN}║  Dir:  ~/opus-workspace (clean)      ║${NC}"
echo -e "${GREEN}║  Code: ~/mekong-cli (via abs paths)  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}TIP: Access mekong-cli files via absolute paths:${NC}"
echo -e "  Read /Users/macbook/mekong-cli/cto-daemon.sh"
echo -e "  Edit /Users/macbook/mekong-cli/scripts/..."
echo ""

cd "$OPUS_DIR"
exec claude --model "$MODEL" --dangerously-skip-permissions $RESUME_FLAG
