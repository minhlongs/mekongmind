# Phase 6: OpenNext Deploy
**Priority:** High
**Status:** Pending
**Dependencies:** Phase 5

## Requirements
Configure OpenNext adapter and deploy to Cloudflare Pages.

## Steps
1. Install: `pnpm add -D @opennextjs/cloudflare`
2. Create `open-next.config.ts`:
```typescript
import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default defineCloudflareConfig({
  // CF-specific config
})
```
3. Update `next.config.js` to use OpenNext output
4. Build: `pnpm build`
5. Deploy: `wrangler pages project create apex-os --production-branch main`
6. Deploy: `wrangler pages deploy --open-next`

## Success Criteria
- `pnpm build` succeeds with OpenNext
- App deploys to `https://apex-os.pages.dev`
- All pages load correctly
- Auth flow works in production
