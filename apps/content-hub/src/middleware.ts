import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes — no auth required
const publicRoutes = ["/", "/login", "/auth", "/search", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and static assets
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/") || pathname.startsWith("/_next"))) {
    return NextResponse.next();
  }

  // For API routes, let the route handler deal with auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check Supabase Auth session cookie
  const sessionToken = request.cookies.get("sb-auth-token")?.value ?? request.cookies.get("supabase-auth-token")?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
