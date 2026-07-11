# Phase 3.3: Inngest Review Background Function

**Owner:** Backend (forest layer)
**Effort:** 3h
**Blocker:** Phase 3.1 (Inngest installed), 3.2 (async trigger enqueuing)

## What to Build

The Inngest background function that executes the actual review — fetching code, running LLM, parsing findings, storing in D1.

## Implementation

### 1. Create `src/forest/inngest/review-job.ts`

```typescript
import { inngest } from "@/inngest";
import { getDb } from "@/db/client";
import { llmClient } from "@/forest/llm/client";
import { logger } from "@/lib/logger";

export const onReviewRequested = inngest.createFunction(
  {
    id: "review-requested",
    retries: 2,
    timeout: "5m", // Max LLM time; CF Workers steps can run up to 5m
  },
  { event: "review/requested" },
  async ({ event, step }) => {
    const { reviewId, repoId, owner, repo, code, pr_number, language, userId } = event.data;

    logger.info("Inngest: review started", { reviewId, repoId });

    try {
      // Step 1: Fetch PR diff if pr_number provided
      let reviewCode = code;
      let reviewLanguage = language ?? "code";

      if (pr_number && !code) {
        const diff = await step.run("fetch-pr-diff", async () => {
          // Get user's GitHub token from D1
          const db = getDb();
          const userRow = await db
            .prepare("SELECT github_access_token FROM users WHERE id = ?")
            .bind(userId)
            .first<{ github_access_token: string | null }>();

          const ghToken = userRow?.github_access_token;
          if (!ghToken) throw new Error("No GitHub token linked.");

          const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}`,
            {
              headers: {
                Authorization: `Bearer ${ghToken}`,
                Accept: "application/vnd.github.diff",
              },
            }
          );

          if (!res.ok) throw new Error(`GitHub PR fetch failed: ${res.status}`);
          return await res.text();
        });

        reviewCode = diff;
        reviewLanguage = "diff";
      }

      if (!reviewCode) {
        throw new Error("No code to review.");
      }

      // Step 2: Stream LLM review
      const fullText = await step.run("llm-stream-review", async () => {
        let accumulated = "";
        for await (const chunk of llmClient.streamReview({
          code: reviewCode,
          language: reviewLanguage,
        })) {
          accumulated += chunk;
        }
        return accumulated;
      });

      // Step 3: Parse findings
      const findings = await step.run("parse-findings", () => {
        const match = fullText.match(/\[[\s\S]*\]/);
        if (!match) return [];
        try {
          return JSON.parse(match[0]) as Array<{
            severity: string;
            category: string;
            title: string;
            description: string;
            file_path: string;
            line_start: number | null;
            line_end: number | null;
            suggestion: string;
          }>;
        } catch {
          return [
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
      });

      // Step 4: Store findings in D1
      await step.run("store-findings", async () => {
        const db = getDb();
        const insertFinding = db.prepare(
          `INSERT INTO findings (id, review_id, severity, category, title, description, file_path, line_start, line_end, suggestion, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`
        );

        for (const f of findings) {
          await insertFinding
            .bind(
              crypto.randomUUID(),
              reviewId,
              f.severity,
              f.category,
              f.title.slice(0, 200),
              f.description,
              f.file_path ?? "unknown",
              f.line_start,
              f.line_end,
              f.suggestion ?? "",
            )
            .run();
        }

        await db
          .prepare(
            "UPDATE reviews SET status = 'completed', completed_at = ?, findings_count = ? WHERE id = ?"
          )
          .bind(new Date().toISOString(), findings.length, reviewId)
          .run();

        logger.info("Inngest: review completed", { reviewId, findingsCount: findings.length });
      });

      return { reviewId, status: "completed", findingsCount: findings.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("Inngest: review failed", { reviewId, error: msg });

      // Mark review as failed
      const db = getDb();
      await db
        .prepare("UPDATE reviews SET status = 'failed', completed_at = ? WHERE id = ?")
        .bind(new Date().toISOString(), reviewId)
        .run();

      throw err; // Inngest will retry (up to 2 retries)
    }
  }
);
```

### 2. Register function in `inngest.ts`

```typescript
import { Inngest } from "inngest";
import { onReviewRequested } from "@/forest/inngest/review-job";

export const inngest = new Inngest({
  id: "ultracode",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Register functions for dev server discovery
export const functions = [onReviewRequested];
```

## Files Created

| File | Purpose |
|------|---------|
| `src/forest/inngest/review-job.ts` | Inngest function: fetch → LLM → parse → store |
| Updated `src/inngest.ts` | Register function with Inngest client |

## Key Design Decisions

1. **Step functions:** Each step (fetch PR, LLM stream, parse, store) is a separate `step.run()`. This allows Inngest to resume from the last successful step on retry (no duplicate D1 inserts if LLM step retries).

2. **Chart accumulation in step:** LLM streaming collects into a string within the step. This is fine — LLM responses are <50KB typically.

3. **Error handling:** Any step failure → review row marked `failed` → Inngest retries (2x) → if all retries fail, row stays `failed` for manual inspection.

4. **Token access:** User's GitHub token pulled from D1 inside `step.run("fetch-pr-diff")`. No token passed in Inngest event (security — event data logged by Inngest).

## Verification

```bash
pnpm run build
pnpm run type-check
# Manual: Trigger review via POST /api/repos/{owner}/{repo}/review
# Check Inngest dashboard (localhost:8288) for function execution
# Verify D1: reviews table shows status='completed' after ~20s
```

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Step timeout (5m) for very large repos | Low | Medium | Current max is ~30s LLM; 5m buffer sufficient |
| Retry causes duplicate D1 inserts | Low | Medium | Steps are atomic; if store-findings step succeeds, retry of LLM step won't re-run it |
| inngest.send() returns before event persisted | Low | High | Inngest guarantees delivery; log send failures |
| LLM streaming within step.run() | Low | Low | Workers step function properly handles async generators |
