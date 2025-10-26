-- =====================================================
-- Rollback Migration: 010_drop_recipes
-- Description: Remove recipe integration tables (Phase 26)
-- Created: 2025-10-26
-- Author: System
-- =====================================================
-- This rollback removes:
--   1. Recipe collection items junction table
--   2. Recipe collections table
--   3. Meal plans table
--   4. Recipe ingredients table
--   5. Recipes table
--   6. All associated indexes, constraints, and triggers
-- =====================================================

-- Display rollback warning
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Rolling back Migration 010_create_recipes';
  RAISE NOTICE 'WARNING: This will delete all recipe data!';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PHASE 1: Drop Recipe Collection Items Table
-- =====================================================
-- Drop this first due to foreign key constraints

-- Drop indexes
DROP INDEX IF EXISTS idx_recipe_collection_items_added;
DROP INDEX IF EXISTS idx_recipe_collection_items_recipe;
DROP INDEX IF EXISTS idx_recipe_collection_items_collection;

-- Drop table
DROP TABLE IF EXISTS recipe_collection_items;

RAISE NOTICE 'Dropped table: recipe_collection_items';

-- =====================================================
-- PHASE 2: Drop Recipe Collections Table
-- =====================================================

-- Drop trigger
DROP TRIGGER IF EXISTS update_recipe_collections_updated_at ON recipe_collections;

-- Drop indexes
DROP INDEX IF EXISTS idx_recipe_collections_user_created;
DROP INDEX IF EXISTS idx_recipe_collections_public;
DROP INDEX IF EXISTS idx_recipe_collections_created;
DROP INDEX IF EXISTS idx_recipe_collections_user_id;

-- Drop table
DROP TABLE IF EXISTS recipe_collections;

RAISE NOTICE 'Dropped table: recipe_collections';

-- =====================================================
-- PHASE 3: Drop Meal Plans Table
-- =====================================================

-- Drop trigger
DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;

-- Drop indexes
DROP INDEX IF EXISTS idx_meal_plans_user_meal_type;
DROP INDEX IF EXISTS idx_meal_plans_user_cooked;
DROP INDEX IF EXISTS idx_meal_plans_user_date;
DROP INDEX IF EXISTS idx_meal_plans_list;
DROP INDEX IF EXISTS idx_meal_plans_recipe;
DROP INDEX IF EXISTS idx_meal_plans_date;
DROP INDEX IF EXISTS idx_meal_plans_user_id;

-- Drop table
DROP TABLE IF EXISTS meal_plans;

RAISE NOTICE 'Dropped table: meal_plans';

-- =====================================================
-- PHASE 4: Drop Recipe Ingredients Table
-- =====================================================

-- Drop indexes
DROP INDEX IF EXISTS idx_recipe_ingredients_order;
DROP INDEX IF EXISTS idx_recipe_ingredients_category;
DROP INDEX IF EXISTS idx_recipe_ingredients_recipe_id;

-- Drop table
DROP TABLE IF EXISTS recipe_ingredients;

RAISE NOTICE 'Dropped table: recipe_ingredients';

-- =====================================================
-- PHASE 5: Drop Recipes Table
-- =====================================================

-- Drop trigger
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;

-- Drop indexes
DROP INDEX IF EXISTS idx_recipes_user_created;
DROP INDEX IF EXISTS idx_recipes_is_public;
DROP INDEX IF EXISTS idx_recipes_difficulty;
DROP INDEX IF EXISTS idx_recipes_cuisine;
DROP INDEX IF EXISTS idx_recipes_created_at;
DROP INDEX IF EXISTS idx_recipes_list_id;
DROP INDEX IF EXISTS idx_recipes_user_id;

-- Drop table
DROP TABLE IF EXISTS recipes;

RAISE NOTICE 'Dropped table: recipes';

-- =====================================================
-- PHASE 6: Verification
-- =====================================================

-- Display rollback completion message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Rollback 010_drop_recipes completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables dropped:';
  RAISE NOTICE '  - recipes';
  RAISE NOTICE '  - recipe_ingredients';
  RAISE NOTICE '  - meal_plans';
  RAISE NOTICE '  - recipe_collections';
  RAISE NOTICE '  - recipe_collection_items';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 26: Recipe Integration removed.';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Rollback Complete
-- =====================================================
