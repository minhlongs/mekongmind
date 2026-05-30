#!/usr/bin/env bash
# 4-project dispatch — send missions to projects in parallel
set -euo pipefail

PROJECTS=("algo-trader" "sophia-ai-factory" "wellnexus" "openclaw")
BASEDIR="$HOME/projects"
LOGDIR="$HOME/.openclaw/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$LOGDIR"

dispatch_all() {
  local mission="${1:-default-mission}"
  echo "🚀 Dispatching: '$mission' to all ${#PROJECTS[@]} projects"
  echo "Timestamp: $TIMESTAMP" >> "$LOGDIR/missions.log"
  
   for p in "${PROJECTS[@]}"; do
    if [ -d "$BASEDIR/$p" ]; then
      TASKDIR="$BASEDIR/$p/tasks"
      mkdir -p "$TASKDIR"
      echo "[$mission] Mission: $mission" > "$TASKDIR/mission_${TIMESTAMP}_${p}.txt"
      echo "✅ Dispatched to $p"
    else
      echo "⚠️  Skipped $p (not found)"
    fi
  done
  
  echo "[$TIMESTAMP] Mission '$mission' dispatched to all ${#PROJECTS[@]} projects" >> "$LOGDIR/missions.log"
}

dispatch_one() {
  local target="${1:-}"
  local mission="${2:-default-mission}"
  
  if [ -z "$target" ]; then
    echo "❌ Usage: $0 <project> \"mission\""
    echo "   Projects: ${PROJECTS[*]}"
    return 1
  fi
  
  for p in "${PROJECTS[@]}"; do
    if [ "$p" = "$target" ]; then
      TASKDIR="$BASEDIR/$target/tasks"
      mkdir -p "$TASKDIR"
      echo "[$MISSION] Mission: $mission" > "$TASKDIR/mission_${TIMESTAMP}_${target}.txt"
      echo "✅ Dispatched '$mission' to $target"
      return 0
    fi
  done
  
  echo "❌ Project '$target' not found. Available: ${PROJECTS[*]}"
}

list_missions() {
  echo "=== Recent Missions ==="
  if [ -f "$LOGDIR/missions.log" ]; then
    tail -20 "$LOGDIR/missions.log"
  else
    echo "(no missions logged yet)"
  fi
  
  echo ""
  echo "=== Mission Files ==="
  for p in "${PROJECTS[@]}"; do
    TASKDIR="$BASEDIR/$p/tasks"
    if [ -d "$TASKDIR" ] && ls "$TASKDIR"/mission_*.txt &>/dev/null; then
      echo "--- $p ---"
      ls -la "$TASKDIR"/mission_*.txt 2>/dev/null | tail -5
    fi
  done
}

case "${1:-help}" in
  all)     dispatch_all "${2:-default-mission}" ;;
   *)       dispatch_one "$@" ;;
  list)    list_missions ;;
  help|--help|-h)
    echo "Usage: $0 {all|<project>} [mission]"
    echo ""
    echo "Commands:"
    echo "  all \"mission\"     — Dispatch mission to ALL projects"
    echo "  <project> \"mission\" — Dispatch to specific project"
    echo "  list              — Show recent missions"
    echo ""
    echo "Projects: ${PROJECTS[*]}"
    ;;
esac
