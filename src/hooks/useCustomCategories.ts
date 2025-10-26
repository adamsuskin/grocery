/**
 * Custom Categories Hooks for Zero
 *
 * This module provides React hooks for managing custom categories with Zero.
 * Custom categories allow users to create their own category names beyond the
 * predefined set (Produce, Dairy, Meat, etc.).
 *
 * ## Features
 * - Query custom categories for a specific list
 * - Create new custom categories with optional color/icon
 * - Update existing custom categories
 * - Delete custom categories
 * - Automatic user authentication and association
 *
 * ## Usage
 *
 * ```typescript
 * // Query custom categories for a list
 * const customCategories = useCustomCategories('list-123');
 *
 * // Get mutation functions
 * const { addCustomCategory, updateCustomCategory, deleteCustomCategory } = useCustomCategoryMutations();
 *
 * // Create a new custom category
 * await addCustomCategory({
 *   name: 'Snacks',
 *   listId: 'list-123',
 *   color: '#FF5733',
 *   icon: '🍿'
 * });
 *
 * // Update a custom category
 * await updateCustomCategory({
 *   id: 'category-456',
 *   name: 'Healthy Snacks',
 *   color: '#4CAF50'
 * });
 *
 * // Delete a custom category
 * await deleteCustomCategory('category-456');
 * ```
 */

import { useQuery } from '@rocicorp/zero/react';
import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { getZeroInstance } from '../zero-store';
import type {
  CustomCategory,
  CreateCustomCategoryInput,
  UpdateCustomCategoryInput
} from '../types';
import {
  validateCategoryFields,
} from '../utils/categoryValidation';
import {
  logCategoryActivity,
  createCategoryCreatedDetails,
  createCategoryUpdatedDetails,
  createCategoryArchivedDetails,
  createCategoryRestoredDetails,
  createCategoryDeletedDetails,
  createCategoryMergedDetails,
  detectCategoryChanges,
} from '../utils/categoryActivityLogger';
import { useAuth } from '../context/AuthContext';

/**
 * React hook to query custom categories for a list
 *
 * @param listId - Optional list ID to filter categories by specific list.
 *                 If not provided, returns all custom categories accessible to the user.
 * @param includeArchived - Whether to include archived categories in the results. Defaults to false.
 * @returns Array of CustomCategory objects sorted by creation date (oldest first)
 *
 * @example
 * ```typescript
 * // Get all active custom categories for a specific list
 * const categories = useCustomCategories('list-123');
 *
 * // Get all custom categories including archived ones
 * const allCategories = useCustomCategories('list-123', true);
 *
 * // categories will be an array like:
 * // [
 * //   { id: '1', name: 'Snacks', listId: 'list-123', color: '#FF5733', ... },
 * //   { id: '2', name: 'Cleaning', listId: 'list-123', color: '#2196F3', ... }
 * // ]
 * ```
 */
export function useCustomCategories(listId?: string, includeArchived: boolean = false): CustomCategory[] {
  const zero = getZeroInstance();

  // Build the base query
  let baseQuery = zero.query.custom_categories;

  // Filter by list if listId is provided
  if (listId) {
    baseQuery = baseQuery.where('list_id', listId) as any;
  }

  // Execute the query
  const query = useQuery(baseQuery as any);

  // Transform database format to application format and sort
  const customCategories = useMemo(() => {
    const categories: CustomCategory[] = (query as any[]).map((category: any) => ({
      id: category.id,
      name: category.name,
      listId: category.list_id,
      createdBy: category.created_by,
      color: category.color || undefined,
      icon: category.icon || undefined,
      displayOrder: category.display_order ?? 0,
      isArchived: category.is_archived ?? false,
      archivedAt: category.archived_at || undefined,
      isLocked: category.is_locked ?? false,
      lastEditedBy: category.last_edited_by || undefined,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    // Filter out archived categories unless explicitly requested
    const filteredCategories = includeArchived
      ? categories
      : categories.filter(cat => !cat.isArchived);

    // Sort by display_order DESC (higher numbers first), then by creation date ASC (oldest first)
    return filteredCategories.sort((a, b) => {
      // First sort by display order (descending - higher priority first)
      if (b.displayOrder !== a.displayOrder) {
        return b.displayOrder - a.displayOrder;
      }
      // If display order is the same, sort by creation date (ascending - oldest first)
      return a.createdAt - b.createdAt;
    });
  }, [query, includeArchived]);

  return customCategories;
}

/**
 * React hook for custom category mutations
 * Provides functions for creating, updating, and deleting custom categories
 *
 * @returns Object with mutation functions
 *
 * @example
 * ```typescript
 * const { addCustomCategory, updateCustomCategory, deleteCustomCategory } = useCustomCategoryMutations();
 *
 * // Create a new category
 * await addCustomCategory({
 *   name: 'Snacks',
 *   listId: 'list-123',
 *   color: '#FF5733',
 *   icon: '🍿'
 * });
 *
 * // Update an existing category
 * await updateCustomCategory({
 *   id: 'category-456',
 *   name: 'Healthy Snacks'
 * });
 *
 * // Delete a category
 * await deleteCustomCategory('category-456');
 * ```
 */
export function useCustomCategoryMutations() {
  const zero = getZeroInstance();
  const { token } = useAuth();

  /**
   * Get the current user ID from the Zero instance
   * This ensures all custom categories are associated with the authenticated user
   */
  const getCurrentUserId = (): string => {
    return (zero as any).userID || 'demo-user';
  };

  /**
   * Check if user has permission to modify a list
   * @param listId - The list ID to check permissions for
   * @param userId - The current user's ID
   * @returns True if user has owner or editor permission
   */
  const checkEditPermission = async (listId: string, userId: string): Promise<boolean> => {
    try {
      // Query the list to check ownership
      const listQuery = await (zero.query.lists.where('id', listId) as any).run();
      const list = listQuery[0];

      if (list?.owner_id === userId) {
        return true; // Owner has full permissions
      }

      // Query list membership to check permission level
      const memberQuery = await (zero.query.list_members
        .where('list_id', listId)
        .where('user_id', userId) as any).run();
      const member = memberQuery[0];

      if (member && (member.permission === 'editor' || member.permission === 'owner')) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('[useCustomCategories] Error checking permissions:', error);
      return false;
    }
  };

  /**
   * Add a new custom category
   * Automatically associates the category with the current authenticated user
   * Includes comprehensive validation for name, color, and icon
   *
   * @param input - Category creation input with name, listId, and optional color/icon
   * @param existingCategories - Array of existing custom categories for validation (optional)
   * @throws Error if validation fails or the operation fails
   *
   * @example
   * ```typescript
   * await addCustomCategory({
   *   name: 'Snacks',
   *   listId: 'list-123',
   *   color: '#FF5733',
   *   icon: '🍿'
   * });
   * ```
   */
  const addCustomCategory = async (
    input: CreateCustomCategoryInput,
    existingCategories?: CustomCategory[]
  ): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to create custom categories');
    }

    if (!input.listId || input.listId.trim() === '') {
      throw new Error('List ID is required');
    }

    // Use existing categories if provided, otherwise validation will only check basic rules
    // Note: For duplicate name checking, pass existingCategories from the component
    const categoriesToCheck: Array<{ name: string; id?: string }> = existingCategories
      ? existingCategories.map(cat => ({ name: cat.name, id: cat.id }))
      : [];

    // Validate all fields
    const validationErrors = validateCategoryFields(
      {
        name: input.name,
        color: input.color,
        icon: input.icon,
      },
      categoriesToCheck
    );

    // Check if there are any validation errors
    if (Object.keys(validationErrors).length > 0) {
      const errorMessage = validationErrors.name || validationErrors.color || validationErrors.icon;
      throw new Error(errorMessage);
    }

    const id = nanoid();
    const now = Date.now();

    try {
      await zero.mutate.custom_categories.create({
        id,
        name: input.name.trim(),
        list_id: input.listId,
        created_by: currentUserId,
        color: input.color || '',
        icon: input.icon || '',
        display_order: input.displayOrder ?? 0,
        is_archived: false,
        archived_at: 0,
        is_locked: false,
        last_edited_by: currentUserId,
        createdAt: now,
        updatedAt: now,
      });

      // Log activity
      if (token) {
        await logCategoryActivity(
          input.listId,
          'category_created',
          createCategoryCreatedDetails(id, input.name.trim()),
          token
        );
      }
    } catch (error) {
      console.error('[useCustomCategories] Error creating custom category:', error);
      // Provide more context if it's a database error
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('A category with this name already exists');
      }
      throw new Error('Failed to create custom category. Please try again.');
    }
  };

  /**
   * Update an existing custom category
   * Can update name, color, and/or icon
   * Includes comprehensive validation for all fields
   *
   * @param input - Category update input with id and optional fields to update
   * @param existingCategories - Array of existing custom categories for validation (optional)
   * @throws Error if validation fails or the operation fails
   *
   * @example
   * ```typescript
   * // Update just the name
   * await updateCustomCategory({
   *   id: 'category-456',
   *   name: 'Healthy Snacks'
   * });
   *
   * // Update name and color
   * await updateCustomCategory({
   *   id: 'category-456',
   *   name: 'Healthy Snacks',
   *   color: '#4CAF50'
   * });
   * ```
   */
  const updateCustomCategory = async (
    input: UpdateCustomCategoryInput,
    existingCategories?: CustomCategory[]
  ): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to update custom categories');
    }

    if (!input.id || input.id.trim() === '') {
      throw new Error('Category ID is required');
    }

    // Validate that at least one field is being updated
    if (input.name === undefined && input.color === undefined && input.icon === undefined && input.displayOrder === undefined) {
      throw new Error('At least one field must be provided for update');
    }

    // Get the current category and list ID for validation
    let listId: string | undefined;
    let categoriesToCheck = existingCategories;

    if (!categoriesToCheck) {
      try {
        const currentCategory = await (zero.query.custom_categories
          .where('id', input.id) as any).run();

        if (currentCategory.length === 0) {
          throw new Error('Category not found');
        }

        listId = currentCategory[0].list_id;

        // Check if user has permission to modify this list
        const hasPermission = await checkEditPermission(listId!, currentUserId);
        if (!hasPermission) {
          throw new Error('You do not have permission to edit categories in this list. Only owners and editors can manage custom categories.');
        }

        const existingCats = await (zero.query.custom_categories
          .where('list_id', listId!) as any).run();

        categoriesToCheck = existingCats.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          listId: cat.list_id,
          createdBy: cat.created_by,
          color: cat.color || undefined,
          icon: cat.icon || undefined,
          displayOrder: cat.display_order ?? 0,
          isArchived: cat.is_archived ?? false,
          archivedAt: cat.archived_at || undefined,
          isLocked: cat.is_locked ?? false,
          lastEditedBy: cat.last_edited_by || undefined,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        }));
      } catch (error) {
        console.error('[useCustomCategories] Error fetching existing categories:', error);
        // Continue with update but validation may be incomplete
      }
    }

    // Only validate fields that are being updated
    if (input.name !== undefined || input.color !== undefined || input.icon !== undefined) {
      // Build validation input
      const validationInput: any = {
        name: input.name !== undefined ? input.name : '__SKIP__',
        color: input.color !== undefined ? input.color : undefined,
        icon: input.icon !== undefined ? input.icon : undefined,
      };

      // Validate fields (excluding current category from duplicate check)
      const validationErrors = validateCategoryFields(
        validationInput,
        categoriesToCheck || [],
        input.id
      );

      // Only check errors for fields that are actually being updated
      const relevantErrors: any = {};
      if (input.name !== undefined && validationErrors.name) {
        relevantErrors.name = validationErrors.name;
      }
      if (input.color !== undefined && validationErrors.color) {
        relevantErrors.color = validationErrors.color;
      }
      if (input.icon !== undefined && validationErrors.icon) {
        relevantErrors.icon = validationErrors.icon;
      }

      if (Object.keys(relevantErrors).length > 0) {
        const errorMessage = relevantErrors.name || relevantErrors.color || relevantErrors.icon;
        throw new Error(errorMessage);
      }
    }

    try {
      // Get current category for logging changes
      const currentCategory = await (zero.query.custom_categories
        .where('id', input.id) as any).run();

      if (currentCategory.length === 0) {
        throw new Error('Category not found');
      }

      const oldCategory = currentCategory[0];
      const updateData: any = {
        id: input.id,
        updatedAt: Date.now(),
      };

      // Only include fields that are being updated
      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }

      if (input.color !== undefined) {
        updateData.color = input.color || '';
      }

      if (input.icon !== undefined) {
        updateData.icon = input.icon || '';
      }

      if (input.displayOrder !== undefined) {
        updateData.display_order = input.displayOrder;
      }

      await zero.mutate.custom_categories.update(updateData);

      // Log activity with changes
      if (token) {
        const changes = detectCategoryChanges(
          {
            name: oldCategory.name,
            color: oldCategory.color || undefined,
            icon: oldCategory.icon || undefined,
            displayOrder: oldCategory.display_order ?? 0,
          },
          {
            name: input.name,
            color: input.color,
            icon: input.icon,
            displayOrder: input.displayOrder,
          }
        );

        if (changes.length > 0) {
          await logCategoryActivity(
            oldCategory.list_id,
            'category_updated',
            createCategoryUpdatedDetails(
              input.id,
              input.name?.trim() || oldCategory.name,
              changes
            ),
            token
          );
        }
      }
    } catch (error) {
      console.error('[useCustomCategories] Error updating custom category:', error);
      // Provide more context if it's a database error
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('A category with this name already exists');
      }
      throw new Error('Failed to update custom category. Please try again.');
    }
  };

  /**
   * Archive a custom category (soft delete)
   * Requires owner or editor permission on the list
   *
   * Archived categories are hidden from the UI by default but can be restored.
   * Items using this category will still reference it, preserving historical data.
   *
   * @param categoryId - ID of the category to archive
   * @throws Error if user lacks permission or the operation fails
   *
   * @example
   * ```typescript
   * await archiveCategory('category-456');
   * ```
   */
  const archiveCategory = async (categoryId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to archive custom categories');
    }

    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    // Get the category to find its list_id
    const categoryQuery = await (zero.query.custom_categories.where('id', categoryId) as any).run();
    const category = categoryQuery[0];

    if (!category) {
      throw new Error('Category not found');
    }

    if (category.is_archived) {
      throw new Error('Category is already archived');
    }

    // Check if user has permission to modify this list
    const hasPermission = await checkEditPermission(category.list_id, currentUserId);
    if (!hasPermission) {
      throw new Error('You do not have permission to archive categories from this list. Only owners and editors can manage custom categories.');
    }

    try {
      const now = Date.now();
      await zero.mutate.custom_categories.update({
        id: categoryId,
        is_archived: true,
        archived_at: now,
        updatedAt: now,
      });

      // Log activity
      if (token) {
        await logCategoryActivity(
          category.list_id,
          'category_archived',
          createCategoryArchivedDetails(categoryId, category.name),
          token
        );
      }
    } catch (error) {
      console.error('[useCustomCategories] Error archiving custom category:', error);
      throw new Error('Failed to archive custom category');
    }
  };

  /**
   * Restore an archived custom category
   * Requires owner or editor permission on the list
   *
   * Restored categories become active again and appear in the UI.
   *
   * @param categoryId - ID of the category to restore
   * @throws Error if user lacks permission or the operation fails
   *
   * @example
   * ```typescript
   * await restoreCategory('category-456');
   * ```
   */
  const restoreCategory = async (categoryId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to restore custom categories');
    }

    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    // Get the category to find its list_id
    const categoryQuery = await (zero.query.custom_categories.where('id', categoryId) as any).run();
    const category = categoryQuery[0];

    if (!category) {
      throw new Error('Category not found');
    }

    if (!category.is_archived) {
      throw new Error('Category is not archived');
    }

    // Check if user has permission to modify this list
    const hasPermission = await checkEditPermission(category.list_id, currentUserId);
    if (!hasPermission) {
      throw new Error('You do not have permission to restore categories in this list. Only owners and editors can manage custom categories.');
    }

    try {
      await zero.mutate.custom_categories.update({
        id: categoryId,
        is_archived: false,
        archived_at: 0,
        updatedAt: Date.now(),
      });

      // Log activity
      if (token) {
        await logCategoryActivity(
          category.list_id,
          'category_restored',
          createCategoryRestoredDetails(categoryId, category.name),
          token
        );
      }
    } catch (error) {
      console.error('[useCustomCategories] Error restoring custom category:', error);
      throw new Error('Failed to restore custom category');
    }
  };

  /**
   * Permanently delete a custom category
   * Requires owner or editor permission on the list
   *
   * IMPORTANT: Can only delete categories that are already archived.
   * This prevents accidental deletion and preserves data integrity.
   * To delete a category, first archive it, then permanently delete it.
   *
   * @param categoryId - ID of the archived category to permanently delete
   * @throws Error if user lacks permission, category is not archived, or the operation fails
   *
   * @example
   * ```typescript
   * // First archive the category
   * await archiveCategory('category-456');
   * // Then permanently delete it
   * await deleteCustomCategory('category-456');
   * ```
   */
  const deleteCustomCategory = async (categoryId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to delete custom categories');
    }

    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    // Get the category to find its list_id
    const categoryQuery = await (zero.query.custom_categories.where('id', categoryId) as any).run();
    const category = categoryQuery[0];

    if (!category) {
      throw new Error('Category not found');
    }

    // Only allow permanent deletion of archived categories
    if (!category.is_archived) {
      throw new Error('Cannot permanently delete an active category. Archive it first.');
    }

    // Check if user has permission to modify this list
    const hasPermission = await checkEditPermission(category.list_id, currentUserId);
    if (!hasPermission) {
      throw new Error('You do not have permission to delete categories from this list. Only owners and editors can manage custom categories.');
    }

    // Check if any items are still using this category
    const itemsQuery = await (zero.query.grocery_items
      .where('list_id', category.list_id) as any).run();

    const itemsUsingCategory = itemsQuery.filter((item: any) => item.category === categoryId);

    if (itemsUsingCategory.length > 0) {
      throw new Error(`Cannot delete category. ${itemsUsingCategory.length} item(s) are still using this category. Please reassign those items first.`);
    }

    try {
      await zero.mutate.custom_categories.delete({ id: categoryId });

      // Log activity
      if (token) {
        await logCategoryActivity(
          category.list_id,
          'category_deleted',
          createCategoryDeletedDetails(categoryId, category.name),
          token
        );
      }
    } catch (error) {
      console.error('[useCustomCategories] Error deleting custom category:', error);
      throw new Error('Failed to delete custom category');
    }
  };

  /**
   * Delete multiple custom categories at once
   * Requires owner or editor permission on the list
   *
   * @param categoryIds - Array of category IDs to delete
   * @throws Error if user lacks permission or the operation fails
   *
   * @example
   * ```typescript
   * await deleteMultipleCategories(['cat-1', 'cat-2', 'cat-3']);
   * ```
   */
  const deleteMultipleCategories = async (categoryIds: string[]): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to delete custom categories');
    }

    if (!categoryIds || categoryIds.length === 0) {
      throw new Error('At least one category ID is required');
    }

    // Get all categories to verify they exist and check permissions
    const categoriesQuery = await (zero.query.custom_categories as any).run();
    const categoriesToDelete = categoriesQuery.filter((cat: any) =>
      categoryIds.includes(cat.id)
    );

    if (categoriesToDelete.length === 0) {
      throw new Error('No valid categories found to delete');
    }

    // Check permissions for each category's list
    const listIds = [...new Set(categoriesToDelete.map((cat: any) => cat.list_id as string))];
    for (const listId of listIds) {
      const hasPermission = await checkEditPermission(listId, currentUserId);
      if (!hasPermission) {
        throw new Error(`You do not have permission to delete categories from list ${listId}. Only owners and editors can manage custom categories.`);
      }
    }

    // Delete all categories
    try {
      for (const categoryId of categoryIds) {
        await zero.mutate.custom_categories.delete({ id: categoryId });
      }
    } catch (error) {
      console.error('[useCustomCategories] Error deleting multiple categories:', error);
      throw new Error('Failed to delete some categories. Please try again.');
    }
  };

  /**
   * Update multiple custom categories at once
   * Useful for bulk color changes or other mass edits
   *
   * @param updates - Array of updates with category ID and changes
   * @throws Error if validation fails or the operation fails
   *
   * @example
   * ```typescript
   * await updateMultipleCategories([
   *   { id: 'cat-1', changes: { color: '#FF5733' } },
   *   { id: 'cat-2', changes: { color: '#FF5733' } }
   * ]);
   * ```
   */
  const updateMultipleCategories = async (
    updates: Array<{ id: string; changes: Partial<CustomCategory> }>
  ): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to update custom categories');
    }

    if (!updates || updates.length === 0) {
      throw new Error('At least one update is required');
    }

    // Validate all updates before applying any
    for (const update of updates) {
      if (!update.id || update.id.trim() === '') {
        throw new Error('Category ID is required for all updates');
      }

      if (!update.changes || Object.keys(update.changes).length === 0) {
        throw new Error('At least one field must be provided for each update');
      }
    }

    // Get all categories to check permissions
    const categoryIds = updates.map(u => u.id);
    const categoriesQuery = await (zero.query.custom_categories as any).run();
    const categoriesToUpdate = categoriesQuery.filter((cat: any) =>
      categoryIds.includes(cat.id)
    );

    if (categoriesToUpdate.length === 0) {
      throw new Error('No valid categories found to update');
    }

    // Check permissions for each category's list
    const listIds = [...new Set(categoriesToUpdate.map((cat: any) => cat.list_id as string))];
    for (const listId of listIds) {
      const hasPermission = await checkEditPermission(listId, currentUserId);
      if (!hasPermission) {
        throw new Error(`You do not have permission to edit categories in list ${listId}. Only owners and editors can manage custom categories.`);
      }
    }

    // Apply all updates
    try {
      const now = Date.now();
      for (const update of updates) {
        const updateData: any = {
          id: update.id,
          updatedAt: now,
        };

        if (update.changes.name !== undefined) {
          updateData.name = update.changes.name.trim();
        }

        if (update.changes.color !== undefined) {
          updateData.color = update.changes.color || '';
        }

        if (update.changes.icon !== undefined) {
          updateData.icon = update.changes.icon || '';
        }

        await zero.mutate.custom_categories.update(updateData);
      }
    } catch (error) {
      console.error('[useCustomCategories] Error updating multiple categories:', error);
      throw new Error('Failed to update some categories. Please try again.');
    }
  };

  /**
   * Merge multiple source categories into a target category
   * Moves all items from source categories to target, then deletes sources
   *
   * @param sourceIds - Array of source category IDs to merge from
   * @param targetId - Target category ID to merge into
   * @throws Error if validation fails or the operation fails
   *
   * @example
   * ```typescript
   * await mergeCategories(['cat-1', 'cat-2'], 'cat-3');
   * // All items from cat-1 and cat-2 are now in cat-3
   * // cat-1 and cat-2 are deleted
   * ```
   */
  const mergeCategories = async (sourceIds: string[], targetId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to merge custom categories');
    }

    if (!sourceIds || sourceIds.length === 0) {
      throw new Error('At least one source category is required');
    }

    if (!targetId || targetId.trim() === '') {
      throw new Error('Target category ID is required');
    }

    if (sourceIds.includes(targetId)) {
      throw new Error('Cannot merge a category into itself');
    }

    // Get all categories involved
    const allCategoryIds = [...sourceIds, targetId];
    const categoriesQuery = await (zero.query.custom_categories as any).run();
    const categories = categoriesQuery.filter((cat: any) =>
      allCategoryIds.includes(cat.id)
    );

    const sourceCategories = categories.filter((cat: any) => sourceIds.includes(cat.id));
    const targetCategory = categories.find((cat: any) => cat.id === targetId);

    if (!targetCategory) {
      throw new Error('Target category not found');
    }

    if (sourceCategories.length === 0) {
      throw new Error('No valid source categories found');
    }

    // Verify all categories are from the same list
    const listIds = [...new Set(categories.map((cat: any) => cat.list_id as string))];
    if (listIds.length > 1) {
      throw new Error('Cannot merge categories from different lists');
    }

    const listId = listIds[0];

    // Check permissions
    const hasPermission = await checkEditPermission(listId, currentUserId);
    if (!hasPermission) {
      throw new Error('You do not have permission to merge categories in this list. Only owners and editors can manage custom categories.');
    }

    try {
      // Move all items from source categories to target category
      const itemsQuery = await (zero.query.grocery_items
        .where('list_id', listId) as any).run();

      const itemsToUpdate = itemsQuery.filter((item: any) =>
        sourceIds.includes(item.category)
      );

      for (const item of itemsToUpdate) {
        await zero.mutate.grocery_items.update({
          id: item.id,
          category: targetId,
        });
      }

      // Delete source categories
      for (const sourceId of sourceIds) {
        await zero.mutate.custom_categories.delete({ id: sourceId });
      }

      // Log activity
      if (token) {
        await logCategoryActivity(
          listId,
          'category_merged',
          createCategoryMergedDetails(targetId, targetCategory.name, sourceIds),
          token
        );
      }
    } catch (error) {
      console.error('[useCustomCategories] Error merging categories:', error);
      throw new Error('Failed to merge categories. Some changes may have been applied. Please refresh and try again.');
    }
  };

  /**
   * Export selected categories as JSON
   * Useful for backing up or sharing category configurations
   *
   * @param categoryIds - Array of category IDs to export
   * @returns JSON string of exported categories
   *
   * @example
   * ```typescript
   * const json = await exportCategories(['cat-1', 'cat-2']);
   * // Download or save the JSON
   * ```
   */
  const exportCategories = async (categoryIds: string[]): Promise<string> => {
    if (!categoryIds || categoryIds.length === 0) {
      throw new Error('At least one category ID is required');
    }

    // Get the categories
    const categoriesQuery = await (zero.query.custom_categories as any).run();
    const categoriesToExport = categoriesQuery.filter((cat: any) =>
      categoryIds.includes(cat.id)
    );

    if (categoriesToExport.length === 0) {
      throw new Error('No valid categories found to export');
    }

    // Transform to application format
    const exportData = categoriesToExport.map((cat: any) => ({
      name: cat.name,
      color: cat.color || undefined,
      icon: cat.icon || undefined,
    }));

    return JSON.stringify(exportData, null, 2);
  };

  /**
   * Update the display order of a category
   * Useful for reordering categories for display priority
   *
   * @param categoryId - ID of the category to update
   * @param newOrder - New display order value (higher = higher priority)
   * @throws Error if user lacks permission or the operation fails
   *
   * @example
   * ```typescript
   * await updateCategoryOrder('category-456', 10);
   * ```
   */
  const updateCategoryOrder = async (categoryId: string, newOrder: number): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to update custom categories');
    }

    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    if (typeof newOrder !== 'number' || isNaN(newOrder)) {
      throw new Error('Display order must be a valid number');
    }

    // Get the category to find its list_id and check permissions
    const categoryQuery = await (zero.query.custom_categories.where('id', categoryId) as any).run();
    const category = categoryQuery[0];

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if user has permission to modify this list
    const hasPermission = await checkEditPermission(category.list_id, currentUserId);
    if (!hasPermission) {
      throw new Error('You do not have permission to reorder categories in this list. Only owners and editors can manage custom categories.');
    }

    try {
      await zero.mutate.custom_categories.update({
        id: categoryId,
        display_order: newOrder,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('[useCustomCategories] Error updating category order:', error);
      throw new Error('Failed to update category order. Please try again.');
    }
  };

  return {
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    archiveCategory,
    restoreCategory,
    deleteMultipleCategories,
    updateMultipleCategories,
    mergeCategories,
    exportCategories,
    updateCategoryOrder,
  };
}
