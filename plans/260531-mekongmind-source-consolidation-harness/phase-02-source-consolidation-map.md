# Phase 02: Source Consolidation Map

## Context Links

- Inventory: `source-inventory.md`
- Target docs: `README.md`, `docs/system-architecture.md`, `docs/codebase-summary.md`

## Overview

Priority: P0. Status: ready. Duration: 1 day.

Turn inventory into a concrete source-to-target map. This is the safe migration contract Claude follows before touching imports.

## Key Insights

- Source repos should remain intact until target gates pass.
- OpenClaw and CheetahClaws should be integrated through adapters, not whole-repo vendoring.
- Existing bridge proxies in `packages/openclaw-engine/src/_bridge` show boundary debt.

## Requirements

- Create `docs/source-consolidation-map.md`.
- List source path, target path, conflict resolution, and verification command.
- Separate code migration from documentation import.

## Architecture

```
external source -> inventory decision -> target path -> import/build gate
```

## Related Code Files

- Create: `docs/source-consolidation-map.md`
- Update only if necessary: `pnpm-workspace.yaml`, `package.json`, `docs/codebase-summary.md`
- Do not rename packages until conflict map is approved.

## Implementation Steps

1. Generate source-to-target table for each repo.
2. Map duplicate app/package names.
3. Identify boundary fixes needed before code import.
4. Add one command gate per target path.
5. Document exclusions with reason.

## Todo List

- [ ] Map Mekong CLI apps/packages.
- [ ] Map Mekong IDE apps/packages.
- [ ] Map Go/Rust engine.
- [ ] Map OpenClaw adapter surface.
- [ ] Map CheetahClaws adapter surface.

## Success Criteria

- Claude can tell exactly where each source component lands.
- No target path has two owners.
- Every conflict has a decision.

## Risk Assessment

- Risk: package name collisions. Mitigation: target map must name owner first.
- Risk: over-vendoring. Mitigation: adapter-first rule.

## Security Considerations

Do not copy secrets, local daemon tokens, or personal channel credentials from OpenClaw/CheetahClaws.

## Next Steps

Proceed to Phase 03 after target map is accepted by passing dry-run checks.

