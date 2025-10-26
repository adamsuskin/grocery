# Grocery App - Production Monitoring Setup

This directory contains the monitoring infrastructure for the Grocery App production environment, including Prometheus, Grafana, and alerting configuration.

## Overview

The monitoring stack consists of:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards
- **Alertmanager**: Alert routing and notifications
- **Node Exporter**: System-level metrics (CPU, memory, disk, network)

## Quick Start

### 1. Start Monitoring Stack

From the `monitoring` directory:

```bash
cd /home/adam/grocery/monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3001
  - Default credentials: `admin` / `admin`
  - Pre-configured dashboard: "Grocery App - Production Monitoring"

- **Prometheus**: http://localhost:9090
  - Query interface and targets status

- **Alertmanager**: http://localhost:9093
  - View and manage alerts

### 3. Stop Monitoring Stack

```bash
cd /home/adam/grocery/monitoring
docker-compose -f docker-compose.monitoring.yml down
```

To also remove volumes (data):

```bash
docker-compose -f docker-compose.monitoring.yml down -v
```

## Health Check Endpoints

The application now includes three health check endpoints:

### 1. Basic Health Check
- **Endpoint**: `GET /health`
- **Purpose**: Lightweight check for load balancers
- **Response**: Quick status without dependency checks
- **Status Codes**: `200` (always healthy if server is running)

```bash
curl http://localhost:3000/health
```

### 2. Liveness Probe
- **Endpoint**: `GET /health/live`
- **Purpose**: Kubernetes/Docker liveness check
- **Checks**: Process is alive, memory usage
- **Status Codes**: `200` (alive)

```bash
curl http://localhost:3000/health/live
```

### 3. Readiness Probe
- **Endpoint**: `GET /health/ready`
- **Purpose**: Check if app is ready to serve traffic
- **Checks**: Database connection, memory usage, connection pool
- **Status Codes**: `200` (ready), `503` (not ready)

```bash
curl http://localhost:3000/health/ready
```

## Docker Health Check

A Node.js health check script is provided at `/home/adam/grocery/healthcheck.js` for use with Docker.

### Add to Dockerfile

```dockerfile
# Copy health check script
COPY healthcheck.js /app/healthcheck.js
RUN chmod +x /app/healthcheck.js

# Configure health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node /app/healthcheck.js
```

### Environment Variables

- `HEALTH_ENDPOINT`: Health endpoint path (default: `/health/ready`)
- `HOST`: Server hostname (default: `localhost`)
- `PORT`: Server port (default: `3000`)
- `HEALTHCHECK_TIMEOUT`: Timeout in ms (default: `5000`)
- `DEBUG_HEALTHCHECK`: Enable debug logging (default: `false`)

### Test Health Check Script

```bash
node /home/adam/grocery/healthcheck.js
echo $?  # 0 = healthy, 1 = unhealthy
```

## Key Metrics to Monitor

### 1. API Response Times

**What to monitor:**
- p50, p90, p95, p99 response times
- Response time by endpoint
- Slow query detection

**Thresholds:**
- Warning: p95 > 500ms
- Critical: p95 > 1000ms

**Alert:** `SlowAPIResponse` in `alerts.yml`

### 2. Database Connection Pool Stats

**What to monitor:**
- Total connections
- Idle connections
- Waiting connections
- Active connections (total - idle)

**Thresholds:**
- Warning: waiting > 5 for 2 minutes
- Critical: waiting > 10 for 5 minutes

**Alert:** `DatabasePoolExhausted` in `alerts.yml`

**Note:** Requires custom metrics to be implemented in the application.

### 3. Zero-Cache Sync Status

**What to monitor:**
- Sync lag time (seconds behind)
- Connection failures
- Sync error rate
- Number of connected clients

**Thresholds:**
- Warning: lag > 30 seconds
- Critical: lag > 60 seconds

**Alerts:**
- `ZeroCacheSyncLag`
- `ZeroCacheConnectionFailures`

**Note:** Requires custom metrics to be implemented in the application.

### 4. Error Rates

**What to monitor:**
- 4xx error rate (client errors)
- 5xx error rate (server errors)
- Authentication failures
- Database errors

**Thresholds:**
- Warning: 5xx rate > 1%
- Critical: 5xx rate > 5%

**Alerts:**
- `HighAPIErrorRate`
- `HighAuthFailureRate`

**Note:** Requires custom metrics to be implemented in the application.

### 5. Memory and CPU Usage

**What to monitor:**
- Heap used vs. heap total
- RSS (Resident Set Size)
- CPU usage percentage
- Memory available

**Thresholds:**
- Warning: Memory > 80%, CPU > 70%
- Critical: Memory > 90%, CPU > 85%

**Alerts:**
- `HighMemoryUsage`
- `HighCPUUsage`

**Available now:** System-level metrics via Node Exporter.

### 6. System Resources

**What to monitor:**
- Disk space usage
- Network I/O
- File descriptors
- Load average

**Thresholds:**
- Warning: Disk > 80% full
- Critical: Disk > 90% full

**Alert:** `DiskSpaceLow` in `alerts.yml`

**Available now:** Via Node Exporter.

## Implementing Application Metrics

To get full observability, you need to add metrics collection to your Express application.

### 1. Install prom-client

```bash
pnpm add prom-client
```

### 2. Create Metrics Middleware

Create `/home/adam/grocery/server/middleware/metrics.ts`:

```typescript
import promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry
export const register = new promClient.Registry();

// Add default metrics (memory, CPU, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const databasePoolTotal = new promClient.Gauge({
  name: 'database_pool_total',
  help: 'Total database connections in pool',
  registers: [register],
});

export const databasePoolIdle = new promClient.Gauge({
  name: 'database_pool_idle',
  help: 'Idle database connections in pool',
  registers: [register],
});

export const databasePoolWaiting = new promClient.Gauge({
  name: 'database_pool_waiting_count',
  help: 'Connections waiting for database pool',
  registers: [register],
});

export const authLoginFailures = new promClient.Counter({
  name: 'auth_login_failures_total',
  help: 'Total number of authentication failures',
  registers: [register],
});

// Middleware to track request metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
}

// Function to update database pool metrics
export function updateDatabasePoolMetrics(stats: { total: number; idle: number; waiting: number }) {
  databasePoolTotal.set(stats.total);
  databasePoolIdle.set(stats.idle);
  databasePoolWaiting.set(stats.waiting);
}
```

### 3. Add Metrics Endpoint to Server

In `/home/adam/grocery/server/index.ts`, add:

```typescript
import { register, metricsMiddleware, updateDatabasePoolMetrics } from './middleware/metrics';

// Add metrics middleware (after logging middleware)
app.use(metricsMiddleware);

// Metrics endpoint for Prometheus
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Update database pool metrics before serving
    const poolStats = getPoolStats();
    updateDatabasePoolMetrics(poolStats);

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});
```

### 4. Track Authentication Failures

In your auth controller, increment the counter:

```typescript
import { authLoginFailures } from '../middleware/metrics';

// On login failure:
authLoginFailures.inc();
```

## Alert Configuration

### Configuring Alertmanager Notifications

Edit `/home/adam/grocery/monitoring/alertmanager.yml` to configure notification channels:

#### Slack Notifications

```yaml
receivers:
  - name: 'critical'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#critical-alerts'
        title: 'Critical Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

#### Email Notifications

```yaml
receivers:
  - name: 'critical'
    email_configs:
      - to: 'ops-team@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alertmanager@example.com'
        auth_password: 'password'
        headers:
          Subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
```

#### PagerDuty

```yaml
receivers:
  - name: 'critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
```

## Grafana Dashboard

The pre-configured dashboard includes:

1. **API Server Status**: Is the server up?
2. **Health Status**: Real-time health gauge
3. **System Memory Usage**: Total, available, and used memory
4. **CPU Usage**: System CPU utilization
5. **Disk Usage**: Root partition usage
6. **Database Connection Pool**: Connection pool statistics
7. **API Request Rate**: Requests per second by status code
8. **API Response Times**: Percentile distribution (p50, p90, p95, p99)
9. **Error Rate**: 5xx error percentage

### Customizing the Dashboard

1. Log into Grafana at http://localhost:3001
2. Navigate to the "Grocery App - Production Monitoring" dashboard
3. Click the settings icon (gear) in the top right
4. Edit panels, add new panels, or create new dashboards
5. Save your changes

### Creating Additional Dashboards

Grafana supports:
- Query builder for easy metric selection
- Multiple visualization types (graphs, gauges, tables, etc.)
- Variables for dynamic dashboards
- Annotations for marking deployments or incidents
- Panel alerts

## Production Deployment

### Kubernetes

#### Health Checks in Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grocery-api
spec:
  template:
    spec:
      containers:
      - name: grocery-api
        image: grocery-api:latest
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

#### Prometheus Service Monitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: grocery-api
spec:
  selector:
    matchLabels:
      app: grocery-api
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

### Docker Swarm

#### Stack file with health checks

```yaml
version: '3.8'
services:
  api:
    image: grocery-api:latest
    healthcheck:
      test: ["CMD", "node", "/app/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
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

### Load Balancer Configuration

Configure your load balancer to use:
- **Health Check Path**: `/health` (or `/health/ready` for more thorough checks)
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy Threshold**: 2 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures

## Troubleshooting

### Prometheus Can't Scrape Metrics

1. Check that your app is exposing `/metrics`:
   ```bash
   curl http://localhost:3000/metrics
   ```

2. Check Prometheus targets:
   - Open http://localhost:9090/targets
   - Look for "grocery-api" job
   - Status should be "UP"

3. If using Docker, ensure `host.docker.internal` resolves:
   ```bash
   docker exec grocery-prometheus ping host.docker.internal
   ```

### Grafana Dashboard Shows No Data

1. Check Prometheus datasource:
   - Go to Configuration → Data Sources
   - Test the Prometheus connection

2. Verify metrics exist in Prometheus:
   - Open http://localhost:9090
   - Run query: `up{job="grocery-api"}`

3. Check time range in Grafana (top right)

### Alerts Not Firing

1. Check alert rules in Prometheus:
   - Open http://localhost:9090/alerts
   - Verify rules are loaded

2. Check Alertmanager:
   - Open http://localhost:9093
   - Verify alerts are being received

3. Validate alert rule syntax:
   ```bash
   docker exec grocery-prometheus promtool check rules /etc/prometheus/alerts.yml
   ```

### High Memory Usage

1. Check for memory leaks in application
2. Increase container memory limits
3. Adjust Node.js heap size:
   ```bash
   NODE_OPTIONS="--max-old-space-size=2048"
   ```

## Security Considerations

1. **Authentication**: Add authentication to Grafana in production
2. **Metrics Endpoint**: Consider protecting `/metrics` endpoint
3. **Secrets**: Store Alertmanager credentials in environment variables or secrets
4. **Network**: Use internal networks for monitoring stack
5. **SSL/TLS**: Enable HTTPS for Grafana in production

## Next Steps

1. **Implement Application Metrics**: Add prom-client to collect custom metrics
2. **Configure Alerts**: Set up Slack/email notifications in Alertmanager
3. **Create More Dashboards**: Build dashboards for specific services
4. **Set Up Logs**: Consider adding Loki for log aggregation
5. **Distributed Tracing**: Add Jaeger or Tempo for request tracing
6. **Uptime Monitoring**: Consider external uptime monitoring (UptimeRobot, Pingdom)

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [prom-client (Node.js)](https://github.com/siimon/prom-client)
- [Express Metrics Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Docker Health Check Reference](https://docs.docker.com/engine/reference/builder/#healthcheck)

## Support

For issues or questions about the monitoring setup, please check:
1. Application logs: `docker logs grocery-api`
2. Prometheus logs: `docker logs grocery-prometheus`
3. Grafana logs: `docker logs grocery-grafana`
