-- =====================================================
-- Rollback Migration: 001_add_authentication
-- Description: Remove authentication tables and user association from grocery items
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- WARNING: This rollback will:
--   1. Remove user_id column from grocery_items
--   2. Drop all authentication tables (users, refresh_tokens)
--   3. Remove all triggers and functions
--   4. Delete ALL user data permanently
--
-- THIS OPERATION CANNOT BE UNDONE!
-- Ensure you have a backup before proceeding!
-- =====================================================

-- =====================================================
-- PHASE 1: Verification and Backup Prompt
-- =====================================================

DO $$
DECLARE
  user_count INTEGER;
  item_count INTEGER;
  token_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO item_count FROM grocery_items;
  SELECT COUNT(*) INTO token_count FROM refresh_tokens;

  RAISE WARNING '========================================';
  RAISE WARNING 'ROLLBACK MIGRATION 001_add_authentication';
  RAISE WARNING '========================================';
  RAISE WARNING 'This will DELETE the following data:';
  RAISE WARNING '  - % user account(s)', user_count;
  RAISE WARNING '  - % refresh token(s)', token_count;
  RAISE WARNING '  - user_id from % grocery item(s)', item_count;
  RAISE WARNING '========================================';
  RAISE WARNING 'Proceeding with rollback in 3 seconds...';
  RAISE WARNING 'Press Ctrl+C to abort!';
  RAISE WARNING '========================================';

  -- Give user time to abort (doesn't actually pause, but shows warning)
  PERFORM pg_sleep(3);
END $$;

-- =====================================================
-- PHASE 2: Remove Foreign Key Constraints from grocery_items
-- =====================================================

-- Remove foreign key constraint from grocery_items
ALTER TABLE grocery_items
  DROP CONSTRAINT IF EXISTS fk_grocery_items_user_id;

-- Drop indexes related to user_id on grocery_items
DROP INDEX IF EXISTS idx_grocery_items_user_id;
DROP INDEX IF EXISTS idx_grocery_items_user_gotten;
DROP INDEX IF EXISTS idx_grocery_items_user_category;

-- Remove user_id column from grocery_items
ALTER TABLE grocery_items
  DROP COLUMN IF EXISTS user_id;

RAISE NOTICE 'Removed user_id column from grocery_items table';

-- =====================================================
-- PHASE 3: Drop Triggers
-- =====================================================

-- Drop triggers from users table
DROP TRIGGER IF EXISTS lowercase_users_email ON users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

RAISE NOTICE 'Dropped triggers from users table';

-- =====================================================
-- PHASE 4: Drop Refresh Tokens Table
-- =====================================================

-- Drop indexes on refresh_tokens
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token_hash;
DROP INDEX IF EXISTS idx_refresh_tokens_expires_at;

-- Drop refresh_tokens table
DROP TABLE IF EXISTS refresh_tokens CASCADE;

RAISE NOTICE 'Dropped refresh_tokens table';

-- =====================================================
-- PHASE 5: Drop Users Table
-- =====================================================

-- Drop indexes on users
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_active;

-- Drop users table
DROP TABLE IF EXISTS users CASCADE;

RAISE NOTICE 'Dropped users table';

-- =====================================================
-- PHASE 6: Drop Functions
-- =====================================================

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS lowercase_email() CASCADE;

RAISE NOTICE 'Dropped trigger functions';

-- =====================================================
-- PHASE 7: Verification
-- =====================================================

DO $$
DECLARE
  users_exists BOOLEAN;
  tokens_exists BOOLEAN;
  user_id_exists BOOLEAN;
BEGIN
  -- Check if tables still exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'users'
  ) INTO users_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'refresh_tokens'
  ) INTO tokens_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'grocery_items' AND column_name = 'user_id'
  ) INTO user_id_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Rollback Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users table exists: %', users_exists;
  RAISE NOTICE 'Refresh tokens table exists: %', tokens_exists;
  RAISE NOTICE 'grocery_items.user_id exists: %', user_id_exists;
  RAISE NOTICE '========================================';

  IF users_exists OR tokens_exists OR user_id_exists THEN
    RAISE WARNING 'Some objects still exist - rollback may be incomplete!';
  ELSE
    RAISE NOTICE 'Rollback completed successfully!';
    RAISE NOTICE 'Database restored to pre-authentication state';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Rollback Complete
-- =====================================================

-- Final message
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_add_authentication has been rolled back';
  RAISE NOTICE 'All authentication tables and user associations removed';
  RAISE NOTICE 'Grocery items preserved without user ownership';
END $$;
