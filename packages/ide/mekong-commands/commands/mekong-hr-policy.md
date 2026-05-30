---
description: "HR policy drafting — policy structure, compliance check, approval workflow. 3 steps, ~20 min."
agent: build
---

# /hr:hr-policy — HR Policy Draft

**Super command** — chains steps via DAG pipeline.

## Pipeline

```
SEQUENTIAL:
  ├── policy-research         → benchmarks.md
  ├── policy-draft            → policy.md
  └── compliance-review       → review-notes.md
```

## Output directory: reports/hr/hr-policy/
