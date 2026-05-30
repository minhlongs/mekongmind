#!/bin/bash
# auto_proxy_selector.sh - Dynamically switch M1 Max proxy between direct LAN and tunnel
# This script runs as root via a LaunchDaemon on M1 Max.

set -euo pipefail

M1PRO_LAN_IP="192.168.11.111"
M1PRO_WIFI_IP="192.168.11.48"
M1PRO_LAN_PORT=1085
LOCAL_PORT=1080
SERVICES=("Wi-Fi" "USB 10/100/1000 LAN" "USB 10/100/1G/2.5G/5G LAN")

LOGFILE="/Users/macbook/Library/Logs/auto_proxy_selector.log"
mkdir -p "$(dirname "$LOGFILE")"

echo "$(date '+%Y-%m-%d %H:%M:%S') - auto_proxy_selector daemon started." >> "$LOGFILE"

CURRENT_MODE=""
GOST_PID=""

# Cleanup function to kill gost when the daemon exits
cleanup() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - auto_proxy_selector stopping, cleaning up gost..." >> "$LOGFILE"
  if [ -n "$GOST_PID" ] && kill -0 "$GOST_PID" 2>/dev/null; then
    kill "$GOST_PID" 2>/dev/null || true
  fi
  # Also kill any other gost on port 8085 just in case
  pkill -9 -f "gost -L http://127.0.0.1:8085" || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

while true; do
  # Run the Python speed test selector to find the fastest connection
  set +e
  TARGET_IP=$(sudo -u macbook python3 /Users/macbook/.local/bin/speed_test_selector.py 2>/dev/null || echo "")
  set -e
  
  # Cache the best IP to /tmp/m1pro-best-ip
  echo "$TARGET_IP" > /tmp/m1pro-best-ip

  if [ -n "$TARGET_IP" ]; then
    TARGET_MODE="LAN"
    TARGET_PORT="$M1PRO_LAN_PORT"
    # Format forward target for gost (URL encoding % to %25 for IPv6)
    if [[ "$TARGET_IP" == *:* ]]; then
      GOST_IP=$(echo "$TARGET_IP" | sed 's/%/%25/g')
      FORWARD_TARGET="socks5://[$GOST_IP]:$M1PRO_LAN_PORT"
    else
      FORWARD_TARGET="socks5://$TARGET_IP:$M1PRO_LAN_PORT"
    fi
  else
    TARGET_MODE="TUNNEL"
    TARGET_IP="127.0.0.1"
    TARGET_PORT="$LOCAL_PORT"
    FORWARD_TARGET="socks5://127.0.0.1:$LOCAL_PORT"
  fi

  # Check if target mode changed (or specific target IP changed in LAN mode), or if gost is down
  if [ "${CURRENT_MODE:-}" != "$TARGET_MODE" ] || [ "${CURRENT_IP:-}" != "$TARGET_IP" ] || ! lsof -i :8085 >/dev/null 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Route target changed or Gost down: switching to ${TARGET_MODE} mode (${TARGET_IP})" >> "$LOGFILE"
    
    # Terminate old gost processes on port 8085
    pkill -9 -f "gost -L http://127.0.0.1:8085" || true
    sleep 1
    
    echo "Launching Gost bridge (http://127.0.0.1:8085 -> ${FORWARD_TARGET})..." >> "$LOGFILE"
    # Start gost as root/daemon in background
    /opt/homebrew/bin/gost -L "http://127.0.0.1:8085" -F "$FORWARD_TARGET" >> "$LOGFILE" 2>&1 &
    GOST_PID=$!
    
    # Resolve IPv6 to its IPv4 equivalent for networksetup system proxy configuration
    NET_IP="$TARGET_IP"
    if [[ "$TARGET_IP" == *:* ]]; then
      if [[ "$TARGET_IP" == *880:ec9b:cd68:a25c* ]]; then
        NET_IP="$M1PRO_LAN_IP"
      else
        # Dynamically resolve Wi-Fi IP of M1 Pro via mDNS, fallback to M1PRO_WIFI_IP
        RESOLVED_WIFI_IP=$(dscacheutil -q host -a name MacBook-Pro-cua-MACBOOK-2.local 2>/dev/null | awk '/ip_address:/ {print $2}' | grep -v "192.168.11.111" | head -n 1)
        if [ -n "$RESOLVED_WIFI_IP" ]; then
          NET_IP="$RESOLVED_WIFI_IP"
        else
          NET_IP="$M1PRO_WIFI_IP"
        fi
      fi
    fi

    for SERVICE in "${SERVICES[@]}"; do
      # Check if network service exists and is configured
      if networksetup -getinfo "$SERVICE" >/dev/null 2>&1; then
        echo "Updating system proxy for $SERVICE to $NET_IP:$TARGET_PORT" >> "$LOGFILE"
        networksetup -setsocksfirewallproxy "$SERVICE" "$NET_IP" "$TARGET_PORT"
        networksetup -setsocksfirewallproxystate "$SERVICE" on
      fi
    done
    
    # Clean up stale SSH ControlMaster sockets to prevent connections hanging on the old route
    rm -f /Users/macbook/.ssh/cm-*
    pkill -f "ssh: /Users/macbook/.ssh/cm-" || true

    # Recycle SSH agent to force immediate reconnect to the new fastest connection
    echo "Recycling SSH SOCKS connection to force reconnect over new path..." >> "$LOGFILE"
    pkill -u macbook -f "ssh.*m1pro-lan" || true
    
    CURRENT_MODE="$TARGET_MODE"
    CURRENT_IP="$TARGET_IP"
  fi

  sleep 10
done

