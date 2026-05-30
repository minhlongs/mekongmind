import { z } from "zod"
import { fn } from "./util/fn"
import { Actor } from "./actor"
import { and, Database, eq, isNull } from "./drizzle"
import { Identifier } from "./identifier"
import { ProviderTable } from "./schema/provider.sql"
import { Crypto } from "./crypto"

// NOTE: credentials are encrypted with AES-256-GCM (PBKDF2 key derivation).
// The encryption key is the workspaceID, which provides per-workspace isolation
// but is not a secret — it is stored in the same DB.
// TODO: replace with a proper per-workspace encryption key stored in a secrets
// manager (e.g. SST Secret / Cloudflare Secrets Store) and add key rotation
// before this is considered production-grade credential protection.
function credentialKey(workspaceID: string) {
  return workspaceID
}

export namespace Provider {
  export const list = fn(z.void(), async () => {
    const workspaceID = Actor.workspace()
    const rows = await Database.use((tx) =>
      tx
        .select()
        .from(ProviderTable)
        .where(and(eq(ProviderTable.workspaceID, workspaceID), isNull(ProviderTable.timeDeleted))),
    )
    return Promise.all(
      rows.map(async (row) => {
        const credentials = await Crypto.decrypt(row.credentials, credentialKey(workspaceID))
        return { ...row, credentials }
      }),
    )
  })

  export const create = fn(
    z.object({
      provider: z.string().min(1).max(64),
      credentials: z.string(),
    }),
    async (input) => {
      Actor.assertAdmin()
      const workspaceID = Actor.workspace()
      const encrypted = await Crypto.encrypt(input.credentials, credentialKey(workspaceID))
      return Database.use((tx) =>
        tx
          .insert(ProviderTable)
          .values({
            id: Identifier.create("provider"),
            workspaceID,
            provider: input.provider,
            credentials: encrypted,
          })
          .onDuplicateKeyUpdate({
            set: {
              credentials: encrypted,
              timeDeleted: null,
            },
          }),
      )
    },
  )

  export const remove = fn(
    z.object({
      provider: z.string(),
    }),
    async (input) => {
      Actor.assertAdmin()
      return Database.use((tx) =>
        tx
          .delete(ProviderTable)
          .where(and(eq(ProviderTable.provider, input.provider), eq(ProviderTable.workspaceID, Actor.workspace()))),
      )
    },
  )
}
