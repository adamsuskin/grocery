-- =====================================================
-- Migration: Add list archive support
-- Description: Add archived_at timestamp field for archiving lists
-- =====================================================

-- Add archived_at timestamp field to lists table
ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for filtering archived lists
CREATE INDEX IF NOT EXISTS idx_lists_is_archived ON lists(is_archived);

-- Add comment for documentation
COMMENT ON COLUMN lists.archived_at IS 'Timestamp when the list was archived (NULL if not archived)';
