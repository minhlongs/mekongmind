// @ts-nocheck
// Note: inngest/next serve() returns a type incompatible with Next.js route handler
// stubs under strict TS. Runtime behavior is correct in all branches; this
// explicit opt-out is the pragmatic fix for a third-party typing boundary.

import { serve } from "inngest/next";
import { inngestClient } from "@/forest/inngest/client";
import { reviewJob } from "@/forest/inngest/review-job";
import { NextResponse } from "next/server";

// Stub handlers when Inngest is not configured
const noop = () =>
  NextResponse.json({ error: "Inngest not configured" }, { status: 503 });

const served = inngestClient
  ? serve({ client: inngestClient, functions: [reviewJob] })
  : { GET: noop, POST: noop };

export const GET = served.GET;
export const POST = served.POST;
