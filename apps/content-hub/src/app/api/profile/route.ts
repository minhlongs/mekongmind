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

export async function PATCH(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, full_name, role, department_id } = body;

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (full_name !== undefined) update.full_name = full_name;
    if (role !== undefined) update.role = role;
    if (department_id !== undefined) update.department_id = department_id || null;

    const { data, error } = await supabase.from("profiles").update(update).eq("id", user.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
