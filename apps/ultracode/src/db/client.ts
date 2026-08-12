interface DBStatement<T = unknown> {
  bind(...values: unknown[]): DBStatement<T>;
  first(): Promise<T | null>;
  all(): Promise<{ results: T[] }>;
  run(): Promise<{ changes: number; lastInsertRowId: number }>;
}

interface DBLike {
  exec(sql: string): Promise<{ changes: number }>;
  prepare<T = unknown>(sql: string): DBStatement<T>;
}

let cached: DBLike | null = null;
let schemaPromise: Promise<void> | null = null;

export function setDb(db: DBLike): void {
  cached = db;
  schemaPromise = null; // reset on new binding (e.g. test override)
}

function resolveDb(): DBLike {
  if (!cached) {
    const ctx = (globalThis as Record<symbol, { env?: { DB?: unknown } }>)[
      Symbol.for("__cloudflare-context__")
    ];
    const binding = ctx?.env?.DB as DBLike | undefined;
    if (binding) {
      cached = binding;
      return cached;
    }
    throw new Error("D1 binding not set. Call setDb() at startup.");
  }
  return cached;
}

/**
 * Ensure schema tables exist. Concurrent calls share a single init promise
 * so only one migration runs even under concurrent CF Workers requests.
 */
export async function ensureSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const db = resolveDb();
    const { ALL_MIGRATIONS } = await import("./schema");
    for (const sql of ALL_MIGRATIONS) {
      await db.exec(sql);
    }
  })();

  return schemaPromise;
}

/**
 * Synchronous DB access — use only in non-async contexts.
 * Does NOT auto-run migrations; call ensureSchema() first.
 */
export function getDb(): DBLike {
  return resolveDb();
}

export async function migrateIfNeeded(db: DBLike): Promise<void> {
  const { ALL_MIGRATIONS } = await import("./schema");
  for (const sql of ALL_MIGRATIONS) {
    await db.exec(sql);
  }
}
