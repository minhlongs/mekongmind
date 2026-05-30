---
description: "Job requirements, candidate search, outreach. 2 commands, ~10 min."
agent: build
---

# /recruiter:source — Candidate Sourcing

**IC super command** — chains 2 commands via DAG pipeline.

## Pipeline

```
[process] ─────────────────────────────────────── SEQUENTIAL
  ├── leadgen --talent         → candidate-list.md
  └── email --recruit          → outreach-sent.md
```

## Estimated: 5 credits, 10 minutes

## Execution

Load recipe: `recipes/recruiter/source.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>
