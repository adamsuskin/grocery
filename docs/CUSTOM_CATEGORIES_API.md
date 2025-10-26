# Custom Categories API Documentation

Comprehensive API documentation for the Custom Categories feature in the Grocery List application.

**Version:** 1.0.0
**Last Updated:** 2025-10-26

---

## Table of Contents

1. [Overview](#overview)
2. [Hooks API](#hooks-api)
   - [useCustomCategories](#usecustomcategories)
   - [useCustomCategoryMutations](#usecustomcategorymutations)
3. [Mutations Reference](#mutations-reference)
4. [Database Schema](#database-schema)
5. [Zero Schema](#zero-schema)
6. [Integration Guide](#integration-guide)
7. [Validation & Error Handling](#validation--error-handling)
8. [Activity Logging](#activity-logging)
9. [API Examples](#api-examples)
10. [Troubleshooting](#troubleshooting)
11. [Performance Considerations](#performance-considerations)

---

## Overview

The Custom Categories API provides a complete solution for managing user-defined categories in grocery lists. It extends the predefined category system (Produce, Dairy, Meat, etc.) with user-created categories that support customization, archiving, collaboration, and real-time sync via Zero.

### Key Features

- Create, update, delete, and archive custom categories
- Color and icon customization
- Display order management
- Permission-based access control (owner/editor/viewer)
- Real-time sync across devices via Zero
- Category suggestions and voting (collaboration features)
- Activity logging and audit trail
- Comprehensive validation

### Architecture

```
┌─────────────────┐
│  React Hooks    │  useCustomCategories, useCustomCategoryMutations
└────────┬────────┘
         │
┌────────▼────────┐
│   Zero Store    │  Real-time sync & local-first data
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  Server-side persistence
└─────────────────┘
```

---

## Hooks API

### useCustomCategories

Query custom categories for a specific list with real-time updates.

#### Signature

```typescript
function useCustomCategories(
  listId?: string,
  includeArchived?: boolean
): CustomCategory[]
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `listId` | `string` | No | `undefined` | Filter categories by list ID. If omitted, returns all accessible categories. |
| `includeArchived` | `boolean` | No | `false` | Whether to include archived categories in results. |

#### Returns

Returns an array of `CustomCategory` objects sorted by:
1. Display order (descending - higher priority first)
2. Creation date (ascending - oldest first)

#### CustomCategory Type

```typescript
interface CustomCategory {
  id: string;                    // Unique category identifier
  name: string;                  // Category name (1-100 chars)
  listId: string;                // List this category belongs to
  createdBy: string;             // User ID who created it
  color?: string;                // Hex color code (e.g., #FF5733)
  icon?: string;                 // Emoji or icon (1-10 chars)
  displayOrder: number;          // Display priority (higher = first)
  isArchived: boolean;           // Soft delete flag
  archivedAt?: number;           // Timestamp when archived
  isLocked: boolean;             // Whether locked (owner-only edit)
  lastEditedBy?: string;         // User who last edited
  createdAt: number;             // Creation timestamp
  updatedAt: number;             // Last update timestamp
}
```

#### Usage Example

```typescript
import { useCustomCategories } from '../hooks/useCustomCategories';

function CategoryList({ listId }) {
  // Get active categories only
  const categories = useCustomCategories(listId);

  // Get all categories including archived
  const allCategories = useCustomCategories(listId, true);

  return (
    <div>
      <h3>Active Categories: {categories.length}</h3>
      {categories.map(cat => (
        <div key={cat.id}>
          <span>{cat.icon}</span>
          <span style={{ color: cat.color }}>{cat.name}</span>
        </div>
      ))}
    </div>
  );
}
```

#### Real-time Updates

The hook automatically subscribes to changes and re-renders when:
- A category is added, updated, or deleted
- A category is archived or restored
- Category properties change (name, color, icon, order)

---

### useCustomCategoryMutations

Provides functions for creating, updating, and managing custom categories.

#### Signature

```typescript
function useCustomCategoryMutations(): {
  addCustomCategory: (input: CreateCustomCategoryInput, existingCategories?: CustomCategory[]) => Promise<void>;
  updateCustomCategory: (input: UpdateCustomCategoryInput, existingCategories?: CustomCategory[]) => Promise<void>;
  deleteCustomCategory: (categoryId: string) => Promise<void>;
  archiveCategory: (categoryId: string) => Promise<void>;
  restoreCategory: (categoryId: string) => Promise<void>;
  deleteMultipleCategories: (categoryIds: string[]) => Promise<void>;
  updateMultipleCategories: (updates: Array<{ id: string; changes: Partial<CustomCategory> }>) => Promise<void>;
  mergeCategories: (sourceIds: string[], targetId: string) => Promise<void>;
  exportCategories: (categoryIds: string[]) => Promise<string>;
  updateCategoryOrder: (categoryId: string, newOrder: number) => Promise<void>;
}
```

#### Input Types

##### CreateCustomCategoryInput

```typescript
interface CreateCustomCategoryInput {
  name: string;              // Required: Category name (1-100 chars)
  listId: string;            // Required: List ID
  color?: string;            // Optional: Hex color code
  icon?: string;             // Optional: Emoji or icon
  displayOrder?: number;     // Optional: Display priority (default: 0)
}
```

##### UpdateCustomCategoryInput

```typescript
interface UpdateCustomCategoryInput {
  id: string;                // Required: Category ID to update
  name?: string;             // Optional: New name
  color?: string;            // Optional: New color
  icon?: string;             // Optional: New icon
  displayOrder?: number;     // Optional: New display order
}
```

#### Usage Example

```typescript
import { useCustomCategoryMutations } from '../hooks/useCustomCategories';

function CategoryManager({ listId }) {
  const {
    addCustomCategory,
    updateCustomCategory,
    archiveCategory,
    deleteCustomCategory
  } = useCustomCategoryMutations();

  const handleCreate = async () => {
    try {
      await addCustomCategory({
        name: 'Organic',
        listId,
        color: '#4CAF50',
        icon: '🌱'
      });
      console.log('Category created successfully');
    } catch (error) {
      console.error('Failed to create category:', error.message);
    }
  };

  const handleUpdate = async (categoryId: string) => {
    try {
      await updateCustomCategory({
        id: categoryId,
        name: 'Organic & Natural',
        color: '#8BC34A'
      });
      console.log('Category updated successfully');
    } catch (error) {
      console.error('Failed to update category:', error.message);
    }
  };

  const handleArchive = async (categoryId: string) => {
    try {
      await archiveCategory(categoryId);
      console.log('Category archived successfully');
    } catch (error) {
      console.error('Failed to archive category:', error.message);
    }
  };

  return (
    <div>
      <button onClick={handleCreate}>Create Category</button>
    </div>
  );
}
```

---

## Mutations Reference

### addCustomCategory

Creates a new custom category with validation and permission checks.

#### Signature

```typescript
async function addCustomCategory(
  input: CreateCustomCategoryInput,
  existingCategories?: CustomCategory[]
): Promise<void>
```

#### Behavior

- Validates category name (length, duplicates, predefined conflicts)
- Validates color format (hex codes only)
- Validates icon (length and character restrictions)
- Checks user authentication (cannot be demo-user)
- Creates category with unique ID (nanoid)
- Logs activity to list_activities table

#### Throws

- `'User must be authenticated to create custom categories'` - User not authenticated
- `'List ID is required'` - Missing list ID
- `'Category name cannot be empty'` - Empty name after trimming
- `'Category name must be between 1 and 100 characters'` - Name too long/short
- `'Cannot use predefined category names...'` - Conflicts with predefined categories
- `'A category with this name already exists'` - Duplicate name (case-insensitive)
- `'Color must be a valid hex code...'` - Invalid color format
- `'Icon must be between 1 and 10 characters'` - Invalid icon
- `'Failed to create custom category. Please try again.'` - Database error

#### Example

```typescript
await addCustomCategory({
  name: 'Snacks',
  listId: 'list-123',
  color: '#FF5733',
  icon: '🍿',
  displayOrder: 10
});
```

---

### updateCustomCategory

Updates an existing custom category with partial updates supported.

#### Signature

```typescript
async function updateCustomCategory(
  input: UpdateCustomCategoryInput,
  existingCategories?: CustomCategory[]
): Promise<void>
```

#### Behavior

- Validates only fields being updated
- Checks user authentication
- Checks user has edit permission (owner or editor)
- Respects category locking (locked categories can only be edited by owner)
- Updates only specified fields
- Logs changes to list_activities table

#### Throws

- `'User must be authenticated to update custom categories'` - User not authenticated
- `'Category ID is required'` - Missing category ID
- `'At least one field must be provided for update'` - No fields to update
- `'Category not found'` - Category doesn't exist
- `'You do not have permission to edit categories in this list...'` - Insufficient permissions
- Validation errors (same as addCustomCategory)
- `'Failed to update custom category. Please try again.'` - Database error

#### Example

```typescript
// Update name only
await updateCustomCategory({
  id: 'cat-456',
  name: 'Healthy Snacks'
});

// Update multiple fields
await updateCustomCategory({
  id: 'cat-456',
  name: 'Organic Snacks',
  color: '#4CAF50',
  icon: '🥕'
});

// Update display order
await updateCustomCategory({
  id: 'cat-456',
  displayOrder: 20
});
```

---

### archiveCategory

Archives a category (soft delete). Category remains in database but hidden by default.

#### Signature

```typescript
async function archiveCategory(categoryId: string): Promise<void>
```

#### Behavior

- Checks user authentication
- Checks user has edit permission (owner or editor)
- Prevents archiving already archived categories
- Sets `is_archived` to true and `archived_at` to current timestamp
- Items using this category remain unchanged (preserves historical data)
- Logs activity to list_activities table

#### Throws

- `'User must be authenticated to archive custom categories'` - User not authenticated
- `'Category ID is required'` - Missing category ID
- `'Category not found'` - Category doesn't exist
- `'Category is already archived'` - Already archived
- `'You do not have permission to archive categories from this list...'` - Insufficient permissions
- `'Failed to archive custom category'` - Database error

#### Example

```typescript
await archiveCategory('cat-456');
```

---

### restoreCategory

Restores an archived category, making it active again.

#### Signature

```typescript
async function restoreCategory(categoryId: string): Promise<void>
```

#### Behavior

- Checks user authentication
- Checks user has edit permission (owner or editor)
- Prevents restoring non-archived categories
- Sets `is_archived` to false and `archived_at` to null
- Logs activity to list_activities table

#### Throws

- `'User must be authenticated to restore custom categories'` - User not authenticated
- `'Category ID is required'` - Missing category ID
- `'Category not found'` - Category doesn't exist
- `'Category is not archived'` - Not archived
- `'You do not have permission to restore categories in this list...'` - Insufficient permissions
- `'Failed to restore custom category'` - Database error

#### Example

```typescript
await restoreCategory('cat-456');
```

---

### deleteCustomCategory

Permanently deletes a category. Can only delete archived categories.

#### Signature

```typescript
async function deleteCustomCategory(categoryId: string): Promise<void>
```

#### Behavior

- Checks user authentication
- Checks user has edit permission (owner or editor)
- Requires category to be archived first (safety measure)
- Checks no items are using this category
- Permanently removes from database
- Logs activity to list_activities table

#### Throws

- `'User must be authenticated to delete custom categories'` - User not authenticated
- `'Category ID is required'` - Missing category ID
- `'Category not found'` - Category doesn't exist
- `'Cannot permanently delete an active category. Archive it first.'` - Not archived
- `'You do not have permission to delete categories from this list...'` - Insufficient permissions
- `'Cannot delete category. N item(s) are still using this category...'` - Items still reference it
- `'Failed to delete custom category'` - Database error

#### Example

```typescript
// Two-step deletion process
await archiveCategory('cat-456');
await deleteCustomCategory('cat-456');
```

---

### deleteMultipleCategories

Deletes multiple categories in one operation.

#### Signature

```typescript
async function deleteMultipleCategories(categoryIds: string[]): Promise<void>
```

#### Behavior

- Validates all category IDs exist
- Checks permissions for each category's list
- Deletes categories sequentially
- Does not check archive status (use with caution)

#### Throws

- `'User must be authenticated to delete custom categories'` - User not authenticated
- `'At least one category ID is required'` - Empty array
- `'No valid categories found to delete'` - None exist
- `'You do not have permission to delete categories from list...'` - Insufficient permissions
- `'Failed to delete some categories. Please try again.'` - Database error

#### Example

```typescript
await deleteMultipleCategories(['cat-1', 'cat-2', 'cat-3']);
```

---

### updateMultipleCategories

Updates multiple categories in one operation. Useful for bulk operations.

#### Signature

```typescript
async function updateMultipleCategories(
  updates: Array<{ id: string; changes: Partial<CustomCategory> }>
): Promise<void>
```

#### Behavior

- Validates all updates before applying any
- Checks permissions for each category's list
- Applies updates sequentially
- All updates use the same timestamp

#### Throws

- `'User must be authenticated to update custom categories'` - User not authenticated
- `'At least one update is required'` - Empty array
- `'Category ID is required for all updates'` - Missing ID
- `'At least one field must be provided for each update'` - Empty changes
- `'No valid categories found to update'` - None exist
- `'You do not have permission to edit categories in list...'` - Insufficient permissions
- `'Failed to update some categories. Please try again.'` - Database error

#### Example

```typescript
// Bulk color change
await updateMultipleCategories([
  { id: 'cat-1', changes: { color: '#FF5733' } },
  { id: 'cat-2', changes: { color: '#FF5733' } },
  { id: 'cat-3', changes: { color: '#FF5733' } }
]);
```

---

### mergeCategories

Merges multiple source categories into a single target category.

#### Signature

```typescript
async function mergeCategories(
  sourceIds: string[],
  targetId: string
): Promise<void>
```

#### Behavior

- Validates all categories exist
- Ensures all categories are from the same list
- Checks user has permission
- Moves all items from source categories to target
- Deletes source categories
- Logs merge activity

#### Throws

- `'User must be authenticated to merge custom categories'` - User not authenticated
- `'At least one source category is required'` - Empty sources
- `'Target category ID is required'` - Missing target
- `'Cannot merge a category into itself'` - Target in sources
- `'Target category not found'` - Target doesn't exist
- `'No valid source categories found'` - Sources don't exist
- `'Cannot merge categories from different lists'` - Mixed lists
- `'You do not have permission to merge categories in this list...'` - Insufficient permissions
- `'Failed to merge categories. Some changes may have been applied...'` - Database error

#### Example

```typescript
// Merge "Snacks" and "Treats" into "Snack Foods"
await mergeCategories(['cat-snacks', 'cat-treats'], 'cat-snack-foods');
```

---

### exportCategories

Exports selected categories as JSON for backup or sharing.

#### Signature

```typescript
async function exportCategories(categoryIds: string[]): Promise<string>
```

#### Behavior

- Fetches categories by IDs
- Strips internal fields (id, listId, createdBy, timestamps)
- Returns formatted JSON string
- Does not require authentication (read-only)

#### Returns

JSON string containing category definitions:

```json
[
  {
    "name": "Organic",
    "color": "#4CAF50",
    "icon": "🌱"
  },
  {
    "name": "Snacks",
    "color": "#FF5733",
    "icon": "🍿"
  }
]
```

#### Throws

- `'At least one category ID is required'` - Empty array
- `'No valid categories found to export'` - None exist

#### Example

```typescript
const json = await exportCategories(['cat-1', 'cat-2']);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'categories.json';
link.click();
```

---

### updateCategoryOrder

Updates the display order of a single category.

#### Signature

```typescript
async function updateCategoryOrder(
  categoryId: string,
  newOrder: number
): Promise<void>
```

#### Behavior

- Validates order is a valid number
- Checks user has edit permission
- Updates display_order field
- Categories are sorted by display_order DESC (higher = first)

#### Throws

- `'User must be authenticated to update custom categories'` - User not authenticated
- `'Category ID is required'` - Missing category ID
- `'Display order must be a valid number'` - Invalid order
- `'Category not found'` - Category doesn't exist
- `'You do not have permission to reorder categories in this list...'` - Insufficient permissions
- `'Failed to update category order. Please try again.'` - Database error

#### Example

```typescript
// Set category to highest priority
await updateCategoryOrder('cat-456', 100);

// Set category to lowest priority
await updateCategoryOrder('cat-789', 0);
```

---

## Database Schema

### custom_categories Table

PostgreSQL table structure for storing custom categories.

```sql
CREATE TABLE custom_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE,
  is_locked BOOLEAN DEFAULT FALSE,
  last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT category_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT category_name_max_length CHECK (LENGTH(name) <= 100),
  CONSTRAINT unique_category_per_list UNIQUE (list_id, LOWER(name))
);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, auto-generated |
| `name` | VARCHAR(100) | No | Category name, case-insensitive unique per list |
| `list_id` | UUID | No | Foreign key to lists table, cascade delete |
| `created_by` | UUID | Yes | Foreign key to users table, NULL on user delete |
| `color` | VARCHAR(7) | Yes | Hex color code (e.g., #FF5733) |
| `icon` | VARCHAR(50) | Yes | Emoji or icon identifier |
| `display_order` | INTEGER | No | Display priority, default 0 |
| `is_archived` | BOOLEAN | No | Soft delete flag, default false |
| `archived_at` | TIMESTAMP | Yes | When archived, NULL if not archived |
| `is_locked` | BOOLEAN | No | Owner-only edit flag, default false |
| `last_edited_by` | UUID | Yes | Who last edited, NULL if never edited |
| `created_at` | TIMESTAMP | No | Creation timestamp |
| `updated_at` | TIMESTAMP | No | Last update timestamp |

#### Indexes

```sql
-- Basic indexes
CREATE INDEX idx_custom_categories_list_id ON custom_categories(list_id);
CREATE INDEX idx_custom_categories_created_by ON custom_categories(created_by);
CREATE INDEX idx_custom_categories_created_at ON custom_categories(created_at DESC);
CREATE INDEX idx_custom_categories_display_order ON custom_categories(list_id, display_order DESC);

-- Collaboration indexes
CREATE INDEX idx_custom_categories_is_locked ON custom_categories(is_locked);
CREATE INDEX idx_custom_categories_last_edited_by ON custom_categories(last_edited_by);

-- Archive indexes
CREATE INDEX idx_custom_categories_is_archived ON custom_categories(list_id, is_archived) WHERE is_archived = FALSE;
CREATE INDEX idx_custom_categories_archived_at ON custom_categories(archived_at DESC) WHERE archived_at IS NOT NULL;

-- Performance indexes
CREATE INDEX idx_custom_categories_list_active_order
  ON custom_categories(list_id, is_archived, display_order DESC, created_at ASC)
  WHERE is_archived = FALSE;
CREATE INDEX idx_custom_categories_list_name ON custom_categories(list_id, LOWER(name));
CREATE INDEX idx_custom_categories_list_creator ON custom_categories(list_id, created_by);
CREATE INDEX idx_custom_categories_list_updated ON custom_categories(list_id, updated_at DESC);
```

#### Relationships

- **lists**: Many-to-one (cascade delete when list deleted)
- **users** (created_by): Many-to-one (set NULL when user deleted)
- **users** (last_edited_by): Many-to-one (set NULL when user deleted)
- **grocery_items**: One-to-many (items reference categories via category field)

---

## Zero Schema

### Table Definition

Zero schema configuration for real-time sync.

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
    is_archived: { type: 'boolean' as const },
    archived_at: { type: 'number' as const },
    is_locked: { type: 'boolean' as const },
    last_edited_by: { type: 'string' as const },
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
    lastEditor: {
      source: 'last_edited_by' as const,
      dest: {
        field: 'id' as const,
        schema: () => schema.tables.users,
      },
    },
  },
}
```

### Query Examples

```typescript
import { getZeroInstance } from '../zero-store';

const zero = getZeroInstance();

// Query all categories for a list
const categories = await zero.query.custom_categories
  .where('list_id', 'list-123')
  .run();

// Query non-archived categories
const activeCategories = await zero.query.custom_categories
  .where('list_id', 'list-123')
  .where('is_archived', false)
  .run();

// Query categories by creator
const myCategories = await zero.query.custom_categories
  .where('list_id', 'list-123')
  .where('created_by', 'user-456')
  .run();

// Query single category
const category = await zero.query.custom_categories
  .where('id', 'cat-789')
  .run();
```

### Mutation Examples

```typescript
// Create
await zero.mutate.custom_categories.create({
  id: nanoid(),
  name: 'Organic',
  list_id: 'list-123',
  created_by: 'user-456',
  color: '#4CAF50',
  icon: '🌱',
  display_order: 0,
  is_archived: false,
  archived_at: 0,
  is_locked: false,
  last_edited_by: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Update
await zero.mutate.custom_categories.update({
  id: 'cat-789',
  name: 'Organic & Natural',
  color: '#8BC34A',
  updatedAt: Date.now(),
});

// Delete
await zero.mutate.custom_categories.delete({
  id: 'cat-789'
});
```

---

## Integration Guide

### Step 1: Import Dependencies

```typescript
import { useCustomCategories, useCustomCategoryMutations } from '../hooks/useCustomCategories';
import type { CustomCategory, CreateCustomCategoryInput } from '../types';
```

### Step 2: Query Categories

```typescript
function MyComponent({ listId }: { listId: string }) {
  // Get categories with real-time updates
  const categories = useCustomCategories(listId);

  // Categories automatically update when:
  // - New categories are created
  // - Existing categories are updated
  // - Categories are archived/restored
  // - Categories are deleted

  return (
    <div>
      {categories.map(cat => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
}
```

### Step 3: Create Categories

```typescript
function CreateCategoryForm({ listId }: { listId: string }) {
  const { addCustomCategory } = useCustomCategoryMutations();
  const existingCategories = useCustomCategories(listId);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#FF5733');
  const [icon, setIcon] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addCustomCategory(
        {
          name,
          listId,
          color,
          icon,
        },
        existingCategories // For duplicate validation
      );

      // Success - reset form
      setName('');
      setIcon('');
      alert('Category created successfully!');
    } catch (error) {
      // Handle validation or permission errors
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        required
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <input
        type="text"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="Icon (emoji)"
        maxLength={10}
      />
      <button type="submit">Create Category</button>
    </form>
  );
}
```

### Step 4: Update Categories

```typescript
function EditCategoryModal({
  category,
  onClose
}: {
  category: CustomCategory;
  onClose: () => void;
}) {
  const { updateCustomCategory } = useCustomCategoryMutations();
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color || '#FF5733');
  const [icon, setIcon] = useState(category.icon || '');

  const handleSave = async () => {
    try {
      await updateCustomCategory({
        id: category.id,
        name,
        color,
        icon,
      });

      onClose();
      alert('Category updated successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="modal">
      <h2>Edit Category</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <input
        type="text"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        maxLength={10}
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
```

### Step 5: Display Categories

```typescript
function CategoryCard({ category }: { category: CustomCategory }) {
  return (
    <div
      className="category-card"
      style={{
        borderLeft: `4px solid ${category.color || '#ccc'}`,
      }}
    >
      <div className="category-icon">{category.icon}</div>
      <div className="category-name">{category.name}</div>
      {category.isArchived && (
        <span className="archived-badge">Archived</span>
      )}
    </div>
  );
}
```

### Step 6: Handle Category Selection

```typescript
function CategorySelector({
  selectedCategoryId,
  listId,
  onChange
}: {
  selectedCategoryId: string | null;
  listId: string;
  onChange: (categoryId: string) => void;
}) {
  const categories = useCustomCategories(listId);

  return (
    <select
      value={selectedCategoryId || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select a category...</option>

      {/* Predefined categories */}
      <optgroup label="Standard Categories">
        <option value="Produce">Produce</option>
        <option value="Dairy">Dairy</option>
        <option value="Meat">Meat</option>
        {/* ... other predefined categories */}
      </optgroup>

      {/* Custom categories */}
      {categories.length > 0 && (
        <optgroup label="Custom Categories">
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
```

### Step 7: Archive/Restore Categories

```typescript
function CategoryActions({ category }: { category: CustomCategory }) {
  const { archiveCategory, restoreCategory, deleteCustomCategory } = useCustomCategoryMutations();

  const handleArchive = async () => {
    if (!confirm(`Archive "${category.name}"?`)) return;

    try {
      await archiveCategory(category.id);
      alert('Category archived successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRestore = async () => {
    try {
      await restoreCategory(category.id);
      alert('Category restored successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${category.name}"? This cannot be undone.`)) return;

    try {
      await deleteCustomCategory(category.id);
      alert('Category deleted successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="category-actions">
      {!category.isArchived ? (
        <button onClick={handleArchive}>Archive</button>
      ) : (
        <>
          <button onClick={handleRestore}>Restore</button>
          <button onClick={handleDelete}>Delete Permanently</button>
        </>
      )}
    </div>
  );
}
```

---

## Validation & Error Handling

### Validation Functions

The API provides comprehensive validation utilities:

```typescript
import {
  validateCategoryName,
  validateCategoryColor,
  validateCategoryIcon,
  validateCategoryFields
} from '../utils/categoryValidation';
```

#### validateCategoryName

```typescript
function validateCategoryName(
  name: string,
  existingCategories: Array<string | { name: string; id?: string }>,
  excludeId?: string
): string | null
```

**Returns:** Error message or `null` if valid

**Checks:**
- Name is not empty (after trimming)
- Length is between 1-100 characters
- Doesn't conflict with predefined categories (case-insensitive)
- Doesn't duplicate existing categories (case-insensitive)

**Example:**

```typescript
const error = validateCategoryName('Snacks', existingCategories);
if (error) {
  console.error(error);
  // "A category with this name already exists"
}
```

#### validateCategoryColor

```typescript
function validateCategoryColor(color?: string | null): boolean
```

**Returns:** `true` if valid, `false` otherwise

**Accepts:**
- 6-digit hex: `#FF5733`
- 3-digit hex: `#F53`
- `undefined` or empty string (optional field)

**Example:**

```typescript
if (!validateCategoryColor('#GG5733')) {
  console.error('Invalid color format');
}
```

#### validateCategoryIcon

```typescript
function validateCategoryIcon(icon?: string | null): boolean
```

**Returns:** `true` if valid, `false` otherwise

**Checks:**
- Optional (can be empty)
- Length between 1-10 characters if provided
- Any unicode characters allowed

**Example:**

```typescript
if (!validateCategoryIcon('🍕🌮🍔')) {
  console.error('Icon too long');
}
```

#### validateCategoryFields

Validates all fields at once:

```typescript
const errors = validateCategoryFields(
  {
    name: 'Produce',
    color: '#invalid',
    icon: 'X'.repeat(20)
  },
  existingCategories
);

// errors = {
//   name: 'Cannot use predefined category names...',
//   color: 'Color must be a valid hex code...',
//   icon: 'Icon must be between 1 and 10 characters'
// }
```

### Error Handling Best Practices

```typescript
async function createCategory(input: CreateCustomCategoryInput) {
  try {
    await addCustomCategory(input);
    return { success: true };
  } catch (error) {
    // Type guard for Error objects
    if (error instanceof Error) {
      // Check specific error types
      if (error.message.includes('authenticated')) {
        return { success: false, error: 'Please log in to create categories' };
      }

      if (error.message.includes('permission')) {
        return { success: false, error: 'You don\'t have permission to manage categories' };
      }

      if (error.message.includes('already exists')) {
        return { success: false, error: 'This category name is already in use' };
      }

      // Generic error
      return { success: false, error: error.message };
    }

    // Unknown error type
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

---

## Activity Logging

All category operations are logged to the `list_activities` table for audit trails and activity feeds.

### Activity Logger API

```typescript
import {
  logCategoryActivity,
  createCategoryCreatedDetails,
  createCategoryUpdatedDetails,
  createCategoryArchivedDetails,
  createCategoryRestoredDetails,
  createCategoryDeletedDetails,
  createCategoryMergedDetails,
  detectCategoryChanges
} from '../utils/categoryActivityLogger';
```

### Activity Types

```typescript
type CategoryActivityAction =
  | 'category_created'
  | 'category_updated'
  | 'category_archived'
  | 'category_restored'
  | 'category_deleted'
  | 'category_merged'
  | 'category_edited'
  | 'category_locked'
  | 'category_unlocked'
  | 'category_suggested'
  | 'category_suggestion_approved'
  | 'category_suggestion_rejected'
  | 'category_comment_added'
  | 'category_voted';
```

### Logged Automatically

The following mutations automatically log activities:

- `addCustomCategory` → `category_created`
- `updateCustomCategory` → `category_updated` (with change details)
- `archiveCategory` → `category_archived`
- `restoreCategory` → `category_restored`
- `deleteCustomCategory` → `category_deleted`
- `mergeCategories` → `category_merged`

### Manual Logging Example

```typescript
// Log a custom activity
await logCategoryActivity(
  listId,
  'category_created',
  {
    category_id: 'cat-123',
    category_name: 'Organic',
  },
  authToken
);

// Log with changes
await logCategoryActivity(
  listId,
  'category_updated',
  {
    category_id: 'cat-123',
    category_name: 'Organic & Natural',
    changes: [
      { field: 'name', old_value: 'Organic', new_value: 'Organic & Natural' },
      { field: 'color', old_value: '#4CAF50', new_value: '#8BC34A' }
    ]
  },
  authToken
);
```

---

## API Examples

### Complete CRUD Example

```typescript
import { useCustomCategories, useCustomCategoryMutations } from '../hooks/useCustomCategories';
import { useState } from 'react';

function CategoryManager({ listId }: { listId: string }) {
  const categories = useCustomCategories(listId);
  const {
    addCustomCategory,
    updateCustomCategory,
    archiveCategory,
    deleteCustomCategory
  } = useCustomCategoryMutations();

  const [editingId, setEditingId] = useState<string | null>(null);

  // CREATE
  const handleCreate = async () => {
    await addCustomCategory({
      name: 'New Category',
      listId,
      color: '#FF5733',
      icon: '📦'
    });
  };

  // READ (automatic via hook)

  // UPDATE
  const handleUpdate = async (id: string, name: string) => {
    await updateCustomCategory({ id, name });
    setEditingId(null);
  };

  // DELETE (two-step: archive then delete)
  const handleDelete = async (id: string) => {
    await archiveCategory(id);
    await deleteCustomCategory(id);
  };

  return (
    <div>
      <button onClick={handleCreate}>Add Category</button>

      {categories.map(cat => (
        <div key={cat.id}>
          {editingId === cat.id ? (
            <input
              defaultValue={cat.name}
              onBlur={(e) => handleUpdate(cat.id, e.target.value)}
            />
          ) : (
            <span onClick={() => setEditingId(cat.id)}>
              {cat.icon} {cat.name}
            </span>
          )}

          <button onClick={() => handleDelete(cat.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Bulk Operations Example

```typescript
function BulkCategoryManager({ listId }: { listId: string }) {
  const categories = useCustomCategories(listId);
  const {
    updateMultipleCategories,
    deleteMultipleCategories,
    mergeCategories
  } = useCustomCategoryMutations();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBulkColorChange = async (color: string) => {
    await updateMultipleCategories(
      selectedIds.map(id => ({
        id,
        changes: { color }
      }))
    );
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} categories?`)) return;

    await deleteMultipleCategories(selectedIds);
    setSelectedIds([]);
  };

  const handleMerge = async (targetId: string) => {
    const sourceIds = selectedIds.filter(id => id !== targetId);

    if (sourceIds.length === 0) {
      alert('Select at least 2 categories to merge');
      return;
    }

    await mergeCategories(sourceIds, targetId);
    setSelectedIds([]);
  };

  return (
    <div>
      <div>Selected: {selectedIds.length}</div>

      <button onClick={() => handleBulkColorChange('#FF5733')}>
        Apply Red Color
      </button>
      <button onClick={handleBulkDelete}>
        Delete Selected
      </button>

      {categories.map(cat => (
        <label key={cat.id}>
          <input
            type="checkbox"
            checked={selectedIds.includes(cat.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds([...selectedIds, cat.id]);
              } else {
                setSelectedIds(selectedIds.filter(id => id !== cat.id));
              }
            }}
          />
          {cat.icon} {cat.name}

          {selectedIds.length > 1 && (
            <button onClick={() => handleMerge(cat.id)}>
              Merge into this
            </button>
          )}
        </label>
      ))}
    </div>
  );
}
```

### Export/Import Example

```typescript
function CategoryImportExport({ listId }: { listId: string }) {
  const categories = useCustomCategories(listId);
  const { addCustomCategory, exportCategories } = useCustomCategoryMutations();

  const handleExport = async () => {
    const categoryIds = categories.map(cat => cat.id);
    const json = await exportCategories(categoryIds);

    // Download JSON file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `categories-${listId}.json`;
    link.click();
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const imported = JSON.parse(text);

    // Import categories one by one
    for (const cat of imported) {
      try {
        await addCustomCategory({
          name: cat.name,
          listId,
          color: cat.color,
          icon: cat.icon
        });
      } catch (error) {
        console.error(`Failed to import ${cat.name}:`, error);
      }
    }

    alert(`Imported ${imported.length} categories`);
  };

  return (
    <div>
      <button onClick={handleExport}>Export Categories</button>

      <input
        type="file"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
        }}
      />
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

#### 1. Categories Not Appearing

**Symptom:** `useCustomCategories()` returns empty array

**Possible Causes:**
- No categories created yet
- Categories are archived (use `includeArchived: true`)
- Wrong `listId` provided
- Zero sync not initialized

**Solution:**

```typescript
// Debug query
const categories = useCustomCategories(listId, true); // Include archived
console.log('Total categories:', categories.length);
console.log('Active:', categories.filter(c => !c.isArchived).length);
console.log('Archived:', categories.filter(c => c.isArchived).length);

// Check Zero connection
import { getZeroInstance } from '../zero-store';
const zero = getZeroInstance();
console.log('Zero initialized:', !!zero);
```

#### 2. Permission Denied Errors

**Symptom:** `'You do not have permission to edit categories in this list...'`

**Possible Causes:**
- User is a viewer (needs editor or owner permission)
- Category is locked and user is not the owner
- User not authenticated properly

**Solution:**

```typescript
// Check user permission
import { useListPermission } from '../hooks/useListPermission';
const permission = useListPermission(listId);
console.log('Current permission:', permission); // 'owner', 'editor', or 'viewer'

// Check if category is locked
if (category.isLocked) {
  console.log('Category is locked - only owner can edit');
}
```

#### 3. Duplicate Name Errors

**Symptom:** `'A category with this name already exists'`

**Possible Causes:**
- Category name conflicts (case-insensitive)
- Conflicting with predefined category names

**Solution:**

```typescript
import { validateCategoryName, isPredefinedCategory } from '../utils/categoryValidation';

const name = 'Snacks';

// Check if predefined
if (isPredefinedCategory(name)) {
  console.error('Cannot use predefined category name');
}

// Check for duplicates
const error = validateCategoryName(name, categories);
if (error) {
  console.error('Validation error:', error);
}
```

#### 4. Color Not Displaying

**Symptom:** Category color not showing in UI

**Possible Causes:**
- Invalid hex color format
- Color value is empty string
- CSS not applied correctly

**Solution:**

```typescript
import { validateCategoryColor } from '../utils/categoryValidation';

const color = category.color;

if (!color || color === '') {
  console.log('No color set, using default');
}

if (color && !validateCategoryColor(color)) {
  console.error('Invalid color format:', color);
}

// Ensure CSS applies color
<div style={{ borderColor: color || '#ccc' }}>
  {category.name}
</div>
```

#### 5. Categories Not Syncing Across Devices

**Symptom:** Changes don't appear on other devices

**Possible Causes:**
- Zero sync not working
- Network connectivity issues
- Browser offline

**Solution:**

```typescript
// Check Zero sync status
const zero = getZeroInstance();
const syncStatus = zero.syncStatus; // Check if syncing

// Force sync
await zero.sync();

// Listen for sync events
zero.addEventListener('syncchange', () => {
  console.log('Sync status changed');
});
```

#### 6. Cannot Delete Category

**Symptom:** `'Cannot delete category. N item(s) are still using this category...'`

**Possible Causes:**
- Grocery items still reference this category
- Need to reassign items first

**Solution:**

```typescript
// Find items using this category
const items = await zero.query.grocery_items
  .where('list_id', listId)
  .where('category', categoryId)
  .run();

console.log(`${items.length} items using this category`);

// Reassign items before deleting
for (const item of items) {
  await zero.mutate.grocery_items.update({
    id: item.id,
    category: 'Other' // or another category
  });
}

// Now can delete
await deleteCustomCategory(categoryId);
```

### Debugging Tips

#### Enable Debug Logging

```typescript
// Add to your component
useEffect(() => {
  console.log('[Categories] Current categories:', categories);
  console.log('[Categories] List ID:', listId);
  console.log('[Categories] Include archived:', includeArchived);
}, [categories, listId, includeArchived]);
```

#### Inspect Zero Queries

```typescript
// Run queries manually to debug
const zero = getZeroInstance();

// Check table exists
const allCategories = await zero.query.custom_categories.run();
console.log('Total categories in DB:', allCategories.length);

// Check specific list
const listCategories = await zero.query.custom_categories
  .where('list_id', listId)
  .run();
console.log('Categories for this list:', listCategories.length);

// Check filter conditions
const active = listCategories.filter(c => !c.is_archived);
console.log('Active categories:', active.length);
```

#### Test Permissions

```typescript
// Test permission check function
async function testPermissions() {
  const zero = getZeroInstance();
  const userId = (zero as any).userID;

  // Check list ownership
  const list = await zero.query.lists
    .where('id', listId)
    .run();

  console.log('List owner:', list[0]?.owner_id);
  console.log('Current user:', userId);
  console.log('Is owner:', list[0]?.owner_id === userId);

  // Check membership
  const member = await zero.query.list_members
    .where('list_id', listId)
    .where('user_id', userId)
    .run();

  console.log('Member permission:', member[0]?.permission);
}

testPermissions();
```

---

## Performance Considerations

### Query Optimization

#### 1. Filter at Database Level

```typescript
// GOOD: Filter archived categories at database level
const categories = useCustomCategories(listId, false);

// AVOID: Filtering after fetching all categories
const allCategories = useCustomCategories(listId, true);
const filtered = allCategories.filter(c => !c.isArchived); // Inefficient
```

#### 2. Use Specific List IDs

```typescript
// GOOD: Query specific list
const categories = useCustomCategories('list-123');

// AVOID: Querying all lists then filtering
const allCategories = useCustomCategories(); // Fetches all lists
const filtered = allCategories.filter(c => c.listId === 'list-123');
```

#### 3. Memoize Derived Data

```typescript
import { useMemo } from 'react';

function CategoryList({ listId }: { listId: string }) {
  const categories = useCustomCategories(listId);

  // Memoize expensive computations
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  return <div>{/* ... */}</div>;
}
```

### Batch Operations

#### Use Bulk Mutations

```typescript
// GOOD: Bulk update
await updateMultipleCategories([
  { id: 'cat-1', changes: { color: '#FF5733' } },
  { id: 'cat-2', changes: { color: '#FF5733' } },
  { id: 'cat-3', changes: { color: '#FF5733' } }
]);

// AVOID: Sequential updates
for (const id of categoryIds) {
  await updateCustomCategory({ id, color: '#FF5733' }); // Slow
}
```

### Reduce Re-renders

```typescript
import { memo } from 'react';

// Memoize category components
const CategoryCard = memo(({ category }: { category: CustomCategory }) => {
  return (
    <div>
      {category.icon} {category.name}
    </div>
  );
});

// Only re-render when category changes
function CategoryList({ categories }: { categories: CustomCategory[] }) {
  return (
    <div>
      {categories.map(cat => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
}
```

### Index Usage

The database has optimized indexes for common queries:

1. **List + Active + Order**: Most common query
   ```sql
   idx_custom_categories_list_active_order
   ```

2. **Name Lookups**: Duplicate checking
   ```sql
   idx_custom_categories_list_name
   ```

3. **Recent Changes**: Sync queries
   ```sql
   idx_custom_categories_list_updated
   ```

These indexes make queries 10-20x faster for large datasets.

### Recommended Limits

- **Categories per list**: 50-100 max (UI consideration)
- **Concurrent mutations**: Use bulk operations for >5 changes
- **Query frequency**: Hook updates automatically, avoid manual polling

### Monitoring Performance

```typescript
// Measure query time
console.time('category-query');
const categories = useCustomCategories(listId);
console.timeEnd('category-query');

// Measure mutation time
console.time('category-create');
await addCustomCategory({ name: 'Test', listId });
console.timeEnd('category-create');
```

---

## Related Documentation

- [Custom Categories Migration Guide](./CUSTOM_CATEGORIES_MIGRATION.md)
- [Custom Categories Performance Guide](./CUSTOM_CATEGORIES_PERFORMANCE.md)
- [Category Validation Utilities](../src/utils/categoryValidation.ts)
- [Zero Schema Reference](../src/zero-schema.ts)
- [Database Migrations](../server/db/migrations/)

---

## Support

For issues, questions, or feature requests:
- GitHub Issues: [your-repo/issues]
- Documentation: [your-docs-url]
- Contact: [your-email]

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
**License:** [Your License]
