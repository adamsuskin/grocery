/**
 * Database Migration Runner
 *
 * This script runs database migrations for the grocery list application.
 * It supports both forward migrations (up) and rollbacks (down).
 *
 * Usage:
 *   npm run migrate up              - Run all pending migrations
 *   npm run migrate down            - Rollback the last migration
 *   npm run migrate up 001          - Run specific migration
 *   npm run migrate down 001        - Rollback specific migration
 *   npm run migrate status          - Show migration status
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'grocery',
  password: process.env.DB_PASSWORD || 'grocery',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'grocery_db',
});

// Migration tracking table
const MIGRATIONS_TABLE = 'schema_migrations';

/**
 * Migration metadata
 */
interface Migration {
  id: string;
  name: string;
  upPath: string;
  downPath: string;
}

/**
 * Migration record in database
 */
interface MigrationRecord {
  id: string;
  name: string;
  applied_at: Date;
}

/**
 * Initialize migrations tracking table
 */
async function initializeMigrationsTable(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_migrations_applied_at
    ON ${MIGRATIONS_TABLE}(applied_at DESC);
  `;

  try {
    await pool.query(query);
    console.log('✓ Migrations tracking table ready');
  } catch (error) {
    console.error('✗ Failed to initialize migrations table:', error);
    throw error;
  }
}

/**
 * Get all available migrations from the filesystem
 */
function getAvailableMigrations(): Migration[] {
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir);

  const migrations: Migration[] = [];

  // Find all migration files (format: NNN_name.sql)
  const upFiles = files.filter(f =>
    f.match(/^\d{3}_.*\.sql$/) && !f.includes('rollback')
  );

  for (const upFile of upFiles) {
    const match = upFile.match(/^(\d{3})_(.*)\.sql$/);
    if (match) {
      const [, id, name] = match;
      const downFile = `${id}_${name}_rollback.sql`;

      migrations.push({
        id,
        name,
        upPath: path.join(migrationsDir, upFile),
        downPath: path.join(migrationsDir, downFile),
      });
    }
  }

  return migrations.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Get applied migrations from database
 */
async function getAppliedMigrations(): Promise<MigrationRecord[]> {
  try {
    const result = await pool.query<MigrationRecord>(
      `SELECT id, name, applied_at FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`
    );
    return result.rows;
  } catch (error) {
    console.error('✗ Failed to get applied migrations:', error);
    throw error;
  }
}

/**
 * Check if migration has been applied
 */
async function isMigrationApplied(migrationId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT COUNT(*) FROM ${MIGRATIONS_TABLE} WHERE id = $1`,
    [migrationId]
  );
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Run a migration file
 */
async function runMigrationFile(filePath: string): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf-8');

  try {
    await pool.query(sql);
  } catch (error) {
    console.error(`✗ Failed to execute migration file: ${filePath}`);
    throw error;
  }
}

/**
 * Record migration as applied
 */
async function recordMigration(migration: Migration): Promise<void> {
  await pool.query(
    `INSERT INTO ${MIGRATIONS_TABLE} (id, name, applied_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
    [migration.id, migration.name]
  );
}

/**
 * Remove migration record
 */
async function removeMigrationRecord(migrationId: string): Promise<void> {
  await pool.query(
    `DELETE FROM ${MIGRATIONS_TABLE} WHERE id = $1`,
    [migrationId]
  );
}

/**
 * Run pending migrations (up)
 */
async function migrateUp(specificMigration?: string): Promise<void> {
  console.log('\n🚀 Running migrations...\n');

  const availableMigrations = getAvailableMigrations();
  const appliedMigrations = await getAppliedMigrations();
  const appliedIds = new Set(appliedMigrations.map(m => m.id));

  let migrationsToRun = availableMigrations.filter(m => !appliedIds.has(m.id));

  if (specificMigration) {
    migrationsToRun = migrationsToRun.filter(m => m.id === specificMigration);
    if (migrationsToRun.length === 0) {
      console.log(`⚠ Migration ${specificMigration} not found or already applied`);
      return;
    }
  }

  if (migrationsToRun.length === 0) {
    console.log('✓ No pending migrations');
    return;
  }

  for (const migration of migrationsToRun) {
    console.log(`⏳ Applying migration ${migration.id}: ${migration.name}...`);

    try {
      // Run the migration in a transaction
      await pool.query('BEGIN');
      await runMigrationFile(migration.upPath);
      await recordMigration(migration);
      await pool.query('COMMIT');

      console.log(`✓ Migration ${migration.id} applied successfully\n`);
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`✗ Migration ${migration.id} failed:`, error);
      throw error;
    }
  }

  console.log('✓ All migrations completed successfully\n');
}

/**
 * Rollback migrations (down)
 */
async function migrateDown(specificMigration?: string): Promise<void> {
  console.log('\n⏪ Rolling back migrations...\n');

  const availableMigrations = getAvailableMigrations();
  const appliedMigrations = await getAppliedMigrations();

  if (appliedMigrations.length === 0) {
    console.log('⚠ No migrations to rollback');
    return;
  }

  let migrationToRollback: Migration | undefined;

  if (specificMigration) {
    // Rollback specific migration
    migrationToRollback = availableMigrations.find(m => m.id === specificMigration);

    if (!migrationToRollback) {
      console.log(`⚠ Migration ${specificMigration} not found`);
      return;
    }

    const isApplied = await isMigrationApplied(specificMigration);
    if (!isApplied) {
      console.log(`⚠ Migration ${specificMigration} has not been applied`);
      return;
    }
  } else {
    // Rollback last migration
    const lastApplied = appliedMigrations[appliedMigrations.length - 1];
    migrationToRollback = availableMigrations.find(m => m.id === lastApplied.id);
  }

  if (!migrationToRollback) {
    console.log('⚠ No migration to rollback');
    return;
  }

  // Check if rollback file exists
  if (!fs.existsSync(migrationToRollback.downPath)) {
    console.error(`✗ Rollback file not found: ${migrationToRollback.downPath}`);
    throw new Error('Rollback file missing');
  }

  console.log(`⏳ Rolling back migration ${migrationToRollback.id}: ${migrationToRollback.name}...`);
  console.warn('⚠  WARNING: This will delete data! Press Ctrl+C to abort...');

  // Give user 3 seconds to abort
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Run the rollback in a transaction
    await pool.query('BEGIN');
    await runMigrationFile(migrationToRollback.downPath);
    await removeMigrationRecord(migrationToRollback.id);
    await pool.query('COMMIT');

    console.log(`✓ Migration ${migrationToRollback.id} rolled back successfully\n`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`✗ Rollback of migration ${migrationToRollback.id} failed:`, error);
    throw error;
  }

  console.log('✓ Rollback completed\n');
}

/**
 * Show migration status
 */
async function showStatus(): Promise<void> {
  console.log('\n📊 Migration Status\n');

  const availableMigrations = getAvailableMigrations();
  const appliedMigrations = await getAppliedMigrations();
  const appliedIds = new Set(appliedMigrations.map(m => m.id));

  console.log('Available migrations:');
  console.log('=====================\n');

  for (const migration of availableMigrations) {
    const isApplied = appliedIds.has(migration.id);
    const status = isApplied ? '✓ Applied' : '○ Pending';
    const appliedDate = isApplied
      ? appliedMigrations.find(m => m.id === migration.id)?.applied_at
      : null;

    console.log(`${status} ${migration.id}: ${migration.name}`);
    if (appliedDate) {
      console.log(`        Applied at: ${appliedDate.toISOString()}`);
    }
  }

  const pendingCount = availableMigrations.length - appliedIds.size;
  console.log(`\nTotal: ${availableMigrations.length} migrations`);
  console.log(`Applied: ${appliedIds.size}`);
  console.log(`Pending: ${pendingCount}\n`);
}

/**
 * Main CLI function
 */
async function main() {
  const [,, command, migrationId] = process.argv;

  console.log('🗄️  Database Migration Tool\n');
  console.log(`Database: ${process.env.DB_NAME || 'grocery_db'}`);
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}\n`);

  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection established\n');

    // Initialize migrations table
    await initializeMigrationsTable();

    // Execute command
    switch (command) {
      case 'up':
        await migrateUp(migrationId);
        break;

      case 'down':
        await migrateDown(migrationId);
        break;

      case 'status':
        await showStatus();
        break;

      default:
        console.log('Usage:');
        console.log('  npm run migrate up [migration_id]    - Run migrations');
        console.log('  npm run migrate down [migration_id]  - Rollback migration');
        console.log('  npm run migrate status               - Show status');
        console.log('\nExamples:');
        console.log('  npm run migrate up                   - Run all pending');
        console.log('  npm run migrate up 001               - Run specific migration');
        console.log('  npm run migrate down                 - Rollback last');
        console.log('  npm run migrate down 001             - Rollback specific');
        process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('✓ Database connection closed');
  }
}

// Run the CLI
main().catch(console.error);
