# Research #2 — Tech Stack Comparison for Algo Trading MVP

**Date:** 2026-03-20
**Focus:** Production MVP only
**Author:** Research Agent

---

## 1. CCXT vs Direct Exchange APIs

### Latency Comparison

| Metric | CCXT | Direct API |
|--------|------|------------|
| REST overhead | +5-15ms | Baseline |
| WebSocket | +2-5ms (wrapper) | Baseline |
| Rate limiting | Unified handling | Per-exchange logic |
| Connection pooling | Built-in | Manual implementation |

**Latency Breakdown:**
```
CCXT REST:  50-200ms (network) + 5-15ms (library overhead)
Direct REST: 50-200ms (network) + 1-2ms (native)
CCXT WS:    10-50ms (stream) + 2-5ms (wrapper)
Direct WS:  10-50ms (stream) + 1-2ms (native)
```

### Reliability

| Aspect | CCXT | Direct API |
|--------|------|------------|
| Stability | High (battle-tested) | Varies by exchange |
| Error handling | Unified interface | Custom per exchange |
| Reconnection | Automatic | Manual |
| API versioning | Maintained | Self-managed |

### Maintenance Tradeoffs

| Factor | CCXT | Direct API |
|--------|------|------------|
| Initial dev time | 1-2 days | 1-2 weeks per exchange |
| Ongoing updates | Auto (npm update) | Manual API changelog tracking |
| Code complexity | Low (unified) | High (exchange-specific) |
| Exchange coverage | 100+ exchanges | 1 exchange = 1 codebase |

### Rate Limiting

```typescript
// CCXT - Built-in rate limiting
const exchange = new ccxt.binance({
  rateLimit: 100,  // ms between requests
  enableRateLimit: true,
});

// Direct API - Manual implementation
const rateLimiter = new RateLimiter({
  tokensPerInterval: 1200,
  interval: 'minute',
});
```

### Error Recovery

| Scenario | CCXT | Direct |
|----------|------|--------|
| Network timeout | Auto-retry | Custom logic |
| Invalid nonce | Auto-increment | Manual |
| API key expired | Throw error | Custom handling |
| 5xx errors | Exponential backoff | Manual |

### Recommendation: **CCXT for MVP**

**Why:**
- 10x faster development (days vs weeks)
- Multi-exchange arbitrage ready out-of-box
- Overhead negligible for arbitrage (spread >> latency)
- Can optimize critical paths to direct WebSocket later

**Exception:** Use Direct API if:
- HFT (< 10ms latency requirement)
- Single exchange only
- Custom order types not supported by CCXT

---

## 2. Redis Data Structures Recommendation

### Orderbook State

**✅ RECOMMENDED: Sorted Sets**

```redis
# Orderbook: BNB/USDT bids
ZSET orderbook:BNB/USDT:bids
  - key = price (score, inverted for descending)
  - value = quantity (member metadata)
  - example: ZADD orderbook:BNB/USDT:bids 0.25 "450.50:1.5"

# Top of book: O(1)
ZRANGE orderbook:BNB/USDT:bids 0 0 WITHSCORES

# Best 10 levels: O(log N)
ZRANGE orderbook:BNB/USDT:bids 0 9 WITHSCORES

# Update level: O(log N)
ZADD orderbook:BNB/USDT:bids 0.25 "450.50:2.0"

# Remove stale: O(log N)
ZREM orderbook:BNB/USDT:bids "450.50:1.5"
```

**Why NOT Hashes:**
- Hashes: O(1) lookup but no ordering → can't get "top 10 bids"
- Sorted Sets: O(log N) lookup + ordered by price → perfect for orderbooks

**Why NOT Strings:**
- Strings: Full serialization/deserialization on every update
- No partial updates → high memory churn

### Ticker Cache

**✅ RECOMMENDED: Hashes (1 key per ticker)**

```redis
# Structure: Hash with field per attribute
HSET ticker:BNB/USDT {
  "symbol": "BNB/USDT",
  "last": "450.50",
  "bid": "450.45",
  "ask": "450.55",
  "high": "460.00",
  "low": "440.00",
  "volume": "125000",
  "timestamp": "1710892800000"
}

# Get all: O(N) where N = fields
HGETALL ticker:BNB/USDT

# Get specific: O(1)
HMGET ticker:BNB/USDT last bid ask

# Update single field: O(1)
HSET ticker:BNB/USDT last "450.52"
```

**Alternative (NOT recommended): Separate keys**
```redis
# Anti-pattern: 1 key per field
SET ticker:BNB/USDT:last "450.50"
SET ticker:BNB/USDT:bid "450.45"
# Problem: 10x memory overhead, no atomic multi-get
```

### Trade History

**✅ RECOMMENDED: Redis Streams**

```redis
# Stream: append-only trade log
XADD trades:BNB/USDT * \
  id "trade_12345" \
  price "450.50" \
  quantity "1.5" \
  side "buy" \
  timestamp "1710892800000"

# Read latest 100: O(N)
XREVRANGE trades:BNB/USDT + - COUNT 100

# Consumer groups (for multiple processors)
XREADGROUP GROUP processors:arb processors:consumer1 \
  COUNT 10 \
  STREAMS trades:BNB/USDT >

# Trim old trades (memory management)
XTRIM trades:BNB/USDT MAXLEN ~10000
```

**Why NOT List:**
- List: No metadata, no consumer groups, harder to trim by time
- Streams: Built-in consumer groups, ACK mechanism, time-based trimming

### Pub/Sub Channels Design

```redis
# Channel naming convention
PUBLISH channel:orderbook:BNB/USDT <binary_delta>
PUBLISH channel:ticker:BNB/USDT <json_snapshot>
PUBLISH channel:trades:BNB/USDT <trade_event>
PUBLISH channel:signals:arb:BNB/USDT <arb_signal>

# Subscriber pattern
PSUBSCRIBE channel:orderbook:*      # All orderbooks
PSUBSCRIBE channel:signals:arb:*    # All arb signals
```

**Memory Optimization:**

```redis
# Use binary protocol for orderbook deltas
# Protocol Buffers / MessagePack:
{
  "bids": [[450.50, 1.5], [450.45, 2.0]],
  "asks": [[450.55, 1.0], [450.60, 3.0]],
  "seq": 12345
}
# Size: ~100 bytes vs ~300 bytes JSON

# Compress with gzip for large snapshots
# Use ZSTD for better compression ratio
```

### Redis Memory Estimate (MVP)

| Data | Structure | Keys | Memory |
|------|-----------|------|--------|
| Orderbook (10 pairs) | Sorted Sets | 20 | ~50 KB |
| Ticker (50 pairs) | Hashes | 50 | ~25 KB |
| Trade history (24h) | Streams | 50 | ~500 MB |
| Signals | Pub/Sub | - | ~1 KB |
| **Total** | - | 120 | **~500 MB** |

---

## 3. WebSocket vs REST Polling

### When to Use WebSocket

| Data Type | Protocol | Reason |
|-----------|----------|--------|
| Orderbook | WebSocket | Real-time, 10-100ms updates |
| Trades | WebSocket | Real-time, event-driven |
| Ticker (24h stats) | WebSocket OR REST 1s | Can poll if latency OK |
| Funding rates | WebSocket OR REST 5s | Updates every 8h typically |

### When REST Polling is Acceptable

| Data Type | Protocol | Polling Frequency |
|-----------|----------|-------------------|
| Account balance | REST | 1-5 seconds (or on-demand) |
| Open orders | REST | 500ms - 2 seconds |
| Order status | REST | On-demand after placement |
| Deposit/withdrawal | REST | 10-30 seconds |

### Recommended Hybrid Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Trading Bot                       │
├─────────────────────────────────────────────────────┤
│ WebSocket Connections (persistent):                  │
│   - Binance: wss://stream.binance.com:9443/ws       │
│   - OKX: wss://ws.okx.com:8443/ws/v5/public         │
│   - Bybit: wss://stream.bybit.com/v5/public/linear  │
│   Subscribe: orderbook, trades, ticker              │
├─────────────────────────────────────────────────────┤
│ REST Polling (interval-based):                       │
│   - Balance: GET /api/v3/account (every 2s)         │
│   - Orders: GET /api/v3/openOrders (every 1s)       │
│   - After order placed: GET /api/v3/order (immediate)│
└─────────────────────────────────────────────────────┘
```

### REST Polling Frequency Guidelines

```typescript
// Rate limit calculation (Binance example)
// Limit: 1200 requests/minute = 20 requests/second
// Safe limit: 80% = 16 requests/second

const pollIntervals = {
  balance: 2000,        // 0.5 Hz per account
  openOrders: 1000,     // 1 Hz per symbol
  orderStatus: 100,     // 10 Hz (only after placement)
  positions: 1000,      // 1 Hz (futures only)
};

// Connection pooling: reuse HTTP client
const httpClient = new Axios({
  baseURL: 'https://api.binance.com',
  maxSockets: 10,  // Keep-alive connections
});
```

### WebSocket Reconnection Strategy

```typescript
const reconnect = () => {
  const maxRetries = 10;
  const baseDelay = 1000;

  let retry = 0;
  const connect = () => {
    ws.connect();
    ws.on('error', () => {
      if (retry < maxRetries) {
        const delay = baseDelay * Math.pow(2, retry); // Exponential backoff
        setTimeout(connect, delay + Math.random() * 1000); // Jitter
        retry++;
      }
    });
  };
  connect();
};
```

---

## 4. Database Selection

### PostgreSQL (Relational)

**Use Cases:**
- User accounts, API keys
- Order history (audit trail)
- P&L tracking
- Strategy configurations
- Audit logs

```sql
-- Schema example
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  type TEXT NOT NULL,
  price DECIMAL(18, 8),
  quantity DECIMAL(18, 8),
  filled DECIMAL(18, 8) DEFAULT 0,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

**Pros:**
- ACID compliance
- Mature ecosystem
- Complex queries (JOINs)
- Supabase: Free tier, auth, realtime

**Cons:**
- Not optimized for time-series (without hypertables)
- Write throughput: ~10K writes/sec (single node)

### TimescaleDB (Time-Series)

**Use Cases:**
- OHLCV candles (1M+ rows/day)
- Trade tick data
- Orderbook snapshots
- Performance metrics

```sql
-- Convert to hypertable
SELECT create_hypertable('candles', 'time');

-- Insert (automatic partitioning)
INSERT INTO candles (time, symbol, open, high, low, close, volume)
VALUES (NOW(), 'BNB/USDT', 450.00, 451.00, 449.00, 450.50, 1000);

-- Time-based query (fast)
SELECT time_bucket('1 minute', time) AS bucket,
       avg(close) AS avg_price
FROM candles
WHERE symbol = 'BNB/USDT'
  AND time > NOW() - INTERVAL '24 hours'
GROUP BY bucket
ORDER BY bucket;
```

**Pros:**
- 10x faster time-range queries vs PostgreSQL
- Automatic partitioning (chunking)
- Continuous aggregates (materialized views)
- Compression (90% size reduction)

**Cons:**
- Overkill for MVP (< 1M rows/day)
- Additional operational complexity
- Supabase doesn't support TimescaleDB

### In-Memory Only (Redis)

**Use Cases:**
- Orderbook state (real-time)
- Ticker cache
- Signal generation
- Temporary trade queue

**NOT Recommended For:**
- Persistent order history (data loss on restart)
- Audit trail (compliance risk)
- P&L tracking (need durability)

### Recommended Hybrid Architecture (MVP)

```
┌─────────────────────────────────────────────────────┐
│                    Data Layer                        │
├─────────────────────────────────────────────────────┤
│ Redis (Real-time):                                   │
│   - Orderbook state (Sorted Sets)                   │
│   - Ticker cache (Hashes)                           │
│   - Signal queue (Streams)                          │
│   - TTL: 24h for trade history                      │
├─────────────────────────────────────────────────────┤
│ PostgreSQL (Persistent):                             │
│   - Orders (filled/cancelled)                       │
│   - Trades (execution log)                          │
│   - P&L (daily snapshots)                           │
│   - Config (strategies, risk params)                │
│   - TTL: Forever (audit requirement)                │
├─────────────────────────────────────────────────────┤
│ Data Flow:                                           │
│   Redis (hot) → PostgreSQL (cold) via:              │
│   - Redis Streams consumer → batch INSERT           │
│   - Cron: Every 5 minutes                           │
│   - Or: On-trade (synchronous)                      │
└─────────────────────────────────────────────────────┘
```

### PostgreSQL Schema (MVP Minimum)

```sql
-- Core tables only
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,  -- Exchange order ID
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  quantity DECIMAL(18, 8) NOT NULL,
  fee DECIMAL(18, 8),
  fee_currency TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS arb_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  buy_exchange TEXT NOT NULL,
  sell_exchange TEXT NOT NULL,
  buy_price DECIMAL(18, 8) NOT NULL,
  sell_price DECIMAL(18, 8) NOT NULL,
  spread_pct DECIMAL(8, 4) NOT NULL,
  executed BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_pnl (
  date DATE PRIMARY KEY,
  realized_pnl DECIMAL(18, 8) DEFAULT 0,
  unrealized_pnl DECIMAL(18, 8) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(8, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Cost/Performance Matrix

### Infrastructure Options

| Option | Monthly Cost | Performance | Scalability | MVP Fit |
|--------|--------------|-------------|-------------|---------|
| Redis Cloud Free | $0 | 50K ops/sec | Limited (30MB) | ⭐⭐⭐ |
| Redis Cloud Starter | $49 | 100K ops/sec | 1GB | ⭐⭐⭐⭐ |
| Self-hosted Redis (EC2 t3.micro) | $15 | 200K ops/sec | Manual | ⭐⭐⭐⭐⭐ |
| Supabase Free | $0 | 10K writes/sec | 500MB | ⭐⭐⭐⭐⭐ |
| Supabase Pro | $25 | 50K writes/sec | 8GB | ⭐⭐⭐⭐ |
| AWS ElastiCache | $100+ | 1M+ ops/sec | Auto | ⭐⭐ |

### Performance Benchmarks

| Operation | Redis | PostgreSQL | TimescaleDB |
|-----------|-------|------------|-------------|
| Write (single row) | 100K/sec | 10K/sec | 50K/sec* |
| Read (by key) | 150K/sec | 5K/sec | 5K/sec |
| Time-range query (1M rows) | N/A | 500ms | 50ms |
| Orderbook update (10 levels) | 0.5ms | 5ms | 2ms |

*TimescaleDB in-memory chunks

### Latency p99 (Production)

| Component | Local | EC2 us-east | Multi-region |
|-----------|-------|-------------|--------------|
| Redis | 0.5ms | 1ms | 50-100ms |
| PostgreSQL | 2ms | 3ms | 100-200ms |
| Exchange API (REST) | 50-200ms | 30-100ms | 100-500ms |
| Exchange WS | 10-50ms | 10-30ms | 50-200ms |

### Scalability Limits

| Component | Single Node | Sharded | Cloud Auto-scale |
|-----------|-------------|---------|------------------|
| Redis | 1M ops/sec | 10M+ ops/sec | Unlimited |
| PostgreSQL | 10K writes/sec | Complex | Read replicas |
| TimescaleDB | 100K writes/sec | Hypertable partitions | Read replicas |

### MVP Recommendation

```yaml
# Phase 1: MVP (0 revenue)
redis:
  provider: self-hosted (Docker Compose)
  cost: $0 (local) or $15/mo (EC2 t3.micro)
  memory: 2GB (sufficient for 100 pairs)

database:
  provider: Supabase Free
  cost: $0
  storage: 500MB (sufficient for 1M trades)

total_infra: $0-15/month

# Phase 2: Growth (1-10K MRR)
redis:
  provider: Redis Cloud Starter
  cost: $49/mo
  memory: 1GB

database:
  provider: Supabase Pro
  cost: $25/mo
  storage: 8GB

total_infra: $74/month

# Phase 3: Scale (10K+ MRR)
redis:
  provider: AWS ElastiCache
  cost: $100+/mo
  memory: 8GB+

database:
  provider: Self-hosted TimescaleDB (EC2)
  cost: $100+/mo
  storage: 100GB+

total_infra: $200+/month
```

### Docker Compose (MVP Setup)

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 2gb
    volumes:
      - redis-data:/data
    restart: unless-stopped

  # PostgreSQL included with Supabase (local dev only)
  # For production, use Supabase Cloud URL

volumes:
  redis-data:
```

---

## Summary: MVP Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Exchange API | CCXT | 10x dev speed, multi-exchange ready |
| Orderbook | Redis Sorted Sets | Ordered by price, O(log N) updates |
| Ticker | Redis Hashes | Atomic multi-field, O(1) access |
| Trade History | Redis Streams + PostgreSQL | Real-time + persistent |
| WebSocket | Primary for market data | 10-50ms latency |
| REST | Secondary for account | 1-2s polling acceptable |
| Database | Supabase (PostgreSQL) | Free tier, auth, managed |
| Redis | Self-hosted (Docker) | $0 cost, 2GB sufficient |

**Total MVP Infrastructure Cost:** $0-15/month

---

## Unresolved Questions

1. **Compliance requirement:** How long must trade history be retained? (1 year? 7 years?)
2. **Geographic distribution:** Need multi-region for latency arbitrage?
3. **Volume projection:** Expected trades/day for capacity planning?
4. **Disaster recovery:** RPO/RTO requirements for production?

---

## Sources

- CCXT Documentation: https://docs.ccxt.com/
- Redis Data Types: https://redis.io/docs/latest/develop/data-types/
- TimescaleDB vs PostgreSQL: https://docs.timescale.com/
- Binance API Rate Limits: https://binance-docs.github.io/apidocs/
- Supabase Pricing: https://supabase.com/pricing
- Redis Cloud Pricing: https://redis.com/pricing/
