# Monitoring and Health Checks - Quick Reference

This document provides a quick reference for the production monitoring and health check infrastructure.

## Health Check Endpoints

### 1. Basic Health Check
```bash
curl http://localhost:3000/health
```

**Response Example:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-26T08:00:00.000Z"
}
```

**Use Case:** Load balancer health checks, quick uptime verification

### 2. Liveness Probe
```bash
curl http://localhost:3000/health/live
```

**Response Example:**
```json
{
  "success": true,
  "status": "alive",
  "timestamp": "2025-10-26T08:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "process": {
    "pid": 1234,
    "version": "v20.11.0",
    "platform": "linux"
  },
  "memory": {
    "heapUsed": 45,
    "heapTotal": 128,
    "rss": 180,
    "external": 2,
    "unit": "MB"
  }
}
```

**Use Case:** Kubernetes liveness probe, Docker health check, verify process is running

### 3. Readiness Probe
```bash
curl http://localhost:3000/health/ready
```

**Response Example (Healthy):**
```json
{
  "success": true,
  "status": "ready",
  "timestamp": "2025-10-26T08:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "responseTime": 15,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 12,
      "pool": {
        "total": 20,
        "idle": 18,
        "waiting": 0,
        "active": 2
      }
    },
    "memory": {
      "status": "healthy",
      "heapUsed": 45,
      "heapTotal": 128,
      "heapUsedPercent": 35,
      "rss": 180,
      "unit": "MB"
    }
  }
}
```

**Response Example (Unhealthy):**
```json
{
  "success": false,
  "status": "not_ready",
  "timestamp": "2025-10-26T08:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "responseTime": 5002,
  "checks": {
    "database": {
      "status": "unhealthy",
      "error": "Connection timeout"
    },
    "memory": {
      "status": "warning",
      "heapUsed": 115,
      "heapTotal": 128,
      "heapUsedPercent": 90,
      "rss": 240,
      "unit": "MB"
    }
  }
}
```

**Use Case:** Kubernetes readiness probe, verify service is ready to accept traffic

**Status Codes:**
- `200`: Service is ready
- `503`: Service is not ready (dependencies unhealthy)

## Docker Health Check Script

### Location
`/home/adam/grocery/healthcheck.js`

### Usage in Dockerfile
```dockerfile
COPY healthcheck.js /app/healthcheck.js
RUN chmod +x /app/healthcheck.js

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node /app/healthcheck.js
```

### Manual Testing
```bash
node /home/adam/grocery/healthcheck.js
echo $?  # 0 = healthy, 1 = unhealthy
```

### Environment Variables
- `HEALTH_ENDPOINT`: Default `/health/ready`
- `HOST`: Default `localhost`
- `PORT`: Default `3000`
- `HEALTHCHECK_TIMEOUT`: Default `5000` (ms)
- `DEBUG_HEALTHCHECK`: Default `false`

## Monitoring Stack

### Quick Start
```bash
cd /home/adam/grocery/monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### Access Dashboards
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

### Stop Monitoring
```bash
cd /home/adam/grocery/monitoring
docker-compose -f docker-compose.monitoring.yml down
```

## Key Metrics to Monitor

| Metric | Description | Threshold | Alert |
|--------|-------------|-----------|-------|
| API Response Time | p95 response time | > 1000ms | SlowAPIResponse |
| Error Rate | 5xx error percentage | > 5% | HighAPIErrorRate |
| Database Pool | Waiting connections | > 5 | DatabasePoolExhausted |
| Memory Usage | Heap used percentage | > 90% | HighMemoryUsage |
| CPU Usage | CPU utilization | > 80% | HighCPUUsage |
| Disk Space | Root partition free | < 10% | DiskSpaceLow |
| Zero-Cache Sync | Sync lag time | > 30s | ZeroCacheSyncLag |
| Auth Failures | Login failures/sec | > 10 | HighAuthFailureRate |

## Files Created

### Monitoring Configuration
- `/home/adam/grocery/monitoring/docker-compose.monitoring.yml` - Docker Compose stack
- `/home/adam/grocery/monitoring/prometheus.yml` - Prometheus configuration
- `/home/adam/grocery/monitoring/alerts.yml` - Alert rules
- `/home/adam/grocery/monitoring/alertmanager.yml` - Alertmanager configuration
- `/home/adam/grocery/monitoring/grafana-datasources.yml` - Grafana datasources
- `/home/adam/grocery/monitoring/grafana-dashboard-config.yml` - Dashboard provisioning
- `/home/adam/grocery/monitoring/grafana-dashboard.json` - Pre-built dashboard
- `/home/adam/grocery/monitoring/README.md` - Detailed documentation

### Health Check
- `/home/adam/grocery/healthcheck.js` - Docker health check script

### Server Updates
- `/home/adam/grocery/server/index.ts` - Enhanced with three health endpoints

## Next Steps

### 1. Add Application Metrics (Optional but Recommended)

Install prom-client:
```bash
pnpm add prom-client
```

Create metrics middleware in your Express app to expose metrics at `/metrics` endpoint. See detailed instructions in `/home/adam/grocery/monitoring/README.md`.

### 2. Configure Alerts

Edit `/home/adam/grocery/monitoring/alertmanager.yml` to add notification channels:
- Slack webhooks
- Email notifications
- PagerDuty integration

### 3. Customize Dashboard

1. Log into Grafana at http://localhost:3001
2. Open "Grocery App - Production Monitoring" dashboard
3. Add custom panels and queries
4. Save changes

### 4. Production Deployment

#### Kubernetes
Add liveness and readiness probes to your deployment:
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

#### Docker
Add health check to docker-compose.yml:
```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "node", "/app/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Troubleshooting

### Health Check Returns 503
1. Check database connection
2. Verify PostgreSQL is running: `docker ps | grep postgres`
3. Check memory usage is < 90%

### Prometheus Not Scraping
1. Verify app is running: `curl http://localhost:3000/health`
2. Check Prometheus targets: http://localhost:9090/targets
3. Ensure `host.docker.internal` resolves from Prometheus container

### No Data in Grafana
1. Verify Prometheus datasource is configured
2. Check time range in Grafana (top right)
3. Verify metrics exist: http://localhost:9090

## Documentation

For complete documentation, see:
- `/home/adam/grocery/monitoring/README.md` - Full monitoring setup guide

## Support

Check logs for issues:
```bash
# Application logs
docker logs grocery-api

# Prometheus logs
docker logs grocery-prometheus

# Grafana logs
docker logs grocery-grafana
```
