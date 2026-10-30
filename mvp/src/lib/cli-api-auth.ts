import crypto from 'node:crypto';
import {
  getCompanyGates,
  getRunById,
  verifyReceiptSignature,
  type CommandReceipt,
  type MilestoneGate,
} from './cli-execution-bridge.ts';

export type CliApiAuthResult =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 503;
      code: 'AUTH_NOT_CONFIGURED' | 'UNAUTHORIZED';
      error: string;
    };

export type GateEvidenceVerificationResult =
  | { ok: true; verified_via: 'run_history' | 'signed_receipt' }
  | {
      ok: false;
      status: 422;
      code: 'UNVERIFIED_EVIDENCE';
      error: string;
    };

function timingSafeStringEqual(a: string, b: string): boolean {
  // Hash both sides to fixed 32-byte SHA-256 digests before comparing so
  // timingSafeEqual never throws on length mismatch and does not leak the
  // configured token length through timing.
  const digestA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const digestB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(digestA, digestB) && a.length === b.length;
}

/**
 * Validates `Authorization: Bearer <token>` against `MEKONG_CLI_API_TOKEN`.
 * Fails closed (503) when the environment variable is unset or empty.
 */
export function verifyCliApiBearerAuth(
  authorizationHeader: string | null | undefined
): CliApiAuthResult {
  const configuredToken = process.env.MEKONG_CLI_API_TOKEN?.trim();
  if (!configuredToken) {
    return {
      ok: false,
      status: 503,
      code: 'AUTH_NOT_CONFIGURED',
      error:
        'MEKONG_CLI_API_TOKEN is not configured. Mutating CLI API routes are disabled until a token is set.',
    };
  }

  if (typeof authorizationHeader !== 'string' || !authorizationHeader.trim()) {
    return {
      ok: false,
      status: 401,
      code: 'UNAUTHORIZED',
      error: 'Missing Authorization header. Expected: Authorization: Bearer <token>.',
    };
  }

  const match = /^Bearer\s+(\S+)$/.exec(authorizationHeader.trim());
  if (!match) {
    return {
      ok: false,
      status: 401,
      code: 'UNAUTHORIZED',
      error: 'Malformed Authorization header. Expected: Authorization: Bearer <token>.',
    };
  }

  const providedToken = match[1];
  if (!timingSafeStringEqual(providedToken, configuredToken)) {
    return {
      ok: false,
      status: 401,
      code: 'UNAUTHORIZED',
      error: 'Invalid API token.',
    };
  }

  return { ok: true };
}

function matchesSignatureReference(evidenceRef: string, signature: string): boolean {
  const prefix = 'receipt:sha256:';
  if (!evidenceRef.startsWith(prefix) || typeof signature !== 'string' || signature.length < 16) {
    return false;
  }
  const claimedHex = evidenceRef.slice(prefix.length).toLowerCase();
  const actualHex = signature.toLowerCase();
  if (claimedHex.length < 16 || claimedHex.length > actualHex.length) {
    return false;
  }
  if (!/^[0-9a-f]+$/.test(claimedHex)) {
    return false;
  }
  return timingSafeStringEqual(claimedHex, actualHex.slice(0, claimedHex.length));
}

function receiptMatchesTargetGate(
  receipt: Partial<CommandReceipt> & Record<string, unknown>,
  targetGate: MilestoneGate | undefined
): boolean {
  const domainVerification = receipt.domain_verification as
    | { status?: unknown }
    | undefined;
  if (domainVerification?.status !== 'PASSED') {
    return false;
  }
  if (!targetGate) {
    return true;
  }
  return (
    receipt.gate_artifact === targetGate.gate_artifact ||
    receipt.layer_id === targetGate.layer_id
  );
}

/**
 * Cross-checks a milestone gate reconciliation request against cryptographic
 * execution evidence so callers cannot mark a gate SEALED_VERIFIED with a
 * self-declared `evidence_ref` string or a receipt from a different layer/gate.
 */
export function verifyGateReconciliationEvidence(input: {
  gateId?: string;
  evidenceRef: string;
  runId?: unknown;
  receipt?: unknown;
}): GateEvidenceVerificationResult {
  const evidenceRef = typeof input.evidenceRef === 'string' ? input.evidenceRef.trim() : '';
  const targetGate =
    typeof input.gateId === 'string' && input.gateId.trim()
      ? getCompanyGates().find((g) => g.gate_id === input.gateId?.trim())
      : undefined;

  if (typeof input.runId === 'string' && input.runId.trim()) {
    const record = getRunById(input.runId.trim());
    const receiptRecord = record?.receipt as
      | (Partial<CommandReceipt> & Record<string, unknown>)
      | undefined;
    if (
      record &&
      record.status === 'COMPLETED' &&
      receiptRecord &&
      verifyReceiptSignature(receiptRecord) &&
      matchesSignatureReference(evidenceRef, record.receipt.signature) &&
      receiptMatchesTargetGate(receiptRecord, targetGate)
    ) {
      return { ok: true, verified_via: 'run_history' };
    }
  }

  if (input.receipt && typeof input.receipt === 'object') {
    const candidate = input.receipt as Partial<CommandReceipt> & Record<string, unknown>;
    if (
      typeof candidate.signature === 'string' &&
      verifyReceiptSignature(candidate) &&
      matchesSignatureReference(evidenceRef, candidate.signature) &&
      receiptMatchesTargetGate(candidate, targetGate)
    ) {
      return { ok: true, verified_via: 'signed_receipt' };
    }
  }

  return {
    ok: false,
    status: 422,
    code: 'UNVERIFIED_EVIDENCE',
    error:
      'evidence_ref could not be verified against a completed run_id or a valid HMAC-signed receipt matching the target gate.',
  };
}
