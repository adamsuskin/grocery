/**
 * SyncContext - Manages online/offline state and sync progress
 *
 * This context provides centralized sync status management for the grocery list app.
 * It tracks connection state, sync progress, pending mutations, and integrates with
 * the OfflineQueueManager to provide a complete view of sync operations.
 *
 * ## Features
 * - Real-time online/offline detection using navigator.onLine
 * - Sync state tracking (idle/syncing/synced/failed)
 * - Pending mutations count from OfflineQueueManager
 * - Last sync timestamp tracking
 * - Sync control functions (retry, clear queue)
 * - localStorage persistence for sync state
 * - Event emission for sync state changes
 * - Performance monitoring (sync duration)
 * - Debugging utilities
 * - Conflict resolution integration
 *
 * ## Usage
 * ```tsx
 * import { useSyncStatus } from './contexts/SyncContext';
 *
 * function MyComponent() {
 *   const {
 *     connectionState,
 *     syncState,
 *     pendingCount,
 *     lastSyncTime,
 *     retrySync,
 *     clearQueue
 *   } = useSyncStatus();
 *
 *   return (
 *     <div>
 *       <p>Connection: {connectionState}</p>
 *       <p>Sync Status: {syncState}</p>
 *       <p>Pending: {pendingCount}</p>
 *       {pendingCount > 0 && <button onClick={retrySync}>Retry</button>}
 *     </div>
 *   );
 * }
 * ```
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useZero } from '@rocicorp/zero/react';
import { useOfflineQueue } from '../utils/offlineQueue';
import { ConflictResolver, createConflictResolver } from '../utils/conflictResolver';
import type { QueueStatus } from '../utils/offlineQueue';
import type { Conflict, ConflictResolution, GroceryItem } from '../types';

/**
 * Connection state enum
 */
export type ConnectionState = 'online' | 'offline' | 'connecting';

/**
 * Sync state enum
 */
export type SyncState = 'idle' | 'syncing' | 'synced' | 'failed';

/**
 * Sync statistics for performance monitoring
 */
export interface SyncStats {
  /** Duration of last sync in milliseconds */
  lastSyncDuration: number | null;
  /** Average sync duration in milliseconds */
  averageSyncDuration: number | null;
  /** Total number of syncs completed */
  totalSyncs: number;
  /** Total number of failed syncs */
  totalFailures: number;
  /** Success rate as a percentage */
  successRate: number;
}

/**
 * Sync event data emitted when sync state changes
 */
export interface SyncEvent {
  /** Type of event */
  type: 'sync_start' | 'sync_complete' | 'sync_failed' | 'connection_change' | 'queue_change';
  /** Timestamp of event */
  timestamp: number;
  /** Connection state at time of event */
  connectionState: ConnectionState;
  /** Sync state at time of event */
  syncState: SyncState;
  /** Number of pending mutations */
  pendingCount: number;
  /** Additional event data */
  data?: any;
}

/**
 * Legacy sync status interface for backward compatibility
 */
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  lastSyncTime: Date | null;
  conflicts: Conflict[];
}

/**
 * Sync context state
 */
export interface SyncContextState {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Current sync state */
  syncState: SyncState;
  /** Number of pending mutations */
  pendingCount: number;
  /** Number of failed mutations */
  failedCount: number;
  /** Timestamp of last successful sync */
  lastSyncTime: number | null;
  /** Timestamp when went offline (null if online) */
  lastOfflineTime: number | null;
  /** Whether currently syncing */
  isSyncing: boolean;
  /** Sync statistics */
  stats: SyncStats;
  /** Current queue status */
  queueStatus: QueueStatus | null;
  /** Active conflicts */
  conflicts: Conflict[];
}

/**
 * Sync context value with methods
 */
export interface SyncContextValue extends SyncContextState {
  /** Legacy status object for backward compatibility */
  status: SyncStatus;
  /** Retry syncing failed mutations */
  retrySync: () => Promise<void>;
  /** Clear all pending mutations */
  clearQueue: () => void;
  /** Manually trigger sync */
  triggerSync: () => Promise<void>;
  /** Get sync history */
  getSyncHistory: () => SyncEvent[];
  /** Clear sync history */
  clearSyncHistory: () => void;
  /** Get debug information */
  getDebugInfo: () => any;
  /** Resolve a conflict */
  resolveConflict: (conflictId: string, resolution: ConflictResolution, resolvedItem?: GroceryItem) => void;
  /** Dismiss a conflict notification */
  dismissConflict: (conflictId: string) => void;
  /** Conflict resolver instance */
  conflictResolver: ConflictResolver;
}

/**
 * Storage keys for persisting sync state
 */
const SYNC_STORAGE_KEYS = {
  LAST_SYNC_TIME: 'grocery_sync_last_sync_time',
  LAST_OFFLINE_TIME: 'grocery_sync_last_offline_time',
  SYNC_STATS: 'grocery_sync_stats',
  SYNC_HISTORY: 'grocery_sync_history',
} as const;

/**
 * Storage utility functions
 */
const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[SyncContext] Error reading from localStorage:', error);
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[SyncContext] Error writing to localStorage:', error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[SyncContext] Error removing from localStorage:', error);
    }
  },
};

/**
 * Initial sync statistics
 */
const initialStats: SyncStats = {
  lastSyncDuration: null,
  averageSyncDuration: null,
  totalSyncs: 0,
  totalFailures: 0,
  successRate: 100,
};

/**
 * Load sync stats from storage
 */
function loadSyncStats(): SyncStats {
  const stored = storage.get(SYNC_STORAGE_KEYS.SYNC_STATS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('[SyncContext] Error parsing sync stats:', error);
    }
  }
  return initialStats;
}

/**
 * Save sync stats to storage
 */
function saveSyncStats(stats: SyncStats): void {
  storage.set(SYNC_STORAGE_KEYS.SYNC_STATS, JSON.stringify(stats));
}

/**
 * Initial state
 */
const initialState: SyncContextState = {
  connectionState: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
  syncState: 'idle',
  pendingCount: 0,
  failedCount: 0,
  lastSyncTime: null,
  lastOfflineTime: null,
  isSyncing: false,
  stats: loadSyncStats(),
  queueStatus: null,
  conflicts: [],
};

/**
 * Create the context
 */
const SyncContext = createContext<SyncContextValue | undefined>(undefined);

/**
 * Maximum number of sync events to keep in history
 */
const MAX_SYNC_HISTORY = 50;

/**
 * SyncProvider component
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const zero = useZero();
  const conflictResolver = createConflictResolver();

  const [state, setState] = useState<SyncContextState>(() => {
    // Load last sync time from storage
    const lastSyncStr = storage.get(SYNC_STORAGE_KEYS.LAST_SYNC_TIME);
    const lastOfflineStr = storage.get(SYNC_STORAGE_KEYS.LAST_OFFLINE_TIME);

    return {
      ...initialState,
      lastSyncTime: lastSyncStr ? parseInt(lastSyncStr, 10) : null,
      lastOfflineTime: lastOfflineStr ? parseInt(lastOfflineStr, 10) : null,
    };
  });

  // Sync event history
  const [syncHistory, setSyncHistory] = useState<SyncEvent[]>(() => {
    const stored = storage.get(SYNC_STORAGE_KEYS.SYNC_HISTORY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('[SyncContext] Error parsing sync history:', error);
        return [];
      }
    }
    return [];
  });

  // Reference to track sync start time for duration calculation
  const syncStartTimeRef = useRef<number | null>(null);

  // Use offline queue hook for real-time queue status
  const {
    queueStatus,
    pendingCount,
    failedCount,
    isProcessing,
    processQueue,
    retryFailed,
    clearQueue: clearQueueAction,
  } = useOfflineQueue();

  /**
   * Emit sync event
   */
  const emitSyncEvent = useCallback((event: Omit<SyncEvent, 'timestamp' | 'connectionState' | 'syncState' | 'pendingCount'>) => {
    const fullEvent: SyncEvent = {
      ...event,
      timestamp: Date.now(),
      connectionState: state.connectionState,
      syncState: state.syncState,
      pendingCount: state.pendingCount,
    };

    setSyncHistory(prev => {
      const updated = [...prev, fullEvent];
      // Keep only last MAX_SYNC_HISTORY events
      const trimmed = updated.slice(-MAX_SYNC_HISTORY);
      // Persist to storage
      storage.set(SYNC_STORAGE_KEYS.SYNC_HISTORY, JSON.stringify(trimmed));
      return trimmed;
    });

    // Log event for debugging
    console.debug('[SyncContext] Event:', fullEvent.type, fullEvent);
  }, [state.connectionState, state.syncState, state.pendingCount]);

  /**
   * Update sync statistics
   */
  const updateSyncStats = useCallback((success: boolean, duration?: number) => {
    setState(prev => {
      const newStats = { ...prev.stats };

      if (success) {
        newStats.totalSyncs++;
        if (duration !== undefined) {
          newStats.lastSyncDuration = duration;
          // Calculate running average
          if (newStats.averageSyncDuration === null) {
            newStats.averageSyncDuration = duration;
          } else {
            newStats.averageSyncDuration =
              (newStats.averageSyncDuration * (newStats.totalSyncs - 1) + duration) / newStats.totalSyncs;
          }
        }
      } else {
        newStats.totalFailures++;
      }

      // Update success rate
      const totalAttempts = newStats.totalSyncs + newStats.totalFailures;
      newStats.successRate = totalAttempts > 0 ? (newStats.totalSyncs / totalAttempts) * 100 : 100;

      // Persist stats
      saveSyncStats(newStats);

      return {
        ...prev,
        stats: newStats,
      };
    });
  }, []);

  /**
   * Handle online event
   */
  const handleOnline = useCallback(() => {
    console.log('[SyncContext] Connection restored');

    setState(prev => ({
      ...prev,
      connectionState: 'online',
      lastOfflineTime: null,
    }));

    storage.remove(SYNC_STORAGE_KEYS.LAST_OFFLINE_TIME);

    emitSyncEvent({
      type: 'connection_change',
      data: { state: 'online' },
    });

    // Auto-trigger sync when coming back online
    if (pendingCount > 0) {
      processQueue().catch(error => {
        console.error('[SyncContext] Auto-sync failed:', error);
      });
    }
  }, [emitSyncEvent, pendingCount, processQueue]);

  /**
   * Handle offline event
   */
  const handleOffline = useCallback(() => {
    console.log('[SyncContext] Connection lost');

    const offlineTime = Date.now();
    setState(prev => ({
      ...prev,
      connectionState: 'offline',
      lastOfflineTime: offlineTime,
      syncState: 'idle',
      isSyncing: false,
    }));

    storage.set(SYNC_STORAGE_KEYS.LAST_OFFLINE_TIME, offlineTime.toString());

    emitSyncEvent({
      type: 'connection_change',
      data: { state: 'offline' },
    });
  }, [emitSyncEvent]);

  /**
   * Setup online/offline event listeners
   */
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection check
    const isOnline = navigator.onLine;
    setState(prev => ({
      ...prev,
      connectionState: isOnline ? 'online' : 'offline',
    }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  /**
   * Update state based on queue status
   */
  useEffect(() => {
    setState(prev => ({
      ...prev,
      pendingCount,
      failedCount,
      queueStatus,
      isSyncing: isProcessing,
    }));

    // Emit queue change event
    emitSyncEvent({
      type: 'queue_change',
      data: { pendingCount, failedCount },
    });
  }, [pendingCount, failedCount, isProcessing, queueStatus, emitSyncEvent]);

  /**
   * Update sync state based on queue processing
   */
  useEffect(() => {
    if (isProcessing) {
      // Sync started
      if (syncStartTimeRef.current === null) {
        syncStartTimeRef.current = Date.now();
        setState(prev => ({
          ...prev,
          syncState: 'syncing',
          isSyncing: true,
        }));

        emitSyncEvent({
          type: 'sync_start',
        });
      }
    } else if (syncStartTimeRef.current !== null) {
      // Sync completed
      const duration = Date.now() - syncStartTimeRef.current;
      const success = failedCount === 0;

      setState(prev => {
        const newState = {
          ...prev,
          syncState: success ? ('synced' as SyncState) : ('failed' as SyncState),
          isSyncing: false,
          lastSyncTime: Date.now(),
        };

        // Persist last sync time
        if (success) {
          storage.set(SYNC_STORAGE_KEYS.LAST_SYNC_TIME, newState.lastSyncTime!.toString());
        }

        return newState;
      });

      updateSyncStats(success, duration);

      emitSyncEvent({
        type: success ? 'sync_complete' : 'sync_failed',
        data: { duration, success },
      });

      syncStartTimeRef.current = null;

      // Auto-reset to idle after showing synced/failed state
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          syncState: 'idle',
        }));
      }, 3000);
    }
  }, [isProcessing, failedCount, emitSyncEvent, updateSyncStats]);

  /**
   * Retry syncing failed mutations
   */
  const retrySync = useCallback(async () => {
    console.log('[SyncContext] Retrying sync');
    setState(prev => ({
      ...prev,
      syncState: 'syncing',
      connectionState: 'connecting',
    }));

    try {
      await retryFailed();
      // State will be updated by useEffect watching isProcessing
    } catch (error) {
      console.error('[SyncContext] Retry sync failed:', error);
      setState(prev => ({
        ...prev,
        syncState: 'failed',
        connectionState: navigator.onLine ? 'online' : 'offline',
      }));
      updateSyncStats(false);
    }
  }, [retryFailed, updateSyncStats]);

  /**
   * Clear all pending mutations
   */
  const clearQueue = useCallback(() => {
    console.log('[SyncContext] Clearing queue');
    clearQueueAction();
    setState(prev => ({
      ...prev,
      syncState: 'idle',
      pendingCount: 0,
      failedCount: 0,
    }));
  }, [clearQueueAction]);

  /**
   * Manually trigger sync
   */
  const triggerSync = useCallback(async () => {
    console.log('[SyncContext] Triggering sync');
    if (state.connectionState === 'offline') {
      console.warn('[SyncContext] Cannot sync while offline');
      return;
    }

    setState(prev => ({
      ...prev,
      syncState: 'syncing',
      connectionState: 'connecting',
    }));

    try {
      await processQueue();
      // State will be updated by useEffect watching isProcessing
    } catch (error) {
      console.error('[SyncContext] Manual sync failed:', error);
      setState(prev => ({
        ...prev,
        syncState: 'failed',
        connectionState: navigator.onLine ? 'online' : 'offline',
      }));
      updateSyncStats(false);
    }
  }, [state.connectionState, processQueue, updateSyncStats]);

  /**
   * Get sync history
   */
  const getSyncHistory = useCallback(() => {
    return [...syncHistory];
  }, [syncHistory]);

  /**
   * Clear sync history
   */
  const clearSyncHistory = useCallback(() => {
    setSyncHistory([]);
    storage.remove(SYNC_STORAGE_KEYS.SYNC_HISTORY);
  }, []);

  /**
   * Get debug information
   */
  const getDebugInfo = useCallback(() => {
    return {
      state,
      queueStatus,
      syncHistory: syncHistory.slice(-10), // Last 10 events
      navigator: {
        onLine: navigator.onLine,
        connection: (navigator as any).connection,
      },
      storage: {
        lastSyncTime: storage.get(SYNC_STORAGE_KEYS.LAST_SYNC_TIME),
        lastOfflineTime: storage.get(SYNC_STORAGE_KEYS.LAST_OFFLINE_TIME),
        stats: storage.get(SYNC_STORAGE_KEYS.SYNC_STATS),
      },
    };
  }, [state, queueStatus, syncHistory]);

  /**
   * Resolve a conflict
   */
  const resolveConflict = useCallback((
    conflictId: string,
    resolution: ConflictResolution,
    resolvedItem?: GroceryItem
  ) => {
    setState(prev => {
      const conflict = prev.conflicts.find(c => c.id === conflictId);
      if (!conflict) return prev;

      // Apply resolution
      let finalItem: GroceryItem | null = null;

      if (resolution === 'mine') {
        // Use local version
        finalItem = conflict.localVersion.value as GroceryItem;
      } else if (resolution === 'theirs') {
        // Use remote version
        finalItem = conflict.remoteVersion.value as GroceryItem;
      } else if (resolution === 'manual' && resolvedItem) {
        // Use manually merged version
        finalItem = resolvedItem;
      }

      if (finalItem && zero) {
        // Apply resolved item to Zero store
        // Type assertion needed due to Zero's update signature expecting optional fields
        const { id, ...updates } = finalItem;
        zero.mutate.grocery_items.update({
          id,
          ...updates,
        } as any).catch(error => {
          console.error('[SyncContext] Failed to apply conflict resolution:', error);
        });
        console.log('[SyncContext] Resolved conflict:', conflictId, 'with resolution:', resolution);
      }

      // Remove conflict from list
      return {
        ...prev,
        conflicts: prev.conflicts.filter(c => c.id !== conflictId),
      };
    });
  }, [zero]);

  /**
   * Dismiss a conflict notification without resolving
   */
  const dismissConflict = useCallback((conflictId: string) => {
    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter(c => c.id !== conflictId),
    }));
  }, []);

  // Create legacy status object for backward compatibility
  const status: SyncStatus = {
    isOnline: state.connectionState === 'online',
    isSyncing: state.isSyncing,
    queuedCount: state.pendingCount,
    lastSyncTime: state.lastSyncTime ? new Date(state.lastSyncTime) : null,
    conflicts: state.conflicts,
  };

  const value: SyncContextValue = {
    ...state,
    status,
    retrySync,
    clearQueue,
    triggerSync,
    getSyncHistory,
    clearSyncHistory,
    getDebugInfo,
    resolveConflict,
    dismissConflict,
    conflictResolver,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

/**
 * Custom hook to use sync context
 * @throws Error if used outside of SyncProvider
 */
export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);

  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }

  return context;
}

/**
 * Hook specifically for sync status (used by SyncStatus component)
 * Returns data in format expected by SyncStatus component
 */
export function useSyncStatus() {
  const context = useSync();
  return {
    // Legacy format for SyncStatus component
    isOnline: context.connectionState === 'online',
    isSyncing: context.isSyncing,
    queuedCount: context.pendingCount,
    lastSyncTime: context.lastSyncTime ? new Date(context.lastSyncTime) : null,
    onRetrySync: context.retrySync,
    // Extended properties
    connectionState: context.connectionState,
    syncState: context.syncState,
    pendingCount: context.pendingCount,
    failedCount: context.failedCount,
    lastOfflineTime: context.lastOfflineTime,
    stats: context.stats,
    queueStatus: context.queueStatus,
    retrySync: context.retrySync,
    clearQueue: context.clearQueue,
    triggerSync: context.triggerSync,
    getSyncHistory: context.getSyncHistory,
    clearSyncHistory: context.clearSyncHistory,
    getDebugInfo: context.getDebugInfo,
  };
}

/**
 * Hook for conflict management
 */
export function useConflicts() {
  const { conflicts, resolveConflict, dismissConflict, conflictResolver } = useSync();
  return {
    conflicts,
    resolveConflict,
    dismissConflict,
    conflictResolver,
  };
}
