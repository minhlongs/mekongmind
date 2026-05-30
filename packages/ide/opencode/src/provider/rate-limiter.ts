import { Duration, Effect, Layer, ServiceMap } from "effect"
import { Log } from "@/util/log"

export namespace RateLimiter {
  // ──────────────────────────────────────────────────────────────
  // Bucket state
  // ──────────────────────────────────────────────────────────────

  interface Bucket {
    tokens: number
    lastRefillMs: number
  }

  const MAX_TOKENS = 10
  /** Tokens added per millisecond (2 tokens/sec = 0.002/ms). */
  const REFILL_RATE_PER_MS = 2 / 1000

  // ──────────────────────────────────────────────────────────────
  // Interface
  // ──────────────────────────────────────────────────────────────

  export interface Interface {
    /**
     * Acquires a token, waiting if needed (up to MAX_TOKENS * 500ms).
     * In practice this resolves synchronously unless the bucket is empty.
     */
    readonly acquire: (key: string) => Effect.Effect<void>
    /**
     * Non-blocking: returns true if a token was available and consumed,
     * false if the bucket was empty.
     */
    readonly tryAcquire: (key: string) => Effect.Effect<boolean>
  }

  // ──────────────────────────────────────────────────────────────
  // Service
  // ──────────────────────────────────────────────────────────────

  export class Service extends ServiceMap.Service<Service, Interface>()("@opencode/RateLimiter") {}

  // ──────────────────────────────────────────────────────────────
  // Layer
  // ──────────────────────────────────────────────────────────────

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const log = Log.create({ service: "rate-limiter" })
      const buckets = new Map<string, Bucket>()

      function refill(bucket: Bucket): Bucket {
        const now = Date.now()
        const elapsed = now - bucket.lastRefillMs
        const added = elapsed * REFILL_RATE_PER_MS
        const tokens = Math.min(MAX_TOKENS, bucket.tokens + added)
        return { tokens, lastRefillMs: now }
      }

      function getBucket(key: string): Bucket {
        const existing = buckets.get(key)
        if (existing) return existing
        const fresh: Bucket = { tokens: MAX_TOKENS, lastRefillMs: Date.now() }
        buckets.set(key, fresh)
        return fresh
      }

      const tryAcquire = Effect.fn("RateLimiter.tryAcquire")((key: string) =>
        Effect.sync(() => {
          const bucket = refill(getBucket(key))
          if (bucket.tokens < 1) {
            log.debug("rate limiter: no token available", { key, tokens: bucket.tokens })
            buckets.set(key, bucket)
            return false
          }
          buckets.set(key, { ...bucket, tokens: bucket.tokens - 1 })
          return true
        }),
      )

      const acquire = Effect.fn("RateLimiter.acquire")((key: string) => {
        // Lazy refill: calculate wait time until 1 token available, then delay.
        const attempt: Effect.Effect<void> = Effect.flatMap(
          Effect.sync(() => {
            const bucket = refill(getBucket(key))
            buckets.set(key, bucket)
            if (bucket.tokens >= 1) {
              buckets.set(key, { ...bucket, tokens: bucket.tokens - 1 })
              return 0 // no wait needed
            }
            // ms until next token
            return Math.ceil((1 - bucket.tokens) / REFILL_RATE_PER_MS)
          }),
          (waitMs) => {
            if (waitMs === 0) return Effect.void
            log.debug("rate limiter: waiting for token", { key, waitMs })
            return Effect.sleep(Duration.millis(waitMs))
          },
        )
        return attempt
      })

      return { acquire, tryAcquire }
    }),
  )
}
