---
title: "Algo-Trader Execution Plan"
description: "5-Layer Command Map from Zero to $1M ARR"
status: active
priority: P0
created: 2026-03-19
---

# Algo-Trader — Company Blueprint

## Stage: Zero→PSF
**Target:** $1M ARR by Month 12 (GTM 2026)

---

## Tri-Layer Architecture

| Layer | Focus | Key Agents |
|-------|-------|------------|
| **[Business]** | SaaS + Performance Fee, SEA institutional traders | Sales Agent, Support Agent |
| **[Agentic]** | Trading, Risk, P&L, Compliance, Ops | CTO Agent (Trading), Risk Agent |
| **[Governance]** | MAS compliance, AML/KYC, audit trails | Compliance Agent |

---

## 5-Layer Command Map

### Layer 1: Founder (Strategy + Fundraising)

| Command | Purpose | Owner | Timeline |
|---------|---------|-------|----------|
| `/studio-strategy` | Define category, moat, positioning | CEO | Week 1 |
| `/founder-raise` | Pitch deck, investor outreach, $3M Seed | CEO | Month 3-6 |
| `/studio-portfolio` | Track metrics, board updates | CEO | Monthly |

### Layer 2: Business (Revenue + Operations)

| Command | Purpose | Owner | Timeline |
|---------|---------|-------|----------|
| `/sales-pipeline-build` | Enterprise pipeline, demo workflow | Sales Lead | Month 2-4 |
| `/marketing-campaign-run` | LinkedIn/Twitter ads, content engine | CMO | Month 3+ |
| `/finance-budget-plan` | Burn tracking, unit economics | CFO | Weekly |

### Layer 3: Product (UX + Features)

| Command | Purpose | Owner | Timeline |
|---------|---------|-------|----------|
| `/product-sprint-plan` | 2-week sprints, backlog grooming | Product | Ongoing |
| `/pm-sprint` | Execute sprint, ship features | Product | Bi-weekly |
| `/design-sprint` | P&L dashboard, onboarding flow | Design | Month 1-2 |

### Layer 4: Engineering (Build + Deploy)

| Command | Purpose | Owner | Timeline |
|---------|---------|-------|----------|
| `/cto-architect` | Multi-tenant SaaS, MCU metering | CTO | Month 1 |
| `/cook` | Feature implementation | Eng Team | Per sprint |
| `/dev-feature` | Specific features (arb, P&L, risk) | Eng Team | Per feature |
| `/release-ship` | Deploy to production | Eng Team | Per release |

### Layer 5: Ops (Monitor + Maintain)

| Command | Purpose | Owner | Timeline |
|---------|---------|-------|----------|
| `/ops-health-sweep` | Infrastructure health, alerts | Ops | Daily |
| `/sre-morning-check` | SRE checklist, incident response | SRE | Daily |
| `/analyst-report` | AARRR metrics, North Star (DATV) | Analyst | Weekly |

---

## Phase Roadmap

### Phase 1: Months 1-2 (MVP Hardening)

**Goal:** 3 exchanges live, <100ms latency, paper trading

| Task | Command | Owner |
|------|---------|-------|
| Multi-exchange execution | `/cook` "Binance + OKX + Bybit live execution" | CTO |
| P&L Dashboard MVP | `/cook` "Real-time P&L tracking UI" | Frontend |
| Risk Controls v1 | `/cook` "Position limits, stop-loss, circuit breakers" | Backend |
| Paper Trading Mode | `/cook` "Dry-run mode with virtual balances" | Backend |

### Phase 2: Months 3-4 (SaaS Layer)

**Goal:** Auth, billing, multi-tenant, first paying customers

| Task | Command | Owner |
|------|---------|-------|
| Multi-tenant Auth | `/cook` "Supabase auth with tenant isolation" | Backend |
| Polar.sh Billing | `/cook` "SaaS tiers + performance fee tracking" | Backend |
| Usage Metering (MCU) | `/cook` "API call tracking + overage billing" | Backend |
| License Management | `/cook` "License keys, activation, revocation" | Backend |

### Phase 3: Months 5-6 (Compliance)

**Goal:** AML/KYC, audit logs, MAS prep

| Task | Command | Owner |
|------|---------|-------|
| AML/KYC Integration | `/cook` "Sumsub/Onfido KYC flow" | Backend |
| Audit Logging | `/cook` "Trade audit trail, export for compliance" | Backend |
| Compliance Reporting | `/cook` "MAS-ready trade reports" | Compliance |
| Security Audit | `/review` "Third-party security assessment" | CTO |

### Phase 4: Months 7-12 (Scale)

**Goal:** $50K→$1M ARR, enterprise sales, Series A prep

| Task | Command | Owner |
|------|---------|-------|
| DEX Integration | `/cook` "Ethereum + Solana DEX arbitrage" | CTO |
| Enterprise Features | `/cook` "Custom risk params, dedicated infra" | Eng |
| Scale Infrastructure | `/cto-architect` "10x throughput, multi-region" | CTO |
| Fundraising | `/founder-raise` "$3M Seed close" | CEO |

---

## Success Criteria

| Milestone | Metric | Date |
|-----------|--------|------|
| MVP Complete | 3 exchanges, paper trading | Month 2 |
| First Revenue | $10K MRR, 5 customers | Month 4 |
| Compliance Ready | AML/KYC, audit logs | Month 6 |
| Scale | $50K MRR, Seed closed | Month 9 |
| Target | $1M ARR | Month 12 |

---

## Risks + Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Exchange downtime | Medium | Multi-exchange redundancy |
| Regulatory action | High | SG entity, MAS compliance |
| Competitor undercut | Medium | Feature velocity, data moat |
| Key person | High | Documentation, bus factor >2 |

---

## Next Actions

1. **CTO Daemon** executes 5 missions from `tasks/` directory
2. Weekly sprint reviews via `/pm-sprint`
3. Monthly board updates via `/studio-portfolio`

---

**Status:** ACTIVE
**Last Updated:** 2026-03-19
