-- =====================================================
-- Migration: 010_create_recipes
-- Description: Add recipe integration tables for Phase 26
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- This migration adds:
--   1. Recipes table for storing recipe information
--   2. Recipe ingredients table for ingredient details
--   3. Meal plans table for scheduling recipes
--   4. Recipe collections table for organizing recipes
--   5. Recipe collection items junction table
--   6. All necessary indexes, constraints, and triggers
-- =====================================================

-- =====================================================
-- PHASE 1: Create Recipes Table
-- =====================================================

-- Create recipes table with comprehensive recipe information
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  prep_time INTEGER,  -- Prep time in minutes
  cook_time INTEGER,  -- Cook time in minutes
  servings INTEGER DEFAULT 4,  -- Number of servings the recipe makes
  difficulty VARCHAR(20),  -- easy, medium, hard
  cuisine_type VARCHAR(100),  -- Italian, Mexican, Asian, etc.
  image_url TEXT,  -- Optional recipe image URL
  user_id UUID NOT NULL,  -- Recipe creator
  list_id UUID,  -- Optional associated grocery list
  is_public BOOLEAN DEFAULT false,  -- Public/private visibility
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL,

  -- Check constraints
  CONSTRAINT valid_difficulty CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')),
  CONSTRAINT valid_prep_time CHECK (prep_time IS NULL OR prep_time >= 0),
  CONSTRAINT valid_cook_time CHECK (cook_time IS NULL OR cook_time >= 0),
  CONSTRAINT valid_servings CHECK (servings > 0)
);

-- Create indexes for recipes table
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_list_id ON recipes(list_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);

-- Partial index for public recipes (optimizes public recipe discovery)
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public) WHERE is_public = true;

-- Composite index for user + creation time (optimizes sorting user's recipes)
CREATE INDEX IF NOT EXISTS idx_recipes_user_created ON recipes(user_id, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE recipes IS 'User-created recipes with comprehensive cooking information';
COMMENT ON COLUMN recipes.id IS 'Unique recipe identifier (UUID)';
COMMENT ON COLUMN recipes.name IS 'Recipe name/title';
COMMENT ON COLUMN recipes.description IS 'Brief description of the recipe';
COMMENT ON COLUMN recipes.instructions IS 'Step-by-step cooking instructions';
COMMENT ON COLUMN recipes.prep_time IS 'Preparation time in minutes';
COMMENT ON COLUMN recipes.cook_time IS 'Cooking time in minutes';
COMMENT ON COLUMN recipes.servings IS 'Number of servings the recipe yields';
COMMENT ON COLUMN recipes.difficulty IS 'Difficulty level: easy, medium, or hard';
COMMENT ON COLUMN recipes.cuisine_type IS 'Type of cuisine (e.g., Italian, Mexican, Asian)';
COMMENT ON COLUMN recipes.image_url IS 'URL to recipe image (optional)';
COMMENT ON COLUMN recipes.user_id IS 'Foreign key to users table (recipe creator)';
COMMENT ON COLUMN recipes.list_id IS 'Optional associated grocery list';
COMMENT ON COLUMN recipes.is_public IS 'Whether recipe is publicly visible';

-- Apply updated_at trigger to recipes table
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 2: Create Recipe Ingredients Table
-- =====================================================

-- Create recipe_ingredients table for ingredient details
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,  -- Ingredient name
  quantity NUMERIC(10, 2) NOT NULL,  -- Amount needed (supports decimals like 1.5)
  unit VARCHAR(50) NOT NULL,  -- cup, tbsp, gram, oz, etc.
  notes TEXT,  -- Optional notes (e.g., "finely chopped", "room temperature")
  category VARCHAR(100),  -- Link to grocery categories (Produce, Dairy, etc.)
  order_index INTEGER NOT NULL DEFAULT 0,  -- Display order within recipe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,

  -- Check constraints
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_order_index CHECK (order_index >= 0)
);

-- Create indexes for recipe_ingredients table
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_category ON recipe_ingredients(category);

-- Composite index for sorting ingredients within a recipe by order
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_order ON recipe_ingredients(recipe_id, order_index);

-- Add comments for documentation
COMMENT ON TABLE recipe_ingredients IS 'Ingredients required for each recipe';
COMMENT ON COLUMN recipe_ingredients.id IS 'Unique ingredient identifier (UUID)';
COMMENT ON COLUMN recipe_ingredients.recipe_id IS 'Foreign key to recipes table';
COMMENT ON COLUMN recipe_ingredients.name IS 'Ingredient name';
COMMENT ON COLUMN recipe_ingredients.quantity IS 'Amount needed (numeric for decimals)';
COMMENT ON COLUMN recipe_ingredients.unit IS 'Unit of measurement (cup, tbsp, gram, etc.)';
COMMENT ON COLUMN recipe_ingredients.notes IS 'Additional preparation notes';
COMMENT ON COLUMN recipe_ingredients.category IS 'Category for grocery list organization';
COMMENT ON COLUMN recipe_ingredients.order_index IS 'Display order within recipe';

-- =====================================================
-- PHASE 3: Create Meal Plans Table
-- =====================================================

-- Create meal_plans table for scheduling recipes
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  list_id UUID,  -- Associated grocery list
  recipe_id UUID NOT NULL,
  planned_date DATE NOT NULL,  -- Date for the planned meal
  meal_type VARCHAR(20) NOT NULL,  -- breakfast, lunch, dinner, snack
  servings INTEGER DEFAULT 4,  -- Override recipe servings if needed
  notes TEXT,  -- Optional notes for this meal plan
  is_cooked BOOLEAN DEFAULT false,  -- Track if meal has been cooked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,

  -- Check constraints
  CONSTRAINT valid_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  CONSTRAINT valid_meal_servings CHECK (servings > 0)
);

-- Create indexes for meal_plans table
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(planned_date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_recipe ON meal_plans(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_list ON meal_plans(list_id);

-- Composite index for user + date range queries (critical for calendar views)
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, planned_date);

-- Composite index for filtering cooked/uncooked meals
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_cooked ON meal_plans(user_id, is_cooked);

-- Composite index for meal type filtering
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_meal_type ON meal_plans(user_id, meal_type);

-- Add comments for documentation
COMMENT ON TABLE meal_plans IS 'Scheduled meal plans linking recipes to dates';
COMMENT ON COLUMN meal_plans.id IS 'Unique meal plan identifier (UUID)';
COMMENT ON COLUMN meal_plans.user_id IS 'Foreign key to users table (meal planner)';
COMMENT ON COLUMN meal_plans.list_id IS 'Optional associated grocery list';
COMMENT ON COLUMN meal_plans.recipe_id IS 'Foreign key to recipes table';
COMMENT ON COLUMN meal_plans.planned_date IS 'Date for the planned meal';
COMMENT ON COLUMN meal_plans.meal_type IS 'Meal type: breakfast, lunch, dinner, or snack';
COMMENT ON COLUMN meal_plans.servings IS 'Number of servings (can override recipe default)';
COMMENT ON COLUMN meal_plans.notes IS 'Optional notes for this meal plan';
COMMENT ON COLUMN meal_plans.is_cooked IS 'Whether meal has been cooked';

-- Apply updated_at trigger to meal_plans table
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 4: Create Recipe Collections Table
-- =====================================================

-- Create recipe_collections table for organizing recipes
CREATE TABLE IF NOT EXISTS recipe_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,  -- Public/private visibility
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for recipe_collections table
CREATE INDEX IF NOT EXISTS idx_recipe_collections_user_id ON recipe_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collections_created ON recipe_collections(created_at DESC);

-- Partial index for public collections (optimizes public collection discovery)
CREATE INDEX IF NOT EXISTS idx_recipe_collections_public ON recipe_collections(is_public) WHERE is_public = true;

-- Composite index for user + creation time
CREATE INDEX IF NOT EXISTS idx_recipe_collections_user_created ON recipe_collections(user_id, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE recipe_collections IS 'User-created collections for organizing recipes';
COMMENT ON COLUMN recipe_collections.id IS 'Unique collection identifier (UUID)';
COMMENT ON COLUMN recipe_collections.user_id IS 'Foreign key to users table (collection owner)';
COMMENT ON COLUMN recipe_collections.name IS 'Collection name';
COMMENT ON COLUMN recipe_collections.description IS 'Collection description';
COMMENT ON COLUMN recipe_collections.is_public IS 'Whether collection is publicly visible';

-- Apply updated_at trigger to recipe_collections table
CREATE TRIGGER update_recipe_collections_updated_at
  BEFORE UPDATE ON recipe_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 5: Create Recipe Collection Items Junction Table
-- =====================================================

-- Create recipe_collection_items junction table
CREATE TABLE IF NOT EXISTS recipe_collection_items (
  collection_id UUID NOT NULL,
  recipe_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Primary key: composite of collection_id and recipe_id
  PRIMARY KEY (collection_id, recipe_id),

  -- Foreign key constraints
  FOREIGN KEY (collection_id) REFERENCES recipe_collections(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create indexes for recipe_collection_items table
CREATE INDEX IF NOT EXISTS idx_recipe_collection_items_collection ON recipe_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collection_items_recipe ON recipe_collection_items(recipe_id);

-- Composite index for sorting recipes within a collection by when they were added
CREATE INDEX IF NOT EXISTS idx_recipe_collection_items_added ON recipe_collection_items(collection_id, added_at DESC);

-- Add comments for documentation
COMMENT ON TABLE recipe_collection_items IS 'Junction table linking recipes to collections (many-to-many)';
COMMENT ON COLUMN recipe_collection_items.collection_id IS 'Foreign key to recipe_collections table';
COMMENT ON COLUMN recipe_collection_items.recipe_id IS 'Foreign key to recipes table';
COMMENT ON COLUMN recipe_collection_items.added_at IS 'When the recipe was added to this collection';

-- =====================================================
-- PHASE 6: Verification and Statistics
-- =====================================================

-- Display migration statistics
DO $$
DECLARE
  recipes_count INTEGER;
  collections_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recipes_count FROM recipes;
  SELECT COUNT(*) INTO collections_count FROM recipe_collections;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 010_create_recipes completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - recipes (% records)', recipes_count;
  RAISE NOTICE '  - recipe_ingredients';
  RAISE NOTICE '  - meal_plans';
  RAISE NOTICE '  - recipe_collections (% records)', collections_count;
  RAISE NOTICE '  - recipe_collection_items';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 26: Recipe Integration ready!';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
