import Link from "next/link";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import AddToSprint from "./add-to-sprint";
import UnassignSprint from "./unassign-sprint";

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

type SprintRow = { id: string; name: string; status: string };
type ReviewRow = {
 id: string;
 findings_count: number | null;
 started_at: string | null;
 completed_at: string | null;
 full_name: string;
 repo_id: string;
};
type TaskDbRow = { review_id: string; sprint_name: string; sprint_id: string; task_id: string };

async function getReviews(sub: string) {
 const db = getDb();
 try {
 const result = await db
 .prepare(
 "SELECT r.id, r.findings_count, r.started_at, r.completed_at, repos.full_name, repos.id AS repo_id FROM reviews r JOIN repos ON repos.id = r.repo_id WHERE repos.user_id = ? ORDER BY r.started_at DESC",
 )
 .bind(sub)
 .all();
 return (result as { results: ReviewRow[] }).results;
 } catch {
 return [] as ReviewRow[];
 }
}

async function getActiveSprints(sub: string) {
 const db = getDb();
 try {
 const result = await db
 .prepare(
 `SELECT s.id, s.name, s.status
 FROM sprints s
 JOIN repos r ON r.id = s.repo_id
 WHERE r.user_id = ? AND s.status IN ('planned', 'active')`,
 )
 .bind(sub)
 .all();
 return (result as { results: SprintRow[] }).results;
 } catch {
 return [] as SprintRow[];
 }
}

// Returns a map: reviewId → { sprintName, sprintId, taskId }
async function getTaskMap(sub: string) {
 const db = getDb();
 try {
 const result = await db
 .prepare(
 `SELECT st.review_id, st.id AS task_id, s.id AS sprint_id, s.name AS sprint_name
 FROM sprint_tasks st
 JOIN sprints s ON s.id = st.sprint_id
 JOIN repos r ON r.id = s.repo_id
 WHERE r.user_id = ?`,
 )
 .bind(sub)
 .all();
 const map = new Map<string, { sprintName: string; sprintId: string; taskId: string }>();
 for (const row of (result as { results: TaskDbRow[] }).results) {
 map.set(row.review_id, {
 sprintName: row.sprint_name,
 sprintId: row.sprint_id,
 taskId: row.task_id,
 });
 }
 return map;
 } catch {
 return new Map<string, { sprintName: string; sprintId: string; taskId: string }>();
 }
}

export default async function ReviewsPage() {
 const session = await getUser();
 if (!session) {
 return <div className="p-8 text-sm text-[var(--foreground)]">Unauthorized.</div>;
 }

 const [reviews, sprints, taskMap] = await Promise.all([
 getReviews(session.sub),
 getActiveSprints(session.sub),
 getTaskMap(session.sub),
 ]);

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
 {reviews.map((r) => {
 const assigned = taskMap.get(r.id);
 return (
 <Link
 key={r.id}
 href={`/dashboard/reviews/${r.id}`}
 className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--amber)]/40"
 >
 <div className="flex items-center justify-between gap-4">
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold">{r.full_name}</p>
 <p className="mt-1 text-xs text-[#787880]">
 {new Date(r.started_at ?? "").toLocaleString("en-US")}
 </p>
 </div>

 {/* Sprint column }*/}
 <div className="flex items-center gap-2">
 {assigned ? (
 <div className="flex items-center gap-1">
 <Link
 href={`/dashboard/sprints/${assigned.sprintId}`}
 className="rounded bg-[var(--amber)]/10 px-2 py-0.5 text-xs font-medium text-[var(--amber)] hover:underline"
 onClick={(e) => e.stopPropagation()}
 >
 {assigned.sprintName}
 </Link>
 <UnassignSprint sprintId={assigned.sprintId} taskId={assigned.taskId} />
 </div>
 ) : (
 sprints.length > 0 && r.repo_id ? (
 <AddToSprint
 review={{ id: r.id, repo_id: r.repo_id }}
 sprints={sprints}
 />
 ) : (
 <span className="text-xs text-[#787880]">None</span>
 )
 )}

 <span className="rounded-full border px-2 py-0.5 text-xs text-[#a0a0a8]">
 {r.findings_count ?? 0} findings
 </span>
 </div>
 </div>
 </Link>
 );
 })}
 </div>
 )}
 </div>
 );
}
