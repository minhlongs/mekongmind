// @ts-nocheck
import { createServerClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cached: ReturnType<typeof createServerClient> | null = null;
function getSupabase() {
  if (!cached) cached = createServerClient();
  return cached;
}

// GET /api/versions/[contentId] — list versions for a content
export async function GET(req: Request, { params }: { params: { contentId: string } }) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("content_versions")
      .select("*")
      .eq("content_id", params.contentId)
      .order("version_number", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
