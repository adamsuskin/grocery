/**
 * PeriodicSyncContext - Manages Periodic Background Sync state and UI integration
 *
 * This context provides centralized management for the Periodic Background Sync API,
 * enabling scheduled updates even when the app is not open. It integrates with the
 * existing SyncContext to coordinate state updates.
 *
 * ## Features
 * - Browser support detection for Periodic Sync API
 * - Registration management for periodic sync
 * - User preferences for sync frequency and conditions
 * - Statistics tracking (success rate, data usage, etc.)
 * - Battery and network-aware synchronization
 * - Permission management
 * - Integration with existing sync infrastructure
 * - Fallback handling for unsupported browsers
 * - localStorage persistence for preferences and stats
 * - PostMessage communication with service worker
 *
 * ## Browser Compatibility
 * - Chrome 80+ (Full support)
 * - Edge 80+ (Full support)
 * - Safari: Not supported (fallback to manual sync)
 * - Firefox: Not supported (fallback to manual sync)
 *
 * ## Usage
 * ```tsx
 * import { usePeriodicSync } from './contexts/PeriodicSyncContext';
 *
 * function MyComponent() {
 *   const {
 *     isSupported,
 *     isEnabled,
 *     preferences,
 *     statistics,
 *     lastSyncTime,
 *     enable,
 *     disable,
 *     updatePreferences
 *   } = usePeriodicSync();
 *
 *   return (
 *     <div>
 *       {isSupported && (
 *         <button onClick={enable}>Enable Auto-Sync</button>
 *       )}
 *       <p>Last sync: {new Date(lastSyncTime).toLocaleString()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useSync } from './SyncContext';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Sync frequency options for periodic background sync
 */
export enum SyncFrequency {
  /** Every 15 minutes (minimum allowed by browser) */
  VeryFrequent = 900000,
  /** Every 30 minutes */
  Frequent = 1800000,
  /** Every hour */
  Hourly = 3600000,
  /** Every 2 hours */
  Moderate = 7200000,
  /** Every 6 hours */
  Infrequent = 21600000,
  /** Every 12 hours */
  VeryInfrequent = 43200000,
  /** Once per day */
  Daily = 86400000,
}

/**
 * Sync interval type (in minutes)
 */
export type SyncInterval = number;

/**
 * Predefined sync intervals in minutes
 */
export const SYNC_INTERVALS = {
  MINUTES_15: 15,
  MINUTES_30: 30,
  HOUR_1: 60,
  HOURS_2: 120,
  HOURS_4: 240,
  HOURS_6: 360,
  HOURS_12: 720,
  HOURS_24: 1440,
} as const;

/**
 * Network conditions for sync
 */
export enum NetworkCondition {
  /** Any network connection */
  Any = 'any',
  /** Only on WiFi/unmetered connections */
  Unmetered = 'unmetered',
  /** Only on WiFi */
  WiFi = 'wifi',
}

/**
 * Battery condition for sync
 */
export enum BatteryCondition {
  /** Sync regardless of battery level */
  Any = 'any',
  /** Only sync when charging or battery > 50% */
  Conservative = 'conservative',
  /** Only sync when charging */
  ChargingOnly = 'charging',
}

/**
 * User preferences for periodic sync
 */
export interface PeriodicSyncPreferences {
  /** Whether periodic sync is enabled by user */
  enabled: boolean;

  /** Sync frequency/interval */
  frequency: SyncFrequency;

  /** Network condition requirement */
  networkCondition: NetworkCondition;

  /** Battery condition requirement */
  batteryCondition: BatteryCondition;

  /** Whether to sync in background when app is closed */
  syncInBackground: boolean;

  /** Whether to show notifications on sync completion */
  showNotifications: boolean;

  /** Maximum data to sync per session (in bytes, 0 = unlimited) */
  maxDataPerSync: number;

  /** Time window when sync is allowed (null = always) */
  allowedTimeWindow: {
    startHour: number; // 0-23
    endHour: number;   // 0-23
  } | null;
}

/**
 * Metadata for a single sync event
 */
export interface PeriodicSyncMetadata {
  /** Unique identifier for this sync */
  id: string;

  /** Sync tag used for registration */
  tag: string;

  /** When sync was registered */
  registeredAt: number;

  /** When sync was triggered */
  triggeredAt: number | null;

  /** When sync completed */
  completedAt: number | null;

  /** Whether sync was successful */
  success: boolean | null;

  /** Number of items synced */
  itemsSynced: number;

  /** Number of items that failed */
  itemsFailed: number;

  /** Duration of sync in milliseconds */
  duration: number | null;

  /** Data transferred in bytes */
  bytesTransferred: number;

  /** Battery level at sync time (0-100) */
  batteryLevel: number | null;

  /** Network type at sync time */
  networkType: string | null;

  /** Error message if sync failed */
  error: string | null;
}

/**
 * Statistics for periodic sync operations
 */
export interface PeriodicSyncStatistics {
  /** Total number of syncs performed */
  totalSyncs: number;

  /** Number of successful syncs */
  successfulSyncs: number;

  /** Number of failed syncs */
  failedSyncs: number;

  /** Success rate as a percentage */
  successRate: number;

  /** Total items synced */
  totalItemsSynced: number;

  /** Total data transferred in bytes */
  totalBytesTransferred: number;

  /** Average sync duration in milliseconds */
  averageSyncDuration: number;

  /** Last sync timestamp */
  lastSyncTime: number | null;

  /** Next scheduled sync timestamp (estimated) */
  nextScheduledSync: number | null;

  /** Average battery usage per sync (percentage points) */
  averageBatteryUsage: number;

  /** Most common network type used */
  mostCommonNetwork: string | null;
}

/**
 * Periodic sync context state
 */
export interface PeriodicSyncContextState {
  /** Whether Periodic Background Sync API is supported */
  isSupported: boolean;

  /** Whether periodic sync is currently enabled */
  isEnabled: boolean;

  /** User preferences for sync behavior */
  preferences: PeriodicSyncPreferences;

  /** Map of sync metadata by sync ID */
  metadata: Map<string, PeriodicSyncMetadata>;

  /** Aggregate statistics */
  statistics: PeriodicSyncStatistics;

  /** Timestamp of last successful sync */
  lastSyncTime: number | null;

  /** Estimated timestamp of next scheduled sync */
  nextScheduledSync: number | null;

  /** Current sync tag being used */
  currentSyncTag: string | null;

  /** Whether a sync is currently in progress */
  isSyncing: boolean;

  /** Service worker registration */
  registration: ServiceWorkerRegistration | null;

  /** Error message if any */
  error: string | null;

  /** Current sync interval in minutes */
  syncInterval: SyncInterval;

  /** Whether periodic sync is registered */
  isRegistered: boolean;

  /** Whether an update operation is in progress */
  isUpdating: boolean;

  /** Minutes until next sync */
  nextSyncIn: number | null;
}

/**
 * Periodic sync context value with methods
 */
export interface PeriodicSyncContextValue extends PeriodicSyncContextState {
  /** Enable periodic sync */
  enable: () => Promise<void>;

  /** Disable periodic sync */
  disable: () => Promise<void>;

  /** Update user preferences */
  updatePreferences: (preferences: Partial<PeriodicSyncPreferences>) => Promise<void>;

  /** Get all sync statistics */
  getStatistics: () => PeriodicSyncStatistics;

  /** Get sync history */
  getSyncHistory: () => PeriodicSyncMetadata[];

  /** Clear sync history */
  clearSyncHistory: () => void;

  /** Manually trigger a sync (outside of periodic schedule) */
  triggerManualSync: () => Promise<void>;

  /** Check current permissions and conditions */
  checkConditions: () => Promise<{
    canSync: boolean;
    reasons: string[];
  }>;

  /** Update sync interval */
  updateInterval: (interval: SyncInterval) => Promise<void>;

  /** Trigger sync manually */
  triggerSync: () => Promise<void>;
}

// ============================================================================
// Constants and Storage Keys
// ============================================================================

/**
 * Storage keys for persisting periodic sync state
 */
const STORAGE_KEYS = {
  PREFERENCES: 'grocery_periodic_sync_preferences',
  STATISTICS: 'grocery_periodic_sync_statistics',
  METADATA: 'grocery_periodic_sync_metadata',
  ENABLED: 'grocery_periodic_sync_enabled',
  LAST_SYNC: 'grocery_periodic_sync_last_sync',
} as const;

/**
 * Default sync tag for periodic background sync
 */
const DEFAULT_SYNC_TAG = 'grocery-periodic-sync';

/**
 * Maximum number of sync metadata entries to keep in history
 */
const MAX_METADATA_HISTORY = 100;

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES: PeriodicSyncPreferences = {
  enabled: false,
  frequency: SyncFrequency.Hourly,
  networkCondition: NetworkCondition.Any,
  batteryCondition: BatteryCondition.Conservative,
  syncInBackground: true,
  showNotifications: false,
  maxDataPerSync: 0, // Unlimited
  allowedTimeWindow: null, // Always allowed
};

/**
 * Initial statistics
 */
const INITIAL_STATISTICS: PeriodicSyncStatistics = {
  totalSyncs: 0,
  successfulSyncs: 0,
  failedSyncs: 0,
  successRate: 100,
  totalItemsSynced: 0,
  totalBytesTransferred: 0,
  averageSyncDuration: 0,
  lastSyncTime: null,
  nextScheduledSync: null,
  averageBatteryUsage: 0,
  mostCommonNetwork: null,
};

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Storage utility functions
 */
const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[PeriodicSyncContext] Error reading from localStorage:', error);
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[PeriodicSyncContext] Error writing to localStorage:', error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[PeriodicSyncContext] Error removing from localStorage:', error);
    }
  },
};

/**
 * Load preferences from storage
 */
function loadPreferences(): PeriodicSyncPreferences {
  const stored = storage.get(STORAGE_KEYS.PREFERENCES);
  if (stored) {
    try {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch (error) {
      console.error('[PeriodicSyncContext] Error parsing preferences:', error);
    }
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save preferences to storage
 */
function savePreferences(preferences: PeriodicSyncPreferences): void {
  storage.set(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
}

/**
 * Load statistics from storage
 */
function loadStatistics(): PeriodicSyncStatistics {
  const stored = storage.get(STORAGE_KEYS.STATISTICS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('[PeriodicSyncContext] Error parsing statistics:', error);
    }
  }
  return INITIAL_STATISTICS;
}

/**
 * Save statistics to storage
 */
function saveStatistics(statistics: PeriodicSyncStatistics): void {
  storage.set(STORAGE_KEYS.STATISTICS, JSON.stringify(statistics));
}

/**
 * Load metadata from storage
 */
function loadMetadata(): Map<string, PeriodicSyncMetadata> {
  const stored = storage.get(STORAGE_KEYS.METADATA);
  if (stored) {
    try {
      const entries = JSON.parse(stored);
      return new Map(Object.entries(entries));
    } catch (error) {
      console.error('[PeriodicSyncContext] Error parsing metadata:', error);
    }
  }
  return new Map();
}

/**
 * Save metadata to storage
 */
function saveMetadata(metadata: Map<string, PeriodicSyncMetadata>): void {
  try {
    const obj = Object.fromEntries(metadata.entries());
    storage.set(STORAGE_KEYS.METADATA, JSON.stringify(obj));
  } catch (error) {
    console.error('[PeriodicSyncContext] Error saving metadata:', error);
  }
}

// ============================================================================
// Feature Detection
// ============================================================================

/**
 * Check if Periodic Background Sync API is supported
 */
function isPeriodicSyncSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'periodicSync' in ServiceWorkerRegistration.prototype
  );
}

/**
 * Check if Battery Status API is supported
 */
function isBatteryAPISupported(): boolean {
  return 'getBattery' in navigator;
}

/**
 * Check if Network Information API is supported
 */
function isNetworkInfoSupported(): boolean {
  return 'connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator;
}

// ============================================================================
// Context Creation
// ============================================================================

const PeriodicSyncContext = createContext<PeriodicSyncContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * PeriodicSyncProvider component
 */
export function PeriodicSyncProvider({ children }: { children: ReactNode }) {
  // Get existing sync context for coordination
  const syncContext = useSync();

  // State
  const [state, setState] = useState<PeriodicSyncContextState>(() => {
    const isSupported = isPeriodicSyncSupported();
    const preferences = loadPreferences();
    const statistics = loadStatistics();
    const metadata = loadMetadata();
    const enabled = storage.get(STORAGE_KEYS.ENABLED) === 'true';

    return {
      isSupported,
      isEnabled: enabled && isSupported,
      preferences,
      metadata,
      statistics,
      lastSyncTime: statistics.lastSyncTime,
      nextScheduledSync: statistics.nextScheduledSync,
      currentSyncTag: enabled ? DEFAULT_SYNC_TAG : null,
      isSyncing: false,
      registration: null,
      error: null,
      syncInterval: 60, // Default to 1 hour
      isRegistered: enabled && isSupported,
      isUpdating: false,
      nextSyncIn: null,
    };
  });

  // Refs for managing event listeners
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  /**
   * Check if current conditions allow syncing
   */
  const checkConditions = useCallback(async (): Promise<{ canSync: boolean; reasons: string[] }> => {
    const reasons: string[] = [];
    let canSync = true;

    // Check online status
    if (!navigator.onLine) {
      canSync = false;
      reasons.push('Device is offline');
    }

    // Check network condition
    if (state.preferences.networkCondition !== NetworkCondition.Any && isNetworkInfoSupported()) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const isUnmetered = connection?.saveData === false && connection?.effectiveType !== 'slow-2g' && connection?.effectiveType !== '2g';

      if (state.preferences.networkCondition === NetworkCondition.Unmetered && !isUnmetered) {
        canSync = false;
        reasons.push('Waiting for unmetered network connection');
      }
    }

    // Check battery condition
    if (state.preferences.batteryCondition !== BatteryCondition.Any && isBatteryAPISupported()) {
      try {
        const battery = await (navigator as any).getBattery();
        const batteryLevel = battery.level * 100;
        const isCharging = battery.charging;

        if (state.preferences.batteryCondition === BatteryCondition.ChargingOnly && !isCharging) {
          canSync = false;
          reasons.push('Waiting for device to be charging');
        } else if (state.preferences.batteryCondition === BatteryCondition.Conservative && !isCharging && batteryLevel < 50) {
          canSync = false;
          reasons.push('Battery level too low (< 50%)');
        }
      } catch (error) {
        console.warn('[PeriodicSyncContext] Could not check battery status:', error);
      }
    }

    // Check time window
    if (state.preferences.allowedTimeWindow) {
      const now = new Date();
      const currentHour = now.getHours();
      const { startHour, endHour } = state.preferences.allowedTimeWindow;

      let inWindow = false;
      if (startHour <= endHour) {
        inWindow = currentHour >= startHour && currentHour < endHour;
      } else {
        // Window crosses midnight
        inWindow = currentHour >= startHour || currentHour < endHour;
      }

      if (!inWindow) {
        canSync = false;
        reasons.push(`Outside allowed time window (${startHour}:00 - ${endHour}:00)`);
      }
    }

    return { canSync, reasons };
  }, [state.preferences]);

  /**
   * Update statistics after a sync
   */
  const updateStatistics = useCallback((metadata: PeriodicSyncMetadata) => {
    setState(prev => {
      const newStats = { ...prev.statistics };

      newStats.totalSyncs++;
      if (metadata.success) {
        newStats.successfulSyncs++;
      } else {
        newStats.failedSyncs++;
      }

      newStats.successRate = (newStats.successfulSyncs / newStats.totalSyncs) * 100;
      newStats.totalItemsSynced += metadata.itemsSynced;
      newStats.totalBytesTransferred += metadata.bytesTransferred;

      // Update average sync duration
      if (metadata.duration !== null) {
        const totalDuration = newStats.averageSyncDuration * (newStats.totalSyncs - 1) + metadata.duration;
        newStats.averageSyncDuration = totalDuration / newStats.totalSyncs;
      }

      newStats.lastSyncTime = metadata.completedAt;

      // Estimate next sync time based on frequency
      if (prev.preferences.enabled) {
        newStats.nextScheduledSync = Date.now() + prev.preferences.frequency;
      }

      // Update network type statistics
      if (metadata.networkType) {
        newStats.mostCommonNetwork = metadata.networkType;
      }

      saveStatistics(newStats);

      return {
        ...prev,
        statistics: newStats,
        lastSyncTime: newStats.lastSyncTime,
        nextScheduledSync: newStats.nextScheduledSync,
      };
    });
  }, []);

  /**
   * Handle sync event from service worker
   */
  const handleSyncEvent = useCallback((event: MessageEvent) => {
    console.log('[PeriodicSyncContext] Received message from service worker:', event.data);

    const { type, payload } = event.data;

    switch (type) {
      case 'PERIODIC_SYNC_START':
        setState(prev => ({
          ...prev,
          isSyncing: true,
        }));
        break;

      case 'PERIODIC_SYNC_COMPLETE':
        {
          const metadata: PeriodicSyncMetadata = payload;

          // Add to metadata map
          setState(prev => {
            const newMetadata = new Map(prev.metadata);
            newMetadata.set(metadata.id, metadata);

            // Keep only last MAX_METADATA_HISTORY entries
            if (newMetadata.size > MAX_METADATA_HISTORY) {
              const sortedEntries = Array.from(newMetadata.entries())
                .sort((a, b) => (b[1].completedAt || 0) - (a[1].completedAt || 0));
              newMetadata.clear();
              sortedEntries.slice(0, MAX_METADATA_HISTORY).forEach(([key, value]) => {
                newMetadata.set(key, value);
              });
            }

            saveMetadata(newMetadata);

            return {
              ...prev,
              metadata: newMetadata,
              isSyncing: false,
            };
          });

          updateStatistics(metadata);
        }
        break;

      case 'PERIODIC_SYNC_FAILED':
        {
          const metadata: PeriodicSyncMetadata = payload;

          setState(prev => {
            const newMetadata = new Map(prev.metadata);
            newMetadata.set(metadata.id, metadata);
            saveMetadata(newMetadata);

            return {
              ...prev,
              metadata: newMetadata,
              isSyncing: false,
              error: metadata.error || 'Sync failed',
            };
          });

          updateStatistics(metadata);
        }
        break;

      default:
        // Ignore unknown message types
        break;
    }
  }, [updateStatistics]);

  /**
   * Setup message listener for service worker communication
   */
  useEffect(() => {
    if (!state.isSupported || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Create and store message handler
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type && event.data.type.startsWith('PERIODIC_SYNC')) {
        handleSyncEvent(event);
      }
    };

    messageHandlerRef.current = handler;
    navigator.serviceWorker.addEventListener('message', handler);

    return () => {
      if (messageHandlerRef.current) {
        navigator.serviceWorker.removeEventListener('message', messageHandlerRef.current);
      }
    };
  }, [state.isSupported, handleSyncEvent]);

  /**
   * Get service worker registration
   */
  useEffect(() => {
    if (!state.isSupported) return;

    navigator.serviceWorker.ready.then(registration => {
      setState(prev => ({
        ...prev,
        registration,
      }));
    }).catch(error => {
      console.error('[PeriodicSyncContext] Failed to get service worker registration:', error);
    });
  }, [state.isSupported]);

  /**
   * Enable periodic sync
   */
  const enable = useCallback(async () => {
    if (!state.isSupported) {
      console.warn('[PeriodicSyncContext] Periodic Sync API is not supported');
      setState(prev => ({
        ...prev,
        error: 'Periodic Sync API is not supported in this browser',
      }));
      return;
    }

    if (!state.registration) {
      console.warn('[PeriodicSyncContext] Service worker not registered');
      setState(prev => ({
        ...prev,
        error: 'Service worker is not registered',
      }));
      return;
    }

    try {
      console.log('[PeriodicSyncContext] Registering periodic sync');

      // Register periodic sync with the service worker
      const periodicSync = (state.registration as any).periodicSync;
      await periodicSync.register(DEFAULT_SYNC_TAG, {
        minInterval: state.preferences.frequency,
      });

      setState(prev => ({
        ...prev,
        isEnabled: true,
        currentSyncTag: DEFAULT_SYNC_TAG,
        error: null,
        nextScheduledSync: Date.now() + state.preferences.frequency,
      }));

      storage.set(STORAGE_KEYS.ENABLED, 'true');

      console.log('[PeriodicSyncContext] Periodic sync enabled');
    } catch (error) {
      console.error('[PeriodicSyncContext] Failed to enable periodic sync:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to enable periodic sync',
      }));
    }
  }, [state.isSupported, state.registration, state.preferences.frequency]);

  /**
   * Disable periodic sync
   */
  const disable = useCallback(async () => {
    if (!state.isSupported || !state.registration) {
      return;
    }

    try {
      console.log('[PeriodicSyncContext] Unregistering periodic sync');

      // Unregister periodic sync
      const periodicSync = (state.registration as any).periodicSync;
      await periodicSync.unregister(DEFAULT_SYNC_TAG);

      setState(prev => ({
        ...prev,
        isEnabled: false,
        currentSyncTag: null,
        nextScheduledSync: null,
        error: null,
      }));

      storage.set(STORAGE_KEYS.ENABLED, 'false');

      console.log('[PeriodicSyncContext] Periodic sync disabled');
    } catch (error) {
      console.error('[PeriodicSyncContext] Failed to disable periodic sync:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to disable periodic sync',
      }));
    }
  }, [state.isSupported, state.registration]);

  /**
   * Update preferences
   */
  const updatePreferences = useCallback(async (updates: Partial<PeriodicSyncPreferences>) => {
    setState(prev => {
      const newPreferences = { ...prev.preferences, ...updates };
      savePreferences(newPreferences);

      // Update next scheduled sync if frequency changed
      let nextScheduledSync = prev.nextScheduledSync;
      if (updates.frequency !== undefined && prev.isEnabled) {
        nextScheduledSync = Date.now() + newPreferences.frequency;
      }

      return {
        ...prev,
        preferences: newPreferences,
        nextScheduledSync,
      };
    });

    // If enabled and frequency changed, re-register with new interval
    if (state.isEnabled && updates.frequency !== undefined) {
      await disable();
      await enable();
    }

    console.log('[PeriodicSyncContext] Preferences updated:', updates);
  }, [state.isEnabled, enable, disable]);

  /**
   * Get statistics
   */
  const getStatistics = useCallback((): PeriodicSyncStatistics => {
    return { ...state.statistics };
  }, [state.statistics]);

  /**
   * Get sync history
   */
  const getSyncHistory = useCallback((): PeriodicSyncMetadata[] => {
    return Array.from(state.metadata.values())
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [state.metadata]);

  /**
   * Clear sync history
   */
  const clearSyncHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      metadata: new Map(),
    }));
    storage.remove(STORAGE_KEYS.METADATA);
    console.log('[PeriodicSyncContext] Sync history cleared');
  }, []);

  /**
   * Trigger manual sync (delegates to SyncContext)
   */
  const triggerManualSync = useCallback(async () => {
    console.log('[PeriodicSyncContext] Triggering manual sync');

    // Check conditions first
    const conditions = await checkConditions();
    if (!conditions.canSync) {
      console.warn('[PeriodicSyncContext] Cannot sync due to conditions:', conditions.reasons);
      setState(prev => ({
        ...prev,
        error: `Cannot sync: ${conditions.reasons.join(', ')}`,
      }));
      return;
    }

    // Delegate to existing sync context
    try {
      await syncContext.triggerSync();
      console.log('[PeriodicSyncContext] Manual sync completed');
    } catch (error) {
      console.error('[PeriodicSyncContext] Manual sync failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Manual sync failed',
      }));
    }
  }, [syncContext, checkConditions]);

  /**
   * Update sync interval
   */
  const updateInterval = useCallback(async (interval: SyncInterval) => {
    console.log('[PeriodicSyncContext] Updating sync interval:', interval);

    setState(prev => ({
      ...prev,
      syncInterval: interval,
      isUpdating: true,
    }));

    try {
      // Re-register with new interval if enabled
      if (state.isEnabled) {
        await disable();
        await enable();
      }

      setState(prev => ({
        ...prev,
        isUpdating: false,
      }));
    } catch (error) {
      console.error('[PeriodicSyncContext] Failed to update interval:', error);
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update interval',
      }));
    }
  }, [state.isEnabled, enable, disable]);

  /**
   * Trigger sync (alias for triggerManualSync)
   */
  const triggerSync = useCallback(async () => {
    await triggerManualSync();
  }, [triggerManualSync]);

  // Context value
  const value: PeriodicSyncContextValue = {
    ...state,
    enable,
    disable,
    updatePreferences,
    getStatistics,
    getSyncHistory,
    clearSyncHistory,
    triggerManualSync,
    checkConditions,
    updateInterval,
    triggerSync,
  };

  return (
    <PeriodicSyncContext.Provider value={value}>
      {children}
    </PeriodicSyncContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Custom hook to use periodic sync context
 * @throws Error if used outside of PeriodicSyncProvider
 */
export function usePeriodicSync(): PeriodicSyncContextValue {
  const context = useContext(PeriodicSyncContext);

  if (context === undefined) {
    throw new Error('usePeriodicSync must be used within a PeriodicSyncProvider');
  }

  return context;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if periodic sync is supported
 */
export function usePeriodicSyncSupport(): boolean {
  return isPeriodicSyncSupported();
}

/**
 * Hook to get sync statistics
 */
export function usePeriodicSyncStatistics() {
  const { statistics, getStatistics } = usePeriodicSync();
  return {
    statistics,
    getStatistics,
  };
}

/**
 * Hook to get sync history
 */
export function usePeriodicSyncHistory() {
  const { metadata, getSyncHistory, clearSyncHistory } = usePeriodicSync();
  return {
    history: getSyncHistory(),
    count: metadata.size,
    clearHistory: clearSyncHistory,
  };
}

/**
 * Hook for sync preferences management
 */
export function usePeriodicSyncPreferences() {
  const { preferences, updatePreferences } = usePeriodicSync();
  return {
    preferences,
    updatePreferences,
  };
}
