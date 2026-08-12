import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getDb } from "@/db/client";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { status?: string; assignee?: string | null };

    if (!Object.keys(body).length) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    await ensureSchema();
    const db = getDb();
    const { id: sprintId, taskId } = await ctx.params;

    const taskRow = (await db
      .prepare("SELECT * FROM sprint_tasks WHERE id = ?")
      .bind(taskId)
      .first()) as Record<string, unknown> | null;

    if (!taskRow) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // verify ownership via sprint -> repo -> user
    const sprintRow = (await db
      .prepare("SELECT repo_id FROM sprints WHERE id = ?")
      .bind(sprintId)
      .first()) as { repo_id: string } | null;

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

    // verify task belongs to the sprint in the URL
    if (taskRow.sprint_id !== sprintId) {
      return NextResponse.json({ error: "Task does not belong to this sprint." }, { status: 400 });
    }

    await db
      .prepare(
        `UPDATE sprint_tasks
         SET status = COALESCE(?, status),
             assignee = ?
         WHERE id = ?`,
      )
      .bind(body.status ?? null, body.assignee ?? taskRow.assignee, taskId)
      .run();

    const updated = (await db
      .prepare("SELECT * FROM sprint_tasks WHERE id = ?")
      .bind(taskId)
      .first()) as Record<string, unknown>;

    return NextResponse.json({
      task: {
        id: updated.id,
        sprintId: updated.sprint_id,
        reviewId: updated.review_id,
        assignee: updated.assignee,
        status: updated.status,
        createdAt: updated.created_at,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const db = getDb();
    const { id: sprintId, taskId } = await ctx.params;

    const taskRow = (await db
      .prepare("SELECT sprint_id FROM sprint_tasks WHERE id = ?")
      .bind(taskId)
      .first()) as { sprint_id: string } | null;

    if (!taskRow) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // verify ownership via sprint -> repo -> user
    const sprintRow = (await db
      .prepare("SELECT repo_id FROM sprints WHERE id = ?")
      .bind(sprintId)
      .first()) as { repo_id: string } | null;

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

    await db.prepare("DELETE FROM sprint_tasks WHERE id = ?").bind(taskId).run();

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
