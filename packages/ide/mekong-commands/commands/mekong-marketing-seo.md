---
description: "SEO analysis — keyword research, competitor analysis, on-page audit, content gaps. 3 steps, ~20 min."
agent: build
---

# /marketing:marketing-seo — SEO Analysis

**Super command** — chains steps via DAG pipeline.

## Pipeline

```
SEQUENTIAL:
  ├── keyword-research        → keywords.md
  ├── competitor-audit        → competitor-analysis.md
  └── content-gaps            → seo-action-plan.md
```

## Output directory: reports/marketing/marketing-seo/
