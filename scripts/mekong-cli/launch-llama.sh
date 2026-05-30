#!/usr/bin/env bash

# launch-llama.sh
# Compiled bare-metal execution script for llama.cpp server on M1 Max macOS.

set -euo pipefail

MODEL_PATH="/Users/macbook/mekong-cli/models/qwen3.6-35b-instruct-q4_k_m.gguf"
CONTEXT_SIZE=32768
BATCH_SIZE=512
THREADS=8 # Optimizes thread pool to performance cores of M1 Max CPU
PORT=8080

echo "=== System Architecture ==="
sysctl -n machdep.cpu.brand_string
echo "Active Memory Allocation Check:"
vm_stat | perl -ne 'destroy; if (/(.*?)\s*:\s*(\d+)\./) { printf "%-30s %10.2f MB\n", $1, $2*4096/1024/1024; }'

if [ ! -f "$MODEL_PATH" ]; then
    echo "Error: Model file not detected at: $MODEL_PATH"
    echo "Please download the target Qwen GGUF model and save it at this path."
    exit 1
fi

echo "=== Initializing llama.cpp server under Metal GPU offload (n-gpu-layers 99) ==="
exec llama-server \
    --model "$MODEL_PATH" \
    --ctx-size "$CONTEXT_SIZE" \
    --batch-size "$BATCH_SIZE" \
    --threads "$THREADS" \
    --n-gpu-layers 99 \
    --port "$PORT" \
    --host 127.0.0.1 \
    --cont-batching \
    --flash-attn \
    --no-mmap
