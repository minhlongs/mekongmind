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

package cashclaw_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/mekongmind/engine/internal/cashclaw"
)

// stubGuard implements SignalGuard for tests.
type stubGuard struct {
	recordedSymbol string
	recordedCents  int64
	callCount      int
}

func (g *stubGuard) RecordEquity(symbol string, cents int64) error {
	g.recordedSymbol = symbol
	g.recordedCents = cents
	g.callCount++
	return nil
}

func TestSignalEmitter_Emit_WritesToBoltDB(t *testing.T) {
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "signals.db")

	emitter, err := cashclaw.NewSignalEmitter(dbPath, nil)
	if err != nil {
		t.Fatalf("NewSignalEmitter: %v", err)
	}
	defer emitter.Close()

	fv := &cashclaw.FairValue{
		Symbol:         "VNM",
		EstimatedPrice: 91.5,
		Confidence:     0.72,
		Forecast:       []cashclaw.ForecastRecord{{Period: 1, Close: 91.0}},
		Disclaimer:     cashclaw.FairValueDisclaimer,
	}

	if err := emitter.Emit(fv, 100_000_00); err != nil {
		t.Fatalf("Emit error: %v", err)
	}

	// Verify DB file exists.
	if _, err := os.Stat(dbPath); err != nil {
		t.Errorf("BoltDB file not created: %v", err)
	}
}

func TestSignalEmitter_Emit_CallsGuardRecordEquity(t *testing.T) {
	dir := t.TempDir()
	guard := &stubGuard{}
	emitter, err := cashclaw.NewSignalEmitter(filepath.Join(dir, "s.db"), guard)
	if err != nil {
		t.Fatal(err)
	}
	defer emitter.Close()

	fv := &cashclaw.FairValue{
		Symbol:         "FPT",
		EstimatedPrice: 120.0,
		Confidence:     0.6,
		Disclaimer:     cashclaw.FairValueDisclaimer,
	}

	if err := emitter.Emit(fv, 50_000_00); err != nil {
		t.Fatalf("Emit error: %v", err)
	}

	if guard.callCount != 1 {
		t.Errorf("guard.RecordEquity called %d times, want 1", guard.callCount)
	}
	if guard.recordedSymbol != "FPT" {
		t.Errorf("guard symbol = %q, want FPT", guard.recordedSymbol)
	}
	if guard.recordedCents != 50_000_00 {
		t.Errorf("guard equityCents = %d, want 5000000", guard.recordedCents)
	}
}

func TestSignalEmitter_Emit_NilGuard_NoError(t *testing.T) {
	dir := t.TempDir()
	emitter, err := cashclaw.NewSignalEmitter(filepath.Join(dir, "s.db"), nil)
	if err != nil {
		t.Fatal(err)
	}
	defer emitter.Close()

	fv := &cashclaw.FairValue{
		Symbol:         "VCB",
		EstimatedPrice: 85.0,
		Confidence:     0.5,
		Disclaimer:     cashclaw.FairValueDisclaimer,
	}

	// Should not panic or error even with nil guard.
	if err := emitter.Emit(fv, 0); err != nil {
		t.Errorf("Emit with nil guard returned error: %v", err)
	}
}

func TestSignalEmitter_ListSignals(t *testing.T) {
	dir := t.TempDir()
	emitter, err := cashclaw.NewSignalEmitter(filepath.Join(dir, "s.db"), nil)
	if err != nil {
		t.Fatal(err)
	}
	defer emitter.Close()

	fv := &cashclaw.FairValue{
		Symbol:         "VNM",
		EstimatedPrice: 91.5,
		Confidence:     0.7,
		Forecast:       []cashclaw.ForecastRecord{{Period: 1, Close: 91.0}, {Period: 2, Close: 91.5}},
		Disclaimer:     cashclaw.FairValueDisclaimer,
	}
	emitter.Emit(fv, 100_00)
	emitter.Emit(fv, 200_00)

	signals, err := emitter.ListSignals("VNM")
	if err != nil {
		t.Fatalf("ListSignals: %v", err)
	}
	if len(signals) != 2 {
		t.Errorf("got %d signals, want 2", len(signals))
	}
}

func TestSignalEmitter_ListSignals_FiltersBySymbol(t *testing.T) {
	dir := t.TempDir()
	emitter, _ := cashclaw.NewSignalEmitter(filepath.Join(dir, "s.db"), nil)
	defer emitter.Close()

	for _, sym := range []string{"VNM", "FPT", "VCB"} {
		fv := &cashclaw.FairValue{Symbol: sym, Disclaimer: cashclaw.FairValueDisclaimer}
		emitter.Emit(fv, 0)
	}

	signals, _ := emitter.ListSignals("FPT")
	if len(signals) != 1 {
		t.Errorf("expected 1 FPT signal, got %d", len(signals))
	}
	if signals[0].Symbol != "FPT" {
		t.Errorf("expected FPT, got %s", signals[0].Symbol)
	}
}
