/**
 * Unit Tests for useCustomCategories Hook
 *
 * Tests the custom category hooks including:
 * - Querying custom categories
 * - Creating custom categories
 * - Updating custom categories
 * - Deleting custom categories
 * - Permission checks
 * - Validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useCustomCategories,
  useCustomCategoryMutations,
} from '../../src/hooks/useCustomCategories';
import type { CustomCategory } from '../../src/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock Zero instance
const mockZero = {
  userID: 'test-user-123',
  query: {
    custom_categories: {
      where: vi.fn().mockReturnThis(),
      run: vi.fn(),
    },
    lists: {
      where: vi.fn().mockReturnThis(),
      run: vi.fn(),
    },
    list_members: {
      where: vi.fn().mockReturnThis(),
      run: vi.fn(),
    },
  },
  mutate: {
    custom_categories: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
};

// Mock getZeroInstance
vi.mock('../../src/zero-store', () => ({
  getZeroInstance: () => mockZero,
}));

// Mock useQuery hook
const mockUseQuery = vi.fn();
vi.mock('@rocicorp/zero/react', () => ({
  useQuery: (query: any) => mockUseQuery(query),
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));

// =============================================================================
// TEST DATA
// =============================================================================

const mockCategories: CustomCategory[] = [
  {
    id: 'cat-1',
    name: 'Snacks',
    listId: 'list-123',
    createdBy: 'test-user-123',
    color: '#FF5733',
    icon: '🍿',
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'cat-2',
    name: 'Cleaning',
    listId: 'list-123',
    createdBy: 'test-user-123',
    color: '#2196F3',
    icon: '🧹',
    createdAt: 2000,
    updatedAt: 2000,
  },
  {
    id: 'cat-3',
    name: 'Pet Supplies',
    listId: 'list-456',
    createdBy: 'test-user-456',
    createdAt: 3000,
    updatedAt: 3000,
  },
];

const mockDatabaseCategories = mockCategories.map((cat) => ({
  id: cat.id,
  name: cat.name,
  list_id: cat.listId,
  created_by: cat.createdBy,
  color: cat.color || '',
  icon: cat.icon || '',
  createdAt: cat.createdAt,
  updatedAt: cat.updatedAt,
}));

// =============================================================================
// TESTS: useCustomCategories Hook
// =============================================================================

describe('useCustomCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no categories exist', () => {
    mockUseQuery.mockReturnValue([]);

    const { result } = renderHook(() => useCustomCategories('list-123'));

    expect(result.current).toEqual([]);
  });

  it('should return all categories for a list', () => {
    const listCategories = mockDatabaseCategories.filter(
      (cat) => cat.list_id === 'list-123'
    );
    mockUseQuery.mockReturnValue(listCategories);

    const { result } = renderHook(() => useCustomCategories('list-123'));

    expect(result.current).toHaveLength(2);
    expect(result.current[0].name).toBe('Snacks');
    expect(result.current[1].name).toBe('Cleaning');
  });

  it('should transform database format to application format', () => {
    mockUseQuery.mockReturnValue([mockDatabaseCategories[0]]);

    const { result } = renderHook(() => useCustomCategories('list-123'));

    const category = result.current[0];
    expect(category).toHaveProperty('listId', 'list-123');
    expect(category).toHaveProperty('createdBy', 'test-user-123');
    expect(category).not.toHaveProperty('list_id');
    expect(category).not.toHaveProperty('created_by');
  });

  it('should sort categories by creation date (oldest first)', () => {
    const listCategories = mockDatabaseCategories.filter(
      (cat) => cat.list_id === 'list-123'
    );
    // Return in reverse order
    mockUseQuery.mockReturnValue([listCategories[1], listCategories[0]]);

    const { result } = renderHook(() => useCustomCategories('list-123'));

    expect(result.current[0].name).toBe('Snacks'); // createdAt: 1000
    expect(result.current[1].name).toBe('Cleaning'); // createdAt: 2000
  });

  it('should handle optional color and icon fields', () => {
    const categoryWithoutOptionals = {
      id: 'cat-4',
      name: 'Test',
      list_id: 'list-123',
      created_by: 'test-user-123',
      color: '',
      icon: '',
      createdAt: 4000,
      updatedAt: 4000,
    };
    mockUseQuery.mockReturnValue([categoryWithoutOptionals]);

    const { result } = renderHook(() => useCustomCategories('list-123'));

    expect(result.current[0].color).toBeUndefined();
    expect(result.current[0].icon).toBeUndefined();
  });

  it('should filter categories by list ID when provided', () => {
    mockUseQuery.mockReturnValue(
      mockDatabaseCategories.filter((cat) => cat.list_id === 'list-456')
    );

    const { result } = renderHook(() => useCustomCategories('list-456'));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Pet Supplies');
  });

  it('should return all categories when list ID is not provided', () => {
    mockUseQuery.mockReturnValue(mockDatabaseCategories);

    const { result } = renderHook(() => useCustomCategories());

    expect(result.current).toHaveLength(3);
  });
});

// =============================================================================
// TESTS: useCustomCategoryMutations - addCustomCategory
// =============================================================================

describe('useCustomCategoryMutations - addCustomCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZero.userID = 'test-user-123';
    mockZero.query.custom_categories.run.mockResolvedValue([]);
    mockZero.mutate.custom_categories.create.mockResolvedValue(undefined);
  });

  it('should create a new custom category', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await result.current.addCustomCategory({
      name: 'Spices',
      listId: 'list-123',
      color: '#FF5733',
      icon: '🌶️',
    });

    expect(mockZero.mutate.custom_categories.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Spices',
        list_id: 'list-123',
        created_by: 'test-user-123',
        color: '#FF5733',
        icon: '🌶️',
      })
    );
  });

  it('should trim category name', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await result.current.addCustomCategory({
      name: '  Spices  ',
      listId: 'list-123',
    });

    expect(mockZero.mutate.custom_categories.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Spices',
      })
    );
  });

  it('should use empty string for undefined color and icon', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await result.current.addCustomCategory({
      name: 'Spices',
      listId: 'list-123',
    });

    expect(mockZero.mutate.custom_categories.create).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '',
        icon: '',
      })
    );
  });

  it('should throw error if user is not authenticated', async () => {
    mockZero.userID = 'demo-user';
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory({
        name: 'Spices',
        listId: 'list-123',
      })
    ).rejects.toThrow('User must be authenticated');
  });

  it('should throw error if list ID is empty', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory({
        name: 'Spices',
        listId: '',
      })
    ).rejects.toThrow('List ID is required');
  });

  it('should throw error if category name is empty', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory({
        name: '',
        listId: 'list-123',
      })
    ).rejects.toThrow('Category name cannot be empty');
  });

  it('should throw error if category name conflicts with predefined category', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory({
        name: 'Produce',
        listId: 'list-123',
      })
    ).rejects.toThrow('Cannot use predefined category names');
  });

  it('should throw error if category name is duplicate (case-insensitive)', async () => {
    mockZero.query.custom_categories.run.mockResolvedValue([
      mockDatabaseCategories[0],
    ]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory({
        name: 'snacks', // lowercase version of 'Snacks'
        listId: 'list-123',
      })
    ).rejects.toThrow('A category with this name already exists');
  });

  it('should validate color format', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory({
        name: 'Spices',
        listId: 'list-123',
        color: 'invalid-color',
      })
    ).rejects.toThrow('Color must be a valid hex code');
  });

  it('should validate icon length', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory({
        name: 'Spices',
        listId: 'list-123',
        icon: 'A'.repeat(11), // Too long
      })
    ).rejects.toThrow('Icon must be between 1 and 10 characters');
  });

  it('should accept existing categories for validation', async () => {
    const existingCategories: CustomCategory[] = [
      {
        id: 'cat-1',
        name: 'Snacks',
        listId: 'list-123',
        createdBy: 'test-user-123',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory(
        {
          name: 'Snacks',
          listId: 'list-123',
        },
        existingCategories
      )
    ).rejects.toThrow('A category with this name already exists');

    // Should not query database when existingCategories provided
    expect(mockZero.query.custom_categories.run).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    mockZero.mutate.custom_categories.create.mockRejectedValue(
      new Error('Database error')
    );

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory({
        name: 'Spices',
        listId: 'list-123',
      })
    ).rejects.toThrow('Failed to create custom category');
  });

  it('should provide specific error for unique constraint violations', async () => {
    mockZero.mutate.custom_categories.create.mockRejectedValue(
      new Error('unique constraint violation')
    );

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.addCustomCategory({
        name: 'Spices',
        listId: 'list-123',
      })
    ).rejects.toThrow('A category with this name already exists');
  });
});

// =============================================================================
// TESTS: useCustomCategoryMutations - updateCustomCategory
// =============================================================================

describe('useCustomCategoryMutations - updateCustomCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZero.userID = 'test-user-123';
    mockZero.query.custom_categories.run.mockResolvedValue([
      mockDatabaseCategories[0],
    ]);
    mockZero.query.lists.run.mockResolvedValue([
      { id: 'list-123', owner_id: 'test-user-123' },
    ]);
    mockZero.mutate.custom_categories.update.mockResolvedValue(undefined);
  });

  it('should update category name', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await result.current.updateCustomCategory({
      id: 'cat-1',
      name: 'Healthy Snacks',
    });

    expect(mockZero.mutate.custom_categories.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cat-1',
        name: 'Healthy Snacks',
      })
    );
  });

  it('should update category color', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await result.current.updateCustomCategory({
      id: 'cat-1',
      color: '#4CAF50',
    });

    expect(mockZero.mutate.custom_categories.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cat-1',
        color: '#4CAF50',
      })
    );
  });

  it('should update category icon', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await result.current.updateCustomCategory({
      id: 'cat-1',
      icon: '🥜',
    });

    expect(mockZero.mutate.custom_categories.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cat-1',
        icon: '🥜',
      })
    );
  });

  it('should update multiple fields at once', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await result.current.updateCustomCategory({
      id: 'cat-1',
      name: 'Healthy Snacks',
      color: '#4CAF50',
      icon: '🥜',
    });

    expect(mockZero.mutate.custom_categories.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cat-1',
        name: 'Healthy Snacks',
        color: '#4CAF50',
        icon: '🥜',
      })
    );
  });

  it('should trim updated category name', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await result.current.updateCustomCategory({
      id: 'cat-1',
      name: '  Healthy Snacks  ',
    });

    expect(mockZero.mutate.custom_categories.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Healthy Snacks',
      })
    );
  });

  it('should throw error if user is not authenticated', async () => {
    mockZero.userID = 'demo-user';
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
        name: 'Updated',
      })
    ).rejects.toThrow('User must be authenticated');
  });

  it('should throw error if category ID is empty', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: '',
        name: 'Updated',
      })
    ).rejects.toThrow('Category ID is required');
  });

  it('should throw error if no fields are provided for update', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
      })
    ).rejects.toThrow('At least one field must be provided for update');
  });

  it('should throw error if category not found', async () => {
    mockZero.query.custom_categories.run.mockResolvedValue([]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: 'non-existent',
        name: 'Updated',
      })
    ).rejects.toThrow('Category not found');
  });

  it('should check edit permission for list owner', async () => {
    mockZero.query.lists.run.mockResolvedValue([
      { id: 'list-123', owner_id: 'test-user-123' },
    ]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
        name: 'Updated',
      })
    ).resolves.not.toThrow();
  });

  it('should check edit permission for editor', async () => {
    mockZero.query.lists.run.mockResolvedValue([
      { id: 'list-123', owner_id: 'other-user' },
    ]);
    mockZero.query.list_members.run.mockResolvedValue([
      {
        list_id: 'list-123',
        user_id: 'test-user-123',
        permission: 'editor',
      },
    ]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
        name: 'Updated',
      })
    ).resolves.not.toThrow();
  });

  it('should deny update for viewer permission', async () => {
    mockZero.query.lists.run.mockResolvedValue([
      { id: 'list-123', owner_id: 'other-user' },
    ]);
    mockZero.query.list_members.run.mockResolvedValue([
      {
        list_id: 'list-123',
        user_id: 'test-user-123',
        permission: 'viewer',
      },
    ]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
        name: 'Updated',
      })
    ).rejects.toThrow('You do not have permission to edit categories');
  });

  it('should validate updated name against predefined categories', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
        name: 'Produce',
      })
    ).rejects.toThrow('Cannot use predefined category names');
  });

  it('should validate updated name for duplicates (excluding self)', async () => {
    mockZero.query.custom_categories.run.mockResolvedValue([
      mockDatabaseCategories[0],
      mockDatabaseCategories[1],
    ]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    // Should allow keeping the same name
    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
        name: 'Snacks',
      })
    ).resolves.not.toThrow();

    // Should reject duplicate with other category
    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
        name: 'Cleaning',
      })
    ).rejects.toThrow('A category with this name already exists');
  });

  it('should validate color format when updating', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
        color: 'invalid',
      })
    ).rejects.toThrow('Color must be a valid hex code');
  });

  it('should validate icon length when updating', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.updateCustomCategory({
        id: 'cat-1',
        icon: 'A'.repeat(11),
      })
    ).rejects.toThrow('Icon must be between 1 and 10 characters');
  });
});

// =============================================================================
// TESTS: useCustomCategoryMutations - deleteCustomCategory
// =============================================================================

describe('useCustomCategoryMutations - deleteCustomCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZero.userID = 'test-user-123';
    mockZero.query.custom_categories.run.mockResolvedValue([
      mockDatabaseCategories[0],
    ]);
    mockZero.query.lists.run.mockResolvedValue([
      { id: 'list-123', owner_id: 'test-user-123' },
    ]);
    mockZero.mutate.custom_categories.delete.mockResolvedValue(undefined);
  });

  it('should delete a custom category', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await result.current.deleteCustomCategory('cat-1');

    expect(mockZero.mutate.custom_categories.delete).toHaveBeenCalledWith({
      id: 'cat-1',
    });
  });

  it('should throw error if user is not authenticated', async () => {
    mockZero.userID = 'demo-user';
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.deleteCustomCategory('cat-1')
    ).rejects.toThrow('User must be authenticated');
  });

  it('should throw error if category ID is empty', async () => {
    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(result.current.deleteCustomCategory('')).rejects.toThrow(
      'Category ID is required'
    );
  });

  it('should throw error if category not found', async () => {
    mockZero.query.custom_categories.run.mockResolvedValue([]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.deleteCustomCategory('non-existent')
    ).rejects.toThrow('Category not found');
  });

  it('should check delete permission for list owner', async () => {
    mockZero.query.lists.run.mockResolvedValue([
      { id: 'list-123', owner_id: 'test-user-123' },
    ]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.deleteCustomCategory('cat-1')
    ).resolves.not.toThrow();
  });

  it('should check delete permission for editor', async () => {
    mockZero.query.lists.run.mockResolvedValue([
      { id: 'list-123', owner_id: 'other-user' },
    ]);
    mockZero.query.list_members.run.mockResolvedValue([
      {
        list_id: 'list-123',
        user_id: 'test-user-123',
        permission: 'editor',
      },
    ]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.deleteCustomCategory('cat-1')
    ).resolves.not.toThrow();
  });

  it('should deny delete for viewer permission', async () => {
    mockZero.query.lists.run.mockResolvedValue([
      { id: 'list-123', owner_id: 'other-user' },
    ]);
    mockZero.query.list_members.run.mockResolvedValue([
      {
        list_id: 'list-123',
        user_id: 'test-user-123',
        permission: 'viewer',
      },
    ]);

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.deleteCustomCategory('cat-1')
    ).rejects.toThrow('You do not have permission to delete categories');
  });

  it('should handle database errors gracefully', async () => {
    mockZero.mutate.custom_categories.delete.mockRejectedValue(
      new Error('Database error')
    );

    const { result } = renderHook(() => useCustomCategoryMutations());

    await expect(
      result.current.deleteCustomCategory('cat-1')
    ).rejects.toThrow('Failed to delete custom category');
  });
});
