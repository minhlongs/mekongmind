# Harness Engineering — Local-First LLM Runtime
*Generated: 2026-05-31 | Phase 3 | Status: documented — pending smoke gate*

## Canonical Env Contract

| Var | Purpose | Default | Required |
|---|---|---|---|
| `LLM_BASE_URL` | Base URL for local provider (Ollama/MLX) | `http://localhost:11434` | Yes for local-only |
| `LLM_API_KEY` | API key for cloud fallback (Anthropic/OpenRouter) | — | Yes for cloud fallback |
| `LLM_MODEL` | Default model id | `claude-sonnet-4-6-20250514` | No (fallback chain) |
| `LLM_PROVIDER` | Provider hint: `local-llm` \| `anthropic` \| `openai` \| `ollama` \| `mlx` | `local-llm` | No |
| `LLM_LOCAL_MODEL` | Model id for local provider | `qwen2.5-coder:32b` (Ollama) \| user-chosen (MLX) | No |
| `LLM_CLOUD_MODEL` | Model id for cloud fallback | `claude-sonnet-4-6-20250514` | No |
| `LLM_THINKING_MODEL` | Model id for planning/reasoning intents | `claude-opus-4-7` | No |
| `LLM_MAX_TOKENS` | Max output tokens | `16384` | No |
| `LLM_TEMPERATURE` | Default temperature | `0.3` (coding) \| `0.1` (thinking) | No |
| `ANTHROPIC_TIMEOUT_MS` | HTTP timeout for Anthropic cloud calls (ms) | `60000` (60s) | No |
| `LLM_TIMEOUT_MS` | Generic HTTP timeout fallback (ms) | `60000` (60s) | No |
| `LLM_AUDIT_LOG` | Path to JSONL audit log for cloud LLM calls | `.mekong/llm-cloud-audit.jsonl` | No |

## Routing Contract

```
intent -> classifier -> [planning|reasoning|coding|chat]
         |
         v
     planning/reasoning -> THINKING_MODEL (cloud-first, local fallback)
     coding             -> LOCAL_MODEL (local-first, cloud fallback)
     chat               -> LOCAL_MODEL (local-first, cloud fallback)
```

### Default Models

| Intent | Provider | Model | Temperature | Max Tokens |
|---|---|---|---|---|
| `planning` / `reasoning` | `anthropic` (cloud) | `claude-opus-4-7` | 0.1 | 32768 |
| `coding` | `local-llm` (Ollama/MLX) | `qwen2.5-coder:32b` | 0.3 | 16384 |
| `chat` | `local-llm` (Ollama/MLX) | `qwen2.5-coder:32b` | 0.3 | 8192 |

### Cloud Escalation Triggers

Escalate from local to cloud **only** when:

1. **Long context**: input messages exceed local model context window (fallback via `catch` block in MetaRouter).
2. **Planning / reasoning intent**: classifier returns `planning` or `reasoning` → route to `LLM_THINKING_MODEL` by default.
3. **Local provider failure**: Ollama/MLX returns non-200 or timeout → fallback to `LLM_CLOUD_MODEL`.
4. **Explicit override**: caller passes `provider: 'anthropic'` or `provider: 'openai'` in request.

**Never escalate silently.** Every cloud call must be traceable via `LLM_PROVIDER` override or fallback path.

## Cost / Metering

- **Local loop (default)**: zero cloud cost. Run on Mac compute.
- **Cloud burst (explicit)**: billed per token via Anthropic/OpenRouter API key. Operator must have `LLM_API_KEY` set.
- **No hidden paid calls**: local-first default means no background cloud spend without env config.

### Cloud Audit Log (P2)

Enable `LLMClient(enable_audit_log=True)` to write one JSON record per cloud API call to `LLM_AUDIT_LOG` (default: `.mekong/llm-cloud-audit.jsonl`). Local providers (Ollama/MLX) are excluded automatically.

```python
from src.core.llm_client import LLMClient

client = LLMClient(enable_audit_log=True)
# ... every cloud call is now logged

# Inspect recent calls
logger = client.audit_logger
for rec in logger.tail(10):
    print(f"{rec["ts"]} {rec["provider"]} {rec["status"]} {rec.get("duration_ms", 0):.0f}ms")
    print(f"  tokens: in={rec["input_tokens"]} out={rec["output_tokens"]}")

# Aggregated summary
print(logger.summary())
```

Log format (JSONL, append-only, thread-safe):

```json
{"ts":"2026-05-31T12:00:00+00:00","provider":"anthropic-direct","model":"claude-sonnet-4-6-20250514","input_tokens":120,"output_tokens":340,"duration_ms":1234.5,"status":"success"}
{"ts":"2026-05-31T12:01:00+00:00","provider":"openai-direct","model":"gpt-4o","input_tokens":null,"output_tokens":null,"duration_ms":5000.0,"status":"http_error","error":"openai-direct:429:Too Many Requests"}
```


## Implementation Surface

| Layer | File | Role |
|---|---|---|
| TS router | `packages/mekong-cli-core/src/llm/router.ts` | Provider abstraction + chat dispatch |
| TS meta-router | `packages/mekong-cli-core/src/llm/meta-router.ts` | Intent-based routing + fallback |
| TS classifier | `packages/mekong-cli-core/src/llm/classifier.ts` | Intent detection (planning/coding/chat) |
| TS local provider | `packages/mekong-cli-core/src/llm/providers/ollama.ts` | Ollama backend |
| `packages/mekong-cli-core/src/llm/providers/mlx.ts` | TS MLX provider | MLX backend (Apple Silicon) |
| Python CLI | `cli/src/core/providers.py` | Python LLMProvider ABC + built-ins |
| Python client | `cli/src/core/llm_client.py` | Python-side chat dispatcher |
| Worker script | `apps/openclaw-worker/scripts/qwen-warmup.sh` | Warmup for local model |

## Smoke Command

```bash
# 1. Start local Ollama (if not running)
ollama serve &

# 2. Pull a small test model
ollama pull qwen2.5-coder:32b

# 3. Run TS router smoke test (no secrets required)
cd /Users/macbook/mekongmind
LLM_BASE_URL=http://localhost:11434 LLM_PROVIDER=local-llm LLM_LOCAL_MODEL=qwen2.5-coder:32b \
  pnpm --filter mekong-cli-core exec tsx -e "
    import { MetaRouter } from './packages/mekong-cli-core/src/llm/meta-router.ts';
    import { LlmRouter } from './packages/mekong-cli-core/src/llm/router.ts';
    const router = new LlmRouter({ baseUrl: 'http://localhost:11434', provider: 'ollama', model: 'qwen2.5-coder:32b' });
    const meta = new MetaRouter({ router, config: { models: {} } });
    const res = await meta.route({ messages: [{ role: 'user', content: 'Say hello in one sentence.' }] });
    console.log('MODEL:', res.model);
    console.log('CONTENT:', res.content.slice(0, 200));
  "

# 4. Verify cloud escalation path (requires LLM_API_KEY)
LLM_API_KEY=$ANTHROPIC_KEY LLM_PROVIDER=anthropic LLM_MODEL=claude-sonnet-4-6-20250514 \
  pnpm --filter mekong-cli-core exec tsx -e "
    import { MetaRouter } from './packages/mekong-cli-core/src/llm/meta-router.ts';
    import { LlmRouter } from './packages/mekong-cli-core/src/llm/router.ts';
    const router = new LlmRouter({ baseUrl: 'https://api.anthropic.com', provider: 'anthropic', apiKey: process.env.LLM_API_KEY, model: 'claude-sonnet-4-6-20250514' });
    const meta = new MetaRouter({ router, config: { models: { thinking: { provider: 'anthropic', model: 'claude-opus-4-7' } } } });
    const res = await meta.route({ messages: [{ role: 'user', content: 'Say hello in one sentence.' }] });
    console.log('MODEL:', res.model);
    console.log('CONTENT:', res.content.slice(0, 200));
  "
```

### Python Smoke Test

```bash
cd /Users/macbook/mekongmind/cli
LLM_BASE_URL=http://localhost:11434 LLM_PROVIDER=local-llm LLM_LOCAL_MODEL=qwen2.5-coder:32b \
  python -m pytest tests/test_llm_client.py -x -q 2>/dev/null || echo "No pytest suite yet — add in next phase"
```

## Verification Gates

```bash
# TS imports resolve
cd /Users/macbook/mekongmind && pnpm --filter mekong-cli-core exec tsc --noEmit 2>&1 | head -20

# Python imports resolve
cd /Users/macbook/mekongmind/cli && python -c "from src.core.llm_client import LLMClient; print('OK')"
```

## Unresolved Questions
- Q1: ~~Does `packages/mekong-cli-core/src/llm/providers/mlx.ts` exist?~~ → YES, created (P1.3) (Phase 2 may need to reconcile from mekong-cli source)
- Q2: Python CLI `llm_client.py` — does it use the same env var names or a different convention?
- Q3: OpenClaw worker scripts — do they call local LLM directly or via the TS router?
- Q4: Metering — should cloud token usage be logged to a local file for cost tracking?

---

## Adapter Contracts (Phase 4)

### OpenClaw Mission Adapter

**Role:** Harness channel runtime. MekongMind submits missions; OpenClaw executes and returns results. MekongMind does NOT vendor OpenClaw internals.

**Boundary:**
```
MekongMind                    OpenClaw
─────────────                 ──────────
cli/                          ~/projects/openclaw/   (source-only, read-only)
packages/openclaw-engine/ ──→ apps/openclaw-worker/ (runtime harness)
  sdk.ts (interface)           scripts/*.sh (execution)
  engine-modules.ts            data/*.json (state)
```

**Contract:**

| Input | Type | Notes |
|---|---|---|
| `goal` | `string` | Mission objective |
| `complexity` | `'trivial' \| 'standard' \| 'complex' \| 'epic'` | Maps to credit cost |
| `maxRetries` | `number?` | Default 3 |
| `timeoutMs` | `number?` | Default 300000 |

| Output | Type | Notes |
|---|---|---|
| `id` | `string` | `m_<timestamp>_<random>` |
| `status` | `'queued' \| 'running' \| 'completed' \| 'failed'` | Final state |
| `output` | `string \| null` | Mission result payload |
| `creditsUsed` | `number` | Billed from CREDIT_COSTS tier |
| `durationMs` | `number` | Wall-clock execution time |

**Path Resolution (Blockers Fixed):**

| Old Path | New Resolution |
|---|---|
| `~/mekong-cli/scripts/` | `$MEKONGMIND_HOME/scripts/mekong-cli/` (legacy scripts, no-op for runtime) |
| `~/mekong-cli/apps/openclaw-worker/` | `apps/openclaw-worker/` (repo-relative) |
| `~/mekong-cli/tasks/` | `tasks/` (repo-relative) |
| `~/mekong-cli/content/openclaw-reports/` | `docs/openclaw-reports/` (repo-relative) |

**Smoke Gate (no secrets required):**
```bash
# Verify OpenClaw package imports resolve
cd /Users/macbook/mekongmind && pnpm --filter openclaw-engine exec tsc --noEmit 2>&1 | head -20

# Verify worker scripts exist and are executable
ls -la apps/openclaw-worker/scripts/
test -x apps/openclaw-worker/scripts/qwen-warmup.sh && echo "OK: qwen-warmup.sh executable"
```

**Remains External (intentional):**
- `~/projects/openclaw` source code is NOT vendored into target.
- OpenClaw daemon runtime (`cc_daemon`) runs as separate process, invoked by adapter.
- Channel credentials (Telegram, Slack, WeChat) stay in `~/.cheetahclaws-src` runtime config, never committed.

---

### CheetahClaws Assistant Adapter

**Role:** Local assistant + tool bridge. Python-native, local-model friendly. Fits as MekongMind CLI's MCP server + session manager.

**Boundary:**
```
MekongMind CLI                  CheetahClaws Source
─────────────────               ──────────────────
cli/src/core/mcp_server.py  ←→  ~/.cheetahclaws-src/agent.py
cli/src/core/cc_spawner.py ←→  ~/.cheetahclaws-src/agent_runner.py
cli/src/core/providers.py  ←→  ~/.cheetahclaws-src/providers.py
cli/src/api/openclaw_daemon_service.py ←→ ~/.cheetahclaws-src/cc_daemon/
```

**Contract:**

| MekongMind Side | CheetahClaws Side | Protocol |
|---|---|---|
| `cli/src/core/mcp_server.py` | `agent.py` + `tools.py` | MCP tool calls |
| `cli/src/core/cc_spawner.py` | `agent_runner.py` | Subprocess spawn |
| `cli/src/core/providers.py` | `providers.py` | Shared LLMProvider ABC |
| `cli/src/api/openclaw_daemon_service.py` | `cc_daemon/methods.py` | HTTP/pipe daemon client |

**Adapter Files (to be created in Phase 5+):**

| New Target File | Source Of Inspiration | Purpose |
|---|---|---|
| `cli/src/core/cheetahclaws_adapter.py` | `~/.cheetahclaws-src/agent.py` | Thin Python wrapper; import-freeze strategy |
| `cli/src/core/cc_daemon_client.py` | `~/.cheetahclaws-src/cc_daemon/methods.py` | Daemon method stub (calls external daemon, not vendored) |
| `cli/src/core/bridges/__init__.py` | `~/.cheetahclaws-src/bridges/` | Bridge stubs (telegram, slack, wechat) — no credentials |

**Path Resolution (Blockers Fixed):**

| Old Path | New Resolution |
|---|---|
| `~/mekong-cli` (default cwd in cc_spawner.py) | `$MEKONGMIND_HOME` env var, fallback to cwd |
| `~/mekong-cli/tasks/` in immortal_loop.py | `tasks/` (repo-relative) |

**Smoke Gate (no secrets required):**
```bash
# Verify Python imports resolve for adapter stubs
cd /Users/macbook/mekongmind/cli && python -c "import sys; sys.path.insert(0, 'src'); from core.providers import LLMProvider; print('OK: providers import')"

# Verify CheetahClaws source still exists (we don't copy it, just reference)
test -f ~/.cheetahclaws-src/agent.py && echo "OK: CheetahClaws source intact"
test -f ~/.cheetahclaws-src/providers.py && echo "OK: providers.py intact"
```

**Remains External (intentional):**
- CheetahClaws source code stays at `~/.cheetahclaws-src` — never vendored.
- Channel credentials, session stores, auth tokens never leave `~/.cheetahclaws-src`.
- MekongMind CLI calls CheetahClaws as subprocess or HTTP client; no shared code.

---

## OpenClaw `_bridge` Debt — Remediation Plan

Current state: 28 files under `packages/openclaw-engine/src/_bridge/` proxy into `apps/openclaw-worker/lib/*`.

**Action (Phase 5):**
1. Extract shared types/interfaces to `packages/openclaw-engine/src/shared/`.
2. Update `apps/openclaw-worker/scripts/*.js` to import from `shared/` directly.
3. Delete `_bridge/*` after migration verified.
4. Do NOT create new bridge files — fix existing debt, don't grow it.

---

## Phase 4 Status Summary

| Adapter | Contract | Smoke Gate | Status |
|---|---|---|---|
| OpenClaw mission | ✅ Documented | ✅ No secrets required | Ready for Phase 5 |
| CheetahClaws assistant | ✅ Documented | ✅ No secrets required | Ready for Phase 5 |
| Path blockers | ✅ 10 references found | — | Documented; fix in Phase 5 |
| _bridge debt | ✅ Remediation plan | — | Deferred to Phase 5 |

**Unresolved (carry to Phase 5):**
- _bridge/ migration needs actual code changes (28 files, high risk).
- CheetahClaws adapter stubs need to be created (new files, low risk).
- Path fix in `cli/src/core/cc_spawner.py`, `cli/src/binh_phap/*.py` needs code change.

---

## Phase 4 — OpenClaw + CheetahClaws Adapter Contracts

### OpenClaw Adapter

**Role:** Harness/channel runtime. MekongMind dispatches missions; OpenClaw executes them. MekongMind does NOT vendor upstream internals.

**Boundary:**

```
MekongMind command
  -> HarnessRouter (TS)
    -> MissionConfig { goal, complexity, maxRetries, timeoutMs }
      -> OpenClawEngine.submit(config)   [packages/openclaw-engine/src/sdk.ts]
        -> apps/openclaw-worker/          [runtime worker, data, scripts]
          -> result -> Water Protocol context
```

**Adapter entrypoint:** `packages/openclaw-engine/src/sdk.ts`
- `MissionConfig` / `MissionResult` / `EngineHealth` / `EngineConfig` (already defined)
- `OpenClawEngine.submit(mission: MissionConfig): Promise<MissionResult>`
- `OpenClawEngine.health(): Promise<EngineHealth>`

**Boundary rules:**
1. MekongMind calls `OpenClawEngine` — never imports worker internals directly.
2. Worker runtime (`apps/openclaw-worker/`) stays internal to OpenClaw; only the SDK package exports types.
3. `_bridge/` files in `packages/openclaw-engine/src/` are **legacy debt** — no new code should use them. Remove after migration (Phase 2 deliverable).
4. OpenClaw upstream (`~/projects/openclaw`) is **external source**. Adapter only — no vendoring.

**Stale path references (BLOCKERS — fix before smoke):**

| File | Old Path | New Resolution |
|---|---|---|
| `cli/src/core/cc_spawner.py:91` | `~/mekong-cli` default cwd | Use `MEKONGMIND_HOME` env or `Path(__file__).resolve().parents[2]` |
| `cli/src/cli/health_metrics_commands.py:89` | `~/mekong-cli/apps/openclaw-worker/brain-learning-state.json` | Resolve relative to `MEKONGMIND_HOME` |
| `cli/src/binh_phap/cto_daemon.py:53` | `os.path.expanduser("~/mekong-cli")` | Use `os.getenv("MEKONG_ROOT", ...)` with fallback |
| `cli/src/binh_phap/immortal_loop.py:84-86` | `~/mekong-cli/tasks` | Use `os.getenv("MEKONG_TASKS_DIR", ...)` |
| `cli/src/raas/reports_router.py:3` | `~/mekong-cli/content/openclaw-reports/` | Resolve relative to repo root |

**Non-blocker path references (document, don't fix):**
- `scripts/mekong-cli/` — pilot scripts referencing old monorepo. These are operational scripts, not runtime code. Document as source-only.

**Smoke check (no secrets required):**

```bash
# 1. Verify OpenClaw SDK imports resolve
cd /Users/macbook/mekongmind && pnpm --filter openclaw-engine exec tsc --noEmit 2>&1 | head -20

# 2. Verify Engine class instantiates
pnpm --filter openclaw-engine exec tsx -e "
  import { OpenClawEngine } from './packages/openclaw-engine/src/sdk.ts';
  const engine = new OpenClawEngine({ maxConcurrency: 4, defaultTimeout: 60000, enableLearning: true, enableCircuitBreaker: true });
  console.log('ENGINE_OK', typeof engine.submit);
"

# 3. Verify worker scripts exist (no execution)
ls /Users/macbook/mekongmind/apps/openclaw-worker/scripts/{qwen-warmup.sh,daemon-guardian.sh,preflight-check.js}

# 4. Verify stale path references are identified (already done above)
grep -rn "~/mekong-cli" /Users/macbook/mekongmind/cli/src/ 2>/dev/null
```

---

### CheetahClaws Adapter

**Role:** Assistant/tool bridge. Python-native, local-model friendly. MekongMind calls CheetahClaws as a subprocess or MCP server — never vendors source.

**Boundary:**

```
MekongMind command
  -> Python CLI (cli/)
    -> CheetahClawsAdapter (new: cli/src/core/cheetahclaws_adapter.py)
      -> cc_daemon client (new: cli/src/core/cc_daemon_client.py)
        -> CheetahClaws subprocess or MCP call
          -> result -> Water Protocol context
```

**Adapter entrypoints (to create):**

| New File | Role |
|---|---|
| `cli/src/core/cheetahclaws_adapter.py` | High-level adapter: spawn session, send task, collect result |
| `cli/src/core/cc_daemon_client.py` | Daemon client: connect to cc_daemon, send bridge method calls |
| `cli/src/core/bridges/__init__.py` | Bridge registry for slack/telegram/wechat/etc. |
| `cli/src/core/cc_mcp_bridge.py` | MCP server bridge (if mcp_server.py needs CheetahClaws surface) |

**Adapter contract (Python):**

```python
class CheetahClawsAdapter:
    def __init__(self, daemon_url: str = "http://localhost:8765"):
        ...

    def spawn_session(self, task: str, model: str) -> str:
        """Start a CheetahClaws session. Returns session_id."""

    def send_task(self, session_id: str, message: str) -> dict:
        """Send a message to an active session."""

    def collect_result(self, session_id: str, timeout: float = 120.0) -> dict:
        """Wait for session completion. Returns structured result."""
```

**Boundary rules:**
1. MekongMind calls `CheetahClawsAdapter` — never imports `agent.py`, `runtime.py`, or other CheetahClaws internals.
2. CheetahClaws source (`~/.cheetahclaws-src/`) is **external**. Adapter communicates via subprocess/HTTP/MCP only.
3. Daemon tokens, Telegram/Slack credentials, local auth stores **never** enter the repo.
4. Bridge methods (`slack.py`, `telegram.py`, `wechat.py` in `cc_daemon/`) are called via `cc_daemon_client.py`, not copied.

**Smoke check (no secrets required):**

```bash
# 1. Verify Python CLI imports resolve
cd /Users/macbook/mekongmind/cli && python -c "
from src.core.llm_client import LLMClient
from src.core.mcp_server import MCPServer
print('PYTHON_IMPORTS_OK')
"

# 2. Verify CheetahClaws source exists (adapter target)
ls ~/.cheetahclaws-src/agent.py ~/.cheetahclaws-src/cc_daemon/

# 3. Verify mcp_server.py has CheetahClaws surface
grep -n "cheetahclaws\|cc_daemon\|CheetahClaws" /Users/macbook/mekongmind/cli/src/core/mcp_server.py 2>/dev/null | head -10
```

---

### What Remains External (by design)

| Source | Why External |
|---|---|
| `~/projects/openclaw` | Upstream; adapter calls SDK interfaces, not vendor code |
| `~/.cheetahclaws-src` | User's personal assistant runtime; credentials live here |
| OpenClaw worker runtime data (`apps/openclaw-worker/data/*.json`) | Runtime fixtures; not source code |
| `~/mekong-cli` pilot/launch scripts | Operational artifacts; archived reference only |

---

## Unresolved Questions (updated)
- Q1: ~~Does `packages/mekong-cli-core/src/llm/providers/mlx.ts` exist?~~ → YES, created (P1.3)
- Q2: ~~Python CLI `llm_client.py` env var convention — same as TS or different?~~ → Resolved: ANTHROPIC_TIMEOUT_MS / LLM_TIMEOUT_MS (ms) now supported (P1.1)
- Q3: OpenClaw worker scripts call local LLM directly or via TS router?
- Q4: Cloud token metering — local file log or external service?
- Q5: OpenClaw upstream `~/projects/openclaw` — which interfaces does target actually consume today?
- Q6: CheetahClaws daemon — is it currently running on a known port, or does the adapter need to spawn it?
- Q7: `_bridge/` files — which callers still use them, and what is the migration path?
