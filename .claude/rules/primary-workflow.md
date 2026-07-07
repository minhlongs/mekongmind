# Primary Workflow — Claude Code Engineering Pipeline

## Overview

This rule defines the standard engineering pipeline for Claude Code when working in me-deep-wrapper. It maps directly to the **engineering-factory SOP** and produces artifacts that feed into the MEKONGmind evidence contract.

## Pipeline Stages

### Stage 1: Technical Design (Before Coding)

Before writing any code, produce a technical design document:
```bash
claude -p "Review sops/departments/engineering-factory.md SOP cells for this feature. Output routes, APIs, data_model, integrations needed as structured JSON." --allowedTools "Read" --max-turns 3 --output-format json > /tmp/tech-design.json
```

Required fields in output: `routes`, `apis`, `data_model`, `integrations` (from SOP gate contract).

### Stage 2: Build Minimum Sellable Workflow

Implement the smallest production-capable workflow with real integrations:
- Follow Next.js App Router pattern
- Use TypeScript strictly — no .js files unless migrating existing ones
- TailwindCSS for styling, follow mvp/app/globals.css design tokens
- Server components by default, client components only when needed

Example command:
```bash
cd /Users/macbook/Documents/me-deep-wrapper/mvp
claude -p "Build the product listing page following Next.js App Router pattern" --allowedTools "Read,Write,Bash" --max-turns 10
```

### Stage 3: Add Checkout and Operations Hooks

Every feature must include:
- Error states (loading, empty, error)
- Analytics hooks (pageview, event tracking)
- Operational metadata (version, environment info)

### Stage 4: Build Validation

Run build + tests before claiming completion:
```bash
cd /Users/macbook/Documents/me-deep-wrapper/mvp
npm run build && npm test
```

If build fails — fix until it passes. No handoff with broken builds.

### Stage 5: Evidence Contract Output

After successful build, produce a summary artifact that maps to the engineering-factory SOP gate:

```json
{
   "routes": [/* from tech-design */],
   "apis": [/* implemented API endpoints */],
   "data_model": { /* DB schemas used */ },
   "integrations": [/* real integrations connected */],
   "checkout_path": [/* user flow path if applicable */],
   "build_command": "npm run build",
   "tests_run": true,
   "known_risks": ["TODO items, known limitations"]
}
```

Save to `state/evidence/` for the current department gate (not directly in gates/ — that's MEKONG wrapper CLI territory).

## Anti-Chaos Rules (from engineering-factory SOP)

1. No coding from raw idea — always start with technical design
2. No demo-only product proof — use real integrations or explicit sandboxes only  
3. No hidden mock-only success paths in checkout flows
4. Keep architecture boring enough for clone reuse across RaaS projects
5. Record build/test commands and every unverified assumption before handoff

## Quality Gate Checklist (before claiming "done")

- [ ] Code follows TypeScript + Next.js App Router patterns
- [ ] All imports resolve (no broken references)  
- [ ] Build passes: `npm run build` exits 0
- [ ] Tests pass: `npm test` exits 0 with green
- [ ] Error states handled for all user flows
- [ ] Analytics hooks present where applicable
- [ ] Evidence contract fields populated
