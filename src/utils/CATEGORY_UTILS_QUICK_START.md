# Category Utils - Quick Start Guide

## TL;DR - How to Delete a Custom Category

```typescript
// Import the utilities
import { updateItemCategoriesOnDelete, getItemCountByCategory } from './utils/categoryUtils';
import { useCustomCategoryMutations } from './hooks/useCustomCategories';
import { getZeroInstance } from './zero-store';

// In your component
const { deleteCustomCategory } = useCustomCategoryMutations();
const zero = getZeroInstance();

// Delete with item migration
async function handleDelete(categoryId: string, categoryName: string, listId: string) {
  // 1. Get count (optional, for confirmation)
  const count = await getItemCountByCategory(categoryName, listId, zero);

  // 2. Confirm with user
  if (!confirm(`Delete "${categoryName}"? ${count} items will move to "Other".`)) return;

  // 3. Migrate items FIRST (IMPORTANT!)
  await updateItemCategoriesOnDelete(categoryName, listId, zero);

  // 4. Delete category
  await deleteCustomCategory(categoryId);
}
```

**That's it!** The key is to call `updateItemCategoriesOnDelete()` BEFORE deleting the category.

---

## All Available Functions (One-Liners)

```typescript
import {
  isValidCategory,              // Check if category exists
  getCategoryOrFallback,         // Get category or 'Other'
  getAllCategories,              // Get all categories (predefined + custom)
  updateItemCategoriesOnDelete,  // Migrate items to 'Other' (call before delete!)
  getItemCountByCategory,        // Count items in a category
  validateCategoryName,          // Validate new category name
  migrateCategoryItems,          // Move items between categories
} from './utils/categoryUtils';
```

---

## Common Use Cases

### 1. Delete Category (with item migration)

```typescript
await updateItemCategoriesOnDelete(categoryName, listId, zero);
await deleteCustomCategory(categoryId);
```

### 2. Validate Before Creating

```typescript
const validation = validateCategoryName(name, customCategories);
if (!validation.isValid) {
  alert(validation.error);
  return;
}
await addCustomCategory({ name, listId });
```

### 3. Populate Category Dropdown

```typescript
const allCategories = getAllCategories(customCategories);
// Returns: ['Produce', 'Dairy', ..., 'CustomCat1', 'CustomCat2']
```

### 4. Display Item with Safe Category

```typescript
const category = getCategoryOrFallback(item.category, customCategories);
// Always returns a valid category, 'Other' if invalid
```

### 5. Check if Category is Valid

```typescript
if (!isValidCategory(categoryName, customCategories)) {
  // Handle invalid category
}
```

### 6. Show Confirmation Before Delete

```typescript
const count = await getItemCountByCategory(categoryName, listId, zero);
const message = count > 0
  ? `Delete "${categoryName}"? ${count} items → "Other"`
  : `Delete "${categoryName}"?`;
if (!confirm(message)) return;
```

---

## Integration Examples

### Example 1: Simple Delete Button

```typescript
function DeleteCategoryButton({ category, listId }) {
  const { deleteCustomCategory } = useCustomCategoryMutations();
  const zero = getZeroInstance();

  const handleDelete = async () => {
    await updateItemCategoriesOnDelete(category.name, listId, zero);
    await deleteCustomCategory(category.id);
    alert('Deleted!');
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### Example 2: Delete with Confirmation

```typescript
function DeleteCategoryButton({ category, listId }) {
  const { deleteCustomCategory } = useCustomCategoryMutations();
  const zero = getZeroInstance();

  const handleDelete = async () => {
    const count = await getItemCountByCategory(category.name, listId, zero);
    if (!confirm(`Delete? ${count} items will move to "Other"`)) return;

    await updateItemCategoriesOnDelete(category.name, listId, zero);
    await deleteCustomCategory(category.id);
    alert(`Deleted! ${count} items moved to "Other"`);
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### Example 3: Delete with Loading State

```typescript
function DeleteCategoryButton({ category, listId }) {
  const [loading, setLoading] = useState(false);
  const { deleteCustomCategory } = useCustomCategoryMutations();
  const zero = getZeroInstance();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const count = await getItemCountByCategory(category.name, listId, zero);
      if (!confirm(`Delete? ${count} items → "Other"`)) return;

      await updateItemCategoriesOnDelete(category.name, listId, zero);
      await deleteCustomCategory(category.id);
      alert('Success!');
    } catch (error) {
      alert('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

### Example 4: Using the Custom Hook (Easiest!)

```typescript
import { useCustomCategoryDelete } from './utils/categoryUtils.integration.example';

function DeleteCategoryButton({ category, listId }) {
  const { deleteCategoryWithMigration, isDeleting, error } =
    useCustomCategoryDelete(listId);

  const handleDelete = async () => {
    const success = await deleteCategoryWithMigration(category.id, category.name);
    if (success) alert('Deleted!');
  };

  return (
    <button onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

---

## What Happens When You Delete a Category?

1. **Query** all items in the list using that category
2. **Update** each item's category to 'Other'
3. **Delete** the custom category record
4. **Result**: Items are preserved with 'Other' category

---

## Important Notes

- Always call `updateItemCategoriesOnDelete()` **BEFORE** `deleteCustomCategory()`
- The function automatically logs how many items were migrated
- Errors are thrown if operations fail (use try-catch)
- The migration is atomic (all items updated together)

---

## Error Handling

```typescript
try {
  await updateItemCategoriesOnDelete(categoryName, listId, zero);
  await deleteCustomCategory(categoryId);
} catch (error) {
  console.error('Delete failed:', error);
  alert('Failed to delete category. Please try again.');
}
```

---

## Files

- **Utilities**: `/src/utils/categoryUtils.ts`
- **Examples**: `/src/utils/categoryUtils.integration.example.tsx`
- **Full Docs**: `/src/utils/CATEGORY_UTILS_README.md`
- **Hooks**: `/src/hooks/useCustomCategories.ts`

---

## Need Help?

Check the full documentation in `CATEGORY_UTILS_README.md` or see the integration examples in `categoryUtils.integration.example.tsx`.
