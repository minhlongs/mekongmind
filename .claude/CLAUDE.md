# me-deep-wrapper — Claude Code Project Context

## Project: MEKONG Wrapper (Solo Company Orchestrator)

Universal CLI wrapper combining Mekong CLI + ClaudeKit + Claude Code CLI into one agentic platform targeting first $1M MRR.

Tech stack: Next.js (mvp/), shell scripts (lib/), JSON state management, Ollama local LLM
Agent framework: 58 unified agents across 10 departments via registry.json
Orchestrator pattern: department SOP gates with evidence contracts

## Architecture Overview

```
user idea → me CLI → mekong mind CLI → agent registry → Claude Code CLI execution → state/ artifacts
```

MEKONG wrapper maps commands to agents via `agents/registry.json`. Each agent belongs to a department. Departments have SOP gates that produce evidence artifacts in `state/`. Claude Code is the **Engineering Factory Engine** — it executes code tasks and produces source, tests, and build outputs that feed into engineering-factory SOP gate.

## Tech Stack

- mvp/: Next.js project (frontend + backend)
- lib/*.sh: Shell scripts for agent routing and goal execution
- agents/registry.json: 58 unified agents with department mapping
- sops/departments/*.md: Department-specific standard operating procedures
- state/gates/, state/departments/, state/products/: Durable memory artifacts

## Claude Code Integration Rules

### 1. Always work in mvp/ for code changes

```bash
cd /Users/macbook/Documents/me-deep-wrapper/mvp
claude -p "Build feature X" --allowedTools "Read,Write,Bash" --max-turns 10
```

Never modify files outside of mvp/ unless explicitly asked. The root directory is configuration and orchestration only.

### 2. Follow department SOP gates before building

Check `sops/departments/engineering-factory.md` for build requirements:
- Translate offer scope into routes, APIs, database objects first
- Implement smallest production-capable workflow with REAL integrations (no mock-only success paths)
- Add checkout, analytics, error states, operational hooks required for sales
- Run build command and tests BEFORE handing off

Evidence contract requires these fields before gate passes:
`routes`, `apis`, `data_model`, `integrations`, `checkout_path`, `build_command`, `tests_run`, `known_risks`

### 3. Output artifacts must validate against evidence contracts

When Claude Code produces code, it should also produce a summary artifact:

```json
{
  "routes": ["GET /api/products", "POST /api/checkout"],
  "apis": ["product-service", "checkout-service"],
  "data_model": {"products": "id,name,price", "orders": "id,status,total"},
  "integrations": ["stripe-checkout", "postgres-db"],
  "checkout_path": "/products → /cart → /checkout/success",
  "build_command": "npm run build && npm test",
  "tests_run": true,
  "known_risks": ["TODO: webhook handling for refunds"]
}
```

Save this to `state/evidence/` directory corresponding to the current department gate.

### 4. Use print mode (-p) for automated tasks

For MEKONG wrapper orchestration, prefer `claude -p` over interactive mode:
- No dialog handling needed (skip workspace trust, permission confirmations)
- Structured JSON output for artifact validation
- Faster execution with --max-turns limit
- Use --allowedTools to restrict Claude's tool access

Example:
```bash
claude -p "Fix the auth bug in src/auth.ts" --allowedTools "Read,Edit,Bash" --max-turns 5
```

### 5. Never auto-modify state/ without gate validation

Claude Code must NOT directly write to `state/gates/` or `state/departments/`. Only the MEKONG wrapper CLI (via `/usr/local/bin/me`) manages those files. Claude Code produces code artifacts and build outputs; the orchestrator validates and writes evidence contracts.

### 6. Context window management is critical

MEKONG wrapper has a large codebase with:
- 10 department SOPs (~5KB each)
- 58 agent definitions in registry.json
- mvp/ Next.js project with many dependencies
- 1166+ product evidence artifacts

Use `/compact` when context exceeds 70%. Use `--json-schema` for structured outputs. Pipe specific files instead of asking Claude to read everything.

### 7. Model selection by task complexity

```bash
# Simple: fix typo, add logging — use haiku or sonnet
claude -p "Add error message to login form" --model claude-sonnet-4-6 --max-turns 3

# Medium: build new API endpoint, write tests — use opus
claude -p "Build /api/products endpoint with POSTGRES integration" --model claude-opus-4-0-20250514 --max-turns 10

# Complex: full-stack feature with checkout flow — use opus with max effort
claude -p "Build complete product checkout flow" --effort high --max-turns 15
```

## Department Mapping for Claude Code

| Department | SOP File | Claude Code Responsibility |
|---|---|---|
| engineering-factory | sops/departments/engineering-factory.md | Write source code, tests, build outputs |
| quality-compliance | sops/departments/quality-compliance.md | Review existing code against standards |
| platform-operations | sops/departments/platform-operations.md | Configure deploy hooks, CI/CD scripts |

## Code Standards

1. TypeScript for all mvp/ code — no JavaScript allowed unless migrating legacy files
2. Next.js App Router pattern (not Pages Router) — use server components by default
3. TailwindCSS for styling — follow the existing design system in mvp/app/globals.css
4. Environment variables stored in .env.local — never commit real credentials
5. Error handling: try/catch with custom error types, not generic catch blocks
6. Testing: Jest + React Testing Library for unit tests; Playwright for E2E

## Git Workflow

```bash
git add mvp/
git commit -m "feat: [description] — closes SOP gate evidence"
```

Always include SOP gate reference in commit messages when applicable (e.g., `closes engineering-factory/mvp-live gate`).

## Pitfalls to Avoid

- Don't over-engineer MVP features. Build the minimum sellable workflow first.
- Don't use mock data for production integrations. Use real APIs or explicit sandboxes only.
- Don't skip tests. Every feature must have at least one test file.
- Don't create new files in root/ — keep everything in mvp/, sops/, state/, etc. as appropriate.
