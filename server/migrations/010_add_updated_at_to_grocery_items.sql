-- Migration: Add updated_at Column to grocery_items Table
-- Description: Add updated_at timestamp column with automatic updates via trigger
-- Date: 2025-10-26

-- Add updated_at column to grocery_items table
ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows: set updated_at to created_at value
UPDATE grocery_items
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on updated_at for performance
CREATE INDEX IF NOT EXISTS idx_grocery_items_updated_at ON grocery_items(updated_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN grocery_items.updated_at IS 'Timestamp of last modification to the grocery item';
