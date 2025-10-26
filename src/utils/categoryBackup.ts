/**
 * Custom Category Backup and Restore Utilities
 *
 * Provides comprehensive backup and restore functionality for custom categories:
 * - Export categories to JSON format
 * - Import categories from backup files
 * - Validate backup file format
 * - Handle conflicts (duplicate names)
 * - Automatic periodic backups to localStorage
 * - Backup history management
 *
 * @module utils/categoryBackup
 */

import type { CustomCategory } from '../types';
import { getZeroInstance } from '../zero-store';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Backup file format version
 */
export const BACKUP_VERSION = '1.0';

/**
 * Category backup data structure
 */
export interface CategoryBackup {
  version: string;
  exportedAt: string;
  exportTimestamp: number;
  listId: string;
  listName: string;
  categories: Array<{
    name: string;
    color?: string;
    icon?: string;
    createdAt: number;
    itemCount?: number;
  }>;
}

/**
 * Import conflict resolution strategy
 */
export type ConflictResolution = 'skip' | 'overwrite' | 'rename' | 'merge';

/**
 * Category conflict during import
 */
export interface CategoryConflict {
  existingCategory: CustomCategory;
  importedCategory: {
    name: string;
    color?: string;
    icon?: string;
  };
  reason: 'duplicate_name' | 'same_properties';
}

/**
 * Import result with conflicts and statistics
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  conflicts: CategoryConflict[];
  errors: string[];
  warnings: string[];
  categories: Array<{
    name: string;
    color?: string;
    icon?: string;
  }>;
}

/**
 * Import options for conflict resolution
 */
export interface ImportOptions {
  conflictResolution?: ConflictResolution;
  includeItems?: boolean;
  listId: string;
  listName?: string;
}

/**
 * Automatic backup configuration
 */
export interface AutoBackupConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxBackups: number;
}

/**
 * Stored backup entry
 */
export interface StoredBackup {
  id: string;
  listId: string;
  listName: string;
  timestamp: number;
  categoryCount: number;
  data: CategoryBackup;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BACKUP_STORAGE_KEY = 'grocery_category_backups';
const AUTO_BACKUP_CONFIG_KEY = 'grocery_category_auto_backup_config';
const DEFAULT_MAX_BACKUPS = 5;
const DEFAULT_BACKUP_INTERVAL = 24 * 60; // 24 hours in minutes

// =============================================================================
// EXPORT FUNCTIONS
// =============================================================================

/**
 * Exports custom categories for a list to JSON format
 *
 * @param listId - List ID to export categories from
 * @param includeItems - Whether to include item count for each category
 * @returns JSON string of backup data
 * @throws {Error} If export fails
 *
 * @example
 * ```typescript
 * const json = await exportCategories('list-123', true);
 * // Download or save the JSON
 * ```
 */
export async function exportCategories(
  listId: string,
  includeItems: boolean = false
): Promise<string> {
  if (!listId || listId.trim() === '') {
    throw new Error('List ID is required');
  }

  try {
    const zero = getZeroInstance();

    // Fetch the list name
    const listQuery = await zero.query.lists.where('id', listId).run();
    const list = listQuery[0];

    if (!list) {
      throw new Error('List not found');
    }

    const listName = list.name || 'Unnamed List';

    // Fetch custom categories for the list
    const categoriesQuery = await zero.query.custom_categories
      .where('list_id', listId)
      .run();

    if (categoriesQuery.length === 0) {
      throw new Error('No custom categories found for this list');
    }

    const categories: CustomCategory[] = categoriesQuery.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      listId: cat.list_id,
      createdBy: cat.created_by,
      color: cat.color || undefined,
      icon: cat.icon || undefined,
      displayOrder: cat.display_order ?? 0,
      isArchived: cat.is_archived ?? false,
      archivedAt: cat.archived_at || undefined,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    // Get item counts if requested
    let itemCounts: Record<string, number> = {};
    if (includeItems) {
      const itemsQuery = await zero.query.grocery_items
        .where('list_id', listId)
        .run();

      itemCounts = itemsQuery.reduce((acc: Record<string, number>, item: any) => {
        const categoryId = item.category;
        acc[categoryId] = (acc[categoryId] || 0) + 1;
        return acc;
      }, {});
    }

    // Build backup data
    const now = Date.now();
    const backup: CategoryBackup = {
      version: BACKUP_VERSION,
      exportedAt: new Date(now).toISOString(),
      exportTimestamp: now,
      listId,
      listName,
      categories: categories.map(cat => ({
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        createdAt: cat.createdAt,
        itemCount: includeItems ? (itemCounts[cat.id] || 0) : undefined,
      })),
    };

    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('[categoryBackup] Export failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to export categories'
    );
  }
}

/**
 * Downloads categories as a JSON backup file
 *
 * @param listId - List ID to export
 * @param includeItems - Whether to include item counts
 * @returns Promise that resolves when download starts
 *
 * @example
 * ```typescript
 * await downloadCategoryBackup('list-123', true);
 * // Downloads: categories-my-list-2024-01-15.json
 * ```
 */
export async function downloadCategoryBackup(
  listId: string,
  includeItems: boolean = false
): Promise<void> {
  try {
    const jsonContent = await exportCategories(listId, includeItems);
    const backup = JSON.parse(jsonContent) as CategoryBackup;

    // Generate filename
    const safeName = backup.listName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const date = new Date().toISOString().split('T')[0];
    const fileName = `categories-${safeName}-${date}.json`;

    // Trigger download
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[categoryBackup] Download failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to download backup'
    );
  }
}

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

/**
 * Validates a backup file format
 *
 * @param jsonString - JSON string to validate
 * @returns Parsed backup data or null if invalid
 */
export function validateBackupFile(jsonString: string): CategoryBackup | null {
  try {
    const data = JSON.parse(jsonString);

    // Check required fields
    if (typeof data !== 'object' || data === null) {
      return null;
    }

    if (!data.version || typeof data.version !== 'string') {
      return null;
    }

    if (!data.listId || typeof data.listId !== 'string') {
      return null;
    }

    if (!data.listName || typeof data.listName !== 'string') {
      return null;
    }

    if (!Array.isArray(data.categories)) {
      return null;
    }

    // Validate each category
    for (const cat of data.categories) {
      if (typeof cat !== 'object' || cat === null) {
        return null;
      }
      if (!cat.name || typeof cat.name !== 'string') {
        return null;
      }
      if (cat.color !== undefined && typeof cat.color !== 'string') {
        return null;
      }
      if (cat.icon !== undefined && typeof cat.icon !== 'string') {
        return null;
      }
    }

    return data as CategoryBackup;
  } catch (error) {
    return null;
  }
}

/**
 * Detects conflicts between imported and existing categories
 *
 * @param importedCategories - Categories from backup file
 * @param existingCategories - Current categories in the list
 * @returns Array of conflicts
 */
export function detectConflicts(
  importedCategories: Array<{ name: string; color?: string; icon?: string }>,
  existingCategories: CustomCategory[]
): CategoryConflict[] {
  const conflicts: CategoryConflict[] = [];

  for (const imported of importedCategories) {
    const existing = existingCategories.find(
      cat => cat.name.toLowerCase() === imported.name.toLowerCase()
    );

    if (existing) {
      conflicts.push({
        existingCategory: existing,
        importedCategory: imported,
        reason: 'duplicate_name',
      });
    }
  }

  return conflicts;
}

/**
 * Imports categories from a backup file
 *
 * @param jsonString - JSON backup data
 * @param options - Import options including conflict resolution
 * @returns Import result with statistics and conflicts
 * @throws {Error} If import fails
 *
 * @example
 * ```typescript
 * const result = await importCategories(backupJson, {
 *   listId: 'list-123',
 *   conflictResolution: 'skip'
 * });
 * console.log(`Imported ${result.imported} categories`);
 * ```
 */
export async function importCategories(
  jsonString: string,
  options: ImportOptions
): Promise<ImportResult> {
  const { conflictResolution = 'skip', listId } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  const imported: Array<{ name: string; color?: string; icon?: string }> = [];
  let skipped = 0;

  try {
    // Validate backup file
    const backup = validateBackupFile(jsonString);
    if (!backup) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        conflicts: [],
        errors: ['Invalid backup file format'],
        warnings: [],
        categories: [],
      };
    }

    // Check version compatibility
    if (backup.version !== BACKUP_VERSION) {
      warnings.push(
        `Backup version ${backup.version} may not be fully compatible with current version ${BACKUP_VERSION}`
      );
    }

    // Fetch existing categories
    const zero = getZeroInstance();
    const existingQuery = await zero.query.custom_categories
      .where('list_id', listId)
      .run();

    const existingCategories: CustomCategory[] = existingQuery.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      listId: cat.list_id,
      createdBy: cat.created_by,
      color: cat.color || undefined,
      icon: cat.icon || undefined,
      displayOrder: cat.display_order ?? 0,
      isArchived: cat.is_archived ?? false,
      archivedAt: cat.archived_at || undefined,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    // Detect conflicts
    const conflicts = detectConflicts(backup.categories, existingCategories);

    // Get current user ID
    const currentUserId = (zero as any).userID || 'demo-user';
    if (currentUserId === 'demo-user') {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        conflicts,
        errors: ['User must be authenticated to import categories'],
        warnings: [],
        categories: [],
      };
    }

    // Process each category based on conflict resolution strategy
    for (const category of backup.categories) {
      const conflict = conflicts.find(
        c => c.importedCategory.name.toLowerCase() === category.name.toLowerCase()
      );

      if (conflict) {
        // Handle conflict based on strategy
        switch (conflictResolution) {
          case 'skip':
            skipped++;
            warnings.push(`Skipped "${category.name}" (already exists)`);
            break;

          case 'overwrite':
            try {
              // Update existing category
              await zero.mutate.custom_categories.update({
                id: conflict.existingCategory.id,
                name: category.name.trim(),
                color: category.color || '',
                icon: category.icon || '',
                updatedAt: Date.now(),
              });
              imported.push(category);
              warnings.push(`Overwrote existing category "${category.name}"`);
            } catch (err) {
              errors.push(
                `Failed to overwrite "${category.name}": ${
                  err instanceof Error ? err.message : 'Unknown error'
                }`
              );
            }
            break;

          case 'rename':
            try {
              // Create with new name
              const newName = `${category.name} (Imported)`;
              const id = generateId();
              const now = Date.now();

              await zero.mutate.custom_categories.create({
                id,
                name: newName,
                list_id: listId,
                created_by: currentUserId,
                color: category.color || '',
                icon: category.icon || '',
                display_order: 0,
                is_archived: false,
                archived_at: 0,
                is_locked: false,
                last_edited_by: currentUserId,
                createdAt: now,
                updatedAt: now,
              });

              imported.push({ ...category, name: newName });
              warnings.push(`Renamed "${category.name}" to "${newName}" (duplicate name)`);
            } catch (err) {
              errors.push(
                `Failed to import "${category.name}": ${
                  err instanceof Error ? err.message : 'Unknown error'
                }`
              );
            }
            break;

          case 'merge':
            // Merge means update properties but keep existing
            try {
              const updates: any = {
                id: conflict.existingCategory.id,
                updatedAt: Date.now(),
              };

              // Only update if imported has different values
              if (category.color && category.color !== conflict.existingCategory.color) {
                updates.color = category.color;
              }
              if (category.icon && category.icon !== conflict.existingCategory.icon) {
                updates.icon = category.icon;
              }

              if (updates.color || updates.icon) {
                await zero.mutate.custom_categories.update(updates);
                imported.push(category);
                warnings.push(`Merged properties for "${category.name}"`);
              } else {
                skipped++;
                warnings.push(`Skipped "${category.name}" (no changes to merge)`);
              }
            } catch (err) {
              errors.push(
                `Failed to merge "${category.name}": ${
                  err instanceof Error ? err.message : 'Unknown error'
                }`
              );
            }
            break;
        }
      } else {
        // No conflict, create new category
        try {
          const id = generateId();
          const now = Date.now();

          await zero.mutate.custom_categories.create({
            id,
            name: category.name.trim(),
            list_id: listId,
            created_by: currentUserId,
            color: category.color || '',
            icon: category.icon || '',
            display_order: 0,
            is_archived: false,
            archived_at: 0,
            is_locked: false,
            last_edited_by: currentUserId,
            createdAt: now,
            updatedAt: now,
          });

          imported.push(category);
        } catch (err) {
          errors.push(
            `Failed to import "${category.name}": ${
              err instanceof Error ? err.message : 'Unknown error'
            }`
          );
        }
      }
    }

    return {
      success: imported.length > 0 || (backup.categories.length === 0 && errors.length === 0),
      imported: imported.length,
      skipped,
      conflicts,
      errors,
      warnings,
      categories: imported,
    };
  } catch (error) {
    console.error('[categoryBackup] Import failed:', error);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      conflicts: [],
      errors: [error instanceof Error ? error.message : 'Failed to import categories'],
      warnings: [],
      categories: [],
    };
  }
}

/**
 * Imports categories from a file
 *
 * @param file - File object to import
 * @param options - Import options
 * @returns Import result
 */
export async function importFromFile(
  file: File,
  options: ImportOptions
): Promise<ImportResult> {
  try {
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        conflicts: [],
        errors: ['File is too large (max 5MB)'],
        warnings: [],
        categories: [],
      };
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        conflicts: [],
        errors: ['Invalid file type. Please select a JSON backup file'],
        warnings: [],
        categories: [],
      };
    }

    // Read file content
    const content = await file.text();

    // Import categories
    return await importCategories(content, options);
  } catch (error) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      conflicts: [],
      errors: [error instanceof Error ? error.message : 'Failed to read file'],
      warnings: [],
      categories: [],
    };
  }
}

// =============================================================================
// AUTOMATIC BACKUP FUNCTIONS
// =============================================================================

/**
 * Saves a backup to localStorage
 *
 * @param listId - List ID
 * @param listName - List name
 * @param backup - Backup data
 */
function saveBackupToStorage(listId: string, listName: string, backup: CategoryBackup): void {
  try {
    const backups = getStoredBackups();

    const newBackup: StoredBackup = {
      id: generateId(),
      listId,
      listName,
      timestamp: backup.exportTimestamp,
      categoryCount: backup.categories.length,
      data: backup,
    };

    // Add new backup
    backups.push(newBackup);

    // Get config
    const config = getAutoBackupConfig();

    // Keep only the most recent backups per list
    const listBackups = backups
      .filter(b => b.listId === listId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, config.maxBackups);

    // Keep backups from other lists
    const otherBackups = backups.filter(b => b.listId !== listId);

    // Combine and save
    const finalBackups = [...listBackups, ...otherBackups];
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(finalBackups));
  } catch (error) {
    console.error('[categoryBackup] Failed to save backup to storage:', error);
    // Don't throw - automatic backups should fail silently
  }
}

/**
 * Gets all stored backups from localStorage
 *
 * @returns Array of stored backups
 */
export function getStoredBackups(): StoredBackup[] {
  try {
    const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!stored) return [];

    const backups = JSON.parse(stored);
    return Array.isArray(backups) ? backups : [];
  } catch (error) {
    console.error('[categoryBackup] Failed to get stored backups:', error);
    return [];
  }
}

/**
 * Gets backups for a specific list
 *
 * @param listId - List ID
 * @returns Array of backups for the list
 */
export function getListBackups(listId: string): StoredBackup[] {
  const backups = getStoredBackups();
  return backups
    .filter(b => b.listId === listId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Deletes a stored backup
 *
 * @param backupId - Backup ID to delete
 */
export function deleteStoredBackup(backupId: string): void {
  try {
    const backups = getStoredBackups();
    const filtered = backups.filter(b => b.id !== backupId);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[categoryBackup] Failed to delete backup:', error);
    throw new Error('Failed to delete backup');
  }
}

/**
 * Clears all stored backups
 */
export function clearAllBackups(): void {
  try {
    localStorage.removeItem(BACKUP_STORAGE_KEY);
  } catch (error) {
    console.error('[categoryBackup] Failed to clear backups:', error);
    throw new Error('Failed to clear backups');
  }
}

/**
 * Creates an automatic backup for a list
 *
 * @param listId - List ID
 * @returns Promise that resolves when backup is created
 */
export async function createAutoBackup(listId: string): Promise<void> {
  try {
    const config = getAutoBackupConfig();
    if (!config.enabled) return;

    const jsonContent = await exportCategories(listId, true);
    const backup = JSON.parse(jsonContent) as CategoryBackup;

    saveBackupToStorage(listId, backup.listName, backup);
  } catch (error) {
    console.error('[categoryBackup] Auto backup failed:', error);
    // Don't throw - automatic backups should fail silently
  }
}

/**
 * Gets auto backup configuration
 *
 * @returns Auto backup config
 */
export function getAutoBackupConfig(): AutoBackupConfig {
  try {
    const stored = localStorage.getItem(AUTO_BACKUP_CONFIG_KEY);
    if (!stored) {
      return {
        enabled: true,
        intervalMinutes: DEFAULT_BACKUP_INTERVAL,
        maxBackups: DEFAULT_MAX_BACKUPS,
      };
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('[categoryBackup] Failed to get auto backup config:', error);
    return {
      enabled: true,
      intervalMinutes: DEFAULT_BACKUP_INTERVAL,
      maxBackups: DEFAULT_MAX_BACKUPS,
    };
  }
}

/**
 * Updates auto backup configuration
 *
 * @param config - New config
 */
export function setAutoBackupConfig(config: Partial<AutoBackupConfig>): void {
  try {
    const current = getAutoBackupConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(AUTO_BACKUP_CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[categoryBackup] Failed to update auto backup config:', error);
    throw new Error('Failed to update auto backup configuration');
  }
}

/**
 * Restores categories from a stored backup
 *
 * @param backupId - Backup ID to restore
 * @param options - Import options
 * @returns Import result
 */
export async function restoreFromBackup(
  backupId: string,
  options: Omit<ImportOptions, 'listName'>
): Promise<ImportResult> {
  try {
    const backups = getStoredBackups();
    const backup = backups.find(b => b.id === backupId);

    if (!backup) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        conflicts: [],
        errors: ['Backup not found'],
        warnings: [],
        categories: [],
      };
    }

    const jsonContent = JSON.stringify(backup.data);
    return await importCategories(jsonContent, {
      ...options,
      listName: backup.listName,
    });
  } catch (error) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      conflicts: [],
      errors: [error instanceof Error ? error.message : 'Failed to restore backup'],
      warnings: [],
      categories: [],
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generates a unique ID (simple version)
 */
function generateId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
