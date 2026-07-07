# Phase 2: Remove Supabase Dependencies
**Priority:** High
**Status:** Pending
**Dependencies:** Phase 1

## Requirements
Remove all Supabase packages from package.json. Keep only what CF replaces.

## Changes to package.json
- REMOVE: `@supabase/auth-helpers-nextjs` (CJS, incompatible)
- KEEP: `@supabase/supabase-js` (temporary, for migration)
- ADD: `better-auth`
- ADD: `@opennextjs/cloudflare`

## Success Criteria
- `@supabase/auth-helpers-nextjs` removed from package.json
- `better-auth` and `@opennextjs/cloudflare` added
