# Database Migrations

This directory contains SQL migration scripts for the grocery list application database.

## Migration Naming Convention

Migrations are named with a sequential number prefix:
- `001_create_users_table.sql`
- `002_add_feature.sql`
- etc.

## Running Migrations

### Option 1: Using psql directly

```bash
# Ensure PostgreSQL is running
docker compose up -d

# Run a migration
psql -h localhost -p 5432 -U grocery -d grocery_db -f src/migrations/001_create_users_table.sql
```

### Option 2: Using Docker Compose

```bash
# Copy migration file into running container and execute
docker compose exec -T postgres psql -U grocery -d grocery_db < src/migrations/001_create_users_table.sql
```

### Option 3: All migrations at once

```bash
# Run all migrations in order
for file in src/migrations/*.sql; do
  echo "Running $file..."
  docker compose exec -T postgres psql -U grocery -d grocery_db < "$file"
done
```

## Creating New Migrations

1. Create a new file with the next sequential number
2. Include both UP and DOWN migrations in the file
3. Add descriptive comments at the top
4. Test the migration on a development database first

## Migration Structure

Each migration file should contain:
- Header comments (migration number, description, date, author)
- UP MIGRATION section (changes to apply)
- DOWN MIGRATION section (how to rollback)

## Current Migrations

- `001_create_users_table.sql` - Creates the users table with JWT authentication support

## Notes

- Always backup your database before running migrations in production
- Migrations should be idempotent when possible (use `IF NOT EXISTS`, `IF EXISTS`)
- Test rollback procedures before deploying to production
