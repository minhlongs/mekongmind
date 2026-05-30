#!/usr/bin/env bash
# 4-project master — launches 4 panes (tmux) for parallel project monitoring
set -euo pipefail

PROJECTS=("algo-trader" "sophia-ai-factory" "wellnexus" "openclaw")
BASEDIR="$HOME/projects"
LOGDIR="$HOME/.openclaw/logs"
SESSION="4project-master"

mkdir -p "$LOGDIR"

start_master() {
  tmux new-session -d -s "$SESSION" -n "dashboard"
  
  # Pane 1: Dashboard (status overview)
  tmux split-window -t "$SESSION" -h
  tmux select-pane -t "$SESSION:0.0"
  tmux send-keys "echo '=== 4 Projects Status ==='; for p in ${PROJECTS[@]}; do echo \"--- \$p ---\"; [ -d \"$BASEDIR/\$p\" ] && echo 'OK' || echo 'MISSING'; done; watch -n 5 'for p in ${PROJECTS[@]}; do printf \"%-20s\" \"\$p:\"; [ -d \"$BASEDIR/\$p\" ] && ls \$BASEDIR/\$p | wc -l || echo 0; done'" Enter
  
  # Pane 2: algo-trader
  tmux split-window -t "$SESSION" -v
  tmux select-pane -t "$SESSION:0.1"
  tmux send-keys "cd $BASEDIR/algo-trader && echo '📊 Algo Trader' && ls -la | head -15" Enter
  
  # Pane 3: sophia-ai-factory
  tmux split-window -t "$SESSION" -v
  tmux select-pane -t "$SESSION:0.2"
  tmux send-keys "cd $BASEDIR/sophia-ai-factory && echo '🤖 Sophia AI Factory' && ls -la | head -15" Enter
  
  # Pane 4: wellnexus + openclaw (combined since wellnexus is a plan/app)
  tmux split-window -t "$SESSION" -v
  tmux select-pane -t "$SESSION:0.3"
  tmux send-keys "echo '🏥 WellNexus + OpenClaw'; [ -d '$BASEDIR/wellnexus' ] && cd $BASEDIR/wellnexus || echo 'wellnexus not found (plans in mekong-cli/apps/well/)'; ls -la | head -10; echo '---'; [ -d '$BASEDIR/openclaw' ] && cd $BASEDIR/openclaw && echo '🔧 OpenClaw' && ls -la | head -10" Enter
  
  tmux select-pane -t "$SESSION:0.0"
  echo "✅ Master session '$SESSION' started with 4 panes"
  echo "   Attach with: tmux attach-session -t $SESSION"
}

attach_master() {
  if tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux attach-session -t "$SESSION"
  else
    echo "❌ Session '$SESSION' not found. Run start first."
  fi
}

stop_master() {
  if tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux kill-session -t "$SESSION"
    echo "✅ Session '$SESSION' stopped"
  else
    echo "❌ Session '$SESSION' not found"
  fi
}

status_check() {
  echo "=== 4 Projects Status ==="
  for p in "${PROJECTS[@]}"; do
    if [ -d "$BASEDIR/$p" ]; then
      FILES=$(ls "$BASEDIR/$p" | wc -l | tr -d ' ')
      LAST_MOD=$(stat -f "%Sm" "$BASEDIR/$p" 2>/dev/null || echo "N/A")
      echo "✅ $p ($FILES files, last: $LAST_MOD)"
    else
      echo "❌ $p (MISSING)"
    fi
  done
}

case "${1:-start}" in
  start)   start_master ;;
  attach)  attach_master ;;
  stop)    stop_master ;;
  status)  status_check ;;
  *)       echo "Usage: $0 {start|attach|stop|status}" ;;
esac
