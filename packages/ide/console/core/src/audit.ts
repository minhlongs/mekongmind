import { z } from "zod"
import { ulid } from "ulid"
import { fn } from "./util/fn"
import { desc, eq, Database } from "./drizzle"
import { AuditTable } from "./schema/audit.sql"

export namespace Audit {
  export const log = fn(
    z.object({
      workspaceID: z.string(),
      userID: z.string(),
      action: z.string(),
      resourceType: z.string(),
      resourceID: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
      ipAddress: z.string().optional(),
    }),
    (opts) =>
      Database.use((tx) =>
        tx.insert(AuditTable).values({
          id: "aud_" + ulid(),
          workspaceID: opts.workspaceID,
          userID: opts.userID,
          action: opts.action,
          resourceType: opts.resourceType,
          resourceID: opts.resourceID ?? null,
          metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
          ipAddress: opts.ipAddress ?? null,
        }),
      ),
  )

  export const list = fn(
    z.object({
      workspaceID: z.string(),
      limit: z.number().int().positive().max(200).optional(),
      offset: z.number().int().nonnegative().optional(),
    }),
    (opts) =>
      Database.use((tx) =>
        tx
          .select()
          .from(AuditTable)
          .where(eq(AuditTable.workspaceID, opts.workspaceID))
          .orderBy(desc(AuditTable.timeCreated))
          .limit(opts.limit ?? 50)
          .offset(opts.offset ?? 0),
      ),
  )
}

export type AuditEntry = Awaited<ReturnType<typeof Audit.list>>[number]
