-- =====================================================
-- Migration: 001_add_authentication
-- Description: Add authentication tables and user association to grocery items
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- This migration adds:
--   1. Users table with authentication fields
--   2. Refresh tokens table for JWT token management
--   3. user_id column to grocery_items table
--   4. Default admin user for existing data
--   5. All necessary indexes and constraints
-- =====================================================

-- =====================================================
-- PHASE 1: Create Users Table
-- =====================================================

-- Create users table with authentication support
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Email validation constraint
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- Add comment for documentation
COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique, used for login)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.last_login IS 'Last successful login timestamp';
COMMENT ON COLUMN users.is_active IS 'Whether user account is active';

-- =====================================================
-- PHASE 2: Create Refresh Tokens Table
-- =====================================================

-- Create refresh_tokens table for JWT token management
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,

  -- Ensure token_hash is unique
  CONSTRAINT unique_token_hash UNIQUE (token_hash)
);

-- Create indexes for refresh_tokens table
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Add comment for documentation
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Hashed refresh token for security';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN refresh_tokens.revoked IS 'Whether token has been revoked';

-- =====================================================
-- PHASE 3: Create Trigger Functions
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to normalize email to lowercase
CREATE OR REPLACE FUNCTION lowercase_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER lowercase_users_email
  BEFORE INSERT OR UPDATE OF email ON users
  FOR EACH ROW
  EXECUTE FUNCTION lowercase_email();

-- =====================================================
-- PHASE 4: Create Default Admin User
-- =====================================================

-- Create default admin user for existing grocery items
-- Password: 'admin123' (bcrypt hash with cost factor 10)
-- IMPORTANT: Change this password immediately after migration!
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Insert default admin user if not exists
  INSERT INTO users (id, email, password_hash, name, is_active)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'admin@grocery.local',
    '$2b$10$rKvE1YgX5wK0xVkFQm1VJ.x3fZGQ3hqVh3cL8XN3wJLXzD1KJ8xWO', -- admin123
    'Default Admin',
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Default admin user created: admin@grocery.local / admin123';
  RAISE NOTICE 'IMPORTANT: Change the default admin password immediately!';
END $$;

-- =====================================================
-- PHASE 5: Modify grocery_items Table
-- =====================================================

-- Add user_id column to grocery_items table (nullable initially)
ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Assign all existing grocery items to default admin user
UPDATE grocery_items
SET user_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE user_id IS NULL;

-- Now make user_id NOT NULL and add foreign key constraint
ALTER TABLE grocery_items
  ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE grocery_items
  ADD CONSTRAINT fk_grocery_items_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Create indexes for grocery_items with user_id
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_id ON grocery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_gotten ON grocery_items(user_id, gotten);

-- If category column exists, create composite index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'grocery_items' AND column_name = 'category'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_grocery_items_user_category ON grocery_items(user_id, category);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN grocery_items.user_id IS 'Foreign key to users table (owner of the grocery item)';

-- =====================================================
-- PHASE 6: Verification and Statistics
-- =====================================================

-- Display migration statistics
DO $$
DECLARE
  user_count INTEGER;
  item_count INTEGER;
  orphaned_items INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO item_count FROM grocery_items;
  SELECT COUNT(*) INTO orphaned_items FROM grocery_items WHERE user_id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 001_add_authentication completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users created: %', user_count;
  RAISE NOTICE 'Grocery items found: %', item_count;
  RAISE NOTICE 'Orphaned items: %', orphaned_items;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Default admin credentials:';
  RAISE NOTICE '  Email: admin@grocery.local';
  RAISE NOTICE '  Password: admin123';
  RAISE NOTICE '  *** CHANGE THIS PASSWORD IMMEDIATELY! ***';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
