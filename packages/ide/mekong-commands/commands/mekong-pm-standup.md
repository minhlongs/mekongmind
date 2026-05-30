---
description: "Daily standup report. 1 credit, ~5 min."
agent: build
---

# /pm:standup — Daily Standup

**PM tactical command** — sprint and task management.

## Pipeline

```
DELEGATION: pm:standup → dev:* → worker:*
OUTPUT: reports/pm/standup/
```

## Estimated: 1 credits, ~5 minutes

## Execution

Load recipe: `recipes/pm/standup.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>
