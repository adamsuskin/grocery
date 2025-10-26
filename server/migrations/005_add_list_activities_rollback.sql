-- =====================================================
-- Rollback Migration: Remove List Activities Tracking
-- Description: Drop activities table and related objects
-- Date: 2025-10-26
-- =====================================================

-- Drop view
DROP VIEW IF EXISTS list_activities_with_details;

-- Drop helper function
DROP FUNCTION IF EXISTS log_list_activity(UUID, UUID, VARCHAR, JSONB);

-- Drop indexes (will be automatically dropped with table, but explicit for clarity)
DROP INDEX IF EXISTS idx_list_activities_list_id;
DROP INDEX IF EXISTS idx_list_activities_user_id;
DROP INDEX IF EXISTS idx_list_activities_created_at;
DROP INDEX IF EXISTS idx_list_activities_list_created;
DROP INDEX IF EXISTS idx_list_activities_action;

-- Drop table
DROP TABLE IF EXISTS list_activities;

-- =====================================================
-- Rollback Complete
-- =====================================================
