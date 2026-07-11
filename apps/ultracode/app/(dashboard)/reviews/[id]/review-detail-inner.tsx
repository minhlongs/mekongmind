"use client";

import { useState } from "react";
import Link from "next/link";
import { useReviewStream } from "@/hooks/use-review-stream";

type Finding = {
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
};

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
  findings: Finding[];
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug",
  security: "Security",
  performance: "Performance",
  style: "Style",
  "best-practice": "Best Practice",
};

export default function ReviewDetailInner({
  initialData,
  reviewId,
}: {
  initialData: ReviewDetail | null;
  reviewId: string;
}) {
  const [review, setReview] = useState(initialData?.review ?? null);
  const [findings] = useState(initialData?.findings ?? []);
  useReviewStream(reviewId, {
    onEvent: (evt) => {
      if (evt.type === "status") {
        setReview((prev) => (prev ? { ...prev, status: evt.status, findingsCount: evt.findingsCount } : prev));
      }
    },
    onComplete: (data) => {
      setReview((prev) =>
        prev
          ? { ...prev, status: "completed", findingsCount: data.findingsCount, completedAt: new Date().toISOString() }
          : prev,
      );
    },
    onError: () => {
      setReview((prev) => (prev ? { ...prev, status: "failed" } : prev));
    },
  });

  if (!review) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-16">
        <p className="text-sm text-[#787880]">Review not found.</p>
        <Link href="/dashboard/reviews" className="text-xs text-[var(--amber)] hover:underline">
          &larr; Back to reviews
        </Link>
      </div>
    );
  }

  const isRunning = review.status === "pending" || review.status === "in_progress";

  return (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#787880]">{review.repo}</p>
          <h1 className="text-2xl font-bold">{review.title}</h1>
          <p className="mt-1 text-xs text-[#787880]">
            {new Date(review.startedAt).toLocaleString("en-US")}
            {review.completedAt ? ` → ${new Date(review.completedAt).toLocaleString("en-US")}` : " (in progress)"}
          </p>
        </div>
        <Link href="/dashboard/reviews" className="text-xs text-[var(--amber)] hover:underline">
          &larr; Back to reviews
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[#a0a0a8]">
          {review.findingsCount} findings
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs ${review.status === "completed" ? "border-emerald-500/30 text-emerald-400" : isRunning ? "border-amber-500/30 text-amber-400 animate-pulse" : "border-red-500/30 text-red-400"}`}
        >
          {review.status}
        </span>
      </div>

      {isRunning && (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-sm text-[#787880]">Review in progress… findings will appear here when complete.</p>
        </div>
      )}

      {!isRunning && findings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-sm text-[#787880]">No findings recorded for this review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {findings.map((f) => (
            <div
              key={f.id}
              className={`rounded-xl border p-4 ${SEVERITY_STYLES[f.severity] ?? "border-[var(--border)] bg-[var(--surface)]"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase">{f.severity}</span>
                    <span className="rounded border border-current/20 px-1.5 py-0.5 text-[10px]">
                      {CATEGORY_LABELS[f.category] ?? f.category}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed opacity-80">{f.description}</p>
                  {f.suggestion && (
                    <div className="mt-3 rounded-lg border border-current/10 bg-black/20 p-3">
                      <p className="text-[10px] font-semibold uppercase opacity-60">Suggestion</p>
                      <p className="mt-1 text-xs leading-relaxed">{f.suggestion}</p>
                    </div>
                  )}
                </div>
                <span className="whitespace-nowrap text-[10px] font-mono opacity-60">
                  {f.filePath}:{f.lineStart ?? "?"}:{f.lineEnd ?? "?"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
