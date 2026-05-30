import z from "zod"
import { Effect, Layer, ServiceMap } from "effect"
import { NamedError } from "@mekongmind/util/error"
import { Log } from "@/util/log"

export namespace CircuitBreaker {
  // ──────────────────────────────────────────────────────────────
  // Errors
  // ──────────────────────────────────────────────────────────────

  export const CircuitOpenError = NamedError.create(
    "CircuitOpenError",
    z.object({
      key: z.string(),
      retryInMs: z.number(),
    }),
  )
  export type CircuitOpenError = InstanceType<typeof CircuitOpenError>

  // ──────────────────────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────────────────────

  type BreakerState =
    | { status: "closed"; failures: number }
    | { status: "open"; openedAt: number }
    | { status: "half_open"; probesInFlight: number }

  const FAILURE_THRESHOLD = 3
  const COOLDOWN_MS = 60_000
  const HALF_OPEN_MAX_PROBES = 1

  // ──────────────────────────────────────────────────────────────
  // Interface
  // ──────────────────────────────────────────────────────────────

  export interface Interface {
    /** Returns void on proceed, fails with CircuitOpenError when open. */
    readonly check: (key: string) => Effect.Effect<void, CircuitOpenError>
    readonly recordSuccess: (key: string) => Effect.Effect<void>
    readonly recordFailure: (key: string) => Effect.Effect<void>
    readonly status: (key: string) => Effect.Effect<BreakerState["status"]>
    readonly reset: (key: string) => Effect.Effect<void>
  }

  // ──────────────────────────────────────────────────────────────
  // Service
  // ──────────────────────────────────────────────────────────────

  export class Service extends ServiceMap.Service<Service, Interface>()("@opencode/CircuitBreaker") {}

  // ──────────────────────────────────────────────────────────────
  // Layer
  // ──────────────────────────────────────────────────────────────

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const log = Log.create({ service: "circuit-breaker" })
      const breakers = new Map<string, BreakerState>()

      function getState(key: string): BreakerState {
        return breakers.get(key) ?? { status: "closed", failures: 0 }
      }

      function transitionToOpen(key: string) {
        breakers.set(key, { status: "open", openedAt: Date.now() })
        log.warn("circuit tripped to open", { key })
      }

      const check = Effect.fn("CircuitBreaker.check")((key: string) =>
        Effect.suspend(() => {
          const state = getState(key)
          if (state.status === "closed") {
            return Effect.void
          }
          if (state.status === "half_open") {
            if (state.probesInFlight >= HALF_OPEN_MAX_PROBES) {
              return Effect.fail(
                new CircuitOpenError({ key, retryInMs: 0 }),
              )
            }
            breakers.set(key, { status: "half_open", probesInFlight: state.probesInFlight + 1 })
            log.info("circuit half-open: probe allowed", { key })
            return Effect.void
          }
          // state is open — check cooldown
          const elapsed = Date.now() - state.openedAt
          if (elapsed >= COOLDOWN_MS) {
            breakers.set(key, { status: "half_open", probesInFlight: 1 })
            log.info("circuit transitioning to half-open", { key })
            return Effect.void
          }
          const retryInMs = COOLDOWN_MS - elapsed
          return Effect.fail(new CircuitOpenError({ key, retryInMs }))
        }),
      )

      const recordSuccess = Effect.fn("CircuitBreaker.recordSuccess")((key: string) =>
        Effect.sync(() => {
          const state = getState(key)
          if (state.status === "closed" && state.failures === 0) return
          breakers.set(key, { status: "closed", failures: 0 })
          log.info("circuit closed after success", { key })
        }),
      )

      const recordFailure = Effect.fn("CircuitBreaker.recordFailure")((key: string) =>
        Effect.sync(() => {
          const state = getState(key)
          if (state.status === "open") return
          if (state.status === "half_open") {
            transitionToOpen(key)
            return
          }
          const failures = state.failures + 1
          if (failures >= FAILURE_THRESHOLD) {
            transitionToOpen(key)
          } else {
            breakers.set(key, { status: "closed", failures })
            log.debug("circuit failure recorded", { key, failures })
          }
        }),
      )

      const status = Effect.fn("CircuitBreaker.status")((key: string) =>
        Effect.sync(() => {
          const state = getState(key)
          // upgrade open → half_open if cooldown passed (read path)
          if (state.status === "open" && Date.now() - state.openedAt >= COOLDOWN_MS) {
            breakers.set(key, { status: "half_open", probesInFlight: 0 })
            return "half_open" as const
          }
          return state.status
        }),
      )

      const reset = Effect.fn("CircuitBreaker.reset")((key: string) =>
        Effect.sync(() => {
          breakers.delete(key)
          log.info("circuit reset", { key })
        }),
      )

      return { check, recordSuccess, recordFailure, status, reset }
    }),
  )
}
