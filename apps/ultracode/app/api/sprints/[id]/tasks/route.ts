import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getDb } from "@/db/client";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { review_id: string; assignee?: string };

    if (!body.review_id) {
      return NextResponse.json(
        { error: "Missing required field: review_id." },
        { status: 400 },
      );
    }

    await ensureSchema();
    const db = getDb();
    const { id: sprintId } = await ctx.params;

    const sprintRow = (await db
      .prepare("SELECT repo_id, status FROM sprints WHERE id = ?")
      .bind(sprintId)
      .first()) as { repo_id: string; status: string } | null;

    if (!sprintRow) {
      return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
    }

    const repoRow = (await db
      .prepare("SELECT user_id FROM repos WHERE id = ?")
      .bind(sprintRow.repo_id)
      .first()) as { user_id: string } | null;

    if (!repoRow || repoRow.user_id !== session.sub) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const reviewRow = (await db
      .prepare("SELECT id FROM reviews WHERE id = ? AND repo_id = ?")
      .bind(body.review_id, sprintRow.repo_id)
      .first()) as { id: string } | null;

    if (!reviewRow) {
      return NextResponse.json(
        { error: "Review not found in this repo." },
        { status: 404 },
      );
    }

    const conflictRow = (await db
      .prepare(
        `SELECT st.sprint_id, s.status
         FROM sprint_tasks st
         JOIN sprints s ON s.id = st.sprint_id
         WHERE st.review_id = ? AND s.repo_id = ? AND s.status = 'active' AND s.id != ?`,
      )
      .bind(body.review_id, sprintRow.repo_id, sprintId)
      .first()) as { sprint_id: string } | null;

    if (conflictRow) {
      return NextResponse.json(
        { error: "Review is already assigned to an active sprint for this repo." },
        { status: 409 },
      );
    }

    const taskId = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO sprint_tasks (id, sprint_id, review_id, assignee, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', datetime('now'))`,
      )
      .bind(taskId, sprintId, body.review_id, body.assignee ?? null)
      .run();

    const task = (await db
      .prepare("SELECT * FROM sprint_tasks WHERE id = ?")
      .bind(taskId)
      .first()) as Record<string, unknown>;

    return NextResponse.json(
      {
        task: {
          id: task.id,
          sprintId: task.sprint_id,
          reviewId: task.review_id,
          assignee: task.assignee,
          status: task.status,
          createdAt: task.created_at,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
