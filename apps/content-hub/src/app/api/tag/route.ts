// @ts-nocheck — supabase untyped client for custom tables
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { generateTags, generateEmbedding } from "@/lib/ai/openai";

export async function POST(req: Request) {
  const { id } = await req.json();
  const client = createServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: content, error } = await client.from("contents").select("*").eq("id", id).single();
  if (error || !content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

  try {
    const [tags, embedding] = await Promise.all([
      generateTags(content.title, content.ai_content ?? content.original_content),
      generateEmbedding(content.ai_content ?? content.original_content)
    ]);

    const { error: updErr } = await client.from("contents").update({
      tags,
      embedding,
      updated_at: new Date().toISOString()
    }).eq("id", id);

    if (updErr) throw updErr;
    return NextResponse.json({ success: true, tags, embedding });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Tag generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
