#!/bin/bash
# cc-mcp-wrapper.sh — Wrapper for Mekong CLI MCP server
# Runs the canonical MCP server from ~/mekong-cli/src/core/mcp_server.py
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MEKONG_CLI_DIR="$HOME/mekong-cli"
PYTHONPATH="$MEKONG_CLI_DIR${PYTHONPATH:+:$PYTHONPATH}"
export PYTHONPATH
exec python3 -m src.core.mcp_server "$@"
