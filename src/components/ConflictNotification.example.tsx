/**
 * ConflictNotification Integration Examples
 *
 * This file demonstrates how to integrate the ConflictNotification component
 * with the existing NotificationContext and use it in your application.
 */

import { useState } from 'react';
import { ConflictNotifications } from './ConflictNotification';
import type { Conflict, ConflictResolution } from '../types';
import { nanoid } from 'nanoid';

/**
 * Example 1: Basic Usage
 * Simple example showing how to display a single conflict notification
 */
export function BasicConflictExample() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  // Simulate a conflict detection
  const simulateConflict = () => {
    const conflict: Conflict = {
      id: nanoid(),
      type: 'concurrent_edit',
      itemId: 'item-123',
      itemName: 'Milk',
      listId: 'list-456',
      localVersion: {
        value: {
          name: 'Milk',
          quantity: 2,
          gotten: false,
          category: 'Dairy',
        },
        changes: [
          {
            field: 'quantity',
            oldValue: 1,
            newValue: 2,
          },
        ],
        timestamp: Date.now() - 5000,
        userId: 'user-local',
        userName: 'You',
      },
      remoteVersion: {
        value: {
          name: 'Milk',
          quantity: 3,
          gotten: true,
          category: 'Dairy',
        },
        changes: [
          {
            field: 'quantity',
            oldValue: 1,
            newValue: 3,
          },
          {
            field: 'gotten',
            oldValue: false,
            newValue: true,
          },
        ],
        timestamp: Date.now() - 3000,
        userId: 'user-remote',
        userName: 'Alice',
      },
      timestamp: Date.now(),
      priority: 1,
      autoResolvable: false,
    };

    setConflicts(prev => [...prev, conflict]);
  };

  const handleResolve = (conflictId: string, resolution: ConflictResolution) => {
    console.log(`Resolving conflict ${conflictId} with strategy: ${resolution}`);

    // Remove the conflict from the list
    setConflicts(prev => prev.filter(c => c.id !== conflictId));

    // Apply the resolution strategy
    switch (resolution) {
      case 'mine':
        console.log('Applying local version...');
        // Apply localVersion.value to the store
        break;
      case 'theirs':
        console.log('Applying remote version...');
        // Apply remoteVersion.value to the store
        break;
      case 'manual':
        console.log('Opening manual merge dialog...');
        // Open a dialog for manual conflict resolution
        break;
    }
  };

  const handleDismiss = (conflictId: string) => {
    console.log(`Dismissing conflict ${conflictId}`);
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  };

  return (
    <div>
      <button onClick={simulateConflict}>Simulate Conflict</button>

      <ConflictNotifications
        conflicts={conflicts}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
        position="top-right"
        maxVisible={3}
      />
    </div>
  );
}

/**
 * Example 2: Integration with NotificationContext
 * Extend the NotificationContext to support conflict notifications
 */

// Add to NotificationContext.tsx:
/*
import type { Conflict } from '../types';

export interface NotificationContextValue {
  // ... existing properties
  conflicts: Conflict[];
  addConflict: (conflict: Conflict) => void;
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => void;
  dismissConflict: (conflictId: string) => void;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const addConflict = useCallback((conflict: Conflict) => {
    setConflicts(prev => [...prev, conflict]);
  }, []);

  const resolveConflict = useCallback((conflictId: string, resolution: ConflictResolution) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    // Apply resolution strategy
    applyConflictResolution(conflict, resolution);

    // Remove conflict
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, [conflicts]);

  const dismissConflict = useCallback((conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, []);

  return (
    <NotificationContext.Provider value={{
      // ... existing values
      conflicts,
      addConflict,
      resolveConflict,
      dismissConflict,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
*/

/**
 * Example 3: Conflict Detection with Zero
 * Monitor Zero sync status and detect conflicts
 */

// Add to your Zero store integration:
/*
import { useQuery } from '@rocicorp/zero/react';
import { getZeroInstance } from '../zero-store';

export function useConflictDetection(listId: string) {
  const { addConflict } = useNotification();
  const zero = getZeroInstance();

  // Monitor sync status
  useEffect(() => {
    const handleSyncConflict = (event: any) => {
      const { localVersion, remoteVersion, itemId } = event;

      // Detect conflicts
      const hasConflict = detectConflict(localVersion, remoteVersion);

      if (hasConflict) {
        const conflict: Conflict = {
          id: nanoid(),
          type: determineConflictType(localVersion, remoteVersion),
          itemId,
          itemName: localVersion.name || remoteVersion.name,
          listId,
          localVersion: {
            value: localVersion,
            changes: getChanges(localVersion, remoteVersion),
            timestamp: localVersion.updatedAt,
            userId: localVersion.userId,
            userName: 'You',
          },
          remoteVersion: {
            value: remoteVersion,
            changes: getChanges(remoteVersion, localVersion),
            timestamp: remoteVersion.updatedAt,
            userId: remoteVersion.userId,
            userName: remoteVersion.userName || 'Another user',
          },
          timestamp: Date.now(),
          priority: calculatePriority(localVersion, remoteVersion),
          autoResolvable: isAutoResolvable(localVersion, remoteVersion),
        };

        addConflict(conflict);
      }
    };

    zero.on('conflict', handleSyncConflict);

    return () => {
      zero.off('conflict', handleSyncConflict);
    };
  }, [listId, addConflict]);
}

function detectConflict(local: any, remote: any): boolean {
  // Check if both versions have changes
  const localTimestamp = local.updatedAt || 0;
  const remoteTimestamp = remote.updatedAt || 0;

  // If timestamps are very close (within 1 second), consider it a conflict
  return Math.abs(localTimestamp - remoteTimestamp) < 1000;
}

function determineConflictType(local: any, remote: any): ConflictType {
  if (!local && remote) return 'delete_edit';
  if (local && !remote) return 'delete_edit';

  // Check which fields changed
  const localChanges = Object.keys(local).filter(key => local[key] !== remote[key]);
  const hasOverlap = localChanges.length > 0;

  return hasOverlap ? 'concurrent_edit' : 'edit_edit';
}

function getChanges(newVersion: any, oldVersion: any): FieldChange[] {
  const changes: FieldChange[] = [];

  Object.keys(newVersion).forEach(field => {
    if (newVersion[field] !== oldVersion[field]) {
      changes.push({
        field,
        oldValue: oldVersion[field],
        newValue: newVersion[field],
      });
    }
  });

  return changes;
}

function calculatePriority(local: any, remote: any): number {
  // Higher priority for more recent changes
  const timeDiff = Math.abs((local.updatedAt || 0) - (remote.updatedAt || 0));

  if (timeDiff < 1000) return 10; // Very recent conflict
  if (timeDiff < 5000) return 5;  // Recent conflict
  return 1; // Older conflict
}

function isAutoResolvable(local: any, remote: any): boolean {
  // Simple conflicts can be auto-resolved
  const changes = getChanges(local, remote);

  // If only one field changed, it's auto-resolvable
  if (changes.length === 1) return true;

  // If changes are to different fields, it's auto-resolvable
  const localChangedFields = new Set(Object.keys(local).filter(k => local[k] !== remote[k]));
  const remoteChangedFields = new Set(Object.keys(remote).filter(k => remote[k] !== local[k]));

  const hasOverlap = Array.from(localChangedFields).some(f => remoteChangedFields.has(f));

  return !hasOverlap;
}
*/

/**
 * Example 4: Apply Conflict Resolution
 * Function to apply the chosen resolution strategy
 */
/*
async function applyConflictResolution(
  conflict: Conflict,
  resolution: ConflictResolution
): Promise<void> {
  const zero = getZeroInstance();

  switch (resolution) {
    case 'mine':
      // Apply local version
      await zero.mutate.grocery_items.update({
        id: conflict.itemId,
        ...conflict.localVersion.value,
      });
      break;

    case 'theirs':
      // Apply remote version
      await zero.mutate.grocery_items.update({
        id: conflict.itemId,
        ...conflict.remoteVersion.value,
      });
      break;

    case 'manual':
      // Open manual merge dialog
      // This would show a form where users can pick specific fields
      // or enter custom values
      openManualMergeDialog(conflict);
      break;
  }
}

function openManualMergeDialog(conflict: Conflict): void {
  // Implementation would show a modal dialog with:
  // - Side-by-side comparison of both versions
  // - Field-by-field selection
  // - Option to enter custom values
  // - Preview of merged result
  console.log('Opening manual merge dialog for conflict:', conflict.id);
}
*/

/**
 * Example 5: Complete App Integration
 * Show how to integrate in your main App component
 */
export function AppWithConflictSupport() {
  // In your main App.tsx:
  /*
  import { Notifications } from './components/Notifications';
  import { ConflictNotifications } from './components/ConflictNotification';
  import { useNotification } from './contexts/NotificationContext';

  function App() {
    const { notifications, conflicts, resolveConflict, dismissConflict } = useNotification();

    return (
      <div className="app">
        // Your app content

        // Regular notifications
        <Notifications position="top-right" />

        // Conflict notifications (stacked on top)
        <ConflictNotifications
          conflicts={conflicts}
          onResolve={resolveConflict}
          onDismiss={dismissConflict}
          position="top-right"
          maxVisible={3}
        />
      </div>
    );
  }
  */

  return null;
}

/**
 * Example 6: Testing Conflicts
 * Helper functions for testing conflict scenarios
 */
export function createTestConflict(options: {
  itemName: string;
  type?: 'concurrent_edit' | 'delete_edit' | 'edit_edit';
  localChanges?: Record<string, any>;
  remoteChanges?: Record<string, any>;
}): Conflict {
  const baseItem = {
    id: nanoid(),
    name: options.itemName,
    quantity: 1,
    gotten: false,
    category: 'Other' as const,
    notes: '',
  };

  return {
    id: nanoid(),
    type: options.type || 'concurrent_edit',
    itemId: baseItem.id,
    itemName: options.itemName,
    listId: 'test-list',
    localVersion: {
      value: { ...baseItem, ...options.localChanges },
      changes: Object.keys(options.localChanges || {}).map(field => ({
        field,
        oldValue: baseItem[field as keyof typeof baseItem],
        newValue: (options.localChanges as any)[field],
      })),
      timestamp: Date.now() - 5000,
      userId: 'user-local',
      userName: 'You',
    },
    remoteVersion: {
      value: { ...baseItem, ...options.remoteChanges },
      changes: Object.keys(options.remoteChanges || {}).map(field => ({
        field,
        oldValue: baseItem[field as keyof typeof baseItem],
        newValue: (options.remoteChanges as any)[field],
      })),
      timestamp: Date.now() - 3000,
      userId: 'user-remote',
      userName: 'Alice',
    },
    timestamp: Date.now(),
    priority: 1,
    autoResolvable: false,
  };
}

// Usage:
/*
const conflict = createTestConflict({
  itemName: 'Milk',
  type: 'concurrent_edit',
  localChanges: { quantity: 2 },
  remoteChanges: { quantity: 3, gotten: true },
});
*/
