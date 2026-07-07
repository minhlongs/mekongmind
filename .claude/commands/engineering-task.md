# /engineering-task

Execute a code task aligned with the engineering-factory SOP gate.

Usage: `/engineering-task <task-description>`

Steps:
1. Check if mvp-live gate evidence exists (offer-validated.json must be present)
2. Read sops/departments/engineering-factory.md for current SOP cells requirements
3. Execute task using Claude Code print mode with appropriate model selection
4. Run build + tests after implementation
5. Output summary artifact to state/evidence/ matching engineering-factory contract fields

Use when building new features, fixing bugs in mvp/, or implementing integration logic.
