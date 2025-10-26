# Migration 001: Add Authentication - Summary

## Overview

This migration adds complete authentication support to the grocery list application, including user management, JWT token handling, and multi-user support for grocery items.

## What Changes

### New Tables Created

1. **users**
   - `id` (UUID, Primary Key)
   - `email` (VARCHAR, Unique, Validated)
   - `password_hash` (VARCHAR, Bcrypt)
   - `name` (VARCHAR)
   - `created_at`, `updated_at`, `last_login` (Timestamps)
   - `is_active` (Boolean)

2. **refresh_tokens**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key → users)
   - `token_hash` (VARCHAR, Unique)
   - `expires_at` (Timestamp)
   - `created_at` (Timestamp)
   - `revoked` (Boolean)

3. **schema_migrations** (tracking table)
   - Automatically created by migration tool
   - Tracks which migrations have been applied

### Tables Modified

1. **grocery_items**
   - Added `user_id` (UUID, NOT NULL, Foreign Key → users)
   - All existing items assigned to default admin user
   - Foreign key constraint: `ON DELETE CASCADE`

### Indexes Added

**Users Table:**
- `idx_users_email` - Fast email lookups (login)
- `idx_users_created_at` - Sorting by registration date
- `idx_users_active` - Filter active users

**Refresh Tokens Table:**
- `idx_refresh_tokens_user_id` - Find user's tokens
- `idx_refresh_tokens_token_hash` - Verify tokens
- `idx_refresh_tokens_expires_at` - Cleanup expired tokens

**Grocery Items Table:**
- `idx_grocery_items_user_id` - Filter by user
- `idx_grocery_items_user_gotten` - User + status composite
- `idx_grocery_items_user_category` - User + category composite (if exists)

### Triggers and Functions

1. **update_updated_at_column()** - Auto-update timestamps
2. **lowercase_email()** - Normalize emails to lowercase
3. **update_users_updated_at** - Trigger on users table
4. **lowercase_users_email** - Trigger on users table

### Default Data

**Admin User Created:**
- ID: `00000000-0000-0000-0000-000000000001`
- Email: `admin@grocery.local`
- Password: `admin123` (bcrypt hash)
- Name: `Default Admin`
- Status: Active

**All existing grocery items** assigned to this admin user.

## Data Preservation Strategy

### Guaranteed Safe Operations

✅ **No data loss** - All existing grocery items are preserved
✅ **Automatic assignment** - Items assigned to default admin user
✅ **Transaction safety** - Entire migration runs in transaction
✅ **Rollback on error** - Database reverted if any step fails
✅ **Idempotent operations** - Safe to re-run if needed

### Migration Process

1. **Create users table** with validation and indexes
2. **Create refresh_tokens table** with foreign keys
3. **Create trigger functions** for automation
4. **Create default admin user** with known credentials
5. **Add user_id column** to grocery_items (nullable initially)
6. **Assign existing items** to admin user
7. **Make user_id NOT NULL** and add foreign key
8. **Create indexes** for performance
9. **Display statistics** and verification info

### Verification Steps Built-In

The migration automatically:
- Counts users created
- Counts grocery items found
- Checks for orphaned items
- Reports statistics
- Displays admin credentials

## Rollback Strategy

The rollback migration (`001_add_authentication_rollback.sql`) safely reverses all changes:

### Rollback Process

1. **Display warnings** and statistics
2. **3-second delay** to allow abort (Ctrl+C)
3. **Remove foreign keys** from grocery_items
4. **Drop indexes** related to user_id
5. **Remove user_id column** from grocery_items
6. **Drop triggers** from users table
7. **Drop refresh_tokens table** with CASCADE
8. **Drop users table** with CASCADE
9. **Drop trigger functions**
10. **Verify rollback** completion

### What's Preserved in Rollback

✅ All grocery items (without user_id)
✅ All item properties (name, quantity, category, notes, etc.)
✅ Item timestamps and IDs

### What's Deleted in Rollback

❌ All user accounts
❌ All refresh tokens
❌ User associations on items
❌ Authentication-related functions and triggers

## Security Considerations

### Default Credentials

⚠️ **CRITICAL**: Change default admin password immediately after migration!

```bash
# Default credentials (CHANGE THESE!)
Email: admin@grocery.local
Password: admin123
```

### Password Security

- Passwords stored as bcrypt hashes (cost factor 10)
- Plaintext passwords never stored
- Refresh tokens stored as hashes

### Email Validation

- Format validation via CHECK constraint
- Automatic lowercase normalization
- Uniqueness enforced

### Token Management

- Refresh tokens can be revoked
- Expiration timestamps enforced
- Token hashes for security

## Performance Impact

### Expected Performance

- **Minimal overhead** on existing queries
- **Fast user lookups** via indexed email
- **Efficient token verification** via hash index
- **Optimized item queries** with composite indexes

### Query Changes Needed

Applications querying grocery_items must now:
- Filter by `user_id` to see user's items
- Include `user_id` when creating items
- Handle user authentication in API

### Index Benefits

- User login: O(log n) via email index
- Item queries: O(log n) via user_id index
- Token verification: O(1) via hash index

## Testing Recommendations

### Before Migration

```bash
# 1. Backup database
pg_dump -h localhost -U grocery grocery_db > backup_before_auth.sql

# 2. Count existing data
psql -h localhost -U grocery -d grocery_db -c "
  SELECT
    (SELECT COUNT(*) FROM grocery_items) as item_count;
"

# 3. Check migration status
npm run migrate:status
```

### After Migration

```bash
# 1. Verify migration applied
npm run migrate:status

# 2. Check admin user created
psql -h localhost -U grocery -d grocery_db -c "
  SELECT email, name, is_active FROM users;
"

# 3. Verify items assigned
psql -h localhost -U grocery -d grocery_db -c "
  SELECT
    (SELECT COUNT(*) FROM grocery_items) as total_items,
    (SELECT COUNT(*) FROM grocery_items WHERE user_id IS NULL) as orphaned_items,
    (SELECT COUNT(*) FROM grocery_items WHERE user_id IS NOT NULL) as assigned_items;
"

# 4. Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@grocery.local","password":"admin123"}'
```

### Rollback Testing (Optional)

```bash
# Only on development/test database!

# 1. Backup current state
pg_dump -h localhost -U grocery grocery_db > backup_before_rollback.sql

# 2. Run rollback
npm run migrate:down

# 3. Verify items preserved
psql -h localhost -U grocery -d grocery_db -c "
  SELECT COUNT(*) FROM grocery_items;
"

# 4. Re-apply migration
npm run migrate:up
```

## Troubleshooting

### Migration Fails: "relation 'grocery_items' does not exist"

**Problem**: Base schema not initialized
**Solution**: Create grocery_items table first, then run migration

### Migration Fails: "duplicate key value violates unique constraint"

**Problem**: Admin user already exists
**Solution**: Migration is idempotent, will skip existing user

### After Migration: "Column 'user_id' cannot be null"

**Problem**: New items need user_id
**Solution**: Update application code to include user_id when creating items

### Rollback Fails: "Cannot drop table users because other objects depend on it"

**Problem**: Additional foreign keys exist
**Solution**: Use CASCADE (included in rollback) or manually drop dependencies

## File Locations

```
server/migrations/
├── 001_add_authentication.sql             # UP migration (run this)
├── 001_add_authentication_rollback.sql    # DOWN migration (reverse)
├── migrate.ts                             # Migration tool (TypeScript)
├── migrate.sh                             # Helper script (Bash)
├── README.md                              # Full documentation
├── QUICKSTART.md                          # Quick start guide
└── MIGRATION_SUMMARY.md                   # This file
```

## Quick Reference

```bash
# Show status
npm run migrate:status

# Run migration
npm run migrate:up

# Rollback migration
npm run migrate:down

# Using shell script
cd server/migrations
./migrate.sh status
./migrate.sh verify
./migrate.sh backup
./migrate.sh up
```

## Support & Resources

- **Full Documentation**: [README.md](README.md)
- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **Migration Code**: [001_add_authentication.sql](001_add_authentication.sql)
- **Rollback Code**: [001_add_authentication_rollback.sql](001_add_authentication_rollback.sql)

## Success Criteria

After running this migration successfully:

✅ Users table exists with admin user
✅ Refresh tokens table exists
✅ Grocery items have user_id column
✅ All existing items assigned to admin
✅ No orphaned items (user_id IS NULL)
✅ All indexes created
✅ All triggers active
✅ Can login with admin credentials
✅ Can query items by user
✅ Application authentication works

## Version Info

- Migration ID: 001
- Created: 2025-10-26
- Database: PostgreSQL 12+
- Application: Grocery List v0.1.0
- Node.js: 18+
