-- =====================================================
-- Migration 004: Add Archive Support to Custom Categories
-- Description: Adds is_archived and archived_at columns for soft deletion
-- =====================================================

-- =====================================================
-- Add Archive Columns to Custom Categories
-- =====================================================

-- Add is_archived column (default FALSE for existing records)
ALTER TABLE custom_categories
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Add archived_at column (nullable, only set when archived)
ALTER TABLE custom_categories
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficiently querying non-archived categories
CREATE INDEX IF NOT EXISTS idx_custom_categories_is_archived
ON custom_categories(list_id, is_archived)
WHERE is_archived = FALSE;

-- Create index for archived categories with timestamp
CREATE INDEX IF NOT EXISTS idx_custom_categories_archived_at
ON custom_categories(archived_at DESC)
WHERE archived_at IS NOT NULL;

COMMENT ON COLUMN custom_categories.is_archived IS 'Soft delete flag - archived categories are hidden by default but can be restored';
COMMENT ON COLUMN custom_categories.archived_at IS 'Timestamp when the category was archived (NULL if not archived)';

-- =====================================================
-- Migration Complete
-- =====================================================
