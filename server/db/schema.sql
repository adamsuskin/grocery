-- =====================================================
-- Database Initialization Script
-- Description: Complete schema for grocery list application
-- =====================================================

-- =====================================================
-- PHASE 1: Create Users Table
-- =====================================================

-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

COMMENT ON TABLE users IS 'User accounts with authentication credentials';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique login identifier)';
COMMENT ON COLUMN users.name IS 'User display name';

-- =====================================================
-- PHASE 2: Create Refresh Tokens Table
-- =====================================================

-- Refresh Tokens Table for token rotation/revocation
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);

-- Create indexes for refresh_tokens table
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for authentication';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Hashed refresh token for security';
COMMENT ON COLUMN refresh_tokens.revoked IS 'Whether token has been revoked';

-- =====================================================
-- PHASE 3: Create Helper Functions
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at timestamp on row modification';

-- =====================================================
-- PHASE 4: Create Lists Table
-- =====================================================

-- Lists table for organizing grocery items
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT list_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT list_name_max_length CHECK (LENGTH(name) <= 255)
);

-- Create indexes for lists table
CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON lists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lists_owner_archived ON lists(owner_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_lists_name ON lists(name);
CREATE INDEX IF NOT EXISTS idx_lists_is_archived ON lists(is_archived);

COMMENT ON TABLE lists IS 'Grocery lists that can be shared between multiple users';
COMMENT ON COLUMN lists.id IS 'Unique list identifier (UUID)';
COMMENT ON COLUMN lists.name IS 'Display name for the list';
COMMENT ON COLUMN lists.owner_id IS 'User who created the list (has full control)';
COMMENT ON COLUMN lists.is_archived IS 'Whether the list has been archived (soft delete)';
COMMENT ON COLUMN lists.archived_at IS 'Timestamp when the list was archived (NULL if not archived)';

-- =====================================================
-- PHASE 5: Create List Members Table
-- =====================================================

-- List members table for managing shared access
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

COMMENT ON TABLE list_members IS 'Junction table for list sharing with permission levels';
COMMENT ON COLUMN list_members.list_id IS 'Foreign key to lists table';
COMMENT ON COLUMN list_members.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN list_members.permission_level IS 'Access level: owner (full control), editor (add/edit/delete items), viewer (read-only)';
COMMENT ON COLUMN list_members.joined_at IS 'When the user was added to the list';
COMMENT ON COLUMN list_members.invited_by IS 'User who invited this member (NULL if self-joined or owner)';
COMMENT ON COLUMN list_members.last_accessed_at IS 'Last time the user viewed this list';

-- =====================================================
-- PHASE 6: Create Grocery Items Table
-- =====================================================

-- Grocery items table
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  gotten BOOLEAN NOT NULL DEFAULT false,
  category VARCHAR(50) NOT NULL DEFAULT 'Other',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT item_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT quantity_positive CHECK (quantity > 0)
);

-- Create indexes for grocery_items table
CREATE INDEX IF NOT EXISTS idx_grocery_items_created_at ON grocery_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_id ON grocery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON grocery_items(list_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_category ON grocery_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_gotten ON grocery_items(user_id, gotten);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_gotten ON grocery_items(list_id, gotten);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_category ON grocery_items(list_id, category);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_created ON grocery_items(list_id, created_at DESC);

COMMENT ON TABLE grocery_items IS 'Individual grocery items belonging to lists';
COMMENT ON COLUMN grocery_items.id IS 'Unique item identifier (UUID)';
COMMENT ON COLUMN grocery_items.name IS 'Item name/description';
COMMENT ON COLUMN grocery_items.quantity IS 'Number of items needed';
COMMENT ON COLUMN grocery_items.gotten IS 'Whether the item has been purchased';
COMMENT ON COLUMN grocery_items.category IS 'Item category for organization';
COMMENT ON COLUMN grocery_items.notes IS 'Optional notes or description';
COMMENT ON COLUMN grocery_items.user_id IS 'User who created the item';
COMMENT ON COLUMN grocery_items.list_id IS 'List this item belongs to';

-- =====================================================
-- PHASE 7: Create Triggers
-- =====================================================

-- Trigger to automatically update updated_at on users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on lists table
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

COMMENT ON FUNCTION ensure_list_owner_membership IS 'Automatically add list owner to list_members with owner permission';

-- Trigger to automatically add list owner to list_members
CREATE TRIGGER ensure_list_owner_membership_trigger
  AFTER INSERT ON lists
  FOR EACH ROW
  EXECUTE FUNCTION ensure_list_owner_membership();

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

COMMENT ON FUNCTION prevent_last_owner_removal IS 'Prevent removal of the last owner from a list';

-- Trigger to prevent removing last owner
CREATE TRIGGER prevent_last_owner_removal_trigger
  BEFORE UPDATE OR DELETE ON list_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_removal();

-- =====================================================
-- PHASE 8: Create Helper Functions
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
-- PHASE 9: Create Views
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
  l.archived_at,
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
-- PHASE 10: Create List Activities Table
-- =====================================================

-- List activities table for tracking list actions
CREATE TABLE IF NOT EXISTS list_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: action must be one of the valid values
  CONSTRAINT valid_activity_action CHECK (
    action IN (
      'list_created',
      'list_renamed',
      'list_deleted',
      'list_archived',
      'list_unarchived',
      'list_shared',
      'member_added',
      'member_removed',
      'member_permission_changed',
      'item_added',
      'item_updated',
      'item_deleted',
      'item_checked',
      'item_unchecked',
      'items_cleared',
      'items_bulk_deleted'
    )
  )
);

-- Create indexes for list_activities table
CREATE INDEX IF NOT EXISTS idx_list_activities_list_id ON list_activities(list_id);
CREATE INDEX IF NOT EXISTS idx_list_activities_user_id ON list_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_list_activities_created_at ON list_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_list_activities_list_created ON list_activities(list_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_list_activities_action ON list_activities(action);

COMMENT ON TABLE list_activities IS 'Activity log for list actions and changes';
COMMENT ON COLUMN list_activities.id IS 'Unique activity identifier (UUID)';
COMMENT ON COLUMN list_activities.list_id IS 'List this activity belongs to';
COMMENT ON COLUMN list_activities.user_id IS 'User who performed the action';
COMMENT ON COLUMN list_activities.action IS 'Type of action performed';
COMMENT ON COLUMN list_activities.details IS 'Additional details about the activity (JSON format)';
COMMENT ON COLUMN list_activities.created_at IS 'When the activity occurred';

-- =====================================================
-- PHASE 11: Create Activity Helper Functions
-- =====================================================

-- Function to log list activities
CREATE OR REPLACE FUNCTION log_list_activity(
  p_list_id UUID,
  p_user_id UUID,
  p_action VARCHAR(50),
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO list_activities (list_id, user_id, action, details)
  VALUES (p_list_id, p_user_id, p_action, p_details)
  RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_list_activity IS 'Helper function to log list activities';

-- =====================================================
-- PHASE 12: Create Activity Views
-- =====================================================

-- View for activities with user details
CREATE OR REPLACE VIEW list_activities_with_details AS
SELECT
  la.id,
  la.list_id,
  la.user_id,
  la.action,
  la.details,
  la.created_at,
  json_build_object(
    'id', u.id,
    'email', u.email,
    'name', u.name
  ) as user,
  l.name as list_name
FROM list_activities la
JOIN users u ON la.user_id = u.id
JOIN lists l ON la.list_id = l.id
ORDER BY la.created_at DESC;

COMMENT ON VIEW list_activities_with_details IS 'List activities with user and list details';

-- =====================================================
-- PHASE 15: Create List Pins Table
-- =====================================================

-- List pins table for pinning favorite lists
CREATE TABLE IF NOT EXISTS list_pins (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Primary key: composite of user_id and list_id
  PRIMARY KEY (user_id, list_id)
);

-- Create indexes for list_pins table
CREATE INDEX IF NOT EXISTS idx_list_pins_user_id ON list_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_list_pins_list_id ON list_pins(list_id);
CREATE INDEX IF NOT EXISTS idx_list_pins_user_pinned_at ON list_pins(user_id, pinned_at DESC);

COMMENT ON TABLE list_pins IS 'User pinned lists for quick access';
COMMENT ON COLUMN list_pins.user_id IS 'User who pinned the list';
COMMENT ON COLUMN list_pins.list_id IS 'List that was pinned';
COMMENT ON COLUMN list_pins.pinned_at IS 'When the list was pinned';

-- =====================================================
-- Schema Initialization Complete
-- =====================================================
