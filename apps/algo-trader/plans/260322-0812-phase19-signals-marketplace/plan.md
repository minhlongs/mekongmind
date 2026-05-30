# Phase 19: Signals Marketplace

**Priority:** P0 - Revenue Generation
**Status:** ✅ COMPLETE (Code)
**Timeline:** Week 14
**Completed:** 2026-03-22
**Report:** `plans/reports/phase19-completion-report-260322-0824.md`

---

## Overview

Xây dựng Signals Marketplace cho phép external signal providers (traders, quant researchers) bán trading signals cho algo-trader users. Marketplace tạo dòng revenue mới thông qua commission trên mỗi signal bán.

---

## Key Insights

- Revenue model: Commission-based marketplace (10-30% per signal sale)
- Two-sided market: Signal providers (sellers) ↔ Traders (buyers)
- Signal quality verification: Backtest proof required before listing
- Subscription tiers: Free (1 signal/day), Pro (10/day), Enterprise (unlimited)
- Rating system: Provider reputation based on signal performance

---

## Requirements

### Functional
1. Signal Provider API (POST/GET/DELETE signals)
2. Marketplace browsing & search (filter by exchange, pair, strategy type)
3. Signal purchase flow (API key deduction)
4. Provider rating & review system
5. Signal performance tracking (win rate, P&L)
6. Subscription tier gating (free/pro/enterprise)

### Non-Functional
- API response time < 100ms
- Signal delivery < 50ms after purchase
- Data integrity: ACID transactions for purchases
- Security: Provider isolation, no signal theft

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Signals Marketplace                       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Provider A  │  │  Provider B  │  │  Provider C  │      │
│  │  (Gru ML)    │  │  (RSI+MACD)  │  │  (Arb Scan)  │      │
│  │  $49/month   │  │  $0.10/sig   │  │  Free        │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │ Signal Store    │                        │
│                  │ (PostgreSQL)    │                        │
│                  │ - Metadata      │                        │
│                  │ - Performance   │                        │
│                  │ - Ratings       │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
│         ┌─────────────────┴─────────────────┐              │
│         │                                   │              │
│  ┌──────▼───────┐                   ┌──────▼───────┐     │
│  │   Buyer UI   │                   │   Buyer API  │     │
│  │  (Dashboard) │                   │  (REST/WS)   │     │
│  └──────────────┘                   └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## File Ownership

**This phase owns:**
- `src/marketplace/` — NEW: Marketplace module
- `src/marketplace/signal-store.ts` — Signal storage & retrieval
- `src/marketplace/provider-registry.ts` — Provider management
- `src/marketplace/signal-purchase.ts` — Purchase flow
- `src/marketplace/rating-system.ts` — Provider ratings
- `src/marketplace/performance-tracker.ts` — Signal performance
- `src/api/routes/marketplace.ts` — API endpoints
- `tests/marketplace/*.test.ts` — Test suite

**Modifies:**
- `src/prisma/schema.prisma` — Add marketplace tables
- `dashboard/src/pages/marketplace/` — UI pages

---

## Implementation Steps

### 1. Database Schema (`schema.prisma`)
- [ ] SignalProvider model (id, name, apiKey, tier, rating)
- [ ] MarketSignal model (id, providerId, symbol, strategy, price, metadata)
- [ ] SignalPurchase model (buyerId, signalId, timestamp, price)
- [ ] SignalReview model (rating, comment, verifiedPurchase)
- [ ] SignalPerformance model (winRate, avgPnL, totalSignals)

### 2. Signal Store (`signal-store.ts`)
- [ ] CRUD operations for signals
- [ ] Search/filter by exchange, pair, strategy
- [ ] Tier-based access control
- [ ] Signal metadata validation (Zod schema)

### 3. Provider Registry (`provider-registry.ts`)
- [ ] Provider onboarding (create/update profile)
- [ ] API key generation for providers
- [ ] Tier management (free/pro/enterprise)
- [ ] Provider verification (optional KYC)

### 4. Purchase Flow (`signal-purchase.ts`)
- [ ] Deduct from buyer API balance
- [ ] Credit to provider account (minus commission)
- [ ] Grant signal access to buyer
- [ ] Transaction log for audit

### 5. Rating System (`rating-system.ts`)
- [ ] Submit review (1-5 stars + comment)
- [ ] Verified purchase check
- [ ] Aggregate rating calculation
- [ ] Anti-spam measures

### 6. Performance Tracker (`performance-tracker.ts`)
- [ ] Track signal outcomes (win/loss)
- [ ] Calculate win rate, avg P&L
- [ ] Performance leaderboard
- [ ] Historical charts

### 7. API Routes (`routes/marketplace.ts`)
- [ ] GET /marketplace/signals — List all signals
- [ ] GET /marketplace/signals/:id — Get signal details
- [ ] POST /marketplace/signals — Create signal (provider only)
- [ ] POST /marketplace/signals/:id/purchase — Buy signal
- [ ] POST /marketplace/signals/:id/review — Submit review
- [ ] GET /marketplace/providers — List providers
- [ ] GET /marketplace/providers/:id/performance — Provider stats

### 8. Dashboard UI (`dashboard/src/pages/marketplace/`)
- [ ] Marketplace home (browse signals)
- [ ] Signal detail page
- [ ] Provider profile page
- [ ] My purchases page
- [ ] Sell signals page (provider onboarding)

### 9. Tests
- [ ] Unit tests for store, registry, purchase flow
- [ ] Integration tests for API routes
- [ ] E2E test: purchase flow end-to-end

---

## Success Criteria

| Criterion | Target | Verification |
|-----------|--------|--------------|
| API endpoints | 7 routes | OpenAPI spec |
| Database models | 5 models | Prisma schema |
| Unit tests | 30+ tests | Vitest run |
| Integration tests | 10+ tests | API test suite |
| UI pages | 5 pages | Dashboard build |
| Performance | < 100ms | Load test |
| Revenue tracking | Commission calculated | Database audit |

---

## Todo List

- [x] 1. Update schema.prisma với marketplace models ✅
- [x] 2. Create signal-store.ts ✅
- [x] 3. Create provider-registry.ts ✅
- [x] 4. Create signal-purchase.ts ✅
- [x] 5. Create rating-system.ts ✅
- [x] 6. Create performance-tracker.ts ✅
- [x] 7. Create API routes ✅
- [x] 8. Create test suite ✅
- [ ] 9. Load test & performance verification ⏳ Pending PostgreSQL
- [ ] 10. Integration tests ⏳ Pending PostgreSQL

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Signal quality low | Users lose trust | Require backtest proof, rating system |
| API abuse | Rate limit bypass | Strict rate limiting per tier |
| Revenue leak | Commission not tracked | Double-entry accounting |
| Signal theft | Providers leave | Watermarking, access control |

---

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 1 signal/day, basic providers only |
| Pro | $49/month | 10 signals/day, all providers |
| Enterprise | $199/month | Unlimited signals, priority support |

**Commission:** 20% platform fee on each signal sale

---

## Next Steps

After completion:
- **Phase 20:** API Access Tier (public endpoints for external apps)
- **Phase 21:** Enterprise White-Label (custom branding for institutions)

---

**Files to Create:** 8 files
**Files to Modify:** 2 files
**Estimated Time:** 6-8 hours
