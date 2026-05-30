#!/usr/bin/env bash

# run-claude-hybrid.sh
# Wraps Claude Code CLI with local routing heuristics before starting execution.

set -e

if [ $# -eq 0 ]; then
  echo "Usage: $0 \"<task_description>\""
  exit 1
fi

TASK="$1"

# Heuristic router regex matches tasks indicating deep planning or migrations
if [[ "$TASK" =~ (refactor|architecture|design|rewrite|migrate|security) ]]; then
  echo "[Router] Reasoning task detected. Routing to Claude Cloud..."
  unset ANTHROPIC_BASE_URL
  export ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
else
  echo "[Router] Simple execution task detected. Routing to Local llama.cpp (Qwen)..."
  export ANTHROPIC_BASE_URL="http://localhost:8080/v1"
  export ANTHROPIC_MODEL="Qwen3.6-35B-A3B"
fi

export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

echo "[Router] Executing task via Claude Code..."
claude "$TASK"
