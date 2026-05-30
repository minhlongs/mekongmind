import { index, mysqlTable, text } from "drizzle-orm/mysql-core"
import { ulid, utc, workspaceColumns } from "../drizzle/types"
import { workspaceIndexes } from "./workspace.sql"

export const AuditTable = mysqlTable(
  "audit_log",
  {
    ...workspaceColumns,
    timeCreated: utc("time_created").notNull().defaultNow(),
    userID: ulid("user_id").notNull(),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceID: text("resource_id"),
    metadata: text("metadata"),
    ipAddress: text("ip_address"),
  },
  (table) => [
    ...workspaceIndexes(table),
    index("audit_workspace_time").on(table.workspaceID, table.timeCreated),
    index("audit_workspace_user").on(table.workspaceID, table.userID),
    index("audit_workspace_resource").on(table.workspaceID, table.resourceType, table.resourceID),
  ],
)
