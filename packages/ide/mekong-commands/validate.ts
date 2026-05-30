#!/usr/bin/env bun
/**
 * validate.ts — Frontmatter validator for Mekong business-ops command files.
 *
 * Scans all .md files in ./commands/, parses YAML frontmatter (between ---
 * delimiters), and checks for required fields. Exits 1 if any errors found.
 *
 * Usage:  bun run validate
 *         bun packages/mekong-commands/validate.ts
 */

import { join } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const COMMANDS_DIR = join(import.meta.dir, "commands");
const REQUIRED_FIELDS = ["description", "agent"] as const;

// Allowed values for the `agent` field (extend as new agent types are added).
const VALID_AGENTS = new Set([
  "build",
  "researcher",
  "reviewer",
  "tester",
  "planner",
  "debugger",
  "docs-manager",
  "code-reviewer",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidationError {
  file: string;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal YAML frontmatter parser.
 * Returns null when no frontmatter block is found.
 * Parses only simple `key: value` lines — no nested objects or arrays.
 */
function parseFrontmatter(content: string): Record<string, string> | null {
  // Frontmatter must start at the very beginning of the file.
  if (!content.startsWith("---")) return null;

  const end = content.indexOf("\n---", 3);
  if (end === -1) return null;

  const block = content.slice(3, end).trim();
  if (!block) return null;

  const fields: Record<string, string> = {};

  for (const raw of block.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;

    const key = line.slice(0, colon).trim();
    // Strip surrounding quotes (single or double) from the value.
    const rawValue = line.slice(colon + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key) fields[key] = value;
  }

  return Object.keys(fields).length > 0 ? fields : {};
}

/**
 * Validate a single file's parsed frontmatter (or lack thereof).
 * Returns a list of error strings; empty array means valid.
 */
function validateFields(
  fields: Record<string, string> | null
): string[] {
  if (fields === null) {
    return ["missing frontmatter block (file must start with ---)"];
  }

  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = fields[field];
    if (value === undefined || value === "") {
      errors.push(`missing required field: "${field}"`);
    }
  }

  // Soft-check: warn if agent value is not in the known set.
  const agent = fields["agent"];
  if (agent && !VALID_AGENTS.has(agent)) {
    errors.push(
      `unknown agent value: "${agent}" (expected one of: ${[...VALID_AGENTS].sort().join(", ")})`
    );
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const glob = new Bun.Glob("*.md");
  const failures: ValidationError[] = [];
  let total = 0;

  for await (const filename of glob.scan(COMMANDS_DIR)) {
    total++;
    const filepath = join(COMMANDS_DIR, filename);
    const content = await Bun.file(filepath).text();
    const fields = parseFrontmatter(content);
    const errors = validateFields(fields);

    if (errors.length > 0) {
      failures.push({ file: filename, errors });
    }
  }

  if (total === 0) {
    console.error(`[validate] No .md files found in ${COMMANDS_DIR}`);
    process.exit(1);
  }

  const passed = total - failures.length;

  if (failures.length === 0) {
    console.log(`[validate] All ${total} command files passed frontmatter validation.`);
    process.exit(0);
  }

  // Print failures grouped by file, sorted alphabetically.
  failures.sort((a, b) => a.file.localeCompare(b.file));

  console.error(`[validate] ${failures.length} of ${total} files failed frontmatter validation:\n`);

  for (const { file, errors } of failures) {
    console.error(`  ${file}`);
    for (const err of errors) {
      console.error(`    - ${err}`);
    }
  }

  console.error(`\n[validate] Summary: ${passed} passed, ${failures.length} failed, ${total} total`);
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error("[validate] Unexpected error:", err);
  process.exit(1);
});
