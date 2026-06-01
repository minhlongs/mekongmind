#!/usr/bin/env python3
"""Measure Zunef Claude latency without printing credentials or responses."""

from __future__ import annotations

import argparse
import json
import os
import shlex
import statistics
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any


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


def _run_once(args: argparse.Namespace, token: str, helper_ms: int) -> dict[str, Any]:
    body = json.dumps(
        {
            "model": args.model,
            "max_tokens": args.max_tokens,
            "stream": True,
            "messages": [{"role": "user", "content": args.prompt}],
        }
    )
    start = time.perf_counter()
    first_event_ms: int | None = None
    first_text_ms: int | None = None
    text_chunks = 0
    bytes_seen = 0
    status = 0
    curl_ttfb_ms: int | None = None
    curl_total_ms: int | None = None

    with tempfile.NamedTemporaryFile("w") as body_file, tempfile.NamedTemporaryFile("w") as config_file:
        body_file.write(body)
        body_file.flush()
        config_file.write(
            "\n".join(
                [
                    f'url = "{_messages_url(args.base_url)}"',
                    'request = "POST"',
                    'header = "content-type: application/json"',
                    'header = "accept: text/event-stream"',
                    'header = "connection: keep-alive"',
                    'header = "anthropic-version: 2023-06-01"',
                    'header = "x-zunef-client: claude-code"',
                    f'header = "x-api-key: {token}"',
                    f'data-binary = "@{body_file.name}"',
                    f'max-time = "{args.timeout}"',
                    "silent",
                    "show-error",
                    "no-buffer",
                    'write-out = "\\n__CURL_TIMING__ code=%{http_code} ttfb=%{time_starttransfer} total=%{time_total} size=%{size_download}\\n"',
                ]
            )
        )
        config_file.flush()
        proc = subprocess.Popen(
            ["curl", "--config", config_file.name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        assert proc.stdout is not None
        for line in iter(proc.stdout.readline, b""):
            bytes_seen += len(line)
            if line.startswith(b"__CURL_TIMING__"):
                parts = dict(
                    item.split("=", 1)
                    for item in line.decode("utf-8", errors="replace").strip().split()[1:]
                    if "=" in item
                )
                status = int(parts.get("code", "0"))
                curl_ttfb_ms = round(float(parts.get("ttfb", "0")) * 1000)
                curl_total_ms = round(float(parts.get("total", "0")) * 1000)
                continue
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
            if event.get("type") == "done":
                continue
        _, stderr = proc.communicate(timeout=5)
        if proc.returncode != 0:
            return {
                "ok": False,
                "status": status,
                "helper_ms": helper_ms,
                "error": "curl_error",
                "stderr_present": bool(stderr.strip()),
            }

    total_ms = round((time.perf_counter() - start) * 1000)
    return {
        "ok": status == 200 and first_text_ms is not None,
        "status": status,
        "helper_ms": helper_ms,
        "headers_ms": curl_ttfb_ms,
        "first_event_ms": first_event_ms,
        "first_text_ms": first_text_ms,
        "total_ms": curl_total_ms if curl_total_ms is not None else total_ms,
        "text_chunks": text_chunks,
        "bytes": bytes_seen,
    }


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
