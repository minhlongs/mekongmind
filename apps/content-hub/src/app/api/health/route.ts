import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
