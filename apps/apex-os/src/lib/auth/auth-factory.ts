/**
 * Better Auth factory — accepts D1 binding at call time.
 * Avoids kysely version conflicts by using custom D1 adapter.
 */

import { betterAuth } from 'better-auth'
import { createD1Adapter, D1Database } from './adapters/d1-adapter'
import { requireBetterAuthSecret } from './auth-secret'

export { requireBetterAuthSecret }

export interface AuthEnv {
  DB: D1Database
  BETTER_AUTH_SECRET?: string
}

export function createAuth(env: AuthEnv) {
  return betterAuth({
    database: createD1Adapter({ db: env.DB }),
    basePath: '/api/auth',
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    secret: requireBetterAuthSecret(env.BETTER_AUTH_SECRET),
    plugins: [],
  })
}
