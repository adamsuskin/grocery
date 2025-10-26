-- ============================================
-- Users Table
-- ============================================
-- Migration: Added users table for authentication and user management
-- Date: 2025-10-26
-- Changes:
--   - Added users table with authentication fields
--   - Added indexes for username and email lookups
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login INTEGER
);

-- Index for fast username lookups during login
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index for fast email lookups (for password reset, duplicate checks, etc.)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for finding recently active users
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- ============================================
-- Grocery Items Table
-- ============================================
-- Migration: Added user_id foreign key for multi-user support
-- Date: 2025-10-26
-- Changes:
--   - Added user_id column to track item ownership
--   - Added foreign key constraint to users table
--   - Added index for user_id lookups
-- ============================================

CREATE TABLE IF NOT EXISTS grocery_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  gotten BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'Other',
  notes TEXT,
  created_at INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for sorting by creation time
CREATE INDEX IF NOT EXISTS idx_grocery_items_created_at ON grocery_items(created_at DESC);

-- Index for filtering items by user (critical for multi-user queries)
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_id ON grocery_items(user_id);

-- Composite index for user + category filtering (optimizes category-based queries per user)
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_category ON grocery_items(user_id, category);

-- Composite index for user + gotten status (optimizes filtering active vs completed items per user)
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_gotten ON grocery_items(user_id, gotten);
