/**
 * Custom D1 Adapter for better-auth
 * Implements the full database adapter interface using Cloudflare D1.
 * Zero kysely dependency — uses D1's native prepare/bind/run API.
 */

export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>
  dump(): Promise<string>
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(options?: { columns?: string[] }): Promise<T | null>
  firstColumnMap(): Promise<Map<unknown, unknown> | null>
  all<T = unknown>(): Promise<{ results: T[]; meta: { duration: number } }>
  run(): Promise<{ meta: { duration: number; rows_written: number }; success: boolean }>
  raw<T = unknown>(): AsyncIterable<T>
}

export interface D1Result {
  success: boolean
  meta: { duration: number; rows_read: number; rows_written: number }
}

export interface D1AdapterOptions {
  db: D1Database
}

export function createD1Adapter({ db }: D1AdapterOptions) {
  return {
    async createUser({ userId, email, emailVerified, name, image, createdAt }: { userId: string; email: string; emailVerified: boolean | undefined; name?: string; image?: string; createdAt?: string }) {
      await db.prepare(
        `INSERT INTO profiles (id, email, full_name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(userId, email, name ?? null, image ?? null, createdAt ?? new Date().toISOString(), new Date().toISOString())
        .run()
    },

    async getUser(userId: string): Promise<Record<string, unknown> | null> {
      const row = await db.prepare('SELECT * FROM profiles WHERE id = ?').bind(userId).first<Record<string, unknown>>()
      return row ?? null
    },

    async getUserByEmail(email: string): Promise<Record<string, unknown> | null> {
      const row = await db.prepare('SELECT * FROM profiles WHERE email = ?').bind(email).first<Record<string, unknown>>()
      return row ?? null
    },

    async updateUser(userId: string, data: Record<string, unknown>): Promise<void> {
      const updates: string[] = []
      const values: unknown[] = []

      if (data.email) { updates.push('email = ?'); values.push(data.email) }
      if (data.emailVerified !== undefined) {
        updates.push('email_verified = ?')
        values.push(data.emailVerified ? 1 : 0)
      }
      if (data.name) { updates.push('full_name = ?'); values.push(data.name) }
      if (data.image) { updates.push('avatar_url = ?'); values.push(data.image) }
      if (data.passwordHash) { updates.push('password_hash = ?'); values.push(data.passwordHash) }
      if (data.role) { updates.push('role = ?'); values.push(data.role) }

      updates.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(userId)

      if (updates.length > 1) {
        await db.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
      }
    },

    async deleteUser(userId: string): Promise<void> {
      await db.prepare('DELETE FROM profiles WHERE id = ?').bind(userId).run()
    },

    async createSession(userId: string, sessionToken: string, expiresAt: Date, id?: string): Promise<{ session: Record<string, unknown>; user: null }> {
      const sessionId = id ?? crypto.randomUUID()
      const now = new Date().toISOString()
      await db.prepare(
        'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(sessionId, userId, sessionToken, expiresAt.toISOString(), now)
        .run()
      return { session: { id: sessionId, userId, token: sessionToken, expiresAt: expiresAt.toISOString() }, user: null }
    },

    async getSession(sessionToken: string): Promise<{ session: Record<string, unknown>; user: Record<string, unknown> | null } | null> {
      const row = await db.prepare(
        "SELECT * FROM sessions WHERE token = ? AND expires_at > ?"
      ).bind(sessionToken, new Date().toISOString()).first<Record<string, string>>()
      if (!row) return null
      const user = await this.getUser(row.user_id)
      return {
        session: { id: row.id, userId: row.user_id, token: row.token, expiresAt: row.expires_at, createdAt: row.created_at },
        user,
      }
    },

    async updateSession(sessionId: string, data: { expires?: Date }): Promise<void> {
      if (data.expires) {
        await db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?')
          .bind(data.expires.toISOString(), sessionId)
          .run()
      }
    },

    async deleteSession(sessionId: string): Promise<void> {
      await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
    },

    async deleteUserSessions(userId: string): Promise<void> {
      await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run()
    },

    async createVerification(email: string, token: string, expires: Date, id?: string): Promise<void> {
      const verificationId = id ?? crypto.randomUUID()
      await db.prepare(
        'INSERT OR REPLACE INTO verifications (id, email, token, expires, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(verificationId, email, token, expires.toISOString(), new Date().toISOString())
        .run()
    },

    async getVerification(email: string, token: string): Promise<{ id: string; email: string; token: string; expires: Date; createdAt: string } | null> {
      const row = await db.prepare(
        'SELECT * FROM verifications WHERE email = ? AND token = ? AND expires > ?'
      ).bind(email, token, new Date().toISOString()).first<Record<string, string>>()
      if (!row) return null
      return {
        id: row.id,
        email: row.email,
        token: row.token,
        expires: new Date(row.expires),
        createdAt: row.created_at,
      }
    },

    async deleteVerification(id: string): Promise<void> {
      await db.prepare('DELETE FROM verifications WHERE id = ?').bind(id).run()
    },
  }
}
