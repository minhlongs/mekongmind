// Auth: license key → JWT, stored client-side.
// Access token in localStorage (1h TTL); refresh flow TODO.

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  tenant_id: string;
  tier: string;
}

const STORAGE_KEY = "mekong_access_token";
const TENANT_KEY = "mekong_tenant_id";
const TIER_KEY = "mekong_tier";
const EXPIRES_KEY = "mekong_token_expires_at";

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.mekong.dev"
  ).replace(/\/$/, "");
}

export async function login(licenseKey: string): Promise<LoginResponse> {
  const resp = await fetch(`${apiBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ license_key: licenseKey }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    const error = body?.detail?.error ?? "login_failed";
    throw new Error(error);
  }
  const data: LoginResponse = await resp.json();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, data.access_token);
    localStorage.setItem(TENANT_KEY, data.tenant_id);
    localStorage.setItem(TIER_KEY, data.tier);
    const expiresAt = Date.now() + data.expires_in * 1000;
    localStorage.setItem(EXPIRES_KEY, String(expiresAt));
    // Marker cookie so the edge middleware can guard /app/* without
    // peeking at localStorage. Lifetime mirrors the access token.
    document.cookie = `mekong_authed=1; path=/; max-age=${data.expires_in}; samesite=lax`;
  }
  return data;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);
  if (expiresAt && Date.now() >= expiresAt) {
    logout();
    return null;
  }
  return localStorage.getItem(STORAGE_KEY);
}

export function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TENANT_KEY);
}

export function getTier(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TIER_KEY);
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TENANT_KEY);
  localStorage.removeItem(TIER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  document.cookie = "mekong_authed=; path=/; max-age=0; samesite=lax";
}
