import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();

    const result = await db
      .prepare(
        `SELECT r.id, r.status, r.findings_count, r.started_at, r.completed_at, repos.full_name AS repo
         FROM reviews r
         JOIN repos ON repos.id = r.repo_id
         WHERE repos.user_id = ?
         ORDER BY r.started_at DESC`,
      )
      .bind(session.sub)
      .all();

    const reviews = (result as { results: Record<string, unknown>[] }).results.map((r) => ({
      id: r.id,
      repo: r.repo,
      status: r.status,
      findingsCount: (r.findings_count as number) ?? 0,
      startedAt: r.started_at,
      completedAt: r.completed_at,
    }));

    return NextResponse.json({ reviews });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
