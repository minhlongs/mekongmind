// @ts-nocheck
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export async function GET() {
  const client = createServerClient();
  const { data, error } = await client.from("contents").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const client = createServerClient();
  // Check auth via anon key — RLS will enforce
  const body = await req.json();
  const { data, error } = await client.from("contents").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
