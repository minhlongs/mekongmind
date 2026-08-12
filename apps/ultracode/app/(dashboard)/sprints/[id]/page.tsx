import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import SprintDetailClient from "./sprint-detail-client";

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

type Sprint = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  repoId: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  taskCount: number;
  doneCount: number;
};

type Task = {
  id: string;
  reviewId: string;
  assignee: string | null;
  status: string;
  reviewTitle: string;
  createdAt: string;
};

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getUser();
  if (!session) redirect("/auth/github");

  const sprintId = (await params).id;
  const db = getDb();

  // Fetch sprint + verify ownership
  const sprintRow = (await db
    .prepare("SELECT * FROM sprints WHERE id = ?")
    .bind(sprintId)
    .first()) as Record<string, unknown> | null;

  if (!sprintRow) notFound();

  const repoRow = (await db
    .prepare("SELECT user_id FROM repos WHERE id = ?")
    .bind(sprintRow.repo_id as string)
    .first()) as { user_id: string } | null;

  if (!repoRow || repoRow.user_id !== session.sub) notFound();

  // Fetch tasks with review titles
  const tasksResult = await db
    .prepare(
      `SELECT st.id, st.review_id, st.assignee, st.status, st.created_at, r.title AS review_title
       FROM sprint_tasks st
       JOIN reviews r ON r.id = st.review_id
       WHERE st.sprint_id = ?
       ORDER BY st.created_at`,
    )
    .bind(sprintId)
    .all();

  const taskRows = (tasksResult as { results: Record<string, unknown>[] }).results;

  const sprint: Sprint = {
    id: sprintRow.id as string,
    name: sprintRow.name as string,
    goal: sprintRow.goal as string | null,
    status: sprintRow.status as string,
    repoId: sprintRow.repo_id as string,
    startedAt: sprintRow.started_at as string | null,
    completedAt: sprintRow.completed_at as string | null,
    createdAt: sprintRow.created_at as string,
    taskCount: taskRows.length,
    doneCount: taskRows.filter((t) => t.status === "done").length,
  };

  const tasks: Task[] = taskRows.map((t) => ({
    id: t.id as string,
    reviewId: t.review_id as string,
    assignee: t.assignee as string | null,
    status: t.status as string,
    reviewTitle: t.review_title as string,
    createdAt: t.created_at as string,
  }));

  return <SprintDetailClient initialSprint={sprint} initialTasks={tasks} repoId={sprint.repoId} />;
}
