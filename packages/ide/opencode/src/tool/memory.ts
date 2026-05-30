import z from "zod"
import { Effect } from "effect"
import { Tool } from "./tool"
import { Memory } from "../memory/memory"
import type { MemoryTier } from "../memory/schema.sql"
import DESCRIPTION from "./memory.txt"

const parameters = z.object({
  action: z.enum(["store", "query", "prune"]).describe("Operation to perform"),
  tier: z
    .enum(["episodic", "semantic", "procedural"])
    .optional()
    .describe("Memory tier: episodic (events), semantic (facts), procedural (workflows)"),
  content: z.string().optional().describe("Content to store (required for store action)"),
  text: z.string().optional().describe("Substring to search for (used in query action)"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags for filtering or categorizing the memory entry"),
  limit: z.number().int().positive().max(50).optional().describe("Maximum entries to return (query action, default 20)"),
  older_than_days: z
    .number().positive().optional()
    .describe("Prune entries older than this many days (prune action)"),
  min_relevance_score: z
    .number().int().min(0).max(100).optional()
    .describe("Prune entries with relevance below this threshold (prune action)"),
})

type Metadata = {
  action: string
  count?: number
  id?: string
}

export const MemoryTool = Tool.defineEffect<typeof parameters, Metadata, Memory.Service>(
  "memory",
  Effect.gen(function* () {
    const memory = yield* Memory.Service

    return {
      description: DESCRIPTION,
      parameters,
      async execute(params: z.infer<typeof parameters>, _ctx: Tool.Context<Metadata>) {
        switch (params.action) {
          case "store": {
            if (!params.content) {
              throw new Error("content is required for store action")
            }
            if (!params.tier) {
              throw new Error("tier is required for store action")
            }
            const entry = await memory
              .store({
                sessionID: _ctx.sessionID,
                agentID: _ctx.agent,
                tier: params.tier as MemoryTier,
                content: params.content,
                tags: params.tags,
              })
              .pipe(Effect.runPromise)

            return {
              title: `Stored ${params.tier} memory`,
              output: `Memory stored with id: ${entry.id}\nContent: ${entry.content}`,
              metadata: { action: "store", id: entry.id },
            }
          }

          case "query": {
            const entries = await memory
              .query({
                tier: params.tier as MemoryTier | undefined,
                text: params.text,
                tags: params.tags,
                limit: params.limit,
              })
              .pipe(Effect.runPromise)

            if (entries.length === 0) {
              return {
                title: "No memories found",
                output: "No matching memory entries found.",
                metadata: { action: "query", count: 0 },
              }
            }

            const formatted = entries
              .map(
                (e) =>
                  `[${e.tier}] (score:${e.relevance_score}) ${e.content}${e.tags.length ? ` [tags: ${e.tags.join(", ")}]` : ""}`,
              )
              .join("\n")

            return {
              title: `${entries.length} memory entries`,
              output: formatted,
              metadata: { action: "query", count: entries.length },
            }
          }

          case "prune": {
            const count = await memory
              .prune({
                tier: params.tier as MemoryTier | undefined,
                olderThanMs: params.older_than_days ? params.older_than_days * 86_400_000 : undefined,
                minRelevanceScore: params.min_relevance_score,
              })
              .pipe(Effect.runPromise)

            return {
              title: `Pruned ${count} entries`,
              output: `Removed ${count} memory entries.`,
              metadata: { action: "prune", count },
            }
          }
        }
      },
    } satisfies Tool.DefWithoutID<typeof parameters, Metadata>
  }),
)
