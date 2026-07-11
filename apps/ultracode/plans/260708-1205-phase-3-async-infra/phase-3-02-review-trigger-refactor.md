# Phase 3.2: Refactor Review Trigger to Async Job

**Owner:** Backend (forest + api layer)
**Effort:** 4h
**Blocker:** Phase 3.1 (Inngest configured)

## What to Build

Replace the synchronous `review/stream` trigger with an async `review` trigger that enqueues an Inngest job and returns immediately.

## Problem

Current `app/api/repos/[owner]/[repo]/review/stream/route.ts`:
1. Validates auth + repo
2. Fetches PR diff
3. Runs `llmClient.streamReview()` inline (blocks 10-30s)
4. Parses + stores findings inline
5. Streams SSE response

This blocks the Worker for the entire review duration. CF Workers CPU limit = 30s.

## New Flow

```
POST /api/repos/{owner}/{repo}/review
  → validate auth
  → validate repo
  → parse request body (code or pr_number)
  → INSERT review row (status: queued)
  → inngest.send({ name: "review/requested", data: { reviewId, repoId, code, language } })
  → return 202 { reviewId }
```

## Implementation

### 1. Create `app/api/repos/[owner]/[repo]/review/route.ts` (new)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db/client";
import { inngest } from "@/inngest";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { owner, repo } = await ctx.params;
    const db = getDb();

    // Validate repo ownership
    const repoRow = await db
      .prepare("SELECT id FROM repos WHERE user_id = ? AND owner = ? AND repo_name = ?")
      .bind(session.sub, owner, repo)
      .first<{ id: string }>();

    if (!repoRow) return NextResponse.json({ error: "Repo not found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as {
      code?: string;
      pr_number?: number;
      language?: string;
    };

    if (!body.code && !body.pr_number) {
      return NextResponse.json({ error: "Provide `code` or `pr_number`" }, { status: 400 });
    }

    const reviewId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    // Insert review as queued — Inngest will complete it
    await db
      .prepare(
        `INSERT INTO reviews (id, repo_id, pull_number, title, status, findings_count, started_at)
         VALUES (?, ?, ?, ?, 'queued', 0, ?)`
      )
      .bind(
        reviewId,
        repoRow.id,
        body.pr_number ?? 0,
        body.pr_number
          ? `PR #${body.pr_number} review`
          : `Review ${reviewId.slice(0, 8)}`,
        startedAt
      )
      .run();

    // Enqueue Inngest job
    await inngest.send({
      name: "review/requested",
      data: {
        reviewId,
        repoId: repoRow.id,
        owner,
        repo,
        code: body.code ?? null,
        pr_number: body.pr_number ?? null,
        language: body.language ?? "code",
        userId: session.sub,
      },
    });

    return NextResponse.json({ reviewId, status: "queued" }, { status: 202 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

**Key differences from stream route:**
- Returns `202 Accepted` immediately with `{ reviewId }`
- Does NOT fetch PR diff or run LLM inline
- Does NOT stream SSE from this route
- Creates review row with `status: 'queued'`
- Enqueues Inngest event `review/requested`

### 2. Deprecate `app/api/repos/[owner]/[repo]/review/stream/route.ts`

Add deprecation header + redirect behavior:

```typescript
// At top of file, add:
// DEPRECATED: Use POST /api/repos/[owner]/[repo]/review instead.
// This route will be removed after Phase 4 UI migration confirmed.
```

Keep functional for backwards compat, but add deprecation note in response:

```typescript
// In the return Response, add header:
headers: {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "X-Deprecated": "Use /api/repos/[owner]/[repo]/review for async reviews",
}
```

## Files Changed

| File | Phase | Change |
|------|-------|--------|
| `app/api/repos/[owner]/[repo]/review/route.ts` | Phase 2 | **New** — async trigger |
| `app/api/repos/[owner]/[repo]/review/stream/route.ts` | Phase 2 | **Deprecated** — add deprecation markers |

## Verification

```bash
pnpm run type-check  # both routes compile
# Manual: POST /api/repos/{owner}/{repo}/review with { code: "console.log(1)" }
# Expected: 202 { reviewId, status: "queued" }
```

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Inngest send fails silently | Low | High | Check `inngest.send()` return; log failures |
| Race: review row inserted but Inngest event lost | Low | Medium | Inngest ensures at-least-once delivery |
| Client expects SSE from this endpoint | Low | Medium | Old `stream` route preserved; client updated in Phase 4 |
