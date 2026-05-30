---
description: "Data analysis query — SQL/query generation, execution plan, result interpretation. 2 steps, ~10 min."
agent: build
---

# /data:data-query — Data Query Analyst

**Super command** — chains steps via DAG pipeline.

## Pipeline

```
SEQUENTIAL:
  ├── query-generation        → query.sql
  └── result-interpretation   → analysis.md
```

## Output directory: reports/data/data-query/
