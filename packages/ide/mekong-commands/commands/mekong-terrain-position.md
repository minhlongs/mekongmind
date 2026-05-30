---
description: "Competitive positioning analysis per terrain type"
agent: build
---

# /terrain:position — Competitive Position

**IC super command** — Competitive positioning analysis per terrain type

## Pipeline

```
SEQUENTIAL: map-competitors → assess-position → recommend-moves
```

## Trigger

Runs recipe `recipes/terrain/position.json` through DAGScheduler.

## Execution

1. Load recipe DAG definition
2. Execute DAG groups in dependency order
3. Compile results into summary report

## Usage

```
/terrain:position [goal]
```

## Estimated: 3 credits, 10 minutes

## Goal context
<goal>$ARGUMENTS</goal>

Pass this goal to every sub-command as context for their analysis.
