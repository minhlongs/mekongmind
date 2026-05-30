"use client";

// Terminal-style mission view. Lightweight CSS implementation —
// xterm.js can be swapped in later via dynamic import for full ANSI support.

import { useEffect, useRef, useState, FormEvent } from "react";
import { createMission, InsufficientCreditsError } from "@/lib/api-client";
import { getTenantId } from "@/lib/auth";
import { MissionStream } from "@/lib/sse-client";

interface Line {
  type: "input" | "output" | "system" | "error";
  text: string;
}

export function TerminalView() {
  const [lines, setLines] = useState<Line[]>([
    { type: "system", text: "Mekong IDE — type a goal and press Enter." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const streamRef = useRef<MissionStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function append(line: Line) {
    setLines((prev) => [...prev, line]);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    return () => streamRef.current?.close();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const goal = input.trim();
    if (!goal || busy) return;

    const tenantId = getTenantId();
    if (!tenantId) {
      append({ type: "error", text: "Not authenticated. Please sign in again." });
      return;
    }

    append({ type: "input", text: `$ ${goal}` });
    setInput("");
    setBusy(true);

    try {
      const { mission_id } = await createMission(goal, tenantId);
      append({ type: "system", text: `mission ${mission_id} started.` });

      streamRef.current?.close();
      streamRef.current = new MissionStream(mission_id, {
        onMessage: (e) => append({ type: "output", text: e.data }),
        onError: () =>
          append({ type: "system", text: "stream disconnected. retrying…" }),
        onOpen: () => append({ type: "system", text: "stream connected." }),
      });
      streamRef.current.start();
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        append({
          type: "error",
          text: `Out of credits. Recharge: ${err.rechargeUrl}`,
        });
      } else {
        const msg = err instanceof Error ? err.message : "unknown_error";
        append({ type: "error", text: `error: ${msg}` });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-neutral-950 font-mono text-sm">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 text-neutral-200"
      >
        {lines.map((line, i) => (
          <pre
            key={i}
            className={
              line.type === "input"
                ? "text-emerald-400"
                : line.type === "error"
                ? "text-red-400"
                : line.type === "system"
                ? "text-neutral-500"
                : "text-neutral-200"
            }
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {line.text}
          </pre>
        ))}
      </div>
      <form
        onSubmit={submit}
        className="flex border-t border-neutral-800 bg-neutral-900"
      >
        <span className="flex select-none items-center px-3 text-emerald-400">
          {busy ? "…" : "$"}
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="scout user model"
          disabled={busy}
          autoFocus
          className="flex-1 bg-transparent py-3 text-neutral-100 outline-none placeholder:text-neutral-600"
        />
      </form>
    </div>
  );
}
