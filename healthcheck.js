#!/usr/bin/env node

/**
 * Docker Health Check Script
 *
 * This script performs a health check on the Grocery API server
 * and exits with the appropriate code for Docker:
 * - Exit 0: Container is healthy
 * - Exit 1: Container is unhealthy
 *
 * Usage in Dockerfile:
 * HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
 *   CMD node /app/healthcheck.js
 */

const http = require('http');

// Configuration
const HEALTH_ENDPOINT = process.env.HEALTH_ENDPOINT || '/health/ready';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;
const TIMEOUT = parseInt(process.env.HEALTHCHECK_TIMEOUT || '5000', 10);

/**
 * Perform HTTP health check
 */
function performHealthCheck() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: HEALTH_ENDPOINT,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Docker-HealthCheck/1.0',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Consider 200-299 status codes as healthy
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const body = JSON.parse(data);

            // Log health status for debugging
            if (process.env.DEBUG_HEALTHCHECK === 'true') {
              console.log('[HealthCheck] Status:', res.statusCode);
              console.log('[HealthCheck] Response:', JSON.stringify(body, null, 2));
            }

            // Check if the response indicates the service is ready
            if (body.success === true || body.status === 'healthy' || body.status === 'ready' || body.status === 'alive') {
              resolve({
                healthy: true,
                statusCode: res.statusCode,
                message: body.status || 'healthy',
              });
            } else {
              resolve({
                healthy: false,
                statusCode: res.statusCode,
                message: 'Service reported unhealthy status',
                body,
              });
            }
          } catch (error) {
            // If we can't parse JSON but got 200, consider it healthy
            resolve({
              healthy: true,
              statusCode: res.statusCode,
              message: 'Service responded with 200 (non-JSON)',
            });
          }
        } else {
          // Status code indicates unhealthy
          resolve({
            healthy: false,
            statusCode: res.statusCode,
            message: `Unhealthy status code: ${res.statusCode}`,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        healthy: false,
        error: error.message,
        message: 'Failed to connect to health endpoint',
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        healthy: false,
        error: 'timeout',
        message: `Health check timed out after ${TIMEOUT}ms`,
      });
    });

    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await performHealthCheck();

    if (result.healthy) {
      // Log success (optional, only if debug enabled)
      if (process.env.DEBUG_HEALTHCHECK === 'true') {
        console.log(`[HealthCheck] SUCCESS: ${result.message}`);
      }
      process.exit(0); // Healthy
    } else {
      // Log failure
      console.error(`[HealthCheck] FAILED: ${result.message}`);
      if (result.body) {
        console.error('[HealthCheck] Response:', JSON.stringify(result.body, null, 2));
      }
      process.exit(1); // Unhealthy
    }
  } catch (error) {
    // Log error
    console.error(`[HealthCheck] ERROR: ${error.message}`);
    if (error.error) {
      console.error(`[HealthCheck] Details: ${error.error}`);
    }
    process.exit(1); // Unhealthy
  }
}

// Run the health check
main();
