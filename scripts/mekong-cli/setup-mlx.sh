#!/usr/bin/env bash
# setup-mlx.sh — Cài MLX inference backend + download VN LLM models
# Dùng cho Mekong VN Hub: M1 Max 64GB
# Run: bash scripts/setup-mlx.sh [--skip-qwen] [--skip-phogpt]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MODELS_DIR="$ROOT_DIR/models"
VENV_PYTHON="$ROOT_DIR/.venv/bin/python3"

# Colors
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Args
SKIP_QWEN=false; SKIP_PHOGPT=false
for arg in "$@"; do
  case "$arg" in
    --skip-qwen)   SKIP_QWEN=true ;;
    --skip-phogpt) SKIP_PHOGPT=true ;;
    *) warn "Unknown argument: $arg (ignored)" ;;
  esac
done

info "=== Mekong VN Hub — MLX Setup ==="
info "Hardware: Apple M1 Max, 64GB RAM"
info "Models dir: $MODELS_DIR"

# Step 1: Verify MLX installation
info "Step 1/4: Verifying MLX..."
$VENV_PYTHON -c "import mlx.core as mx; assert str(mx.default_device()) == 'Device(gpu, 0)', 'GPU not detected'" \
  || error "MLX không chạy trên GPU. Chạy: .venv/bin/pip install mlx mlx-lm"
info "  ✓ MLX GPU OK"

# Step 2: Install huggingface-hub nếu chưa có
info "Step 2/4: Checking HuggingFace CLI..."
$VENV_PYTHON -c "import huggingface_hub" 2>/dev/null \
  || { info "  Installing huggingface-hub..."; $VENV_PYTHON -m pip install huggingface-hub --quiet; }
info "  ✓ huggingface-hub OK"

# Step 3: PhoGPT-4B — DROPPED (vinai/PhoGPT-4B-Chat uses pytorch_model.bin, no safetensors)
# mlx-lm.convert requires safetensors format. Qwen3-8B replaces it as primary VN model.
info "Step 3/4: PhoGPT-4B skipped (incompatible .bin format) — Qwen3-8B is primary VN model"

# Step 4: Download Qwen3 (General reasoning — pre-quantized, nhanh hơn)
# Dùng Qwen3-8B (4.5GB, ~80 tok/s) thay vì 14B (8GB, ~50 tok/s) cho MVP
if [[ "$SKIP_QWEN" == "false" ]]; then
  info "Step 4/4: Downloading Qwen3-8B-4bit (~4.5GB, pre-quantized, 5-10 phút)..."
  info "  Source: mlx-community/Qwen3-8B-4bit (confirmed available)"
  info "  Faster than 14B (~80 tok/s vs ~50 tok/s) — adequate for VN business tasks"

  # mlx-community/Qwen3-8B-4bit là model đã MLX-quantized sẵn — dùng snapshot_download
  # KHÔNG dùng mlx_lm.convert (chỉ dùng khi convert từ HF raw model)
  $VENV_PYTHON -c "
from huggingface_hub import snapshot_download
import sys
print('Downloading mlx-community/Qwen3-8B-4bit...')
try:
    path = snapshot_download('mlx-community/Qwen3-8B-4bit', local_dir='$MODELS_DIR/qwen3-8b')
    print(f'Downloaded to: {path}')
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    sys.exit(1)
" || {
      warn "  Qwen3-8B download failed, trying 14B fallback..."
      $VENV_PYTHON -c "
from huggingface_hub import snapshot_download
snapshot_download('mlx-community/Qwen3-14B-4bit', local_dir='$MODELS_DIR/qwen3-14b-q4')
" || warn "  Qwen3 download failed — check network/HuggingFace"
    }

  [[ -d "$MODELS_DIR/qwen3-8b" ]] && info "  ✓ Qwen3-8B ready" \
    || { [[ -d "$MODELS_DIR/qwen3-14b-q4" ]] && info "  ✓ Qwen3-14B ready" || warn "  Qwen3 not downloaded"; }
else
  warn "  Skipping Qwen3 (--skip-qwen)"
fi

# Summary
echo ""
info "=== Setup Summary ==="
for model_dir in phogpt-4b qwen3-8b qwen3-14b-q4; do
  if [[ -d "$MODELS_DIR/$model_dir" ]]; then
    size=$(du -sh "$MODELS_DIR/$model_dir" 2>/dev/null | cut -f1)
    info "  ✓ $model_dir ($size)"
  fi
done

echo ""
info "Để start MLX inference server:"
info "  .venv/bin/python3 -m mlx_lm.server --model models/phogpt-4b --port 11434"
info ""
info "Để benchmark:"
info "  bash scripts/benchmark-llm.sh"
