import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { ProjectTable } from "../project/project.sql"
import { Timestamps } from "../storage/schema.sql"
import type { ProjectID } from "../project/schema"

export type MemoryTier = "episodic" | "semantic" | "procedural"
export type MemoryEntryID = string & { readonly __brand: "MemoryEntryID" }

export const MemoryEntryTable = sqliteTable(
  "memory_entry",
  {
    id: text().$type<MemoryEntryID>().primaryKey(),
    project_id: text()
      .$type<ProjectID>()
      .notNull()
      .references(() => ProjectTable.id, { onDelete: "cascade" }),
    session_id: text().notNull(),
    agent_id: text().notNull(),
    tier: text().$type<MemoryTier>().notNull(),
    content: text().notNull(),
    tags: text({ mode: "json" }).$type<string[]>().notNull().$default(() => []),
    relevance_score: integer().notNull().$default(() => 50),
    access_count: integer().notNull().$default(() => 0),
    ...Timestamps,
  },
  (table) => [
    index("memory_entry_project_idx").on(table.project_id),
    index("memory_entry_tier_idx").on(table.tier),
    index("memory_entry_agent_idx").on(table.agent_id),
    index("memory_entry_project_tier_idx").on(table.project_id, table.tier),
  ],
)
