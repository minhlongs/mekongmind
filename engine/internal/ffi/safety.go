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

// Package ffi provides Go bindings for the mekong_safety Rust cdylib.
//
// Build requirements:
//   1. Run `./rust_safety/build.sh` first to produce the dylib.
//   2. The dylib must be present at internal/ffi/lib/libmekong_safety.dylib.
//   3. LC_RPATH entries are baked into the binary at link time via -extldflags in go build
//      (see Makefile `build` target and CI workflow). Three search paths are embedded:
//      - @executable_path/../lib  →  binary at /usr/local/bin/mekong finds dylib at /usr/local/lib/
//      - @executable_path/lib     →  portable bundle mode (binary + adjacent lib/ dir)
//      - /usr/local/lib           →  fallback absolute path
//      No manual install_name_tool or DYLD_LIBRARY_PATH needed after install.
//      Note: Go 1.21+ blocks @executable_path in #cgo LDFLAGS (security policy),
//      so rpath is injected via -extldflags at the go build command level.
//
// Usage:
//
//	g, err := ffi.NewGuard()
//	if err != nil {
//	    log.Fatal(err)
//	}
//	defer g.Close()
//
//	g.RecordEquity("AAPL", 100000)  // 1000.00 in cents
//	dd, ok := g.CheckDrawdown("AAPL")
//	if !ok {
//	    log.Println("kill-switch active")
//	}

package ffi

/*
#cgo CFLAGS: -I${SRCDIR}/../../rust_safety/include
#cgo LDFLAGS: -L${SRCDIR}/lib -lmekong_safety
#include "mekong_safety.h"
#include <stdlib.h>
*/
import "C"

import (
	"errors"
	"fmt"
	"unsafe"
)

// FFI error codes mirroring Rust constants.
const (
	msfOK             = C.int(0)
	msfErrNullPtr     = C.int(-1)
	msfErrInit        = C.int(-2)
	msfErrInvalidStr  = C.int(-3)
	msfErrInternal    = C.int(-4)
	msfErrPanic       = C.int(-99)
)

// ErrKilled is returned by Guard methods when the kill-switch is active.
var ErrKilled = errors.New("mekong safety: kill-switch is active")

// Guard wraps the opaque Rust Guard pointer.
// Guard is NOT safe for concurrent use from multiple goroutines — the Rust
// side uses a Mutex internally, but the Go wrapper does not add its own lock.
// Use a single goroutine or add external synchronisation.
type Guard struct {
	ptr *C.Guard
}

// NewGuard initialises the safety library and returns a Guard.
// Restores prior kill-switch state from ~/.mekong/kill.lock if present.
// Caller MUST call g.Close() when done to prevent memory leaks.
func NewGuard() (*Guard, error) {
	ptr := C.msf_init()
	if ptr == nil {
		return nil, fmt.Errorf("mekong safety: msf_init returned null (init failed)")
	}
	return &Guard{ptr: ptr}, nil
}

// Close deallocates the Rust Guard. Safe to call multiple times (idempotent
// after first call — subsequent calls are no-ops because ptr is zeroed).
func (g *Guard) Close() {
	if g.ptr != nil {
		C.msf_free(g.ptr)
		g.ptr = nil
	}
}

// RecordEquity records an equity data point for the given trading symbol.
// equity is in cents (integer). The Rust side evaluates drawdown and may
// escalate the kill-switch to WARN or KILLED automatically.
//
// Returns an error if the FFI call fails.
func (g *Guard) RecordEquity(symbol string, equityCents int64) error {
	if g.ptr == nil {
		return errors.New("mekong safety: Guard is closed")
	}
	cSym := C.CString(symbol)
	defer C.free(unsafe.Pointer(cSym))

	rc := C.msf_record_equity(g.ptr, cSym, C.int64_t(equityCents))
	return codeToError(rc)
}

// CheckDrawdown returns the current drawdown percentage for the given symbol
// and a boolean indicating whether trading is allowed (false = kill-switch active).
//
// Returns (drawdownPct, isOK, error). On FFI error, drawdownPct is 0 and isOK is false.
func (g *Guard) CheckDrawdown(symbol string) (float32, bool, error) {
	if g.ptr == nil {
		return 0, false, errors.New("mekong safety: Guard is closed")
	}
	cSym := C.CString(symbol)
	defer C.free(unsafe.Pointer(cSym))

	var outDD C.float
	var outOK C.int32_t

	rc := C.msf_check_drawdown(g.ptr, cSym, &outDD, &outOK)
	if err := codeToError(rc); err != nil {
		return 0, false, err
	}
	return float32(outDD), outOK == 1, nil
}

// TriggerKill forces the kill-switch to KILLED state with the given reason code.
// The state is persisted to ~/.mekong/kill.lock.
// Only `mekong safety reset` (with --confirm) can clear it.
func (g *Guard) TriggerKill(reasonCode int) error {
	if g.ptr == nil {
		return errors.New("mekong safety: Guard is closed")
	}
	rc := C.msf_trigger_kill(g.ptr, C.int32_t(reasonCode))
	return codeToError(rc)
}

// IsKilled returns true if the kill-switch is in KILLED state.
// This is the fast-path check — LLM client and agent pipeline call this before
// every operation.
func (g *Guard) IsKilled() bool {
	if g.ptr == nil {
		// Treat closed Guard as killed (safe default)
		return true
	}
	rc := C.msf_is_killed(g.ptr)
	return rc == 1
}

// State returns the raw kill-switch state byte.
// 0=OK, 1=WARN, 2=KILLED, 255=invalid (closed or null handle).
func (g *Guard) State() uint8 {
	if g.ptr == nil {
		return 255
	}
	return uint8(C.msf_get_state(g.ptr))
}

// StateString converts the raw state byte to a human-readable label.
func (g *Guard) StateString() string {
	switch g.State() {
	case 0:
		return "OK"
	case 1:
		return "WARN"
	case 2:
		return "KILLED"
	default:
		return "UNKNOWN"
	}
}

// Reset resets the kill-switch to OK, removing ~/.mekong/kill.lock.
// This must only be called from `mekong safety reset` — requires explicit user intent.
// Returns an error if the FFI call fails (e.g. IO error removing lock file).
func (g *Guard) Reset() error {
	if g.ptr == nil {
		return errors.New("mekong safety: Guard is closed")
	}
	rc := C.msf_reset(g.ptr)
	return codeToError(rc)
}

// ------------------------------------------------------------------ //
// Private helpers

// codeToError converts an MSF return code to a Go error.
// MSF_OK (0) → nil.
func codeToError(rc C.int) error {
	switch rc {
	case msfOK:
		return nil
	case msfErrNullPtr:
		return errors.New("mekong safety: null pointer passed to FFI")
	case msfErrInit:
		return errors.New("mekong safety: initialisation failure")
	case msfErrInvalidStr:
		return errors.New("mekong safety: invalid UTF-8 symbol string")
	case msfErrInternal:
		return errors.New("mekong safety: internal error (mutex poisoned or IO failure)")
	case msfErrPanic:
		return errors.New("mekong safety: Rust panic caught at FFI boundary")
	default:
		return fmt.Errorf("mekong safety: unknown error code %d", int(rc))
	}
}
