---
description: "Identify knowledge gaps and information asymmetries"
agent: build
---

# /intel:blind-spot — Blind Spot Detection

**IC super command** — Identify knowledge gaps and information asymmetries

## Pipeline

```
SEQUENTIAL: map-knowledge → identify-gaps → source-intel
```

## Trigger

Runs recipe `recipes/intel/blind-spot.json` through DAGScheduler.

## Execution

1. Load recipe DAG definition
2. Execute DAG groups in dependency order
3. Compile results into summary report

## Usage

```
/intel:blind-spot [goal]
```

## Estimated: 3 credits, 10 minutes

## Goal context
<goal>$ARGUMENTS</goal>

Pass this goal to every sub-command as context for their analysis.
