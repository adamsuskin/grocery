-- Rollback Migration: 001_create_users_table
-- Description: Drops the users table and related objects
-- Created: 2025-10-26
-- WARNING: This will permanently delete all user data!

-- =====================================================
-- DOWN MIGRATION / ROLLBACK
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS lowercase_users_email ON users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop functions
DROP FUNCTION IF EXISTS lowercase_email();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes (automatically dropped with table, but explicit for clarity)
DROP INDEX IF EXISTS idx_users_email_active;
DROP INDEX IF EXISTS idx_users_active;
DROP INDEX IF EXISTS idx_users_last_login;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;

-- Drop the users table
DROP TABLE IF EXISTS users CASCADE;

-- Optionally drop extension if no other tables use it
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE 'Users table and related objects have been dropped';
END $$;
