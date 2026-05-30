# Production Runbook — Algo-Trader MVP

**Version:** 1.0.0 | **Last Updated:** 2026-03-20

---

## Quick Reference

| Action | Command |
|--------|---------|
| **View Logs** | `docker compose logs -f algo-trader` |
| **Restart Service** | `docker compose restart algo-trader` |
| **Stop Trading** | `curl -X POST https://DOMAIN/api/admin/halt` |
| **Check Health** | `curl https://DOMAIN/health` |
| **SSH Connect** | `ssh ubuntu@VPS_IP` |

---

## Daily Operations

### Morning Check (9:00 AM)

1. **Health Check**
   ```bash
   curl https://DOMAIN/health | jq
   ```

2. **Check P&L**
   ```bash
   curl https://DOMAIN/api/pnl | jq '.daily_pnl'
   ```

3. **Review Logs**
   ```bash
   docker compose logs --since 24h | grep -E "ERROR|WARN"
   ```

4. **Circuit Breaker Status**
   - Check Grafana dashboard
   - Verify state = CLOSED (0)

### Evening Check (6:00 PM)

1. **Daily Summary**
   ```bash
   curl https://DOMAIN/api/pnl | jq '{
     daily_pnl: .daily_pnl,
     total_trades: .total_trades,
     win_rate: .win_rate
   }'
   ```

2. **Backup Verification**
   ```bash
   ls -lh /backups/
   ```

---

## Incident Response

### Alert: Circuit Breaker Open

**Severity:** Critical | **Response Time:** 5 minutes

**Symptoms:**
- Trading halted
- Grafana shows `Circuit Breaker: OPEN`
- Alerts fired

**Diagnosis:**
```bash
# Check recent losses
docker compose logs algo-trader | grep "TRIPPED"

# Check P&L
curl https://DOMAIN/api/pnl | jq '.daily_pnl'

# Check exchange latency
curl https://DOMAIN/api/health | jq '.exchanges'
```

**Resolution:**
1. Review loss causes in logs
2. Fix any issues (API keys, network, etc.)
3. Reset circuit breaker:
   ```bash
   curl -X POST https://DOMAIN/api/admin/reset-circuit-breaker
   ```
4. Monitor for 30 minutes

---

### Alert: Daily Loss > $500

**Severity:** Critical | **Response Time:** Immediate

**Symptoms:**
- P&L below -$500 threshold
- Trading may auto-halt

**Diagnosis:**
```bash
# Get trade history
curl https://DOMAIN/api/trades?limit=50 | jq '.[] | {symbol, side, pnl}'

# Check current positions
curl https://DOMAIN/api/positions | jq
```

**Resolution:**
1. **HALT TRADING IMMEDIATELY**
   ```bash
   curl -X POST https://DOMAIN/api/admin/halt \
     -H "Authorization: Bearer API_KEY" \
     -d '{"reason":"Daily loss limit reached"}'
   ```

2. Review losing trades
3. Adjust strategy parameters if needed
4. Wait until next day to resume

---

### Alert: High Memory Usage (>800MB)

**Severity:** Warning | **Response Time:** 15 minutes

**Symptoms:**
- Heap memory > 800MB
- Potential OOM risk

**Diagnosis:**
```bash
docker stats algo-trader --no-stream
```

**Resolution:**
1. **Restart Container**
   ```bash
   docker compose restart algo-trader
   ```

2. **Monitor Memory**
   - Check Grafana memory panel
   - Set up alerts at 700MB

3. **If Issue Persists:**
   - Check for memory leaks in logs
   - Increase VPS RAM (t3.large)

---

### Alert: Service Down

**Severity:** Critical | **Response Time:** 5 minutes

**Symptoms:**
- Health check fails
- 502 Bad Gateway from Nginx

**Diagnosis:**
```bash
# Check container status
docker compose ps

# Check logs
docker compose logs algo-trader | tail -50
```

**Resolution:**
1. **Restart Service**
   ```bash
   docker compose up -d algo-trader
   ```

2. **If Container Crashes:**
   ```bash
   # Check logs for error
   docker compose logs algo-trader | grep -A5 "Error"

   # Rebuild if needed
   docker compose build algo-trader
   docker compose up -d algo-trader
   ```

3. **If VPS Unresponsive:**
   - AWS Console → EC2 → Reboot instance
   - Contact AWS Support if hardware failure

---

### Alert: Exchange Latency High (>500ms)

**Severity:** Warning | **Response Time:** 10 minutes

**Symptoms:**
- Slow order execution
- Missed arbitrage opportunities

**Diagnosis:**
```bash
curl https://DOMAIN/api/health | jq '.exchanges'
```

**Resolution:**
1. **Check Network**
   ```bash
   ping -c 5 stream.binance.com
   ping -c 5 sol-okx.com
   ```

2. **If Network Issue:**
   - AWS Status Page: https://status.aws.amazon.com/
   - Consider multi-region deployment

3. **If Exchange Issue:**
   - Check exchange status pages
   - Pause trading on affected exchange

---

## Maintenance Tasks

### Weekly

- [ ] **Review P&L Report**
  ```bash
  curl https://DOMAIN/api/pnl?period=7d | jq
  ```

- [ ] **Clean Old Logs**
  ```bash
  docker compose logs --tail=1000 > logs/latest.log
  ```

- [ ] **Update Dependencies**
  ```bash
  cd /opt/algo-trader
  git pull
  pnpm install
  docker compose build
  docker compose up -d
  ```

### Monthly

- [ ] **Rotate API Keys**
  - Generate new exchange API keys
  - Update `.env`
  - Restart services

- [ ] **Review Security Groups**
  - AWS Console → EC2 → Security Groups
  - Remove unused IP rules

- [ ] **Backup Test**
  ```bash
  # Restore to test DB
  psql -h localhost -U algo_trader -c "CREATE DATABASE test_restore"
  gunzip -c /backups/latest.sql.gz | psql -h localhost -U algo_trader test_restore
  ```

### Quarterly

- [ ] **SSL Certificate Renewal**
  ```bash
  sudo certbot certificates
  sudo certbot renew --dry-run
  ```

- [ ] **Disaster Recovery Drill**
  - Simulate VPS failure
  - Test backup restoration
  - Document lessons learned

- [ ] **Performance Review**
  - Analyze latency metrics
  - Review win rate trends
  - Adjust strategy parameters

---

## Emergency Contacts

| Role | Contact | Available |
|------|---------|-----------|
| **On-Call Engineer** | [Phone/Slack] | 24/7 |
| **AWS Support** | https://console.aws.amazon.com/support | 24/7 |
| **Exchange Support** | Binance/OKX/Bybit tickets | Business hours |

---

## Appendix: Useful Commands

### Docker Compose

```bash
# View all containers
docker compose ps -a

# View logs
docker compose logs -f [service-name]

# Restart service
docker compose restart [service-name]

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Rebuild service
docker compose build [service-name]
docker compose up -d [service-name]
```

### Database

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U algo_trader -d algo_trader

# Backup database
docker compose exec postgres pg_dump -U algo_trader algo_trader > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U algo_trader algo_trader
```

### Redis

```bash
# Connect to Redis CLI
docker compose exec redis redis-cli -a $REDIS_PASSWORD

# View keys
docker compose exec redis redis-cli -a $REDIS_PASSWORD KEYS "*"

# Backup RDB
docker compose exec redis redis-cli -a $REDIS_PASSWORD BGSAVE
```

### Monitoring

```bash
# Prometheus queries via API
curl 'http://localhost:9090/api/v1/query?query=algo_trader_trades_total'

# Grafana API
curl -u admin:PASSWORD http://localhost:3001/api/dashboards/db/algo-trading-overview
```
