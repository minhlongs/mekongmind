import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import ReviewTriggerButton from "./review-trigger-button";

export const dynamic = "force-dynamic";

async function getUser(): Promise<{ sub: string } | null> {
  try {
    const raw = (await headers()).get("x-ultra-user");
    if (!raw) return null;
    return JSON.parse(raw) as { sub: string };
  } catch {
    return null;
  }
}

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const session = await getUser();
  if (!session) redirect("/auth/github");

  const db = getDb();
  const { owner, repo: repoSlug } = await params;
  const fullName = `${owner}/${repoSlug}`;

  const repo = (await db
    .prepare<
      { id: string; user_id: string; owner: string; repo_name: string; full_name: string; platform: string; default_branch: string; private: number; connected_at: string }
    >(
      "SELECT id, user_id, owner, repo_name, full_name, platform, default_branch, private, connected_at FROM repos WHERE user_id = ? AND full_name = ?",
    )
    .bind(session.sub, fullName)
    .first()) as
    | { id: string; user_id: string; owner: string; repo_name: string; full_name: string; platform: string; default_branch: string; private: number; connected_at: string }
    | undefined;

  if (!repo) notFound();

  const rows = (await db
    .prepare<
      { id: string; status: string; findings_count: number | null; started_at: string | null; completed_at: string | null }
    >(
      "SELECT id, status, findings_count, started_at, completed_at FROM reviews WHERE repo_id = ? ORDER BY started_at DESC LIMIT 10",
    )
    .bind(repo.id)
    .all()) as { results: Array<{ id: string; status: string; findings_count: number | null; started_at: string | null; completed_at: string | null }> };
  const reviewsResult = rows.results;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Repo header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{repo.full_name}</h1>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${repo.private ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-700"}`}
          >
            {repo.private ? "Private" : "Public"}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {repo.platform} · default: {repo.default_branch} · connected{" "}
          {new Date(repo.connected_at).toLocaleDateString()}
        </p>
      </div>

      {/* Trigger */}
      <ReviewTriggerButton owner={repo.owner} repo={repo.repo_name} repoId={repo.id} />

      {/* Reviews */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Reviews</h2>
        {reviewsResult.length === 0 ? (
          <p className="text-sm text-gray-400">No reviews yet. Click the button above to start.</p>
        ) : (
          <div className="space-y-2">
            {reviewsResult.map((r) => (
              <a
                key={r.id}
                href={`/dashboard/reviews/${r.id}`}
                className="flex items-center justify-between p-3 rounded border hover:bg-gray-50"
              >
                <span className="text-sm font-mono">#{r.id.slice(0, 8)}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status] || "bg-gray-100"}`}
                >
                  {r.status}
                </span>
                <span className="text-xs text-gray-500">{r.findings_count ?? 0} findings</span>
                <span className="text-xs text-gray-400">{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
