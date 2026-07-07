# /quality-gate

Run a quality compliance gate review before marking any feature "done".

Usage: `/quality-gate` (no arguments — scans mvp/ automatically)

Steps:
1. Run sops/departments/quality-compliance.md audit against all changes since last commit
2. Check for security vulnerabilities, code smells, test gaps
3. Report findings as structured JSON with severity levels
4. Block handoff to next department if critical issues found

Use when ready to claim a feature complete and need evidence for engineering-factory gate.
