/**
 * Tests for Category Backup and Restore Functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateBackupFile,
  detectConflicts,
  getStoredBackups,
  getListBackups,
  deleteStoredBackup,
  clearAllBackups,
  getAutoBackupConfig,
  setAutoBackupConfig,
  BACKUP_VERSION,
  type CategoryBackup,
  type CustomCategory,
} from '../src/utils/categoryBackup';

describe('Category Backup Validation', () => {
  it('should validate a correct backup file', () => {
    const validBackup: CategoryBackup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      exportTimestamp: Date.now(),
      listId: 'list-123',
      listName: 'Test List',
      categories: [
        {
          name: 'Gluten-Free',
          color: '#FF5733',
          icon: '🌾',
          createdAt: Date.now(),
          itemCount: 5,
        },
      ],
    };

    const result = validateBackupFile(JSON.stringify(validBackup));
    expect(result).not.toBeNull();
    expect(result?.version).toBe(BACKUP_VERSION);
    expect(result?.categories).toHaveLength(1);
  });

  it('should reject invalid JSON', () => {
    const result = validateBackupFile('not valid json');
    expect(result).toBeNull();
  });

  it('should reject backup without required fields', () => {
    const invalidBackup = {
      version: BACKUP_VERSION,
      // Missing listId, listName, categories
    };

    const result = validateBackupFile(JSON.stringify(invalidBackup));
    expect(result).toBeNull();
  });

  it('should reject backup with invalid categories', () => {
    const invalidBackup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      exportTimestamp: Date.now(),
      listId: 'list-123',
      listName: 'Test List',
      categories: [
        {
          // Missing name
          color: '#FF5733',
          icon: '🌾',
        },
      ],
    };

    const result = validateBackupFile(JSON.stringify(invalidBackup));
    expect(result).toBeNull();
  });

  it('should accept backup without optional fields', () => {
    const minimalBackup: CategoryBackup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      exportTimestamp: Date.now(),
      listId: 'list-123',
      listName: 'Test List',
      categories: [
        {
          name: 'Organic',
          createdAt: Date.now(),
        },
      ],
    };

    const result = validateBackupFile(JSON.stringify(minimalBackup));
    expect(result).not.toBeNull();
    expect(result?.categories[0].name).toBe('Organic');
  });
});

describe('Conflict Detection', () => {
  const existingCategories: CustomCategory[] = [
    {
      id: 'cat-1',
      name: 'Gluten-Free',
      listId: 'list-123',
      createdBy: 'user-1',
      color: '#FF5733',
      icon: '🌾',
      displayOrder: 0,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'cat-2',
      name: 'Organic',
      listId: 'list-123',
      createdBy: 'user-1',
      color: '#4CAF50',
      displayOrder: 0,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  it('should detect duplicate category names (case-insensitive)', () => {
    const importedCategories = [
      { name: 'gluten-free', color: '#FF0000' }, // Same name, different case
      { name: 'Vegan', color: '#00FF00' }, // New category
    ];

    const conflicts = detectConflicts(importedCategories, existingCategories);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].importedCategory.name).toBe('gluten-free');
    expect(conflicts[0].existingCategory.name).toBe('Gluten-Free');
    expect(conflicts[0].reason).toBe('duplicate_name');
  });

  it('should not detect conflicts for unique category names', () => {
    const importedCategories = [
      { name: 'Vegan', color: '#00FF00' },
      { name: 'Local', color: '#0000FF' },
    ];

    const conflicts = detectConflicts(importedCategories, existingCategories);

    expect(conflicts).toHaveLength(0);
  });

  it('should handle empty imported categories', () => {
    const conflicts = detectConflicts([], existingCategories);
    expect(conflicts).toHaveLength(0);
  });

  it('should handle empty existing categories', () => {
    const importedCategories = [
      { name: 'Vegan', color: '#00FF00' },
    ];

    const conflicts = detectConflicts(importedCategories, []);
    expect(conflicts).toHaveLength(0);
  });
});

describe('LocalStorage Backup Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should return empty array when no backups exist', () => {
    const backups = getStoredBackups();
    expect(backups).toEqual([]);
  });

  it('should get backups for specific list', () => {
    // Manually add backups to localStorage
    const mockBackups = [
      {
        id: 'backup-1',
        listId: 'list-123',
        listName: 'List 1',
        timestamp: Date.now(),
        categoryCount: 3,
        data: {} as any,
      },
      {
        id: 'backup-2',
        listId: 'list-456',
        listName: 'List 2',
        timestamp: Date.now(),
        categoryCount: 5,
        data: {} as any,
      },
      {
        id: 'backup-3',
        listId: 'list-123',
        listName: 'List 1',
        timestamp: Date.now() - 1000,
        categoryCount: 2,
        data: {} as any,
      },
    ];

    localStorage.setItem('grocery_category_backups', JSON.stringify(mockBackups));

    const list123Backups = getListBackups('list-123');

    expect(list123Backups).toHaveLength(2);
    expect(list123Backups[0].listId).toBe('list-123');
    expect(list123Backups[1].listId).toBe('list-123');
    // Should be sorted by timestamp descending
    expect(list123Backups[0].timestamp).toBeGreaterThan(list123Backups[1].timestamp);
  });

  it('should delete a specific backup', () => {
    const mockBackups = [
      {
        id: 'backup-1',
        listId: 'list-123',
        listName: 'List 1',
        timestamp: Date.now(),
        categoryCount: 3,
        data: {} as any,
      },
      {
        id: 'backup-2',
        listId: 'list-456',
        listName: 'List 2',
        timestamp: Date.now(),
        categoryCount: 5,
        data: {} as any,
      },
    ];

    localStorage.setItem('grocery_category_backups', JSON.stringify(mockBackups));

    deleteStoredBackup('backup-1');

    const remainingBackups = getStoredBackups();
    expect(remainingBackups).toHaveLength(1);
    expect(remainingBackups[0].id).toBe('backup-2');
  });

  it('should clear all backups', () => {
    const mockBackups = [
      {
        id: 'backup-1',
        listId: 'list-123',
        listName: 'List 1',
        timestamp: Date.now(),
        categoryCount: 3,
        data: {} as any,
      },
    ];

    localStorage.setItem('grocery_category_backups', JSON.stringify(mockBackups));

    clearAllBackups();

    const backups = getStoredBackups();
    expect(backups).toEqual([]);
  });
});

describe('Auto Backup Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return default config when none exists', () => {
    const config = getAutoBackupConfig();

    expect(config.enabled).toBe(true);
    expect(config.intervalMinutes).toBe(24 * 60); // 24 hours
    expect(config.maxBackups).toBe(5);
  });

  it('should save and retrieve custom config', () => {
    const customConfig = {
      enabled: false,
      intervalMinutes: 60,
      maxBackups: 10,
    };

    setAutoBackupConfig(customConfig);

    const retrievedConfig = getAutoBackupConfig();
    expect(retrievedConfig).toEqual(customConfig);
  });

  it('should merge partial config updates', () => {
    setAutoBackupConfig({ enabled: false });

    const config = getAutoBackupConfig();
    expect(config.enabled).toBe(false);
    expect(config.maxBackups).toBe(5); // Default value should remain
  });

  it('should handle corrupted config in localStorage', () => {
    localStorage.setItem('grocery_category_auto_backup_config', 'invalid json');

    const config = getAutoBackupConfig();

    // Should return default config
    expect(config.enabled).toBe(true);
    expect(config.maxBackups).toBe(5);
  });
});

describe('Backup File Format', () => {
  it('should include all required metadata', () => {
    const backup: CategoryBackup = {
      version: '1.0',
      exportedAt: '2024-01-15T10:30:00Z',
      exportTimestamp: 1705318200000,
      listId: 'list-123',
      listName: 'My Grocery List',
      categories: [
        {
          name: 'Gluten-Free',
          color: '#FF5733',
          icon: '🌾',
          createdAt: 1234567890,
          itemCount: 5,
        },
      ],
    };

    const json = JSON.stringify(backup);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe('1.0');
    expect(parsed.exportedAt).toBe('2024-01-15T10:30:00Z');
    expect(parsed.listId).toBe('list-123');
    expect(parsed.listName).toBe('My Grocery List');
    expect(parsed.categories).toHaveLength(1);
    expect(parsed.categories[0].name).toBe('Gluten-Free');
  });

  it('should handle categories without optional fields', () => {
    const backup: CategoryBackup = {
      version: '1.0',
      exportedAt: '2024-01-15T10:30:00Z',
      exportTimestamp: 1705318200000,
      listId: 'list-123',
      listName: 'My Grocery List',
      categories: [
        {
          name: 'Basic Category',
          createdAt: 1234567890,
        },
      ],
    };

    const json = JSON.stringify(backup);
    const parsed = JSON.parse(json);

    expect(parsed.categories[0].name).toBe('Basic Category');
    expect(parsed.categories[0].color).toBeUndefined();
    expect(parsed.categories[0].icon).toBeUndefined();
    expect(parsed.categories[0].itemCount).toBeUndefined();
  });
});
