#!/usr/bin/env python3
"""cc-mcp-server: Expose CheetahClaws AI OS capabilities as MCP tools.

Run as stdio server for OpenCode MCP integration:
  python3 cc-mcp-server.py

OpenCode config:
  "mcp": {
    "cc-ai-os": {
      "command": ["python3", "/path/to/cc-mcp-server.py"],
      "enabled": true,
      "type": "local"
    }
  }
"""
import json, os, sys
from pathlib import Path

CC_SITE = Path(os.path.expanduser("~/.local/share/uv/tools/cheetahclaws/lib/python3.14/site-packages"))
sys.path.insert(0, str(CC_SITE))

os.environ["LANG"] = os.environ.get("LANG", "en_US.UTF-8")
os.environ["TERM"] = os.environ.get("TERM", "xterm-256color")

from cc_config import load_config
from cheetahclaws import COMMANDS, handle_slash

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("CheetahClaws AI OS", log_level="ERROR")

class _State:
    conversation = []
    def __init__(self):
        self.conversation = []

_config = load_config()
_state = _State()

def _run_cmd(name: str, args: str = "") -> str:
    """Execute a CheetahClaws slash command and return text output."""
    import io
    old_stdout = sys.stdout
    sys.stdout = buf = io.StringIO()
    try:
        handle_slash(f"/{name} {args}".strip(), _state, _config)
    except Exception as e:
        sys.stdout = old_stdout
        return f"[error] {e}"
    sys.stdout = old_stdout
    return buf.getvalue().strip()

def _run_cmd_direct(name: str, args: str = "") -> str:
    """Call a COMMANDS handler directly (bypass handle_slash)."""
    handler = COMMANDS.get(name)
    if not handler:
        return f"[error] unknown command: {name}"
    import io
    old_stdout = sys.stdout
    sys.stdout = buf = io.StringIO()
    try:
        handler(args, _state, _config)
    except Exception as e:
        sys.stdout = old_stdout
        return f"[error] {e}"
    sys.stdout = old_stdout
    return buf.getvalue().strip()

# ── Memory ────────────────────────────────────────────────────────────────

@mcp.tool(description="Search CheetahClaws persistent memory")
def cc_memory_search(query: str, limit: int = 10) -> str:
    return _run_cmd("memory", f"search {query}")

@mcp.tool(description="Consolidate session memories into long-term memory")
def cc_memory_consolidate() -> str:
    return _run_cmd("memory", "consolidate")

# ── Tasks ─────────────────────────────────────────────────────────────────

@mcp.tool(description="List CheetahClaws tasks (omit status for all, or: todo / in-progress / done)")
def cc_tasks_list(status: str = "") -> str:
    if status in ("todo", "in-progress", "done"):
        return _run_cmd_direct("tasks", status)
    return _run_cmd_direct("tasks", "")

@mcp.tool(description="Create a new task in CheetahClaws")
def cc_tasks_create(subject: str) -> str:
    return _run_cmd_direct("tasks", f"create {subject}")

@mcp.tool(description="Mark a task as done by ID")
def cc_tasks_done(task_id: str) -> str:
    return _run_cmd_direct("tasks", f"done {task_id}")

@mcp.tool(description="Mark a task as in-progress by ID")
def cc_tasks_start(task_id: str) -> str:
    return _run_cmd_direct("tasks", f"start {task_id}")

@mcp.tool(description="Delete a task by ID")
def cc_tasks_delete(task_id: str) -> str:
    return _run_cmd_direct("tasks", f"delete {task_id}")

# ── Agents ────────────────────────────────────────────────────────────────

@mcp.tool(description="List running CheetahClaws background agents")
def cc_agents_list() -> str:
    return _run_cmd("agent", "list")

@mcp.tool(description="Start an autonomous agent (research_assistant / auto_bug_fixer / paper_writer / auto_coder)")
def cc_agents_start(template: str, args: str = "") -> str:
    return _run_cmd("agent", f"start {template} {args}".strip())

@mcp.tool(description="Stop a running agent by name")
def cc_agents_stop(name: str) -> str:
    return _run_cmd("agent", f"stop {name}")

# ── Skills ────────────────────────────────────────────────────────────────

@mcp.tool(description="List available CheetahClaws skills")
def cc_skills_list() -> str:
    return _run_cmd("skills")

# ── MCP System ────────────────────────────────────────────────────────────

@mcp.tool(description="List CheetahClaws MCP servers and their tools")
def cc_mcp_list() -> str:
    return _run_cmd("mcp")

# ── Plugins ───────────────────────────────────────────────────────────────

@mcp.tool(description="List CheetahClaws plugins")
def cc_plugins_list() -> str:
    return _run_cmd("plugin")

@mcp.tool(description="Install a CheetahClaws plugin by name@url")
def cc_plugins_install(name_url: str) -> str:
    return _run_cmd("plugin", f"install {name_url}")

# ── Brainstorm ────────────────────────────────────────────────────────────

@mcp.tool(description="Run multi-persona brainstorm on a topic via CheetahClaws")
def cc_brainstorm(topic: str) -> str:
    return _run_cmd("brainstorm", topic)

# ── Research Lab ──────────────────────────────────────────────────────────

@mcp.tool(description="Start CheetahClaws multi-agent research lab on a topic")
def cc_lab_start(topic: str) -> str:
    return _run_cmd("lab", f"start {topic}")

@mcp.tool(description="Check CheetahClaws research lab status")
def cc_lab_status() -> str:
    return _run_cmd("lab", "status")

# ── Trading ───────────────────────────────────────────────────────────────

@mcp.tool(description="Analyze a trading symbol with multi-agent debate")
def cc_trading_analyze(symbol: str) -> str:
    return _run_cmd("trading", f"analyze {symbol}")

@mcp.tool(description="Get current price for a trading symbol")
def cc_trading_price(symbol: str) -> str:
    return _run_cmd("trading", f"price {symbol}")

# ── Monitor ───────────────────────────────────────────────────────────────

@mcp.tool(description="Run CheetahClaws AI monitor on a topic or all subscriptions")
def cc_monitor_run(topic: str = "") -> str:
    args = f"run {topic}" if topic else "run"
    return _run_cmd("monitor", args)

@mcp.tool(description="Check CheetahClaws monitor scheduler status")
def cc_monitor_status() -> str:
    return _run_cmd("monitor", "status")

# ── Plan Mode ─────────────────────────────────────────────────────────────

@mcp.tool(description="Enter CheetahClaws plan mode (write-protect code)")
def cc_plan_start(description: str) -> str:
    return _run_cmd("plan", description)

@mcp.tool(description="Exit CheetahClaws plan mode")
def cc_plan_done() -> str:
    return _run_cmd("plan", "done")

# ── SSJ (Developer Power Menu) ────────────────────────────────────────────

@mcp.tool(description="Open CheetahClaws SSJ Developer Mode power menu")
def cc_ssj() -> str:
    return _run_cmd("ssj")

# ── Main ──────────────────────────────────────────────────────────────────

def main():
    mcp.run(transport="stdio")

if __name__ == "__main__":
    main()
