import { Pool, PoolConfig } from 'pg';

/**
 * PostgreSQL connection pool configuration
 */
const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'grocery',
  password: process.env.DB_PASSWORD || 'grocery',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'grocery_db',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

/**
 * Global PostgreSQL connection pool instance
 */
export const pool = new Pool(poolConfig);

/**
 * Test database connection
 */
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  await pool.end();
  console.log('PostgreSQL pool has ended');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  console.log('PostgreSQL pool has ended');
  process.exit(0);
});

/**
 * Query helper function
 */
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Transaction helper function
 */
export async function transaction<T>(
  callback: (client: Pool['connect'] extends (...args: unknown[]) => Promise<infer C> ? C : never) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
