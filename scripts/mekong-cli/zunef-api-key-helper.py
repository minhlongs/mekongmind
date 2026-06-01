#!/usr/bin/env python3
"""Cached Zunef apiKeyHelper for Claude Code.

Prints only the token to stdout so it can be used directly as Claude Code's
`apiKeyHelper`. Diagnostics go to stderr to avoid corrupting the token output.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def _cache_dir() -> Path:
    return Path(
        os.getenv("ZUNEF_AUTH_CACHE_DIR")
        or os.getenv("XDG_CACHE_HOME", str(Path.home() / ".cache"))
    ) / "mekongmind"


def _device_id() -> str:
    configured = os.getenv("ZUNEF_DEVICE_ID", "").strip()
    if configured:
        return configured
    path = Path.home() / ".claude" / "zunef-device-id"
    try:
        value = path.read_text().strip()
    except OSError:
        value = ""
    if value:
        return value
    import uuid

    value = uuid.uuid4().hex
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value)
    path.chmod(stat.S_IRUSR | stat.S_IWUSR)
    return value


def _with_device_id(auth_url: str, device_id: str) -> str:
    parts = urlsplit(auth_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.setdefault("deviceId", device_id)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def _cache_file(effective_url: str) -> Path:
    digest = hashlib.sha256(effective_url.encode("utf-8")).hexdigest()[:24]
    return _cache_dir() / f"zunef-auth-{digest}.json"


def _extract_token(payload: dict[str, Any]) -> str:
    candidates: list[Any] = [
        payload.get("accessToken"),
        payload.get("access_token"),
        payload.get("apiKey"),
        payload.get("api_key"),
        payload.get("token"),
        payload.get("key"),
    ]
    data = payload.get("data")
    if isinstance(data, dict):
        candidates.extend([
            data.get("accessToken"),
            data.get("access_token"),
            data.get("apiKey"),
            data.get("api_key"),
            data.get("token"),
            data.get("key"),
        ])
    for value in candidates:
        if isinstance(value, str) and value.strip():
            return value.strip()
    raise ValueError("Zunef auth response did not contain a token field")


def _extract_expiry(payload: dict[str, Any], ttl_seconds: int) -> float:
    now = time.time()
    for key in ("expiresAt", "expires_at", "expiration", "expireAt"):
        value = payload.get(key)
        if isinstance(value, (int, float)) and value > now:
            return float(value)
        if isinstance(value, str) and value.isdigit() and float(value) > now:
            return float(value)
    for key in ("expiresIn", "expires_in", "ttl"):
        value = payload.get(key)
        if isinstance(value, (int, float)) and value > 0:
            return now + float(value)
        if isinstance(value, str) and value.isdigit() and int(value) > 0:
            return now + int(value)
    return now + ttl_seconds


def _parse_response(raw_body: str, ttl_seconds: int) -> tuple[str, float]:
    stripped = raw_body.strip()
    if not stripped:
        raise ValueError("Zunef auth response was empty")
    try:
        payload = json.loads(stripped)
    except json.JSONDecodeError:
        return stripped, time.time() + ttl_seconds
    if not isinstance(payload, dict):
        raise ValueError("Zunef auth JSON response was not an object")
    return _extract_token(payload), _extract_expiry(payload, ttl_seconds)


def _read_cached(path: Path, skew_seconds: int) -> str | None:
    try:
        payload = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None
    token = payload.get("token")
    expires_at = payload.get("expires_at", 0)
    if isinstance(token, str) and time.time() < float(expires_at) - skew_seconds:
        return token
    return None


def _write_cache(path: Path, token: str, expires_at: float) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"token": token, "expires_at": expires_at}))
    path.chmod(stat.S_IRUSR | stat.S_IWUSR)


def _fetch_token(effective_url: str, device_id: str, timeout_seconds: float, ttl_seconds: int) -> tuple[str, float]:
    req = urllib.request.Request(
        effective_url,
        headers={
            "Accept": "text/plain, application/json",
            "User-Agent": "mekongmind-zunef-api-key-helper/1.0",
            "X-ZUNEF-CLIENT": "claude-code",
            "X-Device-Id": device_id,
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
        return _parse_response(resp.read().decode("utf-8", errors="replace"), ttl_seconds)


def main() -> int:
    parser = argparse.ArgumentParser(description="Cached Zunef Claude Code token helper")
    parser.add_argument("auth_url", nargs="?", default=os.getenv("ZUNEF_CLAUDE_CODE_AUTH_URL"))
    parser.add_argument(
        "--ttl",
        type=int,
        default=int(os.getenv("ZUNEF_AUTH_CACHE_TTL_SECONDS", "900")),
        help="fallback cache TTL in seconds when the auth response has no expiry",
    )
    parser.add_argument(
        "--skew",
        type=int,
        default=int(os.getenv("ZUNEF_AUTH_CACHE_SKEW_SECONDS", "30")),
        help="refresh this many seconds before cached expiry",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=float(os.getenv("ZUNEF_AUTH_TIMEOUT_SECONDS", "8")),
        help="auth endpoint timeout in seconds",
    )
    parser.add_argument("--refresh", action="store_true", help="ignore cache and fetch now")
    args = parser.parse_args()

    if not args.auth_url:
        print("Missing auth URL. Pass it as an argument or set ZUNEF_CLAUDE_CODE_AUTH_URL.", file=sys.stderr)
        return 2

    device_id = _device_id()
    effective_url = _with_device_id(args.auth_url, device_id)
    cache_path = _cache_file(effective_url)
    if not args.refresh:
        cached = _read_cached(cache_path, args.skew)
        if cached:
            print(cached)
            return 0

    try:
        token, expires_at = _fetch_token(effective_url, device_id, args.timeout, args.ttl)
        _write_cache(cache_path, token, expires_at)
        print(token)
        return 0
    except (OSError, ValueError, urllib.error.URLError, json.JSONDecodeError) as exc:
        cached = _read_cached(cache_path, 0)
        if cached:
            print(cached)
            return 0
        print(f"Zunef auth failed and no cache is usable: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
