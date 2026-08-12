import { inngestClient } from "./client";
import { step } from "inngest";
import { logger } from "@/lib/logger";
import type { ReviewTriggeredPayload } from "./types";

// ─── Finding shape (LLM output) ────────────────────────────────

export interface Finding {
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  description: string;
  file_path: string;
  line_start: number | null;
  line_end: number | null;
  suggestion: string;
}

// ─── Constants ─────────────────────────────────────────────────

const MAX_FILES = 100;

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "__pycache__",
  "vendor",
  ".venv",
  "venv",
]);

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".rb",
  ".php",
  ".c",
  ".cpp",
  ".h",
  ".cs",
  ".scala",
  ".ex",
  ".exs",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".md",
]);

// ─── Helpers ───────────────────────────────────────────────────

function isSourceFile(path: string): boolean {
  return SOURCE_EXTENSIONS.has(path.slice(path.lastIndexOf(".")));
}

function shouldIgnore(path: string): boolean {
  return path.split("/").some((seg) => IGNORED_DIRS.has(seg));
}

// ─── Inngest Function ──────────────────────────────────────────

export const reviewJob = inngestClient
  ? inngestClient.createFunction(
      {
        id: "review-job",
        triggers: [{ event: "review/triggered" }],
      },
      async (ctx) => {
        const payload = ctx.event.data as ReviewTriggeredPayload;
        const { reviewId, repoId, owner, repoName, userId } = payload;

        logger.info(`Starting review ${reviewId} for ${owner}/${repoName}`);

        // Step 1: Mark review as in_progress
        await step.run("mark-in-progress", async () => {
          const db = (await import("@/db/client")).getDb();
          await db
            .prepare("UPDATE reviews SET status = 'in_progress' WHERE id = ?")
            .bind(reviewId)
            .run();
          logger.info(`Review ${reviewId} marked in_progress`);
          return { ok: true };
        });

        // Step 2: Fetch file tree + content from GitHub
        const files = await step.run("fetch-files", async () => {
          const db = (await import("@/db/client")).getDb();

          const repoRow = (await db
            .prepare("SELECT default_branch FROM repos WHERE id = ?")
            .bind(repoId)
            .first()) as { default_branch: string } | null;

          const branch = repoRow?.default_branch ?? payload.defaultBranch ?? "main";

          // Fetch GitHub token from D1 (NOT from event payload — security boundary)
          const userRow = (await db
            .prepare(
              "SELECT u.github_access_token FROM repos r JOIN users u ON u.id = r.user_id WHERE r.id = ?",
            )
            .bind(repoId)
            .first()) as { github_access_token: string | null } | null;

          const githubToken = userRow?.github_access_token;
          if (!githubToken) {
            throw new Error(
              "No GitHub token found for this user. Ask the user to re-link their account.",
            );
          }

          const treeUrl =
            `https://api.github.com/repos/${owner}/${repoName}` +
            `/git/trees/${encodeURIComponent(branch)}?recursive=1`;

          const treeRes = await fetch(treeUrl, {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "ultracode-review",
            },
          });

          if (!treeRes.ok) {
            throw new Error(
              `GitHub tree fetch failed: ${treeRes.status} ${await treeRes.text()}`,
            );
          }

          const tree = (await treeRes.json()) as {
            tree: Array<{ path: string; type: string; sha: string }>;
          };

          const sourceFiles = tree.tree
            .filter(
              (file) =>
                file.type === "blob" &&
                isSourceFile(file.path) &&
                !shouldIgnore(file.path),
            )
            .slice(0, MAX_FILES);

          logger.info(
            `Found ${sourceFiles.length} source files (${tree.tree.length} total)`,
          );

          const results: Array<{
            path: string;
            content: string;
            language: string;
          }> = [];

          for (const file of sourceFiles) {
            try {
              const contentUrl =
                `https://api.github.com/repos/${owner}/${repoName}` +
                `/contents/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(branch)}`;

              const contentRes = await fetch(contentUrl, {
                headers: {
                  Authorization: `Bearer ${githubToken}`,
                  Accept: "application/vnd.github+json",
                  "User-Agent": "ultracode-review",
                },
              });

              if (!contentRes.ok) {
                logger.warn(`Skipping ${file.path}: HTTP ${contentRes.status}`);
                continue;
              }

              const data = (await contentRes.json()) as {
                content?: string;
                encoding?: string;
              };

              if (data.encoding === "base64" && data.content) {
                const decoded = Buffer.from(data.content, "base64").toString(
                  "utf-8",
                );
                if (decoded.length > 0 && decoded.length < 500_000) {
                  results.push({
                    path: file.path,
                    content: decoded,
                    language: file.path.slice(file.path.lastIndexOf(".") + 1),
                  });
                }
              } else if (data.content && data.content.length < 500_000) {
                results.push({
                  path: file.path,
                  content: data.content,
                  language: file.path.slice(file.path.lastIndexOf(".") + 1),
                });
              }
            } catch (fileErr) {
              logger.warn(
                `Skipping ${file.path}: ${
                  fileErr instanceof Error ? fileErr.message : fileErr
                }`,
              );
            }
          }

          logger.info(`Fetched content for ${results.length} files`);
          return { files: results };
        });

        // Step 3: Run LLM review (non-streaming in background)
        const { findings, rawText } = await step.run(
          "run-llm-review",
          async () => {
            if (files.files.length === 0) {
              return { findings: [] as Finding[], rawText: "" };
            }

            const db = (await import("@/db/client")).getDb();

            const repoRow = (await db
              .prepare("SELECT default_branch FROM repos WHERE id = ?")
              .bind(repoId)
              .first()) as { default_branch: string } | null;
            const branch = repoRow?.default_branch ?? "main";

            // Build file-summary prompt with truncated content per file
            const fileSummaries = files.files
              .map((f) => `\`\`\`${f.language}\n${f.content.slice(0, 8000)}\n\`\`\``)
              .join("\n\n");

            const prompt = `You are a senior code reviewer analyzing ${owner}/${repoName} (branch: ${branch}).

Return a JSON array of findings. Each finding has:
- severity: "critical" | "warning" | "info"
- category: "bug" | "security" | "performance" | "style" | "best-practice"
- title: short summary (max 60 chars)
- description: 2-3 sentences explaining the issue
- file_path: exact file path
- line_start: number | null
- line_end: number | null
- suggestion: concrete fix recommendation

Rules:
- Focus on real defects, security vulnerabilities, and logic bugs. Skip style nitpicks.
- Return empty array [] if no issues found.
- JSON only — no markdown fences, no commentary.

Files:
${fileSummaries.slice(0, 80_000)}`;

            // Collect streaming response into a complete text
            const { llmClient } = await import("@/forest/llm/client");
            const chunks: string[] = [];
            for await (const chunk of llmClient.streamReview({
              code: prompt,
              language: "markdown",
            })) {
              chunks.push(chunk);
            }
            const fullText = chunks.join("");

            logger.info(`LLM returned ${fullText.length} chars`);

            let parsed: Finding[];
            try {
              const match = fullText.match(/\[[\s\S]*\]/);
              parsed = match ? JSON.parse(match[0]) : [];
            } catch {
              logger.warn("Failed to parse LLM findings JSON, storing raw text");
              parsed = [
                {
                  severity: "info",
                  category: "best-practice",
                  title: fullText.slice(0, 60),
                  description: fullText,
                  file_path: "unknown",
                  line_start: null,
                  line_end: null,
                  suggestion: "",
                },
              ];
            }

            return { findings: parsed, rawText: fullText };
          },
        );

        // Step 4: Store findings into D1
        const storedCount = await step.run("store-findings", async () => {
          const db = (await import("@/db/client")).getDb();
          let inserted = 0;

          for (const f of findings) {
            try {
              await db
                .prepare(
                  `INSERT INTO findings
                   (id, review_id, severity, category, title, description, file_path, line_start, line_end, suggestion, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
                )
                .bind(
                  crypto.randomUUID(),
                  reviewId,
                  f.severity ?? "info",
                  f.category ?? "best-practice",
                  f.title ?? "Unnamed finding",
                  f.description ?? "",
                  f.file_path ?? "unknown",
                  f.line_start ?? null,
                  f.line_end ?? null,
                  f.suggestion ?? "",
                )
                .run();
              inserted++;
            } catch (dbErr) {
              logger.error(
                `Failed to insert finding: ${
                  dbErr instanceof Error ? dbErr.message : dbErr
                }`,
              );
            }
          }

          await db
            .prepare(
              "UPDATE reviews SET status = 'completed', completed_at = ?, findings_count = ? WHERE id = ?",
            )
            .bind(new Date().toISOString(), inserted, reviewId)
            .run();

          if (rawText) {
            await db
              .prepare("UPDATE reviews SET payload = ? WHERE id = ?")
              .bind(rawText.slice(0, 500_000), reviewId)
              .run();
          }

          logger.info(`Stored ${inserted} findings for review ${reviewId}`);
          return { stored: inserted };
        });

        // Step 5: Emit progress event (consumed by SSE in Phase 4)
        await step.run("emit-progress", async () => {
          if (inngestClient && typeof inngestClient.send === "function") {
            try {
              await inngestClient.send({
                name: "review/progress",
                data: {
                  reviewId,
                  status: "completed",
                  findingsCount: storedCount,
                },
              });
            } catch (evErr) {
              logger.warn(
                `Progress event send failed (non-fatal): ${
                  evErr instanceof Error ? evErr.message : evErr
                }`,
              );
            }
          }
          return { sent: true };
        });

        return { reviewId, storedCount: storedCount.stored };
      },
    )
  : undefined;
