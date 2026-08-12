"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Session = {
  login: string;
  name: string | null;
  avatar_url: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const repoCount = 0;

  useEffect(() => {
    function readSession(): Session | null {
      try {
        const raw =
          document.cookie
            .split("; ")
            .find((c) => c.startsWith("ultracode_session="))
            ?.split("=")[1];
        if (!raw) {
          return null;
        }
        const payload = JSON.parse(atob(raw.split(".")[1]));
        return {
          login: payload.login,
          name: payload.name ?? null,
          avatar_url: payload.avatar_url ?? null,
        };
      } catch {
        return null;
      }
    }

    const s = readSession();
    setSession(s);
    setHydrated(true);

    if (!s) {
      router.replace("/auth/github");
      return;
    }
  }, [router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-[#787880]">Loading...</div>
      </div>
    );
  }

  const joinDate = session
    ? new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const displayName = session?.name || session?.login || "User";

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Welcome Section */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Welcome back, {displayName}
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[var(--border)] rounded-lg p-5">
            <p className="text-sm text-[#787880] uppercase tracking-wider mb-1">
              Repositories
            </p>
            <p className="text-2xl font-semibold text-[var(--foreground)]">
              0
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-lg p-5">
            <p className="text-sm text-[#787880] uppercase tracking-wider mb-1">
              Member since
            </p>
            <p className="text-2xl font-semibold text-[var(--foreground)]">
              {joinDate}
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-lg p-5">
            <p className="text-sm text-[#787880] uppercase tracking-wider mb-1">
              Plan
            </p>
            <p className="text-2xl font-semibold text-[var(--amber)]">Free</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/repos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--amber)] text-white rounded-md text-sm font-medium hover:bg-[var(--amber)]/90 transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Repository
            </Link>

            <Link
              href="/dashboard/reviews"
              className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              View Reviews
            </Link>
          </div>
        </div>

        {/* Activity hint */}
        <p className="text-sm text-[#787880] mt-6">
          Connect your GitHub repositories to start AI-powered code reviews.
        </p>
      </div>
    </div>
  );
}
