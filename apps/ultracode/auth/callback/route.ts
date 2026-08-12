import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, fetchGitHubUser, createSession } from "@/lib/auth";
import { getDb } from "@/db/client";
import { CREATE_USERS_TABLE } from "@/db/schema";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  try {
    const tokenData = await exchangeCode(code);
    const githubUser = await fetchGitHubUser(tokenData.access_token);
    const db = getDb();
    await db.exec(CREATE_USERS_TABLE);

    const existing = (await db
      .prepare("SELECT id FROM users WHERE github_id = ?")
      .bind(githubUser.id.toString())
      .first()) as { id: string } | null;

    let userId: string;
    if (existing) {
      await db
        .prepare(
          "UPDATE users SET login = ?, name = ?, email = ?, avatar_url = ?, github_access_token = ?, updated_at = datetime('now') WHERE id = ?"
        )
        .bind(githubUser.login, githubUser.name, githubUser.email, githubUser.avatar_url, tokenData.access_token, existing.id)
        .run();
      userId = existing.id;
    } else {
      userId = crypto.randomUUID();
      const now = new Date().toISOString();
      await db
        .prepare(
          "INSERT INTO users (id, github_id, login, name, email, avatar_url, github_access_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          userId,
          githubUser.id.toString(),
          githubUser.login,
          githubUser.name,
          githubUser.email,
          githubUser.avatar_url,
      tokenData.access_token,
          now,
          now
        )
        .run();
    }

    const jwt = await createSession({
      id: userId,
      login: githubUser.login,
      name: githubUser.name,
      avatar_url: githubUser.avatar_url,
    });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("ultracode_session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth callback failed.";
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, request.url));
  }
}
