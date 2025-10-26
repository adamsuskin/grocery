-- Migration: 002_add_password_reset_fields
-- Description: Add password reset token and expiration fields to users table
-- Created: 2025-10-26
-- Author: System

-- =====================================================
-- UP MIGRATION
-- =====================================================

-- Add reset_token field to store password reset token
-- This will be a randomly generated secure token
ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255);

-- Add reset_token_expires field to store token expiration timestamp
-- Tokens should expire after a reasonable time (e.g., 1 hour)
ALTER TABLE users
ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Create index on reset_token for fast lookups during password reset
-- Only index non-null values to save space
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.reset_token IS 'Secure token for password reset (randomly generated)';
COMMENT ON COLUMN users.reset_token_expires IS 'Expiration timestamp for password reset token';

-- =====================================================
-- DOWN MIGRATION (Rollback)
-- =====================================================

-- Uncomment to create down migration
-- DROP INDEX IF EXISTS idx_users_reset_token;
-- ALTER TABLE users DROP COLUMN IF EXISTS reset_token_expires;
-- ALTER TABLE users DROP COLUMN IF EXISTS reset_token;
