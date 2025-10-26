-- Migration Rollback: Remove List Pins Table
-- Description: Remove list pins functionality
-- Date: 2025-10-26

-- Drop indexes first
DROP INDEX IF EXISTS idx_list_pins_user_pinned_at;
DROP INDEX IF EXISTS idx_list_pins_list_id;
DROP INDEX IF EXISTS idx_list_pins_user_id;

-- Drop the table
DROP TABLE IF EXISTS list_pins;
