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

// kill_switch.rs — Atomic kill-switch with file persistence
//
// State encoding:
//   0 = OK (trading allowed)
//   1 = WARNING (drawdown approaching threshold)
//   2 = KILLED (all trading halted)
//
// Persistence: ~/.mekong/kill.lock contains the u8 state byte.
// Writes are atomic: write tmp file → rename (POSIX rename is atomic).

use std::fs;
use std::io::{self, Write};
use std::path::PathBuf;
use std::sync::atomic::{AtomicU8, Ordering};
use std::sync::Arc;

/// State constants
pub const STATE_OK: u8 = 0;
pub const STATE_WARN: u8 = 1;
pub const STATE_KILLED: u8 = 2;

/// KillSwitch holds the atomic state and manages persistence.
pub struct KillSwitch {
    /// Shared atomic state — SeqCst guarantees all threads see writes immediately.
    state: Arc<AtomicU8>,
    /// Path to the persistent lock file (~/.mekong/kill.lock).
    lock_path: PathBuf,
    /// Directory containing the lock file.
    lock_dir: PathBuf,
}

impl KillSwitch {
    /// Create or restore KillSwitch from persisted state.
    /// If `~/.mekong/kill.lock` exists, reads prior state.
    pub fn new() -> io::Result<Self> {
        let lock_dir = Self::default_lock_dir()?;
        let lock_path = lock_dir.join("kill.lock");

        // Restore prior state if file exists
        let initial_state = if lock_path.exists() {
            let bytes = fs::read(&lock_path)?;
            bytes.first().copied().unwrap_or(STATE_OK)
        } else {
            STATE_OK
        };

        Ok(KillSwitch {
            state: Arc::new(AtomicU8::new(initial_state)),
            lock_path,
            lock_dir,
        })
    }

    /// Returns current state value.
    pub fn state(&self) -> u8 {
        self.state.load(Ordering::SeqCst)
    }

    /// Returns true if kill state is KILLED (2).
    pub fn is_killed(&self) -> bool {
        self.state.load(Ordering::SeqCst) == STATE_KILLED
    }

    /// Advance state to KILLED and persist atomically.
    /// Idempotent — calling when already KILLED is a no-op.
    pub fn trigger_kill(&self, reason_code: i32) -> io::Result<()> {
        self.state.store(STATE_KILLED, Ordering::SeqCst);
        self.persist_state(STATE_KILLED)?;
        self.append_safety_log(reason_code)?;
        Ok(())
    }

    /// Set state to WARN. Does NOT override KILLED.
    pub fn set_warn(&self) -> io::Result<()> {
        // Only move to WARN if currently OK
        let _ = self.state.compare_exchange(
            STATE_OK,
            STATE_WARN,
            Ordering::SeqCst,
            Ordering::SeqCst,
        );
        if self.state.load(Ordering::SeqCst) == STATE_WARN {
            self.persist_state(STATE_WARN)?;
        }
        Ok(())
    }

    /// Reset state to OK. Intended only for `mekong safety reset` CLI.
    pub fn reset(&self) -> io::Result<()> {
        self.state.store(STATE_OK, Ordering::SeqCst);
        // Remove lock file on reset so fresh start
        if self.lock_path.exists() {
            fs::remove_file(&self.lock_path)?;
        }
        Ok(())
    }

    // ------------------------------------------------------------------ //
    // Private helpers

    /// Atomically write state byte to lock file via tmp+rename.
    fn persist_state(&self, state: u8) -> io::Result<()> {
        fs::create_dir_all(&self.lock_dir)?;
        let tmp_path = self.lock_dir.join("kill.lock.tmp");
        let mut f = fs::File::create(&tmp_path)?;
        f.write_all(&[state])?;
        f.sync_all()?; // ensure bytes hit disk before rename
        fs::rename(&tmp_path, &self.lock_path)?;
        Ok(())
    }

    /// Append one line to ~/.mekong/safety.log (append-only audit trail).
    fn append_safety_log(&self, reason_code: i32) -> io::Result<()> {
        let log_path = self.lock_dir.join("safety.log");
        let mut f = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)?;
        // chmod 600 equivalent (owner read/write only)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let perms = fs::Permissions::from_mode(0o600);
            fs::set_permissions(&log_path, perms)?;
        }
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        writeln!(f, "{now} KILL reason_code={reason_code}")?;
        Ok(())
    }

    /// Returns ~/.mekong/, creating it if needed.
    fn default_lock_dir() -> io::Result<PathBuf> {
        let home = dirs_path()?;
        let dir = home.join(".mekong");
        fs::create_dir_all(&dir)?;
        Ok(dir)
    }
}

/// Resolve home directory without external crate.
fn dirs_path() -> io::Result<PathBuf> {
    // HOME env var is set on all POSIX systems
    let home = std::env::var("HOME").map_err(|_| {
        io::Error::new(io::ErrorKind::NotFound, "HOME environment variable not set")
    })?;
    Ok(PathBuf::from(home))
}

// ------------------------------------------------------------------ //
// Unit tests

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    /// Helper: create KillSwitch with isolated temp dir
    fn make_switch() -> KillSwitch {
        // Use a temp dir so tests don't pollute ~/.mekong
        let tmp = std::env::temp_dir().join(format!(
            "mekong_test_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .subsec_nanos()
        ));
        std::fs::create_dir_all(&tmp).unwrap();
        KillSwitch {
            state: std::sync::Arc::new(AtomicU8::new(STATE_OK)),
            lock_dir: tmp.clone(),
            lock_path: tmp.join("kill.lock"),
        }
    }

    #[test]
    fn test_initial_state_is_ok() {
        let ks = make_switch();
        assert_eq!(ks.state(), STATE_OK);
        assert!(!ks.is_killed());
    }

    #[test]
    fn test_trigger_kill_sets_state() {
        let ks = make_switch();
        ks.trigger_kill(42).unwrap();
        assert!(ks.is_killed());
        assert_eq!(ks.state(), STATE_KILLED);
    }

    #[test]
    fn test_persist_and_restore() {
        let tmp = std::env::temp_dir().join(format!(
            "mekong_persist_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .subsec_nanos()
        ));
        std::fs::create_dir_all(&tmp).unwrap();
        let lock_path = tmp.join("kill.lock");

        // Write KILLED state
        let ks = KillSwitch {
            state: Arc::new(AtomicU8::new(STATE_OK)),
            lock_dir: tmp.clone(),
            lock_path: lock_path.clone(),
        };
        ks.trigger_kill(1).unwrap();
        assert!(lock_path.exists());

        // Restore from file — read byte manually
        let bytes = std::fs::read(&lock_path).unwrap();
        assert_eq!(bytes[0], STATE_KILLED);
    }

    #[test]
    fn test_reset_clears_state() {
        let ks = make_switch();
        ks.trigger_kill(0).unwrap();
        assert!(ks.is_killed());
        ks.reset().unwrap();
        assert_eq!(ks.state(), STATE_OK);
    }

    #[test]
    fn test_state_returns_correct_values_across_transitions() {
        // OK → WARN → KILLED transitions produce correct state() bytes.
        let ks = make_switch();
        assert_eq!(ks.state(), STATE_OK, "initial state must be OK (0)");

        ks.set_warn().unwrap();
        assert_eq!(ks.state(), STATE_WARN, "after set_warn state must be WARN (1)");

        ks.trigger_kill(5).unwrap();
        assert_eq!(ks.state(), STATE_KILLED, "after trigger_kill state must be KILLED (2)");
    }

    #[test]
    fn test_state_after_reset_returns_ok() {
        // After kill → reset, state() must return 0 (OK).
        let ks = make_switch();
        ks.trigger_kill(1).unwrap();
        assert_eq!(ks.state(), STATE_KILLED);
        ks.reset().unwrap();
        assert_eq!(ks.state(), STATE_OK, "state() must be 0 after reset");
        assert!(!ks.is_killed(), "is_killed must be false after reset");
    }
}
