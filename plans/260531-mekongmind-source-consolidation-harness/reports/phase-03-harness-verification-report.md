# Phase 3 Harness Verification Report

**Generated:** 2026-07-07
**Scope:** docs/harness-engineering.md vs actual codebase
**Mode:** Read-only — no code was modified

---

## Status: NEEDS_WORK

The harness-engineering.md doc is largely accurate but has several gaps and one outright incorrect claim about an env var that does not exist in any implementation.

---

## Env Vars — Documented vs Found in Code

### Fully Verified (in code)

| Env Var | Doc Default | Found In | Notes |
|---|---|---|---|
| `LLM_BASE_URL` | `http://localhost:11434` | `cli/src/core/llm_client.py:291`, `cli/src/core/api_adapter.py:76`, `packages/mekong-cli-core/src/llm/router.ts:162` | ✅ Confirmed |
| `LLM_API_KEY` | — | `cli/src/core/llm_client.py:494`, `cli/src/core/api_adapter.py:52`, `packages/mekong-cli-core/src/llm/router.ts:163`, `packages/mekong-cli-core/src/llm/providers/ollama.ts:18`, `packages/mekong-cli-core/src/llm/providers/mlx.ts:41` | ✅ Confirmed — used as universal key |
| `LLM_MODEL` | `claude-sonnet-4-6-20250514` | `cli/src/core/llm_client.py:287`, `cli/src/core/providers.py:452`, `cli/src/core/model_selector.py:185`, `packages/mekong-cli-core/src/llm/router.ts:31,164` | ✅ Confirmed |
| `ANTHROPIC_TIMEOUT_MS` | `60000` | `packages/mekong-cli-core/src/llm/providers/anthropic.ts:247` | ✅ Confirmed |
| `LLM_TIMEOUT_MS` | `60000` | `cli/src/core/llm_client.py:82`, `packages/mekong-cli-core/src/llm/providers/anthropic.ts:247` | ✅ Confirmed |
| `LOCAL_LLM_MODEL` | — | `packages/mekong-cli-core/src/llm/providers/ollama.ts:19`, `packages/mekong-cli-core/src/llm/providers/mlx.ts:36`, `cli/src/core/llm_client.py:488` | ✅ Confirmed (alias: `OLLAMA_MODEL`) |
| `LOCAL_LLM_URL` | — | `packages/mekong-cli-core/src/llm/providers/ollama.ts:14`, `packages/mekong-cli-core/src/llm/providers/mlx.ts:35`, `cli/src/core/llm_client.py:486` | ✅ Confirmed (alias: `OLLAMA_BASE_URL`) |
| `LLM_AUDIT_LOG` | `.mekong/llm-cloud-audit.jsonl` | `cli/src/core/llm_client.py:148` | ✅ Confirmed — `LLMAuditLogger` class implemented |

### NOT Found in Any Code (doc claims they exist)

| Env Var | Doc Default | Finding |
|---|---|---|
| `LLM_PROVIDER` | `local-llm` | ❌ **Nowhere in code.** Single grep across all `.ts`, `.py`, `.sh`, `.md`, `.json` found only `docs/harness-engineering.md` itself. All TS router files use constructor arguments, not env vars, for provider selection. |
| `LLM_LOCAL_MODEL` | `qwen2.5-coder:32b` | ❌ **Does not exist.** The code uses `LOCAL_LLM_MODEL`, not `LLM_LOCAL_MODEL`. |
| `LLM_CLOUD_MODEL` | `claude-sonnet-4-6-20250514` | ❌ **Does not exist in code.** No references found outside `docs/harness-engineering.md`. |
| `LLM_THINKING_MODEL` | `claude-opus-4-7` | ❌ **Does not exist.** The TS side uses `MEKONG_THINKING_MODEL` (in `model-config.ts:44`), the Python side has no equivalent. |
| `LLM_MAX_TOKENS` | `16384` | ❌ **Does not exist in code.** |
| `LLM_TEMPERATURE` | `0.3` | ❌ **Does not exist in code.** Temperature is always passed as a constructor/runtime argument, not via env var. |

### Named Differently in Code

| Doc Name | Actual Code Name | Notes |
|---|---|---|
| `LLM_THINKING_MODEL` | `MEKONG_THINKING_MODEL` | Only in TS side (`model-config.ts:44`) |
| `LLM_CLOUD_MODEL` | *(no env var — uses `LLM_MODEL`)* | Python `_default_anthropic_model()` falls back to `LLM_MODEL` |
| `LLM_LOCAL_MODEL` | `LOCAL_LLM_MODEL` | Also aliased as `OLLAMA_MODEL` |
| `LLM_PROVIDER` | *(never used)* | Provider is a constructor param in TS, not an env var |

---

## Router Implementation Status

### TypeScript Router (`packages/mekong-cli-core/src/llm/`)

| Component | File | Lines | Verdict |
|---|---|---|---|
| `LlmRouter` | `router.ts` | 259 | ✅ **Complete.** Multi-provider with Anthropic, OpenAI, DeepSeek, OpenRouter, local-llm (Ollama/MLX). Fallback chain + cost tracking + circuit breaker. |
| `MetaRouter` | `meta-router.ts` | 122 | ✅ **Complete.** Intent-based routing with thinking vs coding models. Has fallback retry logic. |
| `Classifier` | `classifier.ts` | 73 | ✅ **Complete.** Regex-based intent detection: planning, reasoning, coding, debugging, testing, default. No LLM call needed. |
| `model-config.ts` | `model-config.ts` | 73 | ✅ **Complete.** Zod schema for thinking/coding/fallback config. `getEnvOverrides()` reads `MEKONG_THINKING_PROVIDER`, `MEKONG_THINKING_MODEL`, `MEKONG_CODING_PROVIDER`, `MEKONG_CODING_MODEL`. |
| `Provider: Anthropic` | `providers/anthropic.ts` | — | ✅ Present |
| `Provider: OpenAI` | `providers/openai.ts` | — | ✅ Present |
| `Provider: OpenAICompat` | `providers/openai-compatible.ts` | — | ✅ Present |
| `Provider: Ollama/LocalLLM` | `providers/ollama.ts` | 56 | ✅ Present |
| `Provider: MLX` | `providers/mlx.ts` | 80 | ✅ Present |
| `Provider: Local (CF Workers AI)` | `providers/local.ts` | — | ✅ Present |

**Summary: TS router is fully implemented with real behavior, not stubs.**

### Python Client (`cli/src/core/llm_client.py`)

- ✅ 831 lines — fully implemented
- `LLMClient` class with universal 3-env-var detection (`LLM_BASE_URL` + `LLM_API_KEY` + `LLM_MODEL`)
- Circuit breaker (`ProviderHealth`), hooks pipeline, LRU cache, audit logger, request dedup
- Fallback chain: universal → OpenRouter → AgentRouter → DashScope → DeepSeek → Anthropic → OpenAI → Gemini → local → offline
- `LLMAuditLogger` writes JSONL to `LLM_AUDIT_LOG` path; excludes local providers

### Python Provider ABC (`cli/src/core/providers.py`)

- ✅ 662 lines — fully implemented
- Provider implementations: `AnthropicCompatibleProvider`, `OpenAICompatibleProvider`, `GeminiProvider`, `OfflineProvider`
- `api_adapter.py` uses the same env conventions

### qwen-warmup.sh

- ✅ Calls Ollama directly via `curl http://localhost:11434/api/generate`
- Does NOT use any `LLM_*` env vars — hardcoded URL and model
- **This is correct per the doc's resolved Q3**: "worker `lib/` are stubs; `qwen-warmup.sh` calls Ollama directly via curl — intentional separation"

---

## Gaps Between Docs and Code

### Critical

1. **`LLM_PROVIDER` env var is fictional.** It appears only in `docs/harness-engineering.md` (the env contract table, line 11, and smoke commands on lines 109, 121, 137). Setting `LLM_PROVIDER=local-llm` has zero effect — no TS or Python code reads it. The smoke commands using this var will silently ignore it. The router selects providers via constructor arguments (`provider: 'local-llm'`), not env vars.

2. **`LLM_LOCAL_MODEL` does not exist.** The actual env var is `LOCAL_LLM_MODEL`. Any operator following the doc who sets `LLM_LOCAL_MODEL=qwen2.5-coder:32b` will see it ignored; they must use `LOCAL_LLM_MODEL`.

3. **`LLM_MAX_TOKENS` and `LLM_TEMPERATURE` do not exist.** These are always passed as method/constructor arguments, not read from env.

### Moderate

4. **`LLM_THINKING_MODEL` vs `MEKONG_THINKING_MODEL`.** The doc says `LLM_THINKING_MODEL` but the TS `model-config.ts` reads `MEKONG_THINKING_MODEL`. This is a naming mismatch.

5. **`LLM_CLOUD_MODEL` has no code equivalent.** The Python side reads `LLM_MODEL` as the cloud default; the TS side uses per-provider config with `LLM_MODEL` as Anthropic fallback. The doc's "separate clouds model" concept is not implemented.

6. **Routing contract diagram asymmetry.** The doc shows `planning/reasoning → THINKING_MODEL (cloud-first, local fallback)` but the TS `meta-router.ts` default `DEFAULT_THINKING_MODEL` has `provider: 'anthropic'` (cloud-first) with no local fallback for thinking intents. The fallback in `routeWithIntent` only retries with a different *model config* (still defaults to `DEFAULT_CODING_MODEL` which is also Anthropic), not to a local model. So "local fallback for thinking" is **not actually implemented** — the fallback is within Anthropic configs.

7. **Default model names are stale/inconsistent.** The doc says default local model is `qwen2.5-coder:32b` but the code uses `qwen3.6-35b` (TS: `ollama.ts:19`, `mlx.ts:36`; Python: `llm_client.py:287`, `llm_client.py:488`). The warmup script uses `qwen3:32b` (different from both).

### Minor

8. **Smoke command #1 is broken.** Uses `LLM_PROVIDER=local-llm` which is ignored. The `LlmRouter` constructor does not auto-detect provider from env — it requires `provider: 'ollama'` or `provider: 'local-llm'` explicitly passed. The smoke command passes it correctly in the constructor, so the command will still work, but the env var is noise.

9. **Smoke command paths.** Uses `/Users/macbook/mekongmind` as CWD for TS commands — correct for the monorepo root.

10. **Python smoke test.** Checks `tests/test_llm_client.py` — this file was not found in the directory listing (only `tests/` exists under `cli/` but contents were not enumerated). **Needs verification.**

---

## Recommended Fixes

1. **Replace `LLM_PROVIDER` with actual mechanism.** Either:
   - Document that provider selection is via constructor/config only (not env var), or
   - If operator convenience is desired, wire `LLM_PROVIDER` as an env-to-constructor bridge in the CLI entrypoint.

2. **Fix env var names in the env contract table:**
   - `LLM_LOCAL_MODEL` → `LOCAL_LLM_MODEL`
   - `LLM_THINKING_MODEL` → `MEKONG_THINKING_MODEL`
   - Mark `LLM_CLOUD_MODEL` as "not implemented — use `LLM_MODEL`"
   - Remove `LLM_PROVIDER`, `LLM_MAX_TOKENS`, `LLM_TEMPERATURE` from the table (or downgrade to "planned")

3. **Fix default model name.** Use `qwen3.6-35b` consistently across doc, TS, Python, and the shell script — or explicitly document why they differ.

4. **Fix the fallback path in meta-router.ts documentation.** Either implement a true local fallback for thinking intents, or update the doc to say "planning/reasoning → cloud-first; fallback is alternative cloud model, not local."

5. **Verify `tests/test_llm_client.py` exists** and update the doc's smoke test command accordingly.
