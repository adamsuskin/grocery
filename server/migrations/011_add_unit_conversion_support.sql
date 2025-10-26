-- Migration: Add Unit Conversion Support
-- Description: Creates unit_conversions table and adds unit/quantity fields to grocery_items

-- Create unit_conversions table
CREATE TABLE IF NOT EXISTS unit_conversions (
    id SERIAL PRIMARY KEY,
    from_unit VARCHAR(50) NOT NULL,
    to_unit VARCHAR(50) NOT NULL,
    conversion_factor NUMERIC(15, 6) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('volume', 'weight', 'count')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_unit_pair UNIQUE (from_unit, to_unit),
    CONSTRAINT positive_conversion_factor CHECK (conversion_factor > 0)
);

-- Add indexes for better query performance
CREATE INDEX idx_unit_conversions_from_unit ON unit_conversions(from_unit);
CREATE INDEX idx_unit_conversions_to_unit ON unit_conversions(to_unit);
CREATE INDEX idx_unit_conversions_category ON unit_conversions(category);

-- Insert standard cooking unit conversions

-- VOLUME CONVERSIONS
-- Cup conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('cup', 'tbsp', 16, 'volume', 'Cups to tablespoons'),
    ('tbsp', 'cup', 0.0625, 'volume', 'Tablespoons to cups'),
    ('cup', 'ml', 236.588, 'volume', 'Cups to milliliters'),
    ('ml', 'cup', 0.00422675, 'volume', 'Milliliters to cups'),
    ('cup', 'fl-oz', 8, 'volume', 'Cups to fluid ounces'),
    ('fl-oz', 'cup', 0.125, 'volume', 'Fluid ounces to cups');

-- Tablespoon conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('tbsp', 'tsp', 3, 'volume', 'Tablespoons to teaspoons'),
    ('tsp', 'tbsp', 0.333333, 'volume', 'Teaspoons to tablespoons'),
    ('tbsp', 'ml', 14.787, 'volume', 'Tablespoons to milliliters'),
    ('ml', 'tbsp', 0.067628, 'volume', 'Milliliters to tablespoons');

-- Teaspoon conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('tsp', 'ml', 4.929, 'volume', 'Teaspoons to milliliters'),
    ('ml', 'tsp', 0.202884, 'volume', 'Milliliters to teaspoons');

-- Liter conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('l', 'ml', 1000, 'volume', 'Liters to milliliters'),
    ('ml', 'l', 0.001, 'volume', 'Milliliters to liters'),
    ('l', 'cup', 4.22675, 'volume', 'Liters to cups'),
    ('cup', 'l', 0.236588, 'volume', 'Cups to liters');

-- Gallon conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('gallon', 'cup', 16, 'volume', 'Gallons to cups'),
    ('cup', 'gallon', 0.0625, 'volume', 'Cups to gallons'),
    ('gallon', 'ml', 3785.41, 'volume', 'Gallons to milliliters'),
    ('ml', 'gallon', 0.000264172, 'volume', 'Milliliters to gallons'),
    ('gallon', 'l', 3.78541, 'volume', 'Gallons to liters'),
    ('l', 'gallon', 0.264172, 'volume', 'Liters to gallons');

-- Fluid ounce additional conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('fl-oz', 'ml', 29.5735, 'volume', 'Fluid ounces to milliliters'),
    ('ml', 'fl-oz', 0.033814, 'volume', 'Milliliters to fluid ounces'),
    ('fl-oz', 'tbsp', 2, 'volume', 'Fluid ounces to tablespoons'),
    ('tbsp', 'fl-oz', 0.5, 'volume', 'Tablespoons to fluid ounces');

-- WEIGHT CONVERSIONS
-- Ounce conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('oz', 'g', 28.3495, 'weight', 'Ounces to grams'),
    ('g', 'oz', 0.035274, 'weight', 'Grams to ounces');

-- Pound conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('lb', 'oz', 16, 'weight', 'Pounds to ounces'),
    ('oz', 'lb', 0.0625, 'weight', 'Ounces to pounds'),
    ('lb', 'g', 453.592, 'weight', 'Pounds to grams'),
    ('g', 'lb', 0.00220462, 'weight', 'Grams to pounds'),
    ('lb', 'kg', 0.453592, 'weight', 'Pounds to kilograms'),
    ('kg', 'lb', 2.20462, 'weight', 'Kilograms to pounds');

-- Kilogram conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('kg', 'g', 1000, 'weight', 'Kilograms to grams'),
    ('g', 'kg', 0.001, 'weight', 'Grams to kilograms'),
    ('kg', 'oz', 35.274, 'weight', 'Kilograms to ounces'),
    ('oz', 'kg', 0.0283495, 'weight', 'Ounces to kilograms');

-- COUNT CONVERSIONS (for items sold by unit)
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, category, notes)
VALUES
    ('dozen', 'piece', 12, 'count', 'Dozen to individual pieces'),
    ('piece', 'dozen', 0.083333, 'count', 'Pieces to dozen');

-- Add unit and quantity_decimal columns to grocery_items table
ALTER TABLE grocery_items
ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS quantity_decimal NUMERIC(10, 2);

-- Create index on unit column for faster filtering
CREATE INDEX idx_grocery_items_unit ON grocery_items(unit);

-- Add comment to document the schema changes
COMMENT ON TABLE unit_conversions IS 'Stores unit conversion factors for cooking measurements';
COMMENT ON COLUMN grocery_items.unit IS 'Unit of measurement (e.g., cup, tbsp, oz, g)';
COMMENT ON COLUMN grocery_items.quantity_decimal IS 'Precise quantity amount supporting fractional values';
