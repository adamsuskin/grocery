# Custom Categories Documentation

Complete guide to the custom categories feature in the grocery list application.

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [User Guide](#user-guide)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Integration Points](#integration-points)
7. [Code Examples](#code-examples)
8. [Migration Guide](#migration-guide)
9. [Known Limitations](#known-limitations)
10. [Future Enhancements](#future-enhancements)

---

## Feature Overview

### What Are Custom Categories?

Custom categories allow users to create their own item categories beyond the predefined set (Produce, Dairy, Meat, Bakery, Pantry, Frozen, Beverages, Other). This feature provides flexibility for organizing grocery items according to personal preferences and shopping habits.

### Key Features

- **Create custom categories** per list with unique names
- **Customize appearance** with colors and emojis/icons
- **Real-time sync** across all users who have access to the list
- **Seamless integration** with existing predefined categories
- **Automatic filtering** in search and filter components
- **List-scoped categories** - each list has its own set of custom categories
- **Case-insensitive uniqueness** - prevents duplicate categories like "Snacks" and "snacks"

### Use Cases

1. **Specialty Diets**: Create categories like "Keto", "Vegan", "Gluten-Free"
2. **Store Sections**: Match your local store layout with "Bulk Foods", "International Aisle"
3. **Meal Planning**: Organize by meal type like "Breakfast", "Lunch", "Dinner", "Desserts"
4. **Projects**: Group items for specific purposes like "Party Supplies", "Camping Trip"
5. **Personal Preferences**: Organize by priority like "Must Have", "Nice to Have"

### Benefits

- **Personalization**: Tailor the app to your specific needs
- **Better Organization**: Group items in ways that make sense for your shopping workflow
- **Team Collaboration**: Shared lists use shared custom categories, keeping everyone aligned
- **Flexibility**: Create as many categories as needed without cluttering predefined options

---

## User Guide

### How to Create a Custom Category

**Note**: The UI for creating custom categories is currently accessible through the API. A dedicated UI component is planned for future releases.

#### Using the React Hook (for developers)

```typescript
import { useCustomCategoryMutations } from '../hooks/useCustomCategories';

function CategoryManager({ listId }) {
  const { addCustomCategory } = useCustomCategoryMutations();

  const handleCreate = async () => {
    await addCustomCategory({
      name: 'Snacks',
      listId: listId,
      color: '#FF5733',
      icon: '🍿'
    });
  };

  return <button onClick={handleCreate}>Add Snacks Category</button>;
}
```

### How to Edit a Custom Category

Categories can be updated to change their name, color, or icon:

```typescript
const { updateCustomCategory } = useCustomCategoryMutations();

await updateCustomCategory({
  id: 'category-123',
  name: 'Healthy Snacks',  // New name
  color: '#4CAF50',         // New color
  icon: '🥗'                // New icon
});
```

### How to Delete a Custom Category

**Important**: Before deleting a custom category, consider what happens to items using that category. It's recommended to reassign items to another category first.

```typescript
const { deleteCustomCategory } = useCustomCategoryMutations();

await deleteCustomCategory('category-123');
```

### Using Custom Categories with Items

Once created, custom categories appear in the category dropdown when adding or editing items. The system automatically combines predefined categories with custom categories for the current list.

```typescript
// Custom categories are automatically included in the SearchFilterBar
// and category selection dropdowns

// When filtering, custom categories work just like predefined ones
const customCategories = useCustomCategories(listId);
// Returns: ['Snacks', 'Cleaning Supplies', 'Pet Food']
```

### Category Color Codes

Colors should be specified as hex codes (e.g., `#FF5733`). Common color suggestions:

- **Red**: `#F44336` - Urgent items
- **Orange**: `#FF9800` - Medium priority
- **Yellow**: `#FFEB3B` - Low priority
- **Green**: `#4CAF50` - Healthy items
- **Blue**: `#2196F3` - Frozen/cold items
- **Purple**: `#9C27B0` - Special occasions
- **Pink**: `#E91E63` - Treats/desserts
- **Brown**: `#795548` - Bakery items

### Icon Recommendations

Use single emoji characters for best display:

- Food: 🍎 🥖 🥩 🧀 🥛 🍕 🍿 🍰
- Shopping: 🛒 📦 🏪 💳 🛍️
- Categories: 🥗 🍔 🍜 🍳 🥤 🧃
- Symbols: ⭐ ❤️ 🔥 ✨ 🎯

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AddItemForm  │  │ FilterBar    │  │ GroceryItem  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘              │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                     Hook Layer                                │
│  ┌──────────────────────────┴───────────────────────────┐   │
│  │  useCustomCategories() / useCustomCategoryMutations() │   │
│  └──────────────────────────┬───────────────────────────┘   │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                     Zero Store Layer                          │
│  ┌──────────────────────────┴───────────────────────────┐   │
│  │  Zero Query/Mutation APIs                             │   │
│  │  - zero.query.custom_categories                       │   │
│  │  - zero.mutate.custom_categories.{create,update,del}  │   │
│  └──────────────────────────┬───────────────────────────┘   │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                   Zero Sync Framework                         │
│  ┌──────────────────────────┴───────────────────────────┐   │
│  │  Real-time Synchronization                            │   │
│  │  - WebSocket connection to zero-cache                 │   │
│  │  - Optimistic updates                                 │   │
│  │  - Conflict resolution                                │   │
│  └──────────────────────────┬───────────────────────────┘   │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                    Database Layer                             │
│  ┌──────────────────────────┴───────────────────────────┐   │
│  │  PostgreSQL + zero-cache                              │   │
│  │  - custom_categories table                            │   │
│  │  - Relationships: lists, users                        │   │
│  │  - Indexes: list_id, created_by, created_at          │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Creating a Custom Category

```
User Input → useCustomCategoryMutations.addCustomCategory()
  ↓
Validate inputs (name, listId)
  ↓
Generate UUID with nanoid()
  ↓
zero.mutate.custom_categories.create()
  ↓
Zero Client (Optimistic UI Update)
  ↓
WebSocket → zero-cache → PostgreSQL
  ↓
Confirmation synced back to all connected clients
  ↓
useCustomCategories() hook receives update
  ↓
UI components re-render with new category
```

#### Querying Custom Categories

```
Component mounts → useCustomCategories(listId)
  ↓
Build Zero query with list_id filter
  ↓
Execute query with useQuery() hook
  ↓
Transform database format to app format
  ↓
Sort by createdAt (ascending)
  ↓
Return array of CustomCategory objects
  ↓
Component receives reactive updates via Zero
```

### Component Integration

```
┌─────────────────────────────────────────────────────────────┐
│ SearchFilterBar                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ const customCategories = useCustomCategories(listId)   │ │
│  │                                                         │ │
│  │ Display:                                                │ │
│  │  [Produce] [Dairy] [Meat] ... [Snacks*] [Cleaning*]   │ │
│  │                                ↑         ↑              │ │
│  │                             Custom Categories           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AddItemForm                                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ <select category>                                       │ │
│  │   <option>Produce</option>                             │ │
│  │   <option>Dairy</option>                               │ │
│  │   ...                                                   │ │
│  │   <option>Snacks</option>      ← Custom Categories     │ │
│  │   <option>Cleaning</option>    ← Custom Categories     │ │
│  │ </select>                                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ GroceryItem                                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [✓] Popcorn  [Snacks]  ×2                              │ │
│  │                ↑                                        │ │
│  │         Custom Category Badge                          │ │
│  │         (styled with custom color if provided)         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Multi-User Synchronization

Custom categories are automatically synchronized across all users who have access to the list:

1. **User A** creates "Snacks" category on List #1
2. **Zero** syncs to server via WebSocket
3. **Server** persists to PostgreSQL
4. **Zero** broadcasts update to all connected clients
5. **User B** receives update automatically
6. **User B's UI** refreshes to show "Snacks" category

Typical sync latency: **50-500ms**

---

## Database Schema

### Table: `custom_categories`

Complete schema definition from migration `003_create_custom_categories_table.sql`:

```sql
CREATE TABLE IF NOT EXISTS custom_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT category_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT category_name_max_length CHECK (LENGTH(name) <= 100),
  CONSTRAINT unique_category_per_list UNIQUE (list_id, LOWER(name))
);
```

### Columns

| Column       | Type                  | Nullable | Description                                                |
|--------------|-----------------------|----------|------------------------------------------------------------|
| `id`         | UUID                  | NO       | Primary key, auto-generated                                |
| `name`       | VARCHAR(100)          | NO       | Category name, max 100 characters                          |
| `list_id`    | UUID                  | NO       | Foreign key to lists table                                 |
| `created_by` | UUID                  | YES      | Foreign key to users table (nullable if user deleted)      |
| `color`      | VARCHAR(7)            | YES      | Optional hex color code (e.g., #FF5733)                    |
| `icon`       | VARCHAR(50)           | YES      | Optional emoji or icon identifier                          |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO    | Creation timestamp                                         |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO    | Last update timestamp                                      |

### Constraints

1. **Primary Key**: `id` (UUID)
2. **Foreign Keys**:
   - `list_id` → `lists(id)` ON DELETE CASCADE
   - `created_by` → `users(id)` ON DELETE SET NULL
3. **Check Constraints**:
   - `category_name_not_empty`: Ensures name is not empty after trimming
   - `category_name_max_length`: Enforces 100 character limit
4. **Unique Constraint**:
   - `unique_category_per_list`: Case-insensitive unique name per list

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_custom_categories_list_id
  ON custom_categories(list_id);

CREATE INDEX IF NOT EXISTS idx_custom_categories_created_by
  ON custom_categories(created_by);

CREATE INDEX IF NOT EXISTS idx_custom_categories_created_at
  ON custom_categories(created_at DESC);
```

**Purpose**:
- `list_id`: Fast lookups of categories by list (most common query)
- `created_by`: Find categories created by a specific user
- `created_at`: Sort categories chronologically

### Relationships

```
┌──────────┐         ┌────────────────────┐         ┌──────────┐
│  users   │         │ custom_categories  │         │  lists   │
├──────────┤         ├────────────────────┤         ├──────────┤
│ id (PK)  │────┐    │ id (PK)            │    ┌────│ id (PK)  │
│ email    │    └───→│ created_by (FK)    │    │    │ name     │
│ name     │         │ name               │    │    │ owner_id │
└──────────┘         │ list_id (FK)       │←───┘    └──────────┘
                     │ color              │
                     │ icon               │
                     │ created_at         │
                     │ updated_at         │
                     └────────────────────┘
```

### Cascade Behavior

- **ON DELETE CASCADE** (list_id): When a list is deleted, all its custom categories are automatically deleted
- **ON DELETE SET NULL** (created_by): When a user is deleted, their categories remain but `created_by` becomes NULL

### Auto-Update Trigger

```sql
CREATE TRIGGER update_custom_categories_updated_at
  BEFORE UPDATE ON custom_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

Automatically updates `updated_at` timestamp on every row modification.

---

## API Reference

### TypeScript Interfaces

#### CustomCategory

Application-level interface for custom categories:

```typescript
export interface CustomCategory {
  id: string;              // UUID identifier
  name: string;            // Category name
  listId: string;          // ID of the list this category belongs to
  createdBy: string;       // User ID who created this category
  color?: string;          // Optional hex color code
  icon?: string;           // Optional emoji or icon identifier
  createdAt: number;       // Creation timestamp (Unix milliseconds)
  updatedAt: number;       // Last update timestamp (Unix milliseconds)
}
```

#### CustomCategoryTable

Database-level interface (snake_case):

```typescript
export interface CustomCategoryTable {
  id: string;
  name: string;
  list_id: string;
  created_by: string;
  color: string | null;
  icon: string | null;
  created_at: number;
  updated_at: number;
}
```

#### CreateCustomCategoryInput

Input for creating a new category:

```typescript
export interface CreateCustomCategoryInput {
  name: string;       // Required: Category name (1-100 chars)
  listId: string;     // Required: List ID
  color?: string;     // Optional: Hex color code
  icon?: string;      // Optional: Emoji or icon
}
```

#### UpdateCustomCategoryInput

Input for updating an existing category:

```typescript
export interface UpdateCustomCategoryInput {
  id: string;         // Required: Category ID to update
  name?: string;      // Optional: New name
  color?: string;     // Optional: New color
  icon?: string;      // Optional: New icon
}
```

### React Hooks

#### useCustomCategories()

Query custom categories for a specific list.

**Signature:**

```typescript
function useCustomCategories(listId?: string): CustomCategory[]
```

**Parameters:**
- `listId` (optional): List ID to filter categories. If not provided, returns empty array.

**Returns:**
- Array of `CustomCategory` objects, sorted by creation date (oldest first)

**Example:**

```typescript
import { useCustomCategories } from '../hooks/useCustomCategories';

function CategoryList({ listId }) {
  const categories = useCustomCategories(listId);

  return (
    <div>
      <h3>Custom Categories ({categories.length})</h3>
      <ul>
        {categories.map(cat => (
          <li key={cat.id} style={{ color: cat.color }}>
            {cat.icon} {cat.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Features:**
- Reactive: Automatically updates when categories change
- Filtered: Only returns categories for the specified list
- Sorted: Chronologically by creation date
- Type-safe: Full TypeScript support

#### useCustomCategoryMutations()

Provides mutation functions for creating, updating, and deleting custom categories.

**Signature:**

```typescript
function useCustomCategoryMutations(): {
  addCustomCategory: (input: CreateCustomCategoryInput) => Promise<void>;
  updateCustomCategory: (input: UpdateCustomCategoryInput) => Promise<void>;
  deleteCustomCategory: (categoryId: string) => Promise<void>;
}
```

**Returns:**

Object with three mutation functions:

##### addCustomCategory()

Creates a new custom category.

```typescript
async function addCustomCategory(input: CreateCustomCategoryInput): Promise<void>
```

**Parameters:**
- `input.name` (required): Category name (1-100 characters)
- `input.listId` (required): List ID
- `input.color` (optional): Hex color code (e.g., "#FF5733")
- `input.icon` (optional): Emoji or icon string

**Throws:**
- Error if user is not authenticated
- Error if name is empty
- Error if listId is empty
- Error if database operation fails
- Error if category name already exists for this list (case-insensitive)

**Example:**

```typescript
const { addCustomCategory } = useCustomCategoryMutations();

try {
  await addCustomCategory({
    name: 'Snacks',
    listId: 'list-123',
    color: '#FF5733',
    icon: '🍿'
  });
  console.log('Category created successfully');
} catch (error) {
  console.error('Failed to create category:', error.message);
}
```

##### updateCustomCategory()

Updates an existing custom category.

```typescript
async function updateCustomCategory(input: UpdateCustomCategoryInput): Promise<void>
```

**Parameters:**
- `input.id` (required): Category ID to update
- `input.name` (optional): New name (1-100 characters)
- `input.color` (optional): New hex color code
- `input.icon` (optional): New emoji or icon

**Throws:**
- Error if id is empty
- Error if no fields provided for update
- Error if name is empty string (when provided)
- Error if database operation fails

**Example:**

```typescript
const { updateCustomCategory } = useCustomCategoryMutations();

// Update only the name
await updateCustomCategory({
  id: 'category-456',
  name: 'Healthy Snacks'
});

// Update name and color
await updateCustomCategory({
  id: 'category-456',
  name: 'Healthy Snacks',
  color: '#4CAF50'
});

// Update only icon
await updateCustomCategory({
  id: 'category-456',
  icon: '🥗'
});
```

##### deleteCustomCategory()

Deletes a custom category.

```typescript
async function deleteCustomCategory(categoryId: string): Promise<void>
```

**Parameters:**
- `categoryId` (required): ID of the category to delete

**Throws:**
- Error if categoryId is empty
- Error if database operation fails

**Important**: This does not handle items using this category. Application logic should reassign items to another category before deletion or handle orphaned items appropriately.

**Example:**

```typescript
const { deleteCustomCategory } = useCustomCategoryMutations();

try {
  await deleteCustomCategory('category-456');
  console.log('Category deleted');
} catch (error) {
  console.error('Failed to delete:', error);
}
```

### Zero Store Integration

The hooks use Zero's real-time sync capabilities under the hood:

```typescript
// From zero-store.ts
export function useCustomCategories(listId: string | null) {
  const zero = getZeroInstance();

  const query = listId
    ? zero.query.custom_categories.where('list_id', listId)
    : null;

  const categoriesQuery = useQuery(query as any);

  // Map to category names sorted by creation date
  const customCategories: string[] = useMemo(() => {
    if (!listId || !categoriesQuery) return [];

    return (categoriesQuery as any[])
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(cat => cat.name);
  }, [listId, categoriesQuery]);

  return customCategories;
}
```

---

## Integration Points

### 1. SearchFilterBar Component

**File**: `/home/adam/grocery/src/components/SearchFilterBar.tsx`

**Integration**:

```typescript
import { useCustomCategories } from '../zero-store';

export const SearchFilterBar = memo(function SearchFilterBar({
  filters,
  onChange,
  listId,
}: SearchFilterBarProps) {
  // Get custom categories for the current list
  const customCategories = useCustomCategories(listId);

  return (
    <div className="category-filters">
      <div className="category-chips">
        {/* Predefined categories */}
        {CATEGORIES.map((category) => (
          <button key={category} className="category-chip">
            {category}
          </button>
        ))}

        {/* Custom categories */}
        {customCategories.map((category) => (
          <button key={category} className="category-chip custom">
            {category}
          </button>
        ))}
      </div>
    </div>
  );
});
```

**Current Status**: SearchFilterBar currently retrieves custom categories but only displays predefined categories in the UI. Enhancement needed to display custom categories.

### 2. AddItemForm Component

**File**: `/home/adam/grocery/src/components/AddItemForm.tsx`

**Planned Integration**:

```typescript
import { useCustomCategories } from '../hooks/useCustomCategories';

export function AddItemForm({ listId, canEdit }: AddItemFormProps) {
  const [category, setCategory] = useState<string>('Other');
  const customCategories = useCustomCategories(listId);

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="input select-category"
      >
        {/* Predefined categories */}
        <optgroup label="Standard Categories">
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </optgroup>

        {/* Custom categories */}
        {customCategories.length > 0 && (
          <optgroup label="Custom Categories">
            {customCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </optgroup>
        )}
      </select>
    </form>
  );
}
```

**Current Status**: AddItemForm does not yet integrate custom categories. Enhancement needed.

### 3. GroceryItem Component

**File**: `/home/adam/grocery/src/components/GroceryItem.tsx`

**Integration**: Category badges should work automatically once items are assigned custom categories, as the badge styling is applied dynamically:

```typescript
<span className={`category-badge category-${item.category.toLowerCase()}`}>
  {item.category}
</span>
```

**Enhancement Needed**: Add special styling for custom category badges to distinguish them from predefined categories.

### 4. Zero Schema

**File**: `/home/adam/grocery/src/zero-schema.ts`

**Current Schema Definition**:

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

### 5. Type Definitions

**File**: `/home/adam/grocery/src/types.ts`

**Current Type Definitions**:

```typescript
// Predefined categories
export const CATEGORIES = [
  'Produce', 'Dairy', 'Meat', 'Bakery',
  'Pantry', 'Frozen', 'Beverages', 'Other'
] as const;

export type Category = typeof CATEGORIES[number];

// Custom category interfaces
export interface CustomCategory {
  id: string;
  name: string;
  listId: string;
  createdBy: string;
  color?: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateCustomCategoryInput {
  name: string;
  listId: string;
  color?: string;
  icon?: string;
}

export interface UpdateCustomCategoryInput {
  id: string;
  name?: string;
  color?: string;
  icon?: string;
}
```

### 6. Database Migration

**File**: `/home/adam/grocery/server/db/migrations/003_create_custom_categories_table.sql`

**Status**: Complete and production-ready

---

## Code Examples

### Example 1: Creating a Custom Category

```typescript
import { useCustomCategoryMutations } from '../hooks/useCustomCategories';
import { useState } from 'react';

function CreateCategoryForm({ listId }: { listId: string }) {
  const { addCustomCategory } = useCustomCategoryMutations();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4CAF50');
  const [icon, setIcon] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await addCustomCategory({
        name: name.trim(),
        listId,
        color,
        icon: icon.trim() || undefined,
      });

      // Success - clear form
      setName('');
      setIcon('');
      alert('Category created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-category-form">
      <h3>Create Custom Category</h3>

      <div className="form-group">
        <label>Category Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Snacks"
          maxLength={100}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Color</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Icon (Emoji)</label>
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="e.g., 🍿"
          maxLength={10}
          disabled={loading}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={loading || !name.trim()}>
        {loading ? 'Creating...' : 'Create Category'}
      </button>
    </form>
  );
}
```

### Example 2: Listing and Filtering Custom Categories

```typescript
import { useCustomCategories } from '../hooks/useCustomCategories';
import { useState, useMemo } from 'react';

function CategoryList({ listId }: { listId: string }) {
  const categories = useCustomCategories(listId);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter categories by search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;

    const term = searchTerm.toLowerCase();
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  return (
    <div className="category-list">
      <h3>Custom Categories ({categories.length})</h3>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search categories..."
        className="search-input"
      />

      {filteredCategories.length === 0 ? (
        <p className="no-results">
          {searchTerm ? 'No matching categories' : 'No custom categories yet'}
        </p>
      ) : (
        <ul className="category-items">
          {filteredCategories.map(category => (
            <li
              key={category.id}
              className="category-item"
              style={{ borderLeftColor: category.color }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
              <span className="category-meta">
                Created {new Date(category.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Example 3: Editing a Custom Category

```typescript
import { useCustomCategoryMutations } from '../hooks/useCustomCategories';
import { useState } from 'react';
import type { CustomCategory } from '../types';

interface EditCategoryModalProps {
  category: CustomCategory;
  onClose: () => void;
  onSuccess: () => void;
}

function EditCategoryModal({ category, onClose, onSuccess }: EditCategoryModalProps) {
  const { updateCustomCategory } = useCustomCategoryMutations();
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color || '#4CAF50');
  const [icon, setIcon] = useState(category.icon || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasChanges =
    name !== category.name ||
    color !== category.color ||
    icon !== category.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setLoading(true);
    setError('');

    try {
      const updates: any = { id: category.id };

      if (name !== category.name) updates.name = name.trim();
      if (color !== category.color) updates.color = color;
      if (icon !== category.icon) updates.icon = icon.trim() || undefined;

      await updateCustomCategory(updates);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Category</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Emoji"
              maxLength={10}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !hasChanges || !name.trim()}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Example 4: Deleting a Custom Category with Confirmation

```typescript
import { useCustomCategoryMutations } from '../hooks/useCustomCategories';
import { useState } from 'react';

function DeleteCategoryButton({
  categoryId,
  categoryName,
  onDeleted
}: {
  categoryId: string;
  categoryName: string;
  onDeleted: () => void;
}) {
  const { deleteCustomCategory } = useCustomCategoryMutations();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      await deleteCustomCategory(categoryId);
      onDeleted();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="confirm-delete">
        <p>Delete "{categoryName}"?</p>
        <p className="warning">
          Items using this category will need to be reassigned.
        </p>
        <div className="actions">
          <button onClick={() => setShowConfirm(false)} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn-danger"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="btn-delete"
      title="Delete category"
    >
      🗑️ Delete
    </button>
  );
}
```

### Example 5: Handling Deleted Categories in Items

When a category is deleted, items using that category become "orphaned". Here's how to handle this:

```typescript
import { useGroceryItems, useGroceryMutations } from '../hooks/useGroceryItems';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { CATEGORIES } from '../types';
import { useMemo, useEffect } from 'react';

function useOrphanedItemsHandler(listId: string) {
  const items = useGroceryItems(listId);
  const customCategories = useCustomCategories(listId);
  const { updateItem } = useGroceryMutations();

  // Get all valid category names
  const validCategories = useMemo(() => {
    const predefined = [...CATEGORIES];
    const custom = customCategories.map(cat => cat.name);
    return new Set([...predefined, ...custom]);
  }, [customCategories]);

  // Find items with invalid categories
  const orphanedItems = useMemo(() => {
    return items.filter(item => !validCategories.has(item.category));
  }, [items, validCategories]);

  // Automatically fix orphaned items by resetting to 'Other'
  useEffect(() => {
    orphanedItems.forEach(item => {
      console.warn(`Item "${item.name}" has invalid category "${item.category}", resetting to Other`);
      updateItem(item.id, { category: 'Other' });
    });
  }, [orphanedItems, updateItem]);

  return {
    orphanedItems,
    orphanedCount: orphanedItems.length,
  };
}

// Usage in a component
function ItemList({ listId }: { listId: string }) {
  const { orphanedCount } = useOrphanedItemsHandler(listId);

  return (
    <div>
      {orphanedCount > 0 && (
        <div className="warning-banner">
          {orphanedCount} item(s) had invalid categories and were reset to "Other"
        </div>
      )}
      {/* Rest of component */}
    </div>
  );
}
```

### Example 6: Category Selector with Both Types

Complete category selector that combines predefined and custom categories:

```typescript
import { CATEGORIES, type Category, type CustomCategory } from '../types';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { useMemo } from 'react';

interface CategoryOption {
  value: string;
  label: string;
  type: 'predefined' | 'custom';
  color?: string;
  icon?: string;
}

function useCategoryOptions(listId: string | null): CategoryOption[] {
  const customCategories = useCustomCategories(listId);

  return useMemo(() => {
    // Predefined categories
    const predefined: CategoryOption[] = CATEGORIES.map(cat => ({
      value: cat,
      label: cat,
      type: 'predefined',
    }));

    // Custom categories
    const custom: CategoryOption[] = customCategories.map(cat => ({
      value: cat.name,
      label: cat.name,
      type: 'custom',
      color: cat.color,
      icon: cat.icon,
    }));

    return [...predefined, ...custom];
  }, [customCategories]);
}

function CategorySelector({
  value,
  onChange,
  listId
}: {
  value: string;
  onChange: (value: string) => void;
  listId: string | null;
}) {
  const options = useCategoryOptions(listId);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="category-selector"
    >
      <optgroup label="Standard Categories">
        {options
          .filter(opt => opt.type === 'predefined')
          .map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        }
      </optgroup>

      {options.some(opt => opt.type === 'custom') && (
        <optgroup label="Custom Categories">
          {options
            .filter(opt => opt.type === 'custom')
            .map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.icon ? `${opt.icon} ` : ''}{opt.label}
              </option>
            ))
          }
        </optgroup>
      )}
    </select>
  );
}
```

---

## Migration Guide

### For Existing Users

**Good News**: The custom categories feature is backward compatible! No user action required.

#### What Changes for Users

1. **Existing items remain unchanged** - All items keep their current categories
2. **New capability added** - Users can now create custom categories per list
3. **UI enhancements needed** - Full UI integration is in progress (see below)

#### What Stays the Same

- ✅ All predefined categories (Produce, Dairy, etc.) work as before
- ✅ Existing items retain their category assignments
- ✅ Filtering and sorting by category continues to work
- ✅ Category badges display correctly

### For Developers

#### Database Migration

The database migration `003_create_custom_categories_table.sql` has been created and is ready to deploy.

**To apply the migration:**

```bash
# Connect to your PostgreSQL database
psql -U postgres -d grocery_app

# Run the migration
\i server/db/migrations/003_create_custom_categories_table.sql

# Verify the table was created
\d custom_categories
```

**Migration is idempotent**: Uses `IF NOT EXISTS` clauses, so it's safe to run multiple times.

#### Zero Schema Update

The Zero schema in `src/zero-schema.ts` already includes the `custom_categories` table definition. No action needed.

**Current schema version**: 10

If you're on an older schema version:

```typescript
export const schema = {
  version: 10,  // ← Ensure this is version 10
  tables: {
    // ... existing tables
    custom_categories: {
      // ... definition already present
    },
  },
} as const;
```

#### Type Definitions

All TypeScript types are defined in `src/types.ts`. Import as needed:

```typescript
import type {
  CustomCategory,
  CreateCustomCategoryInput,
  UpdateCustomCategoryInput
} from '../types';
```

#### Hook Integration

The hooks are available and production-ready:

```typescript
// From the dedicated hook file
import {
  useCustomCategories,
  useCustomCategoryMutations
} from '../hooks/useCustomCategories';

// Or from zero-store (returns string[] instead of CustomCategory[])
import { useCustomCategories } from '../zero-store';
```

### UI Integration Checklist

To fully integrate custom categories into the UI, complete these tasks:

- [ ] **Add CategoryManager component** - UI for creating, editing, deleting categories
- [ ] **Update AddItemForm** - Include custom categories in dropdown
- [ ] **Update SearchFilterBar** - Display custom category chips
- [ ] **Add category color styling** - Dynamic CSS for custom colors
- [ ] **Handle deleted categories** - Auto-reassign orphaned items
- [ ] **Add category icons** - Display emoji/icons in badges
- [ ] **Create category settings page** - Dedicated page for managing categories
- [ ] **Add bulk category operations** - Rename/delete with item reassignment
- [ ] **Implement category templates** - Quick-create common custom categories

### Breaking Changes

**None!** This feature is completely backward compatible.

### Rollback Procedure

If you need to rollback the custom categories feature:

1. **Database**: Run the rollback script (if needed)
   ```sql
   DROP TABLE IF EXISTS custom_categories CASCADE;
   ```

2. **Code**: Remove or comment out custom category integrations
   - Remove `useCustomCategories()` calls
   - Revert schema version to 9

3. **Zero Cache**: Restart zero-cache server to clear cache

**Note**: Rollback will delete all custom categories. Items using custom categories will have invalid category references and will need to be fixed manually.

---

## Known Limitations

### Current Limitations

1. **No UI for Category Management**
   - Status: Custom categories can only be created via API/hooks
   - Impact: Users cannot create categories through the UI yet
   - Workaround: Developers can use React hooks to create categories programmatically
   - Planned: CategoryManager component in future release

2. **Limited Category Display**
   - Status: Custom categories are not displayed in SearchFilterBar chips yet
   - Impact: Users cannot filter by custom categories through the UI
   - Workaround: Custom categories work in backend; UI update needed
   - Planned: Full UI integration in progress

3. **No Category Icon Rendering**
   - Status: Icons are stored but not displayed in category badges
   - Impact: Visual differentiation of custom categories is limited
   - Workaround: Colors are supported and can be used for differentiation
   - Planned: Icon rendering in GroceryItem badges

4. **No Orphaned Item Handling**
   - Status: When a category is deleted, items keep the old category name
   - Impact: Items may reference non-existent categories
   - Workaround: Manually update items before deleting categories
   - Planned: Automatic reassignment to "Other" or user prompt

5. **No Category Reordering**
   - Status: Categories are always sorted by creation date
   - Impact: Users cannot customize the order of categories
   - Workaround: Create categories in desired order initially
   - Planned: Drag-and-drop reordering or manual sort order field

6. **No Category Usage Stats**
   - Status: No visibility into how many items use each category
   - Impact: Users might delete categories still in use
   - Workaround: Search for items before deleting
   - Planned: Usage counts and warnings before deletion

### Technical Limitations

1. **100 Character Name Limit**
   - Reason: Database constraint for reasonable name lengths
   - Workaround: Use abbreviations or shorter names

2. **Case-Insensitive Uniqueness**
   - Behavior: "Snacks" and "snacks" are considered duplicates
   - Reason: Prevents user confusion
   - Workaround: Use different names entirely

3. **Color Validation**
   - Current: No validation of hex color codes
   - Impact: Invalid colors may cause display issues
   - Planned: Client-side validation before submission

4. **No Category Merging**
   - Status: Cannot combine two categories into one
   - Workaround: Manually update all items, then delete category
   - Planned: Bulk merge operation

5. **No Category Import/Export**
   - Status: Categories are not included in list export
   - Impact: Cannot easily copy categories between lists
   - Planned: Include categories in JSON/CSV exports

### Performance Considerations

1. **Query Performance**
   - Current: Queries are indexed and perform well up to ~1000 categories per list
   - Recommendation: Keep custom categories under 50 per list for optimal UX
   - Impact: Very large numbers of categories may slow down UI

2. **Real-time Sync Overhead**
   - Current: Each category change triggers sync to all connected clients
   - Impact: Minimal with normal usage; could be noticeable if creating 100+ categories rapidly
   - Mitigation: Zero's batching handles this well in practice

---

## Future Enhancements

### Short-Term (Next Release)

1. **CategoryManager Component**
   - Full UI for managing custom categories
   - Create, edit, delete operations with forms
   - Visual preview of colors and icons
   - Search and filter categories

2. **UI Integration**
   - Display custom categories in SearchFilterBar
   - Show custom categories in AddItemForm dropdown
   - Render category icons in item badges
   - Apply custom colors to category badges

3. **Orphaned Item Handling**
   - Detect items with deleted categories
   - Automatic reassignment to "Other" or prompt user
   - Warning before deleting categories with items

4. **Category Validation**
   - Client-side validation for hex colors
   - Icon/emoji validation
   - Duplicate name checking with helpful error messages

### Medium-Term (Next Quarter)

1. **Category Templates**
   - Pre-defined category sets for common use cases
   - "Keto Diet" template with relevant categories
   - "Store Layout" template matching common stores
   - "Meal Planning" template with meal-based categories

2. **Bulk Operations**
   - Merge two categories (combine items)
   - Rename category (update all items)
   - Delete with automatic item reassignment
   - Bulk create from template

3. **Category Statistics**
   - Show item count per category
   - Most/least used categories
   - Category usage trends over time
   - Suggest category consolidation

4. **Category Sharing**
   - Share category definitions across lists
   - Import categories from another list
   - Export/import category sets

5. **Advanced Styling**
   - Gradient colors for categories
   - Custom CSS classes per category
   - Category-specific icons from icon libraries
   - Theme presets (dark mode, high contrast)

### Long-Term (Future Releases)

1. **Smart Category Suggestions**
   - ML-based category recommendations
   - Learn from user's category usage patterns
   - Auto-categorize new items based on name
   - Suggest category creation based on item patterns

2. **Category Hierarchies**
   - Parent/child category relationships
   - E.g., "Snacks" → "Healthy Snacks", "Treats"
   - Nested filtering in UI
   - Roll-up statistics

3. **Category Rules**
   - Auto-assign items to categories based on rules
   - E.g., "If name contains 'organic', assign to 'Organic' category"
   - Conditional formatting based on category
   - Budget alerts per category

4. **Multi-List Category Sync**
   - Define global categories across all user's lists
   - Choose per-list or global categories
   - Sync category changes across lists

5. **Category Analytics Dashboard**
   - Spending by category over time
   - Most frequently purchased categories
   - Category comparison across time periods
   - Export analytics reports

6. **Accessibility Improvements**
   - High-contrast category colors
   - Screen reader optimizations
   - Keyboard navigation for category management
   - Customizable category labels for accessibility

---

## Appendix

### Related Files

Core implementation files:

- `/home/adam/grocery/server/db/migrations/003_create_custom_categories_table.sql` - Database schema
- `/home/adam/grocery/src/zero-schema.ts` - Zero schema definition (version 10)
- `/home/adam/grocery/src/types.ts` - TypeScript type definitions
- `/home/adam/grocery/src/hooks/useCustomCategories.ts` - React hooks for custom categories
- `/home/adam/grocery/src/zero-store.ts` - Zero store integration (line 934+)

Integration points:

- `/home/adam/grocery/src/components/SearchFilterBar.tsx` - Filter bar component (retrieves custom categories on line 17)
- `/home/adam/grocery/src/components/AddItemForm.tsx` - Item creation form (needs integration)
- `/home/adam/grocery/src/components/GroceryItem.tsx` - Item display component (needs custom badge styling)

### Reference Documentation

- [Zero Documentation](https://zerosync.dev) - Real-time sync framework
- [PostgreSQL UUID Functions](https://www.postgresql.org/docs/current/functions-uuid.html)
- [React Hooks Reference](https://react.dev/reference/react)

### Change Log

**Version 1.0** (Current)
- Initial implementation of custom categories
- Database schema and migration
- TypeScript types and interfaces
- React hooks for queries and mutations
- Zero schema integration
- Basic SearchFilterBar integration (query only)

**Planned for Version 1.1**
- CategoryManager UI component
- Full SearchFilterBar integration (display chips)
- AddItemForm integration (dropdown)
- Orphaned item handling
- Category validation

---

## Support

### Getting Help

1. **Documentation**: Read this file first
2. **Code Examples**: See examples section above
3. **API Reference**: Review the API section
4. **Source Code**: Check the referenced files for implementation details

### Reporting Issues

When reporting issues with custom categories, include:

- Current behavior vs expected behavior
- Steps to reproduce
- Browser and version
- Console errors (if any)
- Database logs (if applicable)
- Network errors (if any)

### Contributing

To contribute to the custom categories feature:

1. Review this documentation
2. Check existing limitations and future enhancements
3. Implement features from the roadmap or propose new ones
4. Follow TypeScript best practices
5. Include tests for new functionality
6. Update this documentation with your changes

---

**Documentation Version**: 1.0
**Last Updated**: October 26, 2025
**Feature Status**: Partially Implemented (Phase 25 In Progress)
**Production Ready**: Backend ✅ | Frontend UI ⏳
