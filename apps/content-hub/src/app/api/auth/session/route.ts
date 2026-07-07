import { createServerClient } from "@/lib/supabase/client";

// @ts-nocheck
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const client = createServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  return new Response(JSON.stringify({ user }), { headers: { "Content-Type": "application/json" } });
}
