/**
 * Better Auth catch-all route
 * Delegates all /api/auth/* requests to the Better Auth handler.
 * D1 binding is injected by the CF Workers runtime via globalThis.DB.
 */

import { createAuth } from '@/lib/auth/auth-factory'

export async function GET(request: Request) {
  const auth = createAuth({ DB: (globalThis as unknown as { DB?: Parameters<typeof createAuth>[0]['DB'] }).DB! })
  return auth.handler(request)
}

export async function POST(request: Request) {
  const auth = createAuth({ DB: (globalThis as unknown as { DB?: Parameters<typeof createAuth>[0]['DB'] }).DB! })
  return auth.handler(request)
}
