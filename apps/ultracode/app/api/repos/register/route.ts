import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getDb } from "@/db/client";

interface RegisterBody {
  github_id: number;
  owner: string;
  repo_name: string;
  full_name: string;
  default_branch?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RegisterBody;
    if (!body.github_id || !body.owner || !body.repo_name || !body.full_name) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await ensureSchema();
  const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT OR REPLACE INTO repos (id, user_id, owner, repo_name, full_name, platform, default_branch, private, connected_at)
         VALUES (?, ?, ?, ?, ?, 'github', ?, COALESCE((SELECT private FROM repos WHERE full_name = ?), 0), ?)`,
      )
      .bind(
        id,
        session.sub,
        body.owner,
        body.repo_name,
        body.full_name,
        body.default_branch ?? "main",
        body.full_name,
        now,
      )
      .run();

    return NextResponse.json({ id, full_name: body.full_name, status: "connected" }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
