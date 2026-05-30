---
description: "Board meeting report — KPIs, financial summary, strategic updates, risk register. 4 steps, ~30 min."
agent: build
---

# /venture:board-report — Board Report

**Super command** — chains steps via DAG pipeline.

## Pipeline

```
SEQUENTIAL:
  ├── kpi-extraction          → kpi-dashboard.md
  ├── financial-summary       → financials.md
  ├── strategic-update        → strategy-update.md
  └── risk-register           → risk-summary.md
```

## Output directory: reports/venture/board-report/
