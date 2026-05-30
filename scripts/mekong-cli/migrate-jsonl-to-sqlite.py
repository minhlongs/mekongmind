#!/usr/bin/env python3
"""JSONL → SQLite one-shot migration for VN Pilot storage.

Reads 4 JSONL/JSON stores from ~/.mekong/ (or --config-dir) and inserts into
pilot.db with INSERT OR IGNORE (idempotent — re-running produces 0 new rows).

Usage:
    python3 scripts/migrate-jsonl-to-sqlite.py            # live migration
    python3 scripts/migrate-jsonl-to-sqlite.py --dry-run  # count rows only
    python3 scripts/migrate-jsonl-to-sqlite.py --config-dir /tmp/test --force

Founder workflow (safe cutover):
    1. sudo launchctl bootout system/com.mekong.gateway
    2. mkdir -p ~/.mekong/archive-$(date +%y%m%d)
    3. cp ~/.mekong/*.jsonl ~/.mekong/*.json ~/.mekong/archive-$(date +%y%m%d)/
    4. python3 scripts/migrate-jsonl-to-sqlite.py
    5. Edit /Library/LaunchDaemons/com.mekong.gateway.plist: MEKONG_PILOT_STORAGE=sqlite
    6. sudo launchctl kickstart -k system/com.mekong.gateway
    7. curl smoke checks → done
    Keep archive for 30 days as rollback insurance.

NOTE: This script does NOT delete JSONL files. Rollback = flip env flag only.
IMPORTANT: Logs row counts only — never logs record contents (PII safety).
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import sqlite3
import stat
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Bootstrap: add project root to sys.path so src.services.* imports work
# ---------------------------------------------------------------------------

_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from src.services.sqlite_migrations import ensure_schema  # noqa: E402


def _resolve_config_dir(cli_arg: str | None) -> Path:
    """Priority: --config-dir flag > MEKONG_CONFIG_DIR env > ~/.mekong/"""
    if cli_arg:
        return Path(cli_arg).expanduser()
    env = os.getenv("MEKONG_CONFIG_DIR") or os.getenv("MEKONG_PILOT_DIR")
    if env:
        return Path(env).expanduser()
    return Path.home() / ".mekong"


def _load_jsonl_file(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out: list[dict] = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return out


def _load_credits_json(path: Path) -> dict[str, int]:
    """Load pilot_credits.json — dict {user_id: balance}."""
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return {k: int(v) for k, v in data.items() if isinstance(v, (int, float))}
    except (json.JSONDecodeError, ValueError):
        return {}


def _check_archive(config_dir: Path, force: bool) -> None:
    """Warn if no archive exists; require --force to proceed without one."""
    archive_pattern = str(config_dir / "archive-*")
    archives = glob.glob(archive_pattern)
    if not archives:
        msg = (
            f"\nWARNING: No archive found at {config_dir}/archive-*/\n"
            "STRONGLY RECOMMENDED: back up JSONL files first:\n"
            f"  mkdir -p {config_dir}/archive-$(date +%y%m%d)\n"
            f"  cp {config_dir}/*.jsonl {config_dir}/*.json "
            f"{config_dir}/archive-$(date +%y%m%d)/\n"
        )
        if not force:
            print(msg, file=sys.stderr)
            print(
                "Re-run with --force to skip this check (not recommended).",
                file=sys.stderr,
            )
            sys.exit(1)
        else:
            print(msg, file=sys.stderr)
            print("--force: proceeding without archive.", file=sys.stderr)


def _migrate_pilots(conn: sqlite3.Connection, config_dir: Path, dry_run: bool) -> tuple[int, int]:
    records = _load_jsonl_file(config_dir / "pilots.jsonl")
    inserted = skipped = 0
    for rec in records:
        uid = rec.get("user_id", "")
        if not uid:
            skipped += 1
            continue
        if dry_run:
            row = conn.execute(
                "SELECT 1 FROM pilots WHERE user_id = ?", (uid,)
            ).fetchone()
            if row:
                skipped += 1
            else:
                inserted += 1
            continue
        raw = json.dumps(rec, ensure_ascii=False)
        cur = conn.execute(
            """
            INSERT OR IGNORE INTO pilots
              (user_id, org_id, name, zalo, business_type, city,
               industry, source, onboarded_at, pilot_end_at, status, raw_payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                uid,
                rec.get("org_id", "default"),
                rec.get("name", ""),
                rec.get("zalo", ""),
                rec.get("business_type"),
                rec.get("city"),
                rec.get("industry"),
                rec.get("source"),
                rec.get("onboarded_at", ""),
                rec.get("pilot_end_at", ""),
                rec.get("status", "active"),
                raw,
            ),
        )
        if cur.rowcount > 0:
            inserted += 1
        else:
            skipped += 1
    if not dry_run:
        conn.commit()
    return inserted, skipped


def _migrate_conversions(conn: sqlite3.Connection, config_dir: Path, dry_run: bool) -> tuple[int, int]:
    records = _load_jsonl_file(config_dir / "conversions.jsonl")
    inserted = skipped = 0
    for rec in records:
        uid = rec.get("user_id", "")
        started = rec.get("started_at", "")
        if not uid or not started:
            skipped += 1
            continue
        if dry_run:
            row = conn.execute(
                "SELECT 1 FROM conversions WHERE user_id = ? AND started_at = ?",
                (uid, started),
            ).fetchone()
            if row:
                skipped += 1
            else:
                inserted += 1
            continue
        raw = json.dumps(rec, ensure_ascii=False)
        cur = conn.execute(
            """
            INSERT OR IGNORE INTO conversions
              (user_id, org_id, tier, monthly_vnd, started_at,
               recorded_at, bank_tx_ref, raw_payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                uid,
                rec.get("org_id", "default"),
                rec.get("tier", ""),
                rec.get("monthly_vnd", 0),
                started,
                rec.get("recorded_at", ""),
                rec.get("bank_tx_ref"),
                raw,
            ),
        )
        if cur.rowcount > 0:
            inserted += 1
        else:
            skipped += 1
    if not dry_run:
        conn.commit()
    return inserted, skipped


def _migrate_poll_responses(conn: sqlite3.Connection, config_dir: Path, dry_run: bool) -> tuple[int, int]:
    records = _load_jsonl_file(config_dir / "poll_responses.jsonl")
    inserted = skipped = 0
    for rec in records:
        uid = rec.get("user_id", "")
        week = rec.get("iso_week", "")
        if not uid or not week:
            skipped += 1
            continue
        if dry_run:
            row = conn.execute(
                "SELECT 1 FROM poll_responses WHERE user_id = ? AND iso_week = ?",
                (uid, week),
            ).fetchone()
            if row:
                skipped += 1
            else:
                inserted += 1
            continue
        raw = json.dumps(rec, ensure_ascii=False)
        cur = conn.execute(
            """
            INSERT OR IGNORE INTO poll_responses
              (user_id, score, comment, iso_week, recorded_at, raw_payload)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                uid,
                rec.get("score", 0),
                rec.get("comment"),
                week,
                rec.get("recorded_at", ""),
                raw,
            ),
        )
        if cur.rowcount > 0:
            inserted += 1
        else:
            skipped += 1
    if not dry_run:
        conn.commit()
    return inserted, skipped


def _migrate_credits(conn: sqlite3.Connection, config_dir: Path, dry_run: bool) -> tuple[int, int]:
    credits = _load_credits_json(config_dir / "pilot_credits.json")
    inserted = skipped = 0
    for uid, balance in credits.items():
        if dry_run:
            row = conn.execute(
                "SELECT 1 FROM pilot_credits WHERE user_id = ?", (uid,)
            ).fetchone()
            if row:
                skipped += 1
            else:
                inserted += 1
            continue
        cur = conn.execute(
            "INSERT OR REPLACE INTO pilot_credits (user_id, balance) VALUES (?, ?)",
            (uid, max(0, balance)),
        )
        if cur.rowcount > 0:
            inserted += 1
        else:
            skipped += 1
    if not dry_run:
        conn.commit()
    return inserted, skipped


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Migrate VN Pilot JSONL stores to SQLite (idempotent).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print row counts that would be migrated without writing.",
    )
    parser.add_argument(
        "--config-dir",
        metavar="DIR",
        default=None,
        help="Override config dir (default: MEKONG_CONFIG_DIR env or ~/.mekong).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip archive-folder check (not recommended).",
    )
    args = parser.parse_args()

    config_dir = _resolve_config_dir(args.config_dir)
    db_path = config_dir / "pilot.db"

    print(f"Config dir : {config_dir}")
    print(f"DB path    : {db_path}")
    print(f"Dry run    : {args.dry_run}")
    print()

    if not args.dry_run:
        _check_archive(config_dir, args.force)

    # Open / create DB
    config_dir.mkdir(parents=True, exist_ok=True)
    is_new_db = not db_path.exists()
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row

    # Set 0600 on new DB
    if is_new_db:
        os.chmod(db_path, stat.S_IRUSR | stat.S_IWUSR)

    ensure_schema(conn)

    # Migrate each store
    results: list[tuple[str, int, int]] = []

    pi, ps = _migrate_pilots(conn, config_dir, args.dry_run)
    results.append(("pilots", pi, ps))

    ci, cs = _migrate_conversions(conn, config_dir, args.dry_run)
    results.append(("conversions", ci, cs))

    ri, rs = _migrate_poll_responses(conn, config_dir, args.dry_run)
    results.append(("poll_responses", ri, rs))

    cri, crs = _migrate_credits(conn, config_dir, args.dry_run)
    results.append(("pilot_credits", cri, crs))

    conn.close()

    # Report (row counts only — no PII)
    label = "[DRY RUN] " if args.dry_run else ""
    print(f"{label}Migration results:")
    total_new = 0
    for table, ins, skip in results:
        print(f"  {table:20s}: {ins:4d} {'would insert' if args.dry_run else 'inserted'} / {skip:4d} skipped")
        total_new += ins

    if args.dry_run:
        print(f"\n  Total rows that would be inserted: {total_new}")
    else:
        print(f"\n  Total new rows: {total_new}")
        if total_new == 0:
            print("  (Already migrated — fully idempotent, nothing to do)")
        print(f"\n  DB: {db_path}")
        print("  Next step: set MEKONG_PILOT_STORAGE=sqlite in your launchd plist")
        print("  then: sudo launchctl kickstart -k system/com.mekong.gateway")

    return 0


if __name__ == "__main__":
    sys.exit(main())
