import { NextRequest, NextResponse } from 'next/server';
import capabilityLedger from '@/data/capability-ledger.json';

const MEKONG_API_BASE = process.env.MEKONG_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cluster = searchParams.get('cluster');
  const departmentId = searchParams.get('department_id');
  const layerId = searchParams.get('layer_id');
  const maturityTier = searchParams.get('maturity_tier');

  try {
    const upstreamUrl = new URL(`${MEKONG_API_BASE}/v1/cli/capabilities`);
    if (cluster) upstreamUrl.searchParams.set('cluster', cluster);
    if (departmentId) upstreamUrl.searchParams.set('department_id', departmentId);
    if (layerId) upstreamUrl.searchParams.set('layer_id', layerId);
    if (maturityTier) upstreamUrl.searchParams.set('maturity_tier', maturityTier);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(upstreamUrl.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, source: 'live_gateway' });
    }
  } catch {
    // Fallback to local synchronous capability ledger json
  }

  // Filter in-memory capability ledger
  const rawList = capabilityLedger as Array<{
    cluster?: string;
    department_id?: string;
    layer_id?: string;
    maturity_tier?: string;
  }>;
  let items = rawList;
  if (cluster) items = items.filter((e) => e.cluster === cluster);
  if (departmentId) items = items.filter((e) => e.department_id === departmentId);
  if (layerId) items = items.filter((e) => e.layer_id === layerId);
  if (maturityTier) items = items.filter((e) => e.maturity_tier === maturityTier);

  return NextResponse.json({
    summary: {
      total_command_groups: rawList.length,
      by_maturity_tier: {
        REAL_VERIFIED: rawList.filter((e) => e.maturity_tier === 'REAL_VERIFIED').length,
        PARTIAL_LOOKUP: rawList.filter((e) => e.maturity_tier === 'PARTIAL_LOOKUP').length,
        CATALOG_ONLY: rawList.filter((e) => e.maturity_tier === 'CATALOG_ONLY').length,
      },
    },
    integrity: { valid: rawList.length === 197, total_entries: rawList.length, errors: [] },
    count: items.length,
    items,
    source: 'local_ledger_fallback',
  });
}
