---
description: "Dev debug command. Delegates to worker level."
agent: build
---

# /dev:debug — Developer Level

**Developer execution command** — code generation and quality.

## Pipeline

DELEGATION: dev:debug → worker:*
OUTPUT: reports/dev/debug/

## Execution

Load recipe: recipes/dev/debug.json

Execute DAG groups in dependency order.

## Goal context

<goal>$ARGUMENTS</goal>
