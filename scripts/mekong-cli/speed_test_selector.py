#!/usr/bin/env python3
# speed_test_selector.py - Dynamically selects the fastest network path from M1 Max to M1 Pro
# Resolves mDNS hostname, lists unique IPv4 and IPv6 candidates, tests port 22,
# and performs a lightweight 2MB SSH speed test to find the highest bandwidth route.
# Features hysteresis and grouping to prevent route thrashing.

import subprocess
import time
import sys
import os
import json

M1PRO_MDNS = "MacBook-Pro-cua-MACBOOK-2.local"
HARDCODED_IPS = [
    "192.168.11.111",
    "192.168.11.48",
    "192.168.11.38",
    "fe80::880:ec9b:cd68:a25c",
    "fe80::1069:9169:4bda:d021",
    "fe80::8d4:42ca:bab:e67d"
]

# Physical interface groups to prevent thrashing between different IPs on the same link
GROUPS = {
    "ethernet": ["192.168.11.111", "fe80::880:ec9b:cd68:a25c"],
    "wifi": ["192.168.11.48", "fe80::1069:9169:4bda:d021", "192.168.11.38", "fe80::8d4:42ca:bab:e67d"],
    "tailscale": ["100."]
}

# Hysteresis threshold: alternative interface must be at least 20% faster to trigger a switch
HYSTERESIS_THRESHOLD = 0.20
CACHE_FILE = "/tmp/m1pro-best-ip"

def normalize_ip(ip):
    if not ip:
        return ""
    ip_clean = ip.split("%")[0].lower()
    import re
    # Normalize fe80:<iface_index>:: to fe80::
    ip_clean = re.sub(r'^fe80:[0-9a-fA-F]+::', 'fe80::', ip_clean)
    return ip_clean

def find_matching_ip(ip, target_list_or_dict):
    if not ip:
        return None
    ip_norm = normalize_ip(ip)
    for key in target_list_or_dict:
        if normalize_ip(key) == ip_norm:
            return key
    return None

def get_ip_group(ip):
    if not ip:
        return "other"
    ip_clean = normalize_ip(ip)
    ip_lower = ip.lower()
    
    # 1. Match against hardcoded GROUPS first (using normalized IP without scope ID)
    for group_name, members in GROUPS.items():
        for member in members:
            if normalize_ip(member) == ip_clean:
                return group_name
                
    # 2. Fallback pattern checks
    if "100." in ip_lower:
        return "tailscale"
    if "%bridge" in ip_lower:
        return "thunderbolt"
    if "%en0" in ip_lower:
        return "wifi"
    # Labeled active ethernet devices: en4, en5, en6, en7, en8, en9, en10
    for eth_iface in ["%en4", "%en5", "%en6", "%en7", "%en8", "%en9", "%en10"]:
        if eth_iface in ip_lower:
            return "ethernet"
    if "192.168.11.111" in ip_lower:
        return "ethernet"
    if "192.168.11.38" in ip_lower or "192.168.11.48" in ip_lower:
        return "wifi"
    return f"other_{ip_clean}"

def get_active_interfaces():
    ifaces = ["en0"]
    try:
        out = subprocess.check_output(["ifconfig"], stderr=subprocess.DEVNULL).decode()
        current_iface = None
        for line in out.splitlines():
            if line and not line.startswith("\t") and not line.startswith(" "):
                parts = line.split(":")
                if parts:
                    current_iface = parts[0].strip()
            elif "status: active" in line and current_iface:
                if current_iface not in ifaces:
                    ifaces.append(current_iface)
    except Exception:
        pass
    return ifaces

def resolve_mdns():
    ips = []
    try:
        out = subprocess.check_output(["dscacheutil", "-q", "host", "-a", "name", M1PRO_MDNS], stderr=subprocess.DEVNULL).decode()
        for line in out.splitlines():
            line = line.strip()
            if line.startswith("ip_address:") or line.startswith("ipv6_address:"):
                ip = line.split(":", 1)[1].strip()
                ips.append(ip)
    except Exception:
        pass
    return ips

def resolve_tailscale():
    ips = []
    try:
        tailscale_bin = "tailscale"
        if os.path.exists("/opt/homebrew/bin/tailscale"):
            tailscale_bin = "/opt/homebrew/bin/tailscale"
        elif os.path.exists("/usr/local/bin/tailscale"):
            tailscale_bin = "/usr/local/bin/tailscale"
            
        out = subprocess.check_output([
            tailscale_bin,
            "--socket=/tmp/tailscaled.sock",
            "status"
        ], stderr=subprocess.DEVNULL).decode()
        for line in out.splitlines():
            line = line.strip()
            if "macbook-pro-cua-macbook-2" in line.lower():
                parts = line.split()
                if parts:
                    ip = parts[0]
                    if ip.startswith("100."):
                        ips.append(ip)
    except Exception:
        pass
    return ips

def is_port_open(ip, port=2222):
    try:
        is_ipv6 = ":" in ip
        cmd = ["nc", "-z", "-G", "1"]
        if is_ipv6:
            cmd.append("-6")
        cmd.extend([ip, str(port)])
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=1.5)
        return res.returncode == 0
    except Exception:
        return False

def measure_ssh_speed(ip):
    # 1. Measure handshake time
    handshake_cmd = [
        "ssh",
        "-i", "/Users/macbook/.ssh/id_ed25519",
        "-o", "ConnectTimeout=2",
        "-o", "StrictHostKeyChecking=no",
        "-o", "ProxyCommand=none",
        "-p", "2222",
        "macbookprom1@" + ip,
        "true"
    ]
    try:
        t0 = time.time()
        res = subprocess.run(handshake_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=2.0)
        handshake_time = (time.time() - t0) * 1000
        if res.returncode != 0:
            return 999999.0
    except Exception:
        return 999999.0

    # 2. Run SSH command to download 10MB of zero bytes (increased from 5MB for bandwidth accuracy)
    cmd = [
        "ssh",
        "-i", "/Users/macbook/.ssh/id_ed25519",
        "-o", "ConnectTimeout=2",
        "-o", "StrictHostKeyChecking=no",
        "-o", "ProxyCommand=none",
        "-p", "2222",
        "macbookprom1@" + ip,
        "dd if=/dev/zero bs=1m count=10 2>/dev/null"
    ]
    try:
        start = time.time()
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=6.0)
        end = time.time()
        if res.returncode == 0:
            total_time = (end - start) * 1000
            # Subtract handshake time to get pure transfer time
            transfer_time = max(1.0, total_time - handshake_time)
            return transfer_time
    except Exception:
        pass
    return 999999.0


def main():
    candidates = list(HARDCODED_IPS)
    mdns_ips = resolve_mdns()
    for ip in mdns_ips:
        if ip not in candidates:
            candidates.append(ip)
            
    ts_ips = resolve_tailscale()
    for ip in ts_ips:
        if ip not in candidates:
            candidates.append(ip)
            
    active_ifaces = get_active_interfaces()
    
    formatted = []
    for c in candidates:
        c_raw = c.split("%")[0]
        if ":" in c_raw:
            if c_raw.startswith("fe80:"):
                for iface in active_ifaces:
                    formatted.append(f"{c_raw}%{iface}")
            else:
                formatted.append(c_raw)
        else:
            formatted.append(c_raw)
            
    unique_formatted = []
    for f in formatted:
        if f not in unique_formatted:
            unique_formatted.append(f)
            
    reachable = []
    for ip in unique_formatted:
        if is_port_open(ip):
            reachable.append(ip)
            
    if not reachable:
        sys.exit(1)
        
    if len(reachable) == 1:
        print(reachable[0])
        sys.exit(0)
        
    # Read current cached IP
    current_ip = None
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r") as f:
                current_ip = f.read().strip()
        except Exception:
            pass

    # Speed Cache Configuration
    SPEED_CACHE_FILE = "/tmp/m1pro-speed-cache.json"
    SPEED_CACHE_TTL = 300  # 5 minutes in seconds
    cached_results = {}
    cache_valid = False

    if os.path.exists(SPEED_CACHE_FILE):
        try:
            mtime = os.path.getmtime(SPEED_CACHE_FILE)
            if time.time() - mtime < SPEED_CACHE_TTL:
                with open(SPEED_CACHE_FILE, "r") as f:
                    cached_results = json.load(f)
                cache_valid = True
        except Exception:
            pass

    # Clear cache if the set of reachable candidates has changed (network interface transition detected)
    if cache_valid:
        reachable_set = {normalize_ip(ip) for ip in reachable}
        cached_set = {normalize_ip(ip) for ip in cached_results.keys()}
        if reachable_set != cached_set:
            cache_valid = False
            cached_results = {}

    # Measure speed for all reachable candidates
    results = {}
    cache_updated = False
    for ip in reachable:
        if cache_valid and ip in cached_results:
            results[ip] = cached_results[ip]
        else:
            duration = measure_ssh_speed(ip)
            results[ip] = duration
            cached_results[ip] = duration
            cache_updated = True

    # Save updated cache if any new measurements were made
    if cache_updated or not cache_valid:
        try:
            with open(SPEED_CACHE_FILE, "w") as f:
                json.dump(cached_results, f)
        except Exception:
            pass

    # Find the best IP for each group
    group_best = {} # group_name -> (ip, duration)
    for ip, duration in results.items():
        g = get_ip_group(ip)
        if g not in group_best or duration < group_best[g][1]:
            group_best[g] = (ip, duration)

    # Determine baseline for current active connection
    current_group = get_ip_group(current_ip) if current_ip else None
    baseline_ip = None
    baseline_duration = 999999.0

    matched_current_ip = find_matching_ip(current_ip, results)
    if matched_current_ip and results[matched_current_ip] < 999999.0:
        baseline_ip = matched_current_ip
        baseline_duration = results[matched_current_ip]
    elif current_group and current_group in group_best:
        # Fall back to best IP in the same group if current IP is dead but group is alive
        baseline_ip, baseline_duration = group_best[current_group]

    # Find overall best IP from any group
    overall_best_ip = None
    overall_best_duration = 999999.0
    overall_best_group = None

    for g, (ip, duration) in group_best.items():
        if duration < overall_best_duration:
            overall_best_duration = duration
            overall_best_ip = ip
            overall_best_group = g

    # Decision logic applying intra-group stability and inter-group hysteresis
    selected_ip = None

    if baseline_ip and baseline_duration < 999999.0:
        current_group = get_ip_group(current_ip)
        best_group = get_ip_group(overall_best_ip)
        
        if current_group == best_group:
            # Intra-group stability: keep current IP to avoid disruptive proxy/SSH recycling
            selected_ip = baseline_ip
        else:
            # Inter-group transition: only switch if the new group offers >= HYSTERESIS_THRESHOLD speed improvement
            improvement = (baseline_duration - overall_best_duration) / baseline_duration
            if improvement >= HYSTERESIS_THRESHOLD and overall_best_duration < 999999.0:
                selected_ip = overall_best_ip
            else:
                selected_ip = baseline_ip
    else:
        # No valid baseline, choose overall best
        selected_ip = overall_best_ip

    if not selected_ip:
        # Final fallback
        selected_ip = reachable[0]

    print(selected_ip)

if __name__ == "__main__":
    main()
