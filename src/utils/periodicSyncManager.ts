/**
 * Periodic Background Sync Manager
 *
 * This module provides a comprehensive management system for Periodic Background Sync,
 * enabling scheduled data synchronization even when the app is closed. It includes
 * intelligent sync strategies, battery/network awareness, and graceful fallbacks.
 *
 * ## Features
 *
 * - **Periodic Sync Registration**: Register and manage periodic background sync events
 * - **Browser Capability Detection**: Comprehensive feature detection for modern APIs
 * - **Smart Sync Strategies**: Battery-aware, network-aware, and engagement-based sync
 * - **User Preferences**: Configurable sync settings with localStorage persistence
 * - **Statistics Tracking**: Monitor sync performance and patterns
 * - **Fallback Strategies**: Graceful degradation for unsupported browsers
 * - **Integration**: Seamless coordination with existing OfflineQueue system
 * - **PWA Detection**: Automatically adjust behavior based on installation status
 * - **Type Safety**: Full TypeScript support with strict typing
 *
 * ## Usage
 *
 * ### Basic Setup
 *
 * ```typescript
 * import { PeriodicSyncManager } from './utils/periodicSyncManager';
 *
 * const syncManager = new PeriodicSyncManager();
 * await syncManager.init();
 *
 * // Register periodic sync
 * await syncManager.register('grocery-sync', {
 *   minInterval: 24 * 60 * 60 * 1000, // 24 hours
 *   requiresNetworkConnectivity: true,
 *   requiresPowerConnection: false
 * });
 * ```
 *
 * ### Using the React Hook
 *
 * ```typescript
 * import { usePeriodicSync } from './utils/periodicSyncManager';
 *
 * function MyComponent() {
 *   const {
 *     isSupported,
 *     isRegistered,
 *     preferences,
 *     statistics,
 *     registerSync,
 *     updatePreferences
 *   } = usePeriodicSync();
 *
 *   return (
 *     <div>
 *       <p>Periodic Sync: {isSupported ? 'Supported' : 'Not Supported'}</p>
 *       <p>Status: {isRegistered ? 'Active' : 'Inactive'}</p>
 *       <button onClick={() => registerSync('data-sync')}>Enable Sync</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Architecture
 *
 * The periodic sync system includes:
 * - **PeriodicSyncManager**: Core class managing periodic sync operations
 * - **usePeriodicSync**: React hook for component integration
 * - **Browser Capability Detection**: Detect support for various APIs
 * - **Smart Sync Strategies**: Adaptive sync based on device state
 * - **Statistics & Analytics**: Track sync performance
 * - **Fallback Mechanisms**: Polling and manual sync alternatives
 *
 * ## Browser Compatibility
 *
 * - **Periodic Background Sync API**: Chromium-based (Chrome 80+, Edge 80+)
 * - **Service Workers**: All modern browsers
 * - **Battery Status API**: Chrome, Opera (deprecated but still useful)
 * - **Network Information API**: Chrome, Edge, Opera
 * - **PWA Features**: All modern browsers with varying support
 *
 * The system automatically detects capabilities and provides appropriate fallbacks.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { getQueueManager } from './offlineQueue';
import type {
  NotificationPermission,
} from '../types/serviceWorker';

/**
 * Extended ServiceWorkerRegistration with PeriodicSync support
 */
export interface ServiceWorkerRegistrationWithPeriodicSync extends ServiceWorkerRegistration {
  readonly periodicSync: PeriodicSyncManager;
}

/**
 * PeriodicSyncManager interface for the Periodic Background Sync API
 */
export interface PeriodicSyncManager {
  /**
   * Register a periodic sync event
   */
  register(tag: string, options?: PeriodicSyncOptions): Promise<void>;

  /**
   * Unregister a periodic sync event
   */
  unregister(tag: string): Promise<void>;

  /**
   * Get all registered periodic sync tags
   */
  getTags(): Promise<string[]>;
}

/**
 * Options for registering a periodic sync
 */
export interface PeriodicSyncOptions {
  /**
   * Minimum interval between syncs in milliseconds
   */
  minInterval?: number;
}

/**
 * Configuration for periodic sync registration
 */
export interface PeriodicSyncConfig {
  /**
   * Minimum interval between syncs in milliseconds (default: 12 hours)
   */
  minInterval?: number;

  /**
   * Whether sync requires network connectivity (default: true)
   */
  requiresNetworkConnectivity?: boolean;

  /**
   * Whether sync requires power connection (default: false)
   */
  requiresPowerConnection?: boolean;

  /**
   * Whether to show notifications on sync completion (default: false)
   */
  showNotifications?: boolean;

  /**
   * Custom tag for this sync registration
   */
  tag?: string;
}

/**
 * User preferences for periodic sync
 */
export interface SyncPreferences {
  /**
   * Whether periodic sync is enabled
   */
  enabled: boolean;

  /**
   * Sync frequency preference
   */
  frequency: 'low' | 'medium' | 'high' | 'custom';

  /**
   * Custom interval in milliseconds (when frequency is 'custom')
   */
  customInterval?: number;

  /**
   * Whether to sync only on WiFi
   */
  wifiOnly: boolean;

  /**
   * Whether to sync only when charging
   */
  chargingOnly: boolean;

  /**
   * Whether to show sync notifications
   */
  showNotifications: boolean;

  /**
   * Whether to use adaptive sync based on engagement
   */
  adaptiveSync: boolean;

  /**
   * Battery threshold percentage (0-100) below which to skip sync
   */
  batteryThreshold: number;
}

/**
 * Statistics about sync operations
 */
export interface SyncStatistics {
  /**
   * Total number of syncs attempted
   */
  totalSyncs: number;

  /**
   * Number of successful syncs
   */
  successfulSyncs: number;

  /**
   * Number of failed syncs
   */
  failedSyncs: number;

  /**
   * Number of skipped syncs (due to battery, network, etc.)
   */
  skippedSyncs: number;

  /**
   * Last successful sync timestamp
   */
  lastSuccessfulSync?: number;

  /**
   * Last failed sync timestamp
   */
  lastFailedSync?: number;

  /**
   * Average sync duration in milliseconds
   */
  averageSyncDuration: number;

  /**
   * Total data synced in bytes (estimated)
   */
  totalDataSynced: number;

  /**
   * Last sync error message
   */
  lastError?: string;

  /**
   * User engagement score (0-100)
   */
  engagementScore: number;
}

/**
 * Browser capabilities for periodic sync and related features
 */
export interface ExtendedBrowserCapabilities {
  /**
   * Whether Periodic Background Sync API is supported
   */
  hasPeriodicBackgroundSync: boolean;

  /**
   * Whether Background Sync API is supported
   */
  hasBackgroundSync: boolean;

  /**
   * Whether Service Workers are supported
   */
  hasServiceWorker: boolean;

  /**
   * Whether the app is installed as a PWA
   */
  isPWA: boolean;

  /**
   * Whether Battery Status API is available
   */
  hasBatteryAPI: boolean;

  /**
   * Whether Network Information API is available
   */
  hasNetworkInformationAPI: boolean;

  /**
   * Whether Notifications API is supported
   */
  hasNotifications: boolean;

  /**
   * Current notification permission
   */
  notificationPermission: NotificationPermission;

  /**
   * Whether the browser is online
   */
  isOnline: boolean;

  /**
   * Whether IndexedDB is supported
   */
  hasIndexedDB: boolean;

  /**
   * Whether localStorage is supported
   */
  hasLocalStorage: boolean;
}

/**
 * Network information from Network Information API
 */
export interface NetworkInformation {
  /**
   * Effective connection type
   */
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';

  /**
   * Downlink speed in Mbps
   */
  downlink: number;

  /**
   * Round-trip time in milliseconds
   */
  rtt: number;

  /**
   * Whether data saver mode is enabled
   */
  saveData: boolean;

  /**
   * Connection type
   */
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
}

/**
 * Battery information from Battery Status API
 */
export interface BatteryInformation {
  /**
   * Current battery level (0-1)
   */
  level: number;

  /**
   * Whether the battery is charging
   */
  charging: boolean;

  /**
   * Time until battery is fully charged (seconds)
   */
  chargingTime: number;

  /**
   * Time until battery is fully discharged (seconds)
   */
  dischargingTime: number;
}

/**
 * Result of a sync strategy evaluation
 */
export interface SyncStrategyResult {
  /**
   * Whether sync should proceed
   */
  shouldSync: boolean;

  /**
   * Reason for the decision
   */
  reason: string;

  /**
   * Recommended delay before next sync attempt (ms)
   */
  recommendedDelay?: number;

  /**
   * Additional context for the decision
   */
  context?: Record<string, any>;
}

/**
 * Sync event for tracking
 */
export interface SyncEvent {
  /**
   * Unique identifier for this sync event
   */
  id: string;

  /**
   * Tag used for the sync
   */
  tag: string;

  /**
   * Timestamp when sync started
   */
  startTime: number;

  /**
   * Timestamp when sync completed
   */
  endTime?: number;

  /**
   * Duration in milliseconds
   */
  duration?: number;

  /**
   * Whether sync was successful
   */
  success: boolean;

  /**
   * Error message if sync failed
   */
  error?: string;

  /**
   * Number of items synced
   */
  itemsSynced?: number;

  /**
   * Estimated data size synced (bytes)
   */
  dataSize?: number;

  /**
   * Network state during sync
   */
  networkState?: Partial<NetworkInformation>;

  /**
   * Battery state during sync
   */
  batteryState?: Partial<BatteryInformation>;
}

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES: SyncPreferences = {
  enabled: true,
  frequency: 'medium',
  wifiOnly: false,
  chargingOnly: false,
  showNotifications: false,
  adaptiveSync: true,
  batteryThreshold: 15,
};

/**
 * Frequency mappings to intervals (in milliseconds)
 */
const FREQUENCY_INTERVALS = {
  low: 24 * 60 * 60 * 1000, // 24 hours
  medium: 12 * 60 * 60 * 1000, // 12 hours
  high: 6 * 60 * 60 * 1000, // 6 hours
};

/**
 * localStorage keys
 */
const STORAGE_KEYS = {
  PREFERENCES: 'grocery_periodic_sync_preferences',
  STATISTICS: 'grocery_periodic_sync_statistics',
  METADATA: 'grocery_periodic_sync_metadata',
  EVENTS: 'grocery_periodic_sync_events',
  ENGAGEMENT: 'grocery_periodic_sync_engagement',
};

/**
 * Default sync tag
 */
const DEFAULT_SYNC_TAG = 'grocery-periodic-sync';

/**
 * Maximum number of events to store
 */
const MAX_STORED_EVENTS = 100;

/**
 * Engagement tracking window (7 days)
 */
const ENGAGEMENT_WINDOW = 7 * 24 * 60 * 60 * 1000;

/**
 * Check if Periodic Background Sync API is supported
 */
export function hasPeriodicBackgroundSyncSupport(): boolean {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  return 'periodicSync' in ServiceWorkerRegistration.prototype;
}

/**
 * Check if the app is running as an installed PWA
 */
export function isPWAInstalled(): boolean {
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check if running in iOS standalone mode
  const isIOSStandalone = 'standalone' in navigator && (navigator as any).standalone === true;

  // Check if running in fullscreen mode
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;

  return isStandalone || isIOSStandalone || isFullscreen;
}

/**
 * Get network information if available
 */
export function getNetworkInformation(): NetworkInformation | null {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  if (!connection) {
    return null;
  }

  return {
    effectiveType: connection.effectiveType || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 50,
    saveData: connection.saveData || false,
    type: connection.type,
  };
}

/**
 * Get battery information if available
 */
export async function getBatteryInformation(): Promise<BatteryInformation | null> {
  if (!('getBattery' in navigator)) {
    return null;
  }

  try {
    const battery = await (navigator as any).getBattery();

    return {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
    };
  } catch (error) {
    console.warn('[PeriodicSync] Failed to get battery information:', error);
    return null;
  }
}

/**
 * Get extended browser capabilities
 */
export function getExtendedBrowserCapabilities(): ExtendedBrowserCapabilities {
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasBackgroundSync = hasServiceWorker && 'sync' in ServiceWorkerRegistration.prototype;
  const hasPeriodicBackgroundSync = hasPeriodicBackgroundSyncSupport();
  const isPWA = isPWAInstalled();
  const hasBatteryAPI = 'getBattery' in navigator;
  const hasNetworkInformationAPI = 'connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator;
  const hasNotifications = 'Notification' in window;
  const hasIndexedDB = 'indexedDB' in window;
  const hasLocalStorage = (() => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  })();

  return {
    hasPeriodicBackgroundSync,
    hasBackgroundSync,
    hasServiceWorker,
    isPWA,
    hasBatteryAPI,
    hasNetworkInformationAPI,
    hasNotifications,
    notificationPermission: hasNotifications ? (Notification.permission as NotificationPermission) : 'denied',
    isOnline: navigator.onLine,
    hasIndexedDB,
    hasLocalStorage,
  };
}

/**
 * PeriodicSyncManager Class
 *
 * Manages periodic background sync registration, coordination, and fallback strategies.
 * Integrates with the existing OfflineQueue system and provides intelligent sync decisions
 * based on battery, network, and user engagement.
 */
export class PeriodicSyncManager {
  private preferences: SyncPreferences;
  private statistics: SyncStatistics;
  private capabilities: ExtendedBrowserCapabilities;
  private isInitialized = false;
  private fallbackInterval: number | null = null;
  private engagementTracking: {
    lastActive: number;
    sessionCount: number;
    totalActiveTime: number;
  };

  /**
   * Create a new PeriodicSyncManager
   */
  constructor() {
    this.preferences = this.loadPreferences();
    this.statistics = this.loadStatistics();
    this.capabilities = getExtendedBrowserCapabilities();
    this.engagementTracking = this.loadEngagementTracking();

    console.log('[PeriodicSync] Manager created with capabilities:', this.capabilities);
  }

  /**
   * Initialize the periodic sync manager
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('[PeriodicSync] Already initialized');
      return;
    }

    console.log('[PeriodicSync] Initializing...');

    // Track engagement
    this.startEngagementTracking();

    // Set up service worker message handling
    if (this.capabilities.hasServiceWorker) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
    }

    // Set up online/offline handlers
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Set up visibility change handler for engagement tracking
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Initialize fallback if periodic sync not supported
    if (!this.capabilities.hasPeriodicBackgroundSync && this.preferences.enabled) {
      console.log('[PeriodicSync] Periodic Background Sync not supported, using fallback');
      this.initializeFallback();
    }

    // Request notification permission if needed
    if (this.preferences.showNotifications && this.capabilities.hasNotifications) {
      await this.requestNotificationPermission();
    }

    this.isInitialized = true;
    console.log('[PeriodicSync] Initialization complete');
  }

  /**
   * Register a periodic sync
   */
  public async register(tag: string = DEFAULT_SYNC_TAG, config: PeriodicSyncConfig = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (!this.preferences.enabled) {
      console.log('[PeriodicSync] Sync disabled by user preferences');
      return;
    }

    console.log('[PeriodicSync] Registering periodic sync:', tag);

    if (this.capabilities.hasPeriodicBackgroundSync) {
      try {
        const registration = await navigator.serviceWorker.ready as unknown as ServiceWorkerRegistrationWithPeriodicSync;

        if (!registration.periodicSync) {
          throw new Error('PeriodicSync not available on registration');
        }

        const minInterval = config.minInterval || this.getIntervalFromPreferences();

        await registration.periodicSync.register(tag, {
          minInterval,
        });

        console.log('[PeriodicSync] Periodic sync registered successfully:', tag, 'interval:', minInterval);

        // Save metadata
        this.saveMetadata({
          tag,
          registeredAt: Date.now(),
          config,
        });

        // Show notification if enabled
        if (this.preferences.showNotifications) {
          await this.showNotification('Sync Enabled', 'Background sync has been enabled for your grocery list.');
        }
      } catch (error) {
        console.error('[PeriodicSync] Failed to register periodic sync:', error);
        throw error;
      }
    } else {
      console.log('[PeriodicSync] Using fallback registration');
      this.saveMetadata({
        tag,
        registeredAt: Date.now(),
        config,
        fallback: true,
      });
    }
  }

  /**
   * Unregister a periodic sync
   */
  public async unregister(tag: string = DEFAULT_SYNC_TAG): Promise<void> {
    console.log('[PeriodicSync] Unregistering periodic sync:', tag);

    if (this.capabilities.hasPeriodicBackgroundSync) {
      try {
        const registration = await navigator.serviceWorker.ready as unknown as ServiceWorkerRegistrationWithPeriodicSync;

        if (registration.periodicSync) {
          await registration.periodicSync.unregister(tag);
          console.log('[PeriodicSync] Periodic sync unregistered:', tag);
        }
      } catch (error) {
        console.error('[PeriodicSync] Failed to unregister periodic sync:', error);
        throw error;
      }
    }

    // Clear metadata
    this.clearMetadata(tag);

    // Stop fallback if running
    this.stopFallback();
  }

  /**
   * Get all registered periodic sync tags
   */
  public async getTags(): Promise<string[]> {
    if (!this.capabilities.hasPeriodicBackgroundSync) {
      // Return tags from metadata
      const metadata = this.loadMetadata();
      return Object.keys(metadata);
    }

    try {
      const registration = await navigator.serviceWorker.ready as unknown as ServiceWorkerRegistrationWithPeriodicSync;

      if (!registration.periodicSync) {
        return [];
      }

      const tags = await registration.periodicSync.getTags();
      return tags;
    } catch (error) {
      console.error('[PeriodicSync] Failed to get sync tags:', error);
      return [];
    }
  }

  /**
   * Check browser support for Periodic Background Sync
   */
  public checkSupport(): boolean {
    return this.capabilities.hasPeriodicBackgroundSync;
  }

  /**
   * Get user preferences
   */
  public getPreferences(): SyncPreferences {
    return { ...this.preferences };
  }

  /**
   * Set user preferences
   */
  public async setPreferences(updates: Partial<SyncPreferences>): Promise<void> {
    console.log('[PeriodicSync] Updating preferences:', updates);

    const oldPreferences = { ...this.preferences };
    this.preferences = {
      ...this.preferences,
      ...updates,
    };

    this.savePreferences();

    // Handle preference changes
    if (updates.enabled !== undefined && updates.enabled !== oldPreferences.enabled) {
      if (updates.enabled) {
        // Enable sync
        await this.register();
      } else {
        // Disable sync
        const tags = await this.getTags();
        for (const tag of tags) {
          await this.unregister(tag);
        }
      }
    }

    // Handle frequency changes
    if (updates.frequency && updates.frequency !== oldPreferences.frequency) {
      // Re-register with new interval
      const tags = await this.getTags();
      for (const tag of tags) {
        await this.register(tag);
      }
    }

    // Handle fallback changes
    if (!this.capabilities.hasPeriodicBackgroundSync) {
      if (this.preferences.enabled && !this.fallbackInterval) {
        this.initializeFallback();
      } else if (!this.preferences.enabled && this.fallbackInterval) {
        this.stopFallback();
      }
    }

    console.log('[PeriodicSync] Preferences updated');
  }

  /**
   * Get sync statistics
   */
  public getStatistics(): SyncStatistics {
    return { ...this.statistics };
  }

  /**
   * Get browser capabilities
   */
  public getCapabilities(): ExtendedBrowserCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Evaluate whether sync should proceed based on current conditions
   */
  public async evaluateSyncStrategy(): Promise<SyncStrategyResult> {
    console.log('[PeriodicSync] Evaluating sync strategy...');

    // Check if user disabled sync
    if (!this.preferences.enabled) {
      return {
        shouldSync: false,
        reason: 'Sync disabled by user',
      };
    }

    // Check online status
    if (!navigator.onLine) {
      return {
        shouldSync: false,
        reason: 'Device is offline',
        recommendedDelay: 60000, // Check again in 1 minute
      };
    }

    // Check network conditions
    const networkInfo = getNetworkInformation();
    if (networkInfo) {
      // Skip if data saver is enabled
      if (networkInfo.saveData) {
        return {
          shouldSync: false,
          reason: 'Data saver mode is enabled',
          context: { networkInfo },
        };
      }

      // Check WiFi requirement
      if (this.preferences.wifiOnly && networkInfo.type !== 'wifi') {
        return {
          shouldSync: false,
          reason: 'WiFi-only mode enabled, not on WiFi',
          context: { networkInfo },
        };
      }

      // Skip on very slow connections
      if (['slow-2g', '2g'].includes(networkInfo.effectiveType)) {
        return {
          shouldSync: false,
          reason: 'Connection too slow for sync',
          recommendedDelay: 300000, // Check again in 5 minutes
          context: { networkInfo },
        };
      }
    }

    // Check battery conditions
    const batteryInfo = await getBatteryInformation();
    if (batteryInfo) {
      // Check charging requirement
      if (this.preferences.chargingOnly && !batteryInfo.charging) {
        return {
          shouldSync: false,
          reason: 'Charging-only mode enabled, not charging',
          context: { batteryInfo },
        };
      }

      // Check battery threshold
      const batteryPercent = batteryInfo.level * 100;
      if (!batteryInfo.charging && batteryPercent < this.preferences.batteryThreshold) {
        return {
          shouldSync: false,
          reason: `Battery too low (${batteryPercent.toFixed(0)}%)`,
          recommendedDelay: 600000, // Check again in 10 minutes
          context: { batteryInfo },
        };
      }
    }

    // Check adaptive sync
    if (this.preferences.adaptiveSync) {
      const engagementScore = this.calculateEngagementScore();

      // Lower engagement = less frequent sync
      if (engagementScore < 20) {
        // Low engagement, sync less frequently
        const timeSinceLastSync = this.statistics.lastSuccessfulSync
          ? Date.now() - this.statistics.lastSuccessfulSync
          : Infinity;

        const requiredInterval = 24 * 60 * 60 * 1000; // 24 hours for low engagement

        if (timeSinceLastSync < requiredInterval) {
          return {
            shouldSync: false,
            reason: 'Low engagement, deferring sync',
            recommendedDelay: requiredInterval - timeSinceLastSync,
            context: { engagementScore, timeSinceLastSync },
          };
        }
      }
    }

    // All checks passed
    return {
      shouldSync: true,
      reason: 'All conditions met for sync',
      context: {
        networkInfo,
        batteryInfo,
        engagementScore: this.calculateEngagementScore(),
      },
    };
  }

  /**
   * Perform a sync operation
   * This coordinates with the OfflineQueue to process pending items
   */
  public async performSync(tag: string): Promise<void> {
    console.log('[PeriodicSync] Starting sync operation:', tag);

    const syncEvent: SyncEvent = {
      id: nanoid(),
      tag,
      startTime: Date.now(),
      success: false,
    };

    // Get network and battery info
    const networkInfo = getNetworkInformation();
    const batteryInfo = await getBatteryInformation();

    if (networkInfo) {
      syncEvent.networkState = networkInfo;
    }
    if (batteryInfo) {
      syncEvent.batteryState = batteryInfo;
    }

    try {
      // Evaluate sync strategy
      const strategy = await this.evaluateSyncStrategy();

      if (!strategy.shouldSync) {
        console.log('[PeriodicSync] Sync skipped:', strategy.reason);
        this.statistics.skippedSyncs++;
        this.saveStatistics();
        return;
      }

      // Get the offline queue manager
      const queueManager = getQueueManager();

      // Check if there's anything to sync
      const queueStatus = queueManager.getStatus();
      const hasPendingItems = queueStatus.pending > 0 || queueStatus.failed > 0;

      if (!hasPendingItems) {
        console.log('[PeriodicSync] No pending items to sync');
        syncEvent.success = true;
        syncEvent.itemsSynced = 0;
      } else {
        // Process the queue
        const result = await queueManager.processQueue();

        syncEvent.success = result.failedCount === 0;
        syncEvent.itemsSynced = result.successCount;
        syncEvent.dataSize = result.successCount * 500; // Estimate 500 bytes per item

        console.log('[PeriodicSync] Sync completed:', result);
      }

      // Update statistics
      this.statistics.totalSyncs++;
      if (syncEvent.success) {
        this.statistics.successfulSyncs++;
        this.statistics.lastSuccessfulSync = Date.now();
      } else {
        this.statistics.failedSyncs++;
        this.statistics.lastFailedSync = Date.now();
      }

      // Show notification if enabled and there were items synced
      if (this.preferences.showNotifications && syncEvent.itemsSynced && syncEvent.itemsSynced > 0) {
        await this.showNotification(
          'Sync Complete',
          `Synced ${syncEvent.itemsSynced} item${syncEvent.itemsSynced > 1 ? 's' : ''} to your grocery list.`
        );
      }
    } catch (error) {
      console.error('[PeriodicSync] Sync failed:', error);
      syncEvent.success = false;
      syncEvent.error = error instanceof Error ? error.message : 'Unknown error';

      this.statistics.totalSyncs++;
      this.statistics.failedSyncs++;
      this.statistics.lastFailedSync = Date.now();
      this.statistics.lastError = syncEvent.error;
    }

    // Record sync completion
    syncEvent.endTime = Date.now();
    syncEvent.duration = syncEvent.endTime - syncEvent.startTime;

    // Update average duration
    if (syncEvent.success && syncEvent.duration) {
      const totalDuration = this.statistics.averageSyncDuration * (this.statistics.successfulSyncs - 1) + syncEvent.duration;
      this.statistics.averageSyncDuration = Math.round(totalDuration / this.statistics.successfulSyncs);
    }

    // Update total data synced
    if (syncEvent.dataSize) {
      this.statistics.totalDataSynced += syncEvent.dataSize;
    }

    // Save statistics and event
    this.saveStatistics();
    this.saveEvent(syncEvent);

    console.log('[PeriodicSync] Sync operation complete:', syncEvent);
  }

  /**
   * Implement fallback strategy for browsers without Periodic Sync support
   */
  public fallbackStrategy(): void {
    console.log('[PeriodicSync] Executing fallback strategy');

    if (!this.capabilities.hasPeriodicBackgroundSync) {
      console.log('[PeriodicSync] Using polling-based fallback');
      this.initializeFallback();
    } else {
      console.log('[PeriodicSync] Periodic Background Sync supported, no fallback needed');
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.capabilities.hasNotifications) {
      console.warn('[PeriodicSync] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermission;
    } catch (error) {
      console.error('[PeriodicSync] Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Reset statistics
   */
  public resetStatistics(): void {
    this.statistics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      skippedSyncs: 0,
      averageSyncDuration: 0,
      totalDataSynced: 0,
      engagementScore: 50,
    };
    this.saveStatistics();
    console.log('[PeriodicSync] Statistics reset');
  }

  /**
   * Get recent sync events
   */
  public getRecentEvents(limit: number = 10): SyncEvent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (!stored) return [];

      const events: SyncEvent[] = JSON.parse(stored);
      return events.slice(-limit).reverse(); // Return most recent first
    } catch (error) {
      console.error('[PeriodicSync] Failed to load events:', error);
      return [];
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    console.log('[PeriodicSync] Destroying periodic sync manager');

    this.stopFallback();
    this.stopEngagementTracking();

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.capabilities.hasServiceWorker) {
      navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
    }

    this.isInitialized = false;
    console.log('[PeriodicSync] Manager destroyed');
  }

  // Private methods

  /**
   * Initialize fallback polling mechanism
   */
  private initializeFallback(): void {
    if (this.fallbackInterval) {
      console.log('[PeriodicSync] Fallback already initialized');
      return;
    }

    const interval = this.getIntervalFromPreferences();
    console.log(`[PeriodicSync] Starting fallback polling with ${interval}ms interval`);

    this.fallbackInterval = window.setInterval(async () => {
      try {
        await this.performSync(DEFAULT_SYNC_TAG);
      } catch (error) {
        console.error('[PeriodicSync] Fallback sync failed:', error);
      }
    }, interval);
  }

  /**
   * Stop fallback polling
   */
  private stopFallback(): void {
    if (this.fallbackInterval) {
      window.clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
      console.log('[PeriodicSync] Fallback polling stopped');
    }
  }

  /**
   * Get interval from user preferences
   */
  private getIntervalFromPreferences(): number {
    if (this.preferences.frequency === 'custom' && this.preferences.customInterval) {
      return this.preferences.customInterval;
    }

    const frequency = this.preferences.frequency;
    if (frequency === 'custom') {
      return FREQUENCY_INTERVALS.medium;
    }

    return FREQUENCY_INTERVALS[frequency] || FREQUENCY_INTERVALS.medium;
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage = (event: MessageEvent): void => {
    const { type, payload } = event.data;

    switch (type) {
      case 'PERIODIC_SYNC_TRIGGERED':
        console.log('[PeriodicSync] Received sync trigger from service worker:', payload);
        break;

      case 'PERIODIC_SYNC_COMPLETE':
        console.log('[PeriodicSync] Sync completed in service worker:', payload);
        // Reload statistics
        this.statistics = this.loadStatistics();
        break;

      case 'PERIODIC_SYNC_FAILED':
        console.error('[PeriodicSync] Sync failed in service worker:', payload);
        break;

      default:
        // Ignore unknown messages
        break;
    }
  };

  /**
   * Handle online event
   */
  private handleOnline = async (): Promise<void> => {
    console.log('[PeriodicSync] Device is online');
    this.capabilities.isOnline = true;

    // Trigger immediate sync if there are pending items
    const queueManager = getQueueManager();
    const queueStatus = queueManager.getStatus();

    if (queueStatus.pending > 0 || queueStatus.failed > 0) {
      console.log('[PeriodicSync] Triggering immediate sync due to pending items');
      try {
        await this.performSync(DEFAULT_SYNC_TAG);
      } catch (error) {
        console.error('[PeriodicSync] Failed to sync on online event:', error);
      }
    }
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('[PeriodicSync] Device is offline');
    this.capabilities.isOnline = false;
  };

  /**
   * Handle visibility change for engagement tracking
   */
  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      // App became inactive
      this.recordEngagement('inactive');
    } else {
      // App became active
      this.recordEngagement('active');
    }
  };

  /**
   * Start engagement tracking
   */
  private startEngagementTracking(): void {
    this.recordEngagement('active');
  }

  /**
   * Stop engagement tracking
   */
  private stopEngagementTracking(): void {
    this.recordEngagement('inactive');
  }

  /**
   * Record user engagement
   */
  private recordEngagement(type: 'active' | 'inactive'): void {
    const now = Date.now();

    if (type === 'active') {
      this.engagementTracking.lastActive = now;
      this.engagementTracking.sessionCount++;
    } else {
      // Calculate session duration
      const sessionDuration = now - this.engagementTracking.lastActive;
      this.engagementTracking.totalActiveTime += sessionDuration;
    }

    this.saveEngagementTracking();

    // Update engagement score
    this.statistics.engagementScore = this.calculateEngagementScore();
    this.saveStatistics();
  }

  /**
   * Calculate user engagement score (0-100)
   */
  private calculateEngagementScore(): number {
    const now = Date.now();

    // Load engagement tracking
    const engagement = this.loadEngagementTracking();

    // Calculate sessions in window
    const recentSessions = engagement.sessionCount;

    // Calculate average session length
    const avgSessionLength = engagement.sessionCount > 0
      ? engagement.totalActiveTime / engagement.sessionCount
      : 0;

    // Calculate time since last active
    const timeSinceActive = now - engagement.lastActive;

    // Score components (0-100)
    let score = 0;

    // Sessions per day (max 40 points)
    const sessionsPerDay = (recentSessions / 7) * 10;
    score += Math.min(40, sessionsPerDay);

    // Average session length (max 30 points)
    // 1 minute = 10 points, 3 minutes = 30 points
    const sessionScore = Math.min(30, (avgSessionLength / 60000) * 10);
    score += sessionScore;

    // Recency (max 30 points)
    // Active within 1 hour = 30 points, 24 hours = 15 points, 7 days = 0 points
    const recencyScore = Math.max(0, 30 * (1 - timeSinceActive / ENGAGEMENT_WINDOW));
    score += recencyScore;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Show a notification
   */
  private async showNotification(title: string, body: string): Promise<void> {
    if (!this.capabilities.hasNotifications || Notification.permission !== 'granted') {
      return;
    }

    try {
      if (this.capabilities.hasServiceWorker) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-96.png',
          tag: 'periodic-sync',
        });
      } else {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
        });
      }
    } catch (error) {
      console.error('[PeriodicSync] Failed to show notification:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): SyncPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[PeriodicSync] Failed to load preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('[PeriodicSync] Failed to save preferences:', error);
    }
  }

  /**
   * Load statistics from localStorage
   */
  private loadStatistics(): SyncStatistics {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STATISTICS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[PeriodicSync] Failed to load statistics:', error);
    }

    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      skippedSyncs: 0,
      averageSyncDuration: 0,
      totalDataSynced: 0,
      engagementScore: 50,
    };
  }

  /**
   * Save statistics to localStorage
   */
  private saveStatistics(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(this.statistics));
    } catch (error) {
      console.error('[PeriodicSync] Failed to save statistics:', error);
    }
  }

  /**
   * Load metadata from localStorage
   */
  private loadMetadata(): Record<string, any> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.METADATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[PeriodicSync] Failed to load metadata:', error);
    }
    return {};
  }

  /**
   * Save metadata to localStorage
   */
  private saveMetadata(data: any): void {
    try {
      const metadata = this.loadMetadata();
      metadata[data.tag] = data;
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('[PeriodicSync] Failed to save metadata:', error);
    }
  }

  /**
   * Clear metadata for a specific tag
   */
  private clearMetadata(tag: string): void {
    try {
      const metadata = this.loadMetadata();
      delete metadata[tag];
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('[PeriodicSync] Failed to clear metadata:', error);
    }
  }

  /**
   * Save sync event
   */
  private saveEvent(event: SyncEvent): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      let events: SyncEvent[] = stored ? JSON.parse(stored) : [];

      events.push(event);

      // Limit stored events
      if (events.length > MAX_STORED_EVENTS) {
        events = events.slice(-MAX_STORED_EVENTS);
      }

      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error('[PeriodicSync] Failed to save event:', error);
    }
  }

  /**
   * Load engagement tracking data
   */
  private loadEngagementTracking(): { lastActive: number; sessionCount: number; totalActiveTime: number } {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENGAGEMENT);
      if (stored) {
        const data = JSON.parse(stored);
        // Reset if data is older than engagement window
        if (Date.now() - data.lastActive > ENGAGEMENT_WINDOW) {
          return { lastActive: Date.now(), sessionCount: 0, totalActiveTime: 0 };
        }
        return data;
      }
    } catch (error) {
      console.error('[PeriodicSync] Failed to load engagement tracking:', error);
    }
    return { lastActive: Date.now(), sessionCount: 0, totalActiveTime: 0 };
  }

  /**
   * Save engagement tracking data
   */
  private saveEngagementTracking(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENGAGEMENT, JSON.stringify(this.engagementTracking));
    } catch (error) {
      console.error('[PeriodicSync] Failed to save engagement tracking:', error);
    }
  }
}

/**
 * Singleton instance
 */
let periodicSyncManagerInstance: PeriodicSyncManager | null = null;

/**
 * Get the singleton periodic sync manager instance
 */
export function getPeriodicSyncManager(): PeriodicSyncManager {
  if (!periodicSyncManagerInstance) {
    periodicSyncManagerInstance = new PeriodicSyncManager();
  }
  return periodicSyncManagerInstance;
}

/**
 * React hook for using periodic sync in components
 */
export function usePeriodicSync() {
  const manager = useMemo(() => getPeriodicSyncManager(), []);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [capabilities, setCapabilities] = useState<ExtendedBrowserCapabilities | null>(null);
  const [preferences, setPreferences] = useState<SyncPreferences | null>(null);
  const [statistics, setStatistics] = useState<SyncStatistics | null>(null);
  const [registeredTags, setRegisteredTags] = useState<string[]>([]);
  const [recentEvents, setRecentEvents] = useState<SyncEvent[]>([]);

  // Initialize manager
  useEffect(() => {
    const init = async () => {
      await manager.init();
      setIsInitialized(true);
      setIsSupported(manager.checkSupport());
      setCapabilities(manager.getCapabilities());
      setPreferences(manager.getPreferences());
      setStatistics(manager.getStatistics());

      const tags = await manager.getTags();
      setRegisteredTags(tags);

      const events = manager.getRecentEvents(10);
      setRecentEvents(events);
    };

    init();

    // Cleanup on unmount
    return () => {
      // Don't destroy the singleton, just clean up local state
    };
  }, [manager]);

  // Refresh data periodically
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(async () => {
      setPreferences(manager.getPreferences());
      setStatistics(manager.getStatistics());
      const tags = await manager.getTags();
      setRegisteredTags(tags);
      const events = manager.getRecentEvents(10);
      setRecentEvents(events);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isInitialized, manager]);

  /**
   * Register a periodic sync
   */
  const registerSync = useCallback(async (tag: string = DEFAULT_SYNC_TAG, config?: PeriodicSyncConfig) => {
    await manager.register(tag, config);
    const tags = await manager.getTags();
    setRegisteredTags(tags);
  }, [manager]);

  /**
   * Unregister a periodic sync
   */
  const unregisterSync = useCallback(async (tag: string = DEFAULT_SYNC_TAG) => {
    await manager.unregister(tag);
    const tags = await manager.getTags();
    setRegisteredTags(tags);
  }, [manager]);

  /**
   * Update preferences
   */
  const updatePreferences = useCallback(async (updates: Partial<SyncPreferences>) => {
    await manager.setPreferences(updates);
    setPreferences(manager.getPreferences());
  }, [manager]);

  /**
   * Trigger manual sync
   */
  const triggerSync = useCallback(async () => {
    await manager.performSync(DEFAULT_SYNC_TAG);
    setStatistics(manager.getStatistics());
    const events = manager.getRecentEvents(10);
    setRecentEvents(events);
  }, [manager]);

  /**
   * Evaluate sync strategy
   */
  const evaluateStrategy = useCallback(async () => {
    return await manager.evaluateSyncStrategy();
  }, [manager]);

  /**
   * Reset statistics
   */
  const resetStats = useCallback(() => {
    manager.resetStatistics();
    setStatistics(manager.getStatistics());
  }, [manager]);

  /**
   * Request notification permission
   */
  const requestNotifications = useCallback(async () => {
    const permission = await manager.requestNotificationPermission();
    setCapabilities(manager.getCapabilities());
    return permission;
  }, [manager]);

  // Derived state
  const isRegistered = registeredTags.length > 0;
  const isEnabled = preferences?.enabled ?? false;
  const canUsePeriodicSync = capabilities?.hasPeriodicBackgroundSync ?? false;
  const isPWA = capabilities?.isPWA ?? false;

  return {
    // State
    isInitialized,
    isSupported,
    isRegistered,
    isEnabled,
    canUsePeriodicSync,
    isPWA,
    capabilities,
    preferences,
    statistics,
    registeredTags,
    recentEvents,

    // Actions
    registerSync,
    unregisterSync,
    updatePreferences,
    triggerSync,
    evaluateStrategy,
    resetStats,
    requestNotifications,

    // Direct access
    manager,
  };
}
