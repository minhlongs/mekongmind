# Phase 04: OpenClaw + CheetahClaws Integration

## Context Links

- OpenClaw package: `packages/openclaw-engine/`
- OpenClaw worker: `apps/openclaw-worker/`
- Python MCP server: `cli/src/core/mcp_server.py`
- CheetahClaws source: `/Users/macbook/.cheetahclaws-src`

## Overview

Priority: P0. Status: ready. Duration: 1 day.

Make OpenClaw and CheetahClaws first-class harness adapters inside MekongMind, with stable boundaries and no broad vendoring.

## Key Insights

- OpenClaw upstream is a personal assistant/gateway; MekongMind should use it as harness/channel runtime, not copy all internals.
- CheetahClaws is Python-native and local-model friendly; it fits as an assistant/tool bridge.
- Existing `_bridge` files in `openclaw-engine` prove current boundary is leaky.

## Requirements

- Define adapter contracts in `docs/harness-engineering.md`.
- Replace stale path references only where they block current runtime.
- Create clear smoke checks for OpenClaw and CheetahClaws availability.

## Architecture

```
MekongMind command -> Harness adapter -> OpenClaw mission or CheetahClaws session -> result -> Water Protocol context
```

## Related Code Files

- Candidate modify: `packages/openclaw-engine/src/_bridge/*`
- Candidate modify: `apps/openclaw-worker/scripts/*.sh`
- Candidate modify: `cli/src/api/openclaw_daemon_service.py`
- Candidate create: adapter docs before adapter code.

## Implementation Steps

1. Write adapter contract: command input, execution boundary, output schema.
2. Identify direct path references to old `~/mekong-cli`.
3. Replace only blockers with `MEKONGMIND_HOME` or repo-relative resolution.
4. Add smoke checks that do not require live external accounts.
5. Document what remains intentionally external.

## Todo List

- [ ] Define OpenClaw mission adapter.
- [ ] Define CheetahClaws assistant adapter.
- [ ] Reduce stale path blockers.
- [ ] Add non-secret smoke checks.
- [ ] Save integration report.

## Success Criteria

- OpenClaw and CheetahClaws roles are understandable from docs.
- No one needs to guess whether to edit app, package, or external repo.
- Stale `~/mekong-cli` references are either fixed or documented as source-only.

## Risk Assessment

- Risk: copying upstream assistant code creates maintenance drag. Mitigation: adapter-first contract.
- Risk: daemon/channel credentials leak. Mitigation: smoke checks avoid secrets.

## Security Considerations

OpenClaw/CheetahClaws channel tokens, daemon tokens, Telegram/Slack credentials, and local auth stores must never be copied into repo.

## Next Steps

Proceed to Phase 05 after adapters have docs and smoke gates.

