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

//go:build darwin

// Package datasources — mt5.go: macOS STUB for MetaTrader 5 data source.
//
// # macOS MT5 Platform Decision
//
// MT5 (MetaTrader 5) native libraries are Windows-only DLLs. MetaQuotes provides
// no macOS ARM (M1/M2/M3) runtime. Options evaluated:
//
//   (a) Wine container on macOS — high ops cost, unreliable on Apple Silicon ARM64,
//       requires Rosetta + additional licensing risk. DEFERRED.
//
//   (b) Remote MT5 host (Linux x86 VPS) running MT5 + REST bridge, callable from
//       macOS via HTTP. This is the intended production path. A future Linux-specific
//       implementation (mt5_linux.go, //go:build linux) will provide real HTTP transport.
//       DEFERRED to next phase.
//
//   (c) Replace entirely with broker-agnostic REST APIs (Alpaca, Interactive Brokers)
//       that have no platform restrictions. Under evaluation.
//
// DECISION for this phase: permanent stub on darwin builds.
// All MT5Client methods return ErrMT5NotSupportedOnDarwin so callers get a
// structured, actionable error rather than a generic "not implemented".
//
// When the Linux REST bridge is ready, add mt5_linux.go with //go:build linux
// and keep this darwin stub in place. The build system will select the correct
// file per platform automatically.
//
// See: docs/fairvalue-algorithm.md §MT5 Feasibility Note
package datasources

import "errors"

// ErrMT5NotSupportedOnDarwin is returned by all MT5Client methods on macOS builds.
// MT5 requires a Windows or Linux runtime; macOS ARM has no native support.
// Production path: Linux REST bridge via mt5_linux.go (future phase).
var ErrMT5NotSupportedOnDarwin = errors.New(
	"mt5: not supported on darwin/macOS — " +
		"MT5 vendor DLLs are Windows-only; " +
		"use the Linux REST bridge (mt5_linux.go) in production; " +
		"see docs/fairvalue-algorithm.md for alternatives",
)

// ErrNotImplemented is kept as a package-level alias for backward compatibility
// with existing callers and tests. New code should reference ErrMT5NotSupportedOnDarwin.
//
// Deprecated: use ErrMT5NotSupportedOnDarwin.
var ErrNotImplemented = ErrMT5NotSupportedOnDarwin

// MT5Quote holds a single forex/crypto quote returned by MT5.
// Defined here so callers can reference the type even before implementation.
type MT5Quote struct {
	Symbol string  `json:"symbol"`
	Bid    float64 `json:"bid"`
	Ask    float64 `json:"ask"`
	Last   float64 `json:"last"`
}

// MT5Client is the macOS stub client for the MT5 bridge service.
// Replace with real HTTP client in mt5_linux.go once the REST bridge is deployed.
type MT5Client struct{}

// NewMT5Client returns a stub MT5Client. The addr argument is accepted for
// API compatibility with the future Linux implementation.
func NewMT5Client(_ string) *MT5Client {
	return &MT5Client{}
}

// GetQuote always returns ErrMT5NotSupportedOnDarwin on macOS builds.
func (m *MT5Client) GetQuote(_ string) (MT5Quote, error) {
	return MT5Quote{}, ErrMT5NotSupportedOnDarwin
}

// GetOHLCV always returns ErrMT5NotSupportedOnDarwin on macOS builds.
func (m *MT5Client) GetOHLCV(_, _, _ string) ([]OHLCVRecord, error) {
	return nil, ErrMT5NotSupportedOnDarwin
}
