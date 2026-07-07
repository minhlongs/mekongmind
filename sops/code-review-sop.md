# SOP: Code Review (Harness Engineering) > MEKONG_WRAPPER SOP | Status: Active | Owner: code-reviewer agent

## Purpose
Standard Operating Procedure for performing a code review on a me-deep-wrapper change (agent prompt, lib script, bash dispatch, test) using the Review + Refine harness. Ensures the change matches the spec, does not regress the dispatch contract, and has a test.

## Trigger
- PR opened against `main` that touches any of:
  - `sops/*.md`
  - `lib/agent-patterns.sh`
  - `/usr/local/bin/me`
  - `agents/registry.json`
  - `tests/**`
- Reviewer assigned to the PR.
- `me review --pr <number>` is invoked by a developer.

## Harness Pattern: Review + Refine (iterative)
```
[Spec] → [Audit] → [Remediate] → [Re-audit] → [Approve]
```

## Steps
1. **Load SOP and spec** — confirm the PR description contains a reference to the SOP that governs the change. If no SOP is referenced, request the author to link one.
2. **Run the test suite** — `bash tests/run.sh` (or equivalent). A code review must not approve a red test suite. If the suite passes on main but fails on the PR branch, treat as a regression.
3. **Audit dispatch contract** — ensure the change does not break the `/idea` contract:
   - `resolved_agent` must still resolve to an existing agent definition.
   - `pattern_label` must still be set by `apply_harness_pattern`.
   - Goal must still be written to `state/goal-YYYYmmdd-HHMMSS.md`.
4. **Audit lib scripts** — for changes in `lib/`, confirm:
   - No unquoted variable expansion in bash.
   - No `eval` or dynamic source of untrusted paths.
   - No regression in `resolve_agent`/`apply_harness_pattern` return-value contract (first arg = agent name, second = goal description).
5. **Audit SOPs** — confirm the SOP header format is `# SOP: <Name> > MEKONG_WRAPPER SOP | Status: <Active|Draft> | Owner: <agent>` and that the `## Trigger` section lists at least one concrete CLI invocation.
6. **Write or update test** — add or extend a test in `tests/` for the changed behavior. Test must be a bash script that returns 0 on success and prints a diagnostic message on failure.
7. **Refine** — if audit fails, send findings back to the author with:
   - A bullet list of each finding (file, line, issue).
   - A suggested remediation for each finding.
   - Re-run steps 1–6 after the author pushes an update.
8. **Approve** — once all checks pass, comment `LGTM` on the PR and set the label `approved`.

## Success Criteria
- Test suite green (exit 0).
- No unquoted-variable or eval findings in lib changes.
- SOP header and Trigger section valid.
- Author acknowledged each finding.

## Failure Policy
- If the PR modifies dispatch logic and tests are not updated, do not approve. Send back with finding "dispatch logic changed without test update".
- If the PR modifies `agent-patterns.sh` and `apply_harness_pattern` return-value contract is broken, block merge until the contract is restored or all call sites are updated.
- Two consecutive review-refine cycles without convergence: escalate to project owner.

## CLI
```bash
me review --pr <number> --sop sops/code-review-sop.md
me chain "bash tests/run.sh && me review --pr <number>"
```

## Owner
`code-reviewer` agent in Quality & Compliance.

## Scope
Review one active project change against its SOP, tests, dispatch contracts, and evidence gates.

## Preconditions
- Active project root confirmed with `pwd`.
- PR or local diff identified.
- Governing SOP and expected validation commands identified.

## Procedure
Use the existing `## Steps` section as the procedure.

## Evidence Contract
Review is complete only when findings, test output, affected contracts, and approval/block decision are recorded for the active project change.

## Required Evidence Fields
- `goal_id`, `change_target`, `tests_run`, `findings`, `decision`, `blocked_work`, `reviewer`.

## Acceptance Criteria
Use the existing `## Success Criteria` section as acceptance criteria.

## Stop Conditions
- Tests cannot be run or their scope is unknown.
- Dispatch or evidence contracts regress.
- Required SOP reference is missing.

## Escalation
Escalate repeated review/refine failure to CEO Command.

## CLI Inspection Commands
```bash
pwd
me goal show
me solo gates verify --strict
me solo gates reconcile
```
