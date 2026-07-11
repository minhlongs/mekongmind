import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "../utils/api.js";
import { clearSessionToken, setSessionToken } from "../utils/config.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const FAKE_BASE = "http://localhost:9999";

function isoPath(): string {
  return path.join(os.tmpdir(), "ultracode-ctx-" + process.pid + "-" + process.env.VITEST_WORKER_ID ?? "0", "config.json");
}

function makeRes(body: unknown, status = 200, ct = "application/json"): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers({ "content-type": ct }),
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    redirected: false,
    type: "basic",
    url: FAKE_BASE,
    clone: () => makeRes(body, status, ct),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    body: null,
    signal: null as unknown as AbortSignal,
    cache: "default",
    credentials: "same-origin",
    destination: "document",
    integrity: "",
    keepalive: false,
    method: "GET",
    mode: "cors",
    referrer: "",
    referrerPolicy: "no-referrer",
  } as unknown as Response;
}

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Isolate from production config and previous test pollution
    const p = isoPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify({ apiUrl: DEFAULT_BASE }));
    process.env.ULTRACODE_CONFIG_PATH = p;
    setSessionToken("unit-test-jwt-123");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.ULTRACODE_CONFIG_PATH;
    try { fs.unlinkSync(isoPath()); } catch {}
    try { fs.rmSync(path.dirname(isoPath()), { recursive: true }); } catch {}
  });

  const DEFAULT_BASE = "http://localhost:9999";

  it("returns { ok: false } with error string when fetch throws network error", async () => {
    const netErr = new Error("connect ECONNREFUSED 127.0.0.1:3001");
    (netErr as { name: string }).name = "AggregateError";
    global.fetch = vi.fn(async () => { throw netErr; }) as typeof fetch;

    const result = await apiFetch<{ id: string }>("/api/test");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toBeTruthy();
    expect(typeof result.error).toBe("string");
  });

  it("returns { ok: true, data } for successful JSON response", async () => {
    global.fetch = vi.fn(async () => makeRes({ hello: "world" }, 200)) as typeof fetch;
    const result = await apiFetch<{ hello: string }>("/api/health");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ hello: "world" });
  });

  it("returns { ok: true, status: 204 } for No Content without body", async () => {
    global.fetch = vi.fn(async () => makeRes(null, 204)) as typeof fetch;
    const result = await apiFetch<never>("/api/delete");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(204);
    expect(result.data).toBeUndefined();
  });

  it("returns { ok: false } with server error message from JSON body", async () => {
    global.fetch = vi.fn(async () => makeRes({ error: "Rate limited" }, 429)) as typeof fetch;
    const result = await apiFetch<never>("/api/chat");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(429);
    expect(result.error).toBe("Rate limited");
  });

  it("returns { ok: false } with plain text error when content-type is text", async () => {
    global.fetch = vi.fn(async () =>
      Promise.resolve({
        status: 502, ok: false,
        headers: new Headers({ "content-type": "text/html" }),
        json: async () => null,
        text: async () => "<html>Bad Gateway</html>",
        redirected: false, type: "basic", url: FAKE_BASE,
        clone: () => ({} as Response),
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        body: null, signal: null as unknown as AbortSignal,
        cache: "default", credentials: "same-origin", destination: "document",
        integrity: "", keepalive: false, method: "GET", mode: "cors",
        referrerPolicy: "no-referrer",
      } as Response),
    ) as typeof fetch;

    const result = await apiFetch<never>("/api/broken");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(502);
    expect(result.error).toBe("<html>Bad Gateway</html>");
  });
});
