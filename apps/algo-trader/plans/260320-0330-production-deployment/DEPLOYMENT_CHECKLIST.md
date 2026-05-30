# Deployment Checklist — Algo-Trader MVP

**Version:** 1.0.0 | **Last Updated:** 2026-03-20

---

## Pre-Deployment

### Infrastructure Setup

- [ ] **AWS VPS Provisioned**
  - Instance: t3.medium (2 vCPU, 4GB RAM)
  - Region: ap-southeast-1 (Singapore)
  - Storage: 50GB GP3 SSD
  - Elastic IP assigned

- [ ] **DNS Configured**
  - A record: `algo-trader.yourdomain.com` → Elastic IP
  - PTR record (optional): Reverse DNS

- [ ] **Security Groups**
  - Inbound: 443 (HTTPS), 22 (SSH - restricted IPs)
  - Outbound: All (for exchange WebSocket connections)

### Environment Preparation

- [ ] **SSH to VPS**
  ```bash
  ssh -i ~/.ssh/algo-trader.pem ubuntu@<VPS_IP>
  ```

- [ ] **Install Docker**
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  ```

- [ ] **Install Docker Compose**
  ```bash
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  ```

- [ ] **Clone Repository**
  ```bash
  git clone https://github.com/your-org/algo-trader.git /opt/algo-trader
  cd /opt/algo-trader
  ```

- [ ] **Configure Environment**
  ```bash
  cp plans/260320-0330-production-deployment/.env.example .env
  nano .env  # Fill in all values
  ```

- [ ] **Generate Secrets**
  ```bash
  # JWT_SECRET (256-bit random)
  openssl rand -hex 32

  # Passwords
  openssl rand -base64 24
  ```

---

## Deployment

### SSL Certificates

- [ ] **Install Certbot**
  ```bash
  sudo apt update
  sudo apt install certbot -y
  ```

- [ ] **Obtain Certificate**
  ```bash
  sudo certbot certonly --standalone -d algo-trader.yourdomain.com
  ```

- [ ] **Setup Auto-Renewal**
  ```bash
  sudo systemctl enable certbot.timer
  sudo systemctl start certbot.timer
  ```

- [ ] **Copy Certs to Nginx**
  ```bash
  sudo mkdir -p /etc/nginx/ssl
  sudo cp /etc/letsencrypt/live/algo-trader.yourdomain.com/fullchain.pem /etc/nginx/ssl/
  sudo cp /etc/letsencrypt/live/algo-trader.yourdomain.com/privkey.pem /etc/nginx/ssl/
  ```

### Docker Deployment

- [ ] **Copy Deployment Files**
  ```bash
  cp plans/260320-0330-production-deployment/docker-compose.yml ./
  cp plans/260320-0330-production-deployment/nginx.conf ./nginx/
  mkdir -p grafana/provisioning grafana/dashboards
  cp plans/260320-0330-production-deployment/grafana-*.yml ./grafana/provisioning/
  cp plans/260320-0330-production-deployment/trading-dashboard.json ./grafana/dashboards/
  cp plans/260320-0330-production-deployment/prometheus.yml ./prometheus/
  cp plans/260320-0330-production-deployment/alerts.yml ./prometheus/
  ```

- [ ] **Build & Start**
  ```bash
  docker compose build
  docker compose up -d
  ```

- [ ] **View Logs**
  ```bash
  docker compose logs -f algo-trader
  ```

- [ ] **Check Container Status**
  ```bash
  docker compose ps
  ```

---

## Post-Deployment

### Health Checks

- [ ] **API Health**
  ```bash
  curl -f https://algo-trader.yourdomain.com/health
  # Expected: {"status":"ok","uptime":...}
  ```

- [ ] **Metrics Endpoint**
  ```bash
  curl -f https://algo-trader.yourdomain.com/metrics
  # Expected: Prometheus metrics text
  ```

- [ ] **Grafana Dashboard**
  ```bash
  open https://algo-trader.yourdomain.com/grafana
  # Login: admin / <GRAFANA_PASSWORD>
  ```

- [ ] **Prometheus UI**
  ```bash
  open https://algo-trader.yourdomain.com/prometheus
  ```

### Integration Tests

- [ ] **Test WebSocket Connection**
  ```bash
  wscat -c wss://algo-trader.yourdomain.com/ws
  ```

- [ ] **Test API Endpoints**
  ```bash
  curl https://algo-trader.yourdomain.com/api/health
  curl https://algo-trader.yourdomain.com/api/signals
  curl https://algo-trader.yourdomain.com/api/pnl
  ```

- [ ] **Verify Exchange Connections**
  - Check logs for WebSocket connection messages
  - Verify Redis orderbook updates
  - Confirm spread detection running

### Monitoring Setup

- [ ] **Grafana Dashboards Imported**
  - Algo-Trading Overview dashboard visible
  - Data source connected to Prometheus

- [ ] **Alerts Configured**
  - Circuit breaker alerts
  - Daily loss limit alerts
  - Memory usage alerts
  - Service down alerts

- [ ] **Notification Channels**
  - Slack webhook (optional)
  - Email alerts (optional)
  - Telegram bot (optional)

---

## Rollback Procedure

### If Deployment Fails

1. **Stop New Containers**
   ```bash
   docker compose down
   ```

2. **Checkout Previous Version**
   ```bash
   git checkout <previous-commit-hash>
   ```

3. **Rebuild & Restart**
   ```bash
   docker compose build
   docker compose up -d
   ```

4. **Verify Rollback**
   ```bash
   curl -f https://algo-trader.yourdomain.com/health
   ```

### Emergency Halt Trading

1. **API Command**
   ```bash
   curl -X POST https://algo-trader.yourdomain.com/api/admin/halt \
     -H "Authorization: Bearer <API_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"reason":"Emergency maintenance"}'
   ```

2. **Direct Container Stop**
   ```bash
   docker compose stop algo-trader
   ```

3. **Restart Trading**
   ```bash
   curl -X POST https://algo-trader.yourdomain.com/api/admin/resume \
     -H "Authorization: Bearer <API_KEY>"
   ```

---

## Backup & Recovery

### Database Backup

- [ ] **Daily Backup Script**
  ```bash
  # /opt/algo-trader/scripts/backup-db.sh
  pg_dump -h postgres -U algo_trader algo_trader | gzip > /backups/algo_trader_$(date +%Y%m%d).sql.gz
  ```

- [ ] **S3 Upload (Optional)**
  ```bash
  aws s3 cp /backups/ s3://your-bucket/algo-trader-backups/ --recursive
  ```

### Redis Backup

- [ ] **RDB Snapshot**
  ```bash
  docker compose exec redis redis-cli BGSAVE
  cp /var/lib/docker/volumes/redis-data/_data/dump.rdb /backups/
  ```

### Restore Procedure

1. **Stop Services**
   ```bash
   docker compose down
   ```

2. **Restore Database**
   ```bash
   gunzip -c /backups/algo_trader_20260320.sql.gz | psql -h postgres -U algo_trader algo_trader
   ```

3. **Restore Redis**
   ```bash
   cp /backups/dump.rdb /var/lib/docker/volumes/redis-data/_data/
   ```

4. **Restart Services**
   ```bash
   docker compose up -d
   ```

---

## Costs

| Resource | Monthly Cost |
|----------|-------------|
| AWS t3.medium | $30 |
| 50GB SSD | $5 |
| Data Transfer | $10 |
| **Total** | **$45/month** |

---

## Contacts

- **On-Call:** [Your contact info]
- **Escalation:** [Backup contact]
- **AWS Support:** https://console.aws.amazon.com/support
