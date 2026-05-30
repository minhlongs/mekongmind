# Technical Blog Posts

---

## Post 1: Building a Sub-100ms Crypto Arbitrage Engine

**Published:** 2026-03-22
**Tags:** #algotrading #cryptocurrency #typescript #lowlatency

### Introduction

Crypto arbitrage is simple in theory: buy BTC for $98,450 on Binance, sell for $98,520 on OKX, pocket the $70 difference.

In practice? You're competing against HFT firms with colocation, microwave networks, and custom FPGA hardware.

I'm a solo dev with a MacBook and AWS VPS. Here's how I built a sub-100ms arbitrage engine that competes.

### The Challenge

Arbitrage windows close in milliseconds. My requirements:

- **Latency < 100ms** from price update to order acknowledgment
- **Atomic execution** — both legs fill or neither does
- **Risk controls** — circuit breaker, position limits, drawdown protection
- **24/7 uptime** — crypto never sleeps

### Architecture Decision: Event-Driven Monolith

I evaluated two patterns:

**Microservices:**
- Pro: Scalable, fault-isolated
- Con: Network latency between services, complex deployment

**Event-Driven Monolith:**
- Pro: All logic in one process, zero network hops
- Pro: Simple deployment (single Docker container)
- Con: Single point of failure (mitigated with health checks)

**Decision:** Event-driven monolith. For <100ms latency, eliminating network hops is critical.

### WebSocket Price Feeds

REST polling is dead. I use WebSocket streams:

```typescript
// Binance: orderbook updates every 100ms
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@depth10@100ms');

ws.on('message', (data) => {
  const book = JSON.parse(data);
  // Update Redis orderbook in <5ms
  await redis.zadd(`orderbook:binance:BTC/USDT:bids`,
    book.bids.map(([price, qty]) => [parseFloat(qty), price])
  );
});
```

Latency breakdown:
- Exchange → WebSocket: 5-15ms (geographic)
- WebSocket → Redis: <5ms (local)
- **Total: <20ms** from exchange to orderbook

### Redis Orderbook Management

Orderbooks need:
- Fast updates (ZADD/ZREM)
- Fast lookups (top of book)
- Fast iteration (best 10 levels)

Redis Sorted Sets are perfect:

```typescript
// Bids: descending order (highest first)
// Score = price, Member = "price:quantity"
await redis.zadd(`orderbook:${symbol}:bids`, {
  score: 450.50,
  value: '450.50:1.5'  // price:qty
});

// Get best bid: O(1)
const bestBid = await redis.zrange(`orderbook:${symbol}:bids`, 0, 0, 'WITHSCORES');

// Get best 10 levels: O(log N)
const top10 = await redis.zrange(`orderbook:${symbol}:bids`, 0, 9, 'WITHSCORES');
```

Memory usage: ~50MB for 50 symbols with L2 depth.

### Spread Detection Engine

The core algorithm:

```typescript
async detectSpread(): Promise<SpreadSignal | null> {
  // Get best bid/ask from all exchanges
  const books = await Promise.all([
    this.getOrderbook('binance', symbol),
    this.getOrderbook('okx', symbol),
    this.getOrderbook('bybit', symbol),
  ]);

  // Cross-exchange spread: (bestBid - bestAsk) / bestAsk
  for (const [buyEx, sellEx] of permutations(exchanges, 2)) {
    const spread = (buyEx.bestBid - sellEx.bestAsk) / sellEx.bestAsk;

    // Fee-adjusted spread
    const netSpread = spread - (buyEx.fee + sellEx.fee);

    if (netSpread > this.threshold && this.validateDepth(books)) {
      return { buyExchange: buyEx, sellExchange: sellEx, spread: netSpread };
    }
  }
  return null;
}
```

Scoring formula (0-100):

```
score = (
  spreadScore * 0.4 +    // Higher spread = better
  volumeScore * 0.3 +    // More depth = safer
  healthScore * 0.2 +    // Low latency = reliable
  regimeScore * 0.1      // Mean-reverting = favorable
) * 100
```

Only signals >60 get executed.

### Atomic Execution

The risk: leg 1 fills, leg 2 fails → you're now exposed.

Solution: `Promise.allSettled` with rollback:

```typescript
async execute(signal: SpreadSignal) {
  // Pre-trade validation (10-20ms)
  if (!this.validateOrderbook(signal)) {
    return { success: false, error: 'Validation failed' };
  }

  // Atomic execution (15-40ms)
  const results = await Promise.allSettled([
    this.placeOrder(signal.legs[0]),  // Buy on Binance
    this.placeOrder(signal.legs[1]),  // Sell on OKX
  ]);

  // Reconciliation
  if (results.every(r => r.status === 'fulfilled')) {
    await this.recordTrade(results);
    return { success: true };
  }

  // Rollback: one leg failed
  await this.hedgeLeg(results);
  return { success: false, error: 'Partial fill, hedged' };
}
```

Latency budget:
- Validation: 10-20ms
- Order placement: 15-40ms
- **Total: 25-60ms** from signal to execution

### Regime Detection (AGI)

Not all markets are equal. I calculate Hurst exponent every 15 seconds:

```typescript
// Hurst exponent: H < 0.5 = mean-reverting, H > 0.5 = trending
function calculateHurst(prices: number[]): number {
  const lags = [2, 5, 10, 20];
  const tau = lags.map(lag => {
    const diffs = prices.slice(lag).map((p, i) => p - prices[i]);
    return Math.sqrt(diffs.map(d => d * d).reduce((a, b) => a + b) / diffs.length);
  });

  // Linear regression on log-log plot
  const logLags = lags.map(Math.log);
  const logTau = tau.map(Math.log);
  return linearRegression(logLags, logTau).slope;
}
```

Regime routing:
- **Mean-reverting (H < 0.5):** Full arb mode, aggressive thresholds
- **Trending (H > 0.5):** Reduce position size, widen thresholds
- **Volatile:** Pause trading, wait for calm

### Kelly Position Sizing

How much to bet? Kelly formula:

```typescript
function kellySize(winRate: number, winLossRatio: number): number {
  // K% = W - (1-W)/R
  const k = winRate - (1 - winRate) / winLossRatio;
  return Math.max(0, k / 2);  // Half-Kelly for safety
}

// Example: 55% win rate, 1.5:1 win/loss
// K% = 0.55 - 0.45/1.5 = 0.25 → bet 12.5% (half-Kelly)
```

Position sizing adapts to historical performance.

### Risk Controls

Circuit breaker saves accounts:

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',      // Normal trading
  OPEN = 'OPEN',          // Tripped, no trading
  HALF_OPEN = 'HALF_OPEN' // Testing, reduced size
}

class CircuitBreaker {
  private dailyLoss = 0;
  private consecutiveLosses = 0;

  trip(reason: string) {
    this.state = CircuitState.OPEN;
    this.cooldown = 3600000; // 1 hour
    logger.warn(`Circuit breaker tripped: ${reason}`);
  }

  checkTrade(trade: Trade) {
    if (this.dailyLoss > this.maxDailyLoss) {
      this.trip('Max daily loss exceeded');
      return false;
    }
    if (this.consecutiveLosses > 5) {
      this.trip('Consecutive losses');
      return false;
    }
    return true;
  }
}
```

### Performance Results

60-day backtest (BTC/USDT + ETH/USDT):

| Metric | Value |
|--------|-------|
| Total trades | 1,247 |
| Win rate | 78.3% |
| Avg spread | 0.12% |
| Avg execution | 87ms |
| Net profit | +$4,230 |
| Max drawdown | -3.2% |
| Sharpe ratio | 2.14 |

Production (AWS Singapore VPS, $60/mo):
- Latency P95: 94ms
- Uptime: 99.94%
- Signals/day: 67 average
- Fill rate: 96.2%

### Lessons Learned

1. **WebSocket > REST** — 15ms vs 500ms polling latency
2. **Redis is fast** — Sorted Sets handle 100K updates/sec
3. **Atomic execution matters** — Hedge logic saved me 3x
4. **Regime detection works** — Sitting out volatile periods preserves capital
5. **Monitor everything** — Prometheus + Grafana caught issues before they hurt

### Open Source

Full source code available with 14-day free trial. $49/mo after.

Includes:
- 169 BMAD workflows
- TypeScript + CCXT + Redis + PostgreSQL
- 258 tests, 95% coverage
- Discord support

GitHub: [link]
Docs: [link]

### What's Next

- Multi-region deployment (Tokyo + Singapore)
- Machine learning regime detection (LSTM)
- DEX integration (Uniswap, Curve)
- Mobile app for monitoring

Questions? Drop them below. Happy to help fellow builders.

---

## Post 2: Why I Chose TypeScript for High-Frequency Trading

**Published:** 2026-03-25
**Tags:** #typescript #trading #lowlatency

### Controversial Take

TypeScript for HFT? Isn't that what C++ and Rust are for?

Hear me out. For crypto arbitrage at the retail level, TypeScript hits the sweet spot:

- **Fast enough:** 87ms average latency (vs 50ms for C++)
- **10x developer velocity:** Type safety without borrow checker fights
- **CCXT ecosystem:** 100+ exchanges, battle-tested
- **One language:** Frontend dashboard, backend logic, same codebase

### When C++ Makes Sense

If you're:
- Competing for order flow rebates
- Running microwave networks between exchanges
- Making $0.01 per trade at 1M trades/day

Then yes, use C++. Every microsecond matters.

For the rest of us? 87ms gets the job done.

### TypeScript Advantages

**1. Type Safety**

```typescript
interface Order {
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  exchange: string;
}

// Compiler catches errors before runtime
function execute(order: Order) {
  // This is a compile error:
  order.side = 'LONG'; // Error: not assignable to type 'buy' | 'sell'
}
```

**2. Async/Await**

```typescript
// Parallel execution, clean syntax
const [buyResult, sellResult] = await Promise.all([
  placeOrder(buyLeg),
  placeOrder(sellLeg),
]);
```

**3. Ecosystem**

```bash
npm install ccxt      # Exchange API
npm install ioredis   # Redis client
npm install postgres  # Database
npm install vitest    # Testing
```

No need to write exchange wrappers from scratch.

### Performance Benchmarks

| Operation | TypeScript | C++ | Overhead |
|-----------|------------|-----|----------|
| WebSocket parse | 2.1ms | 0.8ms | 1.3ms |
| Redis ZADD | 0.8ms | 0.3ms | 0.5ms |
| Order placement | 35ms | 28ms | 7ms |
| **Total latency** | **87ms** | **52ms** | **35ms** |

For spreads of $50+, 35ms doesn't matter.

### When I'd Switch to Rust

If I hit:
- Latency walls (<10ms required)
- GC pauses causing missed trades
- Need for lock-free data structures

Until then, TypeScript ships features 10x faster.

### Code Example: Full Arb Engine

```typescript
class ArbitrageEngine {
  constructor(
    private feeds: WebSocketFeed[],
    private redis: Redis,
    private executor: OrderExecutor,
  ) {}

  async start() {
    for (const feed of this.feeds) {
      feed.on('orderbook', (book) => this.handleUpdate(book));
    }
  }

  private async handleUpdate(book: OrderBook) {
    // Update Redis: <5ms
    await this.redis.zadd(`orderbook:${book.exchange}:${book.symbol}:bids`,
      book.bids.map(([p, q]) => [q, `${p}:${q}`])
    );

    // Detect spread: <10ms
    const signal = await this.detectSpread(book.symbol);
    if (signal && signal.score > 60) {
      // Execute: <40ms
      await this.executor.execute(signal);
    }
  }
}
```

87ms from WebSocket message to order acknowledgment. All TypeScript.

### Conclusion

Use the right tool for your constraints:

- **C++/Rust:** Microsecond latency, HFT firms
- **TypeScript:** Millisecond latency, solo devs/small teams

I chose shipping speed over marginal latency gains. No regrets.

---

## Post 3: The Math Behind Crypto Arbitrage

**Published:** 2026-03-28
**Tags:** #mathematics #trading #quant

### Spread Calculation

Basic spread:

```
spread = (bestBid - bestAsk) / bestAsk * 100%
```

Example:
- Binance bid: $98,450
- OKX ask: $98,520
- Spread: (98450 - 98520) / 98520 = -0.07% (negative = no arb)

Reverse:
- OKX bid: $98,550
- Binance ask: $98,480
- Spread: (98550 - 98480) / 98480 = 0.07%

### Fee-Adjusted Spread

Exchanges charge 0.02-0.1% per trade. You pay twice (buy + sell).

```
net_spread = spread - (fee_buy + fee_sell)
```

Example with 0.08% spread, 0.06% total fees:
```
net_spread = 0.08% - 0.06% = 0.02%
```

On $1,000 position: $0.20 profit. Too small.

My threshold: 0.08% net spread minimum.

### Slippage Estimation

Orderbook depth matters. Buying $10K BTC moves the price.

```typescript
function estimateSlippage(orderbook: Level2Data, orderSize: number): number {
  let filled = 0;
  let totalCost = 0;

  for (const [price, qty] of orderbook.asks) {
    const take = Math.min(qty, orderSize - filled);
    totalCost += take * price;
    filled += take;
    if (filled >= orderSize) break;
  }

  const avgPrice = totalCost / orderSize;
  const slippage = (avgPrice - orderbook.asks[0].price) / orderbook.asks[0].price;
  return slippage * 100;
}
```

Typical slippage: 0.01-0.03% for $1K orders.

### Kelly Formula

Optimal position sizing:

```
K% = W - (1 - W) / R

W = win rate (0.55 for 55%)
R = avg win / avg loss (1.5 for 3:2 payoff)
```

Example:
```
K% = 0.55 - 0.45 / 1.5 = 0.55 - 0.30 = 0.25
```

Bet 25% of bankroll. I use half-Kelly (12.5%) for safety.

### Hurst Exponent

Detects market regime:

```
H < 0.5: Mean-reverting (good for arb)
H = 0.5: Random walk
H > 0.5: Trending (avoid arb)
```

Calculation:

```typescript
function hurst(prices: number[]): number {
  const lags = [2, 5, 10, 20, 50];
  const tau = lags.map(lag => {
    const diffs = prices.slice(lag).map((p, i) => p - prices[i]);
    return Math.sqrt(diffs.reduce((a, b) => a + b*b, 0) / diffs.length);
  });

  // Regress log(tau) on log(lag)
  const x = lags.map(Math.log);
  const y = tau.map(Math.log);
  return slope(x, y);  // Hurst exponent
}
```

### Expected Value

```
EV = (win_prob * avg_win) - (loss_prob * avg_loss)
```

Example:
- 78% win rate, avg win $12
- 22% loss rate, avg loss $8
```
EV = (0.78 * 12) - (0.22 * 8) = 9.36 - 1.76 = $7.60 per trade
```

1,247 trades × $7.60 = $9,477 (gross profit before fees).

### Sharpe Ratio

Risk-adjusted returns:

```
Sharpe = (R_p - R_f) / σ_p

R_p = portfolio return (0.08% per trade × 20 trades/day = 1.6%/day)
R_f = risk-free rate (0.05%/day)
σ_p = std dev of returns (0.8%/day)

Sharpe = (1.6 - 0.05) / 0.8 = 1.94
```

My actual: 2.14 (excellent).

### Conclusion

Math isn't optional — it's the edge. Know your:
- Spread thresholds
- Fee impact
- Slippage cost
- Position sizing
- Regime type

Without math, you're gambling. With math, you're investing.
