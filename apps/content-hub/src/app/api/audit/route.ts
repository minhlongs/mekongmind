// @ts-nocheck
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export async function POST(req: Request) {
  const client = createServerClient();
  const body = await req.json();
  const { action, content_id, old_status, new_status, note } = body;

  if (!["approve", "reject", "submit", "update", "delete"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data, error } = await client
    .from("audit_logs")
    .insert({
      action,
      content_id,
      old_status: old_status ?? null,
      new_status: new_status ?? null,
      note: note ?? null,
      actor_id: (await client.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// GET /api/audit — list audit logs (manager+ only)
export async function GET(req: Request) {
  const client = createServerClient();
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("content_id");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  let query = client.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);

  if (contentId) {
    query = query.eq("content_id", contentId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
