---
description: "Growth metrics dashboard — acquisition, activation, retention, revenue, referral. 2 steps, ~12 min."
agent: build
---

# /growth:growth-metrics — Growth Metrics

**Super command** — chains steps via DAG pipeline.

## Pipeline

```
SEQUENTIAL:
  ├── metrics-collection      → raw-metrics.md
  └── dashboard-assembly      → growth-dashboard.md
```

## Output directory: reports/growth/growth-metrics/
