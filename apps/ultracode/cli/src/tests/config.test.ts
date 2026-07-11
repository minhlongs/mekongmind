import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, saveConfig, setSessionToken, clearSessionToken } from "../utils/config.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const DEFAULT_URL = "http://localhost:3001";

function isoPath(): string {
  return path.join(os.tmpdir(), "ultracode-ctx-" + process.pid + "-" + process.env.VITEST_WORKER_ID ?? "0", "config.json");
}

function resetConfig() {
  const f = isoPath();
  const dir = path.dirname(f);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ apiUrl: DEFAULT_URL }, null, 2));
}

describe("config", () => {
  let savedEnv: string | undefined;

  beforeEach(() => {
    savedEnv = process.env.ULTRACODE_CONFIG_PATH;
    process.env.ULTRACODE_CONFIG_PATH = isoPath();
    resetConfig();
  });

  afterEach(() => {
    process.env.ULTRACODE_CONFIG_PATH = savedEnv ?? "";
    try { fs.unlinkSync(isoPath()); } catch {}
    try { fs.rmSync(path.dirname(isoPath()), { recursive: true }); } catch {}
  });

  it("loadConfig creates defaults when file missing (ENOENT)", () => {
    // Remove file to simulate ENOENT
    fs.unlinkSync(isoPath());
    const cfg = loadConfig();
    expect(cfg.apiUrl).toBe(DEFAULT_URL);
    expect(cfg.sessionToken).toBeUndefined();
    // File should now exist
    expect(fs.existsSync(isoPath())).toBe(true);
  });

  it("saveConfig persists merged values", () => {
    const updated = saveConfig({ apiUrl: "https://api.ultracode.dev" });
    expect(updated.apiUrl).toBe("https://api.ultracode.dev");
    const reloaded = loadConfig();
    expect(reloaded.apiUrl).toBe("https://api.ultracode.dev");
  });

  it("setSessionToken stores and reads back", () => {
    const stored = setSessionToken("jwt-abc-xyz");
    expect(stored.sessionToken).toBe("jwt-abc-xyz");
    const reloaded = loadConfig();
    expect(reloaded.sessionToken).toBe("jwt-abc-xyz");
  });

  it("clearSessionToken removes token but preserves existing apiUrl", () => {
    saveConfig({ apiUrl: "https://api.ultracode.dev" });
    setSessionToken("temp-jwt");
    const cleared = clearSessionToken();
    expect(cleared.sessionToken).toBeUndefined();
    expect(cleared.apiUrl).toBe("https://api.ultracode.dev");
  });

  it("throws on corrupt JSON (does not overwrite)", () => {
    fs.writeFileSync(isoPath(), "not-json{{{"); // deliberately corrupt
    expect(() => loadConfig()).toThrow();
    // File must NOT be silently overwritten
    expect(fs.readFileSync(isoPath(), "utf8")).toBe("not-json{{{");
  });

  it("uses ULTRACODE_CONFIG_PATH env override", () => {
    // beforeEach already set it — verify isolation
    expect(isoPath()).toContain("ultracode-ctx");
    expect(isoPath()).not.toContain(path.join(".config", "ultracode"));
    const cfg = loadConfig();
    expect(cfg.apiUrl).toBe(DEFAULT_URL);
  });
});
