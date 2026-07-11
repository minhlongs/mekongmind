import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-16">
      <h1 className="text-3xl font-bold">Repositories</h1>
      <p className="mt-2 text-[#a0a0a8]">Connect a repository to start receiving AI-powered code reviews.</p>
      <div className="mt-12 rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--amber)]/10">
          <ArrowRight className="h-6 w-6 text-[var(--amber)]" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">No repositories connected</h2>
        <p className="mt-1 text-sm text-[#787880]">Connect your first repo to unlock automated review, finding tracking, and sprint infrastructure.</p>
        <Link href="/dashboard/repos" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--amber)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition hover:brightness-110">
          Connect Repo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
