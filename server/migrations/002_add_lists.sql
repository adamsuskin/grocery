-- =====================================================
-- Migration: 002_add_lists
-- Description: Add lists and list membership for collaborative grocery lists
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- This migration adds:
--   1. Lists table for creating named grocery lists
--   2. List_members table for tracking list ownership and permissions
--   3. Migrate existing grocery_items to default lists per user
--   4. All necessary indexes and constraints
-- =====================================================

-- =====================================================
-- PHASE 1: Create Lists Table
-- =====================================================

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Name validation
  CONSTRAINT name_not_empty CHECK (TRIM(name) <> '')
);

-- Create indexes for lists table
CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON lists(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE lists IS 'Grocery lists that can be shared between users';
COMMENT ON COLUMN lists.id IS 'Unique list identifier (UUID)';
COMMENT ON COLUMN lists.name IS 'Display name for the list';
COMMENT ON COLUMN lists.owner_id IS 'User who created and owns the list';

-- Apply trigger to lists table for updated_at
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 2: Create List Members Table
-- =====================================================

-- Create list_members table for managing list access
CREATE TABLE IF NOT EXISTS list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'view',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure a user can only be added to a list once
  CONSTRAINT unique_list_member UNIQUE (list_id, user_id),

  -- Permission validation (view, edit, admin)
  CONSTRAINT valid_permission CHECK (permission IN ('view', 'edit', 'admin'))
);

-- Create indexes for list_members table
CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON list_members(user_id);
CREATE INDEX IF NOT EXISTS idx_list_members_permission ON list_members(list_id, permission);

-- Add comment for documentation
COMMENT ON TABLE list_members IS 'User membership and permissions for lists';
COMMENT ON COLUMN list_members.list_id IS 'Foreign key to lists table';
COMMENT ON COLUMN list_members.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN list_members.permission IS 'User permission level: view, edit, or admin';

-- =====================================================
-- PHASE 3: Modify grocery_items Table
-- =====================================================

-- Add list_id column to grocery_items table (nullable initially)
ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS list_id UUID;

-- Create foreign key constraint for list_id (will be set later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_grocery_items_list_id'
  ) THEN
    ALTER TABLE grocery_items
      ADD CONSTRAINT fk_grocery_items_list_id
      FOREIGN KEY (list_id)
      REFERENCES lists(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for grocery_items with list_id
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON grocery_items(list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_gotten ON grocery_items(list_id, gotten);

-- Add comment for documentation
COMMENT ON COLUMN grocery_items.list_id IS 'Foreign key to lists table (which list this item belongs to)';

-- =====================================================
-- PHASE 4: Create Default Lists for Existing Users
-- =====================================================

-- Create a default "My Grocery List" for each user
DO $$
DECLARE
  user_record RECORD;
  new_list_id UUID;
BEGIN
  -- Loop through all users
  FOR user_record IN SELECT id, name FROM users
  LOOP
    -- Create default list for this user
    INSERT INTO lists (name, owner_id)
    VALUES ('My Grocery List', user_record.id)
    RETURNING id INTO new_list_id;

    -- Add owner as admin member of their list
    INSERT INTO list_members (list_id, user_id, permission)
    VALUES (new_list_id, user_record.id, 'admin');

    -- Assign all existing grocery items for this user to their default list
    UPDATE grocery_items
    SET list_id = new_list_id
    WHERE user_id = user_record.id AND list_id IS NULL;

    RAISE NOTICE 'Created default list for user: % (ID: %)', user_record.name, user_record.id;
  END LOOP;

  RAISE NOTICE 'Default lists created for all users';
END $$;

-- Now make list_id NOT NULL since all items should belong to a list
ALTER TABLE grocery_items
  ALTER COLUMN list_id SET NOT NULL;

-- =====================================================
-- PHASE 5: Create Helper Functions
-- =====================================================

-- Function to check if user is a member of a list
CREATE OR REPLACE FUNCTION is_list_member(p_list_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM list_members
    WHERE list_id = p_list_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is the owner of a list
CREATE OR REPLACE FUNCTION is_list_owner(p_list_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM lists
    WHERE id = p_list_id AND owner_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's permission level for a list
CREATE OR REPLACE FUNCTION get_list_permission(p_list_id UUID, p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  user_permission VARCHAR;
BEGIN
  -- Check if user is owner first (owners always have admin permission)
  IF is_list_owner(p_list_id, p_user_id) THEN
    RETURN 'admin';
  END IF;

  -- Get user's permission from list_members
  SELECT permission INTO user_permission
  FROM list_members
  WHERE list_id = p_list_id AND user_id = p_user_id;

  RETURN COALESCE(user_permission, 'none');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 6: Verification and Statistics
-- =====================================================

-- Display migration statistics
DO $$
DECLARE
  list_count INTEGER;
  member_count INTEGER;
  item_count INTEGER;
  orphaned_items INTEGER;
BEGIN
  SELECT COUNT(*) INTO list_count FROM lists;
  SELECT COUNT(*) INTO member_count FROM list_members;
  SELECT COUNT(*) INTO item_count FROM grocery_items;
  SELECT COUNT(*) INTO orphaned_items FROM grocery_items WHERE list_id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 002_add_lists completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Lists created: %', list_count;
  RAISE NOTICE 'List members: %', member_count;
  RAISE NOTICE 'Grocery items found: %', item_count;
  RAISE NOTICE 'Orphaned items: %', orphaned_items;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
