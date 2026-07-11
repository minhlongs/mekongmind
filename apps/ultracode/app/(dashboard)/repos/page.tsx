"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Github, Loader2 } from "lucide-react";

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

async function registerRepo(body: { github_id: number; owner: string; repo_name: string; full_name: string; default_branch: string }) {
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          Connect Repo
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {connected.length === 0 ? (
        <div className="mt-12 rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center">
          <ArrowRight className="mx-auto h-8 w-8 text-[var(--amber)]" />
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
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div className="max-h-[70vh] w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6" onClick={(e) => e.stopPropagation()}>
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
                      <Github className="h-4 w-4 text-[#787880]" />
                      {gh.full_name}
                    </span>
                    {registering === gh.full_name ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 text-[var(--amber)]" />}
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
