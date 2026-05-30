#!/usr/bin/env python3
"""Admin audit log tail — founder ops CLI.

Usage:
    python3 scripts/audit-log-tail.py
    python3 scripts/audit-log-tail.py --last 20
    python3 scripts/audit-log-tail.py --last 100 --filter scope=founder
    python3 scripts/audit-log-tail.py --filter org=acme --filter scope=cs

Color coding by scope:
    founder   → yellow
    cs        → blue
    marketing → green
    readonly  → gray
    legacy    → red
    unknown   → white
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# ANSI color codes
COLORS = {
    "founder":   "\033[33m",   # yellow
    "cs":        "\033[34m",   # blue
    "marketing": "\033[32m",   # green
    "readonly":  "\033[37m",   # gray (white)
    "legacy":    "\033[31m",   # red
}
RESET = "\033[0m"
BOLD  = "\033[1m"


def _audit_path() -> Path:
    base = os.getenv("MEKONG_CONFIG_DIR")
    if base:
        return Path(base) / "admin-audit.jsonl"
    return Path.home() / ".mekong" / "admin-audit.jsonl"


def _color(scope: str) -> str:
    # scope may be comma-joined (e.g. "founder,cs") — use first token
    key = scope.split(",")[0].strip()
    return COLORS.get(key, "")


def _parse_filters(raw: list[str]) -> dict[str, str]:
    """Convert ["scope=founder", "org=acme"] → {"scope": "founder", "org": "acme"}."""
    filters: dict[str, str] = {}
    for item in raw:
        if "=" not in item:
            print(f"Warning: ignoring invalid filter '{item}' (expected key=value)", file=sys.stderr)
            continue
        k, v = item.split("=", 1)
        filters[k.strip()] = v.strip()
    return filters


def _matches(record: dict, filters: dict[str, str]) -> bool:
    for k, v in filters.items():
        if record.get(k) != v:
            return False
    return True


def _fmt_record(r: dict, use_color: bool) -> str:
    ts     = r.get("timestamp_iso", "???")
    scope  = r.get("scope", "unknown")
    org    = r.get("org", "?")
    sub    = r.get("sub", "?")
    ep     = r.get("endpoint", "")

    line = f"{ts}  [{scope:12s}]  org={org:<20s}  sub={sub:<30s}  {ep}"

    if use_color and sys.stdout.isatty():
        c = _color(scope)
        line = f"{c}{line}{RESET}"

    return line


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Tail ~/.mekong/admin-audit.jsonl with optional filtering."
    )
    parser.add_argument("--last", type=int, default=50, metavar="N",
                        help="Show last N records (default: 50)")
    parser.add_argument("--filter", action="append", default=[], metavar="key=value",
                        dest="filters", help="Filter by field (repeatable). E.g. --filter scope=founder")
    parser.add_argument("--no-color", action="store_true",
                        help="Disable ANSI color output")
    args = parser.parse_args()

    path = _audit_path()
    if not path.exists():
        print(f"Audit log not found: {path}", file=sys.stderr)
        print("No admin actions recorded yet.", file=sys.stderr)
        sys.exit(0)

    filters = _parse_filters(args.filters)
    use_color = not args.no_color

    records: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError:
            continue

    if filters:
        records = [r for r in records if _matches(r, filters)]

    tail = records[-args.last:] if len(records) > args.last else records

    if not tail:
        print("No records matching filters." if filters else "Audit log is empty.")
        return

    header = f"{'TIMESTAMP':<27}  {'SCOPE':<14}  {'ORG':<22}  {'SUB':<32}  ENDPOINT"
    if use_color and sys.stdout.isatty():
        print(f"{BOLD}{header}{RESET}")
    else:
        print(header)
    print("-" * len(header))

    for r in tail:
        print(_fmt_record(r, use_color))

    print(f"\n{len(tail)} record(s) shown" + (f" (filtered by {filters})" if filters else ""))


if __name__ == "__main__":
    main()
