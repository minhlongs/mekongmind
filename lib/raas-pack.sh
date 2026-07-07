#!/usr/bin/env bash
# raas-pack.sh — RaaS template packaging system for MEKONG Mind
# Part of me-deep-wrapper v1.0.0 (CEO Solo Company Orchestrator)
#
# Packages templates from mvp/public/templates/ into distributable tar.gz archives
# with embedded manifest and SHA-256 checksums.
#
# Usage:
#   raas-pack <template-slug>              Package a template
#   raas-pack list                         List all packed templates
#   raas-pack verify <pack-path>           Verify checksums integrity
set -uo pipefail

# ─── Resolve script directory and source dependencies ──────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source state-lock for atomic writes (flock_write)
source "$SCRIPT_DIR/state-lock.sh" 2>/dev/null || true

# Fallback flock_write on macOS (no flock command available)
# Uses fcntl-based advisory locking via a small python helper
_flock_write_available() {
  command -v flock >/dev/null 2>&1
}

if ! _flock_write_available; then
  flock_write() {
    local filepath="${1:?Usage: flock_write <filepath> <content>}"
    local content="${2:-}"
    mkdir -p "$(dirname "$filepath")"
    # Use fcntl advisory lock via python for atomic write on macOS
    python3 - "$filepath" "$content" <<'PY'
import fcntl, os, sys
path, content = sys.argv[1], sys.argv[2]
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
try:
    fcntl.flock(fd, fcntl.LOCK_EX)
    os.write(fd, content.encode())
    fcntl.flock(fd, fcntl.LOCK_UN)
except Exception:
    raise
finally:
    os.close(fd)
PY
  }
fi

# ─── Configuration ─────────────────────────────────────────────────────────────
TEMPLATES_DIR="$PROJECT_ROOT/mvp/public/templates"
PACKS_DIR="$PROJECT_ROOT/state/raas/packs"
MANIFEST_FILENAME="manifest.json"
REGISTRY_FILENAME="registry.json"

# ─── Helpers ───────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: raas-pack <command> [args]

Commands:
  raas-pack <template-slug>            Package a template into a distributable archive
  raas-pack list                       List all packed templates
  raas-pack verify <pack-path>         Verify checksums integrity of a pack

Options:
  -h, --help                           Show this help message

Templates sourced from: $TEMPLATES_DIR
Packs stored in:         $PACKS_DIR
EOF
}

log_info() {
  printf '[raas-pack] %s\n' "$*"
}

log_error() {
  printf '[raas-pack] ERROR: %s\n' "$*" >&2
}

log_warn() {
  printf '[raas-pack] WARN: %s\n' "$*" >&2
}

# Portable sed -i (handles both GNU and BSD/macOS sed)
portable_sed() {
  local pattern="$1"; shift
  local file="$1"
  if sed --version >/dev/null 2>&1; then
    sed -i "$pattern" "$file"
  else
    sed -i '' "$pattern" "$file"
  fi
}

# Compute SHA-256 of a file; prints hex digest
sha256_of_file() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file" | awk '{print $1}'
  else
    log_error "No SHA-256 utility found (sha256sum or shasum required)"
    return 1
  fi
}

# Resolve template slug to absolute directory path
resolve_template_dir() {
  local slug="$1"
  # Exact match
  if [ -d "$TEMPLATES_DIR/$slug" ]; then
    echo "$TEMPLATES_DIR/$slug"
    return 0
  fi
  # Try swapping hyphens/underscores
  local alt_slug
  alt_slug=$(printf '%s' "$slug" | tr '-' '_')
  if [ -d "$TEMPLATES_DIR/$alt_slug" ]; then
    echo "$TEMPLATES_DIR/$alt_slug"
    return 0
  fi
  alt_slug=$(printf '%s' "$slug" | tr '_' '-')
  if [ -d "$TEMPLATES_DIR/$alt_slug" ]; then
    echo "$TEMPLATES_DIR/$alt_slug"
    return 0
  fi
  return 1
}

# Get today's date stamp YYYYMMDD
today_stamp() {
  date +%Y%m%d
}

# ─── Core: Pack a template ─────────────────────────────────────────────────────
# Creates:
#   1. tar.gz archive at state/raas/packs/<slug>-<YYYYMMDD>.tar.gz
#   2. manifest JSON at state/raas/packs/<slug>-<YYYYMMDD>.manifest.json
#   3. Updates registry at state/raas/packs/registry.json
pack_template() {
  local slug="$1"

  # Validate slug: lowercase alphanumeric + hyphens
  if ! printf '%s' "$slug" | grep -qE '^[a-z0-9][a-z0-9-]*$'; then
    log_error "Invalid template slug '$slug'. Use lowercase letters, digits, and hyphens only."
    return 1
  fi

  # Resolve template directory
  local template_dir
  template_dir=$(resolve_template_dir "$slug") || {
    log_error "Template not found: '$slug' (searched in $TEMPLATES_DIR)"
    return 1
  }

  local template_name
  template_name=$(basename "$template_dir")

  # Ensure output directories exist
  mkdir -p "$PACKS_DIR"

  # Validate template not empty
  local file_count
  file_count=$(find "$template_dir" -type f | wc -l | tr -d ' ')
  if [ "$file_count" -eq 0 ]; then
    log_error "Template '$slug' is empty — no files in $template_dir"
    return 1
  fi

  local pack_date
  pack_date=$(today_stamp)
  local pack_basename="${slug}-${pack_date}"
  local pack_tar="${PACKS_DIR}/${pack_basename}.tar.gz"
  local pack_manifest="${PACKS_DIR}/${pack_basename}.manifest.json"
  local registry_path="${PACKS_DIR}/${REGISTRY_FILENAME}"

  # Warn on overwrite
  if [ -f "$pack_tar" ]; then
    log_warn "Pack already exists for today: $pack_tar (will overwrite)"
  fi

  log_info "Packing template: $slug ($template_dir)"
  log_info "Files found: $file_count"

  # ── Stage into temp dir so checksums reflect exact archive payload ──────────
  local staging_dir
  staging_dir=$(mktemp -d "${TMPDIR:-/tmp}/raas-pack-${slug}-XXXXXX")
  local staging_template="$staging_dir/template"
  mkdir -p "$staging_template"

  cp -R "$template_dir"/. "$staging_template/" 2>/dev/null || {
    tar -C "$template_dir" -cf - . | tar -C "$staging_template" -xf -
  }

  # ── Build file manifest with per-file SHA-256 ───────────────────────────────
  local manifest_files_json
  manifest_files_json=$(python3 - "$staging_template" <<'PY'
import json, hashlib, os, sys

tpl_dir = sys.argv[1]
files = []
for root, dirs, names in os.walk(tpl_dir):
    dirs.sort()
    for name in sorted(names):
        full = os.path.join(root, name)
        rel = os.path.relpath(full, tpl_dir)
        h = hashlib.sha256()
        with open(full, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                h.update(chunk)
        size = os.path.getsize(full)
        files.append({"path": rel, "sha256": h.hexdigest(), "bytes": size})

print(json.dumps(files, indent=2))
PY
  )

  local total_files total_bytes
  total_files=$(printf '%s' "$manifest_files_json" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
  total_bytes=$(printf '%s' "$manifest_files_json" | python3 -c "import json,sys; print(sum(f['bytes'] for f in json.load(sys.stdin)))")

  # ── Build full manifest JSON ────────────────────────────────────────────────
  local pack_timestamp
  pack_timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  local manifest_json
  manifest_json=$(python3 - "$manifest_files_json" "$slug" "$template_name" "$pack_date" "$pack_timestamp" "$(basename "$pack_tar")" <<'PY'
import json, sys
from datetime import datetime, timezone

files = json.loads(sys.argv[1])
slug, name, pack_date, packed_at, archive_file = sys.argv[2:7]
total_bytes = sum(f["bytes"] for f in files)

manifest = {
    "template": {
        "slug": slug,
        "name": name,
        "version": "1.0.0",
        "packed_at": packed_at,
        "pack_date": pack_date,
    },
    "archive": {
        "filename": archive_file,
        "format": "tar.gz",
        "total_files": len(files),
        "total_bytes": total_bytes,
    },
    "files": files,
}
print(json.dumps(manifest, indent=2, sort_keys=True))
PY
  )

  # ── Write manifest atomically via flock_write ───────────────────────────────
  if ! flock_write "$pack_manifest" "$manifest_json"; then
    log_error "Failed to acquire lock for manifest: $pack_manifest"
    rm -rf "$staging_dir"
    return 1
  fi

  # ── Create tar.gz archive from staged content ───────────────────────────────
  tar -czf "$pack_tar" -C "$staging_dir" template

  local archive_size
  archive_size=$(stat -f%z "$pack_tar" 2>/dev/null || stat -c%s "$pack_tar" 2>/dev/null || echo 0)

  log_info "Archive created: $pack_tar ($archive_size bytes)"

  # ── Compute top-level archive checksum ─────────────────────────────────────
  local archive_checksum
  archive_checksum=$(sha256_of_file "$pack_tar")

  # ── Update registry atomically ─────────────────────────────────────────────
  local registry_json
  registry_json=$(python3 - "$registry_path" "$slug" "$pack_date" "$(basename "$pack_tar")" "$archive_size" "$archive_checksum" "$total_files" "$(basename "$pack_manifest")" <<'PY'
import json, sys, os
from datetime import datetime, timezone

reg_path = sys.argv[1]
slug, pack_date, archive_file = sys.argv[2:5]
archive_bytes = int(sys.argv[5])
archive_sha = sys.argv[6]
file_count = int(sys.argv[7])
manifest_file = sys.argv[8]
now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

entry = {
    "slug": slug,
    "pack_date": pack_date,
    "archive": archive_file,
    "archive_bytes": archive_bytes,
    "archive_sha256": archive_sha,
    "manifest": manifest_file,
    "total_files": file_count,
    "packed_at": now,
}

if os.path.exists(reg_path):
    try:
        with open(reg_path) as f:
            data = json.load(f)
    except Exception:
        data = {"packs": []}
else:
    data = {"packs": []}

# Idempotent: remove same slug+date entry before appending
data["packs"] = [p for p in data.get("packs", [])
                 if not (p.get("slug") == slug and p.get("pack_date") == pack_date)]
data["packs"].append(entry)
data["updated_at"] = now

print(json.dumps(data, indent=2, sort_keys=True))
PY
  )

  if ! flock_write "$registry_path" "$registry_json"; then
    log_error "Failed to acquire lock for registry: $registry_path"
    rm -rf "$staging_dir"
    return 1
  fi

  # ── Cleanup staging ────────────────────────────────────────────────────────
  rm -rf "$staging_dir"

  # ── Summary ────────────────────────────────────────────────────────────────
  cat <<EOF
[raas-pack] Pack complete
  Template:  $slug ($template_name)
  Archive:   $pack_tar
  Manifest:  $pack_manifest
  Registry:  $registry_path
  Files:     $total_files
  Size:      $archive_size bytes
  Date:      $pack_date
EOF

  return 0
}

# ─── Core: List packed templates ──────────────────────────────────────────────
list_packs() {
  local registry_path="${PACKS_DIR}/${REGISTRY_FILENAME}"

  if [ ! -f "$registry_path" ]; then
    log_info "No packs found. Registry does not exist: $registry_path"
    return 0
  fi

  local pack_count
  pack_count=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(len(d.get('packs',[])))" "$registry_path")

  if [ "$pack_count" -eq 0 ]; then
    log_info "No packs registered yet."
    return 0
  fi

  log_info "Registered packs ($pack_count):"
  printf "%-20s %-12s %-10s %-12s %s\n" "SLUG" "DATE" "FILES" "SIZE" "ARCHIVE"
  printf "%-20s %-12s %-10s %-12s %s\n" "----" "----" "-----" "----" "-------"

  python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
for p in sorted(data.get('packs', []), key=lambda x: (x.get('slug',''), x.get('pack_date',''))):
    size_kb = p.get('archive_bytes', 0) / 1024
    size_str = f'{size_kb:.1f}KB' if size_kb < 1024 else f'{size_kb/1024:.1f}MB'
    print(f\"{p.get('slug',''):<20} {p.get('pack_date',''):<12} {str(p.get('total_files',0)):<10} {size_str:<12} {p.get('archive','')}\")
" "$registry_path"

  return 0
}

# ─── Core: Verify pack integrity ──────────────────────────────────────────────
verify_pack() {
  local pack_path="$1"

  if [ ! -f "$pack_path" ]; then
    log_error "Pack file not found: $pack_path"
    return 1
  fi

  # Locate manifest alongside the pack
  local pack_dir pack_basename manifest_path
  pack_dir=$(dirname "$pack_path")
  pack_basename=$(basename "$pack_path")
  local base_no_ext="${pack_basename%.tar.gz}"
  manifest_path="${pack_dir}/${base_no_ext}.manifest.json"

  if [ ! -f "$manifest_path" ]; then
    log_error "Manifest not found: $manifest_path"
    log_error "Cannot verify pack without its manifest."
    return 1
  fi

  log_info "Verifying: $pack_path"

  # Extract to temp dir
  local extract_dir
  extract_dir=$(mktemp -d "${TMPDIR:-/tmp}/raas-verify-XXXXXX")

  tar -xzf "$pack_path" -C "$extract_dir"

  # Locate template root inside extracted archive
  local template_root
  template_root=$(find "$extract_dir" -maxdepth 2 -type d -name "template" 2>/dev/null | head -1)
  [ -z "$template_root" ] && template_root="$extract_dir"

  # Run verification via python — prints failures + __STATUS__ line
  local verify_output
  verify_output=$(python3 - "$manifest_path" "$template_root" <<'PY'
import json, hashlib, os, subprocess, sys

manifest_path = sys.argv[1]
template_root = sys.argv[2]

with open(manifest_path) as f:
    manifest = json.load(f)

expected = {e["path"]: e for e in manifest.get("files", [])}
found = {}
errors = []

for root, dirs, names in os.walk(template_root):
    dirs.sort()
    for name in sorted(names):
        full = os.path.join(root, name)
        rel = os.path.relpath(full, template_root)
        h = hashlib.sha256()
        with open(full, 'rb') as fh:
            for chunk in iter(lambda: fh.read(65536), b''):
                h.update(chunk)
        found[rel] = {"sha256": h.hexdigest(), "bytes": os.path.getsize(full)}

verified = 0
failed = 0
missing = 0

for path, exp in sorted(expected.items()):
    actual = found.get(path)
    if actual is None:
        missing += 1
        errors.append(f"MISS  {path} (expected {exp['bytes']} bytes)")
        continue
    if actual["bytes"] != exp["bytes"]:
        failed += 1
        errors.append(f"SIZE  {path} (expected {exp['bytes']}, got {actual['bytes']})")
        continue
    if actual["sha256"] != exp["sha256"]:
        failed += 1
        short_exp = exp["sha256"][:16]
        short_act = actual["sha256"][:16]
        errors.append(f"BAD   {path} (expected {short_exp}..., got {short_act}...)")
        continue
    verified += 1

for e in errors:
    print(e)
print(f"__STATUS__ verified={verified} failed={failed} missing={missing} total={len(expected)}")
PY
  )

  # Parse status line and print output
  local status_line=""
  while IFS= read -r line; do
    if [[ "$line" == __STATUS__* ]]; then
      status_line="$line"
    else
      echo "$line"
    fi
  done <<< "$verify_output"

  local verified_count failed_count missing_count total_count
  verified_count=$(printf '%s' "$status_line" | sed -n 's/.*verified=\([0-9]*\).*/\1/p')
  failed_count=$(printf '%s' "$status_line" | sed -n 's/.*failed=\([0-9]*\).*/\1/p')
  missing_count=$(printf '%s' "$status_line" | sed -n 's/.*missing=\([0-9]*\).*/\1/p')
  total_count=$(printf '%s' "$status_line" | sed -n 's/.*total=\([0-9]*\).*/\1/p')

  # Defaults if grep fails
  verified_count=${verified_count:-0}
  failed_count=${failed_count:-0}
  missing_count=${missing_count:-0}
  total_count=${total_count:-0}

  echo ""
  echo "[raas-pack] Verification results:"
  echo "  Total files:    $total_count"
  echo "  Verified OK:    $verified_count"
  echo "  Missing:        $missing_count"
  echo "  Checksum fail:  $failed_count"

  # Cleanup
  rm -rf "$extract_dir"

  if [ "$failed_count" -eq 0 ] && [ "$missing_count" -eq 0 ]; then
    echo ""
    echo "[raas-pack] OK — all $verified_count files verified"
    return 0
  else
    echo ""
    echo "[raas-pack] FAILED — integrity check did not pass"
    return 1
  fi
}

# ─── Main dispatch ─────────────────────────────────────────────────────────────
main() {
  if [ $# -eq 0 ]; then
    usage
    return 1
  fi

  local command="$1"
  shift

  case "$command" in
    -h|--help|help)
      usage
      return 0
      ;;
    list)
      list_packs "$@"
      ;;
    verify)
      if [ $# -lt 1 ]; then
        log_error "verify requires a pack path. Usage: raas-pack verify <pack-path>"
        return 1
      fi
      verify_pack "$1"
      ;;
    *)
      # Default: treat as template slug to pack
      pack_template "$command"
      ;;
  esac
}

main "$@"
