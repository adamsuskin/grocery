-- =====================================================
-- Migration: Add invite link support to lists
-- Description: Add invite_token and invite_expires_at fields
-- =====================================================

-- Add invite token and expiration fields to lists table
ALTER TABLE lists
  ADD COLUMN invite_token VARCHAR(32) UNIQUE,
  ADD COLUMN invite_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for fast invite token lookups
CREATE INDEX IF NOT EXISTS idx_lists_invite_token ON lists(invite_token) WHERE invite_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN lists.invite_token IS 'Unique shareable invite token for joining the list';
COMMENT ON COLUMN lists.invite_expires_at IS 'Expiration timestamp for the invite link';
