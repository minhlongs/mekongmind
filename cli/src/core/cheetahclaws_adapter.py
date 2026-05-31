"""CheetahClaws Adapter — thin Python wrapper around the cc_daemon JSON-RPC.

Boundary rule: this module communicates with ``~/.cheetahclaws-src`` only
via the daemon's HTTP /rpc endpoint.  It never imports anything from
``~/.cheetahclaws-src`` directly.  All secrets (Telegram tokens, etc.)
remain in the external runtime.

Connection resolution
---------------------
Default target is the Unix domain socket written by ``cheetahclaws serve``
at startup::

    unix://~/.cheetahclaws/run/daemon.sock

TCP fallback (``tcp://host:port``) is supported for remote/CI scenarios.

Client identity
---------------
A ``mekongmind`` client id is persisted to
``~/.cheetahclaws/clients/mekongmind.id`` so the daemon can attribute
permission requests to this caller across restarts.
"""
from __future__ import annotations

import http.client
import json
import logging
import os
import socket
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# ── defaults ─────────────────────────────────────────────────────────────────
DEFAULT_SOCKET = os.environ.get(
    "CHEETAHCLAWS_DAEMON",
    str(Path.home() / ".cheetahclaws" / "run" / "daemon.sock"),
)
CLIENT_KIND = "mekongmind"
CLIENT_ID_FILE = Path.home() / ".cheetahclaws" / "clients" / f"{CLIENT_KIND}.id"
API_VERSION_HEADER = "X-CheetahClaws-API-Version"
API_VERSION = "1.0"
CLIENT_ID_HEADER = "X-Client-Id"
CLIENT_KIND_HEADER = "X-Client-Kind"
CONTENT_TYPE_HEADER = "Content-Type"
AUTH_HEADER = "Authorization"
CONNECT_TIMEOUT_S = 5.0
REQUEST_TIMEOUT_S = 120.0


# ── data types ───────────────────────────────────────────────────────────────
@dataclass(frozen=True)
class SessionResult:
    """Returned by :meth:`CheetahClawsAdapter.spawn_session`."""

    session_id: str
    status: str = "spawned"


@dataclass(frozen=True)
class TaskResult:
    """Returned by :meth:`CheetahClawsAdapter.collect_result`."""

    session_id: str
    status: str
    output: Optional[str] = None
    error: Optional[str] = None
    duration_ms: Optional[float] = None


# ── connection helper ────────────────────────────────────────────────────────
class _UnixHTTPConnection(http.client.HTTPConnection):
    """HTTPConnection that speaks over a Unix domain socket."""

    def __init__(self, socket_path: str, timeout: float = 30.0) -> None:
        super().__init__("localhost", timeout=timeout)
        self._socket_path = socket_path

    def connect(self) -> None:  # noqa: D401
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(self._socket_path)


def _open_conn(target: str, timeout: float) -> http.client.HTTPConnection:
    """Build an HTTP connection from a ``unix://`` or ``tcp://`` target."""
    if target.startswith("unix://"):
        return _UnixHTTPConnection(target[len("unix://") :], timeout=timeout)
    if target.startswith("tcp://"):
        host_port = target[len("tcp://"):]
        host, _, port_s = host_port.rpartition(":")
        return http.client.HTTPConnection(host, int(port_s), timeout=timeout)
    raise ValueError(f"unsupported daemon target {target!r}; use unix:// or tcp://")


def _load_client_id() -> Optional[str]:
    """Return persisted client id, or ``None`` if not yet registered."""
    try:
        if CLIENT_ID_FILE.exists():
            return CLIENT_ID_FILE.read_text().strip() or None
    except OSError:
        pass
    return None


def _save_client_id(cid: str) -> None:
    CLIENT_ID_FILE.parent.mkdir(parents=True, exist_ok=True)
    CLIENT_ID_FILE.write_text(cid)
    try:
        CLIENT_ID_FILE.chmod(0o600)
    except OSError:
        pass


# ── main adapter ─────────────────────────────────────────────────────────────
class CheetahClawsAdapter:
    """JSON-RPC 2.0 client for the CheetahClaws daemon.

    Parameters
    ----------
    daemon_url:
        ``unix://…`` or ``tcp://host:port``.  Defaults to the socket path
        set by ``cheetahclaws serve``.
    token:
        Optional bearer token for daemon authentication.
        Leave ``None`` for local-loop (Unix socket, peer-uid auth only).
    """

    def __init__(
        self,
        daemon_url: str = DEFAULT_SOCKET,
        token: Optional[str] = None,
        connect_timeout: float = CONNECT_TIMEOUT_S,
        request_timeout: float = REQUEST_TIMEOUT_S,
    ) -> None:
        self._daemon_url = daemon_url
        self._token = token or os.environ.get("CHEETAHCLAWS_TOKEN")
        self._connect_timeout = connect_timeout
        self._request_timeout = request_timeout
        self._client_id = _load_client_id()

    # ── public API ──────────────────────────────────────────────────────────
    def spawn_session(self, task: str, model: str = "default") -> SessionResult:
        """Start a CheetahClaws agent session.

        Sends ``agent.spawn`` to the daemon.  If the daemon returns a
        new ``X-Client-Id`` header the id is persisted for future calls.
        """
        params: dict[str, Any] = {"task": task, "model": model}
        result = self._call("agent.spawn", params)
        cid = result.get("session_id") or result.get("id", "")
        return SessionResult(session_id=str(cid))

    def send_task(self, session_id: str, message: str) -> dict[str, Any]:
        """Send a follow-up message to an active session.

        Sends ``agent.send`` to the daemon.
        """
        params: dict[str, Any] = {
            "session_id": session_id,
            "message": message,
        }
        return self._call("agent.send", params)

    def collect_result(
        self,
        session_id: str,
        timeout: float = REQUEST_TIMEOUT_S,
        poll_interval: float = 1.0,
    ) -> TaskResult:
        """Wait for *session_id* to finish and return structured result.

        Polls ``agent.status`` until the session reaches a terminal state
        (``completed``, ``failed``, ``cancelled``) or *timeout* seconds
        elapse.  Returns a :class:`TaskResult` regardless.
        """
        deadline = time.monotonic() + timeout
        started = time.monotonic()
        last: Optional[dict[str, Any]] = None
        while True:
            last = self._call("agent.status", {"session_id": session_id})
            status = str(last.get("status", ""))
            if status in ("completed", "failed", "cancelled"):
                break
            if time.monotonic() >= deadline:
                # timeout — return partial info
                return TaskResult(
                    session_id=session_id,
                    status="timeout",
                    output=last.get("output"),
                    error="collect_result timed out waiting for terminal state",
                    duration_ms=(time.monotonic() - started) * 1000,
                )
            time.sleep(min(poll_interval, max(0, deadline - time.monotonic())))
        duration = (time.monotonic() - started) * 1000
        return TaskResult(
            session_id=session_id,
            status=status,
            output=last.get("output"),
            error=last.get("error"),
            duration_ms=duration,
        )

    def ping(self) -> dict[str, Any]:
        """Health check — calls ``echo.ping`` on the daemon."""
        return self._call("echo.ping", {})

    # ── internals ───────────────────────────────────────────────────────────
    def _call(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        """Send one JSON-RPC 2.0 request and return the ``result`` field."""
        envelope: dict[str, Any] = {
            "jsonrpc": "2.0",
            "id": int(time.time() * 1000),
            "method": method,
            "params": params,
        }
        body = json.dumps(envelope).encode()
        headers = self._build_headers()
        conn = _open_conn(self._daemon_url, self._connect_timeout)
        try:
            conn.request(
                "POST",
                "/rpc",
                body=body,
                headers=headers,
            )
            response = conn.getresponse()
            raw = response.read().decode("utf-8", errors="replace")
        finally:
            conn.close()
        if response.status != 200:
            raise CheetahClawsError(
                f"daemon returned HTTP {response.status}: {raw[:300]}"
            )
        parsed = json.loads(raw)
        if "error" in parsed:
            err = parsed["error"]
            raise CheetahClawsError(
                f"daemon error {err.get('code')}: {err.get('message')}"
            )
        return parsed.get("result", {})

    def _build_headers(self) -> dict[str, str]:
        h: dict[str, str] = {
            CONTENT_TYPE_HEADER: "application/json",
            API_VERSION_HEADER: API_VERSION,
            CLIENT_KIND_HEADER: CLIENT_KIND,
        }
        if self._client_id:
            h[CLIENT_ID_HEADER] = self._client_id
        if self._token:
            h[AUTH_HEADER] = f"Bearer {self._token}"
        return h


# ── exception ────────────────────────────────────────────────────────────────
class CheetahClawsError(Exception):
    """Raised when the daemon returns an error or is unreachable."""

