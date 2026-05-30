---
description: "Dev scaffold command. Delegates to worker level."
agent: build
---

# /dev:scaffold — Developer Level

**Developer execution command** — code generation and quality.

## Pipeline

DELEGATION: dev:scaffold → worker:*
OUTPUT: reports/dev/scaffold/

## Execution

Load recipe: recipes/dev/scaffold.json

Execute DAG groups in dependency order.

## Goal context

<goal>$ARGUMENTS</goal>
