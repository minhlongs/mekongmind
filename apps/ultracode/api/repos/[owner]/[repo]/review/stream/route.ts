import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ owner: string; repo: string }> },
) {
  // Deprecated: use POST /api/repos/{owner}/{repo}/review/trigger instead
  try {
    const { owner, repo } = await ctx.params;
    return NextResponse.json(
      {
        error: "Deprecated",
        message:
          "This endpoint is deprecated. Use POST /api/repos/" +
          owner +
          "/" +
          repo +
          "/review/trigger instead.",
        redirect:
          "/api/repos/" + owner + "/" + repo + "/review/trigger",
      },
      { status: 301 },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Deprecated",
        redirect: "/api/repos/[owner]/[repo]/review/trigger",
      },
      { status: 301 },
    );
  }
}
