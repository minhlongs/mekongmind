# Algo-Trader Production Architecture Design

> **Report ID:** cto-architect-design-research-260320-0536
> **Date:** 2026-03-20
> **Owner:** CTO Agent + DevOps
> **Scope:** Production MVP → 1000+ institutions
> **Target:** 99.9% uptime, sub-100ms latency, SEC/FCA compliant

---

## Executive Summary

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Tests Passing | 270 | 270 | ✅ |
| Critical Security Issues | 3 | 0 | 🔴 BLOCKER |
| Important Issues | 9 | 0 | 🟡 PENDING |
| Infrastructure | Local | Cloudflare + AWS | ⏳ PENDING |
| Compliance | None | SEC/FCA ready | ⏳ PENDING |

**Verdict:** MVP code complete. **3 CRITICAL security issues must be fixed before beta launch.**

---

## 1. C4 Architecture Diagram

### Level 1: Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ALGO-TRADER ECOSYSTEM                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│   Trader     │─────▶│   Algo-Trader    │─────▶│  Exchanges   │
│   (User)     │      │    Platform      │      │  Binance     │
│              │◀─────│                  │◀─────│  OKX/Bybit   │
└──────────────┘      └──────────────────┘      └──────────────┘
       ▲                       │                        │
       │                       ▼                        │
       │              ┌──────────────────┐              │
       │              │  Cloudflare      │              │
       │              │  Edge Network    │              │
       │              └──────────────────┘              │
       │                       │                        │
       ▼                       ▼                        ▼
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│  Polar.sh    │      │   Supabase       │      │  Sentry      │
│  (Billing)   │      │  (Auth + DB)     │      │  (Errors)    │
└──────────────┘      └──────────────────┘      └──────────────┘
```

### Level 2: Container Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ALGO-TRADER PLATFORM                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Dashboard UI   │    │   Edge API      │    │  Trading Engine │
│  (CF Pages)     │───▶│  (CF Workers)   │───▶│  (AWS VPS)      │
│  React + TSX    │    │  Fastify + JWT  │    │  Node.js + WS   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Cloudflare KV  │    │  Supabase DB    │    │  Redis Cache    │
│  (Session/Cache)│    │  PostgreSQL     │    │  (Orderbook)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Level 3: Component Diagram (Trading Engine)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TRADING ENGINE (AWS VPS)                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  WebSocket   │  │  Signal      │  │  Risk        │  │  Order       │
│  Feed Mgr    │─▶│  Detector    │─▶│  Circuit     │─▶│  Executor    │
│  (5-15ms)    │  │  (10-25ms)   │  │  Breaker     │  │  (15-40ms)   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
                          │                    │
                          ▼                    ▼
                  ┌──────────────┐    ┌──────────────┐
                  │  Regime      │    │  P&L         │
                  │  Analyzer    │    │  Tracker     │
                  └──────────────┘    └──────────────┘
```

---

## 2. Security Hardening Plan

### 2.1 CRITICAL Issues (P0 - Block Production)

| # | Issue | Impact | Fix | Effort |
|---|-------|--------|-----|--------|
| **C1** | License encryption missing | API keys exposed | AES-256-GCM encrypt at rest | 4h |
| **C2** | No rate limiting on license API | DDoS, brute force | Sliding window + Redis | 2h |
| **C3** | Private key in plaintext `.env` | Wallet compromise | AWS Secrets Manager / HashiCorp Vault | 4h |

#### C1: License Encryption Implementation

```typescript
// src/billing/license-encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export class LicenseEncryptor {
  private readonly masterKey: Buffer;

  constructor(masterKey: string) {
    this.masterKey = scryptSync(masterKey, SALT_LENGTH, KEY_LENGTH);
  }

  encrypt(licenseKey: string): EncryptedLicense {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.masterKey, iv);

    let encrypted = cipher.update(licenseKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    const salt = randomBytes(SALT_LENGTH).toString('hex');

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag,
      salt,
      algorithm: ALGORITHM
    };
  }

  decrypt(encrypted: EncryptedLicense): string {
    const { encryptedData, iv, authTag, salt } = encrypted;

    const key = scryptSync(masterKey, Buffer.from(salt, 'hex'), KEY_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

#### C2: Rate Limiting Implementation

```typescript
// src/api/middleware/rate-limiter.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const licenseRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'license:api:',
  points: 100, // 100 requests
  duration: 60, // per minute
  blockDuration: 300, // block for 5 minutes if exceeded
});

export const tradingRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'trading:api:',
  points: 1000, // 1000 requests
  duration: 60,
  blockDuration: 60,
});

// Middleware usage
app.use('/api/license/*', async (req, res, next) => {
  await licenseRateLimiter.consume(req.ip);
  next();
});
```

#### C3: Secret Management Migration

```bash
# Migration Plan

# 1. Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name algo-trader/prod/private-keys \
  --secret-string '{"wallet":"0x...","mnemonic":"..."}'

# 2. Remove from .env
# BEFORE: PRIVATE_KEY=0x_...
# AFTER:  SECRET_NAME=algo-trader/prod/private-keys

# 3. Fetch at runtime
const secrets = await aws.getSecretValue({ SecretId: process.env.SECRET_NAME });
const { wallet, mnemonic } = JSON.parse(secrets.SecretString);
```

---

### 2.2 IMPORTANT Issues (P1 - Required for Beta)

| # | Issue | Impact | Fix | Effort |
|---|-------|--------|-----|--------|
| **I1** | No CSRF protection | Session hijacking | csurf middleware + SameSite cookies | 2h |
| **I2** | Missing security headers | XSS, clickjacking | CSP, HSTS, X-XSS-Protection | 1h |
| **I3** | Empty catch blocks | Silent failures | Sentry integration + logging | 3h |
| **I4** | No input validation | Injection attacks | Zod schemas on all endpoints | 4h |
| **I5** | Hardcoded default credentials | Auth bypass | Remove defaults, enforce strong passwords | 1h |
| **I6** | No tenant isolation | Data leakage | JWT claims + RLS policies | 4h |
| **I7** | CORS wildcard enabled | CSRF amplification | Explicit origin whitelist | 1h |
| **I8** | No API authentication | Unauthorized access | JWT middleware on all /api/* routes | 3h |
| **I9** | Console.error exposes state | Info leakage | Winston logger replacement | 2h |

---

### 2.3 Security Hardening Timeline

```
Week 1: CRITICAL Fixes
├── Day 1-2: License encryption (C1)
├── Day 2-3: Rate limiting (C2)
└── Day 3-4: Secret management (C3)

Week 2: IMPORTANT Fixes
├── Day 1-2: CSRF + Security headers (I1, I2)
├── Day 2-3: Error handling + Sentry (I3)
├── Day 3-4: Input validation (I4, I5)
└── Day 4-5: Auth + Tenant isolation (I6, I7, I8, I9)
```

---

## 3. Infrastructure Recommendation

### 3.1 Platform Comparison

| Criteria | Cloudflare Workers | AWS VPS (EC2) | Hybrid (Recommended) |
|----------|-------------------|---------------|---------------------|
| **Cold Start** | 50-500ms | 0ms (always-on) | Edge: warm, Core: 0ms |
| **Latency to Exchange** | 50-200ms | 5-15ms (colocated) | Core on VPS: 5-15ms |
| **Global Dashboard** | <50ms worldwide | 100-300ms | Edge: <50ms |
| **Cost (100 users)** | $20/month | $60/month | $80/month |
| **Cost (1000 users)** | $200/month | $300/month | $250/month |
| **Scalability** | Auto (serverless) | Manual (auto-scaling) | Auto + manual |
| **Complexity** | Low | Medium | Medium-High |

### 3.2 Recommended: Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HYBRID ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐              ┌─────────────────────┐
│  Cloudflare Edge    │              │  AWS VPS (Singapore)│
│  (Global Dashboard) │              │  (Trading Engine)   │
├─────────────────────┤              ├─────────────────────┤
│ - Pages (React UI)  │◀──WebSocket─▶│ - Node.js Engine    │
│ - Workers (API GW)  │  (orders)    │ - WebSocket Feeds   │
│ - KV (Session)      │  REST (admin)│ - Order Execution   │
│ - Durable Objects   │              │ - Redis Cache       │
│   (Rate limiting)   │              │ - P&L Tracking      │
└─────────────────────┘              └─────────────────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│  Supabase (Global)  │              │  Redis (Local)      │
│  - Auth (JWT)       │              │  - Orderbook cache  │
│  - PostgreSQL       │              │  - Ticker cache     │
│  - RLS Policies     │              │  - Trade stream     │
└─────────────────────┘              └─────────────────────┘
```

### 3.3 Cost Analysis

#### Phase 1: MVP (100 concurrent users)

| Component | Platform | Tier | Cost/Month |
|-----------|----------|------|------------|
| Dashboard UI | Cloudflare Pages | Pro | $0 |
| Edge API | Cloudflare Workers | Paid | $20 |
| KV Storage | Cloudflare KV | Standard | $5 |
| Trading Engine | AWS EC2 | c6i.large (Singapore) | $60 |
| Redis Cache | AWS ElastiCache | cache.t3.micro | $15 |
| Database | Supabase | Pro | $25 |
| Error Tracking | Sentry | Team | $26 |
| **Total** | | | **$151/month** |

#### Phase 2: Growth (500 concurrent users)

| Component | Platform | Tier | Cost/Month |
|-----------|----------|------|------------|
| Dashboard UI | Cloudflare Pages | Pro | $0 |
| Edge API | Cloudflare Workers | Paid | $100 |
| KV Storage | Cloudflare KV | Standard | $20 |
| Trading Engine | AWS EC2 | c6i.xlarge (Singapore) | $120 |
| Redis Cache | AWS ElastiCache | cache.t3.small | $40 |
| Database | Supabase | Pro | $25 |
| Error Tracking | Sentry | Business | $80 |
| **Total** | | | **$385/month** |

#### Phase 3: Scale (1000+ institutions)

| Component | Platform | Tier | Cost/Month |
|-----------|----------|------|------------|
| Dashboard UI | Cloudflare Pages | Pro | $0 |
| Edge API | Cloudflare Workers | Paid | $200 |
| KV Storage | Cloudflare KV | Standard | $50 |
| Trading Engine | AWS EC2 × 2 | c6i.2xlarge (Tokyo + SG) | $480 |
| Redis Cache | AWS ElastiCache | cache.t3.medium | $100 |
| Database | Supabase | Enterprise | $500 |
| Error Tracking | Sentry | Enterprise | $400 |
| Monitoring | Grafana Cloud | Pro | $200 |
| **Total** | | | **$1,930/month** |

### 3.4 Deployment Topology

#### MVP Topology (Single VPS)

```
┌─────────────────────────────────────────────┐
│  AWS Singapore (ap-southeast-1)             │
│  ┌─────────────────────────────────────┐   │
│  │  EC2 c6i.large (2 vCPU, 4GB RAM)    │   │
│  │  - Trading Engine (Node.js)         │   │
│  │  - WebSocket Feed Manager           │   │
│  │  - Order Executor                   │   │
│  │  - Redis (local, port 6379)         │   │
│  └─────────────────────────────────────┘   │
│  Latency: OKX 5-10ms, Bybit 5-10ms,        │
│           Binance 30-40ms                  │
└─────────────────────────────────────────────┘
```

#### Production Topology (Dual VPS)

```
┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│  AWS Tokyo (ap-northeast-1)         │  │  AWS Singapore (ap-southeast-1)     │
│  ┌─────────────────────────────┐   │  │  ┌─────────────────────────────┐   │
│  │  EC2 c6i.xlarge             │   │  │  │  EC2 c6i.xlarge             │   │
│  │  - Binance Scanner          │   │  │  │  - OKX Scanner              │   │
│  │  - Binance Executor         │   │  │  │  - Bybit Scanner            │   │
│  │  - Local Redis              │   │  │  │  - Bybit Executor           │   │
│  │  - Latency: 1-5ms           │   │  │  │  - Local Redis              │   │
│  └─────────────────────────────┘   │  │  │  - Latency: 5-10ms            │   │
│                                     │  │  └─────────────────────────────┘   │
│  Signal Aggregator ◀───────────────┴──┴─────────────────────────────────────┘
│  (Singapore or CF Workers)
└─────────────────────────────────────┘
```

---

## 4. Scalability Roadmap

### 4.1 Capacity Planning

| Metric | 100 Users | 500 Users | 1000 Users |
|--------|-----------|-----------|------------|
| Requests/sec | 50 | 250 | 500 |
| WebSocket connections | 200 | 1000 | 2000 |
| Orders/sec | 10 | 50 | 100 |
| Database writes/sec | 20 | 100 | 200 |
| Redis ops/sec | 1000 | 5000 | 10000 |
| Bandwidth | 10 Mbps | 50 Mbps | 100 Mbps |

### 4.2 Scaling Strategies

#### Horizontal Scaling (Recommended)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Engine #1   │    │  Engine #N   │    │  Load        │
│  (Tokyo)     │    │  (Singapore) │    │  Balancer    │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Signal Router  │
                  │  (Kafka/RabbitMQ)│
                  └─────────────────┘
```

#### Vertical Scaling (Quick Win)

| Tier | vCPU | RAM | Cost/Month | Max Users |
|------|------|-----|------------|-----------|
| c6i.large | 2 | 4GB | $60 | 100 |
| c6i.xlarge | 4 | 8GB | $120 | 500 |
| c6i.2xlarge | 8 | 16GB | $240 | 1000 |
| c6i.4xlarge | 16 | 32GB | $480 | 2500 |

---

## 5. Compliance Framework (SEC/FCA)

### 5.1 Regulatory Requirements

| Requirement | SEC (US) | FCA (UK) | Implementation |
|-------------|----------|----------|----------------|
| **Record Keeping** | 3 years | 5 years | PostgreSQL + S3 archive |
| **Audit Trail** | Required | Required | Audit logging service |
| **Best Execution** | Reg NMS | MiFID II | Price improvement logic |
| **Risk Disclosure** | Required | Required | Terms + warnings |
| **AML/KYC** | Required | Required | Supabase Auth + Onfido |
| **Data Privacy** | CCPA | GDPR | Data encryption + export |
| **Market Manipulation** | prohibited | prohibited | Surveillance module |

### 5.2 Compliance Implementation Checklist

```yaml
# SEC Compliance (US)
sec_compliance:
  record_keeping:
    - trade_confirmations: 3_years
    - order_records: 3_years
    - communications: 3_years
  best_execution:
    - price_improvement: enabled
    - market_center_stats: reported
  risk_disclosure:
    - trading_risks: documented
    - performance_disclaimer: shown
  market_surveillance:
    - wash_trading: detected
    - spoofing: detected
    - layering: detected

# FCA Compliance (UK)
fca_compliance:
  mifid_ii:
    - transaction_reporting: enabled
    - best_execution: verified
    - client_categorization: professional/retail
  gdpr:
    - data_encryption: aes-256
    - right_to_erasure: implemented
    - data_portability: csv_export
  audit_trail:
    - all_actions_logged: true
    - tamper_proof: blockchain_hash
```

### 5.3 Audit Logging Implementation

```typescript
// src/audit/audit-logger.ts
import { createHash } from 'crypto';

interface AuditEvent {
  timestamp: string;
  actor: string; // userId, system
  action: string; // 'ORDER_CREATED', 'TRADE_EXECUTED'
  resource: string; // 'order:12345'
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export class AuditLogger {
  private previousHash = 'GENESIS';

  async log(event: AuditEvent): Promise<void> {
    const eventHash = this.hashEvent(event, this.previousHash);

    await db.auditLog.create({
      data: {
        ...event,
        hash: eventHash,
        previousHash: this.previousHash,
      }
    });

    this.previousHash = eventHash;
  }

  private hashEvent(event: AuditEvent, previousHash: string): string {
    const data = JSON.stringify({ ...event, previousHash });
    return createHash('sha256').update(data).digest('hex');
  }

  // Verify chain integrity
  async verifyChain(): Promise<boolean> {
    const logs = await db.auditLog.findMany({ orderBy: { timestamp: 'asc' } });
    let expectedPrevious = 'GENESIS';

    for (const log of logs) {
      const expectedHash = this.hashEvent(log, expectedPrevious);
      if (log.hash !== expectedHash) return false;
      expectedPrevious = expectedHash;
    }
    return true;
  }
}
```

---

## 6. Beta Launch Readiness Checklist

### P0: Security (Must Complete)

- [ ] **C1**: License encryption implemented + tested
- [ ] **C2**: Rate limiting on all API endpoints
- [ ] **C3**: Private keys migrated to AWS Secrets Manager
- [ ] Security headers: CSP, HSTS, X-Frame-Options
- [ ] CSRF protection on all state-changing requests
- [ ] JWT authentication on all `/api/*` routes
- [ ] Tenant isolation verified (RLS policies)

### P1: Infrastructure (Must Complete)

- [ ] AWS VPS provisioned (Singapore c6i.large)
- [ ] Redis cache configured
- [ ] Supabase database migrated
- [ ] Cloudflare Pages + Workers deployed
- [ ] SSL certificates installed
- [ ] Domain DNS configured

### P2: Monitoring (Must Complete)

- [ ] Sentry error tracking enabled
- [ ] Health check endpoint responding
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Log aggregation (Winston + CloudWatch)
- [ ] Alert rules configured (PagerDuty)

### P3: Compliance (Recommended for Beta)

- [ ] Audit logging enabled
- [ ] Terms of service + risk disclosure
- [ ] Data export functionality
- [ ] Account deletion flow
- [ ] Rate limiting documented in API docs

### P4: Documentation (Recommended)

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment runbook
- [ ] Incident response playbook
- [ ] User onboarding guide
- [ ] Troubleshooting guide

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Exchange API rate limit | High | Medium | Connection pooling + backoff |
| VPS outage | Medium | High | Dual-VPS failover |
| Database corruption | Low | Critical | Daily backups + point-in-time recovery |
| Security breach | Medium | Critical | Encryption + audit logging + regular pentests |
| Regulatory action | Low | High | Legal review + compliance framework |
| Slippage > threshold | High | Medium | Circuit breaker + max slippage config |
| Network latency spike | Medium | Medium | Colocation + multiple VPS regions |

---

## 8. Unresolved Questions

1. **Exchange WebSocket Rate Limits:** Need to verify exact rate limits for OKX/Bybit/Binance WebSocket connections to avoid bans during event-driven trading.

2. **Atomic Execution Rollback:** If one leg of arbitrage fails after the other executes, what is the hedge strategy? Market order hedge vs. wait-and-see?

3. **Cross-Border Compliance:** Which jurisdiction to incorporate? Singapore (crypto-friendly) vs. Delaware (VC-friendly) vs. UK (FCA sandbox)?

4. **Failover Strategy:** If Tokyo VPS fails, should trading auto-failover to Singapore or halt completely?

5. **Market Data Consistency:** How to handle clock skew between exchanges when calculating spreads? NTP sync vs. exchange timestamps?

---

## 9. Next Steps

### Week 1: Security Hardening
- Implement C1-C3 CRITICAL fixes
- Deploy to staging environment
- Penetration testing

### Week 2: Infrastructure Setup
- Provision AWS VPS (Singapore)
- Configure Cloudflare + Supabase
- Migrate database

### Week 3: Monitoring + Compliance
- Sentry + UptimeRobot setup
- Audit logging implementation
- Legal review (Terms + Privacy)

### Week 4: Beta Launch
- Invite-only beta (10 users)
- Monitor latency + error rates
- Iterate based on feedback

---

_Sources: Researcher reports 01-03, Security Audit 260319, MVP Final Report 260320_
