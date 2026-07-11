import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/auth/", "/api/leads", "/api/webhooks/"];

function isPublic(path: string) {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const session = await getSession();

  // Attach verified session as a request header so downstream handlers
  // (dashboard layout, API routes) can read it without re-verifying JWT.
  // Cost: ~1 JSON.stringify per request (negligible) vs ~1 crypto.verify
  // per dashboard page render.
  const response = NextResponse.next();
  if (session) {
    response.headers.set("x-ultra-user", JSON.stringify(session));
  }

  if (isPublic(req.nextUrl.pathname) || req.nextUrl.pathname.startsWith("/_next")) {
    return response;
  }
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/github";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
