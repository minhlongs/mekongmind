#!/usr/bin/env bash
# ╔═══════════════════════════════════════════════════════════════╗
# ║  OPUS RAM GUARD v2.0 — M1 Pro 16GB Stability Shield         ║
# ║  Balanced RAM/SSD Protection for Antigravity + Claude Code   ║
# ╚═══════════════════════════════════════════════════════════════╝
#
# 3 Phases: Pre-flight → Live Monitor → Cleanup
# Prevents crash by graduated response: warn → purge → pause → kill
#
# Usage: ./opus-ram-guard.sh [--dry-run] [command]
#   Default command: claude (Claude Code CLI)
#   Example: ./opus-ram-guard.sh "claude --model opus"
#   Dry-run: ./opus-ram-guard.sh --dry-run

set -euo pipefail

# ──────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────
TOTAL_RAM_GB=16
MIN_FREE_GB_PREFLIGHT=3       # Minimum free RAM before launch
WARN_FREE_MB=3072             # 3GB — yellow warning
DANGER_FREE_MB=2048           # 2GB — red alert, aggressive purge
CRITICAL_FREE_MB=1536         # 1.5GB — SIGSTOP Claude temporarily
SWAP_WARN_MB=500              # Swap threshold for alert
SWAP_DANGER_MB=2048           # 2GB swap — kill Chrome renderers
SSD_LOW_GB=10                 # SSD < 10GB — clear caches
SSD_CRITICAL_GB=3             # SSD < 3GB — emergency cleanup
MONITOR_INTERVAL=15           # Check every 15 seconds
PAUSE_DURATION=30             # SIGSTOP duration in seconds
DRY_RUN=false                 # --dry-run mode

LOG_FILE="/tmp/opus-ram-guard.log"
MONITOR_PID=""
CLAUDE_PID=""
CODEX_PIDS=""
SPOTLIGHT_WAS_ON=true
SESSION_START=""
# Parse args
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true; shift ;;
  esac
done
TARGET_CMD="${1:-claude}"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ──────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────
log() {
  local msg="[$(date '+%H:%M:%S')] $1"
  echo -e "$msg" | tee -a "$LOG_FILE"
}

get_free_ram_mb() {
  # Available RAM = free + inactive + purgeable + speculative
  # macOS reclaims inactive pages under memory pressure, so they count as available
  local page_size=16384
  local stats
  stats=$(vm_stat 2>/dev/null)

  local free=$(echo "$stats" | awk '/Pages free/ {gsub(/\./,"",$3); print $3}')
  local inactive=$(echo "$stats" | awk '/Pages inactive/ {gsub(/\./,"",$3); print $3}')
  local purgeable=$(echo "$stats" | awk '/Pages purgeable/ {gsub(/\./,"",$3); print $3}')
  local speculative=$(echo "$stats" | awk '/Pages speculative/ {gsub(/\./,"",$3); print $3}')

  free=${free:-0}
  inactive=${inactive:-0}
  purgeable=${purgeable:-0}
  speculative=${speculative:-0}

  local total_pages=$((free + inactive + purgeable + speculative))
  local total_bytes=$((total_pages * page_size))
  echo $((total_bytes / 1024 / 1024))
}

get_ssd_free_gb() {
  df -g / 2>/dev/null | tail -1 | awk '{print $4}'
}

do_action() {
  # Execute or simulate based on --dry-run
  local desc="$1"
  local cmd="$2"
  if $DRY_RUN; then
    log "🔹 [DRY-RUN] Would: $desc"
  else
    log "⚡ $desc"
    eval "$cmd"
  fi
}

get_swap_mb() {
  local swap_info
  swap_info=$(sysctl vm.swapusage 2>/dev/null)
  echo "$swap_info" | grep -oE 'used = [0-9.]+M' | grep -oE '[0-9.]+' | head -1 || echo "0"
}

do_purge() {
  # Try sudo purge first (if NOPASSWD configured), otherwise skip
  if sudo -n purge 2>/dev/null; then
    return 0
  else
    # Fallback: just let macOS handle it naturally
    log "(purge skipped — no sudo NOPASSWD. Tip: add 'user ALL=(ALL) NOPASSWD: /usr/sbin/purge' to sudoers)"
    return 0
  fi
}

get_memory_pressure() {
  memory_pressure 2>/dev/null | grep "System-wide" | awk '{print $NF}'
}

# ──────────────────────────────────────────────────
# PHASE 1: PRE-FLIGHT CHECK
# ──────────────────────────────────────────────────
preflight() {
  echo -e "${CYAN}${BOLD}"
  echo "╔═════════════════════════════════════════════╗"
  echo "║  🛡️  OPUS RAM GUARD v2.0 — Pre-flight     ║"
  echo "║  Mode: $($DRY_RUN && echo 'DRY-RUN 🔹' || echo 'LIVE ⚡')                          ║"
  echo "╚═════════════════════════════════════════════╝"
  echo -e "${NC}"

  SESSION_START=$(date '+%Y-%m-%d %H:%M:%S')
  log "━━━ SESSION START: $SESSION_START ━━━"
  log "Target command: $TARGET_CMD"
  log "Machine: M1 Pro ${TOTAL_RAM_GB}GB"

  local free_mb
  free_mb=$(get_free_ram_mb)
  local swap_mb
  swap_mb=$(get_swap_mb)
  local pressure
  pressure=$(get_memory_pressure)

  log "Pre-flight: ${free_mb}MB free, ${swap_mb}MB swap, pressure: ${pressure}"

  local min_free_mb=$((MIN_FREE_GB_PREFLIGHT * 1024))

  if [[ $free_mb -lt $min_free_mb ]]; then
    log "${YELLOW}⚠ RAM thấp (${free_mb}MB < ${min_free_mb}MB) — đang dọn...${NC}"

    # Kill non-essential apps
    kill_non_essential "preflight"

    # Purge memory
    log "Purging memory..."
    do_purge
    sleep 2

    free_mb=$(get_free_ram_mb)
    log "Sau dọn: ${free_mb}MB free"

    if [[ $free_mb -lt $min_free_mb ]]; then
      echo -e "${RED}⛔ Không đủ RAM (${free_mb}MB). Cần tối thiểu ${min_free_mb}MB.${NC}"
      echo -e "${YELLOW}Gợi ý: Đóng bớt app, hoặc restart máy.${NC}"
      log "ABORT: Insufficient RAM after cleanup"
      return 1
    fi
  fi

  # Tắt Spotlight indexing (giảm I/O + RAM)
  if mdutil -s / 2>/dev/null | grep -q "Indexing enabled"; then
    SPOTLIGHT_WAS_ON=true
    log "Tắt Spotlight indexing tạm..."
    sudo -n mdutil -a -i off 2>/dev/null || true
  else
    SPOTLIGHT_WAS_ON=false
  fi

  echo -e "${GREEN}✅ Pre-flight OK: ${free_mb}MB free, ready to launch${NC}"
  log "Pre-flight PASSED"
  return 0
}

# ──────────────────────────────────────────────────
# NON-ESSENTIAL PROCESS KILLER
# ──────────────────────────────────────────────────
kill_non_essential() {
  local phase="${1:-monitor}"
  local killed=0

  # Level 1: Always safe to kill
  local level1_apps=("Weather" "Stocks" "News" "Maps" "TV" "Music" "Podcasts" "FaceTime" "Photo Booth")
  for app in "${level1_apps[@]}"; do
    if pgrep -x "$app" > /dev/null 2>&1; then
      killall "$app" 2>/dev/null && ((killed++)) || true
      log "Killed: $app ($phase)"
    fi
  done

  # Level 2: If danger level
  if [[ "$phase" == "danger" || "$phase" == "critical" ]]; then
    local level2_apps=("Notes" "Reminders" "Calendar" "Preview" "TextEdit")
    for app in "${level2_apps[@]}"; do
      if pgrep -x "$app" > /dev/null 2>&1; then
        killall "$app" 2>/dev/null && ((killed++)) || true
        log "Killed: $app ($phase)"
      fi
    done
  fi

  # Level 3: Critical — kill heavier stuff
  if [[ "$phase" == "critical" ]]; then
    # Kill Safari if running (often huge RAM)
    if pgrep -x "Safari" > /dev/null 2>&1; then
      killall "Safari" 2>/dev/null && ((killed++)) || true
      log "Killed: Safari ($phase)"
    fi
    # Finder restart (releases RAM)
    killall "Finder" 2>/dev/null || true
    log "Restarted: Finder ($phase)"
  fi

  [[ $killed -gt 0 ]] && log "Dọn $killed apps ($phase)"
}

# ──────────────────────────────────────────────────
# CODEX PROCESS DETECTION
# ──────────────────────────────────────────────────
get_codex_pids() {
  pgrep -f '@openai/codex' 2>/dev/null || true
}

codex_sigstop() {
  local pids
  pids=$(get_codex_pids)
  [[ -z "$pids" ]] && return
  for pid in $pids; do
    kill -STOP "$pid" 2>/dev/null || true
  done
  log "SIGSTOP ${pids//$'\n'/ } Codex process(es)"
}

codex_sigcont() {
  local pids
  pids=$(get_codex_pids)
  [[ -z "$pids" ]] && return
  for pid in $pids; do
    kill -CONT "$pid" 2>/dev/null || true
  done
  log "SIGCONT ${pids//$'\n'/ } Codex process(es)"
}

# ──────────────────────────────────────────────────
# PHASE 2: LIVE MONITOR (Background sidecar)
# ──────────────────────────────────────────────────
ram_monitor() {
  log "🔍 RAM Monitor started (PID $$, interval ${MONITOR_INTERVAL}s)"

  local pause_count=0
  local warn_count=0
  local max_pauses=5  # Sau 5 lần pause → suggest exit

  while true; do
    sleep "$MONITOR_INTERVAL"

    # Check if Claude still alive
    if [[ -n "$CLAUDE_PID" ]] && ! kill -0 "$CLAUDE_PID" 2>/dev/null; then
      log "Claude process ended (PID $CLAUDE_PID)"
      break
    fi

    local free_mb
    free_mb=$(get_free_ram_mb)
    local swap_mb
    swap_mb=$(get_swap_mb)

    # === CRITICAL: < 1.5GB ===
    if [[ $free_mb -lt $CRITICAL_FREE_MB ]]; then
      ((pause_count++))
      log "${RED}🔴 CRITICAL: ${free_mb}MB free — SIGSTOP Claude (lần $pause_count/$max_pauses)${NC}"

      # SIGSTOP Claude + Codex
      if [[ -n "$CLAUDE_PID" ]]; then
        kill -STOP "$CLAUDE_PID" 2>/dev/null || true
      fi
      codex_sigstop

      # Aggressive cleanup
      kill_non_essential "critical"
      do_purge
      sleep "$PAUSE_DURATION"

      # SIGCONT Claude + Codex
      if [[ -n "$CLAUDE_PID" ]]; then
        kill -CONT "$CLAUDE_PID" 2>/dev/null || true
      fi
      codex_sigcont

      free_mb=$(get_free_ram_mb)
      log "Sau pause+purge: ${free_mb}MB free"

      if [[ $pause_count -ge $max_pauses ]]; then
        log "${RED}⛔ Đã pause $max_pauses lần. Hệ thống quá tải. Khuyến nghị thoát.${NC}"
        echo -e "\n${RED}⛔ RAM GUARD: Đã pause Claude $max_pauses lần. Nên save work & thoát!${NC}\n"
      fi

    # === DANGER: < 2GB ===
    elif [[ $free_mb -lt $DANGER_FREE_MB ]]; then
      log "${RED}🟠 DANGER: ${free_mb}MB free — purging + killing non-essential${NC}"
      kill_non_essential "danger"
      do_purge

    # === WARNING: < 3GB ===
    elif [[ $free_mb -lt $WARN_FREE_MB ]]; then
      ((warn_count++))
      if [[ $((warn_count % 4)) -eq 1 ]]; then  # Log mỗi 4 warnings (tránh spam)
        log "${YELLOW}🟡 WARNING: ${free_mb}MB free — purging${NC}"
      fi
      do_purge
    fi

    # === SWAP CHECK ===
    if [[ -n "$swap_mb" ]] && (( $(echo "$swap_mb > $SWAP_DANGER_MB" | bc -l 2>/dev/null || echo 0) )); then
      log "${RED}🚨 HIGH SWAP: ${swap_mb}MB > ${SWAP_DANGER_MB}MB — killing Chrome renderers${NC}"
      do_action "Kill Chrome" 'killall "Google Chrome" "Google Chrome Helper" "Google Chrome Helper (Renderer)" 2>/dev/null || true'
    elif [[ -n "$swap_mb" ]] && (( $(echo "$swap_mb > $SWAP_WARN_MB" | bc -l 2>/dev/null || echo 0) )); then
      if (( warn_count % 4 == 0 )); then
        log "${YELLOW}💾 Swap rising: ${swap_mb}MB > ${SWAP_WARN_MB}MB${NC}"
      fi
      do_action "Purge (swap pressure)" "do_purge"
    fi

    # === SSD BALANCE CHECK (every 4 cycles ~1min) ===
    if (( (pause_count + warn_count) % 4 == 0 || pause_count + warn_count == 1 )); then
      local ssd_free
      ssd_free=$(get_ssd_free_gb)
      ssd_free=${ssd_free:-999}

      if (( ssd_free < SSD_CRITICAL_GB )); then
        log "${RED}🚨 CRITICAL SSD: ${ssd_free}GB < ${SSD_CRITICAL_GB}GB — EMERGENCY cleanup!${NC}"
        do_action "Clear Library caches" "rm -rf ~/Library/Caches/* 2>/dev/null || true"
        do_action "Clear npm cache" "rm -rf ~/.npm/_cacache ~/.cache/* 2>/dev/null || true"
        do_action "Clear Xcode derived data" "rm -rf ~/Library/Developer/Xcode/DerivedData 2>/dev/null || true"
        do_action "Clear logs" "rm -rf ~/Library/Logs/* 2>/dev/null || true"
        do_action "Clear pip cache" "rm -rf ~/Library/Caches/pip 2>/dev/null || true"
        local ssd_after=$(get_ssd_free_gb)
        log "SSD recovered: ${ssd_free}GB → ${ssd_after}GB"
      elif (( ssd_free < SSD_LOW_GB )); then
        log "${YELLOW}⚠️ SSD low: ${ssd_free}GB < ${SSD_LOW_GB}GB — clearing caches${NC}"
        do_action "Clear Library caches" "rm -rf ~/Library/Caches/* 2>/dev/null || true"
        do_action "Clear npm cache" "rm -rf ~/.npm/_cacache 2>/dev/null || true"
      fi
    fi
  done

  log "🔍 RAM Monitor stopped"
}

# ──────────────────────────────────────────────────
# PHASE 3: CLEANUP
# ──────────────────────────────────────────────────
cleanup() {
  log "🧹 Cleanup started..."

  # Kill monitor if still running
  if [[ -n "$MONITOR_PID" ]] && kill -0 "$MONITOR_PID" 2>/dev/null; then
    kill "$MONITOR_PID" 2>/dev/null || true
    wait "$MONITOR_PID" 2>/dev/null || true
  fi

  # Re-enable Spotlight
  if [[ "$SPOTLIGHT_WAS_ON" == "true" ]]; then
    log "Re-enabling Spotlight indexing..."
    sudo -n mdutil -a -i on 2>/dev/null || true
  fi

  # Session summary
  local end_time
  end_time=$(date '+%Y-%m-%d %H:%M:%S')
  local free_mb
  free_mb=$(get_free_ram_mb)
  local swap_mb
  swap_mb=$(get_swap_mb)

  echo ""
  echo -e "${CYAN}${BOLD}"
  echo "╔═════════════════════════════════════════════╗"
  echo "║  📊 SESSION SUMMARY                        ║"
  echo "╠═════════════════════════════════════════════╣"
  echo -e "║  Start:  $SESSION_START"
  echo -e "║  End:    $end_time"
  echo -e "║  RAM:    ${free_mb}MB free"
  echo -e "║  Swap:   ${swap_mb}MB used"
  echo -e "║  Log:    $LOG_FILE"
  echo "╚═════════════════════════════════════════════╝"
  echo -e "${NC}"

  log "━━━ SESSION END: $end_time ━━━"
  log "Final: ${free_mb}MB free, ${swap_mb}MB swap"
  log ""
}

# ──────────────────────────────────────────────────
# SIGNAL HANDLERS
# ──────────────────────────────────────────────────
trap cleanup EXIT
trap 'echo -e "\n${YELLOW}Interrupted — cleaning up...${NC}"; exit 130' INT TERM

# ──────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────
main() {
  # Phase 1: Pre-flight
  if ! preflight; then
    exit 1
  fi

  echo -e "${GREEN}🚀 Launching: ${TARGET_CMD}${NC}"
  log "Launching: $TARGET_CMD"

  # Phase 2: Start Claude + Monitor
  # Launch target command in foreground-like mode
  eval "$TARGET_CMD" &
  CLAUDE_PID=$!
  log "Claude PID: $CLAUDE_PID"

  # Start RAM monitor in background
  ram_monitor &
  MONITOR_PID=$!
  log "Monitor PID: $MONITOR_PID"

  # Wait for Claude to finish
  wait "$CLAUDE_PID" 2>/dev/null || true
  CLAUDE_PID=""

  # Phase 3: Cleanup (handled by trap EXIT)
}

main "$@"
