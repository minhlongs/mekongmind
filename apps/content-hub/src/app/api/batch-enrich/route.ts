// @ts-nocheck
import { createServerClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";
import { enrichContent } from "@/lib/ai/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cached: ReturnType<typeof createServerClient> | null = null;
function getSupabase() {
  if (!cached) cached = createServerClient();
  return cached;
}

// POST /api/batch-enrich — enrich all pending contents
export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const limit = body.limit ?? 10;

    const { data: pending } = await supabase
      .from("contents")
      .select("id, title, original_content")
      .eq("status", "pending")
      .limit(limit);

    if (!pending || pending.length === 0) {
      return NextResponse.json({ processed: 0, results: [] });
    }

    const results = [];
    for (const item of pending) {
      try {
        const aiContent = await enrichContent(item.title, item.original_content);
        await supabase.from("contents").update({ ai_content: aiContent }).eq("id", item.id);
        results.push({ id: item.id, status: "enriched" });
      } catch (err) {
        results.push({ id: item.id, status: "error", error: String(err) });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
