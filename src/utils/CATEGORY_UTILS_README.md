# Category Utils - Handling Deleted Custom Categories

This utility module provides functions to handle grocery items that reference deleted custom categories. When a custom category is deleted, all items using that category are automatically migrated to the 'Other' category to maintain data integrity.

## Overview

The `categoryUtils.ts` module provides utilities for:
- Validating category names
- Getting fallback categories for invalid/deleted categories
- Listing all available categories (predefined + custom)
- Migrating items when categories are deleted
- Validating custom category names against duplicates

## Implementation: Option A (Recommended)

**Update all items using deleted category to 'Other'**

This is the implemented approach because it:
- Maintains data integrity (no orphaned references)
- Provides better user experience (items are preserved)
- Allows seamless category management
- Is consistent with the 'Other' fallback pattern

## Exported Functions

### `isValidCategory(categoryName, customCategories)`

Validates if a category name exists in either predefined or custom categories.

```typescript
const customCategories = [{ id: '1', name: 'Snacks', listId: 'list1', ... }];
isValidCategory('Produce', customCategories); // true (predefined)
isValidCategory('Snacks', customCategories); // true (custom)
isValidCategory('NonExistent', customCategories); // false
```

**Parameters:**
- `categoryName: string` - The category name to validate
- `customCategories: CustomCategory[]` - Array of custom categories for the list

**Returns:** `boolean` - true if valid, false otherwise

---

### `getCategoryOrFallback(categoryName, customCategories)`

Gets a fallback category if the given category doesn't exist. Returns 'Other' as fallback.

```typescript
const customCategories = [{ id: '1', name: 'Snacks', listId: 'list1', ... }];
getCategoryOrFallback('Produce', customCategories); // 'Produce'
getCategoryOrFallback('Snacks', customCategories); // 'Snacks'
getCategoryOrFallback('DeletedCategory', customCategories); // 'Other'
```

**Parameters:**
- `categoryName: string` - The category name to validate
- `customCategories: CustomCategory[]` - Array of custom categories for the list

**Returns:** `string` - Original category if valid, otherwise 'Other'

**Use Case:** Use this when displaying items to ensure they always have a valid category.

---

### `getAllCategories(customCategories)`

Gets all available categories (predefined + custom) for a list.

```typescript
const customCategories = [
  { id: '1', name: 'Snacks', listId: 'list1', ... },
  { id: '2', name: 'Pet Supplies', listId: 'list1', ... }
];
getAllCategories(customCategories);
// Returns: ['Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen',
//           'Beverages', 'Other', 'Pet Supplies', 'Snacks']
```

**Parameters:**
- `customCategories: CustomCategory[]` - Array of custom categories for the list

**Returns:** `string[]` - Array of all category names (predefined first, then custom sorted alphabetically)

**Use Case:** Use this to populate category dropdowns in forms.

---

### `updateItemCategoriesOnDelete(categoryName, listId, zero)`

Updates all grocery items using a deleted category to use 'Other' category.
**This function should be called BEFORE deleting a custom category.**

```typescript
import { useZero } from '@rocicorp/zero/react';

const zero = useZero();
const categoryToDelete = 'Snacks';
const listId = 'list123';

// STEP 1: Update all items using this category
await updateItemCategoriesOnDelete(categoryToDelete, listId, zero);

// STEP 2: Delete the custom category
await zero.mutate.deleteCustomCategory({ id: categoryId });
```

**Parameters:**
- `categoryName: string` - The name of the category being deleted
- `listId: string` - The ID of the list
- `zero: any` - The Zero instance for database operations

**Returns:** `Promise<void>`

**Throws:** Error if the update operation fails

**Important:** Always call this function BEFORE deleting the category to ensure data integrity.

---

### `getItemCountByCategory(categoryName, listId, zero)`

Gets count of items using a specific category. Useful for showing warnings before deleting.

```typescript
import { useZero } from '@rocicorp/zero/react';

const zero = useZero();
const count = await getItemCountByCategory('Snacks', 'list123', zero);

if (count > 0) {
  const confirmed = confirm(
    `This category is used by ${count} item(s). ` +
    `They will be moved to "Other". Continue?`
  );
  if (!confirmed) return;
}
```

**Parameters:**
- `categoryName: string` - The category name to count items for
- `listId: string` - The ID of the list
- `zero: any` - The Zero instance for database operations

**Returns:** `Promise<number>` - Count of items using this category

**Use Case:** Show user confirmation with item count before deletion.

---

### `validateCategoryName(name, customCategories, excludeId?)`

Validates a custom category name against various rules:
- Must not be empty
- Must not exceed 50 characters
- Must not conflict with predefined categories
- Must not duplicate existing custom categories (case-insensitive)

```typescript
const customCategories = [{ id: '1', name: 'Snacks', listId: 'list1', ... }];

validateCategoryName('', customCategories);
// { isValid: false, error: 'Category name cannot be empty' }

validateCategoryName('Produce', customCategories);
// { isValid: false, error: 'This is a predefined category name' }

validateCategoryName('Snacks', customCategories);
// { isValid: false, error: 'A category with this name already exists' }

validateCategoryName('Pet Supplies', customCategories);
// { isValid: true }

// When updating, exclude the current category from duplicate check
validateCategoryName('Snacks', customCategories, '1');
// { isValid: true } - allows keeping the same name
```

**Parameters:**
- `name: string` - The category name to validate
- `customCategories: CustomCategory[]` - Array of existing custom categories
- `excludeId?: string` - Optional ID of category to exclude from duplicate check (for updates)

**Returns:** `{ isValid: boolean; error?: string }`

**Use Case:** Validate user input before creating/updating categories.

---

### `migrateCategoryItems(fromCategory, toCategory, listId, zero)`

Migrates items from one category to another. Useful for merging categories or manual reassignment.

```typescript
import { useZero } from '@rocicorp/zero/react';

const zero = useZero();
const count = await migrateCategoryItems('Snacks', 'Pantry', 'list123', zero);
console.log(`Migrated ${count} items from Snacks to Pantry`);
```

**Parameters:**
- `fromCategory: string` - The source category name
- `toCategory: string` - The target category name
- `listId: string` - The ID of the list
- `zero: any` - The Zero instance for database operations

**Returns:** `Promise<number>` - Number of items migrated

**Use Case:** Merge categories or bulk reassign items.

---

## Integration Guide

### Recommended Integration Pattern

The best way to integrate category deletion with item migration is to create a wrapper function or hook:

#### Option 1: Using the Custom Hook (Easiest)

```typescript
import { useCustomCategoryDelete } from '../utils/categoryUtils.integration.example';

function CategoryList({ listId }: { listId: string }) {
  const { deleteCategoryWithMigration, isDeleting, error } = useCustomCategoryDelete(listId);

  const handleDelete = async (categoryId: string, categoryName: string) => {
    const success = await deleteCategoryWithMigration(categoryId, categoryName);

    if (success) {
      alert('Category deleted successfully!');
    } else if (error) {
      alert(`Failed to delete category: ${error}`);
    }
  };

  return (
    <button onClick={() => handleDelete('cat-123', 'Snacks')} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

#### Option 2: Direct Integration in Mutation Handler

```typescript
import { useCustomCategoryMutations } from '../hooks/useCustomCategories';
import { getZeroInstance } from '../zero-store';
import {
  updateItemCategoriesOnDelete,
  getItemCountByCategory
} from '../utils/categoryUtils';

function CategoryManager({ listId }: { listId: string }) {
  const { deleteCustomCategory } = useCustomCategoryMutations();
  const zero = getZeroInstance();

  const handleDelete = async (categoryId: string, categoryName: string) => {
    try {
      // Get item count for user confirmation
      const itemCount = await getItemCountByCategory(categoryName, listId, zero);

      // Show confirmation
      const message = itemCount > 0
        ? `This category is used by ${itemCount} item(s). They will be moved to "Other". Continue?`
        : `Delete "${categoryName}"?`;

      if (!window.confirm(message)) return;

      // Migrate items FIRST
      await updateItemCategoriesOnDelete(categoryName, listId, zero);

      // Then delete category
      await deleteCustomCategory(categoryId);

      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete category');
    }
  };

  return (
    <button onClick={() => handleDelete('cat-123', 'Snacks')}>
      Delete
    </button>
  );
}
```

#### Option 3: Modify Existing `useCustomCategoryMutations` Hook

If you want to make this behavior automatic, you can modify the `deleteCustomCategory` function in `/src/hooks/useCustomCategories.ts`:

```typescript
// In useCustomCategories.ts
import { updateItemCategoriesOnDelete, getItemCountByCategory } from '../utils/categoryUtils';

const deleteCustomCategory = async (
  categoryId: string,
  options?: { listId?: string; showConfirmation?: boolean }
): Promise<void> => {
  if (!categoryId || categoryId.trim() === '') {
    throw new Error('Category ID is required');
  }

  try {
    // If listId is provided, handle item migration
    if (options?.listId) {
      // Get the category details first
      const category = await zero.query.custom_categories
        .where('id', categoryId)
        .run();

      if (category.length > 0) {
        const categoryName = category[0].name;

        // Get item count for confirmation
        if (options.showConfirmation) {
          const itemCount = await getItemCountByCategory(
            categoryName,
            options.listId,
            zero
          );

          if (itemCount > 0) {
            const message = `This category is used by ${itemCount} item(s). They will be moved to "Other". Continue?`;
            const confirmed = window.confirm(message);
            if (!confirmed) return;
          }
        }

        // Migrate items to 'Other'
        await updateItemCategoriesOnDelete(categoryName, options.listId, zero);
      }
    }

    // Delete the category
    await zero.mutate.custom_categories.delete({ id: categoryId });
  } catch (error) {
    console.error('[useCustomCategories] Error deleting custom category:', error);
    throw new Error('Failed to delete custom category');
  }
};
```

Then use it like:

```typescript
await deleteCustomCategory('cat-123', {
  listId: 'list-123',
  showConfirmation: true
});
```

---

## Alternative: Option B (Not Implemented)

**Prevent deletion if items exist**

If you prefer to prevent deletion when items are using a category:

```typescript
async function handleDeleteWithPrevention(categoryId: string, categoryName: string) {
  const zero = getZeroInstance();

  // Check item count
  const itemCount = await getItemCountByCategory(categoryName, listId, zero);

  if (itemCount > 0) {
    alert(
      `Cannot delete "${categoryName}" because ${itemCount} item(s) are using it. ` +
      'Please move or delete these items first.'
    );
    return;
  }

  // Safe to delete
  await deleteCustomCategory(categoryId);
}
```

---

## Testing

To test the category deletion flow:

1. Create a custom category (e.g., "Snacks")
2. Add some items with that category
3. Delete the custom category
4. Verify that:
   - All items previously using "Snacks" now show "Other"
   - The custom category is removed from the list
   - No errors occur

Example test flow:

```typescript
// 1. Create category
await addCustomCategory({ name: 'Snacks', listId: 'list-123' });

// 2. Add items
await addItem('Chips', 1, 'Snacks', '', 'list-123');
await addItem('Cookies', 2, 'Snacks', '', 'list-123');

// 3. Verify items exist
const items = await zero.query.grocery_items
  .where('list_id', 'list-123')
  .where('category', 'Snacks')
  .run();
console.log(`Items with Snacks: ${items.length}`); // Should be 2

// 4. Delete category
await updateItemCategoriesOnDelete('Snacks', 'list-123', zero);
await deleteCustomCategory(snacksCategoryId);

// 5. Verify migration
const remainingSnacks = await zero.query.grocery_items
  .where('list_id', 'list-123')
  .where('category', 'Snacks')
  .run();
console.log(`Items with Snacks: ${remainingSnacks.length}`); // Should be 0

const otherItems = await zero.query.grocery_items
  .where('list_id', 'list-123')
  .where('category', 'Other')
  .run();
console.log(`Items with Other: ${otherItems.length}`); // Should include migrated items
```

---

## Best Practices

1. **Always migrate items before deleting categories** - Call `updateItemCategoriesOnDelete()` before calling the delete mutation

2. **Show user confirmation** - Use `getItemCountByCategory()` to show users how many items will be affected

3. **Handle errors gracefully** - Wrap deletion logic in try-catch blocks

4. **Validate category names** - Use `validateCategoryName()` before creating/updating categories

5. **Use fallbacks for display** - Use `getCategoryOrFallback()` when displaying item categories to handle edge cases

6. **Keep UI responsive** - Show loading states during deletion operations

---

## Files

- `/src/utils/categoryUtils.ts` - Main utility functions
- `/src/utils/categoryUtils.integration.example.tsx` - Integration examples and patterns
- `/src/hooks/useCustomCategories.ts` - Custom category hooks
- `/src/types.ts` - Type definitions

---

## See Also

- [Custom Categories Implementation Plan](/IN_PROGRESS.md)
- [Custom Categories Hooks Documentation](/src/hooks/useCustomCategories.ts)
- [Integration Examples](/src/utils/categoryUtils.integration.example.tsx)
