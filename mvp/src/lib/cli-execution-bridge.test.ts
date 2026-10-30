import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  calculatePitVnd,
  canonicalJsonString,
  executeFallbackCommand,
  getCompanyGates,
  reconcileGate,
  signReceiptPayload,
  verifyReceiptSignature,
} from './cli-execution-bridge.ts';

const ledgerPath = path.resolve(process.cwd(), 'src/data/capability-ledger.json');
const fallbackLedgerPath = path.resolve(process.cwd(), 'mvp/src/data/capability-ledger.json');
const resolvedLedgerPath = fs.existsSync(ledgerPath) ? ledgerPath : fallbackLedgerPath;
const capabilityLedgerJson = JSON.parse(fs.readFileSync(resolvedLedgerPath, 'utf8'));

test('capability-ledger.json has 197 REAL_VERIFIED canonical command groups', () => {
  assert.equal(capabilityLedgerJson.length, 197);
  for (const entry of capabilityLedgerJson) {
    assert.equal(entry.maturity_tier, 'REAL_VERIFIED');
    assert.ok(entry.claim_id);
    assert.ok(entry.name);
    assert.ok(entry.department_id);
    assert.ok(entry.layer_id);
    assert.ok(entry.owner_agent);
  }
});

test('calculatePitVnd matches Vietnam 7-bracket progressive shortcut formula', () => {
  assert.deepEqual(calculatePitVnd(0), {
    taxAmount: 0,
    bracket: 0,
    formula: '0% (taxable <= 0)',
  });
  const b1 = calculatePitVnd(5_000_000);
  assert.equal(b1.taxAmount, 250_000);
  assert.equal(b1.bracket, 1);

  const b4 = calculatePitVnd(25_000_000);
  assert.equal(b4.taxAmount, 3_350_000);
  assert.equal(b4.bracket, 4);

  const b7 = calculatePitVnd(100_000_000);
  assert.equal(b7.taxAmount, 25_150_000);
  assert.equal(b7.bracket, 7);
});

test('canonicalJsonString sorts keys deterministically per RFC 8785', () => {
  const a = { z: 1, a: [3, 2, 1], m: { b: true, a: false } };
  const b = { m: { a: false, b: true }, a: [3, 2, 1], z: 1 };
  assert.equal(canonicalJsonString(a), canonicalJsonString(b));
});

test('executeFallbackCommand produces verified domain outputs and signed HMAC-SHA256 receipts across all 197 commands', () => {
  for (const entry of capabilityLedgerJson) {
    const { output, verification } = executeFallbackCommand(entry.name, { subcommand: 'status' }, entry);
    assert.ok(output);
    assert.equal(verification.status, 'PASSED');
    assert.notEqual(
      verification.verifier,
      'STANDARDIZED_CONTRACT_SCHEMA_VERIFIER',
      `Command ${entry.name} used generic fallback verifier`
    );

    const receiptPayload = {
      run_id: `RUN-TEST-${entry.name.toUpperCase()}`,
      command_id: entry.name,
      department_id: entry.department_id,
      layer_id: entry.layer_id,
      owner_agent: entry.owner_agent,
      receipt_tier: 'TIER_1_COMMAND_EXECUTION' as const,
      timestamp: '2026-10-27T00:00:00.000Z',
      sop_chain: entry.sop_steps || [],
      gate_artifact: entry.gate_artifact || '',
      input_sha256: 'a'.repeat(64),
      output_sha256: 'b'.repeat(64),
      domain_verification: verification,
      statutory_citations: entry.statutory_citations || [],
    };
    const signature = signReceiptPayload(receiptPayload);
    const fullReceipt = {
      ...receiptPayload,
      algorithm: 'HMAC-SHA256' as const,
      signature,
    };
    assert.equal(verifyReceiptSignature(fullReceipt), true);

    // Tamper check
    const tampered = { ...fullReceipt, output_sha256: '0'.repeat(64) };
    assert.equal(verifyReceiptSignature(tampered), false);
  }
});

test('receipt signing fails loudly when MEKONG_RECEIPT_HMAC_SECRET is unset', () => {
  // The bridge resolves the secret at module load, so the unconfigured case has
  // to run in a child process that starts without the variable.
  const bridgePath = path.resolve(process.cwd(), 'src/lib/cli-execution-bridge.ts');
  const probe = [
    `const { signReceiptPayload } = await import(${JSON.stringify(bridgePath)});`,
    `try { signReceiptPayload({ run_id: 'x' }); console.log('SIGNED'); }`,
    `catch (e) { console.log('THREW:' + (e instanceof Error && e.message.includes('MEKONG_RECEIPT_HMAC_SECRET'))); }`,
  ].join('\n');
  const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hmac-probe-'));
  const probeFile = path.join(probeDir, 'probe.mjs');
  fs.writeFileSync(probeFile, probe + '\n', 'utf8');

  try {
    const result = spawnSync(process.execPath, [probeFile], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { PATH: process.env.PATH, NODE_ENV: 'test' },
    });
    assert.equal(result.status, 0, `Child process failed:\n${result.stderr}`);
    assert.match(result.stdout, /THREW:true/);
    assert.doesNotMatch(result.stdout, /SIGNED/);
  } finally {
    fs.rmSync(probeDir, { recursive: true, force: true });
  }
});

test('two-tier milestone gate reconciliation transitions gate from LOCKED to SEALED_VERIFIED', () => {
  const initialGates = getCompanyGates();
  assert.equal(initialGates.length, 6);
  const updated = reconcileGate('first-revenue', 'TXN-NAPAS247-001', 'receipt:sha256:verified');
  assert.ok(updated);
  assert.equal(updated.status, 'SEALED_VERIFIED');
  assert.equal(updated.reconciled_transaction_id, 'TXN-NAPAS247-001');
});
