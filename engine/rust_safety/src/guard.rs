// Copyright 2026 Mekong IDE Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// guard.rs — Guard struct aggregating per-symbol equity curves + kill-switch
//
// Guard is the top-level object handed to FFI callers as an opaque pointer.
// It is heap-allocated via Box in lib.rs and never stack-copied across FFI.

use std::collections::HashMap;
use std::sync::Mutex;

use crate::drawdown::EquityCurve;
use crate::kill_switch::KillSwitch;

/// Drawdown threshold above which WARNING is triggered (%).
pub const DRAWDOWN_WARN_PCT: f64 = 7.0;

/// Drawdown threshold above which KILL is triggered (%). Hard-capped at 20.
pub const DRAWDOWN_KILL_PCT: f64 = 10.0;

/// Guard is the opaque context object used by all FFI callers.
/// Not Send/Sync itself — the Mutex + Arc inside KillSwitch handle threading.
pub struct Guard {
    /// Per-symbol equity curves protected by a Mutex (HashMap is not Sync).
    curves: Mutex<HashMap<String, EquityCurve>>,
    /// Shared kill-switch (thread-safe via AtomicU8 inside KillSwitch).
    pub kill_switch: KillSwitch,
}

impl Guard {
    /// Create a new Guard, restoring kill state from ~/.mekong/kill.lock.
    pub fn new() -> Result<Self, String> {
        let kill_switch = KillSwitch::new()
            .map_err(|e| format!("KillSwitch::new failed: {e}"))?;
        Ok(Guard {
            curves: Mutex::new(HashMap::new()),
            kill_switch,
        })
    }

    /// Record an equity data point for `symbol` (equity in cents or any unit).
    ///
    /// Automatically evaluates drawdown and escalates kill-switch state:
    /// - drawdown >= DRAWDOWN_WARN_PCT → STATE_WARN
    /// - drawdown >= DRAWDOWN_KILL_PCT → STATE_KILLED
    ///
    /// Returns Ok(drawdown_pct) or Err if mutex poisoned.
    pub fn record_equity(&self, symbol: &str, equity_cents: i64) -> Result<f64, String> {
        let equity = equity_cents as f64;

        let dd_pct = {
            let mut map = self.curves.lock()
                .map_err(|e| format!("Mutex poisoned: {e}"))?;
            let curve = map
                .entry(symbol.to_string())
                .or_insert_with(EquityCurve::new);
            curve.record(equity);
            curve.drawdown_pct().unwrap_or(0.0)
        };

        // Escalate kill state based on drawdown
        if dd_pct >= DRAWDOWN_KILL_PCT {
            let _ = self.kill_switch.trigger_kill(1); // reason 1 = drawdown breach
        } else if dd_pct >= DRAWDOWN_WARN_PCT {
            let _ = self.kill_switch.set_warn();
        }

        Ok(dd_pct)
    }

    /// Check drawdown for `symbol`. Returns (drawdown_pct, is_ok).
    /// `is_ok` is false when kill-switch is KILLED.
    pub fn check_drawdown(&self, symbol: &str) -> Result<(f64, bool), String> {
        let map = self.curves.lock()
            .map_err(|e| format!("Mutex poisoned: {e}"))?;

        let dd_pct = map
            .get(symbol)
            .and_then(|c| c.drawdown_pct())
            .unwrap_or(0.0);

        let is_ok = !self.kill_switch.is_killed();
        Ok((dd_pct, is_ok))
    }

    /// Externally trigger kill-switch (e.g. rule violation, manual halt).
    pub fn trigger_kill(&self, reason_code: i32) -> Result<(), String> {
        self.kill_switch
            .trigger_kill(reason_code)
            .map_err(|e| format!("trigger_kill IO error: {e}"))
    }

    /// Returns true if kill-switch is in KILLED state.
    pub fn is_killed(&self) -> bool {
        self.kill_switch.is_killed()
    }
}

// ------------------------------------------------------------------ //
// Unit tests

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::sync::{Mutex, MutexGuard};

    // Serialize Guard tests: they share ~/.mekong/kill.lock(.tmp) files,
    // so parallel runs race on tmp+rename (ENOENT when a peer unlinked first).
    // Hold this mutex for the duration of each test via `let (g, _lock) = make_guard();`.
    static TEST_MUTEX: Mutex<()> = Mutex::new(());

    fn make_guard() -> (Guard, MutexGuard<'static, ()>) {
        // Poisoned mutex is fine — previous test panicked, state was cleaned anyway.
        let lock = TEST_MUTEX.lock().unwrap_or_else(|e| e.into_inner());
        // Delete stale ~/.mekong/kill.lock so a prior KILL doesn't bleed in.
        // Guard::new() restores persisted state on init (correct production behavior).
        if let Ok(home) = std::env::var("HOME") {
            let _ = std::fs::remove_file(
                std::path::Path::new(&home).join(".mekong").join("kill.lock"),
            );
        }
        (Guard::new().expect("Guard::new failed in test"), lock)
    }

    #[test]
    fn test_guard_creates_ok() {
        let (g, _lock) = make_guard();
        assert!(!g.is_killed());
    }

    #[test]
    fn test_record_equity_sequence_drawdown() {
        let (g, _lock) = make_guard();
        g.record_equity("TEST", 1000).unwrap();
        g.record_equity("TEST", 1050).unwrap();
        g.record_equity("TEST", 1100).unwrap();
        g.record_equity("TEST", 950).unwrap();
        let dd = g.record_equity("TEST", 900).unwrap();
        // Expected ~18.18%
        assert!((dd - 18.18).abs() < 0.1, "drawdown={dd}");
    }

    #[test]
    fn test_kill_triggered_at_threshold() {
        let (g, _lock) = make_guard();
        // Start at 1000, drop to 850 = 15% drawdown → exceeds 10% threshold → KILL
        g.record_equity("SYM", 1000).unwrap();
        g.record_equity("SYM", 850).unwrap();
        assert!(g.is_killed(), "should be killed at 15% drawdown");
    }

    #[test]
    fn test_manual_trigger_kill() {
        let (g, _lock) = make_guard();
        g.record_equity("SYM", 1000).unwrap();
        assert!(!g.is_killed());
        g.trigger_kill(99).unwrap();
        assert!(g.is_killed());
    }

    #[test]
    fn test_check_drawdown_returns_pct_and_ok_flag() {
        let (g, _lock) = make_guard();
        g.record_equity("AAPL", 1000).unwrap();
        g.record_equity("AAPL", 1100).unwrap();
        g.record_equity("AAPL", 900).unwrap();
        let (dd, is_ok) = g.check_drawdown("AAPL").unwrap();
        // 18.18% drawdown exceeds 10% → kill triggered, is_ok=false
        assert!(!is_ok);
        assert!((dd - 18.18).abs() < 0.1, "dd={dd}");
    }

    #[test]
    fn test_multi_symbol_isolation() {
        let (g, _lock) = make_guard();
        g.record_equity("AAPL", 1000).unwrap();
        g.record_equity("MSFT", 2000).unwrap();
        // Each symbol gets independent curve
        let (dd_aapl, _) = g.check_drawdown("AAPL").unwrap();
        let (dd_msft, _) = g.check_drawdown("MSFT").unwrap();
        assert!((dd_aapl - 0.0).abs() < 0.001);
        assert!((dd_msft - 0.0).abs() < 0.001);
    }
}
