/**
 * Environment configuration module
 * Centralizes all environment variable access with validation and defaults
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Server configuration
 */
export const serverConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

/**
 * Database configuration
 */
export const dbConfig = {
  user: process.env.DB_USER || 'grocery',
  password: process.env.DB_PASSWORD || 'grocery',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'grocery_db',
  // Connection pool settings
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
} as const;

/**
 * JWT configuration
 */
export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
} as const;

/**
 * Security configuration
 */
export const securityConfig = {
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
} as const;

/**
 * Zero/Replicache configuration
 */
export const zeroConfig = {
  server: process.env.VITE_ZERO_SERVER || 'http://localhost:4848',
  upstreamDb: process.env.ZERO_UPSTREAM_DB || 'postgresql://user:password@localhost:5432/grocery_db',
  replicaFile: process.env.ZERO_REPLICA_FILE || '/tmp/zero-replica.db',
  authSecret: process.env.ZERO_AUTH_SECRET || 'dev-secret-key',
} as const;

/**
 * Validate required environment variables
 * Throws an error if critical variables are missing in production
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // Critical checks for production
  if (serverConfig.isProduction) {
    if (jwtConfig.accessTokenSecret.includes('dev-')) {
      errors.push('JWT_ACCESS_SECRET must be set to a secure value in production');
    }
    if (jwtConfig.refreshTokenSecret.includes('dev-')) {
      errors.push('JWT_REFRESH_SECRET must be set to a secure value in production');
    }
    if (zeroConfig.authSecret === 'dev-secret-key') {
      errors.push('ZERO_AUTH_SECRET must be set to a secure value in production');
    }
    if (dbConfig.password === 'grocery') {
      errors.push('DB_PASSWORD should be set to a secure value in production');
    }
  }

  // General validation
  if (isNaN(serverConfig.port) || serverConfig.port < 1 || serverConfig.port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535');
  }

  if (isNaN(dbConfig.port) || dbConfig.port < 1 || dbConfig.port > 65535) {
    errors.push('DB_PORT must be a valid port number between 1 and 65535');
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error('Environment validation failed. Check the errors above.');
  }
}

/**
 * Get all configuration as a single object
 */
export const appConfig = {
  server: serverConfig,
  db: dbConfig,
  jwt: jwtConfig,
  security: securityConfig,
  zero: zeroConfig,
} as const;

export default appConfig;
