// API client: fetch wrapper that injects Authorization header.

import { getToken } from "./auth";

export class InsufficientCreditsError extends Error {
  rechargeUrl: string;
  constructor(rechargeUrl: string) {
    super("insufficient_credits");
    this.rechargeUrl = rechargeUrl;
  }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("unauthenticated");
  }
}

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.mekong.dev"
  ).replace(/\/$/, "");
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();
  if (!token) throw new UnauthenticatedError();

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const resp = await fetch(`${apiBase()}${path}`, { ...init, headers });

  if (resp.status === 401) {
    throw new UnauthenticatedError();
  }
  if (resp.status === 402) {
    const body = await resp.json().catch(() => ({}));
    const url =
      body?.detail?.recharge_url ?? "https://www.mekongmind.com/billing";
    throw new InsufficientCreditsError(url);
  }
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.detail?.error ?? `http_${resp.status}`);
  }
  return (await resp.json()) as T;
}

export interface BalanceResponse {
  tenant_id: string;
  balance: number;
  tier?: string;
}

export async function fetchBalance(tenantId: string): Promise<BalanceResponse> {
  return apiFetch<BalanceResponse>(`/v1/balance?tenant_id=${tenantId}`);
}

export interface CreateMissionResponse {
  mission_id: string;
  status: string;
}

export async function createMission(
  goal: string,
  tenantId: string
): Promise<CreateMissionResponse> {
  return apiFetch<CreateMissionResponse>("/v1/missions", {
    method: "POST",
    body: JSON.stringify({ goal, tenant_id: tenantId, priority: "normal" }),
  });
}
