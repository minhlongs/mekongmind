#!/usr/bin/env node
/**
 * preflight-check.js — Validate all required modules before daemon boot
 *
 * Prevents MODULE_NOT_FOUND crashes by checking every require() path
 * that task-watcher.js needs. Run before starting the daemon.
 *
 * Exit 0 = all OK, Exit 1 = missing modules (prints which ones)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// All modules task-watcher.js requires (directly or transitively)
const REQUIRED_FILES = [
  'config.js',
  'task-watcher.js',
  'lib/brain-process-manager.js',
  'lib/brain-spawn-manager.js',
  'lib/brain-logger.js',
  'lib/brain-state-machine.js',
  'lib/task-queue.js',
  'lib/auto-cto-pilot.js',
  'lib/project-scanner.js',
  'lib/learning-engine.js',
  'lib/m1-cooling-daemon.js',
  'lib/self-healer.js',
  'lib/lobster-proxy-pilot.js',
  'lib/brain-supervisor.js',
  'lib/evolution-engine.js',
  'lib/project-commander.js',
  'lib/brain-health-server.js',
  'lib/proxy-rules-validator.js',
  'lib/doanh-trai-registry.js',
  'lib/mission-dispatcher.js',
  'lib/circuit-breaker.js',
  'lib/brain-boot-sequence.js',
  'lib/brain-mission-runner.js',
  'lib/brain-respawn-controller.js',
  'lib/brain-terminal-app.js',
  'lib/brain-heartbeat.js',
  'lib/brain-output-hash-stagnation-watchdog.js',
  'lib/brain-system-monitor.js',
  'lib/agi-score-calculator.js',
  'lib/api-rate-gate.js',
  'lib/mission-journal.js',
  'lib/mission-complexity-classifier.js',
  'lib/mission-recovery.js',
  'lib/post-mission-gate.js',
  'lib/self-analyzer.js',
  'lib/clawwork-integration.js',
  'lib/moltbook-integration.js',
];

let missing = 0;
for (const rel of REQUIRED_FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: ${rel}`);
    missing++;
  }
}

if (missing > 0) {
  console.error(`\nPREFLIGHT FAILED: ${missing} file(s) missing. Daemon will NOT start.`);
  console.error('Run: git checkout -- apps/openclaw-worker/ to restore files.');
  process.exit(1);
} else {
  // Also try to require config to catch syntax errors
  try {
    require(path.join(ROOT, 'config'));
    console.log(`PREFLIGHT OK: ${REQUIRED_FILES.length} files verified.`);
    process.exit(0);
  } catch (e) {
    console.error(`PREFLIGHT FAILED: config.js load error: ${e.message}`);
    process.exit(1);
  }
}
