import { GroceryItem } from '../types';

/**
 * Represents different types of conflicts that can occur
 */
export type ConflictType = 'field' | 'delete' | 'concurrent_edit';

/**
 * Represents a conflict resolution strategy
 */
export type ConflictResolutionStrategy =
  | 'last-write-wins'
  | 'field-level-merge'
  | 'prefer-local'
  | 'prefer-remote'
  | 'prefer-gotten'
  | 'manual';

/**
 * Represents a field-level conflict
 */
export interface FieldConflict {
  field: keyof GroceryItem;
  localValue: any;
  remoteValue: any;
  localTimestamp?: number;
  remoteTimestamp?: number;
}

/**
 * Represents a conflict between local and remote versions of an item
 */
export interface Conflict {
  id: string;
  type: ConflictType;
  local: GroceryItem;
  remote: GroceryItem;
  fieldConflicts: FieldConflict[];
  detectedAt: number;
  requiresManualResolution: boolean;
}

/**
 * Result of a conflict resolution
 */
export interface ResolutionResult {
  resolved: GroceryItem;
  strategy: ConflictResolutionStrategy;
  manualFieldsRequired?: (keyof GroceryItem)[];
}

/**
 * ConflictResolver class handles offline conflicts in the grocery list app.
 *
 * This utility provides methods to detect conflicts between local and remote
 * versions of grocery items, and resolve them using various strategies.
 *
 * @example
 * ```typescript
 * const resolver = new ConflictResolver();
 *
 * // Detect conflicts
 * const conflict = resolver.detectConflict(localItem, remoteItem);
 *
 * if (conflict) {
 *   // Try auto-resolution first
 *   const resolved = resolver.autoResolve(conflict);
 *
 *   if (resolved) {
 *     // Conflict was auto-resolved
 *     updateItem(resolved);
 *   } else {
 *     // Manual resolution needed
 *     showConflictDialog(conflict);
 *   }
 * }
 * ```
 */
export class ConflictResolver {
  /**
   * Fields that should trigger conflicts if they differ
   */
  private readonly conflictableFields: (keyof GroceryItem)[] = [
    'name',
    'quantity',
    'gotten',
    'category',
    'notes',
  ];

  /**
   * Fields that can be safely merged without user intervention
   */
  private readonly mergableFields: (keyof GroceryItem)[] = [
    'notes',
  ];

  /**
   * Detects if there's a conflict between local and remote versions of an item.
   *
   * A conflict exists if both versions have been modified and have differences
   * in conflictable fields.
   *
   * @param local - The local version of the item
   * @param remote - The remote version of the item
   * @returns Conflict object if conflict detected, null otherwise
   *
   * @example
   * ```typescript
   * const conflict = resolver.detectConflict(
   *   { id: '1', name: 'Milk', quantity: 2, gotten: false, ... },
   *   { id: '1', name: 'Milk', quantity: 3, gotten: true, ... }
   * );
   * // Returns conflict with fieldConflicts for quantity and gotten
   * ```
   */
  detectConflict(local: GroceryItem, remote: GroceryItem): Conflict | null {
    // Validate inputs
    if (!local || !remote) {
      throw new Error('Both local and remote items must be provided');
    }

    if (local.id !== remote.id) {
      throw new Error('Cannot detect conflicts for items with different IDs');
    }

    // Check for field-level conflicts
    const fieldConflicts: FieldConflict[] = [];

    for (const field of this.conflictableFields) {
      if (hasConflict(local[field], remote[field])) {
        fieldConflicts.push({
          field,
          localValue: local[field],
          remoteValue: remote[field],
          localTimestamp: local.createdAt,
          remoteTimestamp: remote.createdAt,
        });
      }
    }

    // No conflicts detected
    if (fieldConflicts.length === 0) {
      return null;
    }

    // Determine if manual resolution is required
    const requiresManualResolution = this.requiresManualResolution(fieldConflicts);

    return {
      id: local.id,
      type: 'concurrent_edit',
      local,
      remote,
      fieldConflicts,
      detectedAt: Date.now(),
      requiresManualResolution,
    };
  }

  /**
   * Resolves a conflict using the specified strategy.
   *
   * @param conflict - The conflict to resolve
   * @param strategy - The resolution strategy to use
   * @returns The resolved GroceryItem
   * @throws Error if manual resolution is required but not provided
   *
   * @example
   * ```typescript
   * const resolved = resolver.resolveConflict(conflict, 'last-write-wins');
   * // Returns the item with the most recent timestamp
   * ```
   */
  resolveConflict(
    conflict: Conflict,
    strategy: ConflictResolutionStrategy
  ): GroceryItem {
    if (!conflict) {
      throw new Error('Conflict must be provided');
    }

    switch (strategy) {
      case 'last-write-wins':
        return this.resolveLastWriteWins(conflict);

      case 'field-level-merge':
        return this.resolveFieldLevelMerge(conflict);

      case 'prefer-local':
        return { ...conflict.local };

      case 'prefer-remote':
        return { ...conflict.remote };

      case 'prefer-gotten':
        return this.resolvePreferGotten(conflict);

      case 'manual':
        throw new Error('Manual resolution requires user input');

      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }
  }

  /**
   * Attempts to automatically resolve a conflict without user intervention.
   *
   * Uses heuristics and custom rules to resolve conflicts when possible:
   * - If one item is marked "gotten" and the other is not, prefer "gotten"
   * - If timestamps differ significantly, use last-write-wins
   * - If only non-critical fields conflict, use field-level merge
   *
   * @param conflict - The conflict to resolve
   * @returns Resolved GroceryItem if auto-resolution is possible, null otherwise
   *
   * @example
   * ```typescript
   * const resolved = resolver.autoResolve(conflict);
   * if (resolved) {
   *   console.log('Auto-resolved:', resolved);
   * } else {
   *   console.log('Manual resolution required');
   * }
   * ```
   */
  autoResolve(conflict: Conflict): GroceryItem | null {
    if (!conflict) {
      return null;
    }

    // Rule 1: Prefer "gotten" state
    // If one item is marked as gotten and the other is not, prefer the gotten state
    // This prevents the frustrating scenario where a user marks an item as gotten
    // but a sync reverts it back to not gotten
    if (conflict.local.gotten !== conflict.remote.gotten) {
      const gottenItem = conflict.local.gotten ? conflict.local : conflict.remote;
      const notGottenItem = conflict.local.gotten ? conflict.remote : conflict.local;

      // Merge other fields from the more recent version
      return this.mergeFields(gottenItem, notGottenItem);
    }

    // Rule 2: If timestamps differ by more than 5 minutes, use last-write-wins
    const timeDiff = Math.abs(conflict.local.createdAt - conflict.remote.createdAt);
    const fiveMinutes = 5 * 60 * 1000;

    if (timeDiff > fiveMinutes) {
      return this.resolveLastWriteWins(conflict);
    }

    // Rule 3: If only mergable fields conflict, use field-level merge
    const nonMergableConflicts = conflict.fieldConflicts.filter(
      fc => !this.mergableFields.includes(fc.field)
    );

    if (nonMergableConflicts.length === 0) {
      return this.resolveFieldLevelMerge(conflict);
    }

    // Rule 4: If quantity increased on both sides, use the higher value
    const quantityConflict = conflict.fieldConflicts.find(fc => fc.field === 'quantity');
    if (quantityConflict &&
        typeof quantityConflict.localValue === 'number' &&
        typeof quantityConflict.remoteValue === 'number') {
      const result = { ...conflict.local };
      result.quantity = Math.max(quantityConflict.localValue, quantityConflict.remoteValue);
      return this.mergeFields(result, conflict.remote);
    }

    // Cannot auto-resolve, manual resolution required
    return null;
  }

  /**
   * Merges non-conflicting fields from both items.
   *
   * For fields that differ, uses timestamp-based selection or custom logic.
   * This method is useful for creating a merged version that takes the best
   * parts of both versions.
   *
   * @param local - The local version of the item
   * @param remote - The remote version of the item
   * @returns Merged GroceryItem
   *
   * @example
   * ```typescript
   * const merged = resolver.mergeFields(
   *   { id: '1', name: 'Milk', quantity: 2, notes: 'Low fat', ... },
   *   { id: '1', name: 'Milk', quantity: 2, notes: 'Organic', ... }
   * );
   * // Intelligently merges fields based on timestamps and rules
   * ```
   */
  mergeFields(local: GroceryItem, remote: GroceryItem): GroceryItem {
    if (!local || !remote) {
      throw new Error('Both local and remote items must be provided');
    }

    const merged: GroceryItem = { ...local };

    // Use the more recent timestamp for most fields
    const useRemote = compareTimestamps(local.createdAt, remote.createdAt) < 0;

    // Merge each field
    for (const field of this.conflictableFields) {
      if (hasConflict(local[field], remote[field])) {
        // Special handling for certain fields
        switch (field) {
          case 'gotten':
            // Always prefer gotten = true
            merged[field] = local[field] || remote[field];
            break;

          case 'quantity':
            // Use the higher quantity
            merged[field] = Math.max(
              local[field] as number,
              remote[field] as number
            );
            break;

          case 'notes':
            // Concatenate notes if both exist
            merged[field] = this.mergeNotes(
              local[field] as string,
              remote[field] as string
            );
            break;

          default:
            // Use timestamp-based selection
            (merged as any)[field] = useRemote ? remote[field] : local[field];
        }
      }
    }

    return merged;
  }

  /**
   * Resolves conflict using Last-Write-Wins strategy.
   * The item with the most recent timestamp wins.
   *
   * @private
   */
  private resolveLastWriteWins(conflict: Conflict): GroceryItem {
    const comparison = compareTimestamps(
      conflict.local.createdAt,
      conflict.remote.createdAt
    );

    if (comparison > 0) {
      return { ...conflict.local };
    } else if (comparison < 0) {
      return { ...conflict.remote };
    } else {
      // Timestamps are equal, prefer remote as tie-breaker
      return { ...conflict.remote };
    }
  }

  /**
   * Resolves conflict using field-level merge strategy.
   * Each field is resolved independently based on timestamps.
   *
   * @private
   */
  private resolveFieldLevelMerge(conflict: Conflict): GroceryItem {
    return this.mergeFields(conflict.local, conflict.remote);
  }

  /**
   * Resolves conflict by preferring the "gotten" state.
   * If one item is gotten, that version wins entirely.
   *
   * @private
   */
  private resolvePreferGotten(conflict: Conflict): GroceryItem {
    if (conflict.local.gotten && !conflict.remote.gotten) {
      return { ...conflict.local };
    } else if (!conflict.local.gotten && conflict.remote.gotten) {
      return { ...conflict.remote };
    } else {
      // Both or neither are gotten, fall back to last-write-wins
      return this.resolveLastWriteWins(conflict);
    }
  }

  /**
   * Merges notes from two items intelligently.
   *
   * @private
   */
  private mergeNotes(localNotes: string, remoteNotes: string): string {
    // Handle empty cases
    if (!localNotes && !remoteNotes) {
      return '';
    }
    if (!localNotes) {
      return remoteNotes;
    }
    if (!remoteNotes) {
      return localNotes;
    }

    // If notes are the same, return one
    if (localNotes === remoteNotes) {
      return localNotes;
    }

    // If one contains the other, return the longer one
    if (localNotes.includes(remoteNotes)) {
      return localNotes;
    }
    if (remoteNotes.includes(localNotes)) {
      return remoteNotes;
    }

    // Concatenate with separator
    return `${localNotes} | ${remoteNotes}`;
  }

  /**
   * Determines if a conflict requires manual resolution.
   *
   * @private
   */
  private requiresManualResolution(fieldConflicts: FieldConflict[]): boolean {
    // Check if critical fields conflict
    const criticalFields: (keyof GroceryItem)[] = ['name', 'category'];

    return fieldConflicts.some(fc => criticalFields.includes(fc.field));
  }
}

/**
 * Compares two timestamps.
 *
 * @param t1 - First timestamp (Unix milliseconds)
 * @param t2 - Second timestamp (Unix milliseconds)
 * @returns Positive if t1 > t2, negative if t1 < t2, zero if equal
 *
 * @example
 * ```typescript
 * const result = compareTimestamps(1000, 2000);
 * // Returns -1000 (t1 is older than t2)
 *
 * const result2 = compareTimestamps(2000, 1000);
 * // Returns 1000 (t1 is newer than t2)
 * ```
 */
export function compareTimestamps(t1: number, t2: number): number {
  if (typeof t1 !== 'number' || typeof t2 !== 'number') {
    throw new Error('Timestamps must be numbers');
  }

  if (isNaN(t1) || isNaN(t2)) {
    throw new Error('Timestamps must be valid numbers');
  }

  return t1 - t2;
}

/**
 * Checks if two values represent a conflict.
 *
 * Values conflict if they are different (using deep equality for objects/arrays).
 * Handles special cases like undefined, null, empty strings, etc.
 *
 * @param local - Local value
 * @param remote - Remote value
 * @returns true if values conflict, false otherwise
 *
 * @example
 * ```typescript
 * hasConflict('apple', 'orange'); // true
 * hasConflict('apple', 'apple');  // false
 * hasConflict(1, 2);              // true
 * hasConflict(null, undefined);   // false (both considered empty)
 * hasConflict('', null);          // false (both considered empty)
 * ```
 */
export function hasConflict(local: any, remote: any): boolean {
  // Handle null/undefined cases
  const localEmpty = local === null || local === undefined || local === '';
  const remoteEmpty = remote === null || remote === undefined || remote === '';

  if (localEmpty && remoteEmpty) {
    return false;
  }

  if (localEmpty || remoteEmpty) {
    return true;
  }

  // Handle primitive types
  if (typeof local !== 'object' || typeof remote !== 'object') {
    return local !== remote;
  }

  // Handle arrays
  if (Array.isArray(local) && Array.isArray(remote)) {
    if (local.length !== remote.length) {
      return true;
    }
    return local.some((item, index) => hasConflict(item, remote[index]));
  }

  // Handle objects
  const localKeys = Object.keys(local);
  const remoteKeys = Object.keys(remote);

  if (localKeys.length !== remoteKeys.length) {
    return true;
  }

  return localKeys.some(key => hasConflict(local[key], remote[key]));
}

/**
 * Logs conflict information to the console for debugging.
 *
 * Provides a formatted view of the conflict including:
 * - Conflict type and ID
 * - Timestamp of detection
 * - Field-level differences
 * - Resolution requirements
 *
 * @param conflict - The conflict to log
 *
 * @example
 * ```typescript
 * const conflict = resolver.detectConflict(local, remote);
 * logConflict(conflict);
 * // Outputs:
 * // === CONFLICT DETECTED ===
 * // ID: abc-123
 * // Type: concurrent_edit
 * // ...
 * ```
 */
export function logConflict(conflict: Conflict): void {
  if (!conflict) {
    console.log('No conflict to log');
    return;
  }

  console.group('=== CONFLICT DETECTED ===');
  console.log(`ID: ${conflict.id}`);
  console.log(`Type: ${conflict.type}`);
  console.log(`Detected at: ${new Date(conflict.detectedAt).toISOString()}`);
  console.log(`Requires manual resolution: ${conflict.requiresManualResolution}`);

  console.group('Field Conflicts:');
  for (const fc of conflict.fieldConflicts) {
    console.group(`Field: ${String(fc.field)}`);
    console.log(`Local value: ${JSON.stringify(fc.localValue)}`);
    console.log(`Remote value: ${JSON.stringify(fc.remoteValue)}`);
    if (fc.localTimestamp && fc.remoteTimestamp) {
      console.log(`Local timestamp: ${new Date(fc.localTimestamp).toISOString()}`);
      console.log(`Remote timestamp: ${new Date(fc.remoteTimestamp).toISOString()}`);
    }
    console.groupEnd();
  }
  console.groupEnd();

  console.group('Full Items:');
  console.log('Local:', conflict.local);
  console.log('Remote:', conflict.remote);
  console.groupEnd();

  console.groupEnd();
}

/**
 * Creates a default ConflictResolver instance for use throughout the app.
 *
 * @example
 * ```typescript
 * import { createConflictResolver } from './utils/conflictResolver';
 *
 * const resolver = createConflictResolver();
 * const conflict = resolver.detectConflict(local, remote);
 * ```
 */
export function createConflictResolver(): ConflictResolver {
  return new ConflictResolver();
}

// =============================================================================
// UNIT TEST EXAMPLES (in comments)
// =============================================================================

/**
 * Example unit tests for ConflictResolver
 *
 * @example
 * ```typescript
 * import { ConflictResolver, hasConflict, compareTimestamps, logConflict } from './conflictResolver';
 * import { GroceryItem } from '../types';
 *
 * describe('ConflictResolver', () => {
 *   let resolver: ConflictResolver;
 *   let baseItem: GroceryItem;
 *
 *   beforeEach(() => {
 *     resolver = new ConflictResolver();
 *     baseItem = {
 *       id: 'item-1',
 *       name: 'Milk',
 *       quantity: 1,
 *       gotten: false,
 *       category: 'Dairy',
 *       notes: '',
 *       userId: 'user-1',
 *       listId: 'list-1',
 *       createdAt: 1000,
 *     };
 *   });
 *
 *   describe('detectConflict', () => {
 *     it('should return null when items are identical', () => {
 *       const conflict = resolver.detectConflict(baseItem, baseItem);
 *       expect(conflict).toBeNull();
 *     });
 *
 *     it('should detect conflict when quantity differs', () => {
 *       const remote = { ...baseItem, quantity: 2 };
 *       const conflict = resolver.detectConflict(baseItem, remote);
 *
 *       expect(conflict).not.toBeNull();
 *       expect(conflict?.fieldConflicts).toHaveLength(1);
 *       expect(conflict?.fieldConflicts[0].field).toBe('quantity');
 *     });
 *
 *     it('should detect conflict when gotten state differs', () => {
 *       const remote = { ...baseItem, gotten: true };
 *       const conflict = resolver.detectConflict(baseItem, remote);
 *
 *       expect(conflict).not.toBeNull();
 *       expect(conflict?.fieldConflicts[0].field).toBe('gotten');
 *     });
 *
 *     it('should detect multiple field conflicts', () => {
 *       const remote = {
 *         ...baseItem,
 *         quantity: 2,
 *         gotten: true,
 *         notes: 'Organic'
 *       };
 *       const conflict = resolver.detectConflict(baseItem, remote);
 *
 *       expect(conflict?.fieldConflicts).toHaveLength(3);
 *     });
 *
 *     it('should throw error for items with different IDs', () => {
 *       const remote = { ...baseItem, id: 'item-2' };
 *       expect(() => resolver.detectConflict(baseItem, remote)).toThrow();
 *     });
 *
 *     it('should mark name conflicts as requiring manual resolution', () => {
 *       const remote = { ...baseItem, name: 'Whole Milk' };
 *       const conflict = resolver.detectConflict(baseItem, remote);
 *
 *       expect(conflict?.requiresManualResolution).toBe(true);
 *     });
 *   });
 *
 *   describe('resolveConflict', () => {
 *     it('should resolve using last-write-wins strategy', () => {
 *       const local = { ...baseItem, quantity: 2, createdAt: 2000 };
 *       const remote = { ...baseItem, quantity: 3, createdAt: 1000 };
 *       const conflict = resolver.detectConflict(local, remote);
 *
 *       const resolved = resolver.resolveConflict(conflict!, 'last-write-wins');
 *       expect(resolved.quantity).toBe(2); // Local is newer
 *     });
 *
 *     it('should resolve using prefer-local strategy', () => {
 *       const local = { ...baseItem, quantity: 2 };
 *       const remote = { ...baseItem, quantity: 3 };
 *       const conflict = resolver.detectConflict(local, remote);
 *
 *       const resolved = resolver.resolveConflict(conflict!, 'prefer-local');
 *       expect(resolved.quantity).toBe(2);
 *     });
 *
 *     it('should resolve using prefer-remote strategy', () => {
 *       const local = { ...baseItem, quantity: 2 };
 *       const remote = { ...baseItem, quantity: 3 };
 *       const conflict = resolver.detectConflict(local, remote);
 *
 *       const resolved = resolver.resolveConflict(conflict!, 'prefer-remote');
 *       expect(resolved.quantity).toBe(3);
 *     });
 *
 *     it('should resolve using prefer-gotten strategy', () => {
 *       const local = { ...baseItem, gotten: true, quantity: 2 };
 *       const remote = { ...baseItem, gotten: false, quantity: 3 };
 *       const conflict = resolver.detectConflict(local, remote);
 *
 *       const resolved = resolver.resolveConflict(conflict!, 'prefer-gotten');
 *       expect(resolved.gotten).toBe(true);
 *       expect(resolved.quantity).toBe(2);
 *     });
 *   });
 *
 *   describe('autoResolve', () => {
 *     it('should auto-resolve when one item is gotten', () => {
 *       const local = { ...baseItem, gotten: false, quantity: 2 };
 *       const remote = { ...baseItem, gotten: true, quantity: 3 };
 *       const conflict = resolver.detectConflict(local, remote);
 *
 *       const resolved = resolver.autoResolve(conflict!);
 *       expect(resolved).not.toBeNull();
 *       expect(resolved?.gotten).toBe(true);
 *     });
 *
 *     it('should auto-resolve when timestamps differ significantly', () => {
 *       const local = { ...baseItem, quantity: 2, createdAt: 1000 };
 *       const remote = { ...baseItem, quantity: 3, createdAt: 1000 + 10 * 60 * 1000 };
 *       const conflict = resolver.detectConflict(local, remote);
 *
 *       const resolved = resolver.autoResolve(conflict!);
 *       expect(resolved).not.toBeNull();
 *       expect(resolved?.quantity).toBe(3); // Remote is newer
 *     });
 *
 *     it('should return null for name conflicts', () => {
 *       const local = { ...baseItem, name: 'Milk' };
 *       const remote = { ...baseItem, name: 'Whole Milk' };
 *       const conflict = resolver.detectConflict(local, remote);
 *
 *       const resolved = resolver.autoResolve(conflict!);
 *       expect(resolved).toBeNull(); // Manual resolution required
 *     });
 *
 *     it('should use higher quantity when both increased', () => {
 *       const local = { ...baseItem, quantity: 3 };
 *       const remote = { ...baseItem, quantity: 5 };
 *       const conflict = resolver.detectConflict(local, remote);
 *
 *       const resolved = resolver.autoResolve(conflict!);
 *       expect(resolved?.quantity).toBe(5);
 *     });
 *   });
 *
 *   describe('mergeFields', () => {
 *     it('should prefer gotten = true', () => {
 *       const local = { ...baseItem, gotten: false };
 *       const remote = { ...baseItem, gotten: true };
 *
 *       const merged = resolver.mergeFields(local, remote);
 *       expect(merged.gotten).toBe(true);
 *     });
 *
 *     it('should use higher quantity', () => {
 *       const local = { ...baseItem, quantity: 2 };
 *       const remote = { ...baseItem, quantity: 5 };
 *
 *       const merged = resolver.mergeFields(local, remote);
 *       expect(merged.quantity).toBe(5);
 *     });
 *
 *     it('should concatenate notes', () => {
 *       const local = { ...baseItem, notes: 'Low fat' };
 *       const remote = { ...baseItem, notes: 'Organic' };
 *
 *       const merged = resolver.mergeFields(local, remote);
 *       expect(merged.notes).toBe('Low fat | Organic');
 *     });
 *
 *     it('should handle empty notes', () => {
 *       const local = { ...baseItem, notes: 'Low fat' };
 *       const remote = { ...baseItem, notes: '' };
 *
 *       const merged = resolver.mergeFields(local, remote);
 *       expect(merged.notes).toBe('Low fat');
 *     });
 *   });
 *
 *   describe('compareTimestamps', () => {
 *     it('should return positive when t1 > t2', () => {
 *       expect(compareTimestamps(2000, 1000)).toBeGreaterThan(0);
 *     });
 *
 *     it('should return negative when t1 < t2', () => {
 *       expect(compareTimestamps(1000, 2000)).toBeLessThan(0);
 *     });
 *
 *     it('should return zero when timestamps are equal', () => {
 *       expect(compareTimestamps(1000, 1000)).toBe(0);
 *     });
 *
 *     it('should throw error for non-numeric timestamps', () => {
 *       expect(() => compareTimestamps(NaN, 1000)).toThrow();
 *       expect(() => compareTimestamps(1000, NaN)).toThrow();
 *     });
 *   });
 *
 *   describe('hasConflict', () => {
 *     it('should return false for identical values', () => {
 *       expect(hasConflict('apple', 'apple')).toBe(false);
 *       expect(hasConflict(1, 1)).toBe(false);
 *       expect(hasConflict(true, true)).toBe(false);
 *     });
 *
 *     it('should return true for different values', () => {
 *       expect(hasConflict('apple', 'orange')).toBe(true);
 *       expect(hasConflict(1, 2)).toBe(true);
 *       expect(hasConflict(true, false)).toBe(true);
 *     });
 *
 *     it('should treat null and undefined as equal', () => {
 *       expect(hasConflict(null, undefined)).toBe(false);
 *       expect(hasConflict(undefined, null)).toBe(false);
 *       expect(hasConflict(null, null)).toBe(false);
 *     });
 *
 *     it('should treat empty string as null/undefined', () => {
 *       expect(hasConflict('', null)).toBe(false);
 *       expect(hasConflict('', undefined)).toBe(false);
 *       expect(hasConflict(null, '')).toBe(false);
 *     });
 *
 *     it('should handle arrays', () => {
 *       expect(hasConflict([1, 2], [1, 2])).toBe(false);
 *       expect(hasConflict([1, 2], [1, 3])).toBe(true);
 *       expect(hasConflict([1], [1, 2])).toBe(true);
 *     });
 *
 *     it('should handle objects', () => {
 *       expect(hasConflict({ a: 1 }, { a: 1 })).toBe(false);
 *       expect(hasConflict({ a: 1 }, { a: 2 })).toBe(true);
 *       expect(hasConflict({ a: 1 }, { a: 1, b: 2 })).toBe(true);
 *     });
 *   });
 *
 *   describe('logConflict', () => {
 *     it('should not throw when logging a conflict', () => {
 *       const conflict = resolver.detectConflict(
 *         { ...baseItem, quantity: 2 },
 *         { ...baseItem, quantity: 3 }
 *       );
 *
 *       expect(() => logConflict(conflict!)).not.toThrow();
 *     });
 *
 *     it('should handle null conflict gracefully', () => {
 *       expect(() => logConflict(null as any)).not.toThrow();
 *     });
 *   });
 * });
 * ```
 */
