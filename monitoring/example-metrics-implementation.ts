/**
 * Example Metrics Implementation for Grocery App
 *
 * This file shows how to add Prometheus metrics to your Express application.
 * Copy this code into your application after installing prom-client.
 *
 * Installation:
 * pnpm add prom-client
 */

import promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { getPoolStats } from '../server/config/db';

// ============================================================================
// 1. Create a Registry
// ============================================================================

export const register = new promClient.Registry();

// Add default Node.js metrics (memory, CPU, event loop lag, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
});

// ============================================================================
// 2. Define Custom Metrics
// ============================================================================

// HTTP Request Duration (Histogram)
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // Response time buckets in seconds
  registers: [register],
});

// HTTP Request Counter
export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Database Connection Pool Metrics
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

export const databasePoolActive = new promClient.Gauge({
  name: 'database_pool_active',
  help: 'Active database connections',
  registers: [register],
});

// Database Query Duration
export const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'success'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register],
});

// Authentication Metrics
export const authLoginAttempts = new promClient.Counter({
  name: 'auth_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['success'],
  registers: [register],
});

export const authLoginFailures = new promClient.Counter({
  name: 'auth_login_failures_total',
  help: 'Total number of authentication failures',
  labelNames: ['reason'],
  registers: [register],
});

export const authActiveUsers = new promClient.Gauge({
  name: 'auth_active_users',
  help: 'Number of currently authenticated users',
  registers: [register],
});

// Business Metrics
export const listsTotal = new promClient.Gauge({
  name: 'lists_total',
  help: 'Total number of grocery lists',
  registers: [register],
});

export const listItemsTotal = new promClient.Gauge({
  name: 'list_items_total',
  help: 'Total number of items across all lists',
  registers: [register],
});

export const listSharesTotal = new promClient.Counter({
  name: 'list_shares_total',
  help: 'Total number of list shares',
  registers: [register],
});

// Zero-Cache Sync Metrics (if applicable)
export const zeroCacheSyncLag = new promClient.Gauge({
  name: 'zero_cache_sync_lag_seconds',
  help: 'Zero-cache replication lag in seconds',
  registers: [register],
});

export const zeroCacheConnectionFailures = new promClient.Counter({
  name: 'zero_cache_connection_failures_total',
  help: 'Total number of Zero-cache connection failures',
  registers: [register],
});

// ============================================================================
// 3. Middleware for Automatic Request Tracking
// ============================================================================

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip metrics for the /metrics endpoint itself
  if (req.path === '/metrics') {
    return next();
  }

  const start = Date.now();

  // Capture the original res.end function
  const originalEnd = res.end;

  // Override res.end to capture metrics when response is sent
  res.end = function(this: Response, ...args: any[]) {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    const method = req.method;
    const status = res.statusCode.toString();

    // Record metrics
    httpRequestDuration.labels(method, route, status).observe(duration);
    httpRequestTotal.labels(method, route, status).inc();

    // Call the original end function
    return originalEnd.apply(this, args);
  };

  next();
}

// ============================================================================
// 4. Helper Functions
// ============================================================================

/**
 * Update database pool metrics
 * Call this function periodically or before serving metrics
 */
export function updateDatabasePoolMetrics() {
  const stats = getPoolStats();
  databasePoolTotal.set(stats.total);
  databasePoolIdle.set(stats.idle);
  databasePoolWaiting.set(stats.waiting);
  databasePoolActive.set(stats.total - stats.idle);
}

/**
 * Track database query execution
 * Wrap your database queries with this function
 */
export async function trackDatabaseQuery<T>(
  operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  let success = 'true';

  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    success = 'false';
    throw error;
  } finally {
    const duration = (Date.now() - start) / 1000;
    databaseQueryDuration.labels(operation, success).observe(duration);
  }
}

/**
 * Track authentication attempt
 */
export function trackAuthAttempt(success: boolean, reason?: string) {
  authLoginAttempts.labels(success.toString()).inc();

  if (!success && reason) {
    authLoginFailures.labels(reason).inc();
  }
}

/**
 * Update business metrics
 * Call this periodically (e.g., every 5 minutes)
 */
export async function updateBusinessMetrics() {
  // You would implement these queries based on your database
  // Example:
  // const listCount = await query('SELECT COUNT(*) FROM lists');
  // listsTotal.set(listCount[0].count);

  // const itemCount = await query('SELECT COUNT(*) FROM items');
  // listItemsTotal.set(itemCount[0].count);
}

// ============================================================================
// 5. Integration with Express App
// ============================================================================

/**
 * Example integration in server/index.ts:
 *
 * import { register, metricsMiddleware, updateDatabasePoolMetrics } from './middleware/metrics';
 *
 * // Add metrics middleware after logging, before routes
 * app.use(metricsMiddleware);
 *
 * // Add /metrics endpoint
 * app.get('/metrics', async (req: Request, res: Response) => {
 *   try {
 *     // Update database pool metrics before serving
 *     updateDatabasePoolMetrics();
 *
 *     res.set('Content-Type', register.contentType);
 *     res.end(await register.metrics());
 *   } catch (error) {
 *     res.status(500).end(error);
 *   }
 * });
 */

// ============================================================================
// 6. Usage in Auth Controller
// ============================================================================

/**
 * Example in auth/controller.ts:
 *
 * import { trackAuthAttempt } from '../middleware/metrics';
 *
 * export async function login(req: Request, res: Response) {
 *   const { email, password } = req.body;
 *
 *   try {
 *     const user = await findUserByEmail(email);
 *
 *     if (!user) {
 *       trackAuthAttempt(false, 'user_not_found');
 *       return res.status(401).json({ error: 'Invalid credentials' });
 *     }
 *
 *     const validPassword = await bcrypt.compare(password, user.password_hash);
 *
 *     if (!validPassword) {
 *       trackAuthAttempt(false, 'invalid_password');
 *       return res.status(401).json({ error: 'Invalid credentials' });
 *     }
 *
 *     trackAuthAttempt(true);
 *
 *     // Generate token and return...
 *   } catch (error) {
 *     trackAuthAttempt(false, 'server_error');
 *     throw error;
 *   }
 * }
 */

// ============================================================================
// 7. Usage in Database Layer
// ============================================================================

/**
 * Example in config/db.ts:
 *
 * import { trackDatabaseQuery } from '../middleware/metrics';
 *
 * export async function query<T = any>(
 *   text: string,
 *   params?: any[]
 * ): Promise<T[]> {
 *   return trackDatabaseQuery('query', async () => {
 *     const result = await pool.query(text, params);
 *     return result.rows as T[];
 *   });
 * }
 */

// ============================================================================
// 8. Periodic Metrics Update (Optional)
// ============================================================================

/**
 * Set up periodic metrics updates for business metrics
 * Add this to your server startup:
 *
 * // Update business metrics every 5 minutes
 * setInterval(async () => {
 *   try {
 *     await updateBusinessMetrics();
 *   } catch (error) {
 *     console.error('Failed to update business metrics:', error);
 *   }
 * }, 5 * 60 * 1000);
 */

// ============================================================================
// 9. Testing Metrics
// ============================================================================

/**
 * Test your metrics endpoint:
 *
 * curl http://localhost:3000/metrics
 *
 * You should see output like:
 *
 * # HELP http_request_duration_seconds Duration of HTTP requests in seconds
 * # TYPE http_request_duration_seconds histogram
 * http_request_duration_seconds_bucket{le="0.1",method="GET",route="/health",status="200"} 42
 * http_request_duration_seconds_bucket{le="0.3",method="GET",route="/health",status="200"} 45
 * http_request_duration_seconds_sum{method="GET",route="/health",status="200"} 3.245
 * http_request_duration_seconds_count{method="GET",route="/health",status="200"} 45
 *
 * # HELP database_pool_total Total database connections in pool
 * # TYPE database_pool_total gauge
 * database_pool_total 20
 *
 * # HELP database_pool_idle Idle database connections in pool
 * # TYPE database_pool_idle gauge
 * database_pool_idle 18
 */

export default register;
