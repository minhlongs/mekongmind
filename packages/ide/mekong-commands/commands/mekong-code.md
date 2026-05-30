---
description: "Code generation from spec — architecture, implementation, tests. 3 steps, ~20 min."
agent: build
---

# /engineering:code — Code Generator

**Super command** — chains steps via DAG pipeline.

## Pipeline

```
SEQUENTIAL:
  ├── architecture-plan       → design.md
  ├── implementation          → src/
  └── test-generation         → tests/
```

## Output directory: reports/engineering/code/
