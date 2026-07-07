// @ts-nocheck
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const client = createServerClient();
  const body = await req.json();
  const status: string = body.status;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Get current status for audit
  const { data: existing } = await client.from("contents").select("status").eq("id", params.id).single();
  const oldStatus = existing?.status ?? null;

  const { data, error } = await client
    .from("contents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Write audit log
  try {
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      await client.from("audit_logs").insert({
        action: status === "approved" ? "approve" : status === "rejected" ? "reject" : "update",
        content_id: params.id,
        old_status: oldStatus,
        new_status: status,
        actor_id: user.id,
        note: body.note ?? null,
      });
    }
  } catch {
    // Non-blocking — don't fail the status update if audit log fails
  }

  if (status === "approved") {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/tag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id }),
    }).catch(() => {});
  }

  return NextResponse.json(data);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
