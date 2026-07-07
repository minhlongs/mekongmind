#!/bin/bash
# goal-curator.sh — Hermes curator.py pattern for MEKONG
# Trigger: idle (no active gate) + 7+ days since last cleanup
# Safety: dry-run first, never auto-delete

set -euo pipefail

REPO="/Users/macbook/Documents/me-deep-wrapper"
cd "$REPO" 2>/dev/null || exit 1

# Gate 1: Has active goal? If yes, skip (idle-triggered only)
HAS_ACTIVE=$(python3 -c "
import glob
for f in sorted(glob.glob('state/gates/goal-*.json')):
    try:
        d = __import__('json').load(open(f))
        if any(g.get('status') in ('active','running') for g in d.get('gates',[])):
            print('yes'); break
    except: pass
" 2>/dev/null)
[ "$HAS_ACTIVE" = "yes" ] && exit 0

# Gate 2: Interval check (7 days default)
BACKUP_DIR="state/stale-goals-backup"
mkdir -p "$BACKUP_DIR" 2>/dev/null || true
LAST_CLEANUP=$(stat -f "%m" "$BACKUP_DIR/.last_cleanup" 2>/dev/null || echo 0)
NOW=$(date +%s)
DAYS=$(( (NOW - LAST_CLEANUP) / 86400 ))
[ "$DAYS" -lt 7 ] && exit 0

# Mode: dry-run by default, real with --apply
DRY_RUN=true
[ "${1:-}" = "--apply" ] && DRY_RUN=false

# Scan and classify
python3 -c "
import glob, json, os, sys
from datetime import datetime, timedelta

repo = '$REPO'
stale_cutoff = datetime.now() - timedelta(days=30)
archive_cutoff = datetime.now() - timedelta(days=90)
backup_dir = os.path.join(repo, '$BACKUP_DIR')
os.makedirs(backup_dir, exist_ok=True)

archived = []
staled = []
kept = []

for jf in sorted(glob.glob(os.path.join(repo, 'state/gates/goal-*.json'))):
    try:
        d = json.load(open(jf))
    except:
        continue
    # Skip pinned goals
    if d.get('pinned'):
        kept.append(os.path.basename(jf))
        continue
    mtime = datetime.fromtimestamp(os.path.getmtime(jf))
    # Skip current goal files
    gid = d.get('goal_id','')
    if gid in ('goal-20260605-011704',):
        kept.append(os.path.basename(jf))
        continue
    if mtime < archive_cutoff:
        archived.append((os.path.basename(jf), mtime.date()))
    elif mtime < stale_cutoff:
        staled.append((os.path.basename(jf), mtime.date()))
    else:
        kept.append(os.path.basename(jf))

print('=== GOAL CURATOR REPORT ===')
print(f'Archived (>90d): {len(archived)}')
for name, dt in archived:
    print(f'  ARCHIVE: {name} (last: {dt})')
print(f'Stale (30-90d): {len(staled)}')
for name, dt in staled:
    print(f'  STALE: {name} (last: {dt})')
print(f'Active/Recent: {len(kept)}')
print()

if '--apply' in sys.argv and (archived or staled):
    import shutil
    for name, dt in archived:
        src = os.path.join(repo, 'state/gates', name)
        dst = os.path.join(backup_dir, name)
        if os.path.exists(src):
            shutil.move(src, dst)
            print(f'  MOVED: {name} -> stale-goals-backup/')
    for name, dt in staled:
        src = os.path.join(repo, 'state/gates', name)
        dst = os.path.join(backup_dir, name)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f'  COPIED: {name} -> stale-goals-backup/')
    # Touch cleanup marker
    open(os.path.join(backup_dir, '.last_cleanup'), 'w').close()
    print()
    print('Cleanup applied. Run without --apply to preview next time.')
" --apply "${1:-}"

exit 0
