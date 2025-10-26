-- Users Table Schema for JWT Authentication
-- This schema supports secure user authentication with JWT tokens

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  -- Primary key using UUID v4 for security and distribution
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Username: unique identifier for user login
  -- Constraints: 3-50 characters, alphanumeric with underscores
  username VARCHAR(50) NOT NULL UNIQUE,

  -- Email: unique email address for user identification
  -- Stored in lowercase for case-insensitive lookups
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Password hash: bcrypt hash of user password
  -- bcrypt produces 60-character hashes
  password_hash VARCHAR(255) NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,

  -- Additional security and account management fields
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,

  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for performance optimization

-- Index on email for login queries (most common lookup)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on username for login and profile lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index on created_at for user registration analytics
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Index on last_login for activity tracking
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;

-- Index on active users for filtering
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- Composite index for email + is_active (common authentication query)
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure email is stored in lowercase
CREATE OR REPLACE FUNCTION lowercase_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to lowercase email before insert or update
CREATE TRIGGER lowercase_users_email
  BEFORE INSERT OR UPDATE OF email ON users
  FOR EACH ROW
  EXECUTE FUNCTION lowercase_email();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts for JWT authentication';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID v4)';
COMMENT ON COLUMN users.username IS 'Unique username (3-50 chars, alphanumeric + underscore)';
COMMENT ON COLUMN users.email IS 'Unique email address (stored in lowercase)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash of user password';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last account update timestamp (auto-updated)';
COMMENT ON COLUMN users.last_login IS 'Last successful login timestamp';
COMMENT ON COLUMN users.is_active IS 'Whether the account is active';
COMMENT ON COLUMN users.email_verified IS 'Whether the email has been verified';
