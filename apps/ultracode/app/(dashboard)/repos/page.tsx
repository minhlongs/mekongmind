"use client";

import { useState } from "react";
import Link from "next/link";

const IconArrowRight = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconGithub = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.333-1.723-1.333-1.723-1.089-.73.083-.716.083-.716 1.205.083 1.838 1.215 1.838 1.215 1.07 1.802 2.807 1.281 3.492.98.108-.763.418-1.282.762-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.228-3.166-.123-.297-.532-1.497.117-3.12 0 0 1.001-.314 3.28 1.209A11.52 11.52 0 0 1 12 7.866c1.023.005 2.047.133 3.005.394 2.278-1.523 3.277-1.209 3.277-1.209.65 1.623.242 2.823.119 3.12.766.827 1.226 1.879 1.226 3.166 0 4.53-2.807 5.529-5.477 5.818.43.364.814 1.084.814 2.182 0 1.575-.014 2.846-.014 3.232 0 .316.216.683.825.567C20.565 21.917 24 17.5 24 12.292 24 5.78 18.627.5 12 .5Z" />
  </svg>
);

const IconLoader = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

type RepoRow = {
  id: string;
  full_name: string;
  private: boolean;
  connected_at: string;
};

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
};

async function listRepos(): Promise<RepoRow[]> {
  const res = await fetch("/api/repos/github", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data as { repos?: RepoRow[] }).repos ?? [];
}

async function registerRepo(body: {
  github_id: number;
  owner: string;
  repo_name: string;
  full_name: string;
  default_branch: string;
}) {
  const res = await fetch("/api/repos/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to register repo.");
  return res.json();
}

async function listConnected(): Promise<RepoRow[]> {
  const res = await fetch("/api/repos/github", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data as { repos?: RepoRow[] }).repos ?? [];
}

export default function ReposPage() {
  const [connected, setConnected] = useState<RepoRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [ghRepos, setGhRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openConnect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/repos/github", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to fetch repos.");
      }
      const data = await res.json();
      setGhRepos(data.repos ?? []);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(gh: GitHubRepo) {
    setRegistering(gh.full_name);
    try {
      await registerRepo({
        github_id: gh.id,
        owner: gh.full_name.split("/")[0],
        repo_name: gh.name,
        full_name: gh.full_name,
        default_branch: gh.default_branch,
      });
      setConnected((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          full_name: gh.full_name,
          private: gh.private,
          connected_at: new Date().toISOString(),
        },
      ]);
      setShowModal(false);
    } catch {
      setError("Failed to connect repo.");
    } finally {
      setRegistering(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repositories</h1>
          <p className="mt-1 text-sm text-[#a0a0a8]">Connect a repo to enable AI-powered code reviews.</p>
        </div>
        <button
          onClick={openConnect}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--background)] transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? <IconLoader /> : <IconGithub />}
          Connect Repo
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {connected.length === 0 ? (
        <div className="mt-12 rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center">
          <IconArrowRight className="mx-auto h-8 w-8 text-[var(--amber)]" />
          <h2 className="mt-4 text-lg font-semibold">No repos connected</h2>
          <p className="mt-1 text-sm text-[#787880]">Click &ldquo;Connect Repo&rdquo; above to browse your GitHub repos.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {connected.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <div>
                <p className="text-sm font-semibold">{r.full_name}</p>
                <p className="text-xs text-[#787880]">Connected {new Date(r.connected_at).toLocaleDateString()}</p>
              </div>
              <Link
                href={`/dashboard/repos/${encodeURIComponent(r.full_name.split("/")[0])}/${encodeURIComponent(r.full_name.split("/")[1] ?? "")}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--amber)] px-3 py-1.5 text-xs font-semibold text-[var(--amber)] transition hover:bg-[var(--amber)]/10"
              >
                View <IconArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
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
            <h2 className="text-lg font-bold">Select a repository</h2>
            <p className="mt-1 text-xs text-[#787880]">Choose a GitHub repo to connect to Ultracode.</p>
            <div className="mt-4 space-y-2">
              {ghRepos.length === 0 ? (
                <p className="text-sm text-[#787880]">No accessible repos found.</p>
              ) : (
                ghRepos.map((gh) => (
                  <button
                    key={gh.id}
                    onClick={() => handleConnect(gh)}
                    disabled={registering === gh.full_name}
                    className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 text-sm transition hover:border-[var(--amber)]/40 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <IconGithub className="h-4 w-4 text-[#787880]" />
                      {gh.full_name}
                    </span>
                    {registering === gh.full_name ? <IconLoader /> : <IconArrowRight className="h-4 w-4 text-[var(--amber)]" />}
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setShowModal(false)} className="mt-4 text-xs text-[#787880] hover:text-[var(--foreground)]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
