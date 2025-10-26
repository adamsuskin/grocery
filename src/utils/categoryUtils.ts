import { CATEGORIES, type CustomCategory } from '../types';

/**
 * Validates if a category name is valid (exists in predefined or custom categories)
 *
 * @param categoryName - The category name to validate
 * @param customCategories - Array of custom categories for the list
 * @returns true if the category is valid (exists in predefined or custom categories)
 *
 * @example
 * ```typescript
 * const customCategories = [{ id: '1', name: 'Snacks', listId: 'list1', ... }];
 * isValidCategory('Produce', customCategories); // true (predefined)
 * isValidCategory('Snacks', customCategories); // true (custom)
 * isValidCategory('NonExistent', customCategories); // false
 * ```
 */
export function isValidCategory(
  categoryName: string,
  customCategories: CustomCategory[]
): boolean {
  // Check if it's a predefined category
  if (CATEGORIES.includes(categoryName as any)) {
    return true;
  }

  // Check if it's a custom category
  return customCategories.some((cat) => cat.name === categoryName);
}

/**
 * Gets a fallback category if the given category doesn't exist
 * Returns 'Other' as fallback for invalid categories
 *
 * @param categoryName - The category name to validate
 * @param customCategories - Array of custom categories for the list
 * @returns The original category name if valid, otherwise 'Other'
 *
 * @example
 * ```typescript
 * const customCategories = [{ id: '1', name: 'Snacks', listId: 'list1', ... }];
 * getCategoryOrFallback('Produce', customCategories); // 'Produce'
 * getCategoryOrFallback('Snacks', customCategories); // 'Snacks'
 * getCategoryOrFallback('DeletedCategory', customCategories); // 'Other'
 * ```
 */
export function getCategoryOrFallback(
  categoryName: string,
  customCategories: CustomCategory[]
): string {
  if (isValidCategory(categoryName, customCategories)) {
    return categoryName;
  }
  return 'Other';
}

/**
 * Gets all available categories (predefined + custom) for a list
 *
 * @param customCategories - Array of custom categories for the list
 * @returns Array of all category names (predefined categories first, then custom categories sorted alphabetically)
 *
 * @example
 * ```typescript
 * const customCategories = [
 *   { id: '1', name: 'Snacks', listId: 'list1', ... },
 *   { id: '2', name: 'Pet Supplies', listId: 'list1', ... }
 * ];
 * getAllCategories(customCategories);
 * // ['Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Beverages', 'Other', 'Pet Supplies', 'Snacks']
 * ```
 */
export function getAllCategories(
  customCategories: CustomCategory[]
): string[] {
  // Get predefined categories as mutable array
  const predefinedCategories = [...CATEGORIES];

  // Get custom category names and sort them alphabetically
  const customCategoryNames = customCategories
    .map((cat) => cat.name)
    .sort((a, b) => a.localeCompare(b));

  // Combine predefined and custom categories
  return [...predefinedCategories, ...customCategoryNames];
}

/**
 * Updates all grocery items using a deleted category to use 'Other' category
 * This function should be called when deleting a custom category
 *
 * @param categoryName - The name of the category being deleted
 * @param listId - The ID of the list
 * @param zero - The Zero instance for database operations
 * @returns Promise that resolves when all items have been updated
 *
 * @example
 * ```typescript
 * import { useZero } from '@rocicorp/zero/react';
 *
 * // In your delete mutation handler:
 * const zero = useZero();
 * const categoryToDelete = 'Snacks';
 * const listId = 'list123';
 *
 * // First, update all items using this category
 * await updateItemCategoriesOnDelete(categoryToDelete, listId, zero);
 *
 * // Then, delete the custom category
 * await zero.mutate.deleteCustomCategory({ id: categoryId });
 * ```
 */
export async function updateItemCategoriesOnDelete(
  categoryName: string,
  listId: string,
  zero: any // Zero instance type - using any to avoid importing Zero types
): Promise<void> {
  try {
    // Query all items in this list with the category being deleted
    const items = await zero.query.grocery_items
      .where('list_id', listId)
      .where('category', categoryName)
      .run();

    // Update each item to use 'Other' category
    const updatePromises = items.map((item: any) =>
      zero.mutate.updateGroceryItem({
        id: item.id,
        category: 'Other',
        updatedAt: Date.now(),
      })
    );

    await Promise.all(updatePromises);

    console.log(
      `Updated ${items.length} items from category "${categoryName}" to "Other"`
    );
  } catch (error) {
    console.error('Error updating item categories on delete:', error);
    throw new Error(
      `Failed to update items when deleting category "${categoryName}": ${error}`
    );
  }
}

/**
 * Gets count of items using a specific category
 * Useful for showing warnings before deleting a category
 *
 * @param categoryName - The category name to count items for
 * @param listId - The ID of the list
 * @param zero - The Zero instance for database operations
 * @returns Promise that resolves to the count of items using this category
 *
 * @example
 * ```typescript
 * import { useZero } from '@rocicorp/zero/react';
 *
 * const zero = useZero();
 * const count = await getItemCountByCategory('Snacks', 'list123', zero);
 *
 * if (count > 0) {
 *   const confirmed = confirm(
 *     `This category is used by ${count} item(s). ` +
 *     `They will be moved to "Other". Continue?`
 *   );
 *   if (!confirmed) return;
 * }
 * ```
 */
export async function getItemCountByCategory(
  categoryName: string,
  listId: string,
  zero: any
): Promise<number> {
  try {
    const items = await zero.query.grocery_items
      .where('list_id', listId)
      .where('category', categoryName)
      .run();

    return items.length;
  } catch (error) {
    console.error('Error getting item count by category:', error);
    return 0;
  }
}

/**
 * Validates a custom category name
 * Ensures the name is not empty, not a duplicate of predefined categories,
 * and not a duplicate of existing custom categories
 *
 * @param name - The category name to validate
 * @param customCategories - Array of existing custom categories
 * @param excludeId - Optional ID of category to exclude from duplicate check (for updates)
 * @returns Object with isValid boolean and optional error message
 *
 * @example
 * ```typescript
 * const customCategories = [{ id: '1', name: 'Snacks', listId: 'list1', ... }];
 *
 * validateCategoryName('', customCategories);
 * // { isValid: false, error: 'Category name cannot be empty' }
 *
 * validateCategoryName('Produce', customCategories);
 * // { isValid: false, error: 'This is a predefined category name' }
 *
 * validateCategoryName('Snacks', customCategories);
 * // { isValid: false, error: 'A category with this name already exists' }
 *
 * validateCategoryName('Pet Supplies', customCategories);
 * // { isValid: true }
 *
 * // When updating, exclude the current category from duplicate check
 * validateCategoryName('Snacks', customCategories, '1');
 * // { isValid: true } - allows keeping the same name
 * ```
 */
export function validateCategoryName(
  name: string,
  customCategories: CustomCategory[],
  excludeId?: string
): { isValid: boolean; error?: string } {
  const trimmedName = name.trim();

  // Check if name is empty
  if (!trimmedName) {
    return {
      isValid: false,
      error: 'Category name cannot be empty',
    };
  }

  // Check if name is too long
  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: 'Category name must be 50 characters or less',
    };
  }

  // Check if it conflicts with predefined categories
  if (CATEGORIES.includes(trimmedName as any)) {
    return {
      isValid: false,
      error: 'This is a predefined category name',
    };
  }

  // Check if it conflicts with existing custom categories (case-insensitive)
  const duplicate = customCategories.find(
    (cat) =>
      cat.id !== excludeId &&
      cat.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (duplicate) {
    return {
      isValid: false,
      error: 'A category with this name already exists',
    };
  }

  return { isValid: true };
}

/**
 * Migrates items from one category to another
 * Useful for merging categories or manual category reassignment
 *
 * @param fromCategory - The source category name
 * @param toCategory - The target category name
 * @param listId - The ID of the list
 * @param zero - The Zero instance for database operations
 * @returns Promise that resolves to the number of items migrated
 *
 * @example
 * ```typescript
 * import { useZero } from '@rocicorp/zero/react';
 *
 * const zero = useZero();
 * const count = await migrateCategoryItems('Snacks', 'Pantry', 'list123', zero);
 * console.log(`Migrated ${count} items from Snacks to Pantry`);
 * ```
 */
export async function migrateCategoryItems(
  fromCategory: string,
  toCategory: string,
  listId: string,
  zero: any
): Promise<number> {
  try {
    const items = await zero.query.grocery_items
      .where('list_id', listId)
      .where('category', fromCategory)
      .run();

    const updatePromises = items.map((item: any) =>
      zero.mutate.updateGroceryItem({
        id: item.id,
        category: toCategory,
        updatedAt: Date.now(),
      })
    );

    await Promise.all(updatePromises);

    console.log(
      `Migrated ${items.length} items from "${fromCategory}" to "${toCategory}"`
    );

    return items.length;
  } catch (error) {
    console.error('Error migrating category items:', error);
    throw new Error(
      `Failed to migrate items from "${fromCategory}" to "${toCategory}": ${error}`
    );
  }
}
