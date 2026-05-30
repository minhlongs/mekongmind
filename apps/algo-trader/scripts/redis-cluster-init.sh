#!/bin/bash
#
# Redis Cluster Initialization Script
# Creates 6-node cluster: 3 masters + 3 replicas
#
# Usage: ./scripts/redis-cluster-init.sh
# Prerequisites: docker-compose.redis-cluster.yml must be running

set -e

echo "=== Redis Cluster Initialization ==="
echo ""

# Configuration
REDIS_HOST="127.0.0.1"
MASTER_PORTS=(7000 7001 7002)
REPLICA_PORTS=(7003 7004 7005)
ALL_PORTS=(7000 7001 7002 7003 7004 7005)
CLUSTER_REPLICAS=1

# Step 1: Wait for all nodes to be ready
echo "[1/4] Waiting for all nodes to be ready..."
for port in "${ALL_PORTS[@]}"; do
  attempt=0
  max_attempts=10
  while [ $attempt -lt $max_attempts ]; do
    if redis-cli -h $REDIS_HOST -p $port ping 2>/dev/null | grep -q "PONG"; then
      echo "  ✓ Node :$port ready"
      break
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  if [ $attempt -eq $max_attempts ]; then
    echo "✗ Node :$port not responding after $max_attempts attempts"
    exit 1
  fi
done

# Step 2: Check if cluster already exists
echo ""
echo "[2/4] Checking cluster status..."
existing_cluster=$(redis-cli -h $REDIS_HOST -p 7000 CLUSTER INFO 2>/dev/null | grep -c "cluster_state:ok" || true)

if [ "$existing_cluster" -gt 0 ]; then
  echo "✓ Cluster already initialized"
  redis-cli -h $REDIS_HOST -p 7000 CLUSTER INFO 2>/dev/null | head -5
  echo ""
  echo "=== Cluster Ready ==="
  exit 0
fi

# Step 3: Create cluster
echo ""
echo "[3/4] Creating cluster with ${#MASTER_PORTS[@]} masters + ${#REPLICA_PORTS[@]} replicas..."

# Build command arguments
NODES=""
for port in "${ALL_PORTS[@]}"; do
  NODES="$NODES $REDIS_HOST:$port"
done

echo "  Nodes:$NODES"
echo "  Command: redis-cli --cluster create$NODES --cluster-replicas $CLUSTER_REPLICAS --cluster-yes"
echo ""

# Create cluster (non-interactive with --cluster-yes)
redis-cli --cluster create $NODES --cluster-replicas $CLUSTER_REPLICAS --cluster-yes

# Step 4: Verify cluster
echo ""
echo "[4/4] Verifying cluster..."
sleep 2

# Check cluster state
cluster_state=$(redis-cli -h $REDIS_HOST -p 7000 CLUSTER INFO | grep "cluster_state:" | cut -d: -f2 | tr -d '[:space:]')
cluster_slots_assigned=$(redis-cli -h $REDIS_HOST -p 7000 CLUSTER INFO | grep "cluster_slots_assigned:" | cut -d: -f2 | tr -d '[:space:]')
cluster_slots_ok=$(redis-cli -h $REDIS_HOST -p 7000 CLUSTER INFO | grep "cluster_slots_ok:" | cut -d: -f2 | tr -d '[:space:]')
cluster_known_nodes=$(redis-cli -h $REDIS_HOST -p 7000 CLUSTER INFO | grep "cluster_known_nodes:" | cut -d: -f2 | tr -d '[:space:]')

echo ""
echo "=== Cluster Status ==="
echo "  State: $cluster_state"
echo "  Slots Assigned: $cluster_slots_assigned / 16384"
echo "  Slots OK: $cluster_slots_ok / 16384"
echo "  Known Nodes: $cluster_known_nodes / 6"

if [ "$cluster_state" = "ok" ] && [ "$cluster_slots_assigned" = "16384" ] && [ "$cluster_slots_ok" = "16384" ]; then
  echo ""
  echo "✅ Redis Cluster initialized successfully!"
  echo ""
  echo "Connection string: redis://$REDIS_HOST:7000 (or any node port)"
  echo ""
  echo "Useful commands:"
  echo "  redis-cli -c -h $REDIS_HOST -p 7000 CLUSTER INFO"
  echo "  redis-cli -c -h $REDIS_HOST -p 7000 CLUSTER NODES"
  echo "  redis-cli -c -h $REDIS_HOST -p 7000 CLUSTER SLOTS"
  exit 0
else
  echo ""
  echo "✗ Cluster initialization failed"
  echo "Check logs with: docker-compose -f docker-compose.redis-cluster.yml logs"
  exit 1
fi
