---
title: "CTO Architecture Design — Algo-Trader MVP"
description: "Sub-100ms cross-exchange arbitrage engine architecture decision record"
status: completed
priority: P0
effort: 3h
branch: HEAD
tags: [architecture, cto, adr, mvp, arbitrage]
created: 2026-03-20
---

# Plan Overview: CTO Architecture Design

## Summary

**Objective:** Design production-ready architecture cho multi-exchange crypto arbitrage engine targeting <100ms latency.

**Status:** ✅ **COMPLETE** — ADR approved

**Output:** `/plans/reports/cto-adr-260320.md`

---

## Research Phase (Complete)

| Task | Agent | Status | Report |
|------|-------|--------|--------|
| Architecture Patterns | Researcher #1 | ✅ Done | `researcher-01-architecture.md` |
| Tech Stack Comparison | Researcher #2 | ✅ Done | `researcher-02-techstack.md` |
| System Boundaries & Data Flow | Researcher #3 | ✅ Done | `researcher-03-dataflow.md` |

---

## ADR Synthesis (Complete)

| Section | Content | Status |
|---------|---------|--------|
| 1. Context & Constraints | Business goals, technical constraints | ✅ |
| 2. Latency Budget | Component breakdown, critical path | ✅ |
| 3. Architecture Decision | Event-Driven Monolith rationale | ✅ |
| 4. Tech Stack | CCXT, Redis structures, WebSocket/REST, DB | ✅ |
| 5. VPS/Colocation Cost | AWS Singapore/Tokyo, $60-120/month | ✅ |
| 6. Implementation Plan | Phase 1-3 roadmap | ✅ |
| 7. Risk Mitigation | Technical risks, security controls | ✅ |

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Architecture** | Hybrid Event-Driven Monolith — lowest latency, simple deployment |
| **Exchange API** | CCXT — 10x dev speed, multi-exchange ready |
| **Orderbook** | Redis Sorted Sets — O(log N) ordered updates |
| **Ticker** | Redis Hashes — O(1) field access |
| **Trade History** | Redis Streams + PostgreSQL — real-time + persistent |
| **VPS Strategy** | AWS Singapore (MVP) → Tokyo+Singapore (Production) |
| **Target Latency** | < 100ms P95 (MVP), < 50ms P95 (Production) |

---

## Next Steps (Implementation)

1. **Create implementation plan** — Break ADR into TODO tasks
2. **Phase 1 Milestones:**
   - [ ] WebSocket price feed (replace polling)
   - [ ] Event-driven signal detection
   - [ ] Order book validation (cached L2)
   - [ ] Atomic execution (Promise.allSettled)
   - [ ] Basic circuit breaker

---

## Unresolved Questions

1. Exchange WebSocket rate limits — cần verify per-exchange
2. Atomic execution rollback strategy — market hedge vs wait-and-see
3. Market regime detection overhead — cần benchmark thực tế
4. Failover strategy — auto-failover giữa Tokyo/Singapore?
5. Data consistency — order book sync across exchanges?
6. Compliance requirement — trade history retention period?
7. Geographic distribution — multi-region beyond Asia?
8. Volume projection — expected trades/day?

---

**Plan Dir:** `plans/260320-0031-cto-architecture-design/`
**Reports:** `plans/reports/cto-adr-260320.md`
