import { NextRequest, NextResponse } from 'next/server';
import { getCompanyGates, reconcileGate } from '@/lib/cli-execution-bridge';

const MEKONG_API_BASE = process.env.MEKONG_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${MEKONG_API_BASE}/v1/cli/gates`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, source: 'live_gateway' });
    }
  } catch {
    // Fallback to local milestone gates state
  }

  const gates = getCompanyGates();
  const unlockedCount = gates.filter((g) => g.status === 'SEALED_VERIFIED').length;

  return NextResponse.json({
    gate_tier: 'TIER_2_COMPANY_MILESTONE',
    total_gates: gates.length,
    unlocked_count: unlockedCount,
    gates,
    source: 'local_milestone_ledger',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gateId = typeof body?.gate_id === 'string' ? body.gate_id.trim() : '';
    const transactionId = typeof body?.transaction_id === 'string' ? body.transaction_id.trim() : '';
    const evidenceRef = typeof body?.evidence_ref === 'string' ? body.evidence_ref.trim() : '';

    if (!gateId || !transactionId || !evidenceRef) {
      return NextResponse.json(
        { error: 'gate_id, transaction_id, and evidence_ref are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(
        `${MEKONG_API_BASE}/v1/cli/gates/${encodeURIComponent(gateId)}/reconcile`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id: transactionId, evidence_ref: evidenceRef }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ ...data, source: 'live_gateway' });
      }
    } catch {
      // Fallback to local state
    }

    const updated = reconcileGate(gateId, transactionId, evidenceRef);
    if (!updated) {
      return NextResponse.json(
        { error: `Milestone gate '${gateId}' not found`, code: 'GATE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...updated,
      source: 'local_milestone_ledger',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gate reconciliation error';
    return NextResponse.json({ error: message, code: 'RECONCILE_ERROR' }, { status: 500 });
  }
}
