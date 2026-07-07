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

// GET /api/export?format=json|csv&status=all|pending|approved|rejected
export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "json";
    const status = searchParams.get("status");

    let query = supabase.from("contents").select("*").order("created_at", { ascending: false });
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (format === "csv") {
      const headers = ["id", "title", "status", "department", "tags", "created_at"];
      const rows = (data ?? []).map((r: Record<string, unknown>) =>
        headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="contents-export.csv"',
        },
      });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
