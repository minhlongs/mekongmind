#!/bin/bash
# model-orchestrator: Intelligent LLM auto-routing
set -euo pipefail
DIR="${MODEL_ORCHESTRATOR_DIR:-$(cd "$(dirname "$0")" && pwd)}"
DB_PATH="${MODEL_ORCHESTRATOR_DB:-$HOME/.model-orchestrator/logs.db}"

if [ $# -eq 0 ] && [ ! -t 0 ]; then
    exec "$DIR/router.py" --db "$DB_PATH" "$(cat)"
fi

exec "$DIR/router.py" --db "$DB_PATH" "$@"
