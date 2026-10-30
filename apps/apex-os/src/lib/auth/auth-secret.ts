/**
 * Validates that a non-empty Better Auth secret is configured before
 * session signing or verification can proceed.
 */
export function requireBetterAuthSecret(explicitSecret?: string): string {
  const secret = (explicitSecret ?? process.env.BETTER_AUTH_SECRET)?.trim()
  if (!secret) {
    throw new Error(
      'BETTER_AUTH_SECRET is not set. Session signing is disabled because a hardcoded fallback would let any reader of this repository forge session tokens.'
    )
  }
  return secret
}
