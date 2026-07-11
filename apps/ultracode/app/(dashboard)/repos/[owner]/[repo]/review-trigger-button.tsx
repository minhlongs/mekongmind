"use client";

import { useState } from "react";

export default function ReviewTriggerButton({
  owner,
  repo,
  repoId,
}: {
  owner: string;
  repo: string;
  repoId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrigger = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/review/trigger`,
        { method: "POST" },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.jobId) {
        window.location.href = `/dashboard/reviews/${data.jobId}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleTrigger}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {loading ? "Starting review…" : "Run Code Review"}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
