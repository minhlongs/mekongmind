# Local LLM Solo Company Completion Audit

Date: 260603-1202

## Objective

Build a local-first LLM layer for M1/M1 Max so `me idea` can autonomously coordinate full SOPs with no data gaps, self-sell MekongMind, and support the first `$1M MRR` goal.

## Requirement Audit

### 1. Use `ck:autoresearch` pattern

Status: Complete.

Evidence:

- Read `ck:autoresearch`.
- Routed to `ck:loop` pattern: bounded changes, verify, keep/discard.
- Used mechanical verification gates instead of subjective completion.

### 2. Validate current local machine and model stack

Status: Complete.

Evidence:

- Machine: M1 Max, 64GB unified memory.
- Ollama installed: `0.24.0`.
- Ollama API available at `localhost:11434`.
- Installed models include `qwen3:32b`, `deepseek-r1:32b`, `qwen2.5-coder:14b`, `qwen2.5-coder:7b`.

### 3. Add local-first runtime contract

Status: Complete.

Evidence:

- Added `mekongmind_local_llm_runtime` to `agents/registry.json`.
- Runtime includes:
  - M1 Max 64GB profile.
  - M1 16GB profile.
  - provider priority: Ollama -> MLX-LM -> llama.cpp Metal -> explicit cloud max.
  - model roles: default reasoning, critic, coder-fast, coder-lite.
  - SOP loop policy.
  - no-gap invariants.
  - failure modes.

### 4. Integrate local LLM into `me idea` / `/goal`

Status: Complete.

Evidence:

- `render_mekongmind_goal_contract` now emits `## Local LLM Runtime`.
- `tests/test_idea_dispatch.sh` proves `/idea` and `/goal` include local runtime and no-gap invariant.

### 5. Add CLI inspection

Status: Complete.

Evidence:

- Added `me solo local-llm [filter]`.
- CLI output shows hardware profiles, model policy, SOP loop policy, no-gap invariants, failure modes, inspection commands.
- `tests/test_registry.py` verifies CLI renders `qwen2.5-coder:14b` and `coder-lite` for `me solo local-llm coder`.

### 6. Prevent data gaps and false evidence

Status: Complete.

Evidence:

- Runtime invariant: no LLM response is evidence unless written to artifact contract.
- Runtime invariant: no department handoff without artifact path, required fields, proof rule, next bottleneck.
- Runtime invariant: no `$1M MRR` claim without provider-backed revenue evidence and fulfillment/clone-memory proof.
- Existing cross-coverage tests verify SOP files, rooms, mesh cells, contracts, and doctrine are mutually covered.

### 7. Support self-selling loop

Status: Complete.

Evidence:

- Runtime `sales_self_use`: MekongMind must use same local LLM SOP loop to market, sell, close, fulfill, and document itself before claiming repeatability.
- Sales/revenue gate still requires provider-backed MRR evidence.
- Growth/Sales/Customer Success/Knowledge departments remain authoritative path for self-selling proof.

## Verification

Passed:

```bash
bash tests/test_idea_dispatch.sh
# PASS=31 FAIL=0

bash tests/test_agent_registry.sh
# PASS=29 FAIL=0

bash tests/test_coverage.sh
# PASS=17 FAIL=0

python3 -m pytest tests/test_registry.py -q
# 48 passed, 1 skipped, 52 subtests passed

bash -n lib/agent-patterns.sh
bash -n lib/goal-executor.sh
bash -n bin/me
bash -n tests/test_idea_dispatch.sh
# pass
```

Manual inspect:

```bash
me solo local-llm
```

Confirmed it renders M1 Max, M1, Ollama, MLX-LM, llama.cpp Metal, qwen/deepseek policy, no-gap invariants, failure modes.

## Sources

- Ollama: https://ollama.com
- Qwen3 32B Ollama model page: https://ollama.com/library/qwen3%3A32b
- MLX-LM: https://github.com/ml-explore/mlx-lm
- llama.cpp: https://github.com/ggml-org/llama.cpp

## Result

The local LLM runtime goal is achieved for the current repository state.

## Unresolved Questions

- Need future benchmark under real daemon load before deciding if M1 16GB should default to 7B or 14B.
- Need future MLX-LM adapter only if Ollama becomes bottleneck.
