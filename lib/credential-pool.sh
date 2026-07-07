#!/bin/bash
# credential-pool.sh — Hermes credential_pool.py pattern for MEKONG
# Multi-credential rotation + eager fallback on auth errors
# Never uses same credential twice in a row when possible

set -euo pipefail

CRED_DIR="/Users/macbook/Documents/me-deep-wrapper/.credentials"
CRED_CACHE="$CRED_DIR/.credential-cache.json"

mkdir -p "$CRED_DIR" 2>/dev/null || true

# Rotate to next available credential
# Usage: credential_rotate <service> [credential_id]
credential_rotate() {
  local service="${1:-default}"
  local exclude="${2:-}"

  python3 -c "
import json, os, sys, glob, random

service = '$service'
exclude = '$exclude'
cache_file = '$CRED_CACHE'

# Load or init cache
if os.path.exists(cache_file):
    try:
        cache = json.load(open(cache_file))
    except:
        cache = {}
else:
    cache = {}

# Scan credential files
cred_dir = '$CRED_DIR'
creds = []
for f in sorted(glob.glob(os.path.join(cred_dir, f'{service}-*.env'))):
    cid = os.path.basename(f).replace(f'{service}-', '').replace('.env', '')
    if cid and cid != exclude:
        creds.append({'id': cid, 'file': f, 'last_used': cache.get(cid, {}).get('last_used', 0)})

if not creds:
    print('NO_CREDENTIALS')
    sys.exit(1)

# Sort by last_used (oldest first = rotation)
creds.sort(key=lambda x: x['last_used'])

# Pick the least recently used
chosen = creds[0]

# Update cache
cache[chosen['id']] = {'last_used': __import__('time').time(), 'service': service}
with open(cache_file, 'w') as f:
    json.dump(cache, f, indent=2)

print(f'{chosen[\"id\"]}:{chosen[\"file\"]}')
" 2>/dev/null

  if [ $? -ne 0 ]; then
    echo "[credential] No credentials available for $service, using system default"
    return 1
  fi
}

# Eager fallback: try next credential on auth error
# Usage: credential_fallback_call <service> <command> [args...]
credential_fallback_call() {
  local service="${1:-default}"
  shift
  local cmd=("$@")
  local attempts=0
  local max_attempts=3

  while [ $attempts -lt "$max_attempts" ]; do
    # Get current credential (first call) or rotate
    local cred_info
    if [ $attempts -eq 0 ]; then
      cred_info=$(python3 -c "
import json,os,glob
cache_file = '$CRED_CACHE'
if os.path.exists(cache_file):
    try: cache = json.load(open(cache_file))
    except: cache = {}
creds = [os.path.basename(f).replace('$service-','').replace('.env','') 
         for f in sorted(glob.glob('$CRED_DIR/$service-*.env'))]
if creds: print(creds[0])
else: print('default')
" 2>/dev/null || echo "default")
    else
      cred_info=$(credential_rotate "$service" "$prev_cred")
      [ $? -ne 0 ] && break
    fi

    prev_cred="${cred_info%%:*}"
    export MEKONG_CREDENTIAL_ID="$prev_cred"

    echo "[credential] Attempt $((attempts+1)) with credential: $prev_cred"
    if "${cmd[@]}" 2>/dev/null; then
      return 0
    fi

    # Check if it was an auth error
    local exit_code=$?
    if [ $exit_code -eq 2 ]; then
      echo "[credential] Auth error, rotating credential..." >&2
      attempts=$((attempts + 1))
      continue
    fi

    # Non-auth error, don't retry
    return $exit_code
  done

  echo "[credential] All $max_attempts credentials exhausted for $service" >&2
  return 1
}

# Check credential health
credential_health() {
  python3 -c "
import json, os, glob, datetime

service = 'default'
cache_file = '$CRED_CACHE'
cred_dir = '$CRED_DIR'

creds = []
for f in sorted(glob.glob(os.path.join(cred_dir, '*.env'))):
    cid = os.path.basename(f).replace('.env', '')
    mtime = datetime.datetime.fromtimestamp(os.path.getmtime(f))
    creds.append({'id': cid, 'last_modified': str(mtime.date())})

cache = {}
if os.path.exists(cache_file):
    try: cache = json.load(open(cache_file))
    except: pass

print(f'Credential Pool: {len(creds)} credentials')
for c in creds[:10]:
    lu = cache.get(c['id'], {}).get('last_used', 0)
    if lu:
        ago = datetime.datetime.now() - datetime.datetime.fromtimestamp(lu)
        print(f'  {c[\"id\"]}: last used {ago.seconds//3600}h ago')
    else:
        print(f'  {c[\"id\"]}: never used')
" 2>/dev/null
}

export -f credential_rotate credential_fallback_call credential_health
