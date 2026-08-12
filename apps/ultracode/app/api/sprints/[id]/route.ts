import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getDb } from "@/db/client";

type SprintStatus = "planned" | "active" | "completed";

const STATUS_TRANSITIONS: Record<SprintStatus, SprintStatus[]> = {
  planned: ["active"],
  active: ["completed"],
  completed: [],
};

function isAllowedTransition(current: string, next: string): boolean {
  const allowed = STATUS_TRANSITIONS[current as SprintStatus];
  return allowed ? allowed.includes(next as SprintStatus) : false;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const db = getDb();
    const { id } = await ctx.params;

    const sprintRow = (await db
      .prepare("SELECT * FROM sprints WHERE id = ?")
      .bind(id)
      .first()) as Record<string, unknown> | null;

    if (!sprintRow) {
      return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
    }

    // verify ownership via repo
    const repoRow = (await db
      .prepare("SELECT user_id FROM repos WHERE id = ?")
      .bind(sprintRow.repo_id as string)
      .first()) as { user_id: string } | null;

    if (!repoRow || repoRow.user_id !== session.sub) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // fetch tasks with JOIN reviews for title
    const tasksResult = await db
      .prepare(
        `SELECT st.id, st.review_id, st.assignee, st.status, st.created_at, r.title AS review_title
         FROM sprint_tasks st
         JOIN reviews r ON r.id = st.review_id
         WHERE st.sprint_id = ?
         ORDER BY st.created_at`,
      )
      .bind(id)
      .all();

    const tasks = (tasksResult as { results: Record<string, unknown>[] }).results.map((t) => ({
      id: t.id,
      reviewId: t.review_id,
      assignee: t.assignee,
      status: t.status,
      reviewTitle: t.review_title,
      createdAt: t.created_at,
    }));

    const taskCount = tasks.length;
    const doneCount = tasks.filter((t) => t.status === "done").length;

    return NextResponse.json({
      sprint: {
        id: sprintRow.id,
        name: sprintRow.name,
        goal: sprintRow.goal,
        status: sprintRow.status,
        repoId: sprintRow.repo_id,
        startedAt: sprintRow.started_at,
        completedAt: sprintRow.completed_at,
        createdAt: sprintRow.created_at,
        taskCount,
        doneCount,
      },
      tasks,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      name?: string;
      goal?: string;
      status?: string;
      startedAt?: string | null;
      completedAt?: string | null;
    };

    if (!Object.keys(body).length) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    await ensureSchema();
    const db = getDb();
    const { id } = await ctx.params;

    const sprintRow = (await db
      .prepare("SELECT * FROM sprints WHERE id = ?")
      .bind(id)
      .first()) as Record<string, unknown> | null;

    if (!sprintRow) {
      return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
    }

    // verify ownership via repo
    const repoRow = (await db
      .prepare("SELECT user_id FROM repos WHERE id = ?")
      .bind(sprintRow.repo_id as string)
      .first()) as { user_id: string } | null;

    if (!repoRow || repoRow.user_id !== session.sub) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // validate status transition if status is being updated
    if (body.status && body.status !== sprintRow.status) {
      if (!isAllowedTransition(sprintRow.status as string, body.status)) {
        return NextResponse.json(
          { error: `Invalid status transition: ${sprintRow.status} -> ${body.status}` },
          { status: 400 },
        );
      }
    }

    const now = new Date().toISOString();

    await db
      .prepare(
        `UPDATE sprints
         SET name = COALESCE(?, name),
             goal = COALESCE(?, goal),
             status = COALESCE(?, status),
             started_at = COALESCE(?, started_at),
             completed_at = COALESCE(?, completed_at)
         WHERE id = ?`,
      )
      .bind(
        body.name ?? null,
        body.goal ?? null,
        body.status ?? null,
        body.startedAt ?? null,
        body.completedAt ?? null,
        id,
      )
      .run();

    const updated = (await db
      .prepare("SELECT * FROM sprints WHERE id = ?")
      .bind(id)
      .first()) as Record<string, unknown>;

    return NextResponse.json({
      sprint: {
        id: updated.id,
        name: updated.name,
        goal: updated.goal,
        status: updated.status,
        repoId: updated.repo_id,
        startedAt: updated.started_at,
        completedAt: updated.completed_at,
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
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const db = getDb();
    const { id } = await ctx.params;

    const sprintRow = (await db
      .prepare("SELECT repo_id FROM sprints WHERE id = ?")
      .bind(id)
      .first()) as { repo_id: string } | null;

    if (!sprintRow) {
      return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
    }

    // verify ownership via repo
    const repoRow = (await db
      .prepare("SELECT user_id FROM repos WHERE id = ?")
      .bind(sprintRow.repo_id)
      .first()) as { user_id: string } | null;

    if (!repoRow || repoRow.user_id !== session.sub) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await db.prepare("DELETE FROM sprints WHERE id = ?").bind(id).run();

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
