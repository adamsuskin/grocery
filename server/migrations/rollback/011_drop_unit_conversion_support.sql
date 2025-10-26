-- Rollback Migration: Drop Unit Conversion Support
-- Description: Removes unit_conversions table and unit/quantity fields from grocery_items

-- Remove indexes from grocery_items
DROP INDEX IF EXISTS idx_grocery_items_unit;

-- Remove unit and quantity_decimal columns from grocery_items
ALTER TABLE grocery_items
DROP COLUMN IF EXISTS unit,
DROP COLUMN IF EXISTS quantity_decimal;

-- Drop indexes from unit_conversions table
DROP INDEX IF EXISTS idx_unit_conversions_category;
DROP INDEX IF EXISTS idx_unit_conversions_to_unit;
DROP INDEX IF EXISTS idx_unit_conversions_from_unit;

-- Drop unit_conversions table
DROP TABLE IF EXISTS unit_conversions;
