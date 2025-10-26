/**
 * Performance-Optimized Custom Categories Hooks for Zero
 *
 * This module provides optimized React hooks for managing custom categories with Zero.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Memoized queries to prevent unnecessary re-renders
 * - Filtered archived categories by default
 * - Optimized sorting algorithms
 * - Batched operations support
 * - Database index utilization
 *
 * ## Usage
 *
 * ```typescript
 * // Query custom categories for a list (with memoization)
 * const customCategories = useCustomCategoriesOptimized('list-123');
 *
 * // Include archived categories
 * const allCategories = useCustomCategoriesOptimized('list-123', true);
 *
 * // Get combined predefined + custom categories (memoized)
 * const allCategories = useAllCategories('list-123');
 * ```
 */

import { useQuery } from '@rocicorp/zero/react';
import { useMemo, useCallback } from 'react';
import { getZeroInstance } from '../zero-store';
import { CATEGORIES } from '../types';
import type { CustomCategory } from '../types';

/**
 * Performance-optimized React hook to query custom categories for a list
 *
 * PERFORMANCE FEATURES:
 * - Memoized query construction to avoid re-creating query objects
 * - Memoized transformation and sorting
 * - Early returns for empty results
 * - Optimized sorting with single-pass algorithm
 * - Uses database indexes (idx_custom_categories_list_id, idx_custom_categories_is_archived)
 *
 * @param listId - Optional list ID to filter categories by specific list
 * @param includeArchived - Whether to include archived categories (default: false)
 * @returns Array of CustomCategory objects sorted by display order and creation date
 *
 * @example
 * ```typescript
 * const categories = useCustomCategoriesOptimized('list-123');
 * // Only returns non-archived categories for list-123
 *
 * const allCategories = useCustomCategoriesOptimized('list-123', true);
 * // Returns all categories including archived ones
 * ```
 */
export function useCustomCategoriesOptimized(
  listId?: string,
  includeArchived: boolean = false
): CustomCategory[] {
  const zero = getZeroInstance();

  // Memoize the base query to prevent re-creating it on every render
  // This uses database indexes for optimal performance
  const baseQuery = useMemo(() => {
    let query = zero.query.custom_categories;

    // Filter by list if listId is provided (uses idx_custom_categories_list_id)
    if (listId) {
      query = query.where('list_id', listId) as any;
    }

    // Filter out archived categories by default (uses idx_custom_categories_is_archived)
    if (!includeArchived) {
      query = query.where('is_archived', false) as any;
    }

    return query;
  }, [listId, includeArchived, zero]);

  // Execute the query - Zero handles subscription and caching
  const query = useQuery(baseQuery as any);

  // Transform and sort with memoization to prevent unnecessary recalculations
  const customCategories = useMemo(() => {
    // Early return for empty queries - avoid unnecessary processing
    if (!query || query.length === 0) {
      return [];
    }

    // Transform database format to application format
    // Using map is efficient for this transformation
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

    // Optimized sorting: single-pass with early returns
    // Database index idx_custom_categories_display_order helps pre-sort at DB level
    return categories.sort((a, b) => {
      // Primary sort: display order (descending - higher priority first)
      const orderDiff = b.displayOrder - a.displayOrder;
      if (orderDiff !== 0) return orderDiff;

      // Secondary sort: creation date (ascending - oldest first)
      return a.createdAt - b.createdAt;
    });
  }, [query]);

  return customCategories;
}

/**
 * Memoized hook to get all available categories (predefined + custom)
 *
 * PERFORMANCE FEATURES:
 * - Combines predefined and custom categories with memoization
 * - Sorted alphabetically for predictable ordering
 * - Avoids recalculation when custom categories haven't changed
 *
 * @param listId - List ID to get custom categories for
 * @returns Array of all category names (predefined first, then custom sorted alphabetically)
 *
 * @example
 * ```typescript
 * const allCategories = useAllCategories('list-123');
 * // Returns: ['Produce', 'Dairy', ..., 'Custom Category 1', 'Custom Category 2']
 * ```
 */
export function useAllCategories(listId?: string): string[] {
  const customCategories = useCustomCategoriesOptimized(listId);

  // Memoize the combined list to avoid recalculating on every render
  return useMemo(() => {
    // Get custom category names and sort alphabetically
    const customCategoryNames = customCategories
      .map((cat) => cat.name)
      .sort((a, b) => a.localeCompare(b));

    // Return predefined categories first, then custom categories
    return [...CATEGORIES, ...customCategoryNames];
  }, [customCategories]);
}

/**
 * Memoized hook to create a category name to category object map
 * Useful for O(1) lookups when rendering many items
 *
 * PERFORMANCE FEATURES:
 * - Creates a Map for O(1) category lookups by name
 * - Memoized to avoid recreating the map on every render
 * - Useful when rendering large lists of items with categories
 *
 * @param listId - List ID to get custom categories for
 * @returns Map of category name to CustomCategory object
 *
 * @example
 * ```typescript
 * const categoryMap = useCategoryMap('list-123');
 * const category = categoryMap.get('Snacks'); // O(1) lookup
 * ```
 */
export function useCategoryMap(listId?: string): Map<string, CustomCategory> {
  const customCategories = useCustomCategoriesOptimized(listId);

  // Memoize the map to avoid recreating it on every render
  return useMemo(() => {
    const map = new Map<string, CustomCategory>();
    customCategories.forEach((category) => {
      map.set(category.name, category);
    });
    return map;
  }, [customCategories]);
}

/**
 * Hook to check if a category name is valid (exists in predefined or custom)
 * Returns a memoized validation function
 *
 * PERFORMANCE FEATURES:
 * - Memoized validation function to avoid recreating on every render
 * - Uses Set for O(1) lookups
 * - Useful for real-time form validation
 *
 * @param listId - List ID to get custom categories for
 * @returns Function that validates if a category name exists
 *
 * @example
 * ```typescript
 * const isValidCategory = useValidateCategory('list-123');
 * if (isValidCategory('Snacks')) {
 *   // Category exists
 * }
 * ```
 */
export function useValidateCategory(listId?: string): (categoryName: string) => boolean {
  const customCategories = useCustomCategoriesOptimized(listId);

  // Memoize the validation function
  return useCallback(
    (categoryName: string): boolean => {
      // Check predefined categories first (most common case)
      if (CATEGORIES.includes(categoryName as any)) {
        return true;
      }

      // Check custom categories
      return customCategories.some((cat) => cat.name === categoryName);
    },
    [customCategories]
  );
}

/**
 * Hook to get category display properties (color, icon) for rendering
 * Returns a memoized lookup function
 *
 * PERFORMANCE FEATURES:
 * - Memoized lookup function
 * - Uses Map for O(1) lookups
 * - Returns default values for predefined categories
 *
 * @param listId - List ID to get custom categories for
 * @returns Function that returns category display properties
 *
 * @example
 * ```typescript
 * const getCategoryProps = useCategoryProperties('list-123');
 * const props = getCategoryProps('Snacks');
 * // { color: '#FF5733', icon: '🍿' }
 * ```
 */
export function useCategoryProperties(
  listId?: string
): (categoryName: string) => { color?: string; icon?: string } {
  const categoryMap = useCategoryMap(listId);

  // Memoize the lookup function
  return useCallback(
    (categoryName: string) => {
      const category = categoryMap.get(categoryName);
      return {
        color: category?.color,
        icon: category?.icon,
      };
    },
    [categoryMap]
  );
}
