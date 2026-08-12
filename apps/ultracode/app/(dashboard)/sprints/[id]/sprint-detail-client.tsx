"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useActionState } from "react";

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

type ReviewMeta = {
  id: string;
  title: string;
};

type StatusKey = "pending" | "in_progress" | "done" | "skipped";

const STATUS_OPTIONS: StatusKey[] = ["pending", "in_progress", "done", "skipped"];

const COLUMN_META: Record<StatusKey, { label: string; className: string }> = {
  pending: { label: "Pending", className: "border-[#a0a0a8]/30" },
  in_progress: { label: "In Progress", className: "border-[var(--amber)]/40" },
  done: { label: "Done", className: "border-emerald-500/40" },
  skipped: { label: "Skipped", className: "border-gray-500/30" },
};

const IconLoader = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const IconX = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevronLeft = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconPlus = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

function statusBadge(status: string) {
  switch (status) {
    case "planned":
      return <span className="rounded-full bg-[var(--amber)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--amber)]">Planned</span>;
    case "active":
      return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">Active</span>;
    case "completed":
      return <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">Completed</span>;
    default:
      return <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-semibold text-gray-400">{status}</span>;
  }
}

export default function SprintDetailClient({
  initialSprint,
  initialTasks,
  repoId,
}: {
  initialSprint: Sprint;
  initialTasks: Task[];
  repoId: string;
}) {
  const router = useRouter();
  const [sprint, setSprint] = useState<Sprint>(initialSprint);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviews, setReviews] = useState<ReviewMeta[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const columns: StatusKey[] = ["pending", "in_progress", "done", "skipped"];

  const progressPct =
    sprint.taskCount === 0 ? 0 : Math.round((sprint.doneCount / sprint.taskCount) * 100);

  function refreshSprint() {
    fetch(`/api/sprints/${sprint.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { sprint: Sprint; tasks: Task[] }) => {
        setSprint(data.sprint);
        setTasks(data.tasks);
      })
      .catch(() => {});
  }

  async function handleStatusTransition(next: string) {
    setActionError(null);
    setLoading(true);
    try {
      // Determine timestamps for transition
      const body: Record<string, string | null> = { status: next };
      if (next === "active" && !sprint.startedAt) body.startedAt = new Date().toISOString();
      if (next === "completed" && !sprint.completedAt) body.completedAt = new Date().toISOString();

      const res = await fetch(`/api/sprints/${sprint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to update sprint.");
      }
      refreshSprint();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this sprint? This cannot be undone.")) return;
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/sprints/${sprint.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete sprint.");
      router.push("/dashboard/sprints");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unknown error.");
      setLoading(false);
    }
  }

  async function handleTaskStatusChange(taskId: string, newStatus: string) {
    const res = await fetch(`/api/sprints/${sprint.id}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) refreshSprint();
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Remove this task from the sprint?")) return;
    const res = await fetch(`/api/sprints/${sprint.id}/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) refreshSprint();
  }

  function openAddModal() {
    setShowAddModal(true);
    setSelectedReviewId("");
    setAssignee("");
    if (reviews.length === 0) loadReviews();
  }

  async function loadReviews() {
    setReviewsLoading(true);
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { reviews: { id: string; repo: string }[] };
        // Filter client-side by matching sprint's repo
        setReviews(
          (data.reviews ?? []).filter(
            (r) => r.repo === repoId,
          ).map((r) => ({ id: r.id, title: r.repo })),
        );
      }
    } catch {
      // silent
    } finally {
      setReviewsLoading(false);
    }
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReviewId) return;
    const res = await fetch(`/api/sprints/${sprint.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: selectedReviewId, assignee: assignee || null }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setActionError(data.error ?? "Failed to add review.");
      return;
    }
    setShowAddModal(false);
    refreshSprint();
  }

  function ActionButtons() {
    const canStart = sprint.status === "planned";
    const canComplete = sprint.status === "active";
    return (
      <div className="flex items-center gap-2">
        {canStart && (
          <button
            onClick={() => handleStatusTransition("active")}
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            Start Sprint
          </button>
        )}
        {canComplete && (
          <button
            onClick={() => handleStatusTransition("completed")}
            disabled={loading}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            Complete Sprint
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-16">
      <button
        onClick={() => router.push("/dashboard/sprints")}
        className="inline-flex items-center gap-1 text-xs text-[#787880] transition hover:text-[var(--foreground)]"
      >
        <IconChevronLeft /> All Sprints
      </button>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-bold">{sprint.name}</h1>
            {statusBadge(sprint.status)}
          </div>
          {sprint.goal && <p className="mt-2 text-sm text-[#787880]">{sprint.goal}</p>}
          <p className="mt-1 text-xs text-[#a0a0a8]">Created {new Date(sprint.createdAt).toLocaleDateString()}</p>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-[#787880]">{sprint.doneCount}/{sprint.taskCount} tasks done</span>
            <div className="h-2 w-48 rounded-full bg-[var(--border)]">
              <div className="h-2 rounded-full bg-[var(--amber)]" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-[#787880]">{progressPct}%</span>
          </div>
        </div>
        <ActionButtons />
      </div>

      {actionError && <p className="mt-4 text-sm text-red-400">{actionError}</p>}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Kanban Board</h2>
          {sprint.status !== "completed" && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--amber)] px-3 py-1.5 text-xs font-semibold text-[var(--amber)] transition hover:bg-[var(--amber)]/10"
            >
              <IconPlus /> Add Review
            </button>
          )}
        </div>

        {sprint.status === "completed" && (
          <p className="mt-2 text-xs text-[#787880]">Sprint is completed. No more tasks can be added.</p>
        )}

        <div className="mt-4 grid grid-cols-4 gap-4">
          {columns.map((col) => {
            const meta = COLUMN_META[col];
            const colTasks = tasks.filter((t) => t.status === col);
            return (
              <div key={col} className={`rounded-xl border ${meta.className} bg-[var(--surface)]/50 p-3`}>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-[#787880]">{meta.label}</span>
                  <span className="text-xs tabular-nums text-[#a0a0a8]">{colTasks.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {colTasks.length === 0 && (
                    <p className="px-1 text-xs text-[#787880]/60">Empty</p>
                  )}
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                    >
                      <p className="text-sm font-medium leading-snug">{task.reviewTitle}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="truncate text-xs text-[#787880]">
                          {task.assignee ?? "Unassigned"}
                        </span>
                        <select
                          value={task.status}
                          onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                          disabled={sprint.status === "completed"}
                          className="rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-xs disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-[#787880]/60">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={sprint.status === "completed"}
                          className="text-xs text-red-400/70 transition hover:text-red-400 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="max-h-[70vh] w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Review to Sprint</h2>
              <button onClick={() => setShowAddModal(false)} className="rounded p-1 text-[#787880] hover:text-[var(--foreground)]">
                <IconX />
              </button>
            </div>
            <p className="mt-1 text-xs text-[#787880]">Select a review from this repo to add as a sprint task.</p>
            <form onSubmit={handleAddReview} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#787880]">Assign to (optional)</label>
                <input
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="e.g. @alice"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#787880]">Review</label>
                {reviewsLoading ? (
                  <p className="mt-1 flex items-center gap-2 text-sm text-[#787880]"><IconLoader /> Loading reviews…</p>
                ) : reviews.length === 0 ? (
                  <p className="mt-1 text-sm text-[#787880]">No reviews found for this repo.</p>
                ) : (
                  <select
                    value={selectedReviewId}
                    onChange={(e) => setSelectedReviewId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select review…</option>
                    {reviews.map((r) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                )}
              </div>
              {actionError && <p className="text-sm text-red-400">{actionError}</p>}
              <button
                type="submit"
                disabled={!selectedReviewId}
                className="rounded-lg bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--background)] transition hover:brightness-110 disabled:opacity-40"
              >
                Add to Sprint
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
