# Phase 3.4: Client-Side Polling + Pending State

**Owner:** Frontend (land + app layer)
**Effort:** 3h
**Blocker:** Phase 3.2 (async trigger), Phase 2 (dashboard UI)

## What to Build

1. Repos page: "Run Review" now calls async endpoint, shows "Review running..." with countdown/pulse
2. Reviews page: handles `queued` status, auto-refreshes or SSE polls until completion
3. New SSE stream route `GET /api/reviews/{id}/stream` for real-time completion notification

## Problem

After Phase 3.2, "Run Review" does:
```
POST /api/repos/.../review  → 202 { reviewId }
```

Client needs to:
1. Show "Review running" state (not immediate results)
2. Poll or wait for completion
3. Show findings when ready

## Approach: SSE stream for completion events

New route: `GET /api/reviews/{id}/stream`

This SSE endpoint:
1. Checks review status from D1
2. If `completed` → immediately sends findings + closes
3. If `queued` or `pending` → holds connection, re-polls D1 every 2s
4. When status changes to `completed` → sends findings + closes
5. Max wait: 5 minutes (then returns 408)

### Implementation: `app/api/reviews/[id]/stream/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const db = getDb();

    // Verify review belongs to user
    const reviewRow = await db
      .prepare(
        `SELECT r.*, repos.owner, repos.repo_name
         FROM reviews r
         JOIN repos ON r.repo_id = repos.id
         WHERE r.id = ? AND repos.user_id = ?`
      )
      .bind(id, session.sub)
      .first<{
        id: string;
        status: string;
        findings_count: number;
        completed_at: string | null;
      }>();

    if (!reviewRow) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    const encoder = new TextEncoder();
    let pollCount = 0;
    const MAX_POLLS = 150; // 150 × 2s = 5 minutes

    const stream = new ReadableStream({
      async start(controller) {
        const poll = async () => {
          const current = await db
            .prepare("SELECT status, findings_count, completed_at FROM reviews WHERE id = ?")
            .bind(id)
            .first<{ status: string; findings_count: number; completed_at: string | null }>();

          if (!current) {
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ message: "Review not found" })}\n\n`)
            );
            controller.close();
            return;
          }

          if (current.status === "completed" && current.completed_at) {
            // Fetch findings
            const findings = await db
              .prepare(
                `SELECT id, severity, category, title, description, file_path, line_start, line_end, suggestion, status
                 FROM findings WHERE review_id = ? ORDER BY
                 CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 WHEN 'info' THEN 3 END`
              )
              .bind(id)
              .all();

            controller.enqueue(
              encoder.encode(
                `event: complete\ndata: ${JSON.stringify({
                  reviewId: id,
                  status: "completed",
                  findingsCount: current.findings_count,
                  findings: findings.results,
                })}\n\n`
              )
            );
            controller.close();
            return;
          }

          if (current.status === "failed") {
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ message: "Review failed" })}\n\n`
              )
            );
            controller.close();
            return;
          }

          // Still queued/in-progress — send heartbeat + keep polling
          pollCount++;
          if (pollCount >= MAX_POLLS) {
            controller.enqueue(
              encoder.encode(
                `event: timeout\ndata: ${JSON.stringify({ message: "Review timed out after 5 minutes" })}\n\n`
              )
            );
            controller.close();
            return;
          }

          // Heartbeat every 2s
          setTimeout(poll, 2000);
        };

        await poll();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

## Client-Side Changes

### `app/(dashboard)/repos/page.tsx` — "Run Review" button

Change from:
```
fetch('/api/repos/.../review/stream', { method: 'POST' })
  → handle SSE stream inline
```

To:
```typescript
// 1. POST to async endpoint
const res = await fetch(`/api/repos/${owner}/${repo}/review`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ pr_number: selectedPr }),
});
const { reviewId } = await res.json();

// 2. Navigate to review page (or open side panel)
router.push(`/reviews/${reviewId}`);
```

The review page handles the SSE connection for completion.

### `app/(dashboard)/reviews/page.tsx` — Handle queued status

Add conditional rendering:

```typescript
// If latest review is queued/in-progress:
// - Show "Review running..." with animated pulse dot
// - Auto-connect to /api/reviews/{id}/stream
// - Transition to findings view when complete

// If completed:
// - Show findings list (existing Phase 2 UI)
```

### `app/(dashboard)/reviews/[id]/page.tsx` — New (or update existing)

- If `status === 'queued'` → show pending state + connect to `/api/reviews/{id}/stream`
- If `status === 'completed'` → show findings (existing)
- If `status === 'failed'` → show error + retry button

## Files Changed

| File | Change |
|------|--------|
| `app/api/reviews/[id]/stream/route.ts` | New — SSE completion poller |
| `app/(dashboard)/repos/page.tsx` | Update: POST → async endpoint → navigate |
| `app/(dashboard)/reviews/page.tsx` | Update: handle queued status |
| `app/(dashboard)/reviews/[id]/page.tsx` | Update or create: SSE connect for pending reviews |

## Verification

```bash
pnpm run build
pnpm run type-check
# Manual E2E:
# 1. Go to /dashboard/repos
# 2. Click "Run Review" on a repo
# 3. See "Review running..." state (queued)
# 4. Wait ~20s for LLM
# 5. See findings appear (auto-redirect or SSE event)
```

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| SSE connection drops silently | Low | Medium | Client reconnects with exponential backoff (max 3 retries) |
| 5min timeout insufficient | Low | High | Inngest step timeout is 5m; if LLM takes longer, Inngest retries |
| Stuck in queued on Inngest failure | Low | Medium | Fallback: client shows "Retry" button → re-triggers review |
| Memory leak from unclosed SSE connections | Low | Low | `controller.close()` in finally + abort controller on unmount |
