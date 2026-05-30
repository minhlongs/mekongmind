#!/usr/bin/env python3
"""CLI wrapper — Phase 9 P06 Default Org Seeder.

GITIGNORED: this file is for founder-only ops on M1 machine.
Do NOT commit to the public mekong-cli repo.

Usage:
    python3 scripts/seed-default-org-and-pilots.py
    python3 scripts/seed-default-org-and-pilots.py --dry-run
    python3 scripts/seed-default-org-and-pilots.py --founder-email me@example.com
    python3 scripts/seed-default-org-and-pilots.py --force

Required env:
    MEKONG_PILOT_STORAGE=sqlite
    MEKONG_FOUNDER_EMAIL=<email>   (can be overridden via --founder-email)
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Ensure project root on sys.path when run directly
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from src.services.default_org_seeder import seed_default_org, verify_prereqs


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed the 'default' org and backfill all pilots into org_members.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report row counts without writing to the database.",
    )
    parser.add_argument(
        "--founder-email",
        default=None,
        help="Override MEKONG_FOUNDER_EMAIL env var.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip 'rows exist; proceed?' confirmation prompt.",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()

    # Resolve founder email
    founder_email = args.founder_email or os.getenv("MEKONG_FOUNDER_EMAIL", "")
    if not founder_email:
        print(
            "ERROR: founder email not set.\n"
            "  Use --founder-email or export MEKONG_FOUNDER_EMAIL=<email>",
            file=sys.stderr,
        )
        sys.exit(1)

    # Pre-flight check
    try:
        verify_prereqs()
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)

    # Confirmation prompt (skip with --force or --dry-run)
    if not args.force and not args.dry_run:
        ans = input(
            "About to seed 'default' org and backfill pilots into org_members.\n"
            "Proceed? [y/N] "
        ).strip().lower()
        if ans not in ("y", "yes"):
            print("Aborted.")
            sys.exit(0)

    # Run seeder
    try:
        result = seed_default_org(
            founder_email=founder_email,
            dry_run=args.dry_run,
        )
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)

    # Report
    mode = "[DRY RUN] " if args.dry_run else ""
    print(
        f"{mode}orgs: {result['orgs_inserted']} inserted | "
        f"{result['skipped']} skipped\n"
        f"{mode}org_members: {result['members_inserted']} inserted "
        f"({result['pilots_seeded']} pilots + 1 founder) | "
        f"{result['skipped']} skipped"
    )
    if not args.dry_run:
        print("Audit log entry written to ~/.mekong/admin-audit.jsonl")


if __name__ == "__main__":
    main()
