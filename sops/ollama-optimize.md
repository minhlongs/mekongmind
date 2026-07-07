# Ollama Performance Optimization

## Problem (2026-06-04)
- qwen3.6:35b-cc-65k: 10-17s per request, 24GB VRAM
- Root cause: 65K default context window + 35B params on M1 Max

## Benchmark Results (M1 Max, Metal GPU)
| Model | Context | eval_duration (50 tok) | Speed | Quality |
|-------|---------|------------------------|-------|---------|
| qwen3:1.7b | 4K | ~352ms (~142 tok/s) | 1.0s | Basic |
| qwen3.5:2b | 4K | ~600ms (~83 tok/s) | 1.5s | Good |
| qwen3.6:35b-cc | 4K | ~867ms (~58 tok/s) | 2.5s | Best |
| qwen3.6:35b-cc | 65K | ~17,000ms | 10-17s | Best |

## Key Insight: num_ctx is the bottleneck
Reducing context from 65K → 4K cuts inference time from 17s to 1.5s.

## Quick Commands
```bash
# Benchmark
curl -w "\nTime: %{time_total}s\n" localhost:11434/api/generate -d '{
  "model": "qwen3:1.7b", "prompt": "Hi", "stream": false,
  "options": {"num_predict": 50, "num_ctx": 4096}
}'

# Set env for lower memory
launchctl setenv OLLAMA_NUM_PARALLEL 2
launchctl setenv OLLAMA_FLASH_ATTENTION 1
```
