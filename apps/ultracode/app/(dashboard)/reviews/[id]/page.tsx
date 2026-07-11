import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import ReviewDetailInner from "./review-detail-inner";

export const dynamic = "force-dynamic";

type UserSession = { sub: string; login: string; name: string | null; avatar_url: string | null };

async function getUser(): Promise<UserSession | null> {
  try {
    const raw = (await headers()).get("x-ultra-user");
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

type ReviewDetail = {
  review: {
    id: string;
    status: string;
    title: string;
    repo: string;
    startedAt: string;
    completedAt: string | null;
    findingsCount: number;
  };
  findings: Array<{
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
    filePath: string;
    lineStart: number | null;
    lineEnd: number | null;
    suggestion: string;
    status: string;
  }>;
};

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getUser();
  if (!session) redirect("/auth/github");

  const db = getDb();
  const reviewId = (await params).id;

  type ReviewRow = {
    id: string;
    status: string;
    title: string;
    findings_count: number | null;
    started_at: string;
    completed_at: string | null;
    repo_name: string;
    owner_id: string;
  };

  const review = (await db
    .prepare<ReviewRow>(
      `SELECT r.id, r.status, r.title, r.findings_count, r.started_at, r.completed_at,
              rp.full_name as repo_name, rp.user_id as owner_id
       FROM reviews r
       JOIN repos rp ON rp.id = r.repo_id
       WHERE r.id = ?`,
    )
    .bind(reviewId)
    .first()) as ReviewRow | undefined;

  if (!review || review.owner_id !== session.sub) {
    notFound();
  }

  type FindingRow = {
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
    file_path: string;
    line_start: number | null;
    line_end: number | null;
    suggestion: string;
    status: string;
  };

  const findings =
    review.status === "completed"
      ? ((await db
          .prepare<FindingRow>(
            "SELECT id, severity, category, title, description, file_path, line_start, line_end, suggestion, status FROM findings WHERE review_id = ? ORDER BY created_at ASC",
          )
          .bind(reviewId)
          .all()) as { results: FindingRow[] }).results
      : [];

  const initialData: ReviewDetail = {
    review: {
      id: review.id,
      status: review.status,
      title: review.title,
      repo: review.repo_name,
      startedAt: review.started_at,
      completedAt: review.completed_at,
      findingsCount: review.findings_count ?? 0,
    },
    findings: findings.map((f) => ({
      id: f.id,
      severity: f.severity,
      category: f.category,
      title: f.title,
      description: f.description,
      filePath: f.file_path,
      lineStart: f.line_start,
      lineEnd: f.line_end,
      suggestion: f.suggestion,
      status: f.status,
    })),
  };

  return <ReviewDetailInner initialData={initialData} reviewId={reviewId} />;
}
