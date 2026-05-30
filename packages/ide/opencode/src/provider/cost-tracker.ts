import { Log } from "@/util/log"
import { Effect, Layer, ServiceMap } from "effect"

export namespace CostTracker {
  const log = Log.create({ service: "cost-tracker" })

  export type CostEntry = {
    sessionID: string
    providerID: string
    modelID: string
    inputTokens: number
    outputTokens: number
    estimatedCost: number
    timestamp: number
  }

  export type Summary = {
    totalCost: number
    totalInputTokens: number
    totalOutputTokens: number
    byProvider: Record<string, { cost: number; inputTokens: number; outputTokens: number }>
    byModel: Record<string, { cost: number; inputTokens: number; outputTokens: number }>
  }

  export interface Interface {
    readonly record: (entry: CostEntry) => Effect.Effect<void>
    readonly sessionTotal: (sessionID: string) => Effect.Effect<number>
    readonly providerTotal: (providerID: string, windowMs?: number) => Effect.Effect<number>
    readonly summary: () => Effect.Effect<Summary>
  }

  export class Service extends ServiceMap.Service<Service, Interface>()("@opencode/CostTracker") {}

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      // In-memory store for v1 — entries keyed by insertion order
      const entries: CostEntry[] = []

      const record = Effect.fn("CostTracker.record")(function* (entry: CostEntry) {
        entries.push(entry)
        log.info("cost recorded", {
          sessionID: entry.sessionID,
          modelID: entry.modelID,
          cost: entry.estimatedCost,
          inputTokens: entry.inputTokens,
          outputTokens: entry.outputTokens,
        })
      })

      const sessionTotal = Effect.fn("CostTracker.sessionTotal")(function* (sessionID: string) {
        return entries
          .filter((e) => e.sessionID === sessionID)
          .reduce((sum, e) => sum + e.estimatedCost, 0)
      })

      const providerTotal = Effect.fn("CostTracker.providerTotal")(function* (
        providerID: string,
        windowMs?: number,
      ) {
        const cutoff = windowMs ? Date.now() - windowMs : 0
        return entries
          .filter((e) => e.providerID === providerID && e.timestamp >= cutoff)
          .reduce((sum, e) => sum + e.estimatedCost, 0)
      })

      const summary = Effect.fn("CostTracker.summary")(function* () {
        const result: Summary = {
          totalCost: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          byProvider: {},
          byModel: {},
        }

        for (const entry of entries) {
          result.totalCost += entry.estimatedCost
          result.totalInputTokens += entry.inputTokens
          result.totalOutputTokens += entry.outputTokens

          // Aggregate by provider
          const pBucket = (result.byProvider[entry.providerID] ??= {
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
          })
          pBucket.cost += entry.estimatedCost
          pBucket.inputTokens += entry.inputTokens
          pBucket.outputTokens += entry.outputTokens

          // Aggregate by model
          const mKey = `${entry.providerID}/${entry.modelID}`
          const mBucket = (result.byModel[mKey] ??= {
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
          })
          mBucket.cost += entry.estimatedCost
          mBucket.inputTokens += entry.inputTokens
          mBucket.outputTokens += entry.outputTokens
        }

        return result
      })

      return Service.of({ record, sessionTotal, providerTotal, summary })
    }),
  )

  export const defaultLayer = layer

  /**
   * Approximate cost estimation (USD per token).
   * Rates are $/1M tokens from public pricing (2025-Q2).
   * Returns 0 when model is unknown — never throws.
   */
  export function estimateCost(
    providerID: string,
    modelID: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const rates = resolveRates(providerID, modelID)
    return inputTokens * rates.input + outputTokens * rates.output
  }

  type Rates = { input: number; output: number }

  function resolveRates(providerID: string, modelID: string): Rates {
    const id = modelID.toLowerCase()
    const provider = providerID.toLowerCase()

    // Anthropic
    if (provider === "anthropic" || id.includes("claude")) {
      if (id.includes("opus")) return { input: 15 / 1_000_000, output: 75 / 1_000_000 }
      if (id.includes("sonnet")) return { input: 3 / 1_000_000, output: 15 / 1_000_000 }
      if (id.includes("haiku")) return { input: 0.8 / 1_000_000, output: 4 / 1_000_000 }
    }

    // OpenAI / GPT
    if (provider === "openai" || id.startsWith("gpt")) {
      if (id.includes("gpt-5") && !id.includes("mini") && !id.includes("nano"))
        return { input: 10 / 1_000_000, output: 40 / 1_000_000 }
      if (id.includes("gpt-5-mini") || id.includes("4o-mini"))
        return { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 }
      if (id.includes("gpt-4"))
        return { input: 2.5 / 1_000_000, output: 10 / 1_000_000 }
    }

    // Google Gemini
    if (provider === "google" || id.includes("gemini")) {
      if (id.includes("pro")) return { input: 1.25 / 1_000_000, output: 5 / 1_000_000 }
      if (id.includes("flash")) return { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 }
    }

    // Local / free models (ollama, etc.)
    if (provider === "ollama" || id.includes("qwen") || id.includes("llama")) {
      return { input: 0, output: 0 }
    }

    // Unknown — return zero rather than guessing
    return { input: 0, output: 0 }
  }
}
