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

export function setDb(db: DBLike): void {
  cached = db;
}

export function getDb(): DBLike {
  if (!cached) {
    // Lazy-fallback: read from Cloudflare Workers env when setDb was
    // never called. This survives OpenNext rebuilds because it lives
    // in application source, not the generated worker.js bundle.
    const ctx = (globalThis as Record<symbol, { env?: { DB?: unknown } }>)[
      Symbol.for("__cloudflare-context__")
    ];
    const binding = ctx?.env?.DB as DBLike | undefined;
    if (binding) {
      cached = binding;
      return cached;
    }
    throw new Error(
      "D1 binding not set. Call setDb() at startup before first request.",
    );
  }
  return cached;
}

export async function migrateIfNeeded(db: DBLike): Promise<void> {
  const { ALL_MIGRATIONS } = await import("./schema");
  for (const sql of ALL_MIGRATIONS) {
    await db.exec(sql);
  }
}
