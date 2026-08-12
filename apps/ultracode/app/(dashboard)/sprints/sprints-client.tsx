"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type RepoRow = {
  id: string;
  full_name: string;
};

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

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  planned: {
    label: "Planned",
    className: "rounded-full bg-[var(--amber)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--amber)]",
  },
  active: {
    label: "Active",
    className: "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400",
  },
  completed: {
    label: "Completed",
    className: "rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400",
  },
};

const IconPlus = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

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

export default function SprintsClient({
  initialSprints,
  initialRepoId,
  repos,
}: {
  initialSprints: Sprint[];
  initialRepoId: string | null;
  repos: RepoRow[];
}) {
  const router = useRouter();
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [repoId, setRepoId] = useState(initialRepoId ?? "");
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/sprints?repo_id=${repoId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: { sprints: Sprint[] }) => {
        if (!cancelled) setSprints(data.sprints ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load sprints.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repoId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !repoId) return;
    const res = await fetch("/api/sprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), goal: goal.trim() || null, repo_id: repoId }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Failed to create sprint.");
      return;
    }
    const data = (await res.json()) as { sprint: Sprint };
    setSprints((prev) => [data.sprint, ...prev]);
    setName("");
    setGoal("");
    setShowModal(false);
  }

  const progressPct =
    sprints.length === 0
      ? 0
      : Math.round((sprints.reduce((sum, s) => sum + s.doneCount, 0) / sprints.reduce((sum, s) => sum + s.taskCount, 0)) * 100) || 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sprints</h1>
          <p className="mt-1 text-sm text-[#787880]">Plan and track review sprints for your repositories.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--background)] transition hover:brightness-110"
        >
          <IconPlus /> New Sprint
        </button>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-[#787880]">Repository</label>
        <select
          value={repoId}
          onChange={(e) => setRepoId(e.target.value)}
          className="mt-1 w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">Select a repo…</option>
          {repos.map((r) => (
            <option key={r.id} value={r.id}>{r.full_name}</option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {!repoId ? (
        <div className="mt-12 rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-sm font-semibold">Select a repository</p>
          <p className="mt-1 text-xs text-[#787880]">Choose a repo above to browse its sprints.</p>
        </div>
      ) : loading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-[#787880]"><IconLoader /> Loading sprints…</p>
      ) : sprints.length === 0 ? (
        <div className="mt-12 rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-sm font-semibold">No sprints yet</p>
          <p className="mt-1 text-xs text-[#787880]">Create your first sprint to start organizing review work.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 text-xs text-[#787880]">
            <span>Progress</span>
            <div className="h-2 flex-1 rounded-full bg-[var(--border)]">
              <div className="h-2 rounded-full bg-[var(--amber)]" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="tabular-nums">{progressPct}%</span>
          </div>
          {sprints.map((s) => {
            const pct = s.taskCount === 0 ? 0 : Math.round((s.doneCount / s.taskCount) * 100);
            const badge = STATUS_BADGE[s.status] ?? {
              label: s.status,
              className: "rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-semibold text-gray-400",
            };
            return (
              <button
                key={s.id}
                onClick={() => router.push(`/dashboard/sprints/${s.id}`)}
                className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--amber)]/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.name}</p>
                  {s.goal && <p className="mt-1 text-xs text-[#787880] truncate">{s.goal}</p>}
                  <div className="mt-2 flex items-center gap-3">
                    <span className={badge.className}>{badge.label}</span>
                    <span className="text-xs text-[#787880]">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <span className="text-xs text-[#a0a0a8] tabular-nums">{s.doneCount}/{s.taskCount} done</span>
                  <div className="h-1.5 w-32 rounded-full bg-[var(--border)]">
                    <div className="h-1.5 rounded-full bg-[var(--amber)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="max-h-[70vh] w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Sprint</h2>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-[#787880] hover:text-[var(--foreground)]">
                <IconX />
              </button>
            </div>
            <p className="mt-1 text-xs text-[#787880]">Create a sprint to organize review tasks.</p>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#787880]">Repository</label>
                <select
                  value={repoId}
                  onChange={(e) => setRepoId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select repo…</option>
                  {repos.map((r) => (
                    <option key={r.id} value={r.id}>{r.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#787880]">Sprint Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Security hardening — July"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#787880]">Goal (optional)</label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What does success look like?"
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={!name.trim() || !repoId}
                className="rounded-lg bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--background)] transition hover:brightness-110 disabled:opacity-40"
              >
                Create Sprint
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
