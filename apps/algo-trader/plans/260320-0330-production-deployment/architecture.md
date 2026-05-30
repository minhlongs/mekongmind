# Algo-Trader Production Deployment Architecture

**Date:** 2026-03-20
**Status:** Ready for deployment
**MVP:** Phase 1-3 Complete (258 tests, 41+ files, 0 TS errors)

---

## Executive Summary

Kiến trúc production deployment cho Algo-Trader MVP lên AWS Singapore VPS với Docker Compose, SSL, và monitoring stack.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Singapore VPS                          │
│                    (t3.medium, 50GB SSD)                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Docker Compose                          │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │    Nginx     │  │  algo-trader │  │  PostgreSQL  │   │ │
│  │  │  :443, :80   │  │    :3000     │  │    :5432     │   │ │
│  │  │  SSL/TLS     │  │  API + WS    │  │  Trade Data  │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │    Redis     │  │  Prometheus  │  │   Grafana    │   │ │
│  │  │    :6379     │  │    :9090     │  │    :3001     │   │ │
│  │  │  Cache+PubSub│  │   Metrics    │  │ Dashboards   │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                         │
│  push main → build → test → docker build → push → SSH deploy   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure Components

### 1. VPS Specification

| Component | Specification | Purpose |
|-----------|--------------|---------|
| **Provider** | AWS EC2 | Singapore region (ap-southeast-1) |
| **Instance** | t3.medium | 2 vCPU, 4GB RAM |
| **Storage** | 50GB GP3 SSD | OS + Docker volumes |
| **Network** | Elastic IP | Static public IP |
| **OS** | Ubuntu 22.04 LTS | Docker-ready AMI |

**Latency Optimization:**
- Singapore region tối ưu cho OKX/Bybit (5-10ms)
- Binance latency chấp nhận được (30-40ms)

### 2. Docker Services

| Service | Port | Image | Purpose |
|---------|------|-------|---------|
| **nginx** | 80, 443 | nginx:alpine | Reverse proxy + SSL |
| **algo-trader** | 3000 | algo-trader:latest | Trading engine + API |
| **postgres** | 5432 | postgres:16-alpine | Trade persistence |
| **redis** | 6379 | redis:7-alpine | Cache + Pub/Sub |
| **prometheus** | 9090 | prom/prometheus:latest | Metrics collection |
| **grafana** | 3001 | grafana/grafana:latest | Monitoring dashboards |

### 3. Network Topology

```
Internet
    │
    ▼
┌─────────────────┐
│   Elastic IP    │
│   (Public IP)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Nginx (443)   │◄─── SSL/TLS (Let's Encrypt)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────────┐
│:3000 │  │:9090     │
│API   │  │Prometheus│
└──────┘  └──────────┘
```

**Security Groups:**
- Inbound: 443 (HTTPS), 22 (SSH - restricted IP)
- Outbound: All (for exchange WebSocket connections)

---

## Data Flow

### Trading Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Exchange   │────▶│   Redis     │────▶│   Spread    │
│  WebSocket  │     │  Orderbook  │     │  Detector   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PostgreSQL │◀────│  Execution  │◀────│   Signal    │
│  (Trades)   │     │   Engine    │     │   Scorer    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Monitoring Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  algo-trader│────▶│ Prometheus  │────▶│  Grafana    │
│  /metrics   │     │  (Scrape)   │     │  (Visualize)│
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Security Considerations

### 1. API Security

| Layer | Mechanism | Configuration |
|-------|-----------|---------------|
| **Transport** | TLS 1.3 | Let's Encrypt auto-renewal |
| **Auth** | JWT + API Keys | 24h expiry, refresh tokens |
| **Rate Limit** | express-rate-limit | 100 req/min per API key |
| **Headers** | Helmet.js | CSP, HSTS, X-Frame-Options |

### 2. Database Security

- PostgreSQL: Password auth + SSL required
- Redis: AUTH token required
- Network: Internal Docker network only (no public exposure)

### 3. Secrets Management

```bash
# .env (never committed)
DATABASE_URL=postgresql://user:password@postgres:5432/algo_trader
REDIS_URL=redis://:password@redis:6379
JWT_SECRET=<random-256-bit>
BINANCE_API_KEY=<encrypted>
BINANCE_SECRET=<encrypted>
```

**Best Practices:**
- Use AWS Secrets Manager for production
- Rotate API keys monthly
- Encrypt secrets at rest

---

## Deployment Strategy

### Blue-Green Deployment

```
┌─────────────────┐     ┌─────────────────┐
│  Blue (Active)  │     │  Green (Standby)│
│  :3000          │     │  :3001          │
│  v1.2.0         │     │  v1.3.0         │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └──────────┬────────────┘
                    │
                    ▼
           ┌────────────────┐
           │    Nginx       │
           │  (Switcher)    │
           └────────────────┘
```

**Rollback Procedure:**
1. Detect failure (health check fail, error rate > 5%)
2. Nginx switch back to Blue slot
3. Investigate Green slot issues

---

## Monitoring & Alerting

### Key Metrics (Prometheus)

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| `algo_trader_heap_used_bytes` | > 800MB | Restart container |
| `algo_trader_circuit_breaker_state` | = 1 (OPEN) | Investigate losses |
| `algo_trader_daily_pnl_usd` | < -$500 | Halt trading |
| `up{job="algo-trader"}` | = 0 | Page on-call |
| `http_request_duration_seconds{p99}` | > 1s | Scale resources |

### Grafana Dashboards

1. **System Overview** - CPU, memory, disk, network
2. **Trading Metrics** - P&L, trades count, win rate
3. **Latency** - WebSocket → Redis → Execution (p50/p95/p99)
4. **Circuit Breaker** - State, trip events, recovery time
5. **Exchange Health** - Latency per exchange, error rates

---

## Disaster Recovery

### Backup Strategy

| Component | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| PostgreSQL | Daily 00:00 UTC | 30 days | S3 bucket |
| Redis RDB | Hourly | 7 days | S3 bucket |
| Config files | On change | All versions | Git repo |

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Container crash | 5 min | 0 (data persisted) |
| VPS failure | 1 hour | 1 day (last backup) |
| Region outage | 4 hours | 1 day |

---

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| AWS t3.medium (Singapore) | $30 |
| 50GB GP3 SSD | $5 |
| Data transfer (100GB) | $10 |
| **Total** | **$45/month** |

---

## Next Steps

1. **Provision AWS VPS** - EC2 t3.medium, Singapore
2. **Configure DNS** - A record → Elastic IP
3. **Install Docker** - Docker Compose v2
4. **Deploy stack** - `docker compose up -d`
5. **Verify health** - `curl https://your-domain.com/health`
6. **Configure alerts** - Grafana alerting rules

---

_Unresolved Questions:_

1. **Dual-VPS for Binance optimization?** - Current: single Singapore VPS. Consider Tokyo VPS for Binance colocation if latency becomes critical.
2. **Managed database vs self-hosted?** - Current: self-hosted PostgreSQL. Upgrade to RDS for production at scale.
3. **Multi-region failover?** - Not implemented for MVP. Add after reaching $10K MRR.
