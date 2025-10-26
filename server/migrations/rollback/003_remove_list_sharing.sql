-- =====================================================
-- Rollback Migration: 003_add_list_sharing
-- Description: Remove multi-user list sharing functionality
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- WARNING: This rollback will:
--   1. Remove list_id column from grocery_items
--   2. Drop lists and list_members tables
--   3. Remove all helper functions, triggers, and views
--   4. Preserve grocery items but lose list organization
--   5. Delete ALL list and sharing data permanently
--
-- THIS OPERATION CANNOT BE UNDONE!
-- Ensure you have a backup before proceeding!
-- =====================================================

-- =====================================================
-- PHASE 1: Verification and Backup Prompt
-- =====================================================

DO $$
DECLARE
  list_count INTEGER;
  member_count INTEGER;
  item_count INTEGER;
  shared_lists INTEGER;
BEGIN
  SELECT COUNT(*) INTO list_count FROM lists;
  SELECT COUNT(*) INTO member_count FROM list_members;
  SELECT COUNT(*) INTO item_count FROM grocery_items;

  -- Count lists with more than one member (shared lists)
  SELECT COUNT(DISTINCT list_id) INTO shared_lists
  FROM list_members
  GROUP BY list_id
  HAVING COUNT(*) > 1;

  RAISE WARNING '========================================';
  RAISE WARNING 'ROLLBACK MIGRATION 003_add_list_sharing';
  RAISE WARNING '========================================';
  RAISE WARNING 'This will DELETE the following data:';
  RAISE WARNING '  - % list(s)', list_count;
  RAISE WARNING '  - % list membership(s)', member_count;
  RAISE WARNING '  - % shared list(s) with multiple members', shared_lists;
  RAISE WARNING '  - List organization from % grocery item(s)', item_count;
  RAISE WARNING '========================================';
  RAISE WARNING 'Grocery items will be preserved but will lose list association';
  RAISE WARNING 'Items will only be accessible by their original owner (user_id)';
  RAISE WARNING '========================================';
  RAISE WARNING 'Proceeding with rollback in 3 seconds...';
  RAISE WARNING 'Press Ctrl+C to abort!';
  RAISE WARNING '========================================';

  -- Give user time to abort (doesn't actually pause, but shows warning)
  PERFORM pg_sleep(3);
END $$;

-- =====================================================
-- PHASE 2: Drop Views
-- =====================================================

-- Drop views that depend on the tables
DROP VIEW IF EXISTS user_lists_with_details CASCADE;
DROP VIEW IF EXISTS list_members_with_details CASCADE;

RAISE NOTICE 'Dropped views';

-- =====================================================
-- PHASE 3: Drop Triggers
-- =====================================================

-- Drop triggers from lists table
DROP TRIGGER IF EXISTS ensure_list_owner_membership_trigger ON lists;
DROP TRIGGER IF EXISTS update_lists_updated_at ON lists;

-- Drop triggers from list_members table
DROP TRIGGER IF EXISTS prevent_last_owner_removal_trigger ON list_members;

RAISE NOTICE 'Dropped triggers';

-- =====================================================
-- PHASE 4: Remove Foreign Key Constraints from grocery_items
-- =====================================================

-- Remove foreign key constraint from grocery_items
ALTER TABLE grocery_items
  DROP CONSTRAINT IF EXISTS fk_grocery_items_list_id;

-- Drop indexes related to list_id on grocery_items
DROP INDEX IF EXISTS idx_grocery_items_list_id;
DROP INDEX IF EXISTS idx_grocery_items_list_gotten;
DROP INDEX IF EXISTS idx_grocery_items_list_category;
DROP INDEX IF EXISTS idx_grocery_items_list_created;

RAISE NOTICE 'Removed list_id constraints and indexes from grocery_items';

-- =====================================================
-- PHASE 5: Remove list_id Column from grocery_items
-- =====================================================

-- Remove list_id column from grocery_items
-- NOTE: This preserves all items, they just lose their list association
ALTER TABLE grocery_items
  DROP COLUMN IF EXISTS list_id;

RAISE NOTICE 'Removed list_id column from grocery_items table';

-- =====================================================
-- PHASE 6: Drop List Members Table
-- =====================================================

-- Drop indexes on list_members
DROP INDEX IF EXISTS idx_list_members_user_id;
DROP INDEX IF EXISTS idx_list_members_list_id;
DROP INDEX IF EXISTS idx_list_members_permission;
DROP INDEX IF EXISTS idx_list_members_joined_at;

-- Drop list_members table
DROP TABLE IF EXISTS list_members CASCADE;

RAISE NOTICE 'Dropped list_members table';

-- =====================================================
-- PHASE 7: Drop Lists Table
-- =====================================================

-- Drop indexes on lists
DROP INDEX IF EXISTS idx_lists_owner_id;
DROP INDEX IF EXISTS idx_lists_created_at;
DROP INDEX IF EXISTS idx_lists_owner_archived;
DROP INDEX IF EXISTS idx_lists_name;

-- Drop lists table
DROP TABLE IF EXISTS lists CASCADE;

RAISE NOTICE 'Dropped lists table';

-- =====================================================
-- PHASE 8: Drop Functions
-- =====================================================

-- Drop helper functions
DROP FUNCTION IF EXISTS user_has_list_access(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_list_permission(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS ensure_list_owner_membership() CASCADE;
DROP FUNCTION IF EXISTS prevent_last_owner_removal() CASCADE;
DROP FUNCTION IF EXISTS update_list_access_time(UUID, UUID) CASCADE;

RAISE NOTICE 'Dropped helper functions';

-- =====================================================
-- PHASE 9: Verification
-- =====================================================

DO $$
DECLARE
  lists_exists BOOLEAN;
  list_members_exists BOOLEAN;
  list_id_exists BOOLEAN;
  views_exist BOOLEAN;
BEGIN
  -- Check if tables still exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'lists'
  ) INTO lists_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'list_members'
  ) INTO list_members_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'grocery_items' AND column_name = 'list_id'
  ) INTO list_id_exists;

  -- Check if views still exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name IN ('user_lists_with_details', 'list_members_with_details')
  ) INTO views_exist;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Rollback Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Lists table exists: %', lists_exists;
  RAISE NOTICE 'List members table exists: %', list_members_exists;
  RAISE NOTICE 'grocery_items.list_id exists: %', list_id_exists;
  RAISE NOTICE 'Views exist: %', views_exist;
  RAISE NOTICE '========================================';

  IF lists_exists OR list_members_exists OR list_id_exists OR views_exist THEN
    RAISE WARNING 'Some objects still exist - rollback may be incomplete!';
  ELSE
    RAISE NOTICE 'Rollback completed successfully!';
    RAISE NOTICE 'Database restored to pre-list-sharing state';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PHASE 10: Final Statistics
-- =====================================================

DO $$
DECLARE
  user_count INTEGER;
  item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO item_count FROM grocery_items;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Post-Rollback Database State';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Grocery items preserved: %', item_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Notes:';
  RAISE NOTICE '  - All grocery items preserved';
  RAISE NOTICE '  - Items accessible only by owner (user_id)';
  RAISE NOTICE '  - List organization removed';
  RAISE NOTICE '  - Sharing functionality removed';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Rollback Complete
-- =====================================================

-- Final message
DO $$
BEGIN
  RAISE NOTICE 'Migration 003_add_list_sharing has been rolled back';
  RAISE NOTICE 'All list sharing tables and relationships removed';
  RAISE NOTICE 'Grocery items preserved with user ownership intact';
END $$;
