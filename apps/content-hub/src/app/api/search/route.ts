// @ts-nocheck — supabase untyped client for custom tables
import { createServerClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? "20");
  const client = createServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await client.rpc("search_contents", {
    query_text: query,
    match_limit: limit
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
