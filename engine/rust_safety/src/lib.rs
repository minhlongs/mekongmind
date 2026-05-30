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

// lib.rs — FFI boundary for mekong_safety cdylib
//
// Exports 8 C-callable functions used by Go cgo:
//   msf_init            → allocate Guard, return opaque ptr
//   msf_record_equity   → record equity point for symbol
//   msf_check_drawdown  → get current drawdown pct + ok flag
//   msf_trigger_kill    → force kill-switch to KILLED
//   msf_is_killed       → query kill-switch state
//   msf_get_state       → query raw state byte (0=OK,1=WARN,2=KILLED,255=invalid)
//   msf_reset           → reset kill-switch to OK, remove lock file
//   msf_free            → deallocate Guard
//
// FFI error model:
//   All functions return i32: 0 = OK, negative = error code.
//   Out-parameters carry results (e.g. *mut f32 for drawdown_pct).
//
// SAFETY: Every extern "C" fn wraps its body in std::panic::catch_unwind.
// Panics across FFI boundary are undefined behaviour — we convert them to
// error return codes instead.

pub mod drawdown;
pub mod guard;
pub mod kill_switch;

use std::ffi::CStr;
use std::os::raw::{c_char, c_int};
use std::panic;

use guard::Guard;

// ------------------------------------------------------------------ //
// Error codes returned by all FFI functions

/// Success.
pub const MSF_OK: c_int = 0;
/// Null pointer passed where non-null required.
pub const MSF_ERR_NULL_PTR: c_int = -1;
/// Allocation or initialization failure.
pub const MSF_ERR_INIT: c_int = -2;
/// Invalid UTF-8 in symbol string.
pub const MSF_ERR_INVALID_STR: c_int = -3;
/// Internal logic error (mutex poisoned, IO failure, etc.).
pub const MSF_ERR_INTERNAL: c_int = -4;
/// Panic caught at FFI boundary.
pub const MSF_ERR_PANIC: c_int = -99;

// ------------------------------------------------------------------ //
// FFI exports

/// Allocate and initialize a new Guard object.
///
/// Returns an opaque pointer to the Guard, or NULL on failure.
/// The caller MUST pass this pointer to `msf_free` exactly once when done.
///
/// # Safety
/// The returned pointer is valid until `msf_free` is called.
/// Do NOT free it with any other allocator (e.g. C free()).
#[no_mangle]
pub unsafe extern "C" fn msf_init() -> *mut Guard {
    let result = panic::catch_unwind(|| {
        match Guard::new() {
            Ok(g) => Box::into_raw(Box::new(g)),
            Err(_) => std::ptr::null_mut(),
        }
    });
    // SAFETY: catch_unwind returns Err if a panic occurred
    result.unwrap_or(std::ptr::null_mut())
}

/// Record an equity value for the given symbol.
///
/// # Arguments
/// - `guard`       — pointer returned by `msf_init`
/// - `symbol`      — null-terminated C string identifying the trading symbol
/// - `equity_cents`— equity value in cents (i64, integer units)
///
/// # Returns
/// `MSF_OK` (0) on success, negative error code on failure.
///
/// # Safety
/// `guard` must be a valid, non-null pointer from `msf_init`.
/// `symbol` must be a valid null-terminated C string.
#[no_mangle]
pub unsafe extern "C" fn msf_record_equity(
    guard: *mut Guard,
    symbol: *const c_char,
    equity_cents: i64,
) -> c_int {
    // SAFETY: wrapping entire body in catch_unwind to prevent panic UB
    let result = panic::catch_unwind(|| {
        if guard.is_null() {
            return MSF_ERR_NULL_PTR;
        }
        if symbol.is_null() {
            return MSF_ERR_NULL_PTR;
        }
        // SAFETY: symbol is checked non-null; caller guarantees valid C string
        let sym_str = match CStr::from_ptr(symbol).to_str() {
            Ok(s) => s,
            Err(_) => return MSF_ERR_INVALID_STR,
        };
        // SAFETY: guard is a valid Box<Guard> pointer owned by caller
        let g = &*guard;
        match g.record_equity(sym_str, equity_cents) {
            Ok(_) => MSF_OK,
            Err(_) => MSF_ERR_INTERNAL,
        }
    });
    result.unwrap_or(MSF_ERR_PANIC)
}

/// Query current drawdown percentage and OK status for a symbol.
///
/// # Arguments
/// - `guard`          — pointer from `msf_init`
/// - `symbol`         — null-terminated C string
/// - `out_drawdown`   — out-parameter: receives current drawdown % (f32)
/// - `out_is_ok`      — out-parameter: receives 1 if trading is OK, 0 if killed
///
/// # Returns
/// `MSF_OK` on success, negative error code on failure.
/// On error, `out_drawdown` and `out_is_ok` are left unchanged.
///
/// # Safety
/// `guard` must be valid. `out_drawdown` and `out_is_ok` must be valid non-null pointers.
#[no_mangle]
pub unsafe extern "C" fn msf_check_drawdown(
    guard: *const Guard,
    symbol: *const c_char,
    out_drawdown: *mut f32,
    out_is_ok: *mut c_int,
) -> c_int {
    let result = panic::catch_unwind(|| {
        if guard.is_null() || symbol.is_null() || out_drawdown.is_null() || out_is_ok.is_null() {
            return MSF_ERR_NULL_PTR;
        }
        // SAFETY: symbol checked non-null
        let sym_str = match CStr::from_ptr(symbol).to_str() {
            Ok(s) => s,
            Err(_) => return MSF_ERR_INVALID_STR,
        };
        // SAFETY: guard is valid Box<Guard> pointer
        let g = &*guard;
        match g.check_drawdown(sym_str) {
            Ok((dd_pct, is_ok)) => {
                // SAFETY: out pointers checked non-null above
                *out_drawdown = dd_pct as f32;
                *out_is_ok = if is_ok { 1 } else { 0 };
                MSF_OK
            }
            Err(_) => MSF_ERR_INTERNAL,
        }
    });
    result.unwrap_or(MSF_ERR_PANIC)
}

/// Trigger the kill-switch immediately with a reason code.
///
/// After this call, `msf_is_killed` will return 1 and state is persisted
/// to `~/.mekong/kill.lock`. Only `mekong safety reset` can clear it.
///
/// # Arguments
/// - `guard`       — pointer from `msf_init`
/// - `reason_code` — integer reason code logged to safety.log
///
/// # Returns
/// `MSF_OK` on success, negative on error.
///
/// # Safety
/// `guard` must be a valid non-null pointer from `msf_init`.
#[no_mangle]
pub unsafe extern "C" fn msf_trigger_kill(guard: *mut Guard, reason_code: c_int) -> c_int {
    let result = panic::catch_unwind(|| {
        if guard.is_null() {
            return MSF_ERR_NULL_PTR;
        }
        // SAFETY: guard is valid
        let g = &*guard;
        match g.trigger_kill(reason_code) {
            Ok(()) => MSF_OK,
            Err(_) => MSF_ERR_INTERNAL,
        }
    });
    result.unwrap_or(MSF_ERR_PANIC)
}

/// Query whether the kill-switch is in KILLED state.
///
/// # Arguments
/// - `guard` — pointer from `msf_init`
///
/// # Returns
/// 1 if killed, 0 if OK/WARN, MSF_ERR_NULL_PTR if guard is null.
///
/// # Safety
/// `guard` must be a valid non-null pointer from `msf_init`.
#[no_mangle]
pub unsafe extern "C" fn msf_is_killed(guard: *const Guard) -> c_int {
    let result = panic::catch_unwind(|| {
        if guard.is_null() {
            return MSF_ERR_NULL_PTR;
        }
        // SAFETY: guard is valid
        let g = &*guard;
        if g.is_killed() { 1 } else { 0 }
    });
    result.unwrap_or(MSF_ERR_PANIC)
}

/// Query the raw kill-switch state byte.
///
/// # Arguments
/// - `handle` — const pointer to Guard (does not mutate state)
///
/// # Returns
/// - 0 = OK
/// - 1 = WARN
/// - 2 = KILLED
/// - 255 = null/invalid handle sentinel
///
/// # Safety
/// `handle` must be a valid non-null pointer from `msf_init`, or null.
#[no_mangle]
pub unsafe extern "C" fn msf_get_state(handle: *const Guard) -> u8 {
    let result = panic::catch_unwind(|| {
        if handle.is_null() {
            return 255u8; // invalid handle sentinel
        }
        // SAFETY: handle is valid, non-null, points to Guard on heap
        let guard = &*handle;
        guard.kill_switch.state()
    });
    result.unwrap_or(255u8)
}

/// Reset the kill-switch to OK state, removing ~/.mekong/kill.lock.
/// Intended only for `mekong safety reset` CLI — requires explicit user intent.
///
/// # Arguments
/// - `guard` — pointer from `msf_init`
///
/// # Returns
/// `MSF_OK` on success, negative error code on failure.
///
/// # Safety
/// `guard` must be a valid non-null pointer from `msf_init`.
#[no_mangle]
pub unsafe extern "C" fn msf_reset(guard: *mut Guard) -> c_int {
    let result = panic::catch_unwind(|| {
        if guard.is_null() {
            return MSF_ERR_NULL_PTR;
        }
        // SAFETY: guard is valid
        let g = &*guard;
        match g.kill_switch.reset() {
            Ok(()) => MSF_OK,
            Err(_) => MSF_ERR_INTERNAL,
        }
    });
    result.unwrap_or(MSF_ERR_PANIC)
}

/// Deallocate the Guard created by `msf_init`.
///
/// After this call the pointer is invalid. Calling any other function
/// with this pointer is undefined behaviour.
///
/// # Safety
/// `guard` must be a valid non-null pointer previously returned by `msf_init`
/// and NOT yet freed. Calling twice is double-free UB.
#[no_mangle]
pub unsafe extern "C" fn msf_free(guard: *mut Guard) {
    // Deliberately do NOT catch_unwind here — drop should not panic.
    // If it does, abort is the right behaviour (panic=abort in release profile).
    if !guard.is_null() {
        // SAFETY: guard was created by Box::into_raw in msf_init
        drop(Box::from_raw(guard));
    }
}
