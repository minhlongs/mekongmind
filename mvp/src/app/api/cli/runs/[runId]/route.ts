import { NextRequest, NextResponse } from 'next/server';
import { getRunById } from '@/lib/cli-execution-bridge';

// A dynamic segment route handler makes Next skip the `output: 'export'` guard
// only when revalidate is 0, which is honest here: this reads a live gateway
// and never serves a cached response.
export const revalidate = 0;

const MEKONG_API_BASE = process.env.MEKONG_API_URL || 'http://localhost:8000';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ runId: string }> }
) {
  const { runId } = await context.params;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${MEKONG_API_BASE}/v1/cli/runs/${encodeURIComponent(runId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, source: 'live_gateway' });
    }
  } catch {
    // Fallback to in-memory run history
  }

  const localRecord = getRunById(runId);
  if (!localRecord) {
    return NextResponse.json(
      { error: `Run '${runId}' not found`, code: 'RUN_NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json(localRecord);
}
