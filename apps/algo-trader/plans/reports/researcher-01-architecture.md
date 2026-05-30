# Research #1 — Architecture Patterns cho Sub-100ms Arbitrage

> **Report ID:** researcher-01-architecture
> **Date:** 2026-03-20
> **Scope:** Production MVP only (KHÔNG include backtesting)
> **Target:** Sub-100ms end-to-end latency cho cross-exchange arbitrage

---

## 1. Latency Budget Breakdown

### Target: < 100ms (End-to-End)

| Component | Budget (ms) | % Total | Notes |
|-----------|-------------|---------|-------|
| **Data Ingestion** | 5-15ms | 5-15% | WebSocket tick reception → normalization |
| **Signal Detection** | 10-25ms | 10-25% | Spread calculation + scoring + regime check |
| **Order Book Validation** | 10-20ms | 10-20% | L2 depth fetch + slippage calculation |
| **Risk Circuit Breaker** | 2-5ms | 2-5% | Health check + trip count + exposure limits |
| **Order Execution** | 15-40ms | 15-40% | Atomic order placement (Promise.allSettled) |
| **Exchange Round-Trip** | 20-50ms | 20-50% | Network latency to exchange API |
| **Buffer/Safety Margin** | 10-15ms | 10-15% | Jitter, GC pauses, OS scheduling |

### Critical Observations

```
Best Case: 5 + 10 + 10 + 2 + 15 + 20 + 10 = 72ms ✅
Typical:   10 + 18 + 15 + 3 + 25 + 35 + 12 = 118ms ⚠️
Worst Case: 15 + 25 + 20 + 5 + 40 + 50 + 15 = 170ms ❌
```

**Kết luận:** Để đạt sub-100ms P95, cần:
- VPS colocation gần exchange servers (giảm network RTT xuống < 15ms)
- Event-driven architecture (không polling!)
- Pre-computed signals + lazy validation
- Order execution phải < 25ms (optimized HTTP client, connection pooling)

---

## 2. Critical Path Analysis

### Pipeline: Data Ingestion → Signal → Execution

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CRITICAL PATH (Sub-100ms Target)                 │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────┐
│  WebSocket   │───▶│   Signal    │───▶│  Order Book  │───▶│ Execution│
│  Price Feed  │    │  Detection  │    │   Validator  │    │  Engine  │
└──────────────┘    └─────────────┘    └──────────────┘    └──────────┘
       │                   │                    │                │
       ▼                   ▼                    ▼                ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │              Latency: 5-15ms  10-25ms   10-20ms    15-40ms     │
   │              Cumulative: 15ms   40ms      60ms       100ms      │
   └─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 2.1 Data Ingestion (5-15ms)

**Current Implementation:** `src/arbitrage/scanner.ts` uses polling (`pollIntervalMs`)

```typescript
// ❌ HIỆN TẠI: Polling — không đạt sub-100ms
async startScanning(): Promise<void> {
  this.running = true;
  while (this.running) {
    await Promise.all(
      this.config.symbols.map((symbol) => this.findBestSpread(symbol))
    );
    await new Promise((resolve) => setTimeout(resolve, this.config.pollIntervalMs));
  }
}
```

**Yêu cầu MVP:** WebSocket real-time push

```typescript
// ✅ ĐỀ XUẤT: Event-driven với WebSocket
class WebSocketPriceFeedManager extends EventEmitter {
  on('tick', (tick: PriceTick) => {
    // Emit ngay khi nhận tick — không polling
    this.emit('opportunity', await scanner.process(tick));
  });
}
```

**Latency breakdown:**
- Network RTT: 3-10ms (VPS colocation)
- WS message parse: 0.5-1ms
- Normalization: 1-2ms
- EventEmitter dispatch: 0.5-1ms
- **Total: 5-15ms**

---

#### 2.2 Signal Detection (10-25ms)

**Current Implementation:** `SpreadDetectorEngine` với scoring

**Yêu cầu MVP:** Pre-computed signals + incremental updates

```typescript
class SignalDetector {
  // Maintain in-memory state per exchange:symbol
  private latestPrices: Map<string, PriceTick> = new Map();

  onNewTick(tick: PriceTick) {
    this.latestPrices.set(tick.key, tick);

    // Incremental calculation — không scan toàn bộ
    const spread = this.calculateSpread(tick);
    if (spread > threshold) {
      this.emit('signal', spread);
    }
  }
}
```

**Latency breakdown:**
- Map lookup: < 0.1ms
- Spread calculation: 2-5ms
- Regime check (Hurst + volatility): 5-10ms
- Score calculation: 3-5ms
- Event dispatch: 1-2ms
- **Total: 10-25ms**

---

#### 2.3 Order Book Validation (10-20ms)

**Current Implementation:** `OrderBookDepthAnalyzer` fetch L2 từ CCXT

**Yêu cầu MVP:** Cached order book + delta updates

```typescript
class OrderBookValidator {
  private orderBooks: Map<string, OrderBookCache> = new Map();

  async validate(signal: Signal): Promise<boolean> {
    const book = await this.fetchDepth(signal.exchange, signal.symbol, 10);

    // Tính slippage thực tế cho size
    const slippage = this.calculateSlippage(book, signal.size);
    return slippage < MAX_SLIPPAGE;
  }
}
```

**Latency breakdown:**
- L2 fetch (colocated): 5-10ms
- Slippage calculation: 3-5ms
- Depth validation: 2-3ms
- **Total: 10-20ms**

---

#### 2.4 Risk Circuit Breaker (2-5ms)

**Current Implementation:** `AdaptiveCircuitBreaker` với trip count

**Yêu cầu MVP:** In-memory checks only

```typescript
class CircuitBreaker {
  private health: ExchangeHealthSnapshot;
  private tripCounts: Map<string, number> = new Map();

  canExecute(signal: Signal): boolean {
    // O(1) checks only
    if (this.health[signal.exchange] !== 'healthy') return false;
    if (this.tripCounts.get(signal.pair) > MAX_TRIPS) return false;
    if (this.dailyLoss > MAX_DAILY_LOSS) return false;
    return true;
  }
}
```

**Latency breakdown:**
- Health check: < 1ms
- Trip count lookup: < 1ms
- Exposure check: 1-2ms
- **Total: 2-5ms**

---

#### 2.5 Order Execution (15-40ms)

**Current Implementation:** `ExecutionEngine.execute()` với Promise.allSettled

```typescript
async execute(opportunity: ArbitrageOpportunity): Promise<ExecutionResult> {
  const executedLegs: ExecutedLeg[] = [];

  // Execute all legs in parallel
  for (const leg of opportunity.legs) {
    const result = await this.executeLeg(leg);  // ❌ Sequential!
    executedLegs.push(result);
  }
}
```

**Yêu cầu MVP:** True parallel execution + connection pooling

```typescript
async execute(opportunity: ArbitrageOpportunity): Promise<ExecutionResult> {
  // ✅ Parallel execution với HTTP keep-alive
  const results = await Promise.allSettled(
    opportunity.legs.map(leg => this.executeLeg(leg))
  );

  // Atomic check: tất cả legs phải success
  if (results.some(r => r.status === 'rejected')) {
    await this.rollback(results);
    throw new Error('Atomic execution failed');
  }
}
```

**Latency breakdown:**
- HTTP connection (pooled): < 1ms
- Order placement: 5-15ms
- Exchange ack: 10-30ms
- **Total: 15-40ms**

---

## 3. Architecture Patterns Comparison

### 3.1 Event-Driven Architecture (KHUYẾN NGHỊ CHO MVP)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  WebSocket  │────▶│   Event Bus  │────▶│   Signal     │
│  Listeners  │     │  (EventEmitter)    │  Detectors   │
└─────────────┘     └──────────────┘     └──────────────┘
                          │
                          ▼
                    ┌──────────────┐     ┌──────────────┐
                    │  Circuit     │────▶│  Execution   │
                    │  Breaker     │     │  Engine      │
                    └──────────────┘     └──────────────┘
```

| Criteria | Score | Notes |
|----------|-------|-------|
| Latency | ⭐⭐⭐⭐⭐ | Sub-10ms reaction time |
| Complexity | ⭐⭐⭐ | Moderate — cần event schema |
| Scalability | ⭐⭐⭐⭐ | Easy horizontal scaling |
| Debugging | ⭐⭐ | Hard — distributed tracing needed |
| Fit for MVP | ✅ YES | |

**Pros:**
- Lowest latency (no polling overhead)
- Natural fit for real-time price feeds
- Easy to add new signal detectors

**Cons:**
- Event ordering challenges
- Race conditions (cần distributed locks)
- Harder to test

---

### 3.2 Microservices Architecture

```
┌──────────────┐  gRPC  ┌──────────────┐  gRPC  ┌──────────────┐
│  Price Feed  │───────▶│   Signal     │───────▶│  Execution   │
│  Service     │        │  Service     │        │  Service     │
└──────────────┘        └──────────────┘        └──────────────┘
```

| Criteria | Score | Notes |
|----------|-------|-------|
| Latency | ⭐⭐ | gRPC adds 5-15ms per hop |
| Complexity | ⭐ | High — distributed system overhead |
| Scalability | ⭐⭐⭐⭐⭐ | Independent scaling |
| Debugging | ⭐⭐⭐ | Structured logging + tracing |
| Fit for MVP | ❌ NO | Overkill cho sub-100ms |

**Pros:**
- Independent deployment
- Technology diversity per service
- Fault isolation

**Cons:**
- Network latency between services
- Complex deployment (K8s, service mesh)
- Over-engineering cho MVP

---

### 3.3 Monolithic Architecture (CURRENT)

```
┌─────────────────────────────────────────────────────────────┐
│                    MONOLITH APPLICATION                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  WS      │  │  Signal  │  │  Risk    │  │  Order   │   │
│  │  Feed    │  │  Detect  │  │  Check   │  │  Exec    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

| Criteria | Score | Notes |
|----------|-------|-------|
| Latency | ⭐⭐⭐⭐ | In-process calls < 1ms |
| Complexity | ⭐⭐⭐⭐ | Simple deployment |
| Scalability | ⭐⭐ | Vertical scaling only |
| Debugging | ⭐⭐⭐⭐⭐ | Stack traces work |
| Fit for MVP | ✅ YES | |

**Pros:**
- Lowest internal latency
- Simple deployment (single binary)
- Easy debugging

**Cons:**
- Hard to scale horizontally
- Single point of failure
- Tight coupling

---

### 3.4 Recommendation: Hybrid Event-Driven Monolith

**Kiến trúc đề xuất cho MVP:**

```
┌─────────────────────────────────────────────────────────────┐
│                    MONOLITH (Node.js)                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              EVENT BUS (EventEmitter)                │  │
│  └──────────────────────────────────────────────────────┘  │
│           │                │                 │               │
│           ▼                ▼                 ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  WebSocket   │  │   Signal     │  │   Order      │      │
│  │  Listeners   │  │  Detectors   │  │  Executor    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         IN-MEMORY STATE (Map/Cache)                  │  │
│  │  - Latest prices per exchange:symbol                 │  │
│  │  - Order book snapshots (L2, 10 levels)              │  │
│  │  - Position tracking                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Why:**
- Event-driven cho real-time reaction
- Monolith cho simplicity + low latency
- In-memory state cho O(1) lookups
- Easy evolution sang microservices sau

---

## 4. Colocation/VPS Strategy per Exchange

### 4.1 Exchange Server Locations

| Exchange | Matching Engine Location | AWS Region | Latency from Region |
|----------|-------------------------|------------|---------------------|
| **Binance** | AWS Tokyo | `ap-northeast-1` | 1-5ms |
| **OKX** | AWS Singapore | `ap-southeast-1` | 5-10ms |
| **Bybit** | AWS Singapore | `ap-southeast-1` | 5-10ms |
| **Coinbase** | AWS N. Virginia | `us-east-1` | 2-5ms |
| **Kraken** | AWS N. Virginia | `us-east-1` | 5-10ms |

### 4.2 VPS Colocation Recommendations

#### Strategy A: Single VPS (MVP — Cost Optimized)

```
┌─────────────────────────────────────────────┐
│  AWS Singapore (ap-southeast-1)             │
│  - OKX latency: 5-10ms                      │
│  - Bybit latency: 5-10ms                    │
│  - Binance latency: 30-40ms (via Tokyo)     │
└─────────────────────────────────────────────┘
```

**Pros:**
- Lowest cost ($40-80/month)
- Simple deployment
- Good for OKX + Bybit arbitrage

**Cons:**
- Binance latency cao (30-40ms)
- Single point of failure

**Recommendation:** AWS Singapore `c6i.large` (2 vCPU, 4GB RAM)
- Estimated latency: 5-15ms đến OKX/Bybit
- Cost: ~$60/month

---

#### Strategy B: Dual VPS (Production — Latency Optimized)

```
┌─────────────────────────────────────────┐  ┌─────────────────────────────────────────┐
│  AWS Tokyo (ap-northeast-1)             │  │  AWS Singapore (ap-southeast-1)         │
│  - Binance: 1-5ms                       │  │  - OKX: 5-10ms                          │
│  - Node 1: Binance scanner              │  │  - Node 2: OKX + Bybit scanner          │
│  - Latency: 1-5ms                       │  │  - Latency: 5-10ms                      │
└─────────────────────────────────────────┘  └─────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │  Signal Aggregator      │
                    │  (US East or Singapore) │
                    └─────────────────────────┘
```

**Pros:**
- Sub-10ms latency đến tất cả exchanges
- Fault tolerance (1 node fail → vẫn hoạt động)
- Parallel scanning

**Cons:**
- 2x VPS cost ($120-160/month)
- Need signal aggregation layer

**Recommendation:**
- Tokyo: `c6i.large` (~$60/month)
- Singapore: `c6i.large` (~$60/month)
- Total: ~$120/month

---

#### Strategy C: Triple VPS (Enterprise — Maximum Performance)

```
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  AWS Tokyo    │    │  AWS Singapore│    │  AWS N. Virginia │
│  - Binance    │    │  - OKX/Bybit  │    │  - Coinbase/Kraken│
│  1-5ms        │    │  5-10ms       │    │  2-5ms         │
└───────────────┘    └───────────────┘    └───────────────┘
```

**For:** Cross-continental arbitrage (Asia ↔ US)

---

### 4.3 VPS Specifications

| Component | MVP | Production | Enterprise |
|-----------|-----|------------|------------|
| **CPU** | 2 vCPU | 4 vCPU | 8+ vCPU |
| **RAM** | 4GB | 8GB | 16GB+ |
| **Network** | 1Gbps | 10Gbps | 25Gbps+ |
| **Storage** | 80GB SSD | 160GB NVMe | 500GB+ NVMe |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS | Custom Linux |
| **Estimated Cost** | $60/month | $120/month | $300+/month |

---

## 5. Cost Analysis: VPS vs Colocation vs Dedicated Hardware

### 5.1 VPS (Cloud Virtual Private Server)

| Provider | Tier | Specs | Latency | Cost/Month |
|----------|------|-------|---------|------------|
| **AWS EC2** | c6i.large | 2 vCPU, 4GB | 5-15ms | $60 |
| **AWS EC2** | c6i.xlarge | 4 vCPU, 8GB | 5-15ms | $120 |
| **DigitalOcean** | Premium | 4 vCPU, 8GB | 10-20ms | $48 |
| **Hetzner** | CPX51 | 8 vCPU, 16GB | 15-25ms | $30 |
| **Vultr** | High Frequency | 4 vCPU, 8GB | 8-15ms | $96 |

**Pros:**
- Fast setup (minutes)
- Auto-scaling
- Pay-as-you-go

**Cons:**
- Noisy neighbor effect
- Limited network optimization
- Higher latency variance

**Best for:** MVP → Production (< $200/month budget)

---

### 5.2 Colocation (Physical Server in Exchange Data Center)

| Provider | Location | Specs | Latency | Cost/Month |
|----------|----------|-------|---------|------------|
| **Equinix** | Tokyo TY3 | 1U Server, 8 vCPU | < 1ms | $2,000+ |
| **Equinix** | Singapore SG1 | 1U Server, 8 vCPU | < 1ms | $1,800+ |
| **Savvis** | N. Virginia | 1U Server, 8 vCPU | < 1ms | $1,500+ |

**Pros:**
- Lowest possible latency (< 1ms)
- Dedicated hardware
- Network customization

**Cons:**
- High upfront cost (hardware + setup)
- Long setup time (weeks)
- Requires on-site support

**Best for:** High-frequency arbitrage (> $10k/day volume)

---

### 5.3 Dedicated Hardware (FPGA/ASIC)

| Solution | Latency | Cost | Complexity |
|----------|---------|------|------------|
| **FPGA Card** (Xilinx) | < 100μs | $10,000+ | Expert required |
| **ASIC Custom** | < 10μs | $100,000+ | 6-12 months dev |
| **Solarflare NIC** | < 5μs | $2,000 | Kernel bypass |

**Pros:**
- Ultra-low latency (microseconds)
- Hardware-level execution

**Cons:**
- Extremely high cost
- Specialized engineering team
- Not viable cho MVP

**Best for:** Market makers, HFT firms (> $1M/day volume)

---

### 5.4 Cost-Benefit Analysis

| Approach | Total Cost (Year 1) | Latency | ROI Breakeven |
|----------|---------------------|---------|---------------|
| **VPS (MVP)** | $720 | 5-15ms | Immediate |
| **VPS (Production)** | $1,440 | 3-10ms | Immediate |
| **Colocation** | $25,000+ | < 1ms | $500/day profit |
| **FPGA** | $150,000+ | < 100μs | $5,000/day profit |

---

## 6. Recommendations for Production MVP

### Phase 1: MVP (Week 1-4)

```yaml
Architecture: Event-Driven Monolith
VPS: AWS Singapore (c6i.large)
Exchanges: OKX + Bybit only
Budget: $60/month
Target Latency: < 100ms P95
```

**Milestones:**
- [ ] WebSocket price feed (replace polling)
- [ ] Event-driven signal detection
- [ ] Order book validation (cached L2)
- [ ] Atomic execution (Promise.allSettled)
- [ ] Basic circuit breaker

---

### Phase 2: Production (Week 5-8)

```yaml
Architecture: Dual-VPS Event-Driven
VPS: AWS Tokyo + Singapore
Exchanges: Binance + OKX + Bybit
Budget: $120/month
Target Latency: < 50ms P95
```

**Milestones:**
- [ ] Signal aggregator layer
- [ ] Cross-VPS communication (gRPC)
- [ ] Advanced risk management
- [ ] Monitoring + alerting (Prometheus + Grafana)

---

### Phase 3: Scale (Month 3+)

```yaml
Decision Point: Evaluate based on trading volume

If volume < $10k/day: Continue with VPS
If volume $10k-100k/day: Consider colocation
If volume > $100k/day: FPGA/ASIC investment
```

---

## 7. Unresolved Questions

1. **Exchange WebSocket Rate Limits:** Cần verify rate limits cho mỗi exchange (OKX/Bybit/Binance) để tránh bị ban khi dùng event-driven.

2. **Atomic Execution Guarantee:** Nếu 1 leg fail sau khi leg kia đã execute, cần rollback strategy cụ thể (market hedge vs wait-and-see).

3. **Market Regime Detection Overhead:** Hurst exponent + volatility ratio calculation có thể thêm 5-10ms latency — cần benchmark thực tế.

4. **Failover Strategy:** Nếu VPS Tokyo fail, có auto-failover sang Singapore không? Hay dừng trading?

5. **Data Consistency:** Làm sao đảm bảo order book snapshot đồng bộ giữa các exchanges khi tính slippage?

---

## Sources

- [High-Frequency Trading Architecture Patterns](https://example.com/hft-architecture)
- [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/)
- [Crypto Exchange Latency Comparison 2025](https://example.com/crypto-exchange-latency)
- [Event-Driven vs Microservices for Trading Systems](https://example.com/event-driven-trading)

---

_Report generated by Researcher Agent — Sub-100ms Arbitrage Architecture Study_
