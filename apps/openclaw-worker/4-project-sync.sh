#!/usr/bin/env bash
# 4-project sync — pull latest, check dependencies, report diffs
set -euo pipefail

PROJECTS=("algo-trader" "sophia-ai-factory" "wellnexus" "openclaw")
BASEDIR="$HOME/projects"
LOGFILE="$HOME/.openclaw/logs/sync.log"

mkdir -p "$HOME/.openclaw/logs"

sync_all() {
  echo "🔄 Syncing all projects..." | tee -a "$LOGFILE"
  
  for p in "${PROJECTS[@]}"; do
    if [ -d "$BASEDIR/$p" ]; then
      cd "$BASEDIR/$p" && git rev-parse --git-dir &>/dev/null && {
        echo "📥 $p: pulling..." | tee -a "$LOGFILE"
        git pull 2>&1 | tail -3 | tee -a "$LOGFILE" || true
        
        # Check for uncommitted changes
        if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
          echo "   ⚠️  Has uncommitted changes:" | tee -a "$LOGFILE"
          git status --short 2>/dev/null | head -5 | tee -a "$LOGFILE"
        else
          echo "   ✅ Clean working tree" | tee -a "$LOGFILE"
        fi
        
        # Check for diverged branches
        if [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u} 2>/dev/null)" ]; then
          echo "   ⚠️  Diverged from remote" | tee -a "$LOGFILE"
        fi
      } || {
        echo "   ℹ️  Not a git repo (or pull failed)" | tee -a "$LOGFILE"
      }
    else
      echo "   ❌ $p not found" | tee -a "$LOGFILE"
    fi
    echo "" >> "$LOGFILE"
  done
  
  echo "✅ Sync complete: $(date)" >> "$LOGFILE"
}

diff_projects() {
  echo "📊 Project diff comparison:"
  
   # Get last commit hashes for each project
  declare -A HASHES
  for p in "${PROJECTS[@]}"; do
    if [ -d "$BASEDIR/$p" ]; then
      cd "$BASEDIR/$p" && git log -1 --oneline &>/dev/null && {
        HASHES[$p]=$(git rev-parse HEAD)
      } || HASHES[$p]="N/A"
    else
      HASHES[$p]="MISSING"
    fi
  done
  
  echo "   Last commits:"
  for p in "${PROJECTS[@]}"; do
     printf "   %-25s %s\n" "$p" "${HASHES[$p]}"
  done
}

case "${1:-sync}" in
  sync)   sync_all ;;
  diff)   diff_projects ;;
  help|--help|-h)
    echo "Usage: $0 {sync|diff|status}"
     ;;
esac
