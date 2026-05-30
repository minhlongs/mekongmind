# Phase 18: Redis Cluster Implementation

**Priority:** P0 - Critical for Scale
**Status:** ✅ COMPLETE (95%)
**Timeline:** Week 13
**Completed:** 2026-03-22

---

## Overview

Implement 6-node Redis Cluster (3 masters + 3 replicas) for horizontal scaling and high availability. This phase enables algo-trader to handle 1000+ concurrent WebSocket connections and provides fault tolerance for production trading.

---

## Key Insights

- Current setup: Single Redis instance (no HA, no sharding)
- Target: 6-node cluster with automatic failover
- Migration path: Zero-downtime for idempotency store
- Fastify adapter needed for cluster mode
- Load test target: 1000 concurrent connections

---

## Requirements

### Functional
1. Docker Compose with 6 Redis nodes (3 masters, 3 replicas)
2. Cluster initialization script (auto-create slots)
3. Migrate idempotency store to cluster mode
4. Fastify Redis WS adapter for cluster
5. Load testing: 1000 concurrent connections, p95 < 50ms

### Non-Functional
- Zero-downtime migration
- Automatic failover < 30s
- Data persistence (RDB + AOF)
- Monitoring: cluster health, slot coverage

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Network                         │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Redis Master│  │ Redis Master│  │ Redis Master│     │
│  │   Node 0    │  │   Node 1    │  │   Node 2    │     │
│  │  :7000      │  │  :7001      │  │  :7002      │     │
│  │  Slots 0-   │  │  Slots 5462-│  │  Slots10923-│     │
│  │  [Replica: │  │  [Replica:  │  │  [Replica:  │     │
│  │   Node 3]   │  │   Node 4]   │  │   Node 5]   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           algo-trader (cluster client)          │   │
│  │  ioredis with cluster mode                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## File Ownership

**This phase owns:**
- `docker-compose.redis-cluster.yml` — NEW: 6-node cluster config
- `scripts/redis-cluster-init.sh` — NEW: Cluster bootstrap script
- `src/redis/cluster-config.ts` — NEW: Cluster client config
- `src/redis/index.ts` — MODIFY: Support cluster mode
- `src/redis/idempotency-store.ts` — MODIFY: Cluster-compatible
- `src/api/ws-adapter-redis.ts` — NEW: Fastify cluster adapter
- `tests/load/redis-cluster-load-test.ts` — NEW: k6 load test
- `docs/redis-cluster-runbook.md` — NEW: Operations runbook

---

## Implementation Steps

### 1. Docker Compose Cluster (`docker-compose.redis-cluster.yml`)
- [ ] 6 Redis nodes (7000-7005)
- [ ] Cluster bus ports (17000-17005)
- [ ] Shared network (algo-trader-net)
- [ ] Volume persistence per node
- [ ] Health checks for each node

### 2. Cluster Init Script (`redis-cluster-init.sh`)
- [ ] Create cluster: `redis-cli --cluster create`
- [ ] Assign slots: 5461 slots per master
- [ ] Assign replicas: 1 replica per master
- [ ] Wait for cluster ready: `CLUSTER INFO` check
- [ ] Auto-retry on failure

### 3. Redis Cluster Client (`cluster-config.ts`)
- [ ] ioredis Cluster config
- [ ] DNS lookup for Docker nodes
- [ ] Retry strategy with backoff
- [ ] Connection pool settings
- [ ] Export cluster client instance

### 4. Idempotency Store Migration
- [ ] Update imports to use cluster client
- [ ] Test key distribution across slots
- [ ] Verify TTL works in cluster mode
- [ ] Add cluster-specific error handling

### 5. Fastify Redis WS Adapter
- [ ] WebSocket adapter using cluster client
- [ ] Pub/Sub across cluster nodes
- [ ] Subscribe to spread channels
- [ ] Publish real-time updates

### 6. Load Testing
- [ ] k6 script: 1000 concurrent connections
- [ ] Measure p95 latency, error rate
- [ ] Test failover (kill master node)
- [ ] Verify auto-reconnect < 30s

### 7. Operations Runbook
- [ ] Cluster health check commands
- [ ] Failover testing procedure
- [ ] Backup/restore process
- [ ] Monitoring metrics (slot coverage, connected clients)

---

## Success Criteria

| Criterion | Target | Status | Verification |
|-----------|--------|--------|--------------|
| Cluster nodes | 6/6 healthy | ✅ Config ready | `docker-compose.redis-cluster.yml` |
| Slot coverage | 16384/16384 | ✅ Script ready | `redis-cluster-init.sh` |
| Load test script | 1000 connections | ✅ k6 ready | `tests/load/redis-cluster-load-test.ts` |
| p95 latency | < 50ms | ⏳ Live test pending | Need Docker |
| Failover time | < 30s | ⏳ Live test pending | Need Docker |
| Zero downtime | No connection drops | ✅ Code ready | Migration logic in place |

---

## Todo List

- [x] 1. Create docker-compose.redis-cluster.yml ✅
- [x] 2. Create redis-cluster-init.sh ✅
- [x] 3. Create cluster-config.ts ✅
- [x] 4. Update redis/index.ts for cluster support ✅
- [x] 5. Migrate idempotency-store.ts ✅ (integrated in ws-adapter)
- [x] 6. Create ws-adapter-redis.ts for cluster ✅
- [x] 7. Create k6 load test script ✅
- [x] 8. Create redis-cluster-runbook.md ✅
- [ ] 9. Run load test and verify metrics ⏳ (need cluster running)
- [ ] 10. Test failover manually ⏳ (need cluster running)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cluster init fails | Blocked | Auto-retry, manual fallback |
| Data loss during migration | High | Backup before migration |
| Failover > 30s | Medium | Tune cluster-node-timeout |
| Load test fails | Medium | Optimize connection pool |

---

## Security Considerations

- No password in code (use env vars)
- Cluster ports not exposed externally
- TLS for client connections (future)
- Redis AUTH enabled in production

---

## Next Steps

After completion:
- **Phase 19:** Signals Marketplace (provider onboarding)
- **Phase 20:** API Access Tier (public endpoints)
- **Phase 21:** Enterprise White-Label

---

**Files to Create:** 8 files
**Files to Modify:** 2 files
**Estimated Time:** 4-6 hours
