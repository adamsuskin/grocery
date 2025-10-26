# Custom Categories Migration Guide

Complete guide for upgrading to custom categories feature in the Grocery List application.

**Version:** 1.0
**Last Updated:** October 26, 2025
**Feature Status:** Backend Complete, Frontend UI In Progress

---

## Table of Contents

1. [What's New](#whats-new)
2. [Backward Compatibility](#backward-compatibility)
3. [Database Migration](#database-migration)
4. [Zero Schema Update](#zero-schema-update)
5. [Developer Migration Steps](#developer-migration-steps)
6. [User Experience Changes](#user-experience-changes)
7. [Testing & Verification](#testing--verification)
8. [Rollback Procedure](#rollback-procedure)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## What's New

### Custom Categories Feature

The custom categories feature allows users to create their own item categories beyond the predefined set (Produce, Dairy, Meat, Bakery, Pantry, Frozen, Beverages, Other).

#### Key Features

- **Create Custom Categories**: Define categories specific to your shopping needs
- **Customize Appearance**: Assign colors (hex codes) and icons (emojis) to categories
- **List-Scoped Categories**: Each list has its own set of custom categories
- **Real-Time Sync**: Custom categories sync automatically across all list members
- **Case-Insensitive Uniqueness**: Prevents duplicate categories like "Snacks" and "snacks"
- **Permissions-Based**: Only list owners and editors can manage custom categories
- **Soft Delete Support**: Categories can be archived instead of permanently deleted

#### Benefits

1. **Enhanced Organization**: Group items by diet types (Keto, Vegan, etc.)
2. **Store Layout Matching**: Create categories matching your local store sections
3. **Meal Planning**: Organize by meal types (Breakfast, Lunch, Dinner)
4. **Personal Preferences**: Create priority-based categories (Must Have, Nice to Have)
5. **Shared Understanding**: Teams sharing lists use the same custom categories

#### Use Cases

- **Specialty Diets**: "Keto-Friendly", "Gluten-Free", "Organic"
- **Store Sections**: "Bulk Foods", "International Aisle", "Pharmacy"
- **Event Planning**: "Party Supplies", "Camping Trip", "BBQ Essentials"
- **Household Management**: "Cleaning Supplies", "Pet Food", "Baby Items"

---

## Backward Compatibility

### Fully Backward Compatible

This feature is **100% backward compatible**. No breaking changes.

#### What Stays the Same

- All predefined categories continue to work exactly as before
- Existing items retain their current category assignments
- Category filtering and search functionality unchanged
- Category badges and UI display work as before
- No changes to core grocery item functionality

#### What's New (Additive)

- New `custom_categories` table in database
- New Zero schema table definition (version 10)
- New React hooks for managing custom categories
- New mutation functions (create, update, delete)
- Enhanced category selection to include custom categories

#### Upgrade Safety

- **Zero Data Migration Needed**: Existing data remains untouched
- **No User Action Required**: Users can continue using the app normally
- **Opt-In Feature**: Users choose when to start using custom categories
- **No Performance Impact**: Custom categories don't affect existing functionality

---

## Database Migration

### Prerequisites

- PostgreSQL 12 or higher
- Administrative access to the database
- Backup of existing database (recommended)

### Migration Files

Two migration files are included:

1. **003_create_custom_categories_table.sql** - Creates the custom categories table
2. **004_add_custom_categories_archive.sql** - Adds archive support (optional)

### Migration 003: Create Custom Categories Table

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS custom_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT category_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT category_name_max_length CHECK (LENGTH(name) <= 100),
  CONSTRAINT unique_category_per_list UNIQUE (list_id, LOWER(name))
);
```

#### Key Features

- **UUID Primary Key**: Globally unique identifiers
- **List Scoped**: Categories belong to specific lists
- **Case-Insensitive Names**: Prevents "Snacks" and "snacks" duplicates
- **Cascade Delete**: Categories deleted when list is deleted
- **User Tracking**: Tracks who created each category
- **Timestamps**: Creation and update times tracked automatically
- **Display Order**: Support for custom ordering (future feature)

#### Indexes

```sql
CREATE INDEX idx_custom_categories_list_id ON custom_categories(list_id);
CREATE INDEX idx_custom_categories_created_by ON custom_categories(created_by);
CREATE INDEX idx_custom_categories_created_at ON custom_categories(created_at DESC);
CREATE INDEX idx_custom_categories_display_order ON custom_categories(list_id, display_order DESC);
```

#### Running the Migration

**Option 1: psql Command Line**

```bash
# Connect to your database
psql -U postgres -d grocery_app

# Run the migration
\i /home/adam/grocery/server/db/migrations/003_create_custom_categories_table.sql

# Verify the table was created
\d custom_categories

# Check indexes
\di idx_custom_categories*
```

**Option 2: Node.js Script**

```javascript
const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'grocery_app',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  await client.connect();

  try {
    const migration = fs.readFileSync(
      './server/db/migrations/003_create_custom_categories_table.sql',
      'utf8'
    );

    await client.query(migration);
    console.log('Migration 003 completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
```

**Option 3: Docker Container**

```bash
# Copy migration file to container
docker cp server/db/migrations/003_create_custom_categories_table.sql grocery_postgres:/tmp/

# Execute migration
docker exec -it grocery_postgres psql -U postgres -d grocery_app -f /tmp/003_create_custom_categories_table.sql
```

#### Verification

```sql
-- Check table exists
SELECT tablename FROM pg_tables WHERE tablename = 'custom_categories';

-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'custom_categories';

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'custom_categories';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'custom_categories';
```

### Migration 004: Archive Support (Optional)

This migration adds soft delete support for custom categories.

```sql
ALTER TABLE custom_categories
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE custom_categories
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
```

#### When to Apply

- Apply if you want to support archiving categories instead of hard deleting
- Optional - can be applied later without data loss
- Recommended for production environments

---

## Zero Schema Update

### Current Schema Version

The Zero schema must be at **version 10** to support custom categories.

### Schema File Location

`/home/adam/grocery/src/zero-schema.ts`

### Custom Categories Table Definition

```typescript
custom_categories: {
  tableName: 'custom_categories' as const,
  primaryKey: ['id'] as const,
  columns: {
    id: { type: 'string' as const },
    name: { type: 'string' as const },
    list_id: { type: 'string' as const },
    created_by: { type: 'string' as const },
    color: { type: 'string' as const },
    icon: { type: 'string' as const },
    display_order: { type: 'number' as const },
    createdAt: { type: 'number' as const },
    updatedAt: { type: 'number' as const },
  },
  relationships: {
    list: {
      source: 'list_id' as const,
      dest: {
        field: 'id' as const,
        schema: () => schema.tables.lists,
      },
    },
    creator: {
      source: 'created_by' as const,
      dest: {
        field: 'id' as const,
        schema: () => schema.tables.users,
      },
    },
  },
}
```

### Verification

Check that your schema includes the custom_categories table:

```bash
# Search for custom_categories in schema file
grep -n "custom_categories" src/zero-schema.ts

# Verify schema version is 10
grep "version:" src/zero-schema.ts
```

Expected output:
```
2:  version: 10,
166:    custom_categories: {
```

### If Schema Version is Outdated

If your schema version is less than 10:

1. **Pull Latest Changes**: Ensure you have the latest code
2. **Update Schema Manually**: Add the custom_categories table definition
3. **Increment Version**: Change version to 10
4. **Clear Zero Cache**: See [Zero Cache Management](#zero-cache-management)

---

## Developer Migration Steps

### Step 1: Backup Database

Before any migration, create a backup:

```bash
# PostgreSQL backup
pg_dump -U postgres grocery_app > backup_before_custom_categories_$(date +%Y%m%d).sql

# Verify backup
ls -lh backup_before_custom_categories_*.sql
```

### Step 2: Run Database Migration

```bash
# Method 1: Direct psql
psql -U postgres -d grocery_app -f server/db/migrations/003_create_custom_categories_table.sql

# Method 2: Using npm script (if configured)
npm run migrate:up 003

# Method 3: Docker environment
docker-compose exec db psql -U postgres -d grocery_app -f /migrations/003_create_custom_categories_table.sql
```

### Step 3: Verify Database Changes

```sql
-- Connect to database
psql -U postgres -d grocery_app

-- Check table
\d custom_categories

-- Expected output should show:
-- - id (uuid, primary key)
-- - name (varchar(100), not null)
-- - list_id (uuid, not null)
-- - created_by (uuid)
-- - color (varchar(7))
-- - icon (varchar(50))
-- - display_order (integer)
-- - created_at (timestamp with time zone)
-- - updated_at (timestamp with time zone)
```

### Step 4: Update Zero Schema

Ensure `src/zero-schema.ts` is at version 10:

```typescript
export const schema = {
  version: 10,  // Must be 10 or higher
  tables: {
    // ... existing tables
    custom_categories: {
      // ... definition should be present
    },
  },
} as const;
```

### Step 5: Clear Zero Cache (if needed)

Zero caches schema information. After schema changes:

**Option A: Restart Zero Cache Server**

```bash
# If running as a service
sudo systemctl restart zero-cache

# If using Docker
docker-compose restart zero-cache

# If using Docker individual container
docker restart grocery_zero_cache
```

**Option B: Clear Client Cache**

```bash
# Clear browser storage
# In browser DevTools console:
localStorage.clear();
sessionStorage.clear();

# Or programmatically in your app:
# Add to app initialization
if (window.location.search.includes('clearCache=true')) {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/';
}
```

**Option C: Force Schema Refresh**

```typescript
// In zero-store.ts initialization
const zero = new Zero({
  server: import.meta.env.VITE_PUBLIC_SERVER,
  schema,
  userID: getCurrentUserId(),
  // Force fresh connection
  kvStore: 'mem', // Use in-memory store for fresh start
});
```

### Step 6: Install Dependencies (if needed)

If any new dependencies were added:

```bash
npm install
```

### Step 7: Rebuild Application

```bash
# Development build
npm run dev

# Production build
npm run build
```

### Step 8: Restart Application

```bash
# Development server
npm run dev

# Production server (if using PM2)
pm2 restart grocery-app

# Production server (if using systemd)
sudo systemctl restart grocery-app

# Docker
docker-compose restart app
```

### Step 9: Verify Integration

Open browser console and test:

```javascript
// Test hooks are available
import { useCustomCategories, useCustomCategoryMutations } from './hooks/useCustomCategories';

// Should not throw errors
console.log('Custom categories hooks loaded successfully');

// Check Zero schema includes custom_categories
console.log(zero.schema.tables.custom_categories);
```

### Step 10: Run Tests

```bash
# Run all tests
npm test

# Run custom category tests specifically
npm test -- useCustomCategories
npm test -- categoryValidation

# Run integration tests
npm run test:integration
```

---

## User Experience Changes

### What Users Will See

#### No Immediate Changes

When the feature is first deployed:

1. **No Visual Differences**: UI looks the same initially
2. **Predefined Categories Work**: All existing functionality intact
3. **No Action Required**: Users can continue shopping normally

#### When UI Components Are Released

Once the CategoryManager UI is deployed:

1. **New "Manage Categories" Button**: Appears in list settings
2. **Custom Category Creation Dialog**: Form to create new categories
3. **Category Management Interface**: Edit, delete, and organize categories
4. **Enhanced Category Dropdown**: Shows both predefined and custom categories
5. **Custom Category Badges**: Items display with custom category colors/icons

### How to Start Using Custom Categories

#### For List Owners and Editors

**Step 1: Access Category Management**

- Open a list
- Click "Settings" or "List Options"
- Select "Manage Categories" (when UI is available)

**Step 2: Create a Custom Category**

- Click "Add Category" button
- Enter category name (max 100 characters)
- Choose a color (optional)
- Select an icon/emoji (optional)
- Click "Save"

**Step 3: Use Custom Categories**

- When adding a new item, the category dropdown now includes your custom categories
- Custom categories appear after predefined categories
- Select a custom category just like a predefined one

**Step 4: Edit or Delete Categories**

- In "Manage Categories", click on a category to edit
- Change name, color, or icon
- Click "Save" to update
- To delete: Click "Delete" and confirm

### UI Changes to Expect

#### Category Dropdown (AddItemForm)

**Before:**
```
Category: [Produce ▼]
  - Produce
  - Dairy
  - Meat
  - Bakery
  - Pantry
  - Frozen
  - Beverages
  - Other
```

**After:**
```
Category: [Produce ▼]
Standard Categories:
  - Produce
  - Dairy
  - Meat
  - Bakery
  - Pantry
  - Frozen
  - Beverages
  - Other
Custom Categories:
  - Snacks 🍿
  - Cleaning 🧹
  - Pet Food 🐾
```

#### Filter Bar (SearchFilterBar)

**Before:**
```
[All] [Produce] [Dairy] [Meat] [Bakery] [Pantry] [Frozen] [Beverages] [Other]
```

**After:**
```
[All] [Produce] [Dairy] [Meat] [Bakery] [Pantry] [Frozen] [Beverages] [Other] | [Snacks] [Cleaning] [Pet Food]
```

#### Item Display

**Before:**
```
☐ Chocolate Chips [Other] ×2
```

**After (with custom category):**
```
☐ Chocolate Chips [Snacks 🍿] ×2
                   ^custom color applied
```

### Permissions

Only **List Owners** and **Editors** can:
- Create custom categories
- Edit custom categories
- Delete custom categories

**Viewers** can:
- See custom categories
- Use them when adding items (if they have edit permission on items)
- Filter by custom categories

---

## Testing & Verification

### Pre-Deployment Testing Checklist

#### Database Tests

- [ ] Migration runs without errors
- [ ] Table `custom_categories` exists
- [ ] All columns present and correct data types
- [ ] Indexes created successfully
- [ ] Constraints work (unique, not null, check)
- [ ] Triggers fire correctly (updated_at)
- [ ] Foreign key relationships intact
- [ ] Cascade delete works (delete list, categories deleted)

#### Schema Tests

- [ ] Zero schema version is 10
- [ ] `custom_categories` table defined in schema
- [ ] Relationships to lists and users configured
- [ ] Column types match database types

#### API/Hook Tests

- [ ] `useCustomCategories()` hook returns data
- [ ] `useCustomCategoryMutations()` hook provides functions
- [ ] `addCustomCategory()` creates categories
- [ ] `updateCustomCategory()` updates categories
- [ ] `deleteCustomCategory()` removes categories
- [ ] Validation prevents empty names
- [ ] Validation prevents duplicate names (case-insensitive)
- [ ] Validation checks color format (if provided)
- [ ] Permission checks work (owner/editor only)

#### Integration Tests

- [ ] Create category and verify it appears in query
- [ ] Update category and verify changes sync
- [ ] Delete category and verify it's removed
- [ ] Add item with custom category
- [ ] Filter items by custom category
- [ ] Custom category syncs to other users in real-time

### Post-Deployment Verification

#### Basic Functionality

**Test 1: Create a Custom Category**

```typescript
// Open browser console
const { addCustomCategory } = useCustomCategoryMutations();

await addCustomCategory({
  name: 'Test Category',
  listId: '<your-list-id>',
  color: '#FF5733',
  icon: '🧪'
});

// Verify: Check database
// psql: SELECT * FROM custom_categories WHERE name = 'Test Category';
```

**Test 2: Query Custom Categories**

```typescript
const categories = useCustomCategories('<your-list-id>');
console.log(categories);

// Expected output: Array with your test category
// [{ id: '...', name: 'Test Category', color: '#FF5733', icon: '🧪', ... }]
```

**Test 3: Update a Category**

```typescript
const { updateCustomCategory } = useCustomCategoryMutations();

await updateCustomCategory({
  id: '<category-id>',
  name: 'Updated Test Category',
  color: '#00FF00'
});

// Verify: Query again to see update
```

**Test 4: Delete a Category**

```typescript
const { deleteCustomCategory } = useCustomCategoryMutations();

await deleteCustomCategory('<category-id>');

// Verify: Category no longer appears in query
```

#### Multi-User Sync Testing

**Test 5: Real-Time Sync**

1. User A creates a custom category "Snacks"
2. User B (on same list) should see "Snacks" appear automatically
3. User A edits "Snacks" to "Healthy Snacks"
4. User B should see the update in real-time
5. User A deletes "Healthy Snacks"
6. User B should see it disappear

**Expected Sync Latency:** 50-500ms

### Common Issues and Solutions

#### Issue 1: Migration Fails with "Relation Already Exists"

**Cause:** Migration was run previously

**Solution:** This is safe to ignore. The migration uses `IF NOT EXISTS` clauses.

```bash
# Verify table exists
psql -U postgres -d grocery_app -c "\d custom_categories"
```

#### Issue 2: Schema Version Mismatch

**Symptom:** Zero errors about unknown table

**Cause:** Zero cache has outdated schema

**Solution:**
```bash
# Clear Zero cache
rm -rf ~/.zero/cache

# Restart Zero cache server
docker-compose restart zero-cache

# Or clear browser storage
localStorage.clear();
sessionStorage.clear();
```

#### Issue 3: Validation Errors When Creating Categories

**Symptom:** "Category name already exists"

**Cause:** Case-insensitive uniqueness constraint

**Solution:** Use a different name. "Snacks" and "snacks" are considered duplicates.

#### Issue 4: Permission Denied When Creating Category

**Symptom:** "User must be authenticated" or "No permission to edit"

**Cause:** User is not owner or editor of the list

**Solution:** Verify user permissions:
```sql
SELECT permission_level FROM list_members
WHERE list_id = '<list-id>' AND user_id = '<user-id>';
```

#### Issue 5: Custom Categories Not Appearing

**Symptom:** Query returns empty array

**Cause:** Categories belong to different list or Zero cache issue

**Solution:**
```typescript
// Verify listId is correct
console.log('Current list ID:', listId);

// Check database directly
// psql: SELECT * FROM custom_categories WHERE list_id = '<list-id>';

// Clear cache and retry
localStorage.clear();
location.reload();
```

### Performance Testing

#### Load Testing

Test with high volume of categories:

```typescript
// Create 100 categories
for (let i = 0; i < 100; i++) {
  await addCustomCategory({
    name: `Test Category ${i}`,
    listId: listId,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
  });
}

// Measure query performance
console.time('Query 100 categories');
const categories = useCustomCategories(listId);
console.timeEnd('Query 100 categories');

// Expected: < 100ms
```

#### Sync Performance

Test real-time sync with multiple clients:

1. Open app in 3 different browsers/tabs
2. Create a category in tab 1
3. Measure time until it appears in tabs 2 and 3
4. Expected: < 500ms

---

## Rollback Procedure

### When to Rollback

Consider rollback if:

- Critical bugs discovered in production
- Data corruption occurs
- Performance degradation observed
- User experience significantly impacted
- Zero sync issues causing data loss

### Rollback Steps

#### Step 1: Stop Application

```bash
# Stop the application to prevent new data
pm2 stop grocery-app
# or
docker-compose stop app
```

#### Step 2: Backup Current State

```bash
# Backup including custom categories data
pg_dump -U postgres grocery_app > backup_with_custom_categories_$(date +%Y%m%d_%H%M%S).sql

# Backup just custom categories table
pg_dump -U postgres -t custom_categories grocery_app > backup_custom_categories_only.sql
```

#### Step 3: Revert Database Schema

**Option A: Drop Table (Permanent Data Loss)**

```sql
-- WARNING: This permanently deletes all custom categories
DROP TABLE IF EXISTS custom_categories CASCADE;
```

**Option B: Disable Table (Preserve Data)**

```sql
-- Rename table to preserve data
ALTER TABLE custom_categories RENAME TO custom_categories_backup;
```

#### Step 4: Revert Zero Schema

Edit `src/zero-schema.ts`:

```typescript
export const schema = {
  version: 9,  // ← Decrement version
  tables: {
    // ... other tables

    // Comment out or remove custom_categories
    // custom_categories: { ... },
  },
} as const;
```

#### Step 5: Rebuild Application

```bash
# Rebuild with reverted schema
npm run build

# Or for development
npm run dev
```

#### Step 6: Clear Zero Cache

```bash
# Clear server-side cache
docker-compose restart zero-cache

# Clear client-side cache (in browser console)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

#### Step 7: Restart Application

```bash
pm2 restart grocery-app
# or
docker-compose start app
```

#### Step 8: Verify Rollback

```bash
# Verify table is gone or renamed
psql -U postgres -d grocery_app -c "\dt custom_categories"

# Verify app works without custom categories
# Test creating items, filtering, etc.
```

### Data Preservation During Rollback

#### Preserve Custom Category Data

If you need to rollback but want to preserve custom category data for future use:

```sql
-- Rename table instead of dropping
ALTER TABLE custom_categories RENAME TO custom_categories_backup;

-- Later, to restore:
ALTER TABLE custom_categories_backup RENAME TO custom_categories;
```

#### Handle Orphaned Items

Items may reference custom category names that no longer exist in predefined categories.

**Option 1: Reset to "Other"**

```sql
-- Find items with non-predefined categories
UPDATE grocery_items
SET category = 'Other'
WHERE category NOT IN ('Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Beverages', 'Other');
```

**Option 2: Preserve as Text**

```sql
-- Leave items as-is (they'll display with custom category names)
-- No action needed, but UI may not recognize them
```

### Support Contacts

If you need assistance during rollback:

- **Technical Lead**: [Contact information]
- **DevOps Team**: [Contact information]
- **Emergency Hotline**: [Contact information]
- **Slack Channel**: #grocery-app-support
- **Email**: support@groceryapp.com

### Post-Rollback

After successful rollback:

1. **Document Issues**: Create incident report detailing what went wrong
2. **User Communication**: Notify users of the rollback and timeline
3. **Bug Fixes**: Address issues that caused the rollback
4. **Re-Testing**: Thoroughly test fixes before re-deploying
5. **Gradual Rollout**: Consider staged deployment (10% → 50% → 100%)

---

## Troubleshooting

### Issue: "Relation custom_categories does not exist"

**Symptoms:**
- Database queries fail
- Zero cannot find table

**Diagnosis:**
```sql
-- Check if table exists
SELECT tablename FROM pg_tables WHERE tablename = 'custom_categories';
```

**Resolution:**
```bash
# Run migration
psql -U postgres -d grocery_app -f server/db/migrations/003_create_custom_categories_table.sql
```

### Issue: "Duplicate key value violates unique constraint"

**Symptoms:**
- Cannot create category with same name
- Error mentions "unique_category_per_list"

**Diagnosis:**
```sql
-- Check existing categories
SELECT id, name, list_id FROM custom_categories WHERE list_id = '<list-id>';
```

**Resolution:**
- Use a different category name
- Case-insensitive check: "Snacks" == "snacks"
- Delete existing category first (if intended)

### Issue: Zero Schema Version Mismatch

**Symptoms:**
- "Unknown table: custom_categories"
- Zero sync errors

**Diagnosis:**
```bash
# Check schema version
grep "version:" src/zero-schema.ts

# Check if custom_categories is defined
grep "custom_categories:" src/zero-schema.ts
```

**Resolution:**
```bash
# Update schema version to 10
# Add custom_categories table definition
# Clear cache
rm -rf ~/.zero/cache
docker-compose restart zero-cache
```

### Issue: Custom Categories Not Syncing

**Symptoms:**
- User A creates category
- User B doesn't see it

**Diagnosis:**
```javascript
// Check WebSocket connection
console.log(zero.connectionStatus);

// Verify both users on same list
console.log('User A list:', listIdA);
console.log('User B list:', listIdB);
```

**Resolution:**
1. Check network connectivity
2. Verify both users have access to the list
3. Restart Zero cache server
4. Clear browser cache and reload

### Issue: Permission Denied Errors

**Symptoms:**
- "No permission to edit categories"
- "User must be authenticated"

**Diagnosis:**
```sql
-- Check user permissions
SELECT lm.permission_level, u.name, l.name as list_name
FROM list_members lm
JOIN users u ON lm.user_id = u.id
JOIN lists l ON lm.list_id = l.id
WHERE lm.user_id = '<user-id>' AND lm.list_id = '<list-id>';
```

**Resolution:**
- Ensure user is owner or editor
- Viewers cannot manage categories
- Check authentication status

### Issue: High Database Load

**Symptoms:**
- Slow queries
- Timeout errors

**Diagnosis:**
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM custom_categories WHERE list_id = '<list-id>';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'custom_categories';
```

**Resolution:**
```sql
-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_custom_categories_list_id ON custom_categories(list_id);

-- Vacuum and analyze
VACUUM ANALYZE custom_categories;
```

---

## FAQ

### General Questions

**Q: Will my existing categories disappear?**

A: No. All predefined categories (Produce, Dairy, etc.) remain unchanged. Custom categories are additive.

**Q: Can I still use the predefined categories?**

A: Yes! Predefined categories work exactly as before. Custom categories supplement them.

**Q: How many custom categories can I create?**

A: There's no hard limit, but we recommend keeping it under 50 per list for optimal performance and user experience.

**Q: Are custom categories shared with my list members?**

A: Yes. Custom categories are list-scoped, so all members see the same custom categories.

**Q: Can I delete a custom category?**

A: Yes, but only if you're the list owner or an editor. Viewers cannot delete categories.

### Technical Questions

**Q: What happens to items when I delete a custom category?**

A: Currently, items retain the deleted category name. Future updates will handle this automatically by resetting to "Other" or prompting for reassignment.

**Q: Can I have the same custom category name on different lists?**

A: Yes! Custom categories are list-scoped. "Snacks" on List A is independent of "Snacks" on List B.

**Q: Are custom categories case-sensitive?**

A: No. "Snacks" and "snacks" are considered the same category to prevent duplicates.

**Q: Can I import/export custom categories?**

A: Not yet, but this feature is planned. Currently, categories are stored per-list.

**Q: Do custom categories work offline?**

A: Yes! Zero's offline-first architecture means custom categories sync when you reconnect.

**Q: What's the character limit for category names?**

A: 100 characters. This should be sufficient for most use cases.

**Q: Can I use special characters in category names?**

A: Yes, all UTF-8 characters are supported, including emojis.

**Q: How are custom categories sorted?**

A: By default, they're sorted by creation date (oldest first). Future updates will add manual reordering.

### Migration Questions

**Q: Do I need to upgrade immediately?**

A: No. The migration is backward compatible. Upgrade when convenient.

**Q: Will the migration cause downtime?**

A: No. The database migration adds a new table without affecting existing tables. Zero downtime deployment.

**Q: Can I rollback after upgrading?**

A: Yes. See the [Rollback Procedure](#rollback-procedure) section for detailed steps.

**Q: What if the migration fails?**

A: The migration is idempotent (uses `IF NOT EXISTS`). You can safely re-run it. If issues persist, contact support.

**Q: Do I need to restart the application?**

A: Yes, after the migration, restart the application to load the new schema.

**Q: Will users notice any changes immediately?**

A: No immediate UI changes. The feature becomes available once the UI components are deployed.

### Development Questions

**Q: How do I test custom categories in development?**

A: Use the React hooks in browser console or create a test component. See [Testing & Verification](#testing--verification).

**Q: Can I use custom categories in the REST API?**

A: The feature uses Zero for real-time sync. Direct REST API access is not yet implemented.

**Q: How do I contribute to the custom categories feature?**

A: Check the open issues on GitHub. UI components and enhanced features are welcome contributions.

**Q: Where can I find code examples?**

A: See `/home/adam/grocery/docs/CUSTOM_CATEGORIES.md` for comprehensive code examples and integration guides.

**Q: Is there TypeScript support?**

A: Yes! Full TypeScript definitions are available in `/home/adam/grocery/src/types.ts`.

---

## Additional Resources

### Documentation

- [Custom Categories Feature Documentation](/home/adam/grocery/docs/CUSTOM_CATEGORIES.md)
- [Zero Sync Documentation](https://zerosync.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Hooks Reference](https://react.dev/reference/react)

### Code References

- **Migration Files**: `/home/adam/grocery/server/db/migrations/003_create_custom_categories_table.sql`
- **Zero Schema**: `/home/adam/grocery/src/zero-schema.ts`
- **Type Definitions**: `/home/adam/grocery/src/types.ts`
- **React Hooks**: `/home/adam/grocery/src/hooks/useCustomCategories.ts`
- **Database Schema**: `/home/adam/grocery/server/db/schema.sql`

### Support Channels

- **GitHub Issues**: [Repository Issues Page]
- **Slack**: #grocery-app-dev
- **Email**: dev-support@groceryapp.com
- **Documentation**: `/home/adam/grocery/docs/`

---

## Changelog

### Version 1.0 (October 26, 2025)

**Initial Release**

- Database migration for `custom_categories` table
- Zero schema v10 with custom categories support
- React hooks for CRUD operations
- TypeScript type definitions
- Validation and permission checks
- Real-time sync via Zero
- Backend complete and production-ready

**Coming in v1.1**

- CategoryManager UI component
- Full integration with AddItemForm
- Enhanced SearchFilterBar with custom category chips
- Category icons and colors in UI
- Orphaned item handling
- Bulk operations support

---

**End of Migration Guide**

For questions or issues, please contact the development team or refer to the main [Custom Categories Documentation](/home/adam/grocery/docs/CUSTOM_CATEGORIES.md).
