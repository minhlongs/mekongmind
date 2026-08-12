"use client";

import { useEffect, useState } from "react";

type Sprint = {
  id: string;
  name: string;
  status: string;
};

type Review = {
  id: string;
  title?: string;
  repo_id?: string;
};

type Props = {
  review: Review;
  sprints: Sprint[];
  repoId?: string;
};

export default function AddToSprint({ review, sprints, repoId }: Props) {
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableSprints = sprints.filter(
    (s) => (s.status === "planned" || s.status === "active"),
  );

  async function handleAdd() {
    if (!selectedSprintId) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sprints/${selectedSprintId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: review.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus(body.error ?? "Failed");
      } else {
        setStatus("added");
        setSelectedSprintId("");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  if (availableSprints.length === 0) {
    return <span className="text-xs text-[#787880]">No active sprint</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedSprintId}
        onChange={(e) => setSelectedSprintId(e.target.value)}
        className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
      >
        <option value="">Sprint…</option>
        {availableSprints.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAdd}
        disabled={!selectedSprintId || loading}
        className="rounded bg-[var(--amber)] px-2 py-1 text-xs font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "…" : "Add"}
      </button>
      {status === "added" && <span className="text-xs text-emerald-500">✓ Added</span>}
      {status === "error" && <span className="text-xs text-red-400">Error</span>}
    </div>
  );
}
