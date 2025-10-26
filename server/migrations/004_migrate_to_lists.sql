-- =====================================================
-- Migration: 004_migrate_to_lists
-- Description: Migrate from user-based items to list-based items
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- This migration transforms the data model from user-owned items
-- to list-owned items, creating a default "My Grocery List" for
-- each existing user and migrating their items to that list.
--
-- PREREQUISITES:
--   - Users table exists with id column
--   - grocery_items table exists with user_id column
--   - Lists table structure defined (created by migration 002/003)
--
-- WHAT THIS MIGRATION DOES:
--   1. Creates lists table (if not exists)
--   2. Creates list_members table (if not exists)
--   3. Creates a default list for each existing user
--   4. Adds each user as owner of their default list
--   5. Updates grocery_items to set list_id to user's default list
--   6. Makes list_id NOT NULL after migration
--   7. Creates helper functions and indexes
-- =====================================================

-- =====================================================
-- PHASE 1: Create Lists Table (Idempotent)
-- =====================================================

-- Create lists table if it doesn't exist
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT list_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create indexes for lists table
CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON lists(created_at DESC);

-- Add table comments for documentation
COMMENT ON TABLE lists IS 'Grocery lists that can be shared between users';
COMMENT ON COLUMN lists.id IS 'Unique list identifier (UUID)';
COMMENT ON COLUMN lists.name IS 'Display name for the list';
COMMENT ON COLUMN lists.owner_id IS 'User who created and owns the list';

-- Apply updated_at trigger to lists table (if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_lists_updated_at ON lists;
    CREATE TRIGGER update_lists_updated_at
      BEFORE UPDATE ON lists
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- PHASE 2: Create List Members Table (Idempotent)
-- =====================================================

-- Create list_members table for managing list access
CREATE TABLE IF NOT EXISTS list_members (
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'admin',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Primary key: composite of list_id and user_id
  PRIMARY KEY (list_id, user_id),

  -- Constraint: permission must be one of the valid values
  CONSTRAINT valid_permission CHECK (permission IN ('admin', 'edit', 'view'))
);

-- Create indexes for list_members table
CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON list_members(user_id);
CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_permission ON list_members(list_id, permission);

-- Add table comments for documentation
COMMENT ON TABLE list_members IS 'User membership and permissions for lists';
COMMENT ON COLUMN list_members.list_id IS 'Foreign key to lists table';
COMMENT ON COLUMN list_members.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN list_members.permission IS 'User permission level: admin (full control), edit (add/edit/delete items), or view (read-only)';

-- =====================================================
-- PHASE 3: Add list_id Column to grocery_items
-- =====================================================

-- Add list_id column to grocery_items table (nullable initially for migration)
ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS list_id UUID;

-- Create index for list_id
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON grocery_items(list_id);

-- Add foreign key constraint (will be enforced after data migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_grocery_items_list_id'
      AND table_name = 'grocery_items'
  ) THEN
    ALTER TABLE grocery_items
      ADD CONSTRAINT fk_grocery_items_list_id
      FOREIGN KEY (list_id)
      REFERENCES lists(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_gotten ON grocery_items(list_id, gotten);

-- Add column comment
COMMENT ON COLUMN grocery_items.list_id IS 'Foreign key to lists table (which list this item belongs to)';

-- =====================================================
-- PHASE 4: Migrate Existing Users and Items to Lists
-- =====================================================

-- This is the core migration logic
-- For each user: create a default list, add them as admin, migrate their items
DO $$
DECLARE
  user_record RECORD;
  new_list_id UUID;
  items_migrated INTEGER;
  total_users INTEGER := 0;
  total_lists_created INTEGER := 0;
  total_items_migrated INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting Migration 004: Migrate to Lists';
  RAISE NOTICE '========================================';

  -- Count total users
  SELECT COUNT(*) INTO total_users FROM users;
  RAISE NOTICE 'Found % users to migrate', total_users;

  -- Loop through each existing user
  FOR user_record IN SELECT id, name, email FROM users ORDER BY created_at
  LOOP
    -- Check if user already has a default list (idempotent)
    SELECT id INTO new_list_id
    FROM lists
    WHERE owner_id = user_record.id
      AND name = 'My Grocery List'
    LIMIT 1;

    -- If no default list exists, create one
    IF new_list_id IS NULL THEN
      INSERT INTO lists (name, owner_id)
      VALUES ('My Grocery List', user_record.id)
      RETURNING id INTO new_list_id;

      total_lists_created := total_lists_created + 1;

      RAISE NOTICE 'Created default list for user: % (%) - List ID: %',
        user_record.name, user_record.email, new_list_id;
    ELSE
      RAISE NOTICE 'Default list already exists for user: % (%)',
        user_record.name, user_record.email;
    END IF;

    -- Add user as admin member of their list (idempotent with ON CONFLICT)
    INSERT INTO list_members (list_id, user_id, permission)
    VALUES (new_list_id, user_record.id, 'admin')
    ON CONFLICT (list_id, user_id) DO UPDATE
      SET permission = 'admin';

    -- Migrate all grocery items that belong to this user but don't have a list_id
    UPDATE grocery_items
    SET list_id = new_list_id
    WHERE user_id = user_record.id
      AND list_id IS NULL;

    -- Count how many items were migrated for this user
    GET DIAGNOSTICS items_migrated = ROW_COUNT;

    IF items_migrated > 0 THEN
      total_items_migrated := total_items_migrated + items_migrated;
      RAISE NOTICE '  -> Migrated % items to list', items_migrated;
    END IF;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Users processed: %', total_users;
  RAISE NOTICE '  New lists created: %', total_lists_created;
  RAISE NOTICE '  Items migrated: %', total_items_migrated;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PHASE 5: Verify Migration and Make list_id Required
-- =====================================================

-- Check for any orphaned items (items without a list_id)
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM grocery_items
  WHERE list_id IS NULL;

  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned grocery items without list_id!', orphaned_count;
    RAISE EXCEPTION 'Migration incomplete: Cannot proceed with orphaned items. Please investigate.';
  ELSE
    RAISE NOTICE 'Verification passed: All grocery items have been assigned to lists';
  END IF;
END $$;

-- Now that all items are migrated, make list_id NOT NULL
-- First check if it's already NOT NULL (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'grocery_items'
      AND column_name = 'list_id'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE grocery_items
      ALTER COLUMN list_id SET NOT NULL;
    RAISE NOTICE 'Set list_id column to NOT NULL';
  ELSE
    RAISE NOTICE 'list_id column is already NOT NULL';
  END IF;
END $$;

-- =====================================================
-- PHASE 6: Create Helper Functions
-- =====================================================

-- Function to check if a user has access to a list
CREATE OR REPLACE FUNCTION user_has_list_access(
  p_user_id UUID,
  p_list_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM list_members
    WHERE list_id = p_list_id
      AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_has_list_access IS 'Check if a user has any level of access to a list';

-- Function to get user's permission level for a list
CREATE OR REPLACE FUNCTION get_user_list_permission(
  p_user_id UUID,
  p_list_id UUID
)
RETURNS VARCHAR(20) AS $$
DECLARE
  user_permission VARCHAR(20);
BEGIN
  SELECT permission INTO user_permission
  FROM list_members
  WHERE list_id = p_list_id
    AND user_id = p_user_id;

  RETURN COALESCE(user_permission, 'none');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_list_permission IS 'Get the permission level (admin/edit/view) for a user on a specific list';

-- Function to get all lists accessible by a user
CREATE OR REPLACE FUNCTION get_user_lists(p_user_id UUID)
RETURNS TABLE (
  list_id UUID,
  list_name VARCHAR(255),
  owner_id UUID,
  permission VARCHAR(20),
  item_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    l.owner_id,
    lm.permission,
    COUNT(gi.id) AS item_count,
    l.created_at
  FROM lists l
  INNER JOIN list_members lm ON l.id = lm.list_id
  LEFT JOIN grocery_items gi ON l.id = gi.list_id
  WHERE lm.user_id = p_user_id
  GROUP BY l.id, l.name, l.owner_id, lm.permission, l.created_at
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_lists IS 'Get all lists accessible by a user with item counts';

-- =====================================================
-- PHASE 7: Final Statistics and Verification
-- =====================================================

DO $$
DECLARE
  list_count INTEGER;
  member_count INTEGER;
  item_count INTEGER;
  user_count INTEGER;
  items_without_list INTEGER;
BEGIN
  -- Gather statistics
  SELECT COUNT(*) INTO list_count FROM lists;
  SELECT COUNT(*) INTO member_count FROM list_members;
  SELECT COUNT(*) INTO item_count FROM grocery_items;
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO items_without_list FROM grocery_items WHERE list_id IS NULL;

  -- Display final statistics
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 004_migrate_to_lists completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Final Database Statistics:';
  RAISE NOTICE '  Total users: %', user_count;
  RAISE NOTICE '  Total lists: %', list_count;
  RAISE NOTICE '  Total list members: %', member_count;
  RAISE NOTICE '  Total grocery items: %', item_count;
  RAISE NOTICE '  Orphaned items: %', items_without_list;
  RAISE NOTICE '========================================';

  IF items_without_list = 0 THEN
    RAISE NOTICE 'SUCCESS: All items successfully migrated to lists';
  ELSE
    RAISE WARNING 'WARNING: % items still without list assignment', items_without_list;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'What changed:';
  RAISE NOTICE '  - Each user now has a "My Grocery List" default list';
  RAISE NOTICE '  - All existing items assigned to their owner''s list';
  RAISE NOTICE '  - list_id is now required on grocery_items';
  RAISE NOTICE '  - Helper functions created for list access control';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Migration 004 Complete
-- =====================================================
