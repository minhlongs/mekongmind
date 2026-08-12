import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getDb } from "@/db/client";
import { inngestClient } from "@/forest/inngest/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ owner: string; repo: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo } = await ctx.params;
    await ensureSchema();
  const db = getDb();

    // Lookup repo + user's GitHub token
    const repoRow = (await db
      .prepare(
        `SELECT r.id, u.github_access_token FROM repos r
         JOIN users u ON u.id = r.user_id
         WHERE r.user_id = ? AND r.owner = ? AND r.repo_name = ?`,
      )
      .bind(session.sub, owner, repo)
      .first()) as { id: string; github_access_token: string | null } | null;

    if (!repoRow) {
      return NextResponse.json({ error: "Repo not registered." }, { status: 404 });
    }

    if (!repoRow.github_access_token) {
      return NextResponse.json(
        { error: "No GitHub token linked. Connect your account first." },
        { status: 403 },
      );
    }

    // Prevent duplicate pending reviews
    const pending = (await db
      .prepare("SELECT id FROM reviews WHERE repo_id = ? AND status = 'pending'")
      .bind(repoRow.id)
      .first()) as { id: string } | null;

    if (pending) {
      return NextResponse.json(
        { error: "A review is already in progress.", reviewId: pending.id },
        { status: 409 },
      );
    }

    const reviewId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    // Insert review record
    await db
      .prepare(
        `INSERT INTO reviews (id, repo_id, pull_number, title, status, findings_count, started_at)
         VALUES (?, ?, NULL, ?, 'pending', 0, ?)`,
      )
      .bind(reviewId, repoRow.id, `Review ${reviewId.slice(0, 8)}`, startedAt)
      .run();

    // Enqueue Inngest background job
    if (inngestClient) {
      try {
        await inngestClient.send({
          name: "review/triggered",
          data: {
            reviewId,
            repoId: repoRow.id,
            owner,
            repoName: repo,
            fullName: `${owner}/${repo}`,
            defaultBranch: "main",
            pullNumber: null,
            userId: session.sub,
            trigger: "manual",
          },
        });
      } catch (sendErr) {
        // Log but still return 202 — the review row is persisted and can be retried
        const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        const { logger } = await import("@/lib/logger");
  logger.error(`Inngest send failed for ${reviewId}: ${msg}`);
      }
    }

    return NextResponse.json(
      { jobId: reviewId, status: "pending", startedAt },
      { status: 202 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
