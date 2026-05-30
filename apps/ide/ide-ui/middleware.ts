// Edge middleware: redirect /app/* to /login when no token present.
// Note: localStorage isn't readable here, so we rely on a cookie marker
// set by the auth lib for SSR-style guard. The client-side AppLayout
// performs the real check.

import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const hasMarker = req.cookies.get("mekong_authed")?.value === "1";
  if (!hasMarker) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
