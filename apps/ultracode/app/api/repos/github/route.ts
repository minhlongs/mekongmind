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
    const userRow = (await db
      .prepare("SELECT github_access_token FROM users WHERE id = ?")
      .bind(session.sub)
      .first()) as { github_access_token: string | null } | null;

    const token = userRow?.github_access_token;
    if (!token) {
      return NextResponse.json({ error: "No GitHub token linked. Re-authenticate." }, { status: 403 });
    }

    const perPage = req.nextUrl.searchParams.get("per_page") ?? "50";
    const url = new URL("https://api.github.com/user/repos");
    url.searchParams.set("per_page", perPage);
    url.searchParams.set("sort", "updated");

    const ghRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });

    if (!ghRes.ok) {
      const text = await ghRes.text().catch(() => "GitHub API error");
      return NextResponse.json({ error: `GitHub ${ghRes.status}: ${text.slice(0, 200)}` }, { status: ghRes.status });
    }

    const repos = (await ghRes.json()) as Array<{
      id: number;
      name: string;
      full_name: string;
      private: boolean;
      updated_at: string;
      default_branch: string;
    }>;

    return NextResponse.json({ repos });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
