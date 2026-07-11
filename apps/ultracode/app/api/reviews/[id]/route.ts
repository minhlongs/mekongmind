import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db/client";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const { id } = await ctx.params;
const reviewRow = (await db
      .prepare("SELECT * FROM reviews WHERE id = ?")
      .bind(id)
      .first()) as Record<string, unknown> | null;

    if (!reviewRow) return NextResponse.json({ error: "Review not found." }, { status: 404 });

    // verify ownership via repo
    const repoRow = (await db
      .prepare("SELECT user_id FROM repos WHERE id = ?")
      .bind(reviewRow.repo_id as string)
      .first()) as { user_id: string } | null;

    if (!repoRow || repoRow.user_id !== session.sub) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const findings = (await db
      .prepare("SELECT * FROM findings WHERE review_id = ? ORDER BY created_at")
      .bind(id)
      .all()) as { results: Record<string, unknown>[] };

    return NextResponse.json({
      review: {
        id: reviewRow.id,
        repoId: reviewRow.repo_id,
        status: reviewRow.status,
        title: reviewRow.title,
        startedAt: reviewRow.started_at,
        completedAt: reviewRow.completed_at,
        findingsCount: (reviewRow.findings_count as number) ?? findings.results.length,
      },
      findings: findings.results.map((f) => ({
        id: f.id,
        severity: f.severity,
        category: f.category,
        title: f.title,
        description: f.description,
        filePath: f.file_path,
        lineStart: f.line_start,
        lineEnd: f.line_end,
        suggestion: f.suggestion,
        status: f.status,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
