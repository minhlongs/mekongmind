# Engineering Factory SOP — Claude Code Auto-Invoke Skill

When building features, fixing bugs, or implementing integrations in mvp/, follow this exact sequence:

## Technical Design Phase (BEFORE any code changes)  
1. Read sops/departments/engineering-factory.md for current gate requirements
2. Map the task to one of 4 SOP cells: technical-design → mvp-build → integration → production-hardening
3. Output structured JSON of routes, APIs, data_model, integrations needed

## Build Phase  
- Next.js App Router ONLY — use app/ directory, NOT pages/
- Server components by default; add 'use client' only when React hooks used
- TypeScript strict: no `any` types unless explicitly commented with reason
- Follow existing component structure in mvp/app/ and mvp/components/

## Integration Phase (CRITICAL — NEVER VIOLATE)
- Real APIs or explicit sandboxes ONLY — NO mock-only success paths allowed  
- Error handling for ALL API calls (try/catch with custom AppError type)
- Analytics hooks where applicable (pageview, event tracking)
- Checkout flow must have: entry → core workflow → checkout → delivery → support contact

## Validation Phase (MANDATORY before claiming done)
1. `npm run build` — exit code MUST be 0
2. `npm test` — at least green tests pass  
3. No console.log in production code
4. All new files have corresponding tests (.test.ts or .spec.ts)

## Evidence Contract Output (Required for engineering-factory gate)
Produce this JSON artifact:

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

Save to `state/evidence/` matching current department gate.

## Anti-Chaos Rules (NEVER VIOLATE)
1. No coding from raw idea — always start with technical design first  
2. No demo-only product proof — real integrations or explicit sandboxes ONLY
3. No hidden mock-only success paths in checkout flows
4. Architecture must be boring enough for clone reuse across RaaS projects
5. Record build/test commands and every unverified assumption before handoff
