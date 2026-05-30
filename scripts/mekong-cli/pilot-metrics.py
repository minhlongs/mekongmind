#!/usr/bin/env python3
"""
Pilot Metrics — aggregate usage events từ 10 OPC pilot users.

Đọc events từ:
  1. PostHog (nếu POSTHOG_API_KEY + POSTHOG_HOST set)
  2. Local JSONL fallback: ~/.mekong/usage_events.jsonl

Output: daily report stdout + optional CSV.

Usage:
    python3 scripts/pilot-metrics.py                  # 7-day rolling report
    python3 scripts/pilot-metrics.py --days 14
    python3 scripts/pilot-metrics.py --csv out.csv
    python3 scripts/pilot-metrics.py --user opc_001   # single user drill-down
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, Optional

LOCAL_EVENTS_PATH = Path.home() / ".mekong" / "usage_events.jsonl"


@dataclass
class Event:
    user_id: str
    command: str
    timestamp: datetime
    success: bool
    duration_ms: int = 0

    @classmethod
    def from_dict(cls, d: dict) -> Optional["Event"]:
        try:
            ts_raw = d.get("timestamp") or d.get("ts")
            if isinstance(ts_raw, str):
                ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
            elif isinstance(ts_raw, (int, float)):
                ts = datetime.fromtimestamp(ts_raw, tz=timezone.utc)
            else:
                return None
            return cls(
                user_id=str(d.get("user_id") or d.get("distinct_id") or "anon"),
                command=str(d.get("command") or d.get("event") or "unknown"),
                timestamp=ts,
                success=bool(d.get("success", True)),
                duration_ms=int(d.get("duration_ms") or 0),
            )
        except (ValueError, TypeError):
            return None


@dataclass
class UserMetrics:
    user_id: str
    total_commands: int = 0
    successful: int = 0
    failed: int = 0
    top_command: str = ""
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    commands_breakdown: dict = None

    @property
    def error_rate(self) -> float:
        return (self.failed / self.total_commands * 100) if self.total_commands else 0.0

    @property
    def active_days(self) -> int:
        if not self.first_seen or not self.last_seen:
            return 0
        return (self.last_seen.date() - self.first_seen.date()).days + 1


def _read_local_events(since: datetime) -> Iterable[Event]:
    if not LOCAL_EVENTS_PATH.exists():
        return []
    out = []
    with LOCAL_EVENTS_PATH.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                evt = Event.from_dict(json.loads(line))
            except json.JSONDecodeError:
                continue
            if evt and evt.timestamp >= since:
                out.append(evt)
    return out


def _read_posthog_events(since: datetime) -> Iterable[Event]:
    """Try PostHog. Trả [] nếu thiếu credentials hoặc lib."""
    api_key = os.getenv("POSTHOG_API_KEY")
    host = os.getenv("POSTHOG_HOST", "https://app.posthog.com")
    project_id = os.getenv("POSTHOG_PROJECT_ID")
    if not api_key or not project_id:
        return []
    try:
        import requests  # type: ignore[import-untyped]
    except ImportError:
        print("⚠️  posthog yêu cầu `pip install requests` — bỏ qua remote.", file=sys.stderr)
        return []
    url = f"{host}/api/projects/{project_id}/events/"
    params = {"after": since.isoformat(), "limit": 1000}
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        results = resp.json().get("results", [])
    except Exception as exc:  # network errors don't break the report
        print(f"⚠️  PostHog fetch failed: {exc}", file=sys.stderr)
        return []
    events = []
    for r in results:
        props = r.get("properties", {}) or {}
        evt = Event.from_dict({
            "user_id": r.get("distinct_id"),
            "command": props.get("command") or r.get("event"),
            "timestamp": r.get("timestamp"),
            "success": props.get("success", True),
            "duration_ms": props.get("duration_ms", 0),
        })
        if evt:
            events.append(evt)
    return events


def aggregate(events: list[Event]) -> dict[str, UserMetrics]:
    per_user: dict[str, UserMetrics] = {}
    cmd_counter: dict[str, Counter] = defaultdict(Counter)

    for evt in events:
        m = per_user.setdefault(evt.user_id, UserMetrics(user_id=evt.user_id, commands_breakdown={}))
        m.total_commands += 1
        if evt.success:
            m.successful += 1
        else:
            m.failed += 1
        cmd_counter[evt.user_id][evt.command] += 1
        if m.first_seen is None or evt.timestamp < m.first_seen:
            m.first_seen = evt.timestamp
        if m.last_seen is None or evt.timestamp > m.last_seen:
            m.last_seen = evt.timestamp

    for uid, counter in cmd_counter.items():
        per_user[uid].commands_breakdown = dict(counter)
        per_user[uid].top_command = counter.most_common(1)[0][0] if counter else ""

    return per_user


def print_report(metrics: dict[str, UserMetrics], days: int) -> None:
    print(f"\n📊 Mekong VN Pilot Report — {days} ngày gần nhất")
    print(f"   Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}")
    print("=" * 78)
    if not metrics:
        print("⚠️  Chưa có event nào. Pilot users chưa onboard hoặc telemetry chưa setup.")
        print(f"    Check: {LOCAL_EVENTS_PATH} | hoặc PostHog credentials.")
        return

    total_users = len(metrics)
    total_commands = sum(m.total_commands for m in metrics.values())
    avg_per_user = total_commands / total_users if total_users else 0

    print(f"  Active users:     {total_users}")
    print(f"  Total commands:   {total_commands}")
    print(f"  Avg/user:         {avg_per_user:.1f}")
    print()
    print(f"  {'USER':<20} {'CMDS':>6} {'ERR%':>6} {'TOP CMD':<20} {'DAYS':>5}")
    print(f"  {'-'*20} {'-'*6} {'-'*6} {'-'*20} {'-'*5}")
    for m in sorted(metrics.values(), key=lambda x: -x.total_commands):
        print(
            f"  {m.user_id[:20]:<20} "
            f"{m.total_commands:>6} "
            f"{m.error_rate:>5.1f}% "
            f"{m.top_command[:20]:<20} "
            f"{m.active_days:>5}"
        )

    print()
    print("🎯 KPIs (Phase 6 success criteria):")
    weekly_active = sum(1 for m in metrics.values() if m.total_commands >= 5)
    print(f"   ≥5 cmds/user (target ≥7/10): {weekly_active}/{total_users}")
    error_overall = (
        sum(m.failed for m in metrics.values()) / total_commands * 100
        if total_commands else 0
    )
    print(f"   Overall error rate (target <10%): {error_overall:.1f}%")


def write_csv(metrics: dict[str, UserMetrics], path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["user_id", "total_commands", "successful", "failed",
                    "error_rate_pct", "top_command", "active_days",
                    "first_seen", "last_seen"])
        for m in metrics.values():
            w.writerow([
                m.user_id, m.total_commands, m.successful, m.failed,
                round(m.error_rate, 2), m.top_command, m.active_days,
                m.first_seen.isoformat() if m.first_seen else "",
                m.last_seen.isoformat() if m.last_seen else "",
            ])
    print(f"\n💾 CSV written: {path}")


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Pilot metrics aggregator")
    parser.add_argument("--days", type=int, default=7, help="Rolling window")
    parser.add_argument("--csv", type=Path, help="Output CSV path")
    parser.add_argument("--user", help="Drill into single user_id")
    parser.add_argument("--source", choices=("local", "posthog", "both"), default="both")
    args = parser.parse_args(argv)

    since = datetime.now(timezone.utc) - timedelta(days=args.days)

    events: list[Event] = []
    if args.source in ("local", "both"):
        events.extend(_read_local_events(since))
    if args.source in ("posthog", "both"):
        events.extend(_read_posthog_events(since))

    metrics = aggregate(events)
    if args.user:
        metrics = {k: v for k, v in metrics.items() if k == args.user}

    print_report(metrics, args.days)
    if args.csv:
        write_csv(metrics, args.csv)
    return 0


if __name__ == "__main__":
    sys.exit(main())
