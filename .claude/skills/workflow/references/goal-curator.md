# Goal Curator SOP — Tự bảo trì state/goals/

> **Pattern source:** Hermes Agent `curator.py` (1843 lines)
> **Trigger:** Idle — no active gate + last cleanup > 7 days
> **Safety:** Dry-run first, never auto-delete, backup before archive

## Rules (từ Hermes curator.py)

1. **Idle-triggered only** — Không cron, chỉ chạy khi agent không có gate active
2. **Auto-transition lifecycle:**
   - `active` → `stale` sau 30 ngày không touch
   - `stale` → `archived` sau 90 ngày
3. **Never auto-delete** — Chỉ move vào `state/stale-goals-backup/`
4. **Pinned goals bypass** — Goals có `pinned: true` không bao giờ archive
5. **Dry-run preview** — Luôn show plan trước khi mutate
6. **Recoverable** — Archive có thể restore về active

## Implementation

```bash
#!/bin/bash
# .claude/hooks/goal-curator.sh
# Auto-trigger: no active gate + 7+ days since last cleanup

REPO="/Users/macbook/Documents/me-deep-wrapper"
cd "$REPO"

# Gate 1: No active goal?
ACTIVE=$(python3 -c "
import glob,json
for f in sorted(glob.glob('state/gates/goal-*.json')):
    d=json.load(open(f))
    if any(g.get('status')=='active' for g in d.get('gates',[])):
        print('yes'); break
" 2>/dev/null)
[ "$ACTIVE" = "yes" ] && exit 0

# Gate 2: Interval check (7 days = Hermes default)
LAST_CLEANUP=$(stat -f "%m" state/stale-goals-backup/.last_cleanup 2>/dev/null || echo 0)
NOW=$(date +%s)
DAYS=$(( (NOW - LAST_CLEANUP) / 86400 ))
[ "$DAYS" -lt 7 ] && exit 0

# Dry-run: list goals to archive
python3 -c "
import glob, json, os, shutil
from datetime import datetime, timedelta

stale_cutoff = datetime.now() - timedelta(days=30)
archive_cutoff = datetime.now() - timedelta(days=90)
backup_dir = 'state/stale-goals-backup'
os.makedirs(backup_dir, exist_ok=True)

for jf in sorted(glob.glob('state/gates/goal-*.json')):
    d = json.load(open(jf))
    if d.get('pinned'): continue
    mtime = datetime.fromtimestamp(os.path.getmtime(jf))
    if mtime < archive_cutoff:
        print(f'ARCHIVE: {os.path.basename(jf)} (last modified {mtime.date()})')
    elif mtime < stale_cutoff:
        print(f'STALE: {os.path.basename(jf)} (last modified {mtime.date()})')
" 2>/dev/null

touch state/stale-goals-backup/.last_cleanup
```

## Integration với MEKONG

| Hermes Concept | MEKONG Implementation |
|---|---|
| Skill active/stale/archived | Goal file active/stale/archived |
| `.archive/` directory | `state/stale-goals-backup/` |
| Pinned skills | `pinned: true` trong goal JSON |
| 7-day default interval | `.last_cleanup` timestamp |
| 30-day stale cutoff | `stale_cutoff = now - 30d` |
| 90-day archive cutoff | `archive_cutoff = now - 90d` |
| Forked AIAgent review | `me solo next` gate review |
| Dry-run mode | Print only, no move |
