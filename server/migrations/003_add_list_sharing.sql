-- =====================================================
-- Migration: 003_add_list_sharing
-- Description: Add multi-user list sharing functionality
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- This migration adds:
--   1. Lists table for organizing grocery items
--   2. List_members table for managing shared access
--   3. Permission levels (owner/editor/viewer)
--   4. list_id column to grocery_items table
--   5. Migration of existing items to user-specific lists
--   6. All necessary indexes, constraints, and triggers
-- =====================================================

-- =====================================================
-- PHASE 1: Create Lists Table
-- =====================================================

-- Create lists table for organizing grocery items
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Constraints
  CONSTRAINT list_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT list_name_max_length CHECK (LENGTH(name) <= 255)
);

-- Create indexes for lists table
CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON lists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lists_owner_archived ON lists(owner_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_lists_name ON lists(name);

-- Add comments for documentation
COMMENT ON TABLE lists IS 'Grocery lists that can be shared between multiple users';
COMMENT ON COLUMN lists.id IS 'Unique list identifier (UUID)';
COMMENT ON COLUMN lists.name IS 'Display name for the list (e.g., "Weekly Shopping", "Party Supplies")';
COMMENT ON COLUMN lists.owner_id IS 'User who created the list (has full control)';
COMMENT ON COLUMN lists.is_archived IS 'Whether the list has been archived (soft delete)';

-- =====================================================
-- PHASE 2: Create List Members Table
-- =====================================================

-- Create list_members table for managing shared access
CREATE TABLE IF NOT EXISTS list_members (
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE,

  -- Primary key: composite of list_id and user_id
  PRIMARY KEY (list_id, user_id),

  -- Constraint: permission_level must be one of the valid values
  CONSTRAINT valid_permission_level CHECK (
    permission_level IN ('owner', 'editor', 'viewer')
  )
);

-- Create indexes for list_members table
CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON list_members(user_id);
CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_permission ON list_members(list_id, permission_level);
CREATE INDEX IF NOT EXISTS idx_list_members_joined_at ON list_members(joined_at DESC);

-- Add comments for documentation
COMMENT ON TABLE list_members IS 'Junction table for list sharing with permission levels';
COMMENT ON COLUMN list_members.list_id IS 'Foreign key to lists table';
COMMENT ON COLUMN list_members.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN list_members.permission_level IS 'Access level: owner (full control), editor (add/edit/delete items), viewer (read-only)';
COMMENT ON COLUMN list_members.joined_at IS 'When the user was added to the list';
COMMENT ON COLUMN list_members.invited_by IS 'User who invited this member (NULL if self-joined or owner)';
COMMENT ON COLUMN list_members.last_accessed_at IS 'Last time the user viewed this list';

-- =====================================================
-- PHASE 3: Add Triggers for Lists Table
-- =====================================================

-- Apply updated_at trigger to lists table
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 4: Modify grocery_items Table
-- =====================================================

-- Add list_id column to grocery_items table (nullable initially)
ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS list_id UUID;

-- Create index for list_id before adding foreign key
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON grocery_items(list_id);

-- Add foreign key constraint
ALTER TABLE grocery_items
  ADD CONSTRAINT fk_grocery_items_list_id
  FOREIGN KEY (list_id)
  REFERENCES lists(id)
  ON DELETE CASCADE;

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_gotten ON grocery_items(list_id, gotten);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_category ON grocery_items(list_id, category);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_created ON grocery_items(list_id, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN grocery_items.list_id IS 'Foreign key to lists table (which list this item belongs to)';

-- =====================================================
-- PHASE 5: Migrate Existing Data
-- =====================================================

-- Create a default list for each user with existing grocery items
DO $$
DECLARE
  user_record RECORD;
  new_list_id UUID;
  items_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migrating existing grocery items to lists...';
  RAISE NOTICE '========================================';

  -- Loop through each user who has grocery items
  FOR user_record IN
    SELECT DISTINCT user_id, u.name
    FROM grocery_items gi
    JOIN users u ON gi.user_id = u.id
    WHERE gi.list_id IS NULL
  LOOP
    -- Create a default list for this user
    INSERT INTO lists (name, owner_id)
    VALUES ('My Grocery List', user_record.user_id)
    RETURNING id INTO new_list_id;

    -- Add the user as owner in list_members
    INSERT INTO list_members (list_id, user_id, permission_level)
    VALUES (new_list_id, user_record.user_id, 'owner');

    -- Assign all their items to this list
    UPDATE grocery_items
    SET list_id = new_list_id
    WHERE user_id = user_record.user_id AND list_id IS NULL;

    -- Count migrated items
    SELECT COUNT(*) INTO items_count
    FROM grocery_items
    WHERE list_id = new_list_id;

    RAISE NOTICE 'Created default list for user "%" (%) - % items migrated',
      user_record.name, user_record.user_id, items_count;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration of existing items completed';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PHASE 6: Make list_id NOT NULL
-- =====================================================

-- Now that all items have been migrated, make list_id required
-- Check if there are any orphaned items first
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM grocery_items
  WHERE list_id IS NULL;

  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned grocery items without list_id!', orphaned_count;
    RAISE EXCEPTION 'Cannot proceed: orphaned items detected. Please investigate.';
  END IF;
END $$;

-- Make list_id NOT NULL
ALTER TABLE grocery_items
  ALTER COLUMN list_id SET NOT NULL;

RAISE NOTICE 'Made list_id column NOT NULL on grocery_items';

-- =====================================================
-- PHASE 7: Create Helper Functions
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
  permission VARCHAR(20);
BEGIN
  SELECT permission_level INTO permission
  FROM list_members
  WHERE list_id = p_list_id
    AND user_id = p_user_id;

  RETURN permission;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_list_permission IS 'Get the permission level (owner/editor/viewer) for a user on a specific list';

-- Function to ensure list owner always has an 'owner' entry in list_members
CREATE OR REPLACE FUNCTION ensure_list_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new list is created, automatically add owner to list_members
  INSERT INTO list_members (list_id, user_id, permission_level)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (list_id, user_id) DO UPDATE
    SET permission_level = 'owner';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically add list owner to list_members
CREATE TRIGGER ensure_list_owner_membership_trigger
  AFTER INSERT ON lists
  FOR EACH ROW
  EXECUTE FUNCTION ensure_list_owner_membership();

COMMENT ON FUNCTION ensure_list_owner_membership IS 'Automatically add list owner to list_members with owner permission';

-- Function to prevent removing the last owner from a list
CREATE OR REPLACE FUNCTION prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  -- If trying to delete or change permission from owner
  IF (TG_OP = 'DELETE' AND OLD.permission_level = 'owner') OR
     (TG_OP = 'UPDATE' AND OLD.permission_level = 'owner' AND NEW.permission_level != 'owner') THEN

    -- Count remaining owners for this list
    SELECT COUNT(*) INTO owner_count
    FROM list_members
    WHERE list_id = COALESCE(NEW.list_id, OLD.list_id)
      AND permission_level = 'owner'
      AND (TG_OP = 'DELETE' OR user_id != NEW.user_id);

    -- Prevent if this is the last owner
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner from a list. Transfer ownership first or delete the list.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent removing last owner
CREATE TRIGGER prevent_last_owner_removal_trigger
  BEFORE UPDATE OR DELETE ON list_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_removal();

COMMENT ON FUNCTION prevent_last_owner_removal IS 'Prevent removal of the last owner from a list';

-- Function to update last_accessed_at timestamp
CREATE OR REPLACE FUNCTION update_list_access_time(
  p_user_id UUID,
  p_list_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE list_members
  SET last_accessed_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id
    AND list_id = p_list_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_list_access_time IS 'Update the last_accessed_at timestamp when a user views a list';

-- =====================================================
-- PHASE 8: Create Views for Easy Querying
-- =====================================================

-- View for getting all lists a user has access to with member count
CREATE OR REPLACE VIEW user_lists_with_details AS
SELECT
  l.id AS list_id,
  l.name AS list_name,
  l.owner_id,
  l.created_at,
  l.updated_at,
  l.is_archived,
  lm.user_id,
  lm.permission_level,
  lm.joined_at,
  lm.last_accessed_at,
  u.name AS owner_name,
  u.email AS owner_email,
  (SELECT COUNT(*) FROM list_members WHERE list_id = l.id) AS member_count,
  (SELECT COUNT(*) FROM grocery_items WHERE list_id = l.id) AS item_count,
  (SELECT COUNT(*) FROM grocery_items WHERE list_id = l.id AND gotten = false) AS active_item_count
FROM lists l
JOIN list_members lm ON l.id = lm.list_id
JOIN users u ON l.owner_id = u.id;

COMMENT ON VIEW user_lists_with_details IS 'Comprehensive view of all lists with member details, counts, and permissions';

-- View for list members with user details
CREATE OR REPLACE VIEW list_members_with_details AS
SELECT
  lm.list_id,
  lm.user_id,
  lm.permission_level,
  lm.joined_at,
  lm.last_accessed_at,
  lm.invited_by,
  u.name AS user_name,
  u.email AS user_email,
  inviter.name AS invited_by_name,
  l.name AS list_name,
  l.owner_id AS list_owner_id
FROM list_members lm
JOIN users u ON lm.user_id = u.id
JOIN lists l ON lm.list_id = l.id
LEFT JOIN users inviter ON lm.invited_by = inviter.id;

COMMENT ON VIEW list_members_with_details IS 'List members with full user details and invitation information';

-- =====================================================
-- PHASE 9: Verification and Statistics
-- =====================================================

-- Display migration statistics
DO $$
DECLARE
  list_count INTEGER;
  member_count INTEGER;
  item_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO list_count FROM lists;
  SELECT COUNT(*) INTO member_count FROM list_members;
  SELECT COUNT(*) INTO item_count FROM grocery_items;
  SELECT COUNT(*) INTO user_count FROM users;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 003_add_list_sharing completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Database Statistics:';
  RAISE NOTICE '  Users: %', user_count;
  RAISE NOTICE '  Lists created: %', list_count;
  RAISE NOTICE '  List members: %', member_count;
  RAISE NOTICE '  Grocery items: %', item_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'New Features:';
  RAISE NOTICE '  - Multi-user list sharing enabled';
  RAISE NOTICE '  - Permission levels: owner, editor, viewer';
  RAISE NOTICE '  - All existing items migrated to user lists';
  RAISE NOTICE '  - Helper functions and views created';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
