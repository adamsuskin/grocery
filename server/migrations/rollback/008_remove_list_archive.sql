-- =====================================================
-- Rollback Migration: Remove list archive support
-- Description: Remove archived_at field and related indexes
-- =====================================================

-- Drop index
DROP INDEX IF EXISTS idx_lists_is_archived;

-- Remove archived_at column from lists table
ALTER TABLE lists
  DROP COLUMN IF EXISTS archived_at;
