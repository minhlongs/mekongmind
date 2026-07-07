# SOLO Company Local LLM For M1/M1 Max

Date: 260603-1202
Skill: `ck:autoresearch` routed to `ck:loop` pattern

## Goal

Make `me idea` local-first on Apple Silicon so the Solo Company can coordinate full SOPs with no data gaps, sell itself, and move toward first `$1M MRR`.

## Current Machine Evidence

Detected:

- Machine: MacBook Pro M1 Max.
- Unified memory: 64GB.
- Ollama: `0.24.0`.
- Ollama API: `http://localhost:11434/api/tags` available.
- Installed useful models:
  - `qwen3:32b` Q4_K_M, about 20GB.
  - `deepseek-r1:32b` Q4_K_M, about 20GB.
  - `deepseek-r1:14b` Q4_K_M.
  - `qwen2.5-coder:14b` Q4_K_M.
  - `qwen2.5-coder:7b` Q4_K_M.

## Runtime Decision

Use Ollama as primary local runtime because it is already installed, running, and has the right model set.

Secondary runtimes:

- MLX-LM for Apple Silicon-native experiments and future fine-tuned adapters.
- llama.cpp Metal for GGUF control and fallback when Ollama is unavailable.

Do not run multiple 32B models concurrently inside daemon loops. Use one large model plus smaller fallback.

## Model Routing

| Role | Model | Runtime | Departments | Use |
|---|---|---|---|---|
| default-reasoning | `qwen3:32b` | Ollama | CEO, Market, Product, Knowledge | planning, SOP routing, synthesis |
| local-critic | `deepseek-r1:32b` | Ollama | CEO, Quality, Sales | contradiction checks, blocker review |
| coder-fast | `qwen2.5-coder:14b` | Ollama | Engineering, Quality, Platform | scoped code/test/doc patches |
| coder-lite | `qwen2.5-coder:7b` | Ollama | CEO, Knowledge | routing, summaries, small transforms |

## No-Gap SOP Loop

Local model may:

- Summarize founder intent into goal fields.
- Propose next department.
- Draft department artifacts.
- Critique missing evidence.
- Generate scoped code/doc/test patches.

Local model may not:

- Pass a gate alone.
- Claim revenue.
- Replace provider-backed MRR.
- Replace production health evidence.
- Skip artifact validation.

Authoritative gate state remains:

```text
state/goal-*.md
state/departments/<goal-id>.json
state/gates/<goal-id>.json
state/revenue/<goal-id>.json
state/evidence/*.json
```

## Implemented In Repo

- Added `mekongmind_local_llm_runtime` to `agents/registry.json`.
- Added `registry_local_llm_runtime` helper.
- Added `me solo local-llm [filter]`.
- `/idea` and `/goal` rendered contracts now include Local LLM Runtime.
- README and Operating DNA document M1/M1 Max local-first policy.

## Verification

Expected commands:

```bash
me solo local-llm
me solo local-llm coder
ollama --version
curl -s http://localhost:11434/api/tags
```

## Sources

- Ollama: https://ollama.com
- Ollama API/library observed locally via `ollama --version` and `localhost:11434/api/tags`.
- MLX-LM: https://github.com/ml-explore/mlx-lm
- llama.cpp Metal: https://github.com/ggml-org/llama.cpp

## Unresolved Questions

- Need benchmark tokens/sec per model under actual daemon load before choosing final default for M1 16GB.
- Need optional MLX-LM adapter only if Ollama latency or memory pressure becomes bottleneck.
