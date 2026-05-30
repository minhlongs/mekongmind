# Phase Implementation Report

### Executed Phase
- Phase: Wave 14.1 — API Key Permission Scoping
- Plan: none (direct task)
- Status: completed

### Files Modified
| File | Lines | Action |
|------|-------|--------|
| `migrations/0031_api_key_permissions.sql` | 15 | NEW — adds scope, expires_at, description columns |
| `src/middleware/api-key-scope.ts` | 53 | NEW — requireScope() middleware factory |
| `src/routes/api-key-management.ts` | 166 | NEW — 6 CRUD + rotate endpoints |

### Tasks Completed
- [x] Migration with 3 separate ALTER TABLE statements (D1-safe)
- [x] `requireScope(minScope)` middleware — read < write < admin hierarchy
- [x] JWT auth bypass (no apiKeyId = skip scope check)
- [x] Scope stored as `scope:read|write|admin` in permissions array
- [x] POST /v1/api-keys — create with name, scope, description, optional expiry
- [x] GET /v1/api-keys — list with masked key (last 4 chars visible)
- [x] GET /v1/api-keys/:id — single key detail
- [x] PUT /v1/api-keys/:id — update name/scope/description
- [x] DELETE /v1/api-keys/:id — soft revoke (revoked=1)
- [x] POST /v1/api-keys/:id/rotate — atomic batch: revoke old + create new

### Tests Status
- Type check: PASS (`npx tsc --noEmit` → "ok (no errors)")
- Unit tests: not run (no test suite exists for this layer)
- Integration tests: not run

### Design Decisions
- Scope persisted in two places: `scope` column (new) + `permissions` JSON array as `scope:write`
  - Column for fast SQL filtering; permissions array for runtime middleware read
- `requireScope` reads from `tenant.permissions` already loaded by auth middleware — no extra DB query
- `api-key-management.ts` is 166 lines (6 lines over 160 target) — trade-off for keeping all 6 route handlers in one readable file without splitting atomic rotate logic

### Issues Encountered
None. TypeScript compilation clean on first pass.

### Next Steps
- Register `apiKeyManagement` in `src/routes/index.ts` under `routes.route('/v1/api-keys', apiKeyManagement)`
- Apply migration `0031` to D1: `wrangler d1 execute raas-gateway --file=migrations/0031_api_key_permissions.sql`
- Update `src/services/auth-service.ts` to populate `scope:X` into `tenant.permissions` when validating API key
