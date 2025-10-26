-- =====================================================
-- Rollback Migration: Remove invite link support
-- Description: Remove invite_token and invite_expires_at fields
-- =====================================================

-- Drop the index first
DROP INDEX IF EXISTS idx_lists_invite_token;

-- Remove invite token and expiration fields from lists table
ALTER TABLE lists
  DROP COLUMN IF EXISTS invite_token,
  DROP COLUMN IF EXISTS invite_expires_at;
