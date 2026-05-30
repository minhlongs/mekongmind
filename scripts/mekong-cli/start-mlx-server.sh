#!/usr/bin/env bash
# start-mlx-server.sh — Khởi động MLX inference server cho Mekong VN Hub
# Usage: bash scripts/start-mlx-server.sh [phogpt-4b|qwen3-14b-q4|auto]
# Port 11434 — OpenAI-compatible API

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PYTHON="$ROOT_DIR/.venv/bin/python3"
MODELS_DIR="$ROOT_DIR/models"
PORT=11434

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[MLX]${NC} $1"; }
warn()  { echo -e "${YELLOW}[MLX]${NC} $1"; }
error() { echo -e "${RED}[MLX]${NC} $1"; exit 1; }

MODEL_ARG="${1:-qwen3-8b}"

# Auto mode: dùng Qwen3-8B (PhoGPT-4B dropped — no safetensors support)
[[ "$MODEL_ARG" == "auto" ]] && MODEL_ARG="qwen3-8b"

MODEL_PATH="$MODELS_DIR/$MODEL_ARG"

if [[ ! -d "$MODEL_PATH" ]]; then
  error "Model không tồn tại: $MODEL_PATH\n  Chạy: bash scripts/setup-mlx.sh trước"
fi

# Kill existing server trên port — TERM trước, KILL sau nếu cần
OLD_PIDS=$(lsof -Pi ":$PORT" -sTCP:LISTEN -t 2>/dev/null || true)
if [[ -n "$OLD_PIDS" ]]; then
  warn "Port $PORT đang được dùng — stopping process(es)..."
  echo "$OLD_PIDS" | xargs kill -TERM 2>/dev/null || true
  sleep 2
  # Force kill nếu vẫn còn
  REMAINING=$(lsof -Pi ":$PORT" -sTCP:LISTEN -t 2>/dev/null || true)
  [[ -n "$REMAINING" ]] && echo "$REMAINING" | xargs kill -9 2>/dev/null || true
fi

info "Starting MLX server..."
info "  Model: $MODEL_ARG"
info "  Path:  $MODEL_PATH"
info "  Port:  $PORT (OpenAI-compatible)"
info "  API:   http://localhost:$PORT/v1"
echo ""

# Verify model config file tồn tại (không load full model — tốn RAM)
[[ -f "$MODEL_PATH/config.json" ]] && info "  ✓ Model config found" || warn "  config.json missing — model may be incomplete"

# Start server
exec $VENV_PYTHON -m mlx_lm.server \
  --model "$MODEL_PATH" \
  --port "$PORT" \
  --log-level INFO
