#!/usr/bin/env bash
# benchmark-llm.sh — Benchmark MLX inference speed cho VN LLMs
# Target: PhoGPT-4B > 100 tok/s, Qwen3-14B > 50 tok/s

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PYTHON="$ROOT_DIR/.venv/bin/python3"
MODELS_DIR="$ROOT_DIR/models"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[BENCH]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }

VN_PROMPT="Hãy giải thích cách tính thuế TNCN lũy tiến cho thu nhập 30 triệu đồng mỗi tháng tại Việt Nam."

benchmark_model() {
  local model_path="$1"
  local model_name="$2"
  local target_toks="$3"

  if [[ ! -d "$MODELS_DIR/$model_path" ]]; then
    warn "Model $model_name not found at models/$model_path — skip"
    return
  fi

  info "--- Benchmarking $model_name ---"
  info "Prompt: \"$VN_PROMPT\""

  result=$($VENV_PYTHON -m mlx_lm.generate \
    --model "$MODELS_DIR/$model_path" \
    --prompt "$VN_PROMPT" \
    --max-tokens 200 \
    --temp 0.1 \
    2>&1)

  # Extract tokens/sec từ output
  toks_per_sec=$(echo "$result" | grep -oE "[0-9]+\.[0-9]+ tokens-per-sec" | grep -oE "[0-9]+\.[0-9]+" | tail -1)
  prompt_toks=$(echo "$result" | grep -oE "Prompt: [0-9]+ tokens" | grep -oE "[0-9]+" | head -1)

  echo ""
  echo "Output preview:"
  echo "$result" | grep -v "^=" | head -8
  echo ""

  if [[ -n "$toks_per_sec" ]]; then
    if (( $(echo "$toks_per_sec >= $target_toks" | bc -l) )); then
      info "  ✓ Speed: ${toks_per_sec} tok/s (target: ≥${target_toks}) — PASS"
    else
      warn "  ✗ Speed: ${toks_per_sec} tok/s (target: ≥${target_toks}) — BELOW TARGET"
    fi
  else
    warn "  Could not parse tokens/sec from output"
  fi
  echo ""
}

info "=== MLX Benchmark — Mekong VN Hub ==="
info "Hardware: M1 Max 64GB | Device: GPU"
info ""

benchmark_model "phogpt-4b" "PhoGPT-4B (VN Specialist)" 100

# Benchmark whichever Qwen variant was downloaded
if [[ -d "$MODELS_DIR/qwen3-8b" ]]; then
  benchmark_model "qwen3-8b"     "Qwen3-8B Q4 (Reasoning)"   80
elif [[ -d "$MODELS_DIR/qwen3-14b-q4" ]]; then
  benchmark_model "qwen3-14b-q4" "Qwen3-14B Q4 (Reasoning)"  50
else
  warn "No Qwen3 model found — run: bash scripts/setup-mlx.sh --skip-phogpt"
fi

info "=== Done ==="
info "Nếu speed thấp hơn target: thử restart và đóng các app khác."
