---
title: "Phase 4: Docs Cleanup"
description: "Prune stale docs, update codebase-summary, comprehensive README, standardize structure"
status: completed
completed: 2026-05-29
priority: P1
effort: 6-12h
tags: [docs, cleanup, documentation]
---

# Phase 4: Docs Cleanup

## Context

- **135 markdown files** across `docs/` — 60+ in `docs/mekong-cli/`, 40+ in `docs/mekong-digital/`
- **Duplicate content**: `project-overview-pdr.md`, `system-architecture.md`, `code-standards.md` exist alongside company-blueprint plan
- **Stale references**: Many docs mention directories like `mekong-cli/` that don't exist at this repo's root (the CLI is at `cli/`)
- **No root README.md**: First-time visitors have no orientation
- **Existing doc structure**: Mix of product docs, marketing templates, audit reports, runbooks — all flat in docs/

## Overview

Date: 2026-05-29 | Priority: P1 | Status: ✅ Completed | Effort: 6-12h

## Key Insights

- 135 files is too many for a project at this stage — 50-60 well-maintained files is healthier
- Many docs are for `mekong-cli` (the Python package) vs `mekongmind` (the monorepo) — need to separate
- Audit reports (260522-*) are specific one-off reviews — should be archived, not in primary docs
- Marketing content (sales enablement, playbooks) belongs in `marketing/` or `plans/marketing/`, not `docs/`

## Requirements

1. [ ] **Categorize all 135 docs** into: Keep / Archive / Delete / Move
2. [ ] **Prune stale/merged/redundant** docs (target: 50-60 files)
3. [ ] **Write root README.md** (if not done in Phase 1) — project overview, CLI, engine, contributing
4. [ ] **Organize docs/ into subdirs**: `docs/cli/`, `docs/architecture/`, `docs/operations/`, `docs/archive/`
5. [ ] **Update codebase-summary** or create fresh one
6. [ ] **Update docs index** (README per docs subdir)
7. [ ] **Create `llms.txt`** (also done in Phase 3 but docs source needed)

## Architecture

```
Before: docs/ (135 flat files)
After:
  docs/
    README.md             # docs index + how to contribute docs
    architecture/         # system-architecture, code-standards, design-guidelines
    cli/                  # CLI reference, commands, quickstart
    operations/           # deployment, runbooks, monitoring
    archive/              # audit reports, superseded plans
  marketing/              # sales playbooks, content calendars (move from docs/)
  plans/                  # active plans (already here)
```

## Related Code Files

- `/Users/macbook/mekongmind/docs/` (entire directory, 135 files)
- `/Users/macbook/mekongmind/AGENTS-CLI.md` (separate from docs/)
- `docs/mekong-cli/codebase-summary.md`
- `docs/mekong-cli/audit/260522-*.md` (candidates for archive)

## Implementation Steps

1. **Batch 1 — Archive**: Move audit reports (260522-*), superseded plans to `docs/archive/`
2. **Batch 2 — Move**: Move marketing content to `marketing/` (sales-enablement, playbooks)
3. **Batch 3 — Merge**: Consolidate duplicate docs (e.g., 3 system-architecture files → 1)
4. **Batch 4 — Restructure**: Create subdirectories with README files
5. **Batch 5 — Update**: Refresh codebase-summary, CLI reference, etc. to match current structure
6. **Batch 6 — LLMs.txt**: Generate comprehensive llms.txt from surviving docs
7. **Final — Delete**: Remove docs/archive path if unused, prune empty directories

## Todo List

- [ ] Classify all 135 docs (keep/move/archive/delete)
- [ ] Move audit reports to docs/archive/
- [ ] Move marketing content to marketing/
- [ ] Merge duplicate architecture docs
- [ ] Create docs subdirectory structure
- [ ] Write/update codebase-summary
- [ ] Refresh CLI reference docs
- [ ] Generate llms.txt from docs
- [ ] Delete truly obsolete files

## Success Criteria

- Root README.md exists and is useful
- docs/ has < 70 files organized in subdirectories
- No broken internal doc links
- codebase-summary.md accurately reflects monorepo structure
- llms.txt is valid per llmstxt.org spec

## Risk Assessment

- **Deletion regret**: Archive instead of delete for anything uncertain — move to `docs/archive/`
- **Time sink**: 135 files × 3min each = 6.75h minimum — respect the effort estimate
- **External docs references**: If GitHub wiki or external sites reference docs paths, those break

## Security Considerations

- Audit docs may contain vulnerability details — keep in archive, don't delete
- Remove any `.env` examples, API keys, or secrets that may have leaked into docs
- Marketing templates with client names — verify no confidential data in archived docs

## Next Steps

Phase 5: Goals Pipeline — create mekongmind goal tracking in OpenCode.
