# Unit Conversion Migration (011)

## Overview

Migration `011_add_unit_conversion_support.sql` adds comprehensive unit conversion capabilities to the grocery application. This migration:

1. Creates a new `unit_conversions` table to store conversion factors between different measurement units
2. Adds `unit` and `quantity_decimal` columns to the `grocery_items` table
3. Pre-populates the database with 45+ standard cooking unit conversions across three categories:
   - **Volume**: cups, tablespoons, teaspoons, milliliters, liters, gallons, fluid ounces
   - **Weight**: ounces, pounds, grams, kilograms
   - **Count**: dozen, pieces

This enables users to add grocery items with precise measurements and convert between different units (e.g., convert a recipe calling for 2 cups to milliliters).

## Running the Migration

### Prerequisites
- PostgreSQL must be running
- Database connection configured in `.env` file
- Node.js dependencies installed (`npm install`)

### Apply Migration

```bash
# From the server/migrations directory
./migrate.sh up
```

Or using npm:

```bash
# From the server directory
npm run migrate up
```

### Verify Migration

After running the migration, verify it was applied successfully:

```bash
./migrate.sh status
```

Check the database has the new table and columns:

```bash
./migrate.sh verify
```

Or manually verify with PostgreSQL:

```sql
-- Check unit_conversions table exists
SELECT COUNT(*) FROM unit_conversions;
-- Should return 45+ conversions

-- Check new columns on grocery_items
\d grocery_items
-- Should show 'unit' and 'quantity_decimal' columns
```

## Rollback

If you need to undo this migration, a rollback script is provided.

**WARNING**: Rolling back will:
- Drop the `unit_conversions` table and all conversion data
- Remove the `unit` and `quantity_decimal` columns from `grocery_items`
- Permanently delete any unit data stored in grocery items

### Rollback Command

```bash
# From the server/migrations directory
./migrate.sh down
```

Or using npm:

```bash
# From the server directory
npm run migrate down
```

### Manual Rollback

If needed, you can manually run the rollback script:

```bash
psql -U grocery -d grocery_db -f rollback/011_drop_unit_conversion_support.sql
```

## Data Added

The migration pre-populates 45+ unit conversions in three categories:

### Volume Conversions (28 conversions)
| From Unit | To Unit | Factor | Example |
|-----------|---------|--------|---------|
| cup | tbsp | 16 | 1 cup = 16 tablespoons |
| cup | ml | 236.588 | 1 cup = 236.588 milliliters |
| cup | fl-oz | 8 | 1 cup = 8 fluid ounces |
| tbsp | tsp | 3 | 1 tablespoon = 3 teaspoons |
| tbsp | ml | 14.787 | 1 tablespoon = 14.787 milliliters |
| tsp | ml | 4.929 | 1 teaspoon = 4.929 milliliters |
| l | ml | 1000 | 1 liter = 1000 milliliters |
| gallon | cup | 16 | 1 gallon = 16 cups |
| gallon | ml | 3785.41 | 1 gallon = 3785.41 milliliters |

Plus bidirectional conversions between all pairs.

### Weight Conversions (14 conversions)
| From Unit | To Unit | Factor | Example |
|-----------|---------|--------|---------|
| oz | g | 28.3495 | 1 ounce = 28.3495 grams |
| lb | oz | 16 | 1 pound = 16 ounces |
| lb | g | 453.592 | 1 pound = 453.592 grams |
| lb | kg | 0.453592 | 1 pound = 0.453592 kilograms |
| kg | g | 1000 | 1 kilogram = 1000 grams |

Plus bidirectional conversions.

### Count Conversions (2 conversions)
| From Unit | To Unit | Factor | Example |
|-----------|---------|--------|---------|
| dozen | piece | 12 | 1 dozen = 12 pieces |
| piece | dozen | 0.083333 | 1 piece = 0.083 dozen |

### Table Schema

**unit_conversions**
```sql
- id (SERIAL PRIMARY KEY)
- from_unit (VARCHAR(50), NOT NULL)
- to_unit (VARCHAR(50), NOT NULL)
- conversion_factor (NUMERIC(15,6), NOT NULL, > 0)
- category (VARCHAR(20), NOT NULL, CHECK: volume|weight|count)
- notes (TEXT)
- created_at (TIMESTAMP, default: CURRENT_TIMESTAMP)
- UNIQUE constraint on (from_unit, to_unit)
```

**Indexes Created:**
- `idx_unit_conversions_from_unit` - Fast lookups by source unit
- `idx_unit_conversions_to_unit` - Fast lookups by target unit
- `idx_unit_conversions_category` - Fast filtering by category
- `idx_grocery_items_unit` - Fast filtering of items by unit

## Impact on Existing Data

This migration is **100% backward compatible**:

- **No data loss**: All existing grocery item data remains unchanged
- **Optional columns**: The new `unit` and `quantity_decimal` columns are nullable
- **Existing items**: Will have `NULL` values for the new columns
- **Existing functionality**: Continues to work without modification
- **Read operations**: No impact on existing queries
- **Write operations**: Applications can continue creating items without units

### Migration Safety Features

1. **IF NOT EXISTS clauses**: Table and column creation is idempotent
2. **Nullable columns**: New fields don't require data migration
3. **Constraints**: Ensures data quality (positive conversion factors, valid categories)
4. **Indexes**: Added for performance without disrupting existing queries
5. **Unique constraints**: Prevents duplicate conversion definitions

## Testing Recommendations

### 1. Pre-Migration Tests

Before running the migration:

```bash
# Create a backup
./migrate.sh backup

# Verify database connectivity
./migrate.sh verify

# Check current migration status
./migrate.sh status
```

### 2. Post-Migration Validation

After running the migration:

```sql
-- Test 1: Verify table creation
SELECT COUNT(*) FROM unit_conversions;
-- Expected: 45+ rows

-- Test 2: Verify volume conversions
SELECT * FROM unit_conversions
WHERE category = 'volume'
ORDER BY from_unit, to_unit;

-- Test 3: Verify weight conversions
SELECT * FROM unit_conversions
WHERE category = 'weight';

-- Test 4: Check bidirectional conversions
SELECT
    a.from_unit,
    a.to_unit,
    a.conversion_factor,
    b.conversion_factor as reverse_factor,
    (a.conversion_factor * b.conversion_factor) as should_be_close_to_1
FROM unit_conversions a
JOIN unit_conversions b
    ON a.from_unit = b.to_unit
    AND a.to_unit = b.from_unit
LIMIT 10;
-- The product should be approximately 1.0

-- Test 5: Verify new grocery_items columns
\d grocery_items
-- Should show 'unit' and 'quantity_decimal' columns

-- Test 6: Test inserting item with units
INSERT INTO grocery_items (name, unit, quantity_decimal, list_id)
VALUES ('Flour', 'cup', 2.5, 1)
RETURNING *;

-- Test 7: Query items with units
SELECT name, quantity_decimal, unit
FROM grocery_items
WHERE unit IS NOT NULL;
```

### 3. Application Integration Tests

Test the application's ability to:

1. **Create items with units**
   ```javascript
   // Should work
   await createGroceryItem({
     name: 'Milk',
     quantity_decimal: 2.5,
     unit: 'cup',
     list_id: 1
   });
   ```

2. **Query available units**
   ```javascript
   // Get all available units for a category
   const volumeUnits = await db.query(
     'SELECT DISTINCT from_unit FROM unit_conversions WHERE category = $1',
     ['volume']
   );
   ```

3. **Perform conversions**
   ```javascript
   // Convert cups to milliliters
   const conversion = await db.query(
     'SELECT conversion_factor FROM unit_conversions WHERE from_unit = $1 AND to_unit = $2',
     ['cup', 'ml']
   );
   // conversion_factor should be 236.588
   ```

4. **Handle legacy items**
   ```javascript
   // Items without units should still work
   const item = await getGroceryItem(existingItemId);
   // item.unit should be null
   // item.quantity_decimal should be null
   ```

### 4. Performance Tests

```sql
-- Test index usage
EXPLAIN ANALYZE
SELECT * FROM unit_conversions WHERE from_unit = 'cup';
-- Should use idx_unit_conversions_from_unit

EXPLAIN ANALYZE
SELECT * FROM grocery_items WHERE unit = 'cup';
-- Should use idx_grocery_items_unit
```

### 5. Rollback Test

In a development/staging environment:

```bash
# Test rollback
./migrate.sh down

# Verify table was dropped
./migrate.sh verify

# Re-apply migration
./migrate.sh up

# Verify data is restored
psql -U grocery -d grocery_db -c "SELECT COUNT(*) FROM unit_conversions;"
```

## Integration Notes

### For Frontend Developers

The new schema enables:
- Unit selection dropdowns (query `DISTINCT from_unit` from `unit_conversions`)
- Unit conversion UI (use `conversion_factor` to convert quantities)
- Decimal quantity inputs (use `quantity_decimal` for precise measurements)
- Category filtering (filter units by `category`: volume, weight, count)

### For Backend Developers

New columns are optional:
- Existing API endpoints continue to work without changes
- Add unit support gradually to new/updated endpoints
- Consider validation: ensure `unit` values exist in `unit_conversions.from_unit`
- Use `quantity_decimal` for precise measurements (supports up to 2 decimal places)

### Example Query Patterns

```sql
-- Get all volume units
SELECT DISTINCT from_unit
FROM unit_conversions
WHERE category = 'volume'
ORDER BY from_unit;

-- Convert a value
SELECT
    2.5 as original_quantity,
    'cup' as original_unit,
    (2.5 * conversion_factor) as converted_quantity,
    'ml' as converted_unit
FROM unit_conversions
WHERE from_unit = 'cup' AND to_unit = 'ml';

-- Get items with their units
SELECT name, quantity_decimal, unit
FROM grocery_items
WHERE unit IS NOT NULL AND quantity_decimal IS NOT NULL
ORDER BY name;
```

## Troubleshooting

### Migration Fails

If the migration fails:

1. Check PostgreSQL is running: `./migrate.sh verify`
2. Check for existing tables: `\dt` in psql
3. Check migration status: `./migrate.sh status`
4. Review error messages in console output
5. Ensure you have proper database permissions

### Duplicate Key Errors

If you see unique constraint violations:
- The migration may have already run partially
- Check if `unit_conversions` table exists: `\dt unit_conversions`
- If it exists but is incomplete, manually drop it and re-run

### Rollback Fails

If rollback fails:
- Check if the table/columns actually exist
- Manually run the rollback SQL file
- Check for dependent foreign keys (shouldn't be any)

## Additional Resources

- Main migration README: `/home/adam/grocery/server/migrations/README.md`
- Migration script: `/home/adam/grocery/server/migrations/011_add_unit_conversion_support.sql`
- Rollback script: `/home/adam/grocery/server/migrations/rollback/011_drop_unit_conversion_support.sql`
- Migration tool: `/home/adam/grocery/server/migrations/migrate.sh`

## Questions or Issues

If you encounter problems:
1. Check the main migration documentation: `README.md`
2. Review migration status: `./migrate.sh status`
3. Create a backup before troubleshooting: `./migrate.sh backup`
4. Check application logs for database errors
