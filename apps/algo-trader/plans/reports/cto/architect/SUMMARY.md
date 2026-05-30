# Algo-Trader Production Architecture Summary

**Date:** 2026-03-20
**Version:** 5.6.0-beta
**Status:** Ready for Security Hardening → Beta Launch
**Target:** $1M ARR from institutional traders

---

## Executive Summary

### Current State

| Metric | Status | Notes |
|--------|--------|-------|
| MVP Sprint | ✅ COMPLETE | 6 weeks, 270 tests passing |
| Code Review | ⚠️ 3 CRITICAL + 9 IMPORTANT issues | Security hardening required |
| Infrastructure | 📦 LOCAL ONLY | Docker Compose on localhost |
| Beta Launch | ⏳ BLOCKED | Security issues must be fixed first |

### Recommended Architecture: **Hybrid Cloudflare + AWS**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ALGO-TRADER PRODUCTION ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────┐              ┌───────────────────────────┐
│  Cloudflare Edge (Global) │              │  AWS VPS (Singapore)      │
│  Dashboard + API Gateway  │              │  Trading Engine           │
├───────────────────────────┤              ├───────────────────────────┤
│  Pages: React UI          │◀──WebSocket─▶│  Node.js Engine           │
│  Workers: JWT Auth        │  REST (admin)│  WebSocket Feed Mgr       │
│  KV: Session Cache        │              │  Order Executor           │
│  DO: Rate Limiting        │              │  Spread Detector          │
│  <50ms page load          │              │  Circuit Breaker          │
│  worldwide                │              │  5-15ms to exchanges      │
└───────────────────────────┘              └───────────────────────────┘
            │                                         │
            ▼                                         ▼
┌───────────────────────────┐              ┌───────────────────────────┐
│  Supabase (Global)        │              │  Exchanges                │
│  - Auth (JWT)             │              │  - OKX (5-10ms)           │
│  - PostgreSQL + RLS       │              │  - Bybit (5-10ms)         │
│  - Audit Logging          │              │  - Binance (30-40ms)      │
│  - Automated Backups      │              │                           │
└───────────────────────────┘              └───────────────────────────┘
```

### Why Hybrid?

| Criterion | Single VPS | Pure Serverless | **Hybrid (Chosen)** |
|-----------|------------|-----------------|---------------------|
| Latency to exchanges | 8/10 | 3/10 | **9/10** |
| Global dashboard | 4/10 | 10/10 | **10/10** |
| Cost (100 users) | $150/mo | $25/mo | **$136/mo** |
| Scalability | 3/10 | 10/10 | **8/10** |
| Complexity | 9/10 | 8/10 | **6/10** |

**Decision rationale:** Only hybrid architecture delivers both <15ms exchange latency AND <50ms global dashboard load time.

---

## Beta Launch Checklist

### P0: Security (BLOCKER - Must Complete Before Beta)

- [ ] **C1: License encryption** — AES-256-GCM encrypt license keys at rest
- [ ] **C2: Rate limiting** — Redis-based sliding window on all `/api/*` endpoints
- [ ] **C3: Secret management** — Migrate private keys to AWS Secrets Manager
- [ ] **I1: CSRF protection** — csurf middleware + SameSite cookies
- [ ] **I2: Security headers** — CSP, HSTS, X-Frame-Options, X-XSS-Protection
- [ ] **I3: Error tracking** — Sentry integration with source maps
- [ ] **I8: API authentication** — JWT middleware on all `/api/*` routes
- [ ] **I4: Input validation** — Zod schemas on all API endpoints

**Estimated effort:** 3-4 days

---

### P1: Infrastructure (Required for Beta)

- [ ] Provision AWS VPS (c6i.large, ap-southeast-1 Singapore)
- [ ] Configure security groups, SSH keys, fail2ban
- [ ] Deploy trading engine with local Redis cache
- [ ] Configure Cloudflare Pages (dashboard UI)
- [ ] Configure Cloudflare Workers (Edge API gateway)
- [ ] Migrate database to Supabase Pro
- [ ] Set up SSL certificates (auto-renew via Let's Encrypt)
- [ ] Configure DNS records (A, CNAME, MX)

**Estimated effort:** 2-3 days

---

### P2: Monitoring (Recommended for Beta)

- [ ] Sentry error tracking + alerts
- [ ] UptimeRobot monitoring (5-min intervals)
- [ ] Grafana dashboards (latency, P&L, errors, circuit breaker)
- [ ] Alertmanager rules (Slack/PagerDuty integration)
- [ ] Log aggregation (Winston + CloudWatch)

**Estimated effort:** 1-2 days

---

### P3: Compliance (Recommended for Beta)

- [ ] Audit logging service (blockchain hash chain)
- [ ] Terms of Service + Risk Disclosure
- [ ] Data export functionality (CSV)
- [ ] Account deletion flow (GDPR right to erasure)
- [ ] Rate limiting documentation (API docs)

**Estimated effort:** 2-3 days (plus legal review)

---

### P4: Documentation (Recommended)

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment runbook
- [ ] Incident response playbook
- [ ] User onboarding guide
- [ ] Troubleshooting guide

**Estimated effort:** 1-2 days

---

## Cost Projection

| Phase | Users | Monthly Cost | Cost/User |
|-------|-------|--------------|-----------|
| MVP (Beta) | 10-100 | $136 | $1.36 - $13.60 |
| Growth | 100-500 | $435 | $0.87 - $4.35 |
| Scale | 500-1000+ | $1,940 | $1.94 - $3.88 |

**Revenue at 100 users (Pro tier $149/mo):** $14,900/mo
**Infrastructure margin:** 99%+ at scale

---

## Security Hardening Summary

### 3 CRITICAL Issues (P0)

| Issue | Impact | Fix | Effort |
|-------|--------|-----|--------|
| C1: License activation secret hardcoded | API key bypass | Remove fallback, fail securely | 2h |
| C2: No rate limiting on license API | Brute-force attack | Redis sliding window | 2h |
| C3: Private key in plaintext .env | Wallet compromise | AWS Secrets Manager | 4h |

### 9 IMPORTANT Issues (P1)

| Issue | Impact | Fix | Effort |
|-------|--------|-----|--------|
| I1: No CSRF protection | Session hijacking | csurf + SameSite | 2h |
| I2: Missing security headers | XSS, clickjacking | CSP, HSTS | 1h |
| I3: Empty catch blocks | Silent failures | Sentry integration | 3h |
| I4: No input validation | Injection attacks | Zod schemas | 4h |
| I5: Hardcoded default credentials | Auth bypass | Remove defaults | 1h |
| I6: No tenant isolation | Data leakage | JWT claims + RLS | 4h |
| I7: CORS wildcard enabled | CSRF amplification | Explicit origin whitelist | 1h |
| I8: No API authentication | Unauthorized access | JWT middleware | 3h |
| I9: Console.error exposes state | Info leakage | Winston logger | 2h |

**Total effort:** 23 hours (~3 working days)

---

## Timeline to Beta Launch

```
Week 1: Security Hardening
├── Mon-Tue: C1-C3 CRITICAL fixes
├── Wed-Thu: I1-I5 IMPORTANT fixes
├── Fri: I6-I9 + security re-scan
└── Weekend: Penetration testing

Week 2: Infrastructure Setup
├── Mon: AWS VPS provisioned
├── Tue: Cloudflare Pages + Workers deployed
├── Wed: Supabase migration
├── Thu: SSL + DNS configuration
└── Fri: Staging environment smoke test

Week 3: Monitoring + Compliance
├── Mon-Tue: Sentry + Grafana dashboards
├── Wed: Audit logging implementation
├── Thu: Legal review (Terms + Privacy)
└── Fri: Final compliance check

Week 4: Beta Launch
├── Mon: Invite 10 beta users
├── Tue-Fri: Monitor + iterate daily
└── Fri: Week 1 review (go/no-go)
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Exchange API rate limit | High | Medium | Connection pooling + exponential backoff |
| VPS outage | Medium | High | Dual-VPS failover (Tokyo + Singapore) |
| Database corruption | Low | Critical | Daily backups + point-in-time recovery |
| Security breach | Medium | Critical | Encryption + audit logging + pentests |
| Regulatory action | Low | High | Legal review + Singapore incorporation |
| Slippage > threshold | High | Medium | Circuit breaker + max slippage config |
| Network latency spike | Medium | Medium | Colocation + multi-region VPS |

---

## Unresolved Questions

1. **Failover Strategy:** If Singapore VPS fails, should trading auto-failover to Tokyo or halt completely?
   - **Recommendation:** Halt to prevent inconsistent state during failover

2. **Market Data Consistency:** How to handle clock skew between exchanges when calculating spreads?
   - **Recommendation:** Use exchange timestamps, sync via NTP every 5 minutes

3. **Cross-Border Compliance:** Which jurisdiction for incorporation?
   - **Recommendation:** Singapore (crypto-friendly MAS regulation)

4. **Atomic Execution:** If one leg of arbitrage fails after the other executes, what is the hedge strategy?
   - **Recommendation:** Market order hedge within 100ms to close exposure

5. **Exchange WebSocket Rate Limits:** What are the exact rate limits for OKX/Bybit/Binance WebSocket connections?
   - **Action:** Research exchange docs during Week 1 security hardening

---

## References

| Document | Location |
|----------|----------|
| Design Research | `plans/reports/cto/architect/design-research-260320-0536-algo-trader.md` |
| Architecture Decision Record | `plans/reports/cto/architect/adr-260320-0552-algo-trader-production-infra.md` |
| Security Audit | `plans/reports/security-audit-260319-algo-trader.md` |
| Code Review | `plans/reports/code-review-260320-0530-algo-trader-mvp-sprint.md` |
| Beta Launch Checklist | `docs/beta-launch-checklist.md` |
| Deployment Guide | `docs/deployment-guide.md` |

---

**Prepared by:** CTO Agent (OpenClaw)
**Review Date:** 2026-03-20
**Next Review:** 2026-03-27 (post-security-hardening)
