/**
 * Category Activity Logger
 *
 * Helper functions for logging category-related activities to the list_activities table.
 * This module provides a consistent interface for tracking all category operations.
 */

import { ActivityAction } from '../types';

/**
 * Change record for tracking field modifications
 */
export interface CategoryChange {
  field: 'name' | 'color' | 'icon' | 'display_order';
  old_value: string | number;
  new_value: string | number;
}

/**
 * Category activity details structure
 */
export interface CategoryActivityDetails {
  category_id: string;
  category_name: string;
  changes?: CategoryChange[];
  merged_into?: string;
  source_categories?: string[];
}

/**
 * Log a category activity to the server
 *
 * @param listId - The list ID where the category belongs
 * @param action - The activity action type
 * @param details - Details about the category operation
 * @param token - Authentication token
 * @returns Promise that resolves when the activity is logged
 *
 * @example
 * ```typescript
 * // Log category creation
 * await logCategoryActivity(
 *   'list-123',
 *   'category_created',
 *   {
 *     category_id: 'cat-456',
 *     category_name: 'Snacks'
 *   },
 *   authToken
 * );
 *
 * // Log category update with changes
 * await logCategoryActivity(
 *   'list-123',
 *   'category_updated',
 *   {
 *     category_id: 'cat-456',
 *     category_name: 'Healthy Snacks',
 *     changes: [
 *       { field: 'name', old_value: 'Snacks', new_value: 'Healthy Snacks' },
 *       { field: 'color', old_value: '#FF5733', new_value: '#4CAF50' }
 *     ]
 *   },
 *   authToken
 * );
 * ```
 */
export async function logCategoryActivity(
  listId: string,
  action: ActivityAction,
  details: CategoryActivityDetails,
  token: string
): Promise<void> {
  try {
    const response = await fetch(`http://localhost:5001/api/lists/${listId}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action,
        details,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to log activity' }));
      throw new Error(errorData.message || 'Failed to log category activity');
    }
  } catch (error) {
    // Log error but don't throw - activity logging should not break the main operation
    console.error('[categoryActivityLogger] Error logging category activity:', error);
  }
}

/**
 * Create activity details for category creation
 */
export function createCategoryCreatedDetails(
  categoryId: string,
  categoryName: string
): CategoryActivityDetails {
  return {
    category_id: categoryId,
    category_name: categoryName,
  };
}

/**
 * Create activity details for category update
 */
export function createCategoryUpdatedDetails(
  categoryId: string,
  categoryName: string,
  changes: CategoryChange[]
): CategoryActivityDetails {
  return {
    category_id: categoryId,
    category_name: categoryName,
    changes: changes.filter(c => c.old_value !== c.new_value), // Only include actual changes
  };
}

/**
 * Create activity details for category archival
 */
export function createCategoryArchivedDetails(
  categoryId: string,
  categoryName: string
): CategoryActivityDetails {
  return {
    category_id: categoryId,
    category_name: categoryName,
  };
}

/**
 * Create activity details for category restoration
 */
export function createCategoryRestoredDetails(
  categoryId: string,
  categoryName: string
): CategoryActivityDetails {
  return {
    category_id: categoryId,
    category_name: categoryName,
  };
}

/**
 * Create activity details for category deletion
 */
export function createCategoryDeletedDetails(
  categoryId: string,
  categoryName: string
): CategoryActivityDetails {
  return {
    category_id: categoryId,
    category_name: categoryName,
  };
}

/**
 * Create activity details for category merge
 */
export function createCategoryMergedDetails(
  targetCategoryId: string,
  targetCategoryName: string,
  sourceCategoryIds: string[]
): CategoryActivityDetails {
  return {
    category_id: targetCategoryId,
    category_name: targetCategoryName,
    merged_into: targetCategoryId,
    source_categories: sourceCategoryIds,
  };
}

/**
 * Helper to detect changes between old and new category values
 */
export function detectCategoryChanges(
  oldCategory: { name?: string; color?: string; icon?: string; displayOrder?: number },
  newCategory: { name?: string; color?: string; icon?: string; displayOrder?: number }
): CategoryChange[] {
  const changes: CategoryChange[] = [];

  if (newCategory.name !== undefined && oldCategory.name !== newCategory.name) {
    changes.push({
      field: 'name',
      old_value: oldCategory.name || '',
      new_value: newCategory.name,
    });
  }

  if (newCategory.color !== undefined && oldCategory.color !== newCategory.color) {
    changes.push({
      field: 'color',
      old_value: oldCategory.color || '',
      new_value: newCategory.color,
    });
  }

  if (newCategory.icon !== undefined && oldCategory.icon !== newCategory.icon) {
    changes.push({
      field: 'icon',
      old_value: oldCategory.icon || '',
      new_value: newCategory.icon,
    });
  }

  if (newCategory.displayOrder !== undefined && oldCategory.displayOrder !== newCategory.displayOrder) {
    changes.push({
      field: 'display_order',
      old_value: oldCategory.displayOrder ?? 0,
      new_value: newCategory.displayOrder,
    });
  }

  return changes;
}
