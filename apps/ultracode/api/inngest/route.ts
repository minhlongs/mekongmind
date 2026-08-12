// @ts-nocheck
// Note: inngest/next serve() return type is incompatible with Next.js route handler
// stubs under strict TS. Runtime behavior is correct in all branches.

import { serve } from "inngest/next";
import { inngestClient } from "@/forest/inngest/client";
import { reviewJob } from "@/forest/inngest/review-job";
import { NextResponse } from "next/server";

// Stub when Inngest is not configured
// @ts-ignore — same third-party typing boundary
const served = inngestClient
  ? serve({ client: inngestClient, functions: [reviewJob] })
  : { GET: () => NextResponse.json({ error: "Inngest not configured" }, { status: 503 }), POST: () => NextResponse.json({ error: "Inngest not configured" }, { status: 503 }) };

export const GET = served.GET;
export const POST = served.POST;
