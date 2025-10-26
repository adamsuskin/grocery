# Monitoring Infrastructure Setup - Summary

## What Was Created

This monitoring infrastructure provides comprehensive production monitoring, health checks, and alerting for the Grocery App.

### Health Check Endpoints (Enhanced in Server)

Three new health check endpoints were added to `/home/adam/grocery/server/index.ts`:

1. **`GET /health`** - Basic health check (fast, no dependencies)
   - Returns: `200 OK` with basic status
   - Use: Load balancer health checks

2. **`GET /health/live`** - Liveness probe
   - Returns: Process status, memory usage, uptime
   - Use: Kubernetes/Docker liveness checks

3. **`GET /health/ready`** - Readiness probe
   - Returns: Database status, connection pool, memory usage
   - Status: `200` (ready) or `503` (not ready)
   - Use: Kubernetes readiness checks, traffic routing decisions

### Docker Health Check Script

**File**: `/home/adam/grocery/healthcheck.js`

- Configurable health check script for Docker containers
- Exits with code 0 (healthy) or 1 (unhealthy)
- Supports timeout, custom endpoints, and debug mode
- Ready to use in Dockerfile `HEALTHCHECK` directive

### Monitoring Stack

**Directory**: `/home/adam/grocery/monitoring/`

Complete monitoring infrastructure with:

#### 1. Docker Compose Stack
**File**: `docker-compose.monitoring.yml`

Includes:
- **Prometheus** (port 9090) - Metrics collection and storage
- **Grafana** (port 3001) - Visualization dashboards
- **Alertmanager** (port 9093) - Alert routing and notifications
- **Node Exporter** (port 9100) - System metrics (CPU, memory, disk)

#### 2. Prometheus Configuration
**File**: `prometheus.yml`

- Configured to scrape grocery API metrics
- System metrics via Node Exporter
- Health check monitoring
- 15-second scrape interval
- 30-day data retention

#### 3. Alert Rules
**File**: `alerts.yml`

Pre-configured alerts for:
- API server down
- High memory usage (> 90%)
- High CPU usage (> 80%)
- Low disk space (< 10%)
- Database pool exhausted
- High API error rate (> 5%)
- Slow API response times (> 2s)
- High authentication failure rate
- Zero-cache sync issues

#### 4. Alertmanager Configuration
**File**: `alertmanager.yml`

- Alert grouping and routing
- Severity-based routing (critical vs warning)
- Support for Slack, email, PagerDuty (templates ready)
- Alert inhibition rules

#### 5. Grafana Configuration
**Files**:
- `grafana-datasources.yml` - Prometheus datasource
- `grafana-dashboard-config.yml` - Dashboard provisioning
- `grafana-dashboard.json` - Pre-built monitoring dashboard

**Dashboard includes**:
- API server status and health
- System memory and CPU usage
- Disk usage gauge
- Database connection pool stats
- API request rate by status code
- Response time percentiles (p50, p90, p95, p99)
- Error rate gauge

#### 6. Example Metrics Implementation
**File**: `example-metrics-implementation.ts`

Complete, ready-to-use example showing:
- How to add `prom-client` to your Express app
- Custom metrics definitions
- Middleware for automatic request tracking
- Database query tracking
- Authentication metrics
- Business metrics
- Helper functions and integration examples

### Documentation

1. **`/home/adam/grocery/monitoring/README.md`** (14KB)
   - Complete monitoring setup guide
   - Installation instructions
   - Configuration details
   - Troubleshooting guide
   - Production deployment examples (Kubernetes, Docker, AWS)

2. **`/home/adam/grocery/MONITORING.md`** (6.8KB)
   - Quick reference guide
   - Health check endpoint documentation
   - Key metrics and thresholds
   - Quick start commands
   - Next steps

3. **`/home/adam/grocery/monitoring/SETUP_SUMMARY.md`** (this file)
   - High-level overview
   - What was created
   - How to get started

## Quick Start Guide

### 1. Test Health Check Endpoints

Start your API server:
```bash
pnpm server:dev
```

Test the endpoints:
```bash
# Basic health check
curl http://localhost:3000/health

# Liveness probe
curl http://localhost:3000/health/live

# Readiness probe (most comprehensive)
curl http://localhost:3000/health/ready
```

### 2. Start Monitoring Stack

```bash
cd /home/adam/grocery/monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

Wait 30 seconds for services to start, then access:
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

### 3. View the Dashboard

1. Open Grafana at http://localhost:3001
2. Login with `admin` / `admin`
3. Navigate to Dashboards
4. Open "Grocery App - Production Monitoring"

Note: Some panels will show "No data" until you implement application metrics (see step 4).

### 4. Add Application Metrics (Optional but Recommended)

To get full visibility into your application, add Prometheus metrics:

```bash
# Install prom-client
pnpm add prom-client
```

Then follow the implementation guide in:
- `/home/adam/grocery/monitoring/example-metrics-implementation.ts`
- `/home/adam/grocery/monitoring/README.md` (section: "Implementing Application Metrics")

This will enable:
- Request duration and rate tracking
- Database connection pool monitoring
- Authentication metrics
- Business metrics (list counts, items, etc.)
- Custom application metrics

### 5. Test Docker Health Check

```bash
# Test the health check script
node /home/adam/grocery/healthcheck.js
echo $?  # Should print 0 if healthy, 1 if unhealthy

# Test with different endpoints
HEALTH_ENDPOINT=/health/live node /home/adam/grocery/healthcheck.js

# Test with debug mode
DEBUG_HEALTHCHECK=true node /home/adam/grocery/healthcheck.js
```

### 6. Configure Alerts (Optional)

Edit `/home/adam/grocery/monitoring/alertmanager.yml` to add notification channels:

Example for Slack:
```yaml
receivers:
  - name: 'critical'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#critical-alerts'
```

Then restart Alertmanager:
```bash
docker-compose -f docker-compose.monitoring.yml restart alertmanager
```

## What Metrics Are Available Now

### System Metrics (Available Immediately via Node Exporter)
- CPU usage
- Memory usage (total, available, used)
- Disk space
- Network I/O
- Load average
- File descriptors

### Application Metrics (Available After Implementing prom-client)
- HTTP request duration (histogram with percentiles)
- HTTP request count by method, route, and status
- Database connection pool stats
- Database query duration
- Authentication attempts and failures
- Business metrics (lists, items, shares)
- Zero-cache sync metrics

### Health Check Metrics (Available Now)
- Basic uptime and status
- Process information (PID, Node version)
- Memory usage (heap, RSS)
- Database connection status
- Connection pool statistics
- Overall readiness status

## Files Created

```
/home/adam/grocery/
├── healthcheck.js                          # Docker health check script
├── MONITORING.md                            # Quick reference guide
│
└── monitoring/                              # Monitoring infrastructure
    ├── README.md                            # Complete documentation
    ├── SETUP_SUMMARY.md                     # This file
    ├── docker-compose.monitoring.yml        # Monitoring stack
    ├── prometheus.yml                       # Prometheus config
    ├── alerts.yml                           # Alert rules
    ├── alertmanager.yml                     # Alertmanager config
    ├── grafana-datasources.yml              # Grafana datasources
    ├── grafana-dashboard-config.yml         # Dashboard provisioning
    ├── grafana-dashboard.json               # Pre-built dashboard
    └── example-metrics-implementation.ts    # Metrics implementation guide

Files modified:
└── server/index.ts                          # Enhanced with health endpoints
```

## Key Metrics to Monitor

| Metric | Description | Threshold | Alert |
|--------|-------------|-----------|-------|
| **API Response Time** | p95 latency | > 1000ms | SlowAPIResponse |
| **Error Rate** | 5xx errors | > 5% | HighAPIErrorRate |
| **Database Pool** | Waiting connections | > 5 | DatabasePoolExhausted |
| **Memory Usage** | Heap used | > 90% | HighMemoryUsage |
| **CPU Usage** | CPU utilization | > 80% | HighCPUUsage |
| **Disk Space** | Root partition free | < 10% | DiskSpaceLow |
| **Zero-Cache Sync** | Replication lag | > 30s | ZeroCacheSyncLag |
| **Auth Failures** | Failed logins/sec | > 10 | HighAuthFailureRate |
| **API Server** | Server up/down | down | APIServerDown |

## Production Deployment

### Kubernetes

Add to your deployment:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Docker / Docker Compose

Add to your service:

```yaml
services:
  api:
    image: grocery-api:latest
    healthcheck:
      test: ["CMD", "node", "/app/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### AWS ECS

```json
{
  "healthCheck": {
    "command": ["CMD-SHELL", "node /app/healthcheck.js"],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 60
  }
}
```

## Next Steps

### Immediate (Ready to Use)
1. ✅ Test health check endpoints
2. ✅ Start monitoring stack
3. ✅ Access Grafana dashboard
4. ✅ Test Docker health check script

### Short Term (Recommended)
5. 📝 Implement application metrics (prom-client)
6. 📝 Configure Alertmanager notifications
7. 📝 Customize Grafana dashboard
8. 📝 Add health checks to Docker/Kubernetes configs

### Long Term (Optional)
9. 📝 Add distributed tracing (Jaeger/Tempo)
10. 📝 Add log aggregation (Loki)
11. 📝 Set up external uptime monitoring
12. 📝 Create runbooks for common alerts

## Troubleshooting

### Issue: Health endpoint returns 503

**Solution**: Check database connection
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs grocery-postgres
```

### Issue: Prometheus shows "Down" for targets

**Solution**: Check connectivity
```bash
# Test from Prometheus container
docker exec grocery-prometheus wget -O- http://host.docker.internal:3000/health

# Check if app is running
curl http://localhost:3000/health
```

### Issue: No data in Grafana dashboard

**Solution**:
1. Check Prometheus is scraping: http://localhost:9090/targets
2. Verify datasource: Grafana → Configuration → Data Sources
3. Check time range in Grafana (top right)
4. Some panels require application metrics (prom-client)

### Issue: Alerts not firing

**Solution**:
```bash
# Check Prometheus alerts
# Open http://localhost:9090/alerts

# Validate alert rules
docker exec grocery-prometheus promtool check rules /etc/prometheus/alerts.yml

# Check Alertmanager
# Open http://localhost:9093
```

## Support and Documentation

- **Quick Reference**: `/home/adam/grocery/MONITORING.md`
- **Full Documentation**: `/home/adam/grocery/monitoring/README.md`
- **Implementation Guide**: `/home/adam/grocery/monitoring/example-metrics-implementation.ts`

For issues:
```bash
# Check application logs
docker logs <container-name>

# Check monitoring stack logs
docker-compose -f monitoring/docker-compose.monitoring.yml logs
```

## Summary

You now have:
- ✅ Three health check endpoints (`/health`, `/health/live`, `/health/ready`)
- ✅ Docker health check script (`healthcheck.js`)
- ✅ Complete monitoring stack (Prometheus + Grafana + Alertmanager)
- ✅ Pre-configured dashboard with 9 panels
- ✅ Alert rules for common production issues
- ✅ System metrics monitoring (CPU, memory, disk)
- ✅ Comprehensive documentation
- ✅ Example implementation for application metrics
- ✅ Production deployment examples

The infrastructure is ready to deploy and will provide comprehensive visibility into your application's health and performance in production!
