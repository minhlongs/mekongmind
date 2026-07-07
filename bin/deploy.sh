#!/usr/bin/env bash
set -euo pipefail
# deploy.sh — install bin/me to /usr/local/bin/me (symlink or copy)
# Requires sudo because /usr/local/bin is root-owned.
DEST="/usr/local/bin/me"
SRC="$(cd "$(dirname "$0")" && pwd)/me"
if [ ! -f "$SRC" ]; then
  echo "ERROR: source $SRC not found" >&2
  exit 1
fi
if [ -L "$DEST" ] || [ -f "$DEST" ]; then
  echo "Replacing existing $DEST"
  sudo rm -f "$DEST"
fi
sudo ln -s "$SRC" "$DEST"
echo "Deployed: $DEST -> $SRC"
ls -l "$DEST"
