-- =====================================================
-- Migration: 006_add_list_customization
-- Description: Add color and icon fields for list visual customization
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- This migration adds:
--   1. color field to lists table (hex color code)
--   2. icon field to lists table (emoji or icon identifier)
--   3. Default values for existing lists
-- =====================================================

-- =====================================================
-- PHASE 1: Add Customization Fields to Lists Table
-- =====================================================

-- Add color field (hex color code)
ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#4caf50'
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Add icon field (emoji or icon identifier)
ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '📝';

-- Add comments for documentation
COMMENT ON COLUMN lists.color IS 'List color (hex format, e.g., #4caf50)';
COMMENT ON COLUMN lists.icon IS 'List icon (emoji or icon identifier)';

-- =====================================================
-- PHASE 2: Set Default Values for Existing Lists
-- =====================================================

-- Update existing lists with default color if NULL
UPDATE lists
SET color = '#4caf50'
WHERE color IS NULL;

-- Update existing lists with default icon if NULL
UPDATE lists
SET icon = '📝'
WHERE icon IS NULL;

-- =====================================================
-- PHASE 3: Make Fields NOT NULL
-- =====================================================

-- Now that all existing records have values, make fields NOT NULL
ALTER TABLE lists
  ALTER COLUMN color SET NOT NULL;

ALTER TABLE lists
  ALTER COLUMN icon SET NOT NULL;

-- =====================================================
-- PHASE 4: Create Index for Color-Based Queries
-- =====================================================

-- Create index for filtering/grouping by color
CREATE INDEX IF NOT EXISTS idx_lists_color ON lists(color);

-- =====================================================
-- PHASE 5: Verification and Statistics
-- =====================================================

-- Display migration statistics
DO $$
DECLARE
  list_count INTEGER;
  unique_colors INTEGER;
  unique_icons INTEGER;
BEGIN
  SELECT COUNT(*) INTO list_count FROM lists;
  SELECT COUNT(DISTINCT color) INTO unique_colors FROM lists;
  SELECT COUNT(DISTINCT icon) INTO unique_icons FROM lists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 006_add_list_customization completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total lists: %', list_count;
  RAISE NOTICE 'Unique colors: %', unique_colors;
  RAISE NOTICE 'Unique icons: %', unique_icons;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
