# Phase 01: Inventory + Canonical Manifest

## Context Links

- Plan: `plans/260531-mekongmind-source-consolidation-harness/plan.md`
- Inventory: `plans/260531-mekongmind-source-consolidation-harness/source-inventory.md`
- Existing external plan: `/Users/macbook/plans/mekongmind-consolidation/plan.md`

## Overview

Priority: P0. Status: ready. Duration: 1 day.

Create a current-state manifest before moving code. This phase decides what MekongMind owns, what is source-only, and what must be archived.

## Key Insights

- Target repo already contains much of the old Mekong stack, but docs disagree on app counts.
- Dirty worktree means current state must be inspected before any edit.
- Several sources still exist outside the monorepo and must be diffed, not blindly copied.

## Requirements

- Produce machine-readable source manifest.
- Mark every source path as `keep`, `merge`, `adapter`, or `archive`.
- Record dirty worktree risks without reverting them.

## Related Code Files

- Modify: `plans/260531-mekongmind-source-consolidation-harness/source-inventory.md`
- Create: `plans/260531-mekongmind-source-consolidation-harness/reports/inventory-report.md`
- Do not modify source repos.

## Implementation Steps

1. Run `git status --short` in target repo and each git-backed source.
2. Count apps/packages/docs/commands from target and source repos.
3. Compare root docs: target README, source README, source CLAUDE/AGENTS.
4. Update `source-inventory.md` with evidence and decisions.
5. Create an inventory report with unresolved conflicts.

## Todo List

- [ ] Refresh app/package/source counts.
- [ ] Identify duplicate app names.
- [ ] Identify old path references to `~/mekong-cli`.
- [ ] Mark source repo decisions.
- [ ] Save report.

## Success Criteria

- Inventory file covers all external paths named in the plan.
- Every source has decision + evidence.
- No code moved yet.

## Risk Assessment

- Risk: accidental cleanup of unrelated dirty files. Mitigation: read-only commands only.
- Risk: stale docs drive wrong decisions. Mitigation: prefer filesystem and package manifests.

## Security Considerations

Do not read `.env`, private keys, or token files. Redact credential-like values in reports.

## Next Steps

Proceed to Phase 02 only after inventory decisions are explicit.

