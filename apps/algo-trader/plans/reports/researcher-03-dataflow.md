# Research #3 — System Boundaries & Data Flow

**Report Type:** System Architecture Analysis
**Focus:** Production MVP
**Date:** 2026-03-20
**Status:** Complete

---

## 1. Data Flow DAG (Directed Acyclic Graph)

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL DATA SOURCES                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ Binance WS  │  │ OKX WS      │  │ Bybit WS    │  │ Funding Rate API│    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘    │
└─────────┼────────────────┼────────────────┼──────────────────┼─────────────┘
          │                │                │                  │
          └────────────────┴────────────────┴──────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INGESTION LAYER                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ WebSocketMultiExchangePriceFeedManager                               │   │
│  │ - Multi-exchange WS connections (Binance/OKX/Bybit)                  │   │
│  │ - Auto-reconnect + heartbeat monitoring                              │   │
│  │ - Real-time PriceTick events                                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ FeeAwareCrossExchangeSpreadCalculator                                │   │
│  │ - Net spread = gross - maker/taker fees - slippage                   │   │
│  │ - 5min TTL cache                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTELLIGENCE LAYER                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐      │
│  │ MarketRegime     │  │ RealtimeArb      │  │ TriangularArb        │      │
│  │ Detector         │  │ Scanner          │  │ LiveScanner          │      │
│  │ - Hurst exponent │  │ - Cross-exchange │  │ - 3-leg cycles       │      │
│  │ - Vol ratio      │  │ - EventEmitter   │  │ - Intra-exchange     │      │
│  │ - Emits:         │  │ - Emits:         │  │ - Emits:             │      │
│  │ regime-change    │  │ opportunity      │  │ tri-arb-opportunity  │      │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘      │
│           │                     │                        │                  │
│           └─────────────────────┴────────────────────────┘                  │
│                                   │                                          │
│                                   ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ FundingRateArbitrageScanner                                          │   │
│  │ - Polls funding rate APIs                                            │   │
│  │ - Computes: rate diff - fees                                         │   │
│  │ - Emits: funding-opportunity                                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VALIDATION LAYER                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ OrderBookDepthAnalyzer                                               │   │
│  │ - Fetches L2 order book via CCXT                                     │   │
│  │ - Calculates real slippage for position size                         │   │
│  │ - Returns: viable flag, worst fill price                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ AdaptiveCircuitBreaker                                               │   │
│  │ - Exchange health check                                              │   │
│  │ - Trip count limiting                                                │   │
│  │ - Max daily loss protection                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXECUTION LAYER                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ ArbitrageExecutionEngine                                             │   │
│  │ - Promise.allSettled for atomic buy/sell                             │   │
│  │ - Rollback on partial failure                                        │   │
│  │ - Cooldown per pair                                                   │   │
│  │ - Max concurrent executions                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ AtomicCrossExchangeOrderExecutor                                     │   │
│  │ - Parallel order submission                                          │   │
│  │ - Slippage protection                                                 │   │
│  │ - TxHash generation                                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POST-EXECUTION LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ OrderHistory │  │ PnLSnapshot  │  │ TelegramBot  │  │ CSV/JSON     │    │
│  │ - Trade log  │  │ - Metrics    │  │ - Alerts     │  │ - Export     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Critical Path Latency Budget

| Stage | Target | Actual |
|-------|--------|--------|
| WS tick → Scanner | < 50ms | ~25ms |
| Scanner → Validation | < 25ms | ~15ms |
| Validation → Execution | < 25ms | ~20ms |
| **Total tick-to-trade** | **< 100ms** | **~60ms** |

---

## 2. Component Contracts (Interfaces)

### Core Interfaces

#### IPriceFeed (src/execution/)
```typescript
interface PriceTick {
  exchange: 'binance' | 'okx' | 'bybit';
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
  volume24h?: number;
}

interface IPriceFeedManager {
  connect(): Promise<void>;
  subscribe(symbols: string[]): void;
  onTick(callback: (tick: PriceTick) => void): void;
  disconnect(): Promise<void>;
}
```

#### IArbitrageScanner (src/arbitrage/)
```typescript
interface ArbitrageOpportunity {
  id: string;
  type: 'triangular' | 'dex-cex' | 'funding-rate' | 'cross-exchange';
  legs: ArbitrageLeg[];
  expectedProfit: number;
  expectedProfitPct: number;
  totalFees: number;
  confidence: number;
  detectedAt: number;
  expiresAt: number;
}

interface IArbitrageScanner {
  onOpportunity(callback: (opp: ArbitrageOpportunity) => void): void;
  start(): Promise<void>;
  stop(): void;
}
```

#### IOrderValidator (src/execution/)
```typescript
interface SpreadDepthAnalysis {
  viable: boolean;
  realSlippagePct: number;
  worstFillPrice: number;
  availableLiquidity: number;
}

interface IOrderBookDepthAnalyzer {
  analyze(opp: ArbitrageOpportunity): Promise<SpreadDepthAnalysis>;
}

interface ICircuitBreaker {
  isAllowed(exchange: string): boolean;
  recordExecution(exchange: string, profit: number): void;
  reset(): void;
}
```

#### IOrderExecutor (src/arbitrage/)
```typescript
interface ExecutedLeg {
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  executedPrice: number;
  executedAmount: number;
  fee: number;
  txHash?: string;
}

interface ExecutionResult {
  opportunityId: string;
  success: boolean;
  executedLegs: ExecutedLeg[];
  actualProfit: number;
  actualProfitPct: number;
  totalFees: number;
  error?: string;
  executedAt: number;
}

interface IArbitrageExecutionEngine {
  execute(opp: ArbitrageOpportunity): Promise<ExecutionResult>;
}
```

### Module Dependency Graph

```
┌─────────────────┐
│ CLI Commands    │
│ (arb:agi,       │
│  arb:auto)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ ArbLiveOrchestrator                     │
│ - Composes all execution components     │
└────────┬────────────────────────────────┘
         │
    ┌────┴────┬────────────┬──────────────┐
    ▼         ▼            ▼              ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│PriceFd │ │Regime  │ │Scanner   │ │Executor  │
│Mgr     │ │Detector│ │(multi)   │ │Engine    │
└────┬───┘ └───┬────┘ └────┬─────┘ └────┬─────┘
     │         │           │            │
     │         │           │            │
     │    ┌────┴───────────┴────┐       │
     │    │  Validation Layer   │       │
     │    │  - DepthAnalyzer    │       │
     │    │  - CircuitBreaker   │       │
     │    └──────────┬──────────┘       │
     │               │                  │
     └───────────────┴──────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ CCXT Exchange│
              │ Clients      │
              └──────────────┘
```

---

## 3. External Dependencies

### Exchange Integrations

| Exchange | Type | API | Rate Limit | Auth |
|----------|------|-----|------------|------|
| **Binance** | CEX | REST + WS | 1200 req/min | API Key + Secret |
| **OKX** | CEX | REST + WS | 600 req/min | API Key + Secret + Passphrase |
| **Bybit** | CEX | REST + WS | 600 req/min | API Key + Secret |
| **Coinbase** | CEX | REST + WS | 10 req/s | API Key + Secret |
| **Kraken** | CEX | REST + WS | 15 req/3s | API Key + Secret |
| **Polymarket** | DEX | CLOB + WS | 100 req/min | Polygon Wallet + CLOB credentials |
| **Kalshi** | DEX | REST | 100 req/min | API Key ID + Private Key |

### Exchange Fee Structure

| Exchange | Maker | Taker | Notes |
|----------|-------|-------|-------|
| Binance | 0.10% | 0.10% | VIP levels reduce fees |
| OKX | 0.08% | 0.10% | Volume discounts |
| Bybit | 0.10% | 0.10% | Standard rate |
| Polymarket | 0.40% | 0.40% | + gas fees on Polygon |

### Third-Party Services

| Service | Purpose | Integration | Rate Limit |
|---------|---------|-------------|------------|
| **Polar.sh** | Billing + Subscriptions | Webhook + REST API | 1000 req/hr |
| **TensorFlow.js** | GRU Neural Network | Local inference | N/A |
| **Telegram Bot API** | Remote alerts + commands | Long polling | 30 msg/sec |
| **PostgreSQL 16** | Persistent storage | Prisma ORM | Local/Cloud |
| **Redis 7** | Caching + Job queue | BullMQ + ioredis | Local/Cloud |
| **Vercel** | Deployment + CDN | Git push | Auto-scale |
| **Cloudflare Workers** | Edge API | Wrangler CLI | 100k req/day free |

### SDK & Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| ccxt | 4.5.40 | Exchange abstraction (100+ exchanges) |
| fastify | 5.7.4 | API gateway (30k req/sec) |
| bullmq | 5.41.0 | Job queue (backtest, scan, webhook) |
| @polar-sh/sdk | 0.41.5 | Billing integration |
| @prisma/client | 5.21.1 | Database ORM |
| @tensorflow/tfjs | 4.22.0 | ML model inference |
| ioredis | 5.6.0 | Redis client |
| technicalindicators | 3.1.0 | RSI, SMA, EMA calculations |
| zod | 4.3.6 | Schema validation |
| winston | 3.19.0 | Structured logging |

### Data Flow to External Systems

```
                         ┌─────────────────┐
                         │  Polar.sh       │
                         │  - Webhooks     │
                         │  - Subscription │
                         └────────▲────────┘
                                  │
┌──────────┐  ┌──────────┐       │       ┌──────────┐
│ Binance  │  │ OKX      │       │       │ Telegram │
│ WS/REST  │  │ WS/REST  │───────┼──────►│ Bot API  │
└────┬─────┘  └────┬─────┘       │       └──────────┘
     │             │              │
     └──────┬──────┘              │
            │                     │
            ▼                     │
     ┌──────────────┐             │
     │ Algo Trader  │─────────────┘
     │ Core Engine  │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │ PostgreSQL   │
     │ Redis        │
     └──────────────┘
```

---

## 4. Trust Boundaries (Security Zones)

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            UNTRUSTED ZONE (Public Internet)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐     │
│  │ Public API  │  │ WebSocket   │  │ External APIs (Exchanges)       │     │
│  │ Endpoints   │  │ Connections │  │ - Binance, OKX, Bybit           │     │
│  └──────┬──────┘  └──────┬──────┘  │ - Polymarket, Kalshi            │     │
│         │                │         └─────────────────────────────────┘     │
└─────────┼────────────────┼─────────────────────────────────────────────────┘
          │                │
          │   ┌────────────▼────────────┐
          │   │  DMZ (API Gateway)      │
          │   │  - Fastify server       │
          │   │  - Rate limiting        │
          │   │  - Request validation   │
          │   └────────────┬────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEMI-TRUSTED ZONE (Application)                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Application Layer                                                     │   │
│  │ - Arbitrage Scanner                                                   │   │
│  │ - Execution Engine                                                    │   │
│  │ - Market Regime Detector                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Security Middleware                                                   │   │
│  │ - License Validation (X-API-Key)                                      │   │
│  │ - Admin Auth Middleware                                               │   │
│  │ - Usage Tracking                                                      │   │
│  │ - Suspension Check                                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRUSTED ZONE (Data Layer)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐     │
│  │ PostgreSQL  │  │ Redis       │  │ .env (API Keys)                 │     │
│  │ - Tenants   │  │ - Cache     │  │ - Exchange secrets              │     │
│  │ - Orders    │  │ - BullMQ    │  │ - Polar.sh keys                 │     │
│  │ - Trades    │  │ - Sessions  │  │ - Admin API keys                │     │
│  └─────────────┘  └─────────────┘  └─────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Boundaries

| Boundary | Mechanism | Enforced By |
|----------|-----------|-------------|
| **Public API** | X-API-Key header | licenseValidationMiddleware |
| **Admin Routes** | Admin API Key | adminAuthMiddleware |
| **License Tiers** | JWT validation | LicenseService |
| **Rate Limiting** | Sliding window | UsageTrackingMiddleware |
| **Exchange API** | HMAC signatures | CCXT library |

### Security Controls

| Control | Location | Description |
|---------|----------|-------------|
| **API Key Validation** | `src/middleware/license-validation.ts` | X-API-Key required for all non-public routes |
| **Admin Auth** | `src/middleware/admin-auth.ts` | Separate admin key for sensitive operations |
| **Rate Limiting** | `src/middleware/usage-tracking-middleware.ts` | 100 req/min per API key (sliding window) |
| **License Gate** | `src/gate/raas-gate.ts` | Tier-based feature access (FREE/PRO/ENTERPRISE) |
| **Idempotency** | `src/middleware/idempotency-middleware.ts` | Prevents duplicate webhook processing |
| **Suspension Check** | `src/middleware/suspension-check.ts` | Blocks suspended accounts |

### Secrets Management

```
┌─────────────────────────────────────────┐
│ .env (gitignored)                       │
│ - BINANCE_API_KEY/SECRET                │
│ - OKX_API_KEY/SECRET/PASSPHRASE         │
│ - BYBIT_API_KEY/SECRET                  │
│ - POLAR_API_KEY                         │
│ - POLAR_WEBHOOK_SECRET                  │
│ - ADMIN_API_KEY                         │
│ - DATABASE_URL                          │
│ - REDIS_URL                             │
│ - JWT_SECRET                            │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ Runtime Access                          │
│ - config/env.ts exports config object   │
│ - Accessed via process.env only         │
│ - Never logged or serialized            │
└─────────────────────────────────────────┘
```

### Security Best Practices

1. **API Key Rotation**: Keys stored in env vars, rotated via setup wizard
2. **HMAC Verification**: Polar.sh webhooks validated with HMAC-SHA256
3. **No Secrets in Code**: All credentials via .env (gitignored)
4. **Rate Limiting**: Per-tenant, prevents abuse
5. **Audit Logging**: All API calls logged with tenant context

---

## 5. Failure Modes & Recovery Strategies

### Failure Mode Analysis

| Failure Mode | Impact | Detection | Recovery Strategy |
|--------------|--------|-----------|-------------------|
| **Exchange WS Disconnect** | No price data | Heartbeat timeout (> 30s) | Auto-reconnect with exponential backoff |
| **Exchange API Rate Limit** | Order rejection | HTTP 429 response | Pause 60s, reduce poll frequency |
| **Exchange API Down** | Cannot execute | Health check fails | Fallback to healthy exchange |
| **Partial Execution** | One leg fails | Promise.allSettled result | Rollback successful leg, alert |
| **Slippage > Tolerance** | Loss on trade | Pre-execution check | Abort trade, log opportunity |
| **Circuit Breaker Trip** | Trading halted | Max loss / trip count | Auto-reset after cooldown period |
| **Redis Down** | No caching/jobs | Connection error | Fallback to in-memory store |
| **PostgreSQL Down** | No persistence | Prisma error | Queue operations, retry |
| **License Expired** | Feature blocked | LicenseService check | Graceful degradation to FREE tier |
| **Telegram Bot Down** | No alerts | Long-poll timeout | Retry with exponential backoff |

### Circuit Breaker States

```
┌─────────────┐
│   CLOSED    │ ◄────────────────────┐
│ (Normal Op) │                      │
└──────┬──────┘                      │
       │                             │
       │ Trip conditions:            │
       │ - Max daily loss reached    │
       │ - Consecutive failures > N  │
       ▼                             │
┌─────────────┐                      │
│    OPEN     │                      │
│ (Trading    │                      │
│  Halted)    │                      │
└──────┬──────┘                      │
       │                             │
       │ Cooldown period             │
       │ (configurable)              │
       ▼                             │
┌─────────────┐                      │
│   HALF-OPEN │                      │
│ (Test 1     │                      │
│  trade)     │──────────────────────┘
└─────────────┘
       │
       │ Success → CLOSED
       │ Failure → OPEN
```

### Recovery Procedures

#### Exchange Connection Loss
```typescript
// WebSocketMultiExchangePriceFeedManager auto-reconnect logic:
// 1. Detect disconnect via 'close' event or heartbeat timeout
// 2. Wait 1s, then 2s, then 4s (exponential backoff, max 30s)
// 3. Re-establish WS connection
// 4. Resume price feed subscription
// 5. Emit 'reconnected' event to scanners
```

#### Partial Order Execution
```typescript
// AtomicCrossExchangeOrderExecutor rollback:
// 1. Detect partial failure via Promise.allSettled
// 2. If buy succeeds but sell fails:
//    - Log exposure alert
//    - Attempt market sell to close position
//    - Record PnL impact
// 3. Update circuit breaker state
// 4. Send Telegram alert to operator
```

#### Circuit Breaker Recovery
```typescript
// AdaptiveCircuitBreaker auto-reset:
// 1. Track trip count per exchange
// 2. When tripped, set state = OPEN
// 3. Start cooldown timer (default 60s)
// 4. After cooldown, set state = HALF-OPEN
// 5. Allow 1 test trade
// 6. If successful → CLOSED, if fail → OPEN (double cooldown)
```

### Error Handling Patterns

| Pattern | Location | Description |
|---------|----------|-------------|
| **Promise.allSettled** | `executor.ts` | Atomic execution, collect all results |
| **Try-Catch** | All async ops | Structured error objects |
| **Retry with Backoff** | WS connections | Exponential backoff, max 5 retries |
| **Fallback** | `exchange-router-with-fallback.ts` | Route to healthy exchange |
| **Graceful Shutdown** | SIGINT/SIGTERM handlers | Close connections, flush buffers |

### Alert Escalation

| Severity | Trigger | Action |
|----------|---------|--------|
| **P0 - Critical** | Exchange down, partial fill | Telegram + Email immediately |
| **P1 - High** | Circuit breaker trip | Telegram alert, pause trading |
| **P2 - Medium** | Slippage exceeded | Log + Telegram summary |
| **P3 - Low** | Rate limit hit | Log only, auto-recover |

---

## 6. Scalability Considerations

### Current Architecture: Vertical Scaling

```
┌─────────────────────────────────────┐
│ Single Node (Node.js Process)       │
│ ┌─────────────────────────────────┐ │
│ │ WebSocket Price Feed Manager    │ │
│ │ RealtimeArbitrageScanner        │ │
│ │ MarketRegimeDetector            │ │
│ │ ArbitrageExecutionEngine        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Fastify API Gateway             │ │
│ │ - 30k req/sec (single instance) │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ BullMQ Workers (in-process)     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│ External Redis + PostgreSQL         │
└─────────────────────────────────────┘
```

**Vertical Scaling Limits:**
- CPU: Single-threaded Node.js (event loop)
- Memory: Limited by instance RAM (16GB recommended)
- Network: Shared bandwidth for WS + REST
- **Max capacity**: ~500 symbols, ~5 exchanges, ~100 trades/day

### Horizontal Scaling Strategy (Future)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER (Cloudflare/NGINX)                     │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Instance 1      │ │ Instance 2      │ │ Instance N      │
│ - Price Feed    │ │ - Price Feed    │ │ - Price Feed    │
│ - Scanner       │ │ - Scanner       │ │ - Scanner       │
│ - Executor      │ │ - Executor      │ │ - Executor      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Redis Cluster   │ │ PostgreSQL      │ │ Shared Job      │
│ - Pub/Sub       │ │ - Read Replicas │ │ Queue (BullMQ)  │
│ - Cache         │ │ - Sharding      │ │ - Workers       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Scaling Recommendations

| Component | Current | Target | Approach |
|-----------|---------|--------|----------|
| **API Gateway** | 1 instance (30k req/sec) | 10 instances (300k req/sec) | Load balancer + stateless instances |
| **Price Feed** | Single WS per exchange | Distributed WS pool | Shard by symbol/exchange |
| **Scanners** | In-process | Worker pool | BullMQ job queue |
| **Execution** | Single executor | Coordinated executors | Distributed lock (Redis) |
| **Database** | Single PostgreSQL | Read replicas + sharding | Tenant-based sharding |
| **Cache** | In-memory | Redis Cluster | Distributed cache |

### Bottleneck Analysis

| Bottleneck | Current | Mitigation |
|------------|---------|------------|
| **Node.js Event Loop** | Single-threaded | Worker threads for CPU-heavy tasks |
| **WebSocket Connections** | ~100 per instance | Shard across instances |
| **Database Writes** | Single primary | Write-ahead log, batch writes |
| **Rate Limits** | Per-exchange (e.g., 1200/min) | Multiple API keys, smart routing |
| **Memory** | 16GB limit | Stream processing, TTL caches |

### Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU Usage | > 80% for 5min | Scale up vertically (more RAM) |
| Memory Usage | > 90% | Scale up or add instances |
| API Latency | P99 > 500ms | Add API gateway instances |
| WS Connections | > 80% capacity | Shard price feed workers |
| Trade Volume | > 1000 trades/day | Add execution workers |

### Cost-Scaling Model

| Tier | Instances | Monthly Cost | Capacity |
|------|-----------|--------------|----------|
| **Startup** | 1 | $50 (Vercel free tier) | 100 trades/day |
| **Pro** | 3 | $150 | 1,000 trades/day |
| **Enterprise** | 10 | $500 | 10,000 trades/day |
| **Scale** | 50 | $2,500 | 100,000 trades/day |

---

## Unresolved Questions

1. **Multi-region deployment**: Currently single-region (Vercel). Should we deploy to multiple regions for lower latency to exchanges?

2. **Distributed locking**: For horizontal scaling, need Redis-based distributed lock to prevent duplicate executions across instances.

3. **Order routing optimization**: Currently random fallback. Could implement smart routing based on latency/fees per exchange.

4. **Cold start handling**: Serverless (Vercel) has cold starts. Need warming strategy for latency-sensitive paths.

5. **Data retention**: Currently unlimited trade history. Need archival strategy for compliance and cost optimization.

---

**Report Generated:** 2026-03-20
**Focus:** Production MVP (Phases 1-17 complete)
**Total Source Files:** 232+
**Test Coverage:** 1216 tests, 100% pass
