import { Config } from "@/config/config"
import { Log } from "@/util/log"
import { Token } from "@/util/token"
import { Effect, Layer, ServiceMap } from "effect"
import { makeRuntime } from "@/effect/run-service"
import type { ModelMessage } from "ai"
import type { Agent } from "@/agent/agent"
import type { Provider } from "@/provider/provider"

export namespace ModelRouter {
  const log = Log.create({ service: "model-router" })

  /** Complexity thresholds — scores below LOW get cheap model, above HIGH get expensive */
  const LOW_THRESHOLD = 1000
  const HIGH_THRESHOLD = 5000

  /**
   * Agents that should always use the cheap model regardless of complexity.
   * These are utility/background agents not doing deep reasoning.
   */
  const CHEAP_AGENT_NAMES = new Set(["explore", "title", "summary"])

  export type RouteReason =
    | "user_override"
    | "agent_default"
    | "complexity_low"
    | "complexity_high"
    | "default"

  export type RouteInput = {
    messages: ModelMessage[]
    agent: Agent.Info
    /** The model currently requested (may come from user or agent default) */
    currentModel: Provider.Model
    toolCount: number
    /** True if the user explicitly selected the model for this request */
    userSelectedModel?: boolean
  }

  export type RouteResult = {
    /** Provider/model string in "providerID/modelID" format */
    model: string
    reason: RouteReason
  }

  export interface Interface {
    /**
     * Route a request to the optimal model.
     * Returns undefined when routing is disabled or config unavailable — caller should keep current model.
     */
    readonly route: (input: RouteInput) => Effect.Effect<RouteResult | undefined>
    /** Override cheap/expensive model strings at runtime (useful for testing) */
    readonly setModels: (models: { cheap: string; expensive: string }) => Effect.Effect<void>
  }

  export class Service extends ServiceMap.Service<Service, Interface>()("@opencode/ModelRouter") {}

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const config = yield* Config.Service

      // Runtime-overridable model strings (null = use config)
      let runtimeCheap: string | null = null
      let runtimeExpensive: string | null = null

      const route = Effect.fn("ModelRouter.route")(function* (input: RouteInput) {
        const cfg = yield* config.get()
        const routerCfg = (cfg as any).model_router as
          | { enabled?: boolean; cheap?: string; expensive?: string }
          | undefined

        if (!routerCfg?.enabled) return undefined

        const cheap = runtimeCheap ?? routerCfg.cheap
        const expensive = runtimeExpensive ?? routerCfg.expensive

        if (!cheap && !expensive) return undefined

        // Rule 1: user explicitly chose this model — never override
        if (input.userSelectedModel) {
          return { model: `${input.currentModel.providerID}/${input.currentModel.id}`, reason: "user_override" as const }
        }

        // Rule 2: cheap-only agents (explore, title, summary)
        if (CHEAP_AGENT_NAMES.has(input.agent.name)) {
          const target = cheap ?? `${input.currentModel.providerID}/${input.currentModel.id}`
          log.info("agent routed to cheap model", { agent: input.agent.name, model: target })
          return { model: target, reason: "agent_default" as const }
        }

        // Rule 3: complexity heuristic
        const score = computeComplexityScore(input.messages, input.toolCount)
        log.info("complexity score", { score, agent: input.agent.name })

        if (score <= LOW_THRESHOLD && cheap) {
          return { model: cheap, reason: "complexity_low" as const }
        }

        if (score >= HIGH_THRESHOLD && expensive) {
          return { model: expensive, reason: "complexity_high" as const }
        }

        // Default: no routing decision, caller keeps current model
        return { model: `${input.currentModel.providerID}/${input.currentModel.id}`, reason: "default" as const }
      })

      const setModels = Effect.fn("ModelRouter.setModels")(function* (models: {
        cheap: string
        expensive: string
      }) {
        runtimeCheap = models.cheap
        runtimeExpensive = models.expensive
      })

      return Service.of({ route, setModels })
    }),
  )

  export const defaultLayer = Layer.suspend(() =>
    layer.pipe(Layer.provide(Config.defaultLayer)),
  )

  const { runPromise } = makeRuntime(Service, defaultLayer)

  /** Static async wrapper — safe to call from non-Effect async functions */
  export async function route(input: RouteInput): Promise<RouteResult | undefined> {
    return runPromise((svc) => svc.route(input)).catch(() => undefined)
  }

  /**
   * Complexity score formula:
   *   score = messageTokens*0.4 + toolCallCount*100*0.3 + contextLength*0.3
   *
   * messageTokens  — estimated tokens across all message content
   * toolCallCount  — number of tool-call parts in message history
   * contextLength  — number of messages (proxy for conversation depth)
   */
  function computeComplexityScore(messages: ModelMessage[], toolCount: number): number {
    let totalText = ""
    let toolCallCount = 0

    for (const msg of messages) {
      if (typeof msg.content === "string") {
        totalText += msg.content
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content as Array<{ type: string; [k: string]: unknown }>) {
          if (part.type === "text" && typeof part["text"] === "string") totalText += part["text"]
          if (part.type === "tool-call") toolCallCount++
          if (part.type === "tool-result") {
            const result = part["content"]
            if (typeof result === "string") totalText += result
          }
        }
      }
    }

    const messageTokens = Token.estimate(totalText)
    const contextLength = messages.length

    // Active tool slots (definition count) add complexity weight
    const toolSlotWeight = toolCount * 50

    return messageTokens * 0.4 + toolCallCount * 100 * 0.3 + contextLength * 0.3 + toolSlotWeight
  }
}
