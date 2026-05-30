#!/usr/bin/env bash
# 4-project status — comprehensive health check
set -euo pipefail

PROJECTS=("algo-trader" "sophia-ai-factory" "wellnexus" "openclaw")
BASEDIR="$HOME/projects"

echo "╔══════════════════════════════════════════╗"
echo "║        4-Project Status Dashboard         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

for p in "${PROJECTS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📁 $p"
  
  if [ -d "$BASEDIR/$p" ]; then
    # Git info
    cd "$BASEDIR/$p" && git rev-parse --git-dir &>/dev/null && {
      BRANCH=$(git branch --show-current 2>/dev/null || echo "N/A")
      LATEST=$(git log -1 --oneline 2>/dev/null || echo "No commits")
      echo "   📊 Git: $BRANCH — $LATEST"
    }
    
    # Key files
    for f in README.md package.json requirements.txt Dockerfile Makefile; do
      [ -f "$BASEDIR/$p/$f" ] && echo "   ✅ $f"
    done
    
    # Size
    SIZE=$(du -sh "$BASEDIR/$p" 2>/dev/null | cut -f1)
    echo "   📦 Total: $SIZE"
    
    # Recent changes (last 5 commits)
    cd "$BASEDIR/$p" && git log --oneline -5 2>/dev/null && echo "" || true
    
  else
    echo "   ❌ Directory not found at $BASEDIR/$p"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary"
COUNT=0
for p in "${PROJECTS[@]}"; do
  [ -d "$BASEDIR/$p" ] && COUNT=$((COUNT+1))
done
echo "   $COUNT/${#PROJECTS[@]} projects active"

