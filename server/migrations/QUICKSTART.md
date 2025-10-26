# Migration Quick Start Guide

## TL;DR - Run This First Time

```bash
cd server

# 1. Make sure PostgreSQL is running
docker compose up -d postgres

# 2. Check what will be migrated
npm run migrate:status

# 3. Run the migration
npm run migrate:up

# 4. Verify it worked
npm run migrate:status
```

**Default Admin Credentials Created:**
- Email: `admin@grocery.local`
- Password: `admin123`
- ⚠️ **CHANGE THIS PASSWORD IMMEDIATELY!**

## What Just Happened?

The migration added authentication to your grocery list app:

✅ Created `users` table for login
✅ Created `refresh_tokens` table for JWT
✅ Added `user_id` to your grocery items
✅ Created default admin user
✅ Assigned all existing items to admin
✅ All your data is preserved

## Quick Commands

```bash
# Show migration status
npm run migrate:status

# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# See what changed in database
psql -h localhost -p 5432 -U grocery -d grocery_db -c "\dt"
```

## Verify Your Data

```bash
# Check users table
psql -h localhost -p 5432 -U grocery -d grocery_db -c "SELECT email, name FROM users;"

# Check your items still exist with user_id
psql -h localhost -p 5432 -U grocery -d grocery_db -c "SELECT id, name, user_id FROM grocery_items LIMIT 5;"

# Count items per user
psql -h localhost -p 5432 -U grocery -d grocery_db -c "
  SELECT u.email, COUNT(gi.id) as item_count
  FROM users u
  LEFT JOIN grocery_items gi ON gi.user_id = u.id
  GROUP BY u.email;
"
```

## Common Issues

### "Connection refused"
PostgreSQL isn't running:
```bash
docker compose up -d postgres
# Wait 5 seconds
docker compose ps
```

### "relation 'grocery_items' does not exist"
You need to create the base schema first. Check if you have an initial schema file to run.

### "FATAL: password authentication failed"
Check your `.env` file has correct database credentials:
```bash
cat server/.env | grep DB_
```

## Rollback (If Needed)

⚠️ **WARNING: This deletes all users and removes authentication!**

```bash
# Backup first!
pg_dump -h localhost -p 5432 -U grocery grocery_db > backup.sql

# Rollback
npm run migrate:down

# Your grocery items are preserved, but user_id is removed
```

## Next Steps

1. **Change the default admin password**
   - Login to your app
   - Go to settings/profile
   - Change password

2. **Create your own users**
   - Use the registration endpoint
   - Or create via admin panel

3. **Test the authentication**
   - Logout and login
   - Verify items are filtered by user
   - Create items as different users

## Need Help?

See the full [README.md](README.md) for detailed documentation.

## File Structure

```
server/migrations/
├── README.md                              # Full documentation
├── QUICKSTART.md                          # This file
├── migrate.ts                             # Migration runner
├── 001_add_authentication.sql             # Up migration
└── 001_add_authentication_rollback.sql    # Down migration
```
