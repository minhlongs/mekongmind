#!/usr/bin/env python3
"""Issue a signed JWT admin token for the Mekong VN Hub gateway.

Reads MEKONG_JWT_SECRET from environment — never from CLI args.

Usage:
    MEKONG_JWT_SECRET=... python3 scripts/admin-token-issue.py \\
        --sub founder \\
        --scope founder \\
        --scope cs \\
        --org '*' \\
        --ttl 24h

TTL formats: 1h, 12h, 24h (default), 7d (max). Refuses > 7d.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import time

import jwt


_TTL_RE = re.compile(r"^(\d+)(h|d)$")
_MAX_TTL_SECONDS = 7 * 24 * 3600  # 7 days


def _parse_ttl(ttl_str: str) -> int:
    """Parse TTL string like '24h' or '7d' into seconds.

    Raises SystemExit on invalid format or value > 7d.
    """
    m = _TTL_RE.match(ttl_str.strip().lower())
    if not m:
        print(f"Error: invalid TTL format '{ttl_str}'. Use e.g. '24h' or '7d'.", file=sys.stderr)
        sys.exit(1)
    value, unit = int(m.group(1)), m.group(2)
    seconds = value * 3600 if unit == "h" else value * 86400
    if seconds > _MAX_TTL_SECONDS:
        print(
            f"Error: TTL '{ttl_str}' exceeds maximum 7 days. "
            "Reduce TTL or rotate secret instead.",
            file=sys.stderr,
        )
        sys.exit(1)
    return seconds


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Issue a Mekong JWT admin token. Reads MEKONG_JWT_SECRET from env."
    )
    parser.add_argument(
        "--sub",
        required=True,
        help="Subject claim — identifies the token holder (e.g. 'founder', 'cs-agent-01')",
    )
    parser.add_argument(
        "--scope",
        action="append",
        dest="scopes",
        default=[],
        metavar="SCOPE",
        help="Scope to grant (repeatable). Valid: founder, cs, readonly",
    )
    parser.add_argument(
        "--org",
        default="default",
        dest="org",
        help="Allowed org. Use '*' for wildcard, or exact org_id. (default: 'default')",
    )
    parser.add_argument(
        "--ttl",
        default="24h",
        help="Token TTL. Format: Nh or Nd (max 7d). Default: 24h",
    )

    args = parser.parse_args()

    secret = os.environ.get("MEKONG_JWT_SECRET")
    if not secret:
        print(
            "Error: MEKONG_JWT_SECRET not set. Export it before running:\n"
            "  export MEKONG_JWT_SECRET=$(cat ~/.mekong/jwt-secret.txt)",
            file=sys.stderr,
        )
        sys.exit(1)

    if not args.scopes:
        print("Error: at least one --scope required.", file=sys.stderr)
        sys.exit(1)

    ttl_seconds = _parse_ttl(args.ttl)
    now = int(time.time())
    allowed_orgs = [args.org]

    payload = {
        "sub": args.sub,
        "scopes": args.scopes,
        "allowed_orgs": allowed_orgs,
        "iat": now,
        "exp": now + ttl_seconds,
    }

    token = jwt.encode(payload, secret, algorithm="HS256")

    # Summary
    import datetime
    exp_dt = datetime.datetime.fromtimestamp(now + ttl_seconds, tz=datetime.timezone.utc)
    print(f"\nToken:\n{token}\n")
    print("Claims:")
    print(f"  sub          : {args.sub}")
    print(f"  scopes       : {args.scopes}")
    print(f"  allowed_orgs : {allowed_orgs}")
    print(f"  expires      : {exp_dt.isoformat()} (TTL={args.ttl})")
    print(f"\nUsage:")
    print(f'  curl -X POST https://gateway.cashclaw.cc/v1/pilot/convert \\')
    print(f'    -H "Authorization: Bearer {token}" \\')
    print(f'    -H "Content-Type: application/json" \\')
    print(f'    -d \'{{"user_id":"<uid>","tier":"starter","monthly_vnd":199000}}\'')


if __name__ == "__main__":
    main()
