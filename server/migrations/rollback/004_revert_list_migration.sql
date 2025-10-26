-- =====================================================
-- Rollback Migration: 004_revert_list_migration
-- Description: Revert migration from list-based to user-based items
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- This rollback migration reverts the changes made by 004_migrate_to_lists.sql
-- It removes list associations from grocery_items while preserving the items
-- themselves (they remain associated with their users).
--
-- WARNING: This rollback will:
--   - Remove list_id column from grocery_items
--   - Delete all lists and list memberships
--   - Drop helper functions
--   - Items will remain but only be accessible via user_id
--
-- DATA PRESERVED:
--   - All grocery_items (user_id remains intact)
--   - All users
--   - All authentication data
--
-- DATA DELETED:
--   - All lists
--   - All list memberships
--   - List access history
-- =====================================================

-- =====================================================
-- PHASE 1: Pre-Rollback Verification and Statistics
-- =====================================================

DO $$
DECLARE
  list_count INTEGER;
  member_count INTEGER;
  item_count INTEGER;
  items_with_list INTEGER;
BEGIN
  -- Gather current statistics
  SELECT COUNT(*) INTO list_count FROM lists;
  SELECT COUNT(*) INTO member_count FROM list_members;
  SELECT COUNT(*) INTO item_count FROM grocery_items;
  SELECT COUNT(*) INTO items_with_list FROM grocery_items WHERE list_id IS NOT NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting Rollback: 004_revert_list_migration';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Current Database State:';
  RAISE NOTICE '  Total lists: %', list_count;
  RAISE NOTICE '  Total list members: %', member_count;
  RAISE NOTICE '  Total grocery items: %', item_count;
  RAISE NOTICE '  Items with list_id: %', items_with_list;
  RAISE NOTICE '========================================';
  RAISE WARNING 'This will DELETE all lists and memberships!';
  RAISE WARNING 'Items will be preserved but only accessible via user_id';
  RAISE NOTICE '========================================';
END $$;

-- Wait for a moment to allow review (PostgreSQL continues immediately)
-- In production, ensure you have a backup before running this rollback!

-- =====================================================
-- PHASE 2: Verify All Items Have user_id
-- =====================================================

-- Critical check: Ensure all items have a user_id before removing list_id
DO $$
DECLARE
  orphaned_items INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_items
  FROM grocery_items
  WHERE user_id IS NULL;

  IF orphaned_items > 0 THEN
    RAISE EXCEPTION 'Cannot rollback: % items have no user_id! Data loss would occur.', orphaned_items;
  ELSE
    RAISE NOTICE 'Verification passed: All items have user_id';
  END IF;
END $$;

-- =====================================================
-- PHASE 3: Remove list_id Constraint from grocery_items
-- =====================================================

-- Make list_id nullable first (if it's NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'grocery_items'
      AND column_name = 'list_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE grocery_items
      ALTER COLUMN list_id DROP NOT NULL;
    RAISE NOTICE 'Made list_id column nullable';
  ELSE
    RAISE NOTICE 'list_id column is already nullable';
  END IF;
END $$;

-- Drop foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_grocery_items_list_id'
      AND table_name = 'grocery_items'
  ) THEN
    ALTER TABLE grocery_items
      DROP CONSTRAINT fk_grocery_items_list_id;
    RAISE NOTICE 'Dropped foreign key constraint fk_grocery_items_list_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint fk_grocery_items_list_id does not exist';
  END IF;
END $$;

-- =====================================================
-- PHASE 4: Drop Helper Functions
-- =====================================================

-- Drop helper functions created by the migration
DROP FUNCTION IF EXISTS get_user_lists(UUID);
DROP FUNCTION IF EXISTS get_user_list_permission(UUID, UUID);
DROP FUNCTION IF EXISTS user_has_list_access(UUID, UUID);

RAISE NOTICE 'Dropped helper functions';

-- =====================================================
-- PHASE 5: Drop Indexes Related to Lists
-- =====================================================

-- Drop indexes created for list functionality
DROP INDEX IF EXISTS idx_grocery_items_list_gotten;
DROP INDEX IF EXISTS idx_grocery_items_list_id;
DROP INDEX IF EXISTS idx_list_members_permission;
DROP INDEX IF EXISTS idx_list_members_list_id;
DROP INDEX IF EXISTS idx_list_members_user_id;
DROP INDEX IF EXISTS idx_lists_created_at;
DROP INDEX IF EXISTS idx_lists_owner_id;

RAISE NOTICE 'Dropped list-related indexes';

-- =====================================================
-- PHASE 6: Remove list_id Column from grocery_items
-- =====================================================

-- Remove the list_id column entirely
ALTER TABLE grocery_items
  DROP COLUMN IF EXISTS list_id;

RAISE NOTICE 'Removed list_id column from grocery_items';

-- =====================================================
-- PHASE 7: Drop List Tables
-- =====================================================

-- Drop list_members table (cascade will handle foreign keys)
DROP TABLE IF EXISTS list_members CASCADE;

RAISE NOTICE 'Dropped list_members table';

-- Drop lists table (cascade will handle foreign keys)
DROP TABLE IF EXISTS lists CASCADE;

RAISE NOTICE 'Dropped lists table';

-- =====================================================
-- PHASE 8: Final Verification and Statistics
-- =====================================================

DO $$
DECLARE
  remaining_items INTEGER;
  items_with_user INTEGER;
  users_with_items INTEGER;
BEGIN
  -- Verify grocery_items still exist
  SELECT COUNT(*) INTO remaining_items FROM grocery_items;
  SELECT COUNT(*) INTO items_with_user FROM grocery_items WHERE user_id IS NOT NULL;

  -- Count users who have items
  SELECT COUNT(DISTINCT user_id) INTO users_with_items
  FROM grocery_items
  WHERE user_id IS NOT NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Rollback 004_revert_list_migration completed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Final Database State:';
  RAISE NOTICE '  Total grocery items preserved: %', remaining_items;
  RAISE NOTICE '  Items with user_id: %', items_with_user;
  RAISE NOTICE '  Users with items: %', users_with_items;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'What was removed:';
  RAISE NOTICE '  - Lists table and all list data';
  RAISE NOTICE '  - List_members table and membership data';
  RAISE NOTICE '  - list_id column from grocery_items';
  RAISE NOTICE '  - List-related helper functions';
  RAISE NOTICE '  - List-related indexes';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'What was preserved:';
  RAISE NOTICE '  - All grocery items';
  RAISE NOTICE '  - User associations (user_id)';
  RAISE NOTICE '  - All other item data';
  RAISE NOTICE '========================================';

  IF remaining_items = items_with_user THEN
    RAISE NOTICE 'SUCCESS: All items retained their user associations';
  ELSE
    RAISE WARNING 'WARNING: Some items may have lost user associations';
  END IF;
END $$;

-- =====================================================
-- Rollback Complete
-- =====================================================
-- The database is now back to a user-based model where:
--   - Users own grocery_items directly via user_id
--   - No list functionality exists
--   - All items and users are preserved
-- =====================================================
