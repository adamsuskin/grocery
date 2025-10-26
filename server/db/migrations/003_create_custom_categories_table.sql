-- =====================================================
-- Migration 003: Create Custom Categories Table
-- Description: Adds custom category support for grocery lists
-- =====================================================

-- =====================================================
-- Create Custom Categories Table
-- =====================================================

-- Custom categories table for user-defined item categories
CREATE TABLE IF NOT EXISTS custom_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT category_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT category_name_max_length CHECK (LENGTH(name) <= 100),
  CONSTRAINT unique_category_per_list UNIQUE (list_id, LOWER(name))
);

-- Create indexes for custom_categories table
CREATE INDEX IF NOT EXISTS idx_custom_categories_list_id ON custom_categories(list_id);
CREATE INDEX IF NOT EXISTS idx_custom_categories_created_by ON custom_categories(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_categories_created_at ON custom_categories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_categories_display_order ON custom_categories(list_id, display_order DESC);

COMMENT ON TABLE custom_categories IS 'User-defined custom categories for organizing grocery items within lists';
COMMENT ON COLUMN custom_categories.id IS 'Unique category identifier (UUID)';
COMMENT ON COLUMN custom_categories.name IS 'Category name (max 100 characters, case-insensitive unique per list)';
COMMENT ON COLUMN custom_categories.list_id IS 'List this category belongs to (cascade delete when list is deleted)';
COMMENT ON COLUMN custom_categories.created_by IS 'User who created this category (NULL if user is deleted)';
COMMENT ON COLUMN custom_categories.color IS 'Optional hex color code for category visualization (e.g., #FF5733)';
COMMENT ON COLUMN custom_categories.icon IS 'Optional emoji or icon identifier for visual representation';
COMMENT ON COLUMN custom_categories.display_order IS 'Display priority order (higher numbers appear first, 0 is default)';
COMMENT ON COLUMN custom_categories.created_at IS 'When the category was created';
COMMENT ON COLUMN custom_categories.updated_at IS 'When the category was last updated';

-- =====================================================
-- Create Triggers
-- =====================================================

-- Trigger to automatically update updated_at on custom_categories table
CREATE TRIGGER update_custom_categories_updated_at
  BEFORE UPDATE ON custom_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration Complete
-- =====================================================
