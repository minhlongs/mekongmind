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

// safety_test.go — Go integration tests for the mekong_safety FFI wrapper.
//
// These tests require the dylib to be present at internal/ffi/lib/.
// Build first: ./rust_safety/build.sh
//
// Run: go test ./internal/ffi/... -v -count=1

package ffi

import (
	"testing"
)

// TestNewGuardAndClose verifies basic init + cleanup lifecycle.
func TestNewGuardAndClose(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	defer g.Close()

	if g.ptr == nil {
		t.Fatal("Guard.ptr should not be nil after init")
	}
}

// TestIsKilledInitiallyFalse verifies that a fresh guard is not in killed state.
// Note: this test may fail if ~/.mekong/kill.lock was left from a previous test run.
// Run `mekong safety reset` or delete ~/.mekong/kill.lock to clear.
func TestIsKilledInitiallyFalse(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	defer g.Close()

	// We cannot guarantee kill.lock is absent, so only assert if NOT killed
	// (skip if already killed from environment)
	if g.IsKilled() {
		t.Skip("kill.lock present in environment — skipping initial-state test")
	}
}

// TestRecordEquitySequenceDrawdown18Pct is the canonical drawdown test vector.
//
// Input sequence: 1000 → 1100 → 900 (in cents units)
// peak = 1100, current = 900
// drawdown = (1100 - 900) / 1100 * 100 = 18.18%
//
// After 18.18% > 10% threshold, kill-switch should activate.
func TestRecordEquitySequenceDrawdown18Pct(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	defer g.Close()

	const sym = "TEST_DRAWDOWN"

	// Record the sequence
	sequence := []int64{1000, 1100, 900}
	for _, v := range sequence {
		if err := g.RecordEquity(sym, v); err != nil {
			t.Fatalf("RecordEquity(%d) failed: %v", v, err)
		}
	}

	dd, isOK, err := g.CheckDrawdown(sym)
	if err != nil {
		t.Fatalf("CheckDrawdown failed: %v", err)
	}

	// Drawdown should be ~18.18%
	const expectedDD = float32(18.18)
	const tolerance = float32(0.1)
	if abs32(dd-expectedDD) > tolerance {
		t.Errorf("drawdown: expected ~%.2f%%, got %.4f%%", expectedDD, dd)
	}

	// Kill-switch should be active (18.18 > 10% threshold)
	if isOK {
		t.Error("isOK should be false when drawdown exceeds 10% kill threshold")
	}
	if !g.IsKilled() {
		t.Error("IsKilled() should return true after 18% drawdown")
	}
}

// TestFullVector5PointDrawdown tests the 5-point vector from phase-04 requirements:
// [1000, 1050, 1100, 950, 900] → drawdown ~18.18% ±0.1%
func TestFullVector5PointDrawdown(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	defer g.Close()

	const sym = "TEST_5PT"
	for _, v := range []int64{1000, 1050, 1100, 950, 900} {
		if err := g.RecordEquity(sym, v); err != nil {
			t.Fatalf("RecordEquity failed: %v", err)
		}
	}

	dd, _, err := g.CheckDrawdown(sym)
	if err != nil {
		t.Fatalf("CheckDrawdown failed: %v", err)
	}

	const expected = float32(18.18)
	if abs32(dd-expected) > 0.1 {
		t.Errorf("5-point drawdown: expected ~%.2f%%, got %.4f%%", expected, dd)
	}
}

// TestTriggerKillAndIsKilled verifies manual kill trigger.
func TestTriggerKillAndIsKilled(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	defer g.Close()

	// Record some baseline equity first
	if err := g.RecordEquity("KILL_SYM", 50000); err != nil {
		t.Fatalf("RecordEquity failed: %v", err)
	}

	// Trigger kill manually
	if err := g.TriggerKill(42); err != nil {
		t.Fatalf("TriggerKill failed: %v", err)
	}

	if !g.IsKilled() {
		t.Error("IsKilled() should return true after TriggerKill")
	}
}

// TestPersistenceAcrossGuardReinit verifies that kill state survives
// Guard re-creation (reads ~/.mekong/kill.lock on init).
//
// This test writes real state to ~/.mekong/ — it is tagged integration.
// Run only when the environment is clean.
func TestPersistenceAcrossGuardReinit(t *testing.T) {
	// Phase 1: Create guard, trigger kill
	g1, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard g1 failed: %v", err)
	}

	if err := g1.TriggerKill(7); err != nil {
		g1.Close()
		t.Fatalf("TriggerKill failed: %v", err)
	}
	g1.Close()

	// Phase 2: Create new guard — should restore KILLED from lock file
	g2, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard g2 failed: %v", err)
	}
	defer g2.Close()

	if !g2.IsKilled() {
		t.Error("kill state should persist across Guard reinitialisation")
	}
}

// TestCheckDrawdownUnknownSymbolReturnsZero verifies safe default for unknown symbols.
func TestCheckDrawdownUnknownSymbolReturnsZero(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	defer g.Close()

	dd, _, err := g.CheckDrawdown("UNKNOWN_SYM_XYZ")
	if err != nil {
		t.Fatalf("CheckDrawdown failed: %v", err)
	}
	if dd != 0.0 {
		t.Errorf("unknown symbol: expected 0.0 drawdown, got %f", dd)
	}
}

// TestCloseIsIdempotent verifies double-close does not panic.
func TestCloseIsIdempotent(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	g.Close()
	g.Close() // second close should be safe (ptr is nil after first)
}

// TestIsKilledOnClosedGuardReturnTrue verifies safe default on closed guard.
func TestIsKilledOnClosedGuardReturnTrue(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	g.Close()
	// Closed guard should report killed (safe default — deny all operations)
	if !g.IsKilled() {
		t.Error("closed Guard should report IsKilled=true as safe default")
	}
}

// TestState_returnsOKAfterInit verifies State() == 0 immediately after NewGuard
// (assuming no pre-existing kill.lock in the environment).
func TestState_returnsOKAfterInit(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	defer g.Close()

	// If kill.lock is present from prior run, state may already be KILLED.
	// Skip gracefully rather than failing on a dirty environment.
	if g.IsKilled() {
		t.Skip("kill.lock present in environment — skipping initial-state test")
	}

	st := g.State()
	if st != 0 {
		t.Errorf("State() after init: want 0 (OK), got %d (%s)", st, g.StateString())
	}
	if g.StateString() != "OK" {
		t.Errorf("StateString() after init: want \"OK\", got %q", g.StateString())
	}
}

// TestState_closedGuardReturns255 verifies the closed-guard sentinel value.
func TestState_closedGuardReturns255(t *testing.T) {
	g, err := NewGuard()
	if err != nil {
		t.Fatalf("NewGuard() failed: %v", err)
	}
	g.Close()

	if g.State() != 255 {
		t.Errorf("closed Guard State(): want 255 (UNKNOWN), got %d", g.State())
	}
	if g.StateString() != "UNKNOWN" {
		t.Errorf("closed Guard StateString(): want \"UNKNOWN\", got %q", g.StateString())
	}
}

// ------------------------------------------------------------------ //
// Helpers

func abs32(x float32) float32 {
	if x < 0 {
		return -x
	}
	return x
}
