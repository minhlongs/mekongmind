---
description: "Operations status report — uptime, incidents, SLA compliance, team velocity. 2 steps, ~10 min."
agent: build
---

# /ops:ops-status — Operations Status

**Super command** — chains steps via DAG pipeline.

## Pipeline

```
SEQUENTIAL:
  ├── metrics-gather          → ops-metrics.md
  └── status-report           → ops-status.md
```

## Output directory: reports/ops/ops-status/
