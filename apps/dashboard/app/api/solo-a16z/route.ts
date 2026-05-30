/**
 * Solo a16z plan state — read/write .mekong/solo-a16z/<project>.json
 *
 * GET  /api/solo-a16z?project=<slug>   → { state, total }
 * POST /api/solo-a16z?project=<slug>   → { ok, total }   body: { state }
 *
 * The CLI (cli/commands/plan_a16z.py) writes the same files, so the dashboard
 * and the terminal stay in sync.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

// dashboard runs at apps/dashboard, repo root is two levels up
const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const STATE_DIR = path.join(REPO_ROOT, ".mekong", "solo-a16z");
const FRAMEWORK_PATH = path.join(
  REPO_ROOT,
  ".claude-skills",
  "solo-a16z-plan",
  "framework.json",
);

type Card = { field: string; purpose: string; prompt?: string; input_ref?: string; is_input?: boolean };
type Section = { id: string; title: string; subtitle: string; icon: string; cards: Card[] };

function safeSlug(s: string | null): string {
  const v = (s || "default").replace(/[^a-zA-Z0-9_-]/g, "_");
  return v || "default";
}

async function getTotal(): Promise<number> {
  try {
    const raw = await fs.readFile(FRAMEWORK_PATH, "utf-8");
    const fw = JSON.parse(raw) as Section[];
    return fw.reduce((acc, s) => acc + s.cards.length, 0);
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = safeSlug(url.searchParams.get("project"));
  const file = path.join(STATE_DIR, `${slug}.json`);
  const total = await getTotal();
  try {
    const raw = await fs.readFile(file, "utf-8");
    const state = JSON.parse(raw);
    return NextResponse.json({ ok: true, project: slug, state, total });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return NextResponse.json({
        ok: true,
        project: slug,
        state: { project: slug, seed: "", results: {}, completed: {}, updated_at: null },
        total,
      });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const slug = safeSlug(url.searchParams.get("project"));
  const body = (await req.json().catch(() => ({}))) as { state?: unknown };
  if (!body.state || typeof body.state !== "object") {
    return NextResponse.json({ ok: false, error: "missing 'state' object" }, { status: 400 });
  }
  await fs.mkdir(STATE_DIR, { recursive: true });
  const stamped = {
    ...(body.state as Record<string, unknown>),
    project: slug,
    updated_at: new Date().toISOString(),
  };
  const file = path.join(STATE_DIR, `${slug}.json`);
  await fs.writeFile(file, JSON.stringify(stamped, null, 2), "utf-8");
  const total = await getTotal();
  return NextResponse.json({ ok: true, project: slug, total });
}
