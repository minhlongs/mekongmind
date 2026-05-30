# Sprint Action Items - Algo Trader

**Date:** 2026-03-22
**Sprint:** RaaS $1M Architecture
**Next Sprint:** Phase 18-21 Execution

---

## 🔴 P0 - Immediate (This Week)

### 1. Cap Founder Ops Hours
**Why:** 19h/week không bền vững, burnout risk.

**Action:**
```bash
# Set calendar alarm
calAlarm --title "Founder Ops Stop" --time "10h/week" --repeat weekly

# Delegate to CC CLI
/worker-exec "Continue Phase 18 implementation" --autonomous
```

**Success:** Founder ops < 10h/week for 4 consecutive weeks.

**Owner:** Founder
**Due:** Immediate

---

### 2. Docker Bootstrap Script
**Why:** Manual setup = time wasted + cannot test full stack.

**Action:**
```bash
# Create: scripts/bootstrap-docker.sh
#!/bin/bash
# Check prerequisites
# Install Docker (if missing)
# Start containers: Redis, Postgres, Grafana
# Health check
echo "Infrastructure ready!"
```

**Success:** `./scripts/bootstrap-docker.sh` runs in < 5min.

**Owner:** Dev
**Due:** Week 1

---

### 3. Redis Auto-Start (Dev)
**Why:** Redis required for live trading, usage metering, sessions.

**Action:**
```bash
# macOS: launchd agent
# Create: ~/Library/LaunchAgents/com.algotrader.redis.plist
# Or: brew services start redis
```

**Success:** Redis auto-starts on machine boot.

**Owner:** Dev
**Due:** Week 1

---

## 🟡 P1 - This Sprint (Week 13)

### 4. Phase 18: Redis Cluster
**Why:** Foundation for horizontal scaling.

**Tasks:**
- [ ] Docker Compose: 6-node cluster (3M + 3R)
- [ ] Migrate idempotency store → Redis
- [ ] Fastify Redis WS adapter
- [ ] Load test: 1000 concurrent connections

**Output:** `docs/redis-cluster-setup.md`

**Owner:** Dev Agent
**Due:** End of Week 13

---

### 5. Git Session Checkpoints
**Why:** Lost context when sessions run long.

**Action:**
```bash
# Pre-commit hook: auto-commit every 30min
# Or: git worktree per feature
git worktree add ../phase18-redis phase18-redis
```

**Success:** No lost context, clear git history.

**Owner:** Dev
**Due:** Week 2

---

### 6. Legal Review: Signals Marketplace
**Why:** SEC/CFTC regulatory risk.

**Action:**
- [ ] Consult securities attorney
- [ ] Document compliance requirements
- [ ] Update ADR with legal constraints

**Output:** `docs/legal/signals-marketplace-compliance.md`

**Owner:** CTO + Founder
**Due:** Week 2

---

## 🟢 P2 - Next Sprint (Week 14-16)

### 7. Phase 19: Signals Marketplace
**Why:** $300K ARR revenue stream.

**Tasks:**
- [ ] Provider onboarding flow
- [ ] Signal submission API
- [ ] Polar.sh Connect payout (30% rev share)
- [ ] Validation engine

**Output:** `/api/v1/signals/marketplace` endpoint

**Owner:** Dev Agent
**Due:** End of Week 14

---

### 8. Phase 20: API Access Tier
**Why:** $100K ARR revenue stream.

**Tasks:**
- [ ] `/api/v1/signals` public endpoint
- [ ] API key management dashboard
- [ ] Usage metering + billing integration
- [ ] Tiered rate limiting (FREE/PRO/ENTERPRISE)

**Output:** API docs + Postman collection

**Owner:** Dev Agent
**Due:** End of Week 15

---

### 9. Phase 21: Enterprise White-Label
**Why:** $100K ARR revenue stream ($50K+/client).

**Tasks:**
- [ ] Custom branding config
- [ ] Private deployment option
- [ ] SLA monitoring dashboard (99.9% uptime)

**Output:** Enterprise sales deck

**Owner:** Dev Agent + Founder
**Due:** End of Week 16

---

## 🟣 Infrastructure Improvements

### 10. Auto Session Summaries
**Why:** Better context tracking, less manual work.

**Action:**
```bash
# Hook: end-of-session auto-summary
# Output: plans/reports/session-{date}.md
# Includes: files changed, commands run, decisions made
```

**Owner:** Dev
**Due:** Week 3

---

### 11. Environment Parity
**Why:** Dev/Prod drift causes deployment issues.

**Action:**
```bash
# Docker Compose profiles
docker-compose --profile dev up    # Local dev
docker-compose --profile prod up   # Production-like
```

**Owner:** Dev
**Due:** Week 3

---

## 📊 Tracking Board

| ID | Action Item | Status | Owner | Due |
|----|-------------|--------|-------|-----|
| 1 | Cap founder ops | ⏳ Pending | Founder | Immediate |
| 2 | Docker bootstrap | ⏳ Pending | Dev | Week 1 |
| 3 | Redis auto-start | ⏳ Pending | Dev | Week 1 |
| 4 | Phase 18: Redis | ⏳ Pending | Dev | Week 13 |
| 5 | Git checkpoints | ⏳ Pending | Dev | Week 2 |
| 6 | Legal review | ⏳ Pending | CTO | Week 2 |
| 7 | Signals marketplace | ⏳ Pending | Dev | Week 14 |
| 8 | API access tier | ⏳ Pending | Dev | Week 15 |
| 9 | Enterprise white-label | ⏳ Pending | Dev | Week 16 |
| 10 | Auto session summaries | ⏳ Pending | Dev | Week 3 |
| 11 | Environment parity | ⏳ Pending | Dev | Week 3 |

---

## ✅ Definition of Done

Each action item is complete when:
- [ ] Code committed + tests passing
- [ ] Documentation updated
- [ ] Deployed to dev environment
- [ ] Verified working (manual or automated test)

---

**Action Items Created:** 11 items across P0/P1/P2 priorities.

**Next Review:** Sprint Standup (Week 13, Day 1)
