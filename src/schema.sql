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

-- ============================================
-- Recipes Table
-- ============================================
-- Migration: Added recipes table for Phase 26 - Recipe Integration
-- Date: 2025-10-26
-- Changes:
--   - Added recipes table with comprehensive recipe information
--   - Supports public/private recipes with user ownership
--   - Optional association with grocery lists
--   - Includes metadata like difficulty, cuisine, prep/cook times
-- ============================================

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  prep_time INTEGER,  -- Prep time in minutes
  cook_time INTEGER,  -- Cook time in minutes
  servings INTEGER DEFAULT 4,  -- Number of servings the recipe makes
  difficulty TEXT,  -- easy, medium, hard
  cuisine_type TEXT,  -- Italian, Mexican, Asian, etc.
  image_url TEXT,  -- Optional recipe image URL
  user_id TEXT NOT NULL,  -- Recipe creator
  list_id TEXT,  -- Optional associated grocery list
  is_public BOOLEAN DEFAULT false,  -- Public/private visibility
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL,
  CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard'))
);

-- Index for finding recipes by user
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);

-- Index for finding recipes associated with a list
CREATE INDEX IF NOT EXISTS idx_recipes_list_id ON recipes(list_id);

-- Index for sorting recipes by creation time
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- Partial index for public recipes (optimizes public recipe discovery)
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public) WHERE is_public = true;

-- Index for searching by cuisine type
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine_type);

-- Index for filtering by difficulty
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);

-- ============================================
-- Recipe Ingredients Table
-- ============================================
-- Migration: Added recipe_ingredients table for Phase 26 - Recipe Integration
-- Date: 2025-10-26
-- Changes:
--   - Added recipe_ingredients table for ingredient details
--   - Supports quantity, units, and optional notes
--   - Category links to grocery categories for list generation
--   - order_index ensures consistent ingredient display order
-- ============================================

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  name TEXT NOT NULL,  -- Ingredient name
  quantity REAL NOT NULL,  -- Amount needed
  unit TEXT NOT NULL,  -- cup, tbsp, gram, oz, etc.
  notes TEXT,  -- Optional notes (e.g., "finely chopped", "room temperature")
  category TEXT,  -- Link to grocery categories (Produce, Dairy, etc.)
  order_index INTEGER NOT NULL,  -- Display order within recipe
  created_at INTEGER NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Index for finding all ingredients for a recipe
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- Composite index for sorting ingredients within a recipe by order
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_order ON recipe_ingredients(recipe_id, order_index);

-- Index for finding ingredients by category (useful for grocery list generation)
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_category ON recipe_ingredients(category);

-- ============================================
-- Meal Plans Table
-- ============================================
-- Migration: Added meal_plans table for Phase 26 - Recipe Integration
-- Date: 2025-10-26
-- Changes:
--   - Added meal_plans table for scheduling recipes
--   - Supports meal planning with date and meal type
--   - Optional association with grocery lists
--   - Tracks cooking status and allows serving adjustments
-- ============================================

CREATE TABLE IF NOT EXISTS meal_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  list_id TEXT,  -- Associated grocery list
  recipe_id TEXT NOT NULL,
  planned_date INTEGER NOT NULL,  -- Unix timestamp for the planned meal date
  meal_type TEXT NOT NULL,  -- breakfast, lunch, dinner, snack
  servings INTEGER DEFAULT 4,  -- Override recipe servings if needed
  notes TEXT,  -- Optional notes for this meal plan
  is_cooked BOOLEAN DEFAULT false,  -- Track if meal has been cooked
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
);

-- Index for finding meal plans by user
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);

-- Index for finding meal plans by date (critical for calendar views)
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(planned_date);

-- Index for finding meal plans by recipe
CREATE INDEX IF NOT EXISTS idx_meal_plans_recipe ON meal_plans(recipe_id);

-- Index for finding meal plans by list
CREATE INDEX IF NOT EXISTS idx_meal_plans_list ON meal_plans(list_id);

-- Composite index for user + date range queries
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, planned_date);

-- Composite index for filtering cooked/uncooked meals
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_cooked ON meal_plans(user_id, is_cooked);

-- ============================================
-- Recipe Collections Table
-- ============================================
-- Migration: Added recipe_collections table for Phase 26 - Recipe Integration
-- Date: 2025-10-26
-- Changes:
--   - Added recipe_collections table for organizing recipes
--   - Supports public/private collections
--   - Users can create themed collections (e.g., "Quick Weeknight Dinners")
-- ============================================

CREATE TABLE IF NOT EXISTS recipe_collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,  -- Public/private visibility
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for finding collections by user
CREATE INDEX IF NOT EXISTS idx_recipe_collections_user_id ON recipe_collections(user_id);

-- Index for sorting collections by creation time
CREATE INDEX IF NOT EXISTS idx_recipe_collections_created ON recipe_collections(created_at DESC);

-- Partial index for public collections
CREATE INDEX IF NOT EXISTS idx_recipe_collections_public ON recipe_collections(is_public) WHERE is_public = true;

-- ============================================
-- Recipe Collection Items Table
-- ============================================
-- Migration: Added recipe_collection_items table for Phase 26 - Recipe Integration
-- Date: 2025-10-26
-- Changes:
--   - Added recipe_collection_items junction table
--   - Links recipes to collections (many-to-many relationship)
--   - Tracks when recipes were added to collections
-- ============================================

CREATE TABLE IF NOT EXISTS recipe_collection_items (
  collection_id TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  added_at INTEGER NOT NULL,  -- When the recipe was added to this collection
  PRIMARY KEY (collection_id, recipe_id),
  FOREIGN KEY (collection_id) REFERENCES recipe_collections(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Index for finding all recipes in a collection
CREATE INDEX IF NOT EXISTS idx_recipe_collection_items_collection ON recipe_collection_items(collection_id);

-- Index for finding all collections containing a recipe
CREATE INDEX IF NOT EXISTS idx_recipe_collection_items_recipe ON recipe_collection_items(recipe_id);

-- Index for sorting recipes within a collection by when they were added
CREATE INDEX IF NOT EXISTS idx_recipe_collection_items_added ON recipe_collection_items(collection_id, added_at DESC);

