---
description: "Dev audit command. Delegates to worker level."
agent: build
---

# /dev:audit — Developer Level

**Developer execution command** — code generation and quality.

## Pipeline

DELEGATION: dev:audit → worker:*
OUTPUT: reports/dev/audit/

## Execution

Load recipe: recipes/dev/audit.json

Execute DAG groups in dependency order.

## Goal context

<goal>$ARGUMENTS</goal>
