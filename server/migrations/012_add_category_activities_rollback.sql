-- =====================================================
-- Rollback Migration: Remove Category Activity Types
-- Description: Revert list_activities table to original activity types
-- Date: 2025-10-26
-- =====================================================

-- Drop the extended constraint
ALTER TABLE list_activities DROP CONSTRAINT IF EXISTS valid_activity_action;

-- Restore the original constraint without category actions
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
    'items_bulk_deleted'
  )
);

-- Restore original comment
COMMENT ON COLUMN list_activities.details IS 'Additional details about the activity (JSON format)';

-- =====================================================
-- Rollback Complete
-- =====================================================
