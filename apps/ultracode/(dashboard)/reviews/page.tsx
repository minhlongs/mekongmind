import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db/client";

export const dynamic = "force-dynamic";

async function getReviews() {
  const session = await getSession();
  if (!session) return null;
  const db = getDb();
  try {
    const result = await db
      .prepare(
        `SELECT r.id, r.status, r.findings_count, r.started_at, r.completed_at, repos.full_name AS repo
         FROM reviews r
         JOIN repos ON repos.id = r.repo_id
         WHERE repos.user_id = ?
         ORDER BY r.started_at DESC`,
      )
      .bind(session.sub)
      .all();
    return (result as { results: Record<string, unknown>[] }).results.map((r) => ({
      id: r.id as string,
      repo: r.repo as string,
      status: r.status as string,
      findingsCount: (r.findings_count as number) ?? 0,
      startedAt: r.started_at as string,
      completedAt: r.completed_at as string | null,
    }));
  } catch {
    return [];
  }
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/15 text-red-300 border-red-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

const STATUS_STYLES: Record<string, string> = {
  completed: "text-emerald-400",
  pending: "text-amber-400",
  failed: "text-red-400",
};

export default async function ReviewsPage() {
  const reviews = await getReviews();

  if (!reviews) {
    return <div className="p-8 text-sm text-[var(--foreground)]">Unauthorized.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <h1 className="text-3xl font-bold">Review History</h1>
      {reviews.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-sm text-[#787880]">No reviews yet. Go to Repos and run your first review.</p>
          <Link href="/dashboard/repos" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--background)]">Go to Repos</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <Link key={r.id} href={`/dashboard/reviews/${r.id}`} className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--amber)]/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{r.repo}</p>
                  <p className="mt-1 text-xs text-[#787880]">
                    {new Date(r.startedAt).toLocaleString("en-US")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${STATUS_STYLES[r.status] ?? "text-[#a0a0a8]"}`}>{r.status}</span>
                  <span className="rounded-full border px-2 py-0.5 text-xs text-[#a0a0a8]">{r.findingsCount} findings</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
