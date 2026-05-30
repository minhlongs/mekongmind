#!/usr/bin/env bash
# start-solo-ops.sh — Launch Solo Company Operations on M1 Max
#
# Usage:
#   bash scripts/start-solo-ops.sh          # Start all loops
#   bash scripts/start-solo-ops.sh --status # Check status
#   bash scripts/start-solo-ops.sh --stop   # Stop all loops
#
# Runs HeartbeatScheduler in a tmux session named "solo-ops".
# Similar to how AlgoTrade runs in its own tmux session.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SESSION_NAME="solo-ops"
PYTHON="${PROJECT_ROOT}/.venv/bin/python3"
LOG_DIR="${PROJECT_ROOT}/.mekong/logs"

# Fallback python if venv doesn't exist
if [ ! -f "$PYTHON" ]; then
    PYTHON="python3"
fi

mkdir -p "$LOG_DIR"

case "${1:-start}" in
    start)
        # Check if session already exists
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            echo "Solo ops already running in tmux session '$SESSION_NAME'"
            echo "Use: tmux attach -t $SESSION_NAME"
            exit 0
        fi

        echo "Starting Solo Company Operations..."
        echo "  Project: $PROJECT_ROOT"
        echo "  Session: $SESSION_NAME"
        echo "  Logs:    $LOG_DIR"

        # Create tmux session with heartbeat scheduler
        tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_ROOT" \
            "$PYTHON -m src.daemon 2>&1 | tee $LOG_DIR/heartbeat-\$(date +%Y%m%d).log"

        # Split pane for monitoring (optional)
        tmux split-window -t "$SESSION_NAME" -h -c "$PROJECT_ROOT" \
            "watch -n 30 'echo \"=== Solo Ops Monitor ===\"; echo; \
            echo \"LLM Health:\"; \
            curl -sf http://192.168.11.111:11436/v1/models 2>/dev/null | jq -r \".data[0].id\" || echo \"Nemotron: DOWN\"; \
            curl -sf http://192.168.11.111:11435/v1/models 2>/dev/null | jq -r \".data[0].id\" || echo \"DeepSeek: DOWN\"; \
            echo; \
            echo \"API Health:\"; \
            curl -sf https://api.agencyos.network/health 2>/dev/null | jq -r .status || echo \"Gateway: DOWN\"; \
            echo; \
            echo \"Last heartbeat:\"; \
            tail -3 $LOG_DIR/heartbeat-\$(date +%Y%m%d).log 2>/dev/null || echo \"No logs yet\"'"

        echo ""
        echo "Solo ops started! Attach with:"
        echo "  tmux attach -t $SESSION_NAME"
        ;;

    --status|status)
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            echo "Solo ops: RUNNING"
            echo ""
            echo "Recent logs:"
            tail -10 "$LOG_DIR/heartbeat-$(date +%Y%m%d).log" 2>/dev/null || echo "  No logs today"
        else
            echo "Solo ops: STOPPED"
        fi
        ;;

    --stop|stop)
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            tmux kill-session -t "$SESSION_NAME"
            echo "Solo ops stopped."
        else
            echo "Solo ops not running."
        fi
        ;;

    *)
        echo "Usage: $0 [start|--status|--stop]"
        exit 1
        ;;
esac
