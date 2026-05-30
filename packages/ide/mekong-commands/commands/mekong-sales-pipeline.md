---
description: "Sales pipeline build — lead qualification, stage definition, scoring, CRM structure. 3 steps, ~20 min."
agent: build
---

# /sales:sales-pipeline — Sales Pipeline Builder

**Super command** — chains steps via DAG pipeline.

## Pipeline

```
SEQUENTIAL:
  ├── lead-qualification      → icp-criteria.md
  ├── stage-definition        → pipeline-stages.md
  └── scoring-model           → lead-scoring.md
```

## Output directory: reports/sales/sales-pipeline/
