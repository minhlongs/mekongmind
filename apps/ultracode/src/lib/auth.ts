import { cookies } from "next/headers";
import crypto from "crypto";

type SessionPayload = {
  sub: string;
  login: string;
  name: string | null;
  avatar_url: string | null;
};

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

function getJwtSecret(): Buffer | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return Buffer.from(secret, "utf8");
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlDecode(str: string): Buffer {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64");
}

export function signInURL(): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw new Error("GITHUB_CLIENT_ID is not set.");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: process.env.GITHUB_CALLBACK_URL ?? "/auth/callback",
    scope: "repo,read:user",
    state: crypto.randomUUID(),
    allow_signup: "true",
  });
  return `${GITHUB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  scope: string;
  token_type: string;
}> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set.");

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub token exchange failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { access_token: string; token_type: string; scope: string };
  return { access_token: data.access_token, scope: data.scope, token_type: data.token_type };
}

export async function fetchGitHubUser(accessToken: string): Promise<{
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) throw new Error(`GitHub user fetch failed: ${response.status}`);
  return response.json();
}

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(str: string): Buffer {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function createToken(payload: SessionPayload): string {
  const secret = getJwtSecret();
  if (!secret) throw new Error("JWT_SECRET is not set.");
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }));

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  const body = Buffer.from(JSON.stringify({ ...payload, exp }));

  const enc = new TextEncoder();
  const hmacKey = crypto.createHmac("sha256", secret);
  const signInput = Buffer.concat([
    Buffer.from(enc.encode(base64url(header))),
    Buffer.from([46]),
    Buffer.from(enc.encode(base64url(body))),
  ]);

  const sig = crypto.createHmac("sha256", secret).update(signInput).digest();

  return `${base64url(header)}.${base64url(body)}.${base64url(sig)}`;
}

function verifyToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(fromBase64url(headerB64).toString("utf8")) as {
    alg: string;
    typ: string;
  };
  if (header.alg !== "HS256" || header.typ !== "JWT") return null;

  const secret = getJwtSecret();
  if (!secret) return null;
  const signInput = Buffer.from(`${headerB64}.${payloadB64}`, "utf8");
  const expectedSig = crypto.createHmac("sha256", secret).update(signInput).digest();
  const actualSig = fromBase64url(sigB64);
  if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null;

  const payloadRaw = fromBase64url(payloadB64);
  const parsed = JSON.parse(payloadRaw.toString("utf8")) as { exp: number } | null;
  if (!parsed) return null;

  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp && now > parsed.exp) return null;

  const { exp: _exp, ...session } = parsed;
  return session as SessionPayload;
}

export async function createSession(user: {
  id: string;
  login: string;
  name: string | null;
  avatar_url: string | null;
}): Promise<string> {
  return createToken({
    sub: user.id,
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ultracode_session")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("ultracode_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
