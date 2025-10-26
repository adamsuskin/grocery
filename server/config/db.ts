/**
 * Database configuration and connection pool setup
 * Provides PostgreSQL connection pool with proper error handling and monitoring
 */

import { Pool, PoolClient, QueryResult, PoolConfig } from 'pg';
import { dbConfig } from './env';

/**
 * PostgreSQL connection pool configuration
 */
const poolConfig: PoolConfig = {
  user: dbConfig.user,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  max: dbConfig.maxConnections,
  idleTimeoutMillis: dbConfig.idleTimeout,
  connectionTimeoutMillis: dbConfig.connectionTimeout,
  // Additional pool settings
  allowExitOnIdle: false,
  // Enable SSL in production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
};

/**
 * Global PostgreSQL connection pool instance
 */
export const pool = new Pool(poolConfig);

/**
 * Connection pool event handlers
 */
pool.on('connect', (client: PoolClient) => {
  console.log('New client connected to PostgreSQL database');
});

pool.on('acquire', (client: PoolClient) => {
  if (process.env.DEBUG_DB === 'true') {
    console.log('Client acquired from pool');
  }
});

pool.on('remove', (client: PoolClient) => {
  console.log('Client removed from pool');
});

pool.on('error', (err: Error, client: PoolClient) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  // Don't exit the process, let the application handle it
});

/**
 * Test database connection
 * @throws Error if connection fails
 */
export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW(), version() as db_version');
      console.log('Database connection successful');
      console.log(`PostgreSQL version: ${result.rows[0].db_version.split(',')[0]}`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

/**
 * Query helper function with error handling
 * @param text SQL query string
 * @param params Query parameters
 * @returns Promise with query result rows
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.DEBUG_DB === 'true') {
      console.log('Executed query', {
        text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', {
      text,
      params,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get a single row from query result
 * @param text SQL query string
 * @param params Query parameters
 * @returns Promise with single row or null
 */
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Transaction helper function
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 * @param callback Function to execute within transaction
 * @returns Promise with callback result
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back due to error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if database is healthy
 * @returns Promise with boolean health status
 */
export async function isHealthy(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database statistics
 * @returns Promise with pool statistics
 */
export function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

/**
 * Gracefully close database connection pool
 */
export async function closePool(): Promise<void> {
  try {
    console.log('Closing database connection pool...');
    await pool.end();
    console.log('Database connection pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
    throw error;
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, closing database connections...`);
    try {
      await closePool();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
}

// Setup shutdown handlers when module is loaded
setupShutdownHandlers();

export default pool;
