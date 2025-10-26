-- Migration Rollback: Remove updated_at Column from grocery_items Table
-- Description: Remove updated_at column, trigger, and index from grocery_items
-- Date: 2025-10-26

-- Drop the trigger
DROP TRIGGER IF EXISTS update_grocery_items_updated_at ON grocery_items;

-- Drop the index
DROP INDEX IF EXISTS idx_grocery_items_updated_at;

-- Drop the updated_at column
ALTER TABLE grocery_items
  DROP COLUMN IF EXISTS updated_at;
