import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, getDb } from "@/db/client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const reviewId = (await params).id;
  const streamParam = req.nextUrl.searchParams.get("stream");

  if (streamParam !== "true") {
    return NextResponse.json({ error: "Missing ?stream=true" }, { status: 400 });
  }

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const db = getDb();

    type ReviewRow = {
      id: string;
      status: string;
      findings_count: number | null;
      owner_id: string;
    };

    const review = (await db
      .prepare<ReviewRow>(
        `SELECT r.id, r.status, r.findings_count, r.completed_at,
                r.repo_id, r.pull_number, r.title, r.started_at, r.created_at,
                rp.user_id as owner_id
         FROM reviews r
         JOIN repos rp ON rp.id = r.repo_id
         WHERE r.id = ?`,
      )
      .bind(reviewId)
      .first()) as ReviewRow | null;

    if (!review || review.owner_id !== session.sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const encoder = new TextEncoder();
    let closed = false;
    let lastStatus = review.status;
    let lastCount = review.findings_count ?? 0;
    let heartbeatCounter = 0;
    let tickTimer: ReturnType<typeof setTimeout> | null = null;

    const send = (data: string) => {
      if (!closed) controller.enqueue(encoder.encode(data));
    };

    let controller: ReadableStreamDefaultController<Uint8Array>;

    const stream = new ReadableStream({
      start(c) {
        controller = c;
        const payload = JSON.stringify({
          type: "status",
          status: lastStatus,
          findingsCount: lastCount,
        });
        send(`data: ${payload}\n\n`);

        const startTime = Date.now();
        const MAX_DURATION = 10 * 60 * 1000;
        const POLL_INTERVAL = 2000;

        const tick = async () => {
          if (closed) return;
          if (Date.now() - startTime > MAX_DURATION) {
            send(`data: ${JSON.stringify({ type: "done" })}\n\n`);
            closed = true;
            controller.close();
            return;
          }

          try {
            type PollRow = { status: string; findings_count: number | null };

            const row = (await db
              .prepare<PollRow>(
                "SELECT status, findings_count FROM reviews WHERE id = ?",
              )
              .bind(reviewId)
              .first()) as PollRow | undefined;

            if (!row) {
              send(`data: ${JSON.stringify({ type: "done" })}\n\n`);
              closed = true;
              controller.close();
              return;
            }

            if (row.status === "completed") {
              const payload = JSON.stringify({
                type: "completed",
                reviewId,
                findingsCount: row.findings_count ?? 0,
              });
              send(
                `event: message\ndata: ${payload}\nid: ${crypto.randomUUID()}\n\n`,
              );
              send(`data: ${JSON.stringify({ type: "done" })}\n\n`);
              closed = true;
              controller.close();
              return;
            }

            if (row.status === "failed") {
              const payload = JSON.stringify({
                type: "error",
                message: "Review failed",
              });
              send(
                `event: message\ndata: ${payload}\nid: ${crypto.randomUUID()}\n\n`,
              );
              send(`data: ${JSON.stringify({ type: "done" })}\n\n`);
              closed = true;
              controller.close();
              return;
            }

            if (row.status !== lastStatus || row.findings_count !== lastCount) {
              lastStatus = row.status;
              lastCount = row.findings_count ?? 0;
              const payload = JSON.stringify({
                type: "status",
                status: lastStatus,
                findingsCount: lastCount,
              });
              send(
                `event: message\ndata: ${payload}\nid: ${crypto.randomUUID()}\n\n`,
              );
            }

            heartbeatCounter++;
            if (heartbeatCounter % 7 === 0) {
              send(": heartbeat\n\n");
            }
          } catch (err) {
            logger.error(
              "SSE poll error: " +
                (err instanceof Error ? err.message : String(err)),
            );
            send(
              `event: message\ndata: ${JSON.stringify({ type: "error", message: "Stream error" })}\nid: ${crypto.randomUUID()}\n\n`,
            );
            send(`data: ${JSON.stringify({ type: "done" })}\n\n`);
            closed = true;
            controller.close();
            return;
          }

          tickTimer = setTimeout(tick, POLL_INTERVAL);
        };

        tickTimer = setTimeout(tick, POLL_INTERVAL);
      },
      cancel() {
        closed = true;
        if (tickTimer) clearTimeout(tickTimer);
      },
      pull() {
        // backpressure hint — no-op, we drive via setTimeout
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    logger.error(
      "SSE GET error: " + (err instanceof Error ? err.message : String(err)),
    );
    return NextResponse.json({ error: "Stream failed" }, { status: 500 });
  }
}
