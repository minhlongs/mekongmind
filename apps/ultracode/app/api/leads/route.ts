import { NextRequest, NextResponse } from "next/server";

interface LeadPayload {
  name: string;
  email: string;
  company?: string;
  role?: string;
  interest: "beta" | "enterprise" | "sponsor" | "other";
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LeadPayload;

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // TODO: Persist to D1 / Supabase when ready
    // For now: log to audit + return success
    const lead = {
      ...body,
      receivedAt: new Date().toISOString(),
      source: "ultracode-landing",
    };

    console.log("[ultracode] New lead:", JSON.stringify(lead));

    return NextResponse.json(
      { ok: true, message: "Interest registered. We'll be in touch." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
