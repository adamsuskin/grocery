/**
 * Unit Tests for Category Utilities
 *
 * Tests utility functions for custom categories including:
 * - Category validation
 * - Category fallback behavior
 * - Combining predefined and custom categories
 * - Item category updates on delete
 * - Category migration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isValidCategory,
  getCategoryOrFallback,
  getAllCategories,
  updateItemCategoriesOnDelete,
  getItemCountByCategory,
  validateCategoryName,
  migrateCategoryItems,
} from '../../src/utils/categoryUtils';
import type { CustomCategory } from '../../src/types';
import { CATEGORIES } from '../../src/types';

// =============================================================================
// TEST DATA
// =============================================================================

const mockCustomCategories: CustomCategory[] = [
  {
    id: 'cat-1',
    name: 'Snacks',
    listId: 'list-123',
    createdBy: 'user-1',
    color: '#FF5733',
    icon: '🍿',
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'cat-2',
    name: 'Cleaning',
    listId: 'list-123',
    createdBy: 'user-1',
    color: '#2196F3',
    icon: '🧹',
    createdAt: 2000,
    updatedAt: 2000,
  },
  {
    id: 'cat-3',
    name: 'Pet Supplies',
    listId: 'list-123',
    createdBy: 'user-1',
    createdAt: 3000,
    updatedAt: 3000,
  },
];

// =============================================================================
// TESTS: isValidCategory
// =============================================================================

describe('isValidCategory', () => {
  it('should return true for predefined categories', () => {
    expect(isValidCategory('Produce', [])).toBe(true);
    expect(isValidCategory('Dairy', [])).toBe(true);
    expect(isValidCategory('Meat', [])).toBe(true);
    expect(isValidCategory('Other', [])).toBe(true);
  });

  it('should return true for custom categories', () => {
    expect(isValidCategory('Snacks', mockCustomCategories)).toBe(true);
    expect(isValidCategory('Cleaning', mockCustomCategories)).toBe(true);
    expect(isValidCategory('Pet Supplies', mockCustomCategories)).toBe(true);
  });

  it('should return false for non-existent categories', () => {
    expect(isValidCategory('NonExistent', mockCustomCategories)).toBe(false);
    expect(isValidCategory('', mockCustomCategories)).toBe(false);
    expect(isValidCategory('Random', [])).toBe(false);
  });

  it('should be case-sensitive for predefined categories', () => {
    expect(isValidCategory('produce', [])).toBe(false); // lowercase
    expect(isValidCategory('PRODUCE', [])).toBe(false); // uppercase
  });

  it('should be case-sensitive for custom categories', () => {
    expect(isValidCategory('snacks', mockCustomCategories)).toBe(false);
    expect(isValidCategory('SNACKS', mockCustomCategories)).toBe(false);
  });

  it('should handle empty custom categories array', () => {
    expect(isValidCategory('Produce', [])).toBe(true); // Predefined
    expect(isValidCategory('Snacks', [])).toBe(false); // Custom
  });
});

// =============================================================================
// TESTS: getCategoryOrFallback
// =============================================================================

describe('getCategoryOrFallback', () => {
  it('should return original category if valid predefined', () => {
    expect(getCategoryOrFallback('Produce', [])).toBe('Produce');
    expect(getCategoryOrFallback('Dairy', [])).toBe('Dairy');
    expect(getCategoryOrFallback('Other', [])).toBe('Other');
  });

  it('should return original category if valid custom', () => {
    expect(getCategoryOrFallback('Snacks', mockCustomCategories)).toBe(
      'Snacks'
    );
    expect(getCategoryOrFallback('Cleaning', mockCustomCategories)).toBe(
      'Cleaning'
    );
  });

  it('should return "Other" for invalid categories', () => {
    expect(getCategoryOrFallback('NonExistent', mockCustomCategories)).toBe(
      'Other'
    );
    expect(getCategoryOrFallback('', mockCustomCategories)).toBe('Other');
    expect(getCategoryOrFallback('DeletedCategory', [])).toBe('Other');
  });

  it('should handle deleted custom categories', () => {
    // Category that was previously custom but now deleted
    expect(getCategoryOrFallback('OldCategory', mockCustomCategories)).toBe(
      'Other'
    );
  });
});

// =============================================================================
// TESTS: getAllCategories
// =============================================================================

describe('getAllCategories', () => {
  it('should return only predefined categories when no custom categories exist', () => {
    const result = getAllCategories([]);

    expect(result).toEqual(CATEGORIES);
    expect(result).toHaveLength(CATEGORIES.length);
  });

  it('should combine predefined and custom categories', () => {
    const result = getAllCategories(mockCustomCategories);

    // Should include all predefined categories
    CATEGORIES.forEach((cat) => {
      expect(result).toContain(cat);
    });

    // Should include all custom categories
    expect(result).toContain('Snacks');
    expect(result).toContain('Cleaning');
    expect(result).toContain('Pet Supplies');
  });

  it('should place predefined categories first', () => {
    const result = getAllCategories(mockCustomCategories);

    // First items should be predefined categories
    CATEGORIES.forEach((cat, index) => {
      expect(result[index]).toBe(cat);
    });
  });

  it('should sort custom categories alphabetically', () => {
    const result = getAllCategories(mockCustomCategories);

    // Get custom categories (after predefined ones)
    const customCategoryNames = result.slice(CATEGORIES.length);

    // Should be sorted alphabetically
    expect(customCategoryNames).toEqual(['Cleaning', 'Pet Supplies', 'Snacks']);
  });

  it('should handle custom categories with special characters', () => {
    const specialCategories: CustomCategory[] = [
      {
        id: '1',
        name: 'Café Items',
        listId: 'list-1',
        createdBy: 'user-1',
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: '2',
        name: 'Baby & Kids',
        listId: 'list-1',
        createdBy: 'user-1',
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];

    const result = getAllCategories(specialCategories);

    expect(result).toContain('Baby & Kids');
    expect(result).toContain('Café Items');
  });

  it('should not modify the original CATEGORIES array', () => {
    const originalLength = CATEGORIES.length;
    getAllCategories(mockCustomCategories);

    expect(CATEGORIES).toHaveLength(originalLength);
  });
});

// =============================================================================
// TESTS: validateCategoryName
// =============================================================================

describe('validateCategoryName', () => {
  it('should return error for empty name', () => {
    const result = validateCategoryName('', []);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Category name cannot be empty');
  });

  it('should return error for whitespace-only name', () => {
    const result = validateCategoryName('   ', []);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Category name cannot be empty');
  });

  it('should return error for name exceeding 50 characters', () => {
    const longName = 'A'.repeat(51);
    const result = validateCategoryName(longName, []);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Category name must be 50 characters or less');
  });

  it('should accept name with exactly 50 characters', () => {
    const exactName = 'A'.repeat(50);
    const result = validateCategoryName(exactName, []);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return error for predefined category names', () => {
    const result = validateCategoryName('Produce', []);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('This is a predefined category name');
  });

  it('should return error for predefined names (case-insensitive)', () => {
    expect(validateCategoryName('produce', []).isValid).toBe(false);
    expect(validateCategoryName('PRODUCE', []).isValid).toBe(false);
    expect(validateCategoryName('ProDuCe', []).isValid).toBe(false);
  });

  it('should return error for duplicate custom category names', () => {
    const result = validateCategoryName('Snacks', mockCustomCategories);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('A category with this name already exists');
  });

  it('should return error for duplicate names (case-insensitive)', () => {
    expect(validateCategoryName('snacks', mockCustomCategories).isValid).toBe(
      false
    );
    expect(validateCategoryName('SNACKS', mockCustomCategories).isValid).toBe(
      false
    );
    expect(validateCategoryName('SnAcKs', mockCustomCategories).isValid).toBe(
      false
    );
  });

  it('should allow same name when excluding current category', () => {
    const result = validateCategoryName('Snacks', mockCustomCategories, 'cat-1');

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should still detect duplicates when excluding different category', () => {
    const result = validateCategoryName(
      'Snacks',
      mockCustomCategories,
      'cat-2' // Excluding Cleaning, not Snacks
    );

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('A category with this name already exists');
  });

  it('should accept valid unique name', () => {
    const result = validateCategoryName('New Category', mockCustomCategories);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should trim name before validation', () => {
    const result = validateCategoryName(
      '  Valid Name  ',
      mockCustomCategories
    );

    expect(result.isValid).toBe(true);
  });
});

// =============================================================================
// TESTS: updateItemCategoriesOnDelete
// =============================================================================

describe('updateItemCategoriesOnDelete', () => {
  let mockZero: any;

  beforeEach(() => {
    mockZero = {
      query: {
        grocery_items: {
          where: vi.fn().mockReturnThis(),
          run: vi.fn(),
        },
      },
      mutate: {
        updateGroceryItem: vi.fn(),
      },
    };
  });

  it('should update all items using deleted category to "Other"', async () => {
    const mockItems = [
      { id: 'item-1', category: 'Snacks', list_id: 'list-123' },
      { id: 'item-2', category: 'Snacks', list_id: 'list-123' },
      { id: 'item-3', category: 'Snacks', list_id: 'list-123' },
    ];

    mockZero.query.grocery_items.run.mockResolvedValue(mockItems);
    mockZero.mutate.updateGroceryItem.mockResolvedValue(undefined);

    await updateItemCategoriesOnDelete('Snacks', 'list-123', mockZero);

    expect(mockZero.mutate.updateGroceryItem).toHaveBeenCalledTimes(3);
    expect(mockZero.mutate.updateGroceryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-1',
        category: 'Other',
      })
    );
  });

  it('should not update items if category has no items', async () => {
    mockZero.query.grocery_items.run.mockResolvedValue([]);

    await updateItemCategoriesOnDelete('Snacks', 'list-123', mockZero);

    expect(mockZero.mutate.updateGroceryItem).not.toHaveBeenCalled();
  });

  it('should filter items by list ID', async () => {
    const mockItems = [{ id: 'item-1', category: 'Snacks', list_id: 'list-123' }];

    mockZero.query.grocery_items.run.mockResolvedValue(mockItems);
    mockZero.mutate.updateGroceryItem.mockResolvedValue(undefined);

    await updateItemCategoriesOnDelete('Snacks', 'list-123', mockZero);

    expect(mockZero.query.grocery_items.where).toHaveBeenCalledWith(
      'list_id',
      'list-123'
    );
    expect(mockZero.query.grocery_items.where).toHaveBeenCalledWith(
      'category',
      'Snacks'
    );
  });

  it('should include updatedAt timestamp in updates', async () => {
    const mockItems = [{ id: 'item-1', category: 'Snacks', list_id: 'list-123' }];

    mockZero.query.grocery_items.run.mockResolvedValue(mockItems);
    mockZero.mutate.updateGroceryItem.mockResolvedValue(undefined);

    const beforeTime = Date.now();
    await updateItemCategoriesOnDelete('Snacks', 'list-123', mockZero);
    const afterTime = Date.now();

    const call = mockZero.mutate.updateGroceryItem.mock.calls[0][0];
    expect(call.updatedAt).toBeGreaterThanOrEqual(beforeTime);
    expect(call.updatedAt).toBeLessThanOrEqual(afterTime);
  });

  it('should handle errors gracefully', async () => {
    mockZero.query.grocery_items.run.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      updateItemCategoriesOnDelete('Snacks', 'list-123', mockZero)
    ).rejects.toThrow('Failed to update items when deleting category');
  });

  it('should handle partial update failures', async () => {
    const mockItems = [
      { id: 'item-1', category: 'Snacks' },
      { id: 'item-2', category: 'Snacks' },
    ];

    mockZero.query.grocery_items.run.mockResolvedValue(mockItems);
    mockZero.mutate.updateGroceryItem
      .mockResolvedValueOnce(undefined) // First succeeds
      .mockRejectedValueOnce(new Error('Update failed')); // Second fails

    await expect(
      updateItemCategoriesOnDelete('Snacks', 'list-123', mockZero)
    ).rejects.toThrow();
  });
});

// =============================================================================
// TESTS: getItemCountByCategory
// =============================================================================

describe('getItemCountByCategory', () => {
  let mockZero: any;

  beforeEach(() => {
    mockZero = {
      query: {
        grocery_items: {
          where: vi.fn().mockReturnThis(),
          run: vi.fn(),
        },
      },
    };
  });

  it('should return count of items in category', async () => {
    const mockItems = [
      { id: 'item-1', category: 'Snacks' },
      { id: 'item-2', category: 'Snacks' },
      { id: 'item-3', category: 'Snacks' },
    ];

    mockZero.query.grocery_items.run.mockResolvedValue(mockItems);

    const count = await getItemCountByCategory('Snacks', 'list-123', mockZero);

    expect(count).toBe(3);
  });

  it('should return 0 for category with no items', async () => {
    mockZero.query.grocery_items.run.mockResolvedValue([]);

    const count = await getItemCountByCategory('Snacks', 'list-123', mockZero);

    expect(count).toBe(0);
  });

  it('should filter by list ID and category', async () => {
    mockZero.query.grocery_items.run.mockResolvedValue([]);

    await getItemCountByCategory('Snacks', 'list-123', mockZero);

    expect(mockZero.query.grocery_items.where).toHaveBeenCalledWith(
      'list_id',
      'list-123'
    );
    expect(mockZero.query.grocery_items.where).toHaveBeenCalledWith(
      'category',
      'Snacks'
    );
  });

  it('should return 0 on error', async () => {
    mockZero.query.grocery_items.run.mockRejectedValue(
      new Error('Database error')
    );

    const count = await getItemCountByCategory('Snacks', 'list-123', mockZero);

    expect(count).toBe(0);
  });
});

// =============================================================================
// TESTS: migrateCategoryItems
// =============================================================================

describe('migrateCategoryItems', () => {
  let mockZero: any;

  beforeEach(() => {
    mockZero = {
      query: {
        grocery_items: {
          where: vi.fn().mockReturnThis(),
          run: vi.fn(),
        },
      },
      mutate: {
        updateGroceryItem: vi.fn(),
      },
    };
  });

  it('should migrate all items from one category to another', async () => {
    const mockItems = [
      { id: 'item-1', category: 'Snacks' },
      { id: 'item-2', category: 'Snacks' },
    ];

    mockZero.query.grocery_items.run.mockResolvedValue(mockItems);
    mockZero.mutate.updateGroceryItem.mockResolvedValue(undefined);

    const count = await migrateCategoryItems(
      'Snacks',
      'Pantry',
      'list-123',
      mockZero
    );

    expect(count).toBe(2);
    expect(mockZero.mutate.updateGroceryItem).toHaveBeenCalledTimes(2);
    expect(mockZero.mutate.updateGroceryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-1',
        category: 'Pantry',
      })
    );
    expect(mockZero.mutate.updateGroceryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-2',
        category: 'Pantry',
      })
    );
  });

  it('should return 0 if no items to migrate', async () => {
    mockZero.query.grocery_items.run.mockResolvedValue([]);

    const count = await migrateCategoryItems(
      'Snacks',
      'Pantry',
      'list-123',
      mockZero
    );

    expect(count).toBe(0);
    expect(mockZero.mutate.updateGroceryItem).not.toHaveBeenCalled();
  });

  it('should filter by source category and list ID', async () => {
    mockZero.query.grocery_items.run.mockResolvedValue([]);

    await migrateCategoryItems('Snacks', 'Pantry', 'list-123', mockZero);

    expect(mockZero.query.grocery_items.where).toHaveBeenCalledWith(
      'list_id',
      'list-123'
    );
    expect(mockZero.query.grocery_items.where).toHaveBeenCalledWith(
      'category',
      'Snacks'
    );
  });

  it('should include updatedAt timestamp in migrations', async () => {
    const mockItems = [{ id: 'item-1', category: 'Snacks' }];

    mockZero.query.grocery_items.run.mockResolvedValue(mockItems);
    mockZero.mutate.updateGroceryItem.mockResolvedValue(undefined);

    const beforeTime = Date.now();
    await migrateCategoryItems('Snacks', 'Pantry', 'list-123', mockZero);
    const afterTime = Date.now();

    const call = mockZero.mutate.updateGroceryItem.mock.calls[0][0];
    expect(call.updatedAt).toBeGreaterThanOrEqual(beforeTime);
    expect(call.updatedAt).toBeLessThanOrEqual(afterTime);
  });

  it('should handle migration errors', async () => {
    mockZero.query.grocery_items.run.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      migrateCategoryItems('Snacks', 'Pantry', 'list-123', mockZero)
    ).rejects.toThrow('Failed to migrate items');
  });

  it('should work with custom categories as source and target', async () => {
    const mockItems = [{ id: 'item-1', category: 'Old Custom' }];

    mockZero.query.grocery_items.run.mockResolvedValue(mockItems);
    mockZero.mutate.updateGroceryItem.mockResolvedValue(undefined);

    const count = await migrateCategoryItems(
      'Old Custom',
      'New Custom',
      'list-123',
      mockZero
    );

    expect(count).toBe(1);
    expect(mockZero.mutate.updateGroceryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'New Custom',
      })
    );
  });
});
