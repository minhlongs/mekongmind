"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Solo a16z business-plan platform.
 *
 * Embeds /embeds/solo-a16z-plan.html in an iframe and bridges its localStorage
 * state back to the filesystem at .mekong/solo-a16z/<project>.json via
 * /api/solo-a16z. This way the same plan is visible in CLI and dashboard.
 */
export default function Page() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [project, setProject] = useState<string>("default");
  const [status, setStatus] = useState<string>("ready");
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  // Pull project from URL once mounted
  useEffect(() => {
    const url = new URL(window.location.href);
    const p = url.searchParams.get("project") || "default";
    setProject(p);
  }, []);

  // Load state from server → push into iframe
  async function loadFromServer() {
    setStatus("loading…");
    const res = await fetch(`/api/solo-a16z?project=${encodeURIComponent(project)}`);
    const data = await res.json();
    iframeRef.current?.contentWindow?.postMessage(
      { type: "solo-a16z:hydrate", state: data.state ?? {} },
      "*",
    );
    setStatus("loaded");
    setProgress({
      done: Object.values(data.state?.completed ?? {}).filter(Boolean).length,
      total: data.total ?? 0,
    });
  }

  // Save iframe state to server
  async function saveToServer(state: unknown) {
    setStatus("saving…");
    const res = await fetch(`/api/solo-a16z?project=${encodeURIComponent(project)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    const data = await res.json();
    setStatus(data.ok ? "saved" : `error: ${data.error}`);
    setProgress({
      done: Object.values((state as { completed?: Record<string, boolean> })?.completed ?? {}).filter(Boolean).length,
      total: data.total ?? progress.total,
    });
  }

  // Listen to iframe → save
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "solo-a16z:state") {
        saveToServer(e.data.state);
      } else if (e.data.type === "solo-a16z:ready") {
        loadFromServer();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  return (
    <div className="flex flex-col gap-[var(--spacing-md)] p-[var(--spacing-xl)]">
      <div className="flex items-start justify-between gap-[var(--spacing-md)]">
        <div>
          <h1 className="font-mono text-[var(--font-2xl)] font-bold text-[var(--text-primary)]">
            Solo a16z Plan
          </h1>
          <p className="mt-[var(--spacing-xs)] text-[var(--font-sm)] text-[var(--text-secondary)]">
            14 sections · 61 cards · contrarian-thesis-first business plan for solo founders.
          </p>
        </div>
        <div className="flex flex-col items-end gap-[var(--spacing-xs)] text-[var(--font-xs)] text-[var(--text-muted)]">
          <span>
            project=<span className="font-mono text-[var(--text-primary)]">{project}</span>
          </span>
          <span>
            progress=
            <span className="font-mono text-[var(--text-primary)]">
              {progress.done}/{progress.total}
            </span>
          </span>
          <span>status: {status}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[var(--spacing-lg)]">
        {[
          { label: "Sections", value: 14 },
          { label: "Prompt cards", value: 61 },
          { label: "Completed", value: progress.done },
          { label: "Stored at", value: ".mekong/solo-a16z" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"
          >
            <span className="text-[var(--font-xs)] text-[var(--text-muted)]">{s.label}</span>
            <span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Solo a16z Plan"
          src={`/embeds/solo-a16z-plan.html?project=${encodeURIComponent(project)}&bridge=1`}
          className="w-full"
          style={{ height: "calc(100vh - 220px)", border: 0, display: "block" }}
        />
      </div>
    </div>
  );
}
