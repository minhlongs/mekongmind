#!/usr/bin/env bash
# Mekong IDE CI runner launcher — pins DNS to 1.1.1.1/8.8.8.8 to work around
# macOS local DNS proxy (Cloudflare WARP-style local proxy) that leaves launchd- and
# tmux-spawned processes unable to resolve github.com.
#
# Usage: tmux new-session -d -s mekong-runner -c ~/actions-runner-mekong './start-runner.sh'
set -eo pipefail

cd "$(dirname "$0")"

NEED_FIX=0
if ! nslookup github.com 1.1.1.1 >/dev/null 2>&1; then
  echo "WARN: even 1.1.1.1 can't resolve github.com — upstream issue, continuing anyway"
fi
if ! nslookup github.com >/dev/null 2>&1; then
  NEED_FIX=1
fi

if [ "$NEED_FIX" = "1" ]; then
  echo "→ DNS resolution broken via default resolvers — attempting fix"
  # Requires passwordless sudo for networksetup. See README_DNS.md for setup.
  if sudo -n networksetup -setdnsservers Wi-Fi 1.1.1.1 8.8.8.8 2>/dev/null; then
    echo "✓ DNS servers pinned to 1.1.1.1 / 8.8.8.8"
    sleep 1
    if nslookup github.com >/dev/null 2>&1; then
      echo "✓ github.com resolves"
    else
      echo "ERROR: still broken after pin attempt — manual intervention needed" >&2
      exit 1
    fi
  else
    echo "ERROR: passwordless sudo for networksetup not configured" >&2
    echo "Run once: echo '$(whoami) ALL=(ALL) NOPASSWD: /usr/sbin/networksetup -setdnsservers *' | sudo tee /etc/sudoers.d/mekong-runner-dns" >&2
    echo "Continuing with broken DNS — jobs may fail at checkout step" >&2
  fi
fi

echo "→ launching actions runner"
exec ./run.sh
