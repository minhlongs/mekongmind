#!/bin/bash
cd /Users/macbook/mekong-cli
# Source ALL env files and export
set -a
[ -f /Users/macbook/.mekong/.env ] && source /Users/macbook/.mekong/.env
[ -f /Users/macbook/.zshenv ] && source /Users/macbook/.zshenv
set +a
# Verify token loaded
echo "GITHUB_TOKEN loaded: $([ -n \"$GITHUB_TOKEN\" ] && echo YES || echo NO)"
source .venv/bin/activate
exec python3 scripts/openclaw-daemon.py
