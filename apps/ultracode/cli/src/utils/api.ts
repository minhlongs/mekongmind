import { loadConfig, type Config } from "./config.js";

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit = {},
  config?: Config,
): Promise<ApiResponse<T>> {
  const cfg = config ?? loadConfig();
  const url = `${cfg.apiUrl}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };

  if (cfg.sessionToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${cfg.sessionToken}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...opts, headers, redirect: "manual" });
  } catch (err) {
    const message =
      err instanceof AggregateError && err.errors.length > 0
        ? err.errors[0].message
        : err instanceof Error
          ? err.message
          : "Network error";
    return { ok: false, status: 0, error: message };
  }

  if (res.status === 204) return { ok: true, status: 204 };

  const contentType = res.headers.get("content-type") ?? "";
  let body: unknown;
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  if (!res.ok) {
    const msg =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as Record<string, unknown>).error)
        : typeof body === "string"
          ? body
          : `HTTP ${res.status}`;
    return { ok: false, status: res.status, error: msg };
  }

  return { ok: true, status: res.status, data: body as T };
}
