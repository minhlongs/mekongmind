#!/usr/bin/env python3
"""Measure Zunef Claude latency without printing credentials or responses."""

from __future__ import annotations

import argparse
import http.client
import json
import os
import shlex
import statistics
import subprocess
import sys
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit


SSE_CHUNK_SIZE = 8192


def _load_settings() -> dict[str, Any]:
    path = Path.home() / ".claude" / "settings.json"
    try:
        data = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def _messages_url(base_url: str) -> str:
    base = base_url.rstrip("/")
    if base.endswith("/messages"):
        return base
    if "zunef.com" in base.lower() and base.endswith("/v1/ai"):
        return f"{base}/v1/messages"
    if "zunef.com" in base.lower():
        return f"{base}/messages"
    if base.endswith("/v1"):
        return f"{base}/messages"
    return f"{base}/v1/messages"


def _helper_from_settings(settings: dict[str, Any]) -> str:
    helper = os.getenv("ANTHROPIC_API_KEY_HELPER") or os.getenv("ZUNEF_API_KEY_HELPER")
    if helper:
        return helper
    configured = settings.get("apiKeyHelper")
    return configured if isinstance(configured, str) else ""


def _env_from_settings(settings: dict[str, Any]) -> dict[str, str]:
    env = settings.get("env")
    return env if isinstance(env, dict) else {}


def _get_token(helper: str) -> tuple[str, int]:
    if not helper:
        raise RuntimeError("missing apiKeyHelper; pass --helper or configure ~/.claude/settings.json")
    start = time.perf_counter()
    result = subprocess.run(
        shlex.split(helper),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=20,
        check=False,
    )
    elapsed_ms = round((time.perf_counter() - start) * 1000)
    token = result.stdout.strip()
    if result.returncode != 0 or not token:
        raise RuntimeError(f"apiKeyHelper failed: exit={result.returncode} stderr_present={bool(result.stderr.strip())}")
    return token, elapsed_ms


def _parse_sse_line(line: bytes) -> dict[str, Any] | None:
    text = line.decode("utf-8", errors="replace").strip()
    if not text.startswith("data: "):
        return None
    payload = text[6:]
    if payload == "[DONE]":
        return {"type": "done"}
    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _iter_sse_lines(response: http.client.HTTPResponse) -> Any:
    buffer = b""
    while True:
        chunk = response.read(SSE_CHUNK_SIZE)
        if not chunk:
            break
        buffer += chunk
        while True:
            index = buffer.find(b"\n")
            if index < 0:
                break
            line = buffer[:index]
            buffer = buffer[index + 1:]
            if line.endswith(b"\r"):
                line = line[:-1]
            yield line
    if buffer:
        yield buffer


def _run_once(args: argparse.Namespace, token: str, helper_ms: int) -> dict[str, Any]:
    body = json.dumps(
        {
            "model": args.model,
            "max_tokens": args.max_tokens,
            "stream": True,
            "messages": [{"role": "user", "content": args.prompt}],
        }
    )
    url = _messages_url(args.base_url)
    parts = urlsplit(url)
    if parts.scheme not in {"http", "https"} or not parts.hostname:
        return {"ok": False, "status": 0, "helper_ms": helper_ms, "error": "invalid_url"}

    start = time.perf_counter()
    first_event_ms: int | None = None
    first_text_ms: int | None = None
    text_chunks = 0
    bytes_seen = 0
    status = 0
    headers_ms: int | None = None
    early_stop = False
    conn: http.client.HTTPConnection | http.client.HTTPSConnection | None = None

    try:
        request_start = time.perf_counter()
        host = parts.hostname
        port = parts.port or (443 if parts.scheme == "https" else 80)
        path = parts.path or "/"
        if parts.query:
            path = f"{path}?{parts.query}"
        conn_cls = http.client.HTTPSConnection if parts.scheme == "https" else http.client.HTTPConnection
        conn = conn_cls(host, port, timeout=args.timeout)
        conn.request(
            "POST",
            path,
            body=body,
            headers={
                "content-type": "application/json",
                "accept": "text/event-stream",
                "accept-encoding": "identity",
                "connection": "keep-alive",
                "anthropic-version": "2023-06-01",
                "x-zunef-client": "claude-code",
                "x-api-key": token,
            },
        )
        response = conn.getresponse()
        status = response.status
        headers_ms = round((time.perf_counter() - request_start) * 1000)
        for line in _iter_sse_lines(response):
            bytes_seen += len(line)
            event = _parse_sse_line(line)
            if event is None:
                continue
            now_ms = round((time.perf_counter() - start) * 1000)
            if first_event_ms is None:
                first_event_ms = now_ms
            if event.get("type") == "content_block_delta":
                delta = event.get("delta")
                if isinstance(delta, dict) and delta.get("text"):
                    text_chunks += 1
                    if first_text_ms is None:
                        first_text_ms = now_ms
                    if args.stop_after_first_text:
                        early_stop = True
                        break
        return {
            "ok": status == 200 and first_text_ms is not None,
            "status": status,
            "helper_ms": helper_ms,
            "headers_ms": headers_ms,
            "first_event_ms": first_event_ms,
            "first_text_ms": first_text_ms,
            "total_ms": round((time.perf_counter() - start) * 1000),
            "text_chunks": text_chunks,
            "bytes": bytes_seen,
            "early_stop": early_stop,
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "ok": False,
            "status": status,
            "helper_ms": helper_ms,
            "error": "request_error",
            "error_kind": type(exc).__name__,
            "headers_ms": headers_ms,
        }
    finally:
        try:
            if conn is not None:
                conn.close()
        except Exception:
            pass


def _median(values: list[int]) -> int | None:
    return round(statistics.median(values)) if values else None


def main() -> int:
    settings = _load_settings()
    settings_env = _env_from_settings(settings)
    parser = argparse.ArgumentParser(description="Benchmark Zunef first-token latency safely")
    parser.add_argument("--base-url", default=os.getenv("ANTHROPIC_BASE_URL") or settings_env.get("ANTHROPIC_BASE_URL") or "https://claude-api.zunef.com/v1/ai")
    parser.add_argument("--model", default=os.getenv("ANTHROPIC_MODEL") or settings_env.get("ANTHROPIC_MODEL") or "claude-sonnet-4-6")
    parser.add_argument("--helper", default=_helper_from_settings(settings))
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--max-tokens", type=int, default=8)
    parser.add_argument("--timeout", type=float, default=45)
    parser.add_argument("--prompt", default="Reply with OK only.")
    parser.add_argument("--stop-after-first-text", action="store_true")
    args = parser.parse_args()

    token, helper_ms = _get_token(args.helper)
    rows = []
    for index in range(max(args.runs, 1)):
        row = _run_once(args, token, helper_ms if index == 0 else 0)
        rows.append(row)
        print(json.dumps({"run": index + 1, **row}, sort_keys=True))
        sys.stdout.flush()

    ok_rows = [row for row in rows if row.get("ok")]
    summary = {
        "ok_runs": len(ok_rows),
        "runs": len(rows),
        "median_headers_ms": _median([int(row["headers_ms"]) for row in ok_rows if row.get("headers_ms") is not None]),
        "median_first_text_ms": _median([int(row["first_text_ms"]) for row in ok_rows if row.get("first_text_ms") is not None]),
        "median_total_ms": _median([int(row["total_ms"]) for row in ok_rows if row.get("total_ms") is not None]),
    }
    print("summary=" + json.dumps(summary, sort_keys=True))
    return 0 if len(ok_rows) == len(rows) else 1


if __name__ == "__main__":
    raise SystemExit(main())
