# Phase 05: Proof, Docs, Claude Handoff

## Context Links

- Handoff: `claude-handoff.md`
- Root docs: `docs/README.md`, `docs/system-architecture.md`, `docs/codebase-summary.md`

## Overview

Priority: P0. Status: ready. Duration: 1 day.

Convert the restructure into something Claude can execute safely: docs updated, gates defined, unresolved questions listed last.

## Key Insights

- User runs solo, so completion proof must be cheap and repeatable.
- Broad monorepo gates may fail from existing unrelated debt; phase reports must separate old debt from new regression.
- The handoff command is the product of this `/idea` pipeline.

## Requirements

- Update handoff with final commands.
- Add phase reports.
- Run scoped verification gates.
- List unresolved questions at end of final report.

## Related Code Files

- Modify: `claude-handoff.md`
- Modify: `docs/README.md` only if new docs are added.
- Create: `reports/final-handoff-report.md`

## Implementation Steps

1. Run all phase gates and collect output.
2. Update `claude-handoff.md` with exact current commands.
3. Link new docs from `docs/README.md`.
4. Write final report with evidence and unresolved questions.
5. Output `/cook ./plans/260531-mekongmind-source-consolidation-harness/plan.md --auto`.

## Todo List

- [ ] Run TS LLM unit/import checks.
- [ ] Run Python CLI adapter checks.
- [ ] Run engine checks if engine changed.
- [ ] Update docs index.
- [ ] Write final handoff report.

## Success Criteria

- Claude has one command and one plan path.
- Every phase has clear proof gates.
- User can stop reading prose and execute `/cook`.

## Risk Assessment

- Risk: reporting completion with weak evidence. Mitigation: list exact commands and outputs.
- Risk: hiding unresolved decisions. Mitigation: unresolved questions are last section.

## Security Considerations

Final report must not include secrets, guide keys, or local credential values.

## Next Steps

Run the `/cook` command when ready for implementation.

