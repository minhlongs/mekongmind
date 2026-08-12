import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getDb } from "@/db/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const db = getDb();
    const repoId = req.nextUrl.searchParams.get("repo_id");

    if (!repoId) {
      return NextResponse.json({ error: "repo_id query param required." }, { status: 400 });
    }

    // verify repo belongs to user
    const repoRow = (await db
      .prepare("SELECT id FROM repos WHERE id = ? AND user_id = ?")
      .bind(repoId, session.sub)
      .first()) as { id: string } | null;

    if (!repoRow) {
      return NextResponse.json({ error: "Repo not found." }, { status: 404 });
    }

    const result = await db
      .prepare(
        `SELECT s.id, s.name, s.goal, s.status, s.repo_id, s.started_at, s.completed_at, s.created_at,
                COUNT(st.id) AS task_count,
                COALESCE(SUM(CASE WHEN st.status = 'done' THEN 1 ELSE 0 END), 0) AS done_count
         FROM sprints s
         LEFT JOIN sprint_tasks st ON st.sprint_id = s.id
         WHERE s.repo_id = ?
         GROUP BY s.id
         ORDER BY s.created_at DESC`,
      )
      .bind(repoId)
      .all();

    const sprints = (result as { results: Record<string, unknown>[] }).results.map((s) => ({
      id: s.id,
      name: s.name,
      goal: s.goal,
      status: s.status,
      repoId: s.repo_id,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      createdAt: s.created_at,
      taskCount: Number(s.task_count) ?? 0,
      doneCount: Number(s.done_count) ?? 0,
    }));

    return NextResponse.json({ sprints });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { name: string; goal?: string; repo_id: string };

    if (!body.name || !body.repo_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, repo_id." },
        { status: 400 },
      );
    }

    await ensureSchema();
    const db = getDb();

    // verify repo belongs to user
    const repoRow = (await db
      .prepare("SELECT id FROM repos WHERE id = ? AND user_id = ?")
      .bind(body.repo_id, session.sub)
      .first()) as { id: string } | null;

    if (!repoRow) {
      return NextResponse.json({ error: "Repo not found." }, { status: 404 });
    }

    const id = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO sprints (id, repo_id, name, goal, status, created_at)
         VALUES (?, ?, ?, ?, 'planned', datetime('now'))`,
      )
      .bind(id, body.repo_id, body.name, body.goal ?? null)
      .run();

    const sprint = (await db
      .prepare("SELECT * FROM sprints WHERE id = ?")
      .bind(id)
      .first()) as Record<string, unknown>;

    return NextResponse.json(
      {
        sprint: {
          id: sprint.id,
          name: sprint.name,
          goal: sprint.goal,
          status: sprint.status,
          repoId: sprint.repo_id,
          startedAt: sprint.started_at,
          completedAt: sprint.completed_at,
          createdAt: sprint.created_at,
          taskCount: 0,
          doneCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
