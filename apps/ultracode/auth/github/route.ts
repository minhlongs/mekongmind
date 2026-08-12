import { NextResponse } from "next/server";
import { signInURL } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  try {
    const url = signInURL();
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate OAuth flow.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
