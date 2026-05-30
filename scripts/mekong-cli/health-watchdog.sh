#!/bin/bash
# Mekong IDE Health Watchdog — runs every 60s via cron
LOG="/var/log/mekong-watchdog.log"
TS=$(date "+%Y-%m-%d %H:%M:%S")

check() {
  local name=$1 url=$2 restart_cmd=$3
  if curl -sf "$url" > /dev/null 2>&1; then
    echo "[$TS] ✅ $name" >> $LOG
  else
    echo "[$TS] ❌ $name DOWN — restarting" >> $LOG
    eval "$restart_cmd" >> $LOG 2>&1
  fi
}

check "Gateway" "http://localhost:8000/health" \
  "cd /Users/macbook/mekong-cli && source .venv/bin/activate && nohup uvicorn src.gateway:app --host 0.0.0.0 --port 8000 > /tmp/gateway.log 2>&1 &"

check "MLX" "http://localhost:11435/v1/models" \
  "nohup mlx_lm.server --model mlx-community/Qwen2.5-Coder-32B-Instruct-4bit --port 11435 > /tmp/mlx.log 2>&1 &"

check "Ollama" "http://localhost:11434/api/tags" \
  "ollama serve &>/dev/null &"

check "CF-Tunnel" "https://m1max.cashclaw.cc" \
  "nohup cloudflared tunnel --config /Users/macbook/.cloudflared/config-ssh.yml run > /tmp/cf.log 2>&1 &"
