# Phase 03: Local LLM Harness Runtime

## Context Links

- TS router: `packages/mekong-cli-core/src/llm/`
- Python CLI: `cli/src/core/llm_client.py`, `cli/src/core/providers.py`
- OpenClaw scripts: `apps/openclaw-worker/scripts/qwen-warmup.sh`

## Overview

Priority: P0. Status: ready. Duration: 1 day.

Standardize local-first LLM routing so repeated harness work runs on local models and escalates to cloud only by explicit policy.

## Key Insights

- Current repo already supports `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`.
- Local providers exist through Ollama/MLX and TS `local-llm`.
- Cloud burst routing exists but needs one documented contract.

## Requirements

- Create `docs/harness-engineering.md`.
- Define one env contract for local-first and cloud fallback.
- Add or document one smoke command that proves router selection.

## Architecture

```
task intent -> MetaRouter -> local-llm for cheap loop -> Claude/Zunef/OpenRouter escalation -> metering
```

## Related Code Files

- Read: `packages/mekong-cli-core/src/llm/router.ts`
- Read: `packages/mekong-cli-core/src/llm/meta-router.ts`
- Read: `cli/src/core/providers.py`
- Modify only if smoke gate exposes broken routing.

## Implementation Steps

1. Document canonical env vars and fallback order.
2. Define default local model for coding/test loops.
3. Define cloud escalation triggers: long context, planning, failed local verification.
4. Add smoke command to `docs/harness-engineering.md`.
5. Run LLM router unit/import gates.

## Todo List

- [ ] Document local-first env contract.
- [ ] Document cloud escalation policy.
- [ ] Document cost/metering expectations.
- [ ] Verify TS LLM import.
- [ ] Verify Python adapter tests.

## Success Criteria

- A solo operator can set env vars once and know what model handles each harness task.
- Smoke command proves import/routing without requiring secrets.

## Risk Assessment

- Risk: local models fail on big context. Mitigation: explicit cloud escalation.
- Risk: hidden paid calls. Mitigation: local-first defaults and metering proof.

## Security Considerations

Never write API keys to docs or reports. Use env var names only.

## Next Steps

Proceed to Phase 04 once local/cloud routing contract is documented and smoke-tested.

