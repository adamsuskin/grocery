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
--
-- Migration: Added price tracking support
-- Date: 2025-10-26
-- Changes:
--   - Added price column for tracking individual item costs
-- ============================================

CREATE TABLE IF NOT EXISTS grocery_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  gotten BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'Other',
  notes TEXT,
  price REAL,  -- Price per unit/item. Nullable to allow items without price tracking
  created_at INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  list_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- Index for sorting by creation time
CREATE INDEX IF NOT EXISTS idx_grocery_items_created_at ON grocery_items(created_at DESC);

-- Index for filtering items by user (critical for multi-user queries)
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_id ON grocery_items(user_id);

-- Composite index for user + category filtering (optimizes category-based queries per user)
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_category ON grocery_items(user_id, category);

-- Composite index for user + gotten status (optimizes filtering active vs completed items per user)
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_gotten ON grocery_items(user_id, gotten);

-- Index for filtering items by list
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON grocery_items(list_id);

-- Composite index for list + gotten status (optimizes filtering active vs completed items per list)
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_gotten ON grocery_items(list_id, gotten);

-- Composite index for list + category filtering (optimizes category-based queries per list)
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_category ON grocery_items(list_id, category);

-- Composite index for list + creation time (optimizes sorting items within a list)
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_created ON grocery_items(list_id, created_at DESC);

-- Composite index for list + price (optimizes price-based queries and sorting per list)
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_price ON grocery_items(list_id, price) WHERE price IS NOT NULL;

-- ============================================
-- Lists Table
-- ============================================
-- Migration: Added lists table for multi-user list sharing
-- Date: 2025-10-26
-- Changes:
--   - Added lists table for organizing grocery items
--   - Supports multiple users collaborating on shared lists
--   - Includes soft delete via is_archived flag
--
-- Migration: Added budget tracking support
-- Date: 2025-10-26
-- Changes:
--   - Added budget column for tracking list spending limits
--   - Added currency column to support multi-currency budgeting
-- ============================================

CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  budget REAL,  -- Optional budget limit for the list. Nullable to allow lists without budget tracking
  currency TEXT NOT NULL DEFAULT 'USD',  -- Currency code (ISO 4217 format recommended, e.g., USD, EUR, GBP)
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for finding lists by owner
CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);

-- Index for sorting lists by creation time
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON lists(created_at DESC);

-- Composite index for finding active/archived lists by owner
CREATE INDEX IF NOT EXISTS idx_lists_owner_archived ON lists(owner_id, is_archived);

-- Index for searching lists by name
CREATE INDEX IF NOT EXISTS idx_lists_name ON lists(name);

-- ============================================
-- List Members Table
-- ============================================
-- Migration: Added list_members table for sharing permissions
-- Date: 2025-10-26
-- Changes:
--   - Added list_members junction table
--   - Supports permission levels: owner, editor, viewer
--   - Tracks when users joined and last accessed lists
-- ============================================

CREATE TABLE IF NOT EXISTS list_members (
  list_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'viewer',
  joined_at INTEGER NOT NULL,
  invited_by TEXT,
  last_accessed_at INTEGER,
  PRIMARY KEY (list_id, user_id),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (permission_level IN ('owner', 'editor', 'viewer'))
);

-- Index for finding all lists a user is a member of
CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON list_members(user_id);

-- Index for finding all members of a list
CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON list_members(list_id);

-- Composite index for filtering by list and permission level
CREATE INDEX IF NOT EXISTS idx_list_members_permission ON list_members(list_id, permission_level);

-- Index for sorting by join date
CREATE INDEX IF NOT EXISTS idx_list_members_joined_at ON list_members(joined_at DESC);

