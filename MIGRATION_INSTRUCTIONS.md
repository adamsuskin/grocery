# Database Migration Instructions - Authentication Upgrade

## 🎯 Purpose

This migration adds user authentication to your grocery list application, enabling multi-user support while preserving all existing data.

## 📦 What You're Getting

✅ User authentication system (email/password)
✅ JWT token management with refresh tokens
✅ Multi-user support for grocery items
✅ Default admin account for existing data
✅ Safe, reversible migration process
✅ Comprehensive documentation

## 🚀 Quick Start (5 Minutes)

### Step 1: Ensure PostgreSQL is Running

```bash
# Start PostgreSQL with Docker Compose
docker compose up -d postgres

# Verify it's running
docker compose ps
```

### Step 2: Run the Migration

```bash
cd server

# Check what will happen
npm run migrate:status

# Run the migration
npm run migrate:up
```

### Step 3: Login with Default Credentials

```
Email: admin@grocery.local
Password: admin123
```

**⚠️ IMPORTANT: Change this password immediately!**

### Step 4: Verify Everything Works

```bash
# Check migration status
npm run migrate:status

# Verify users table
npm run migrate verify  # or use: ./migrations/migrate.sh verify
```

Done! Your application now has authentication. 🎉

## 📁 Files Created

```
server/migrations/
├── 001_add_authentication.sql             # UP migration (258 lines)
├── 001_add_authentication_rollback.sql    # DOWN migration (174 lines)
├── migrate.ts                             # Migration runner (371 lines)
├── migrate.sh                             # Bash helper script (219 lines)
├── README.md                              # Full documentation (595 lines)
├── QUICKSTART.md                          # Quick reference (142 lines)
└── MIGRATION_SUMMARY.md                   # Technical summary (450 lines)
```

**Total: 1,909 lines of migration code and documentation**

## 🔍 What the Migration Does

### Creates New Tables

**users** - User accounts
- UUID primary key
- Email (unique, validated, lowercase)
- Password hash (bcrypt)
- Name, timestamps, activity status
- Indexed for fast lookups

**refresh_tokens** - JWT token management
- Token storage and revocation
- Expiration tracking
- User association

**schema_migrations** - Migration tracking
- Automatic tracking table
- Prevents duplicate migrations
- Shows migration history

### Modifies Existing Table

**grocery_items** - Gets user ownership
- Adds `user_id` column (UUID, NOT NULL)
- Foreign key to users table
- All existing items assigned to admin
- Composite indexes for performance

### Creates Database Objects

- **2 Trigger functions** (auto-update timestamps, normalize emails)
- **2 Triggers** (on users table)
- **10 Indexes** (optimized for user queries)
- **Multiple constraints** (email format, foreign keys, uniqueness)

## 🛡️ Data Safety

### What's Protected

✅ All existing grocery items preserved
✅ All item data intact (name, quantity, category, notes, etc.)
✅ No data loss during migration
✅ Transaction-based (rolls back on error)
✅ Idempotent (safe to re-run)

### Default User Created

A default admin user is created to own existing items:
- Email: `admin@grocery.local`
- Password: `admin123`
- All existing grocery items assigned to this user

**Security Note:** This default password is intentionally weak to force you to change it immediately!

## 📚 Documentation Guide

### For Quick Setup
**Read:** `/home/adam/grocery/server/migrations/QUICKSTART.md`
- 5-minute setup guide
- Common commands
- Quick verification steps

### For Full Understanding
**Read:** `/home/adam/grocery/server/migrations/README.md`
- Complete migration documentation
- All commands explained
- Troubleshooting guide
- Production deployment guide

### For Technical Details
**Read:** `/home/adam/grocery/server/migrations/MIGRATION_SUMMARY.md`
- Detailed technical summary
- Database schema changes
- Performance considerations
- Testing recommendations

### For Migration Code
**Review:**
- `/home/adam/grocery/server/migrations/001_add_authentication.sql`
- `/home/adam/grocery/server/migrations/001_add_authentication_rollback.sql`

## 🎮 Commands Reference

### Using NPM Scripts

```bash
cd server

# View migration status
npm run migrate:status

# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Run specific migration
npm run migrate up 001

# Rollback specific migration
npm run migrate down 001
```

### Using Shell Script (Easier)

```bash
cd server/migrations

# Make script executable (first time only)
chmod +x migrate.sh

# Show status
./migrate.sh status

# Verify database state
./migrate.sh verify

# Create backup
./migrate.sh backup

# Run migration
./migrate.sh up

# Rollback migration (with confirmation)
./migrate.sh down
```

### Manual psql Commands

```bash
# Run migration manually
psql -h localhost -p 5432 -U grocery -d grocery_db \
  -f server/migrations/001_add_authentication.sql

# Rollback migration manually
psql -h localhost -p 5432 -U grocery -d grocery_db \
  -f server/migrations/001_add_authentication_rollback.sql
```

## ✅ Verification Steps

### 1. Check Migration Applied

```bash
cd server
npm run migrate:status
```

Expected output:
```
✓ Applied 001: add_authentication
```

### 2. Verify Users Table

```bash
psql -h localhost -p 5432 -U grocery -d grocery_db -c "
  SELECT email, name, is_active, created_at FROM users;
"
```

Expected output:
```
         email          |     name      | is_active |         created_at
------------------------+---------------+-----------+---------------------------
 admin@grocery.local    | Default Admin | t         | 2025-10-26 05:13:42.123...
```

### 3. Verify Items Have User Assignment

```bash
psql -h localhost -p 5432 -U grocery -d grocery_db -c "
  SELECT
    COUNT(*) as total_items,
    COUNT(user_id) as items_with_user,
    COUNT(*) - COUNT(user_id) as orphaned_items
  FROM grocery_items;
"
```

Expected output:
```
 total_items | items_with_user | orphaned_items
-------------+-----------------+----------------
          15 |              15 |              0
```

### 4. Test Authentication (Optional)

```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@grocery.local",
    "password": "admin123"
  }'
```

Expected: JSON response with access and refresh tokens.

## 🔧 Configuration

### Environment Variables Required

Update `server/.env` (or create from `.env.example`):

```bash
# Database Configuration
DB_USER=grocery
DB_PASSWORD=grocery
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db

# JWT Configuration (required for auth to work)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Generate secure JWT secrets:
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
```

## 🔄 Rollback Instructions

If you need to remove authentication and revert to the original state:

### ⚠️ WARNING

Rollback will:
- Delete all user accounts
- Delete all refresh tokens
- Remove user_id from grocery items
- **Grocery items will be preserved**

### Rollback Steps

```bash
# 1. Backup database first!
pg_dump -h localhost -p 5432 -U grocery grocery_db > backup_before_rollback.sql

# 2. Run rollback
cd server
npm run migrate:down

# 3. Verify rollback
npm run migrate:status
```

After rollback, your database will be in pre-authentication state with all grocery items intact.

## 🐛 Troubleshooting

### "Connection refused" Error

**Problem:** PostgreSQL not running
**Solution:**
```bash
docker compose up -d postgres
sleep 5
docker compose ps
```

### "relation 'grocery_items' does not exist"

**Problem:** Base schema not created
**Solution:** Create the grocery_items table first, then run migration

### "role 'grocery' does not exist"

**Problem:** Database user not created
**Solution:** Check Docker Compose configuration or create user manually

### Migration Runs But No Changes

**Problem:** Migration already applied
**Solution:** Check status with `npm run migrate:status`

### "Cannot connect to database"

**Problem:** Wrong connection credentials
**Solution:** Check `server/.env` file has correct DB credentials

## 📊 Database Schema Diagram

```
┌─────────────────────────────────────┐
│            users                    │
├─────────────────────────────────────┤
│ id (UUID, PK)                       │
│ email (VARCHAR, UNIQUE)             │
│ password_hash (VARCHAR)             │
│ name (VARCHAR)                      │
│ created_at (TIMESTAMPTZ)            │
│ updated_at (TIMESTAMPTZ)            │
│ last_login (TIMESTAMPTZ)            │
│ is_active (BOOLEAN)                 │
└─────────────────────────────────────┘
                ▲
                │ (FK)
                │
┌───────────────┴─────────────────────┐
│         grocery_items               │
├─────────────────────────────────────┤
│ id (TEXT, PK)                       │
│ name (TEXT)                         │
│ quantity (INTEGER)                  │
│ gotten (BOOLEAN)                    │
│ category (TEXT)                     │
│ notes (TEXT)                        │
│ created_at (INTEGER)                │
│ user_id (UUID, FK) ← NEW!          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       refresh_tokens                │
├─────────────────────────────────────┤
│ id (UUID, PK)                       │
│ user_id (UUID, FK) ────────┐       │
│ token_hash (VARCHAR)        │       │
│ expires_at (TIMESTAMPTZ)    │       │
│ created_at (TIMESTAMPTZ)    │       │
│ revoked (BOOLEAN)           │       │
└─────────────────────────────┴───────┘
                ▲
                │ (FK)
                │
                └─────── users.id
```

## 🎯 Post-Migration Checklist

- [ ] Migration completed successfully
- [ ] Admin user exists in database
- [ ] All grocery items have user_id assigned
- [ ] No orphaned items (user_id IS NULL)
- [ ] Can login with admin credentials
- [ ] Change default admin password
- [ ] Environment variables configured
- [ ] JWT secrets generated and set
- [ ] Authentication endpoints working
- [ ] Frontend can authenticate users
- [ ] Items filtered by user correctly

## 📞 Support

### Documentation Files

1. **Quick Start**: `server/migrations/QUICKSTART.md`
2. **Full Guide**: `server/migrations/README.md`
3. **Technical Summary**: `server/migrations/MIGRATION_SUMMARY.md`
4. **This File**: `MIGRATION_INSTRUCTIONS.md`

### Useful Commands

```bash
# Show all tables
psql -h localhost -U grocery -d grocery_db -c "\dt"

# Describe users table
psql -h localhost -U grocery -d grocery_db -c "\d users"

# Count records
psql -h localhost -U grocery -d grocery_db -c "
  SELECT
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM grocery_items) as items,
    (SELECT COUNT(*) FROM refresh_tokens) as tokens;
"

# Show migration history
psql -h localhost -U grocery -d grocery_db -c "
  SELECT * FROM schema_migrations ORDER BY applied_at;
"
```

## 🎓 Key Concepts

### Idempotent Migrations
The migration uses `IF NOT EXISTS` / `IF EXISTS` clauses, making it safe to re-run without errors.

### Transaction Safety
All changes run in a single transaction. If any step fails, everything rolls back automatically.

### Data Preservation
Existing data is never deleted. New columns are added, and data is migrated, but original data remains intact.

### Migration Tracking
A `schema_migrations` table tracks which migrations have been applied, preventing duplicates.

### Reversible Design
Every migration has a corresponding rollback that can undo the changes safely.

## 🌟 Best Practices

1. **Always backup before migrating** (especially in production)
2. **Test migrations on development first**
3. **Review migration SQL before running**
4. **Change default credentials immediately**
5. **Use secure JWT secrets in production**
6. **Monitor application after migration**
7. **Keep migrations in version control**

## 📝 Next Steps

After successful migration:

1. **Change admin password** via application or SQL:
   ```sql
   UPDATE users
   SET password_hash = '$2b$10$YOUR_NEW_HASH'
   WHERE email = 'admin@grocery.local';
   ```

2. **Create new users** via registration endpoint

3. **Test application** with authentication

4. **Update API calls** to include authentication tokens

5. **Deploy frontend changes** to use authentication

---

**Created:** 2025-10-26
**Version:** 1.0.0
**Database:** PostgreSQL 12+
**Application:** Grocery List with Authentication
