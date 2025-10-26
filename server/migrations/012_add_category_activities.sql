-- =====================================================
-- Migration: Add Category Activity Types
-- Description: Extend list_activities table to support category tracking
-- Date: 2025-10-26
-- =====================================================

-- Drop the existing constraint
ALTER TABLE list_activities DROP CONSTRAINT IF EXISTS valid_activity_action;

-- Add the new constraint with category actions
ALTER TABLE list_activities ADD CONSTRAINT valid_activity_action CHECK (
  action IN (
    'list_created',
    'list_renamed',
    'list_deleted',
    'list_archived',
    'list_unarchived',
    'list_shared',
    'member_added',
    'member_removed',
    'member_permission_changed',
    'ownership_transferred',
    'item_added',
    'item_updated',
    'item_deleted',
    'item_checked',
    'item_unchecked',
    'items_cleared',
    'items_bulk_deleted',
    'category_created',
    'category_updated',
    'category_archived',
    'category_restored',
    'category_deleted',
    'category_merged'
  )
);

-- Add comment about category activity details format
COMMENT ON COLUMN list_activities.details IS 'Additional details about the activity (JSON format).
For category activities:
{
  "category_id": "uuid",
  "category_name": "string",
  "changes": [
    {
      "field": "name" | "color" | "icon" | "display_order",
      "old_value": "string",
      "new_value": "string"
    }
  ],
  "merged_into": "category_id" (for merge operations),
  "source_categories": ["category_id"] (for merge operations)
}';

-- =====================================================
-- Migration Complete
-- =====================================================
