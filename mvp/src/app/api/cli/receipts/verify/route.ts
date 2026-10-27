import { NextRequest, NextResponse } from 'next/server';
import { verifyReceiptSignature } from '@/lib/cli-execution-bridge';

const MEKONG_API_BASE = process.env.MEKONG_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const receipt = body?.receipt;

    if (!receipt || typeof receipt !== 'object') {
      return NextResponse.json(
        { valid: false, reason: 'Invalid or missing receipt object', code: 'INVALID_RECEIPT' },
        { status: 400 }
      );
    }

    // Attempt live FastAPI gateway verification first
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${MEKONG_API_BASE}/v1/cli/receipts/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ ...data, source: 'live_gateway' });
      }
    } catch {
      // Fallback to local RFC 8785 HMAC-SHA256 verification
    }

    const isValid = verifyReceiptSignature(receipt as Record<string, unknown>);
    return NextResponse.json({
      valid: isValid,
      run_id: receipt.run_id || null,
      command_id: receipt.command_id || null,
      algorithm: 'HMAC-SHA256',
      domain_verification: receipt.domain_verification || null,
      source: 'local_rfc8785_verifier',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification error';
    return NextResponse.json(
      { valid: false, error: message, code: 'VERIFY_ERROR' },
      { status: 500 }
    );
  }
}
