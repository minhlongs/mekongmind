import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import SprintsClient from "./sprints-client";

export const dynamic = "force-dynamic";

type UserSession = {
  sub: string;
  login: string;
  name: string | null;
  avatar_url: string | null;
};

async function getUser(): Promise<UserSession | null> {
  try {
    const raw = (await headers()).get("x-ultra-user");
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

type RepoRow = { id: string; full_name: string };

export default async function SprintsPage() {
  const session = await getUser();
  if (!session) {
    return (
      <div className="p-8 text-sm text-[var(--foreground)]">Unauthorized.</div>
    );
  }

  const db = getDb();
  const reposResult = await db
    .prepare("SELECT id, full_name FROM repos WHERE user_id = ? ORDER BY full_name")
    .bind(session.sub)
    .all();
  const repos = (reposResult as { results: RepoRow[] }).results;

  const initialRepoId = repos[0]?.id ?? null;
  let initialSprints: unknown[] = [];
  if (initialRepoId) {
    const sprintsResult = await db
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
      .bind(initialRepoId)
      .all();
    initialSprints = (sprintsResult as { results: Record<string, unknown>[] }).results;
  }

  return (
    <SprintsClient
      initialSprints={initialSprints as never[]}
      initialRepoId={initialRepoId}
      repos={repos}
    />
  );
}
