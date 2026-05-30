#!/usr/bin/env bash
# 4-project quick start — start master view + auto-attach
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/4-project-master.sh" start
sleep 1
"$SCRIPT_DIR/4-project-master.sh" attach
