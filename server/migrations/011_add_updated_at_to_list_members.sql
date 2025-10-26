-- Migration: Add updated_at Column to list_members Table
-- Description: Add updated_at timestamp column with automatic updates via trigger
-- Date: 2025-10-26

-- Add updated_at column to list_members table
ALTER TABLE list_members
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows with joined_at value
UPDATE list_members
  SET updated_at = joined_at
  WHERE updated_at IS NULL OR updated_at = CURRENT_TIMESTAMP;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_list_members_updated_at
  BEFORE UPDATE ON list_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance on updated_at queries
CREATE INDEX IF NOT EXISTS idx_list_members_updated_at ON list_members(updated_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN list_members.updated_at IS 'Timestamp of when the list member record was last updated';
