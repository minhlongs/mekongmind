# SOP: Audit Trail Collection > MEKONG_WRAPPER SOP | Status: Active | Owner: code-reviewer agent

## Purpose
Standard Operating Procedure for collecting, hashing, and timestamping an audit trail for a me-deep-wrapper execution. Produces an immutable artifact chain suitable for SOX/ITGC evidence packages.

## Trigger
- `me audit trail` invoked by `code-reviewer` agent after a multi-step execution.
- Automated at the end of `me chain` runs when `MEKONG_AUDIT=1` is set.
- Pre-condition: a `state/goal-YYYYmmdd-HHMMSS.md` file exists for the goal being audited.

## Harness Pattern: Sequential (Pipeline)
```
[Collect] → [Hash] → [Timestamp] → [Sign] → [Archive]
```

## Steps
1. **Identify the goal** — read `state/goal-YYYYmmdd-HHMMSS.md`. Confirm Status is `completed` or `failed`. Do not collect audit trail on `active` goals.
2. **Collect evidence** — gather:
   - `stdout` and `stderr` captured during the execution (stored under `state/logs/<goal-id>/`).
   - Agent definition used for each step (from `agents/registry.json` by agent-id).
   - Harness pattern applied (from `pattern_label` in the goal file).
3. **Hash chain** — for each collected file, compute `sha256sum` and write a `manifest.json`:
   ```json
   {
     "goal_id": "...",
     "collected_at": "...",
     "files": [
       {"path": "...", "sha256": "...", "bytes": 1234}
     ]
   }
   ```
   The manifest itself is included as the last entry so each audit trail is self-referential.
4. **Timestamp** — add a `collected_at` ISO-8601 field (UTC) to the manifest.
5. **Sign (optional)** — if `MEKONG_SIGN_KEY` is set, sign the manifest with `openssl dgst -sha256 -sign "$MEKONG_SIGN_KEY" -out manifest.sig manifest.json` and append `"signature_path": "manifest.sig"`.
6. **Archive** — copy the manifest and all evidence files to `state/audit/<goal-id>/`. Do not modify source files in `state/logs/`.
7. **Record outcome** — update the goal file with `Audit: collected` and the path to the manifest.

## Success Criteria
- `manifest.json` exists at `state/audit/<goal-id>/manifest.json` and is valid JSON.
- Every file listed in the manifest has a matching sha256 and a byte count that matches the actual file.
- `collected_at` is an ISO-8601 UTC timestamp within 5 minutes of collection time.
- Goal file Status is `completed` or `failed` (not `active`).

## Failure Policy
- If `state/logs/<goal-id>/` is empty or missing, fail with error "no logs found for goal" and do not produce an empty manifest.
- If `manifest.json` cannot be parsed on re-read, the collection is considered corrupt; archive to `state/audit/quarantine/<goal-id>/` and escalate.
- If signing is requested but `openssl` is unavailable, emit a warning and continue without a signature.

## CLI
```bash
me audit trail --goal goal-20260601-121117.md
MEKONG_AUDIT=1 me chain "mekong audit-plan SOX; mekong audit-execute"
```

## Owner
`code-reviewer` agent in Quality & Compliance.

## Scope
Audit trail collection for one completed or failed goal in the active project.

## Preconditions
- Active project root confirmed with `pwd`.
- Goal state exists and is `completed` or `failed`.
- Source logs exist under `state/logs/<goal-id>/`.

## Procedure
Use the existing `## Steps` section as the procedure.

## Evidence Contract
The audit trail is complete only when `state/audit/<goal-id>/manifest.json` lists every collected file with path, sha256, byte count, and collection timestamp.

## Required Evidence Fields
- `goal_id`, `collected_at`, `files`, `path`, `sha256`, `bytes`, `manifest_path`.

## Acceptance Criteria
Use the existing `## Success Criteria` section as acceptance criteria.

## Stop Conditions
- Goal is still active.
- Logs are missing.
- Manifest cannot be parsed after writing.

## Escalation
Escalate corrupt manifests, missing logs, or signature failures to Quality & Compliance.

## CLI Inspection Commands
```bash
pwd
me goal show
me solo gates reconcile
```
