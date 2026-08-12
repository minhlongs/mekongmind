import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { z } from "zod";

const ConfigSchema = z.object({
  apiUrl: z.string().url().default("http://localhost:3001"),
  sessionToken: z.string().optional(),
});

export interface Config {
  apiUrl: string;
  sessionToken?: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".config", "ultracode");

function resolveConfigFile(): string {
  return process.env.ULTRACODE_CONFIG_PATH ?? path.join(CONFIG_DIR, "config.json");
}

export const configPath = (): string => resolveConfigFile();

function atomicWrite(file: string, data: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}

export function loadConfig(): Config {
  const file = resolveConfigFile();
  try {
    const raw = fs.readFileSync(file, "utf8");
    return ConfigSchema.parse(JSON.parse(raw)) as Config;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      const defaults: Config = { apiUrl: "http://localhost:3001", sessionToken: undefined };
      atomicWrite(file, JSON.stringify(defaults, null, 2));
      return defaults;
    }
    // Re-throw all other errors (corrupt JSON, permission denied, etc.)
    throw err;
  }
}

export function saveConfig(cfg: Partial<Config>): Config {
  const file = resolveConfigFile();
  const current = loadConfig();
  const merged = { ...current, ...cfg };
  const next = ConfigSchema.parse(merged) as Config;
  atomicWrite(file, JSON.stringify(next, null, 2));
  return next;
}

export function setSessionToken(token: string): Config {
  return saveConfig({ sessionToken: token });
}

export function clearSessionToken(): Config {
  const file = resolveConfigFile();
  const current = loadConfig();
  const next = { ...current, sessionToken: undefined };
  const parsed = ConfigSchema.parse(next) as Config;
  atomicWrite(file, JSON.stringify(parsed, null, 2));
  return parsed;
}
