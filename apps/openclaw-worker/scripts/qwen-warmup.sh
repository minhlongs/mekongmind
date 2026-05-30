#!/usr/bin/env bash
# qwen-warmup.sh — Start Ollama + warm up Qwen 3 32B with 24h keep_alive
# For M1 Max 64GB — Qwen uses ~20GB VRAM via Metal

set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/sbin:/usr/bin:/bin:$PATH"

OLLAMA_URL="http://localhost:11434"
MODEL="qwen3:32b"
LOG="$HOME/tom_hum_guardian.log"

log() {
  echo "[$(date '+%H:%M:%S')] [warmup] $1" | tee -a "$LOG"
}

# Start Ollama serve if not running
if ! curl -s -o /dev/null "$OLLAMA_URL" 2>/dev/null; then
  log "Starting Ollama serve..."
  nohup ollama serve >> /tmp/ollama-serve.log 2>&1 &
  # Wait for Ollama to be ready
  for i in $(seq 1 30); do
    if curl -s -o /dev/null "$OLLAMA_URL" 2>/dev/null; then
      log "Ollama ready after ${i}s"
      break
    fi
    /bin/sleep 1
  done
fi

# Verify Ollama is up
if ! curl -s -o /dev/null "$OLLAMA_URL" 2>/dev/null; then
  log "ERROR: Ollama failed to start"
  exit 1
fi

# Check if model is pulled
if ! ollama list 2>/dev/null | grep -q "$MODEL"; then
  log "Pulling $MODEL (this will take a while)..."
  ollama pull "$MODEL"
fi

# Warm up with keep_alive:24h
log "Warming up $MODEL with keep_alive:24h..."
RESPONSE=$(curl -s "$OLLAMA_URL/api/generate" \
  -d "{\"model\":\"$MODEL\",\"keep_alive\":\"24h\",\"prompt\":\"Say OK\",\"stream\":false}" \
  2>/dev/null)

if echo "$RESPONSE" | grep -q '"response"'; then
  log "Qwen warm! Model loaded with 24h keep_alive"
  # Show model info
  ollama ps 2>/dev/null | tee -a "$LOG"
else
  log "WARNING: Warmup response unexpected: $RESPONSE"
fi

log "Warmup complete."
