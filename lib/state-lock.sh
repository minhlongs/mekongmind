#!/usr/bin/env bash
# state-lock.sh — Atomic state writes via flock
# Usage: source this file, then use flock_write <filepath> <content>
set -euo pipefail

flock_write() {
  local filepath="${1:?Usage: flock_write <filepath> <content>}"
  local content="${2:-}"
  local lockfile="${filepath}.lock"

  mkdir -p "$(dirname "$lockfile")"

  exec 9>"$lockfile"
  if ! flock -w 5 9; then
    echo "ERROR: Could not acquire lock for $filepath (timeout 5s)" >&2
    return 1
  fi

  mkdir -p "$(dirname "$filepath")"
  printf '%s' "$content" > "$filepath"
  # Lock released when fd 9 closes on function return
}
