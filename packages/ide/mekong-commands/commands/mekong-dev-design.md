---
description: "Dev design command. Delegates to worker level."
agent: build
---

# /dev:design — Developer Level

**Developer execution command** — code generation and quality.

## Pipeline

DELEGATION: dev:design → worker:*
OUTPUT: reports/dev/design/

## Execution

Load recipe: recipes/dev/design.json

Execute DAG groups in dependency order.

## Goal context

<goal>$ARGUMENTS</goal>
