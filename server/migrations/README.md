# Database Migrations

This directory contains SQL migration scripts for the grocery list application database.

## Overview

The migration system provides a safe and reversible way to modify the database schema. Each migration consists of:
- **UP migration** - Applies changes to the database
- **DOWN migration (rollback)** - Reverts the changes

## Migration Files

### Current Migrations

1. **001_add_authentication.sql** - Adds authentication support
   - Creates `users` table with email/password authentication
   - Creates `refresh_tokens` table for JWT token management
   - Adds `user_id` column to `grocery_items` table
   - Creates default admin user
   - Assigns existing items to admin user
   - Adds all necessary indexes and constraints
   - **Rollback:** `001_add_authentication_rollback.sql`

2. **002_add_lists.sql** - Adds list functionality (DEPRECATED - use 004)
   - Creates `lists` and `list_members` tables
   - Adds `list_id` column to `grocery_items`
   - Creates default lists for users
   - Note: Superseded by migration 003 and 004

3. **003_add_list_sharing.sql** - Enhanced list sharing (DEPRECATED - use 004)
   - Enhanced lists with permission levels
   - Advanced list sharing features
   - **Rollback:** `rollback/003_remove_list_sharing.sql`
   - Note: Superseded by migration 004

4. **004_migrate_to_lists.sql** - Migrate to list-based model (RECOMMENDED)
   - Creates `lists` table for organizing grocery items
   - Creates `list_members` table for access control
   - Creates default "My Grocery List" for each existing user
   - Adds each user as owner (admin) of their default list
   - Migrates all existing items from user-based to list-based
   - Sets `list_id` as required on `grocery_items`
   - Creates helper functions for list access
   - **Rollback:** `rollback/004_revert_list_migration.sql`
   - **Idempotent:** Can be run multiple times safely

## Prerequisites

Before running migrations:

1. **Ensure PostgreSQL is running**
   ```bash
   # Using Docker Compose (recommended)
   docker compose up -d postgres

   # Or check if PostgreSQL is running locally
   pg_isready -h localhost -p 5432
   ```

2. **Configure database connection**
   - Create or update `server/.env` file with database credentials
   - See `server/.env.example` for required variables

3. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

## Running Migrations

### Using NPM Scripts (Recommended)

```bash
cd server

# Show current migration status
npm run migrate:status

# Run all pending migrations
npm run migrate:up

# Rollback the last migration
npm run migrate:down

# Run a specific migration
npm run migrate up 001

# Rollback a specific migration
npm run migrate down 001
```

### Using the Migration Tool Directly

```bash
cd server

# Show help
npx ts-node --esm migrations/migrate.ts

# Run all pending migrations
npx ts-node --esm migrations/migrate.ts up

# Run specific migration
npx ts-node --esm migrations/migrate.ts up 001

# Rollback last migration
npx ts-node --esm migrations/migrate.ts down

# Rollback specific migration
npx ts-node --esm migrations/migrate.ts down 001

# Show migration status
npx ts-node --esm migrations/migrate.ts status
```

### Using psql Directly

If you prefer to run migrations manually with psql:

```bash
# Run up migration
psql -h localhost -p 5432 -U grocery -d grocery_db \
  -f server/migrations/001_add_authentication.sql

# Run rollback migration
psql -h localhost -p 5432 -U grocery -d grocery_db \
  -f server/migrations/001_add_authentication_rollback.sql
```

## Migration Tool Features

### Automatic Transaction Management
- Each migration runs in a transaction
- Automatic rollback on error
- Ensures database consistency

### Migration Tracking
- Creates `schema_migrations` table to track applied migrations
- Prevents duplicate migrations
- Shows clear status of all migrations

### Safety Features
- Checks database connection before running
- Validates migration files exist
- Provides warnings before destructive operations
- 3-second delay before rollbacks (press Ctrl+C to abort)

### Detailed Output
- Clear progress indicators
- Success/failure messages
- Statistics on affected data
- Helpful warnings and notices

## Migration 001: Adding Authentication

### What This Migration Does

**Creates:**
- `users` table with authentication fields
  - UUID primary key
  - Email (unique, validated, lowercase)
  - Password hash (bcrypt)
  - Name, timestamps, activity status
- `refresh_tokens` table
  - For JWT token management
  - Automatic expiration and revocation support
- Default admin user
  - Email: `admin@grocery.local`
  - Password: `admin123`
  - **⚠️ CHANGE THIS PASSWORD IMMEDIATELY!**

**Modifies:**
- Adds `user_id` column to `grocery_items`
- Assigns all existing items to default admin user
- Adds foreign key constraint and indexes

**Safety Features:**
- Preserves all existing grocery items
- Uses idempotent operations (IF NOT EXISTS)
- Runs in transaction for consistency
- Provides detailed statistics after completion

### Before Running

1. **Backup your database!**
   ```bash
   pg_dump -h localhost -p 5432 -U grocery grocery_db > backup_before_auth.sql
   ```

2. **Review the migration**
   ```bash
   cat server/migrations/001_add_authentication.sql
   ```

3. **Check current data**
   ```bash
   psql -h localhost -p 5432 -U grocery -d grocery_db -c "SELECT COUNT(*) FROM grocery_items;"
   ```

### Running the Migration

```bash
cd server

# Check status
npm run migrate:status

# Run migration
npm run migrate:up

# Verify results
npm run migrate:status
psql -h localhost -p 5432 -U grocery -d grocery_db -c "SELECT * FROM users;"
```

### After Migration

1. **Change default admin password immediately!**
   - Use the authentication API endpoint: `POST /api/auth/change-password`
   - Or update directly in database (with bcrypt hash)

2. **Test authentication**
   - Login with admin credentials
   - Verify grocery items are accessible
   - Create a new user and test permissions

3. **Verify data integrity**
   ```bash
   psql -h localhost -p 5432 -U grocery -d grocery_db <<EOF
   SELECT COUNT(*) as total_items FROM grocery_items;
   SELECT COUNT(*) as items_with_user FROM grocery_items WHERE user_id IS NOT NULL;
   SELECT email, COUNT(gi.id) as item_count
   FROM users u
   LEFT JOIN grocery_items gi ON gi.user_id = u.id
   GROUP BY u.email;
   EOF
   ```

### Rolling Back

If you need to remove authentication:

```bash
cd server

# ⚠️ WARNING: This will delete all user data!
# Backup first!
pg_dump -h localhost -p 5432 -U grocery grocery_db > backup_before_rollback.sql

# Rollback migration
npm run migrate:down

# The rollback will:
# - Remove user_id from grocery_items (preserving items)
# - Drop users and refresh_tokens tables
# - Remove all authentication-related objects
```

## Migration 004: Migrating to List-Based Model

### What This Migration Does

**Creates:**
- `lists` table for organizing grocery items into named lists
  - UUID primary key
  - Name, owner_id, timestamps
  - Foreign key to users table
- `list_members` table for access control
  - Composite primary key (list_id, user_id)
  - Permission levels: admin, edit, view
  - Tracks when users join lists
- Default "My Grocery List" for each existing user
- Helper functions for list access control

**Modifies:**
- Adds `list_id` column to `grocery_items` (nullable during migration)
- Migrates all existing items to user's default list
- Sets `list_id` as NOT NULL after migration completes
- Creates indexes for efficient querying

**Safety Features:**
- Fully idempotent (can be run multiple times safely)
- Preserves all existing grocery items
- Maintains user associations
- Comprehensive verification checks
- Detailed migration statistics and logging

### Before Running Migration 004

1. **Backup your database!**
   ```bash
   pg_dump -h localhost -p 5432 -U grocery grocery_db > backup_before_lists_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verify prerequisites**
   ```bash
   # Check that users table exists
   psql -h localhost -p 5432 -U grocery -d grocery_db -c "\d users"

   # Check that grocery_items has user_id
   psql -h localhost -p 5432 -U grocery -d grocery_db -c "\d grocery_items"

   # Count existing users and items
   psql -h localhost -p 5432 -U grocery -d grocery_db <<EOF
   SELECT COUNT(*) as user_count FROM users;
   SELECT COUNT(*) as item_count FROM grocery_items;
   EOF
   ```

3. **Review the migration**
   ```bash
   cat server/migrations/004_migrate_to_lists.sql
   ```

### Running Migration 004

```bash
cd server

# Check current status
npm run migrate:status

# Run migration 004
npm run migrate:up

# Or run directly with psql
psql -h localhost -p 5432 -U grocery -d grocery_db \
  -f server/migrations/004_migrate_to_lists.sql
```

### What Happens During Migration

The migration executes these steps in order:

1. **Creates lists table** - Stores named lists like "My Grocery List", "Weekly Shopping", etc.
2. **Creates list_members table** - Manages who has access to which lists
3. **Adds list_id column** - Adds nullable list_id to grocery_items
4. **Migrates data** - For each user:
   - Creates a "My Grocery List" default list
   - Adds user as admin member of the list
   - Updates all their items to reference the new list
5. **Verifies migration** - Checks that all items have a list_id
6. **Sets NOT NULL** - Makes list_id required on grocery_items
7. **Creates helpers** - Adds functions for list access control
8. **Reports statistics** - Shows migration summary

### After Migration

1. **Verify the migration**
   ```bash
   psql -h localhost -p 5432 -U grocery -d grocery_db <<EOF
   -- Check lists were created
   SELECT u.email, l.name, lm.permission, COUNT(gi.id) as item_count
   FROM users u
   JOIN lists l ON l.owner_id = u.id
   JOIN list_members lm ON lm.list_id = l.id AND lm.user_id = u.id
   LEFT JOIN grocery_items gi ON gi.list_id = l.id
   GROUP BY u.email, l.name, lm.permission
   ORDER BY u.email;

   -- Verify no orphaned items
   SELECT COUNT(*) as orphaned_items
   FROM grocery_items
   WHERE list_id IS NULL;
   EOF
   ```

2. **Test list access functions**
   ```sql
   -- Get all lists for a user
   SELECT * FROM get_user_lists('user-uuid-here');

   -- Check if user has access to a list
   SELECT user_has_list_access('user-uuid', 'list-uuid');

   -- Get user's permission level for a list
   SELECT get_user_list_permission('user-uuid', 'list-uuid');
   ```

3. **Update application code**
   - Modify queries to use list_id instead of just user_id
   - Implement list selection UI
   - Add list sharing functionality
   - Update item creation to require list_id

### Rolling Back Migration 004

If you need to revert to user-based items:

```bash
cd server

# ⚠️ WARNING: This will DELETE all lists and memberships!
# Items will be preserved but list associations will be lost
# Backup first!
pg_dump -h localhost -p 5432 -U grocery grocery_db > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# Rollback migration
npm run migrate:down

# Or run rollback directly
psql -h localhost -p 5432 -U grocery -d grocery_db \
  -f server/migrations/rollback/004_revert_list_migration.sql
```

**The rollback will:**
- Remove list_id column from grocery_items (items preserved)
- Delete all lists and list_members (list data lost)
- Drop helper functions
- Remove list-related indexes
- Items remain accessible via user_id

**Data Preserved:**
- All grocery items
- User associations (user_id column)
- All other item data (name, quantity, category, etc.)

**Data Deleted:**
- All lists
- All list memberships
- List sharing history

### Helper Functions Created

**`user_has_list_access(user_id UUID, list_id UUID)`**
- Returns: BOOLEAN
- Checks if a user has any level of access to a list
- Use for authorization checks

**`get_user_list_permission(user_id UUID, list_id UUID)`**
- Returns: VARCHAR(20) - 'admin', 'edit', 'view', or 'none'
- Gets the user's permission level for a specific list
- Use for authorization and UI display

**`get_user_lists(user_id UUID)`**
- Returns: TABLE with list details and item counts
- Gets all lists accessible by a user
- Includes owner info, permissions, and statistics
- Use for displaying user's lists

### Migration Statistics

The migration provides detailed statistics:
- Number of users processed
- Number of lists created
- Number of items migrated
- Verification of orphaned items (should be 0)
- Final database state

### Troubleshooting Migration 004

**Error: "orphaned items detected"**
- Some items don't have a user_id
- Solution: Assign user_id to orphaned items before running migration

**Error: "Cannot proceed: Cannot rollback"**
- Constraint violations during rollback
- Solution: Check for foreign key dependencies, restore from backup

**Items not appearing in lists**
- Check that list_id foreign key is correct
- Verify list_members entries exist
- Use helper functions to debug access

**Performance issues after migration**
- Ensure indexes were created (check with `\d grocery_items`)
- Run ANALYZE to update query planner statistics
- Consider adding additional indexes based on query patterns

## Creating New Migrations

### Naming Convention

Migrations use sequential numbering:
- `001_description.sql` - Up migration
- `001_description_rollback.sql` - Down migration

### Migration Template

```sql
-- =====================================================
-- Migration: NNN_descriptive_name
-- Description: What this migration does
-- Created: YYYY-MM-DD
-- Author: Your Name
-- =====================================================

-- =====================================================
-- UP MIGRATION
-- =====================================================

-- Your changes here
-- Use IF NOT EXISTS for idempotent operations
-- Add comments explaining complex operations

CREATE TABLE IF NOT EXISTS example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL
);

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
END $$;
```

### Best Practices

1. **Always create both up and down migrations**
   - Down migration should fully reverse the up migration
   - Test both directions before committing

2. **Use transactions**
   - The migration tool handles this automatically
   - Manual runs should use BEGIN/COMMIT/ROLLBACK

3. **Make migrations idempotent**
   - Use IF NOT EXISTS, IF EXISTS
   - Check before modifying data
   - Allow re-running without errors

4. **Preserve data**
   - Never delete data unless explicitly required
   - Migrate existing data when adding constraints
   - Create default/fallback values for new columns

5. **Add indexes**
   - Create indexes for foreign keys
   - Add indexes for frequently queried columns
   - Use partial indexes where appropriate

6. **Document thoroughly**
   - Explain what the migration does
   - Document any side effects
   - Include rollback warnings if destructive

7. **Test before production**
   - Test on development database first
   - Verify data integrity after migration
   - Test rollback procedure
   - Check application still works

## Troubleshooting

### Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection manually
psql -h localhost -p 5432 -U grocery -d grocery_db -c "SELECT NOW();"

# Check Docker container
docker compose ps
docker compose logs postgres
```

### Migration Fails

1. Check the error message
2. Database will be rolled back automatically
3. Fix the issue and try again
4. If needed, check `schema_migrations` table:
   ```sql
   SELECT * FROM schema_migrations;
   ```

### Can't Rollback

If rollback fails:
1. Check if the down migration file exists
2. Review error message carefully
3. May need to manually fix and retry
4. Restore from backup if necessary

### Migration Already Applied

```bash
# Check status
npm run migrate:status

# If needed, manually remove from tracking table
psql -h localhost -p 5432 -U grocery -d grocery_db \
  -c "DELETE FROM schema_migrations WHERE id = '001';"
```

## Environment Variables

Required in `server/.env`:

```bash
# Database Configuration
DB_USER=grocery
DB_PASSWORD=grocery
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
```

## Database Backup & Restore

### Backup

```bash
# Full backup
pg_dump -h localhost -p 5432 -U grocery grocery_db > backup.sql

# Schema only
pg_dump -h localhost -p 5432 -U grocery -s grocery_db > schema.sql

# Data only
pg_dump -h localhost -p 5432 -U grocery -a grocery_db > data.sql
```

### Restore

```bash
# Restore full backup
psql -h localhost -p 5432 -U grocery -d grocery_db < backup.sql

# Or using Docker
docker compose exec -T postgres psql -U grocery -d grocery_db < backup.sql
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Review migration SQL carefully
- [ ] Verify rollback procedure works
- [ ] Schedule maintenance window if needed
- [ ] Notify team of deployment

### Deployment Steps

1. **Backup database**
   ```bash
   pg_dump -h prod-host -U grocery grocery_db > prod_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run migration**
   ```bash
   cd server
   npm run migrate:status
   npm run migrate:up
   ```

3. **Verify**
   ```bash
   npm run migrate:status
   # Test application
   # Check logs
   ```

4. **Monitor**
   - Check application logs
   - Monitor database performance
   - Verify user functionality

### Rollback in Production

Only if absolutely necessary:

```bash
# Have backup ready
# Test rollback procedure first
cd server
npm run migrate:down

# Or restore from backup
psql -h prod-host -U grocery -d grocery_db < prod_backup.sql
```

## Support

For issues or questions:
1. Check this README
2. Review migration comments in SQL files
3. Check server logs
4. Review PostgreSQL logs
5. Test on development database first

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg (node-postgres) Documentation](https://node-postgres.com/)
- [Database Migration Best Practices](https://www.postgresql.org/docs/current/ddl-alter.html)
