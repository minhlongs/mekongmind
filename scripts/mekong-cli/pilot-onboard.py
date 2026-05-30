#!/usr/bin/env python3
"""
Pilot Onboarding — add new VN OPC user → unique ID + 50 credits + Day-0 Zalo welcome.

Usage:
    python3 scripts/pilot-onboard.py add "Nguyễn Văn A" --zalo +84909123456 --type shop_online --city HCM
    python3 scripts/pilot-onboard.py list
    python3 scripts/pilot-onboard.py status opc_001
    python3 scripts/pilot-onboard.py credits opc_001 +50

Data location:
    ~/.mekong/pilots.jsonl       — append-only user records
    ~/.mekong/pilot_credits.json — balance per user_id
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

CONFIG_DIR = Path.home() / ".mekong"
PILOTS_FILE = CONFIG_DIR / "pilots.jsonl"
CREDITS_FILE = CONFIG_DIR / "pilot_credits.json"

INITIAL_FREE_CREDITS = 50
PILOT_DURATION_WEEKS = 8
SUPPORTED_TYPES = {
    "shop_online", "freelancer", "cafe_fnb", "giao_vien",
    "dich_vu", "ho_kinh_doanh", "opc",
}
WELCOME_TEMPLATE = """🎉 Chào mừng {name} tham gia Mekong AI Pilot!

User ID: {user_id}
Credits miễn phí: {credits}
Pilot end date: {end_date}

📥 Cài 5 phút:
1. git clone https://github.com/mekong-ai/mekong-cli ~/mekong-cli
2. cd ~/mekong-cli && python3 -m src.cli.vn_setup
3. Thử: python3 -m src.commands.ke_toan --help

📞 Support: Zalo OA này (T2-T6, 8h-18h)
🎯 Tuần 1: cài + thử 3 lệnh /ke-toan, /thue-dnvn, /zalo-oa
"""


@dataclass
class PilotUser:
    user_id: str
    name: str
    zalo: str
    business_type: str
    city: str
    onboarded_at: str
    pilot_end_at: str
    industry: Optional[str] = None
    status: str = "active"  # active | paused | converted | dropped
    notes: str = ""

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


def _ensure_config_dir() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def _generate_user_id(name: str, zalo: str) -> str:
    """Stable ID hash so re-onboard cùng người = cùng ID."""
    seed = f"{name.strip().lower()}|{zalo.strip()}"
    digest = hashlib.sha256(seed.encode()).hexdigest()[:6]
    # Sequential prefix opc_NNN based on existing count
    existing = _load_pilots()
    seq = len(existing) + 1
    return f"opc_{seq:03d}_{digest}"


def _load_pilots() -> list[PilotUser]:
    if not PILOTS_FILE.exists():
        return []
    out: list[PilotUser] = []
    with PILOTS_FILE.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
                out.append(PilotUser(**d))
            except (json.JSONDecodeError, TypeError) as exc:
                print(f"⚠️  skipping malformed line: {exc}", file=sys.stderr)
    return out


def _append_pilot(user: PilotUser) -> None:
    _ensure_config_dir()
    with PILOTS_FILE.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(user.to_dict(), ensure_ascii=False) + "\n")


def _load_credits() -> dict[str, int]:
    if not CREDITS_FILE.exists():
        return {}
    try:
        return json.loads(CREDITS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _save_credits(balances: dict[str, int]) -> None:
    _ensure_config_dir()
    CREDITS_FILE.write_text(
        json.dumps(balances, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _send_zalo_welcome(user: PilotUser, credits: int) -> bool:
    """Best-effort Zalo OA welcome. Returns False on missing creds (caller logs)."""
    token = os.getenv("ZALO_OA_ACCESS_TOKEN")
    if not token:
        return False
    try:
        from integrations.zalo import ZaloOAClient
    except ImportError as exc:
        print(f"⚠️  zalo integration unavailable: {exc}", file=sys.stderr)
        return False
    client = ZaloOAClient(access_token=token, app_id=os.getenv("ZALO_APP_ID", ""))
    text = WELCOME_TEMPLATE.format(
        name=user.name,
        user_id=user.user_id,
        credits=credits,
        end_date=user.pilot_end_at[:10],
    )
    try:
        result = client.send_message(user.zalo, text)
        return bool(result.get("error", 0) == 0)
    except Exception as exc:
        print(f"⚠️  zalo send failed: {exc}", file=sys.stderr)
        return False


def cmd_add(args: argparse.Namespace) -> int:
    if args.type not in SUPPORTED_TYPES:
        print(f"❌ Unsupported type '{args.type}'. Choose from: {', '.join(sorted(SUPPORTED_TYPES))}")
        return 2

    now = datetime.now(timezone.utc)
    user = PilotUser(
        user_id=_generate_user_id(args.name, args.zalo),
        name=args.name,
        zalo=args.zalo,
        business_type=args.type,
        city=args.city,
        industry=args.industry,
        onboarded_at=now.isoformat(timespec="seconds"),
        pilot_end_at=(now + timedelta(weeks=PILOT_DURATION_WEEKS)).isoformat(timespec="seconds"),
    )
    _append_pilot(user)

    balances = _load_credits()
    balances[user.user_id] = balances.get(user.user_id, 0) + INITIAL_FREE_CREDITS
    _save_credits(balances)

    print(f"✅ Onboarded: {user.user_id}")
    print(f"   Name:      {user.name}")
    print(f"   Type:      {user.business_type} / {user.city}")
    print(f"   Credits:   {balances[user.user_id]}")
    print(f"   Pilot end: {user.pilot_end_at[:10]}")

    if args.no_zalo:
        print("   (Zalo welcome skipped — --no-zalo)")
    elif _send_zalo_welcome(user, balances[user.user_id]):
        print("   📨 Zalo welcome sent")
    else:
        print("   ⚠️  Zalo welcome NOT sent (missing ZALO_OA_ACCESS_TOKEN or send failed)")
        print("   👉 Manual send template:")
        print()
        for line in WELCOME_TEMPLATE.format(
            name=user.name,
            user_id=user.user_id,
            credits=balances[user.user_id],
            end_date=user.pilot_end_at[:10],
        ).splitlines():
            print(f"   {line}")
    return 0


def cmd_list(args: argparse.Namespace) -> int:
    pilots = _load_pilots()
    balances = _load_credits()
    if not pilots:
        print("(no pilots yet — run `pilot-onboard add ...`)")
        return 0
    active = [p for p in pilots if p.status == "active"] if args.active_only else pilots
    print(f"  {'USER_ID':<22} {'NAME':<25} {'TYPE':<15} {'CITY':<5} {'CREDITS':>7} {'STATUS':<10}")
    print(f"  {'-'*22} {'-'*25} {'-'*15} {'-'*5} {'-'*7} {'-'*10}")
    for p in active:
        bal = balances.get(p.user_id, 0)
        print(f"  {p.user_id:<22} {p.name[:25]:<25} {p.business_type:<15} {p.city:<5} {bal:>7} {p.status:<10}")
    print(f"\n  Total: {len(active)} / {len(pilots)} (active / all)")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    pilots = _load_pilots()
    for p in pilots:
        if p.user_id == args.user_id:
            print(json.dumps(p.to_dict(), ensure_ascii=False, indent=2))
            print(f"\n  Credits: {_load_credits().get(p.user_id, 0)}")
            return 0
    print(f"❌ Not found: {args.user_id}")
    return 1


def cmd_credits(args: argparse.Namespace) -> int:
    delta = int(args.delta)
    balances = _load_credits()
    if args.user_id not in balances:
        # Verify user exists in pilots before issuing credits
        if not any(p.user_id == args.user_id for p in _load_pilots()):
            print(f"❌ Unknown user: {args.user_id}")
            return 1
    balances[args.user_id] = max(0, balances.get(args.user_id, 0) + delta)
    _save_credits(balances)
    print(f"💰 {args.user_id} balance: {balances[args.user_id]} (delta {delta:+d})")
    return 0


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(prog="pilot-onboard")
    sub = parser.add_subparsers(dest="command", required=True)

    p_add = sub.add_parser("add", help="Onboard a new pilot user")
    p_add.add_argument("name", help="Tên đầy đủ của user")
    p_add.add_argument("--zalo", required=True, help="Số Zalo (E.164 hoặc dạng +84...)")
    p_add.add_argument("--type", required=True, help=f"Loại hình ({', '.join(sorted(SUPPORTED_TYPES))})")
    p_add.add_argument("--city", default="HCM", help="Tỉnh/thành code (HCM, HN, DN, ...)")
    p_add.add_argument("--industry", default=None, help="Ngành cụ thể (vd: thời trang)")
    p_add.add_argument("--no-zalo", action="store_true", help="Skip auto Zalo welcome")
    p_add.set_defaults(func=cmd_add)

    p_list = sub.add_parser("list", help="List all pilots")
    p_list.add_argument("--active-only", action="store_true")
    p_list.set_defaults(func=cmd_list)

    p_status = sub.add_parser("status", help="Detail of one user")
    p_status.add_argument("user_id")
    p_status.set_defaults(func=cmd_status)

    p_credits = sub.add_parser("credits", help="Adjust credit balance")
    p_credits.add_argument("user_id")
    p_credits.add_argument("delta", help="Delta credits (vd: +50, -10)")
    p_credits.set_defaults(func=cmd_credits)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
