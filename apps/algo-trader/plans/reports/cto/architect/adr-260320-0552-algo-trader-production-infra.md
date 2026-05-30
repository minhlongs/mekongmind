---
title: "Algo-Trader Production Infrastructure Architecture"
description: "Architecture Decision Record for hybrid Cloudflare + AWS deployment targeting institutional traders"
status: approved
priority: P1
effort: 3 weeks
branch: HEAD
tags: [architecture, infrastructure, production, cloudflare, aws]
created: 2026-03-20
---

# Architecture Decision Record: Algo-Trader Production Infrastructure

**Date:** 2026-03-20
**Status:** Approved
**Decision Maker:** CTO (OpenClaw)
**Reviewers:** DevOps Lead, Security Lead
**Work Context:** `/Users/macbook/mekong-cli/apps/algo-trader`

---

## 1. Context & Problem Statement

### Current State (MVP Complete)

- 270 tests passing across 6-week MVP sprint
- Code review: 3 CRITICAL + 9 IMPORTANT security issues identified
- Infrastructure: Local Docker Compose only
- Target: Beta launch with 10 institutional traders → $1M ARR

### Business Requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Latency | <100ms end-to-end | Institutional traders expect sub-second execution |
| Uptime | 99.9% SLA | Trading operates 24/7, downtime = lost revenue |
| Security | SOC 2 Type II ready | Institutional due diligence requires compliance |
| Scalability | 10 → 500 → 1000 users | Growth path from beta to scale |
| Cost Efficiency | <$200/mo at 100 users | Preserve runway during beta validation |

### Technical Constraints

1. **Exchange Proximity:** Must be physically close to exchange matching engines (Singapore/Tokyo for OKX/Bybit/Binance)
2. **Global Dashboard:** Dashboard UI must load <2s worldwide
3. **Event-Driven Trading:** WebSocket feeds require persistent connections with <50ms latency
4. **Compliance:** SEC/FCA record-keeping (3-5 years audit trail)

---

## 2. Options Considered

### Option A: Single VPS (Traditional)

**Architecture:** All-in-one VPS (EC2 c6i.xlarge, Singapore)

```
┌────────────────────────────────────────┐
│  AWS EC2 c6i.xlarge (Singapore)        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Dashboard│ │  API     │ │ Trading│ │
│  │   (React)│ │ (Fastify)│ │ Engine │ │
│  └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │PostgreSQL│ │  Redis   │ │Metrics │ │
│  └──────────┘ └──────────┘ └────────┘ │
└────────────────────────────────────────┘
```

| Criteria | Score | Notes |
|----------|-------|-------|
| Latency | 8/10 | 5-10ms to OKX/Bybit, 30-40ms to Binance |
| Global Dashboard | 4/10 | 200-400ms page load outside Asia |
| Cost (100 users) | 7/10 | $150/month |
| Complexity | 9/10 | Simple deployment, single point of failure |
| Scalability | 3/10 | Vertical scaling only, hard ceiling |
| Security | 6/10 | All attack surface on one host |

**Pros:**
- Simplest deployment (single `docker-compose up`)
- Lowest cost at small scale
- All services on same network (low internal latency)

**Cons:**
- Single point of failure (VPS down = entire platform down)
- Poor global dashboard performance
- No automatic scaling
- Database and trading engine compete for resources

---

### Option B: Pure Serverless (Cloudflare Workers)

**Architecture:** 100% serverless, no VPS

```
┌─────────────────────────────────────────────┐
│  Cloudflare Edge (275 locations)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  Pages   │ │  Workers │ │ Durable Obj. │ │
│  │  (React) │ │  (API)   │ │  (State)     │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Supabase (Global PostgreSQL)               │
│  - Auth (JWT)                               │
│  - Database (RLS)                           │
│  - Realtime (WebSocket)                     │
└─────────────────────────────────────────────┘
```

| Criteria | Score | Notes |
|----------|-------|-------|
| Latency | 3/10 | 50-200ms to exchanges (too high for HFT) |
| Global Dashboard | 10/10 | <50ms page load worldwide |
| Cost (100 users) | 9/10 | $25/month |
| Complexity | 8/10 | No infrastructure management |
| Scalability | 10/10 | Auto-scales to millions of requests |
| Security | 9/10 | Managed security, DDoS protection |

**Pros:**
- Instant global distribution
- Zero cold starts (Durable Objects maintain state)
- Automatic scaling
- Built-in DDoS protection
- Lowest operational overhead

**Cons:**
- **Cold start latency 50-500ms** - unacceptable for event-driven trading
- **No WebSocket server** - must use Cloudflare-specific patterns
- **Limited by Worker timeout** (10min max, trading needs 24/7 uptime)
- **Exchange colocation impossible** - cannot place Workers in Singapore/Tokyo data centers

---

### Option C: Hybrid Architecture (RECOMMENDED)

**Architecture:** Cloudflare Edge for UI/API + AWS VPS for Trading Engine

```
┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│  Cloudflare Edge (Global)           │  │  AWS VPS (Singapore)                │
│  ┌─────────────────────────────┐   │  │  ┌─────────────────────────────┐   │
│  │  Pages (Dashboard UI)       │   │  │  │  Trading Engine (Node.js)   │   │
│  │  - React + TypeScript       │◀──WebSocket──┤  - WebSocket Feed Mgr   │   │
│  │  - <50ms load worldwide     │   │  │  │  - Order Executor           │   │
│  └─────────────────────────────┘   │  │  │  - Spread Detector          │   │
│  ┌─────────────────────────────┐   │  │  │  - Circuit Breaker          │   │
│  │  Workers (Edge API)         │   │  │  └─────────────────────────────┘   │
│  │  - JWT Auth                 │   │  │  ┌─────────────────────────────┐   │
│  │  - Rate Limiting (DO)       │   │  │  │  Redis (Local)              │   │
│  │  - Request Routing          │   │  │  │  - Orderbook Cache          │   │
│  └─────────────────────────────┘   │  │  │  - Ticker Cache             │   │
└─────────────────────────────────────┘  │  └─────────────────────────────┘   │
         │                                └─────────────────────────────────────┘
         ▼                                          │
┌─────────────────────────────────────┐             │
│  Supabase (Global)                  │             │
│  - Auth (JWT)                       │◀────────────┘
│  - PostgreSQL (User Data)           │    REST (admin)
│  - RLS Policies                     │
│  - Audit Logging                    │
└─────────────────────────────────────┘
```

| Criteria | Score | Notes |
|----------|-------|-------|
| Latency | 9/10 | 5-15ms to exchanges (colocated VPS) |
| Global Dashboard | 10/10 | <50ms via Cloudflare CDN |
| Cost (100 users) | 7/10 | $151/month |
| Complexity | 6/10 | Two deployments to manage |
| Scalability | 8/10 | Edge auto-scales, VPS can horizontally scale |
| Security | 9/10 | Cloudflare WAF + AWS security groups |

**Pros:**
- **Best of both worlds:** Global dashboard + low-latency trading
- **Exchange proximity:** VPS in Singapore = 5-10ms to OKX/Bybit
- **Infinite UI scale:** Cloudflare handles dashboard traffic spikes
- **Separation of concerns:** Trading engine isolated from web traffic
- **Compliance ready:** Supabase provides audit logging, backups

**Cons:**
- Higher complexity (2 deployment targets)
- Slightly higher cost than single VPS
- Requires cross-service authentication (JWT + API keys)

---

### Option D: Kubernetes (Over-Engineered)

**Architecture:** EKS/GKE cluster with auto-scaling

**Decision:** REJECTED for MVP

| Criteria | Score | Notes |
|----------|-------|-------|
| Complexity | 2/10 | Requires DevOps expertise |
| Cost (100 users) | 3/10 | $500+/month |
| Time to Deploy | 2/10 | 2-3 weeks setup |

**Rationale:** Kubernetes is premature optimization for 10-100 users. Revisit at 1000+ institutional users.

---

## 3. Decision

**Selected:** Option C - Hybrid Architecture (Cloudflare + AWS VPS)

### Rationale

1. **Latency is non-negotiable:** Pure serverless (Option B) cannot achieve <100ms latency to exchanges. Physical colocation in Singapore is mandatory for OKX/Bybit/Binance trading.

2. **User experience matters:** Single VPS (Option A) provides poor global dashboard performance (200-400ms vs <50ms). Institutional traders expect responsive UI.

3. **Cost is acceptable:** At $151/month for 100 users, hybrid is 6x cheaper than Kubernetes and provides better performance than either extreme.

4. **Compliance built-in:** Supabase Pro provides audit logging, automated backups, and GDPR compliance out of the box.

5. **Gradual scaling path:** Can scale from 10 → 100 → 1000 users by upgrading VPS tier and adding Cloudflare Workers capacity.

---

## 4. Consequences

### 4.1 Positive Consequences

| Benefit | Impact | Timeline |
|---------|--------|----------|
| Low-latency trading | 5-15ms to exchanges | Immediate |
| Global dashboard | <50ms page load | Immediate |
| 99.9% uptime SLA | Cloudflare 100% + AWS 99.95% | Immediate |
| Auto-scaling UI | Handle traffic spikes | Immediate |
| Compliance ready | Supabase audit logs + backups | Immediate |
| Cost efficiency | $151/mo at 100 users | Immediate |

### 4.2 Negative Consequences

| Trade-off | Mitigation | Effort |
|-----------|------------|--------|
| Two deployment targets | Infrastructure-as-Code (Terraform) | 4h |
| Cross-service auth | JWT + API key rotation | 2h |
| VPS maintenance required | AWS managed instances + monitoring | Ongoing |
| Data sync between services | Eventual consistency via Redis pub/sub | 4h |

### 4.3 Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| VPS outage | Medium | High | Dual-VPS failover (Tokyo + Singapore) |
| Cloudflare outage | Low | Medium | Edge Functions have local cache fallback |
| Exchange API ban | High | Medium | Connection pooling + rate limiting |
| Database corruption | Low | Critical | Daily backups + point-in-time recovery |
| Security breach | Medium | Critical | Encryption at rest + in transit + audit logging |

---

## 5. Implementation Plan

### Phase 1: Security Hardening (Week 1)

**Priority:** P0 - Block production deployment

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| C1: License encryption (AES-256-GCM) | Backend | 4h | Pending |
| C2: Rate limiting on all APIs | Backend | 2h | Pending |
| C3: Private keys → AWS Secrets Manager | DevOps | 4h | Pending |
| I1: CSRF protection | Backend | 2h | Pending |
| I2: Security headers (CSP, HSTS) | Frontend | 1h | Pending |
| I3: Sentry error tracking | Full-stack | 3h | Pending |

**Definition of Done:** All CRITICAL + IMPORTANT security issues resolved, penetration test passed.

---

### Phase 2: Infrastructure Setup (Week 2)

**Priority:** P1 - Required for beta launch

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Provision AWS VPS (c6i.large, Singapore) | DevOps | 2h | Pending |
| Configure security groups + SSH keys | DevOps | 1h | Pending |
| Deploy Redis cache (local on VPS) | DevOps | 1h | Pending |
| Configure Cloudflare Pages | Frontend | 2h | Pending |
| Configure Cloudflare Workers (Edge API) | Backend | 4h | Pending |
| Migrate database to Supabase Pro | Backend | 2h | Pending |
| Set up SSL certificates (auto-renew) | DevOps | 1h | Pending |
| Configure DNS + domain | DevOps | 1h | Pending |

**Definition of Done:** Staging environment deployed, all health checks passing.

---

### Phase 3: Monitoring + Compliance (Week 3)

**Priority:** P2 - Recommended for beta

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Sentry error tracking + alerts | DevOps | 2h | Pending |
| UptimeRobot monitoring (5-min intervals) | DevOps | 1h | Pending |
| Grafana dashboards (latency, P&L, errors) | DevOps | 4h | Pending |
| Audit logging service (blockchain hash chain) | Backend | 4h | Pending |
| Terms of Service + Risk Disclosure | Legal | 8h | Pending |
| Data export functionality | Backend | 2h | Pending |

**Definition of Done:** Monitoring dashboards live, audit logs flowing, legal docs published.

---

### Phase 4: Beta Launch (Week 4)

**Priority:** P3 - Go/No-Go decision

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Invite 10 beta users | Product | 2h | Pending |
| Monitor latency + error rates daily | DevOps | Ongoing | Pending |
| Daily standup for issue triage | All | 15m/day | Pending |
| Week 1 review: extend/graduate decision | Leadership | 1h | Pending |

**Definition of Done:** 95% uptime, <2s page load, 0 critical bugs for 7 consecutive days.

---

## 6. Architecture Diagrams

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ALGO-TRADER PRODUCTION                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐              ┌──────────────────────┐
│  Cloudflare Edge     │              │  AWS VPS (Singapore) │
│  (Global Dashboard)  │              │  (Trading Engine)    │
├──────────────────────┤              ├──────────────────────┤
│ Pages (React UI)     │◀──WebSocket─▶│ Node.js Engine       │
│ Workers (API GW)     │  REST (admin)│ WebSocket Feeds      │
│ KV (Session Cache)   │              │ Order Execution      │
│ Durable Objects      │              │ Redis (Local)        │
│ (Rate Limiting)      │              │ P&L Tracking         │
└──────────────────────┘              └──────────────────────┘
         │                                      │
         ▼                                      ▼
┌──────────────────────┐              ┌──────────────────────┐
│ Supabase (Global)    │              │ Exchange APIs        │
│ Auth (JWT)           │              │ - Binance (30-40ms)  │
│ PostgreSQL + RLS     │              │ - OKX (5-10ms)       │
│ Audit Logging        │              │ - Bybit (5-10ms)     │
└──────────────────────┘              └──────────────────────┘
```

### Data Flow Diagram

```
User → Cloudflare Pages (UI) → Cloudflare Workers (API) → AWS VPS (Trading)
                                    │                           │
                                    ▼                           ▼
                              Supabase (Auth/DB)          Redis (Cache)
                                    │                           │
                                    ▼                           ▼
                              Audit Logs                  Exchanges
```

---

## 7. Cost Breakdown

### Phase 1: MVP (10-100 concurrent users)

| Component | Platform | Tier | Cost/Month |
|-----------|----------|------|------------|
| Dashboard UI | Cloudflare Pages | Free | $0 |
| Edge API | Cloudflare Workers | Paid | $20 |
| KV Storage | Cloudflare KV | Standard | $5 |
| Trading Engine | AWS EC2 | c6i.large (Singapore) | $60 |
| Redis Cache | Local (included) | - | $0 |
| Database | Supabase | Pro | $25 |
| Error Tracking | Sentry | Team | $26 |
| Monitoring | UptimeRobot | Free | $0 |
| **Total** | | | **$136/month** |

### Phase 2: Growth (100-500 concurrent users)

| Component | Platform | Tier | Cost/Month |
|-----------|----------|------|------------|
| Dashboard UI | Cloudflare Pages | Free | $0 |
| Edge API | Cloudflare Workers | Paid | $100 |
| KV Storage | Cloudflare KV | Standard | $20 |
| Trading Engine | AWS EC2 | c6i.xlarge (Singapore) | $120 |
| Redis Cache | AWS ElastiCache | cache.t3.small | $40 |
| Database | Supabase | Pro | $25 |
| Error Tracking | Sentry | Business | $80 |
| Monitoring | Grafana Cloud | Basic | $50 |
| **Total** | | | **$435/month** |

### Phase 3: Scale (500-1000+ institutions)

| Component | Platform | Tier | Cost/Month |
|-----------|----------|------|------------|
| Dashboard UI | Cloudflare Pages | Free | $0 |
| Edge API | Cloudflare Workers | Paid | $200 |
| KV Storage | Cloudflare KV | Standard | $50 |
| Trading Engine | AWS EC2 × 2 | c6i.2xlarge (Tokyo + SG) | $480 |
| Redis Cache | AWS ElastiCache | cache.t3.medium | $100 |
| Database | Supabase | Enterprise | $500 |
| Error Tracking | Sentry | Enterprise | $400 |
| Monitoring | Grafana Cloud | Pro | $200 |
| Backup Storage | AWS S3 | 100GB | $10 |
| **Total** | | | **$1,940/month** |

---

## 8. Compliance Framework

### 8.1 SEC Requirements (US)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Record keeping (3 years) | PostgreSQL + S3 archive | Pending |
| Audit trail | Blockchain hash chain | Pending |
| Best execution | Price improvement logic | Pending |
| Risk disclosure | Terms of service | Pending |
| AML/KYC | Supabase Auth + Onfido | Pending |

### 8.2 FCA Requirements (UK)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Transaction reporting | Audit logging service | Pending |
| MiFID II best execution | Multi-exchange routing | Pending |
| GDPR data protection | AES-256 encryption | Pending |
| Data portability | CSV export API | Pending |
| Client categorization | Professional/retail flag | Pending |

---

## 9. Decision Log

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 2026-03-20 | Hybrid architecture selected | Best latency + global UX | CTO |
| 2026-03-20 | Cloudflare for Edge API | Automatic scaling, DDoS protection | DevOps |
| 2026-03-20 | AWS VPS for trading engine | Exchange colocation in Singapore | DevOps |
| 2026-03-20 | Supabase for database | Built-in auth, RLS, audit logging | Backend |
| 2026-03-20 | Local Redis on VPS | Lowest latency for orderbook cache | Backend |

---

## 10. Unresolved Questions

1. **Failover Strategy:** If Singapore VPS fails, should trading auto-failover to Tokyo or halt completely? (Decision pending: halt to prevent inconsistent state)

2. **Market Data Consistency:** How to handle clock skew between exchanges when calculating spreads? (Decision pending: use exchange timestamps, not local clock)

3. **Cross-Border Compliance:** Which jurisdiction for incorporation? (Decision pending: Singapore for crypto-friendly regulation)

4. **Atomic Execution:** If one leg of arbitrage fails after the other executes, what is the hedge strategy? (Decision pending: market order hedge within 100ms)

---

## 11. References

- Design Research: `plans/reports/cto/architect/design-research-260320-0536-algo-trader.md`
- Security Audit: `plans/reports/security-audit-260319-algo-trader.md`
- Code Review: `plans/reports/code-review-260320-0530-algo-trader-mvp-sprint.md`
- Beta Launch Checklist: `docs/beta-launch-checklist.md`
- Deployment Guide: `docs/deployment-guide.md`

---

**Approved by:** CTO (OpenClaw)
**Approval Date:** 2026-03-20
**Next Review:** 2026-04-20 (or at 500+ users)
