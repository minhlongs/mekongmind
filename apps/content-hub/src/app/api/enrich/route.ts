// @ts-nocheck — supabase untyped client for custom tables
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { enrichContent } from "@/lib/ai/openai";

export async function POST(req: Request) {
  const { id } = await req.json();
  const client = createServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: content, error } = await client.from("contents").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  try {
    const aiContent = await enrichContent(content.title, content.original_content);
    await client.from("contents").update({
      ai_content: aiContent,
      updated_at: new Date().toISOString()
    }).eq("id", id);
    return NextResponse.json({ success: true, ai_content: aiContent });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI enrichment failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const client = createServerClient();
  const { data, error } = await client.from("contents").select("*").eq("status", "pending").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
