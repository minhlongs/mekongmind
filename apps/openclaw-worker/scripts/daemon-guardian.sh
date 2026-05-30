#!/usr/bin/env bash
# daemon-guardian.sh v5 — Thermal-aware CTO daemon with PID singleton + Qwen keep-warm
# OpenClaw M1 Max Production Guardian

set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/sbin:/usr/bin:/bin:$PATH"

# --- Config ---
PID_FILE="/tmp/openclaw-guardian.pid"
WORKER_DIR="$HOME/mekong-cli/apps/openclaw-worker"
LOG="$HOME/tom_hum_guardian.log"
QWEN_MODEL="qwen3:32b"
OLLAMA_URL="http://localhost:11434"
SLEEP_COOL=30
SLEEP_WARM=60
SLEEP_HOT=120

# --- PID Singleton ---
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE" 2>/dev/null)
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "[$(date '+%H:%M:%S')] [guardian] Already running (PID $OLD_PID). Exiting." >> "$LOG"
    exit 0
  fi
  rm -f "$PID_FILE"
fi
echo $$ > "$PID_FILE"

cleanup() {
  rm -f "$PID_FILE"
  exit 0
}
trap cleanup EXIT INT TERM

log() {
  echo "[$(date '+%H:%M:%S')] [guardian] $1" >> "$LOG" 2>/dev/null
}

# --- Thermal Detection ---
# Returns: COOL (<70), WARM (70-85), HOT (>85)
# Uses pmset (no sudo) + load average as proxy
get_thermal_state() {
  # Method 1: pmset thermal warnings (most reliable without sudo)
  local therm_output
  therm_output=$(pmset -g therm 2>/dev/null || echo "")

  # If CPU speed limit reported, system is throttling
  local speed_limit
  speed_limit=$(echo "$therm_output" | grep -o 'CPU_Speed_Limit *= *[0-9]*' | grep -o '[0-9]*' || echo "100")
  speed_limit=${speed_limit:-100}

  if [ "$speed_limit" -lt 70 ]; then
    echo "HOT"
    return
  elif [ "$speed_limit" -lt 90 ]; then
    echo "WARM"
    return
  fi

  # Method 2: Check thermal pressure via powermetrics (if sudo available)
  local pressure
  pressure=$(sudo -n powermetrics --samplers thermal -i 500 -n 1 2>/dev/null | grep -i 'pressure level' | awk '{print $NF}' || echo "")

  case "$pressure" in
    Heavy|Critical|Trapping) echo "HOT"; return ;;
    Moderate|Light)          echo "WARM"; return ;;
    Nominal)                 echo "COOL"; return ;;
  esac

  # Method 3: Load average fallback (10 cores on M1 Max)
  local load
  load=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}' | cut -d. -f1)
  load=${load:-0}

  if [ "$load" -gt 20 ]; then
    echo "HOT"
  elif [ "$load" -gt 10 ]; then
    echo "WARM"
  else
    echo "COOL"
  fi
}

# --- Qwen Keep-Warm (24h keep_alive instead of unload every 30s) ---
keep_qwen_warm() {
  local ollama_up
  ollama_up=$(curl -s -o /dev/null -w '%{http_code}' "$OLLAMA_URL" 2>/dev/null || echo "000")

  if [ "$ollama_up" != "200" ]; then
    return
  fi

  local loaded
  loaded=$(curl -s "$OLLAMA_URL/api/ps" 2>/dev/null | grep -q "$QWEN_MODEL" && echo "1" || echo "0")

  if [ "$loaded" = "0" ]; then
    log "Qwen not loaded — sending keep_alive:24h warmup ping"
    curl -s "$OLLAMA_URL/api/generate" \
      -d "{\"model\":\"$QWEN_MODEL\",\"keep_alive\":\"24h\",\"prompt\":\"ping\"}" \
      > /dev/null 2>&1 &
  fi
}

# --- Qwen Unload (for HOT state) ---
unload_qwen() {
  local loaded
  loaded=$(curl -s "$OLLAMA_URL/api/ps" 2>/dev/null | grep -q "$QWEN_MODEL" && echo "1" || echo "0")

  if [ "$loaded" = "1" ]; then
    log "HOT: Unloading Qwen to cool down"
    curl -s "$OLLAMA_URL/api/generate" \
      -d "{\"model\":\"$QWEN_MODEL\",\"keep_alive\":0}" \
      > /dev/null 2>&1
  fi
}

# --- Task Watcher Management ---
restart_task_watcher() {
  if pgrep -f 'node.*task-watcher' > /dev/null 2>&1; then
    return 0
  fi

  log "task-watcher DEAD — restarting..."

  if [ -f "$WORKER_DIR/scripts/preflight-check.js" ]; then
    if ! node "$WORKER_DIR/scripts/preflight-check.js" >> "$LOG" 2>&1; then
      log "PREFLIGHT FAIL — git restore"
      cd "$WORKER_DIR" 2>/dev/null
      git checkout HEAD -- config.js task-watcher.js lib/ >> "$LOG" 2>&1 || true
      return 1
    fi
  fi

  cd "$WORKER_DIR" || return 1
  nohup node task-watcher.js >> "$HOME/tom_hum_cto.log" 2>&1 &
  sleep 5

  if pgrep -f 'node.*task-watcher' > /dev/null 2>&1; then
    log "task-watcher UP"
  else
    log "task-watcher FAILED to start"
  fi
}

# === MAIN LOOP ===
log "=== GUARDIAN v5 STARTED (PID $$) ==="
log "Thermal-aware | PID singleton | Qwen keep-warm 24h"

while true; do
  THERMAL=$(get_thermal_state)
  SLEEP_TIME=$SLEEP_COOL

  case "$THERMAL" in
    COOL)
      keep_qwen_warm
      restart_task_watcher
      SLEEP_TIME=$SLEEP_COOL
      ;;
    WARM)
      # Keep Qwen loaded but don't restart dead workers aggressively
      log "WARM: Reducing activity"
      SLEEP_TIME=$SLEEP_WARM
      # Still keep task-watcher alive
      restart_task_watcher
      ;;
    HOT)
      log "HOT: Emergency cooldown — unloading Qwen, pausing workers"
      unload_qwen
      # Kill task-watcher to reduce load
      pkill -f 'node.*task-watcher' 2>/dev/null || true
      SLEEP_TIME=$SLEEP_HOT
      ;;
  esac

  sleep $SLEEP_TIME
done
