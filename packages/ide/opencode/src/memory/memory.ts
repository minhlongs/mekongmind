import { Effect, Layer, ServiceMap } from "effect"
import { Database, eq, and, like, desc } from "../storage/db"
import { InstanceState } from "@/effect/instance-state"
import { makeRuntime } from "@/effect/run-service"
import { MemoryEntryTable, type MemoryTier, type MemoryEntryID } from "./schema.sql"
import type { ProjectID } from "../project/schema"
import { Log } from "@/util/log"
import { randomUUID } from "crypto"

export namespace Memory {
  const log = Log.create({ service: "memory" })

  export interface Entry {
    id: MemoryEntryID
    project_id: ProjectID
    session_id: string
    agent_id: string
    tier: MemoryTier
    content: string
    tags: string[]
    relevance_score: number
    access_count: number
    time_created: number
    time_updated: number
  }

  export interface StoreInput {
    sessionID: string
    agentID: string
    tier: MemoryTier
    content: string
    tags?: string[]
    relevanceScore?: number
  }

  export interface QueryInput {
    tier?: MemoryTier
    text?: string
    tags?: string[]
    agentID?: string
    limit?: number
  }

  export interface PruneInput {
    tier?: MemoryTier
    olderThanMs?: number
    minRelevanceScore?: number
  }

  export interface Interface {
    readonly store: (input: StoreInput) => Effect.Effect<Entry>
    readonly query: (input: QueryInput) => Effect.Effect<Entry[]>
    readonly prune: (input: PruneInput) => Effect.Effect<number>
    readonly consolidate: (tier: MemoryTier) => Effect.Effect<number>
  }

  export class Service extends ServiceMap.Service<Service, Interface>()("@opencode/Memory") {}

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const state = yield* InstanceState.make<{ projectID: ProjectID }>(
        Effect.fn("Memory.state")(function* (ctx) {
          return { projectID: ctx.project.id }
        }),
      )

      const store = Effect.fn("Memory.store")(function* (input: StoreInput) {
        const { projectID } = yield* InstanceState.get(state)

        const id = randomUUID() as MemoryEntryID
        const entry = {
          id,
          project_id: projectID,
          session_id: input.sessionID,
          agent_id: input.agentID,
          tier: input.tier,
          content: input.content,
          tags: input.tags ?? [],
          relevance_score: input.relevanceScore ?? 50,
          access_count: 0,
        }

        yield* Effect.sync(() =>
          Database.transaction((db) => {
            db.insert(MemoryEntryTable).values(entry).run()
          }),
        )

        yield* log.info("stored memory entry", { id, tier: input.tier, project: projectID })

        const row = yield* Effect.sync(() =>
          Database.use((db) =>
            db.select().from(MemoryEntryTable).where(eq(MemoryEntryTable.id, id)).get(),
          ),
        )

        return row! as Entry
      })

      const query = Effect.fn("Memory.query")(function* (input: QueryInput) {
        const { projectID } = yield* InstanceState.get(state)
        const limit = input.limit ?? 20

        const rows = yield* Effect.sync(() =>
          Database.use((db) => {
            // Build conditions — always scope to project
            const conditions = [eq(MemoryEntryTable.project_id, projectID)]

            if (input.tier) {
              conditions.push(eq(MemoryEntryTable.tier, input.tier))
            }

            if (input.agentID) {
              conditions.push(eq(MemoryEntryTable.agent_id, input.agentID))
            }

            if (input.text) {
              conditions.push(like(MemoryEntryTable.content, `%${input.text}%`))
            }

            return db
              .select()
              .from(MemoryEntryTable)
              .where(and(...conditions))
              .orderBy(desc(MemoryEntryTable.time_updated))
              .limit(limit)
              .all()
          }),
        )

        // Tag filtering (post-query, since SQLite JSON arrays need manual check)
        const filtered =
          input.tags && input.tags.length > 0
            ? rows.filter((row) => {
                const rowTags = row.tags as string[]
                return input.tags!.some((tag) => rowTags.includes(tag))
              })
            : rows

        // Bump access_count for returned entries
        if (filtered.length > 0) {
          yield* Effect.sync(() =>
            Database.transaction((db) => {
              for (const row of filtered) {
                db.update(MemoryEntryTable)
                  .set({ access_count: (row.access_count ?? 0) + 1 })
                  .where(eq(MemoryEntryTable.id, row.id as MemoryEntryID))
                  .run()
              }
            }),
          )
        }

        return filtered as Entry[]
      })

      const prune = Effect.fn("Memory.prune")(function* (input: PruneInput) {
        const { projectID } = yield* InstanceState.get(state)

        const rows = yield* Effect.sync(() =>
          Database.use((db) => {
            const conditions = [eq(MemoryEntryTable.project_id, projectID)]

            if (input.tier) {
              conditions.push(eq(MemoryEntryTable.tier, input.tier))
            }

            return db
              .select()
              .from(MemoryEntryTable)
              .where(and(...conditions))
              .all()
          }),
        )

        const now = Date.now()
        const toDelete = rows.filter((row) => {
          if (input.olderThanMs && now - row.time_created > input.olderThanMs) return true
          if (input.minRelevanceScore !== undefined && row.relevance_score < input.minRelevanceScore) return true
          return false
        })

        if (toDelete.length === 0) return 0

        yield* Effect.sync(() =>
          Database.transaction((db) => {
            for (const row of toDelete) {
              db.delete(MemoryEntryTable)
                .where(
                  and(
                    eq(MemoryEntryTable.id, row.id as MemoryEntryID),
                    eq(MemoryEntryTable.project_id, projectID),
                  ),
                )
                .run()
            }
          }),
        )

        yield* log.info("pruned memory entries", { count: toDelete.length, project: projectID })
        return toDelete.length
      })

      const consolidate = Effect.fn("Memory.consolidate")(function* (tier: MemoryTier) {
        // Promote frequently-accessed episodic memories to semantic tier
        if (tier !== "episodic") return 0

        const { projectID } = yield* InstanceState.get(state)

        const candidates = yield* Effect.sync(() =>
          Database.use((db) =>
            db
              .select()
              .from(MemoryEntryTable)
              .where(
                and(
                  eq(MemoryEntryTable.project_id, projectID),
                  eq(MemoryEntryTable.tier, "episodic"),
                ),
              )
              .all(),
          ),
        )

        const promoted = candidates.filter((row) => row.access_count >= 3)
        if (promoted.length === 0) return 0

        yield* Effect.sync(() =>
          Database.transaction((db) => {
            for (const row of promoted) {
              db.update(MemoryEntryTable)
                .set({ tier: "semantic" })
                .where(
                  and(
                    eq(MemoryEntryTable.id, row.id as MemoryEntryID),
                    eq(MemoryEntryTable.project_id, projectID),
                  ),
                )
                .run()
            }
          }),
        )

        yield* log.info("consolidated memory entries", { count: promoted.length, project: projectID })
        return promoted.length
      })

      return Service.of({ store, query, prune, consolidate })
    }),
  )

  export const defaultLayer = layer
  const { runPromise } = makeRuntime(Service, defaultLayer)

  export async function query(input: QueryInput) {
    return runPromise((svc) => svc.query(input))
  }
}
