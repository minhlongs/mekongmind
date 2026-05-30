---
description: "Dev refactor command. Delegates to worker level."
agent: build
---

# /dev:refactor — Developer Level

**Developer execution command** — code generation and quality.

## Pipeline

DELEGATION: dev:refactor → worker:*
OUTPUT: reports/dev/refactor/

## Execution

Load recipe: recipes/dev/refactor.json

Execute DAG groups in dependency order.

## Goal context

<goal>$ARGUMENTS</goal>
