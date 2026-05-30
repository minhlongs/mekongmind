---
title: "Phase 5: Goals Pipeline"
description: "Create MekongMind-specific goals in OpenCode, task tracking, and agent coordination"
status: in_progress
started: 2026-05-29
priority: P2
effort: 1-2h
tags: [goals, opencode, agent-config]
---

# Phase 5: Goals Pipeline

## Context

- **No `.opencode/` directory** at mekongmind root
- **goals.json**: Lives at `~/.config/opencode/goals.json` (global), not repo-local
- **3 existing goals** in global config — all target other projects, not mekongmind
- **No task tracking**: Plans exist as files but no agent-aware task hydration

## Overview

Date: 2026-05-29 | Priority: P2 | Status: 🔄 In Progress | Effort: 1-2h

## Key Insights

- OpenCode's goals pipeline routes goals to execution — without a mekongmind goal, agents have no project-specific context
- Repo-local goals.json (in `.opencode/`) is better than global for per-project goals
- Task tracking for Phase 1-6 is low-effort — just create a `goals.json` pointing to this plan

## Requirements

1. [ ] **Create `.opencode/goals.json`** with MekongMind overhaul as active goal
2. [ ] **Define sub-goals** per phase (Phase 1-6)
3. [ ] **Set up agent context**: AGENTS.md or purpose file for subagent coordination
4. [ ] **Link to plan files**: Each goal references its phase file
5. [ ] **Create session continuity**: Task checkpoint instructions for multi-session work

## Architecture

```
.opencode/
  goals.json      # repo-local goals, overrides global for this project
```

Goals format:
```json
{
  "goals": [
    {
      "title": "MekongMind Monorepo Overhaul",
      "description": "6-phase cleanup from stale monolith to ship-ready",
      "plan": "plans/mekongmind-overhaul/plan.md",
      "subgoals": [
        {"phase": 1, "title": "Foundation", "file": "phase-01-foundation.md"},
        {"phase": 2, "title": "Consolidation", "file": "phase-02-consolidation.md"},
        {"phase": 3, "title": "GTM Ready", "file": "phase-03-gtm-ready.md"},
        {"phase": 4, "title": "Docs Cleanup", "file": "phase-04-docs-cleanup.md"},
        {"phase": 5, "title": "Goals Pipeline", "file": "phase-05-goals-pipeline.md"},
        {"phase": 6, "title": "Orchestration", "file": "phase-06-orchestration.md"}
      ]
    }
  ]
}
```

## Related Code Files

- `~/.config/opencode/goals.json` (global — read-only reference)
- `/Users/macbook/mekongmind/.opencode/` (new directory)
- `/Users/macbook/mekongmind/plans/mekongmind-overhaul/plan.md`
- `/Users/macbook/mekongmind/AGENTS-CLI.md`

## Implementation Steps

1. **Create `.opencode/` directory** (if not done in Phase 1)
2. **Write `.opencode/goals.json`** with the structure above
3. **Verify goals are picked up**: Run OpenCode and check goal listing
4. **Update AGENTS-CLI.md** or create `.opencode/AGENTS.md` for agent instructions

## Todo List

- [ ] Create .opencode/goals.json with mekongmind goal
- [ ] Verify OpenCode picks up the goal
- [ ] Add agent instructions for multi-session continuity
- [ ] Test goal routing with a simple phase task

## Success Criteria

- `opencode` lists "MekongMind Monorepo Overhaul" as active goal
- Each phase is a sub-goal with file reference
- Agent can route from goal → plan → phase → implementation

## Risk Assessment

- **goals.json schema**: OpenCode's goals format may change — check current `.opencode/goals.json` syntax
- **Global vs local**: If OpenCode doesn't support repo-local goals.json, this phase is OBE

## Security Considerations

None — just configuration files, no credentials.

## Next Steps

Phase 6: Orchestration — CI/CD, deployment, monitoring for the overhauled codebase.
