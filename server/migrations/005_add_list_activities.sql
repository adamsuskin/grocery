-- =====================================================
-- Migration: Add List Activities Tracking
-- Description: Create table for tracking list actions and activities
-- Date: 2025-10-26
-- =====================================================

-- Create list_activities table
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

-- Add comments for documentation
COMMENT ON TABLE list_activities IS 'Activity log for list actions and changes';
COMMENT ON COLUMN list_activities.id IS 'Unique activity identifier (UUID)';
COMMENT ON COLUMN list_activities.list_id IS 'List this activity belongs to';
COMMENT ON COLUMN list_activities.user_id IS 'User who performed the action';
COMMENT ON COLUMN list_activities.action IS 'Type of action performed';
COMMENT ON COLUMN list_activities.details IS 'Additional details about the activity (JSON format)';
COMMENT ON COLUMN list_activities.created_at IS 'When the activity occurred';

-- Create helper function to log activities
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

-- Create view for activities with user details
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
-- Migration Complete
-- =====================================================
