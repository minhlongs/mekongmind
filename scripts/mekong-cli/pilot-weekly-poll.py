#!/usr/bin/env python3
"""
Pilot Weekly Poll — Monday cron: gửi Zalo NPS poll → Day-2 aggregate → flag low-NPS.

Usage:
    # Monday — send weekly poll
    python3 scripts/pilot-weekly-poll.py send
    python3 scripts/pilot-weekly-poll.py send --dry-run

    # Record a response (manually or via webhook)
    python3 scripts/pilot-weekly-poll.py record opc_001 --score 4 --comment "Hay lắm"

    # Wed-Thu — aggregate + alert founder
    python3 scripts/pilot-weekly-poll.py report
    python3 scripts/pilot-weekly-poll.py report --csv out.csv

Cron schedule (M1 Max launchd / cron):
    # Monday 09:00 send
    0 9 * * 1 cd ~/mekong-cli && python3 scripts/pilot-weekly-poll.py send
    # Thursday 14:00 report
    0 14 * * 4 cd ~/mekong-cli && python3 scripts/pilot-weekly-poll.py report

Data:
    ~/.mekong/pilots.jsonl              — pilot users (from pilot-onboard.py)
    ~/.mekong/poll_responses.jsonl      — append-only response log
    ~/.mekong/poll_sent_log.jsonl       — track who got the weekly poll
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

CONFIG_DIR = Path.home() / ".mekong"
PILOTS_FILE = CONFIG_DIR / "pilots.jsonl"
RESPONSES_FILE = CONFIG_DIR / "poll_responses.jsonl"
SENT_LOG_FILE = CONFIG_DIR / "poll_sent_log.jsonl"

LOW_NPS_THRESHOLD = 6  # < 7 = needs founder attention (NPS detractor + passive)

POLL_MESSAGE = """📊 Mekong AI — Khảo Sát Tuần {iso_week}

Cảm ơn anh/chị đã dùng Mekong AI tuần này 🙏

Anh/chị đánh giá trải nghiệm thế nào? (1-5)
1 = Rất tệ
2 = Tệ
3 = Ổn
4 = Tốt
5 = Tuyệt vời

Reply tin nhắn này với số 1-5 (kèm comment nếu muốn).
Mất 30 giây, nhưng quyết định Mekong cải tiến gì tuần sau."""


@dataclass
class PollSent:
    user_id: str
    sent_at: str
    iso_week: str
    delivery_status: str  # sent | failed | dry_run


@dataclass
class PollResponse:
    user_id: str
    score: int
    comment: str
    recorded_at: str
    iso_week: str


def _load_pilots_jsonl() -> list[dict]:
    if not PILOTS_FILE.exists():
        return []
    out = []
    with PILOTS_FILE.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return out


def _append_jsonl(path: Path, record: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")


def _load_responses(since: datetime) -> list[PollResponse]:
    if not RESPONSES_FILE.exists():
        return []
    out = []
    with RESPONSES_FILE.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
                ts = datetime.fromisoformat(d["recorded_at"].replace("Z", "+00:00"))
                if ts >= since:
                    out.append(PollResponse(**d))
            except (json.JSONDecodeError, KeyError, ValueError):
                continue
    return out


def _current_iso_week() -> str:
    now = datetime.now(timezone.utc)
    y, w, _ = now.isocalendar()
    return f"{y}-W{w:02d}"


def _send_zalo(zalo_id: str, message: str) -> tuple[bool, str]:
    """Returns (success, status_string)."""
    token = os.getenv("ZALO_OA_ACCESS_TOKEN")
    if not token:
        return False, "no_token"
    try:
        from integrations.zalo import ZaloOAClient
    except ImportError:
        return False, "no_integrations"
    try:
        client = ZaloOAClient(access_token=token, app_id=os.getenv("ZALO_APP_ID", ""))
        result = client.send_message(zalo_id, message)
        if result.get("error", 0) == 0:
            return True, "sent"
        return False, f"api_error:{result.get('message','?')}"
    except Exception as exc:
        return False, f"exception:{type(exc).__name__}"


def cmd_send(args: argparse.Namespace) -> int:
    pilots = _load_pilots_jsonl()
    active = [p for p in pilots if p.get("status", "active") == "active"]
    if not active:
        print("⚠️  No active pilots. Onboard first: scripts/pilot-onboard.py add ...")
        return 1

    iso_week = _current_iso_week()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    message = POLL_MESSAGE.format(iso_week=iso_week)
    sent_count = failed_count = 0

    print(f"📨 Sending Week-{iso_week} poll to {len(active)} pilots...")
    print("=" * 60)

    for p in active:
        if args.dry_run:
            ok, status = True, "dry_run"
        else:
            ok, status = _send_zalo(p["zalo"], message)
        _append_jsonl(SENT_LOG_FILE, asdict(PollSent(
            user_id=p["user_id"], sent_at=now,
            iso_week=iso_week, delivery_status=status,
        )))
        marker = "✅" if ok else "⚠️ "
        print(f"  {marker} {p['user_id']:<22} {p['name'][:25]:<25} [{status}]")
        if ok:
            sent_count += 1
        else:
            failed_count += 1

    print("=" * 60)
    print(f"Sent: {sent_count}/{len(active)}  Failed: {failed_count}")
    if args.dry_run:
        print("(dry-run — no actual Zalo sends)")
    elif failed_count:
        print("⚠️  Failed sends — check ZALO_OA_ACCESS_TOKEN + send manually as fallback")
        print("\n📋 Manual fallback message:")
        for line in message.splitlines():
            print(f"   {line}")
    return 0 if failed_count == 0 else 2


def cmd_record(args: argparse.Namespace) -> int:
    if not (1 <= args.score <= 5):
        print(f"❌ Score must be 1-5, got {args.score}")
        return 2
    iso_week = args.iso_week or _current_iso_week()
    resp = PollResponse(
        user_id=args.user_id,
        score=args.score,
        comment=args.comment or "",
        recorded_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        iso_week=iso_week,
    )
    _append_jsonl(RESPONSES_FILE, asdict(resp))
    print(f"✅ Recorded score {args.score} for {args.user_id} ({iso_week})")
    if args.score < LOW_NPS_THRESHOLD - 2:  # 1, 2, 3 = detractor
        print(f"⚠️  Low score — founder should reach out within 24h")
    return 0


def cmd_report(args: argparse.Namespace) -> int:
    since = datetime.now(timezone.utc) - timedelta(days=args.days)
    responses = _load_responses(since)
    pilots = {p["user_id"]: p for p in _load_pilots_jsonl()}

    if not responses:
        print(f"📊 No responses in last {args.days} days.")
        print("    Possible causes: poll not sent, Zalo delivery failed, users haven't replied yet.")
        return 0

    # Aggregate
    scores_by_user: dict[str, list[int]] = defaultdict(list)
    latest_comment: dict[str, str] = {}
    for r in responses:
        scores_by_user[r.user_id].append(r.score)
        if r.comment:
            latest_comment[r.user_id] = r.comment

    avg_scores = {uid: sum(s) / len(s) for uid, s in scores_by_user.items()}
    overall_avg = sum(avg_scores.values()) / len(avg_scores)

    print(f"\n📊 Mekong VN Pilot Weekly Poll — last {args.days} days")
    print("=" * 70)
    print(f"  Active responders:  {len(scores_by_user)}/{len(pilots)} pilots")
    print(f"  Total responses:    {len(responses)}")
    print(f"  Overall avg score:  {overall_avg:.2f}/5  (NPS-style proxy)")
    print()
    print(f"  {'USER_ID':<22} {'NAME':<25} {'AVG':>5} {'COUNT':>6}  COMMENT")
    print(f"  {'-'*22} {'-'*25} {'-'*5} {'-'*6}  {'-'*30}")
    for uid in sorted(avg_scores, key=lambda u: avg_scores[u]):
        avg = avg_scores[uid]
        name = pilots.get(uid, {}).get("name", "?")
        comment = latest_comment.get(uid, "")[:30]
        flag = " 🚨" if avg < LOW_NPS_THRESHOLD - 2 else (" ⚠️ " if avg < LOW_NPS_THRESHOLD - 1 else "")
        print(f"  {uid:<22} {name[:25]:<25} {avg:>5.2f} {len(scores_by_user[uid]):>6}  {comment}{flag}")

    # Flag low-NPS for founder
    detractors = [(uid, s) for uid, s in avg_scores.items() if s < LOW_NPS_THRESHOLD - 2]
    if detractors:
        print()
        print(f"🚨 LOW-NPS ALERTS — Founder phải Zalo trong 24h:")
        for uid, s in detractors:
            p = pilots.get(uid, {})
            print(f"   • {uid} ({p.get('name','?')}, {p.get('zalo','?')}) — score {s:.1f}")
            if uid in latest_comment:
                print(f"     Comment: {latest_comment[uid]}")

    # Non-responders
    silent = [uid for uid in pilots if uid not in scores_by_user]
    if silent:
        print()
        print(f"😴 SILENT PILOTS ({len(silent)}) — chưa reply tuần này:")
        for uid in silent[:10]:
            p = pilots.get(uid, {})
            print(f"   • {uid} ({p.get('name','?')}, {p.get('zalo','?')})")

    if args.csv:
        with args.csv.open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["user_id", "name", "avg_score", "response_count",
                        "latest_comment", "is_detractor", "is_silent"])
            for uid in pilots:
                avg = avg_scores.get(uid)
                w.writerow([
                    uid,
                    pilots[uid].get("name", ""),
                    f"{avg:.2f}" if avg else "",
                    len(scores_by_user.get(uid, [])),
                    latest_comment.get(uid, ""),
                    "YES" if avg and avg < LOW_NPS_THRESHOLD - 2 else "",
                    "YES" if uid not in scores_by_user else "",
                ])
        print(f"\n💾 CSV written: {args.csv}")
    return 0


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(prog="pilot-weekly-poll")
    sub = parser.add_subparsers(dest="command", required=True)

    p_send = sub.add_parser("send", help="Send weekly poll to all active pilots")
    p_send.add_argument("--dry-run", action="store_true")
    p_send.set_defaults(func=cmd_send)

    p_record = sub.add_parser("record", help="Record a poll response")
    p_record.add_argument("user_id")
    p_record.add_argument("--score", type=int, required=True, help="1-5")
    p_record.add_argument("--comment", default="")
    p_record.add_argument("--iso-week", default=None, help="Override (vd: 2026-W20)")
    p_record.set_defaults(func=cmd_record)

    p_report = sub.add_parser("report", help="Aggregate + flag low-NPS")
    p_report.add_argument("--days", type=int, default=7)
    p_report.add_argument("--csv", type=Path)
    p_report.set_defaults(func=cmd_report)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
