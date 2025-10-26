/**
 * Integration Example: Using categoryUtils with Custom Category Deletion
 *
 * This example demonstrates how to properly handle custom category deletion
 * with automatic migration of grocery items to the 'Other' category.
 *
 * ## Implementation Overview
 *
 * When a custom category is deleted:
 * 1. Count items using the category (optional, for user confirmation)
 * 2. Update all items using the category to 'Other'
 * 3. Delete the custom category
 *
 * This ensures data integrity and prevents orphaned items with invalid categories.
 */

import React, { useState } from 'react';
import { useCustomCategories, useCustomCategoryMutations } from '../hooks/useCustomCategories';
import { getZeroInstance } from '../zero-store';
import {
  updateItemCategoriesOnDelete,
  getItemCountByCategory,
  validateCategoryName,
  getAllCategories,
} from './categoryUtils';
import type { CustomCategory } from '../types';

/**
 * Example Component: Custom Category Manager
 * Shows how to integrate categoryUtils with custom category operations
 */
export function CustomCategoryManager({ listId }: { listId: string }) {
  const customCategories = useCustomCategories(listId);
  const { addCustomCategory, updateCustomCategory, deleteCustomCategory } =
    useCustomCategoryMutations();
  const zero = getZeroInstance();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * Handle custom category creation with validation
   */
  const handleAddCategory = async () => {
    // Validate the category name using categoryUtils
    const validation = validateCategoryName(newCategoryName, customCategories);

    if (!validation.isValid) {
      alert(`Invalid category name: ${validation.error}`);
      return;
    }

    try {
      await addCustomCategory({
        name: newCategoryName.trim(),
        listId,
        color: newCategoryColor || undefined,
        icon: newCategoryIcon || undefined,
      });

      // Reset form
      setNewCategoryName('');
      setNewCategoryColor('');
      setNewCategoryIcon('');

      alert('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category. Please try again.');
    }
  };

  /**
   * Handle custom category deletion with item migration
   * This is the RECOMMENDED approach using Option A from requirements
   */
  const handleDeleteCategory = async (category: CustomCategory) => {
    setIsDeleting(category.id);

    try {
      // STEP 1: Get count of items using this category (optional, for user confirmation)
      const itemCount = await getItemCountByCategory(category.name, listId, zero);

      // STEP 2: Show confirmation with item count
      const message =
        itemCount > 0
          ? `This category is used by ${itemCount} item(s). They will be moved to "Other". Continue?`
          : `Are you sure you want to delete the "${category.name}" category?`;

      const confirmed = window.confirm(message);

      if (!confirmed) {
        setIsDeleting(null);
        return;
      }

      // STEP 3: Update all items using this category to 'Other'
      // This MUST be done before deleting the category to maintain data integrity
      await updateItemCategoriesOnDelete(category.name, listId, zero);

      // STEP 4: Delete the custom category
      await deleteCustomCategory(category.id);

      alert(
        itemCount > 0
          ? `Category deleted successfully. ${itemCount} items moved to "Other".`
          : 'Category deleted successfully.'
      );
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * Alternative approach: Prevent deletion if items exist (Option B)
   * This is simpler but less flexible
   */
  const handleDeleteCategoryWithPrevention = async (category: CustomCategory) => {
    setIsDeleting(category.id);

    try {
      // Check if any items use this category
      const itemCount = await getItemCountByCategory(category.name, listId, zero);

      if (itemCount > 0) {
        alert(
          `Cannot delete "${category.name}" because ${itemCount} item(s) are using it. ` +
            'Please move or delete these items first.'
        );
        setIsDeleting(null);
        return;
      }

      // Confirm deletion
      const confirmed = window.confirm(
        `Are you sure you want to delete the "${category.name}" category?`
      );

      if (!confirmed) {
        setIsDeleting(null);
        return;
      }

      // Delete the category
      await deleteCustomCategory(category.id);

      alert('Category deleted successfully.');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Get all available categories (predefined + custom)
  const allCategories = getAllCategories(customCategories);

  return (
    <div className="custom-category-manager">
      <h2>Manage Categories</h2>

      {/* Display all available categories */}
      <div className="all-categories">
        <h3>All Available Categories</h3>
        <ul>
          {allCategories.map((cat) => (
            <li key={cat}>{cat}</li>
          ))}
        </ul>
      </div>

      {/* Create new category */}
      <div className="create-category">
        <h3>Create New Category</h3>
        <input
          type="text"
          placeholder="Category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          maxLength={50}
        />
        <input
          type="text"
          placeholder="Color (e.g., #FF5733)"
          value={newCategoryColor}
          onChange={(e) => setNewCategoryColor(e.target.value)}
        />
        <input
          type="text"
          placeholder="Icon (e.g., 🍿)"
          value={newCategoryIcon}
          onChange={(e) => setNewCategoryIcon(e.target.value)}
        />
        <button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
          Add Category
        </button>
      </div>

      {/* List custom categories */}
      <div className="category-list">
        <h3>Custom Categories</h3>
        {customCategories.length === 0 ? (
          <p>No custom categories yet. Create one above!</p>
        ) : (
          <ul>
            {customCategories.map((category) => (
              <li key={category.id}>
                <span style={{ color: category.color }}>
                  {category.icon && `${category.icon} `}
                  {category.name}
                </span>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  disabled={isDeleting === category.id}
                >
                  {isDeleting === category.id ? 'Deleting...' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Standalone function to integrate into existing delete mutation
 * Use this if you already have a delete function and just want to add item migration
 */
export async function deleteCustomCategoryWithMigration(
  categoryId: string,
  categoryName: string,
  listId: string
): Promise<void> {
  const zero = getZeroInstance();
  const { deleteCustomCategory } = useCustomCategoryMutations();

  try {
    // Step 1: Update all items using this category
    console.log(`Migrating items from category "${categoryName}" to "Other"...`);
    await updateItemCategoriesOnDelete(categoryName, listId, zero);

    // Step 2: Delete the custom category
    console.log(`Deleting custom category "${categoryName}"...`);
    await deleteCustomCategory(categoryId);

    console.log(`Successfully deleted category "${categoryName}"`);
  } catch (error) {
    console.error('Error in deleteCustomCategoryWithMigration:', error);
    throw error;
  }
}

/**
 * Hook-based wrapper for use in React components
 * This provides a convenient hook that handles all the complexity
 */
export function useCustomCategoryDelete(listId: string) {
  const zero = getZeroInstance();
  const { deleteCustomCategory } = useCustomCategoryMutations();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCategoryWithMigration = async (
    categoryId: string,
    categoryName: string,
    showConfirmation: boolean = true
  ): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      // Get item count for confirmation
      const itemCount = await getItemCountByCategory(categoryName, listId, zero);

      // Show confirmation if requested
      if (showConfirmation) {
        const message =
          itemCount > 0
            ? `This category is used by ${itemCount} item(s). They will be moved to "Other". Continue?`
            : `Are you sure you want to delete the "${categoryName}" category?`;

        const confirmed = window.confirm(message);
        if (!confirmed) {
          setIsDeleting(false);
          return false;
        }
      }

      // Migrate items
      await updateItemCategoriesOnDelete(categoryName, listId, zero);

      // Delete category
      await deleteCustomCategory(categoryId);

      setIsDeleting(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error deleting category with migration:', err);
      setIsDeleting(false);
      return false;
    }
  };

  return {
    deleteCategoryWithMigration,
    isDeleting,
    error,
  };
}

/**
 * Example usage in a component:
 *
 * ```typescript
 * function MyCategoryComponent({ listId }: { listId: string }) {
 *   const { deleteCategoryWithMigration, isDeleting, error } = useCustomCategoryDelete(listId);
 *
 *   const handleDelete = async (categoryId: string, categoryName: string) => {
 *     const success = await deleteCategoryWithMigration(categoryId, categoryName);
 *     if (success) {
 *       alert('Category deleted successfully!');
 *     } else if (error) {
 *       alert(`Failed to delete category: ${error}`);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => handleDelete('cat-123', 'Snacks')} disabled={isDeleting}>
 *         {isDeleting ? 'Deleting...' : 'Delete Category'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
