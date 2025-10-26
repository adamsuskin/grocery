-- Migration Rollback: Remove updated_at Column from list_members Table
-- Description: Remove updated_at column and associated trigger/index
-- Date: 2025-10-26

-- Drop the trigger
DROP TRIGGER IF EXISTS update_list_members_updated_at ON list_members;

-- Drop the index
DROP INDEX IF EXISTS idx_list_members_updated_at;

-- Drop the updated_at column
ALTER TABLE list_members
  DROP COLUMN IF EXISTS updated_at;
