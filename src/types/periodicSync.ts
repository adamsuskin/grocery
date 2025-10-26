/**
 * Periodic Background Sync API Type Definitions
 *
 * This module provides comprehensive TypeScript definitions for the Periodic Background
 * Sync API, which enables web applications to periodically synchronize data in the
 * background even when the app is not running.
 *
 * ## Browser Compatibility
 *
 * - **Periodic Background Sync API**: Chromium-based browsers only
 *   - Chrome 80+ (Android)
 *   - Edge 80+
 *   - Opera 67+
 * - **Requirements**:
 *   - HTTPS connection (secure origin)
 *   - Service Worker registered
 *   - PWA installed (added to home screen)
 * - **Minimum Interval**: 12 hours (browser enforced)
 * - **Not Supported**: Firefox, Safari, iOS browsers
 *
 * ## Usage Notes
 *
 * - Always feature-detect the API before using it
 * - Browser may adjust sync frequency based on usage patterns and battery level
 * - Syncs may be delayed or skipped if device is low on battery
 * - Network conditions affect when sync actually occurs
 * - User may disable background sync in browser settings
 *
 * @see https://developer.chrome.com/docs/capabilities/periodic-background-sync
 */

// ============================================================================
// Periodic Sync Manager Interface
// ============================================================================

/**
 * Tag identifier for a periodic sync registration
 *
 * Must be unique within the service worker scope. Use descriptive names
 * that indicate the purpose of the sync.
 */
export type PeriodicSyncTag = string;

/**
 * PeriodicSyncManager interface for Periodic Background Sync API
 *
 * The PeriodicSyncManager interface provides methods for registering,
 * querying, and unregistering periodic sync events.
 */
export interface PeriodicSyncManager {
  /**
   * Register a periodic sync event with the given tag and options
   *
   * The browser will attempt to fire periodic sync events at approximately
   * the requested interval. The actual interval may be adjusted based on
   * device state, battery level, and usage patterns.
   *
   * @param tag - Unique identifier for this periodic sync
   * @param options - Configuration options for the periodic sync
   * @returns Promise that resolves when the sync is registered
   * @throws {TypeError} If tag is invalid or options are malformed
   * @throws {DOMException} If permission is denied or PWA not installed
   */
  register(tag: PeriodicSyncTag, options?: PeriodicSyncRegistrationOptions): Promise<void>;

  /**
   * Get all registered periodic sync tags
   *
   * @returns Promise that resolves to an array of registered tag names
   */
  getTags(): Promise<PeriodicSyncTag[]>;

  /**
   * Unregister a periodic sync event
   *
   * @param tag - Tag identifier of the sync to unregister
   * @returns Promise that resolves when the sync is unregistered
   */
  unregister(tag: PeriodicSyncTag): Promise<void>;
}

/**
 * Options for registering a periodic sync
 */
export interface PeriodicSyncRegistrationOptions {
  /**
   * Minimum interval between sync events in milliseconds
   *
   * The browser enforces a minimum of 12 hours (43200000 ms).
   * Actual sync frequency may be less frequent based on usage patterns.
   *
   * @minimum 43200000 (12 hours)
   * @default 86400000 (24 hours)
   */
  minInterval: number;
}

// ============================================================================
// Service Worker Registration Extension
// ============================================================================

/**
 * Extended ServiceWorkerRegistration interface with PeriodicSyncManager
 *
 * This extends the standard ServiceWorkerRegistration to include
 * the periodicSync property for Periodic Background Sync API access.
 */
export interface ServiceWorkerRegistrationWithPeriodicSync extends ServiceWorkerRegistration {
  /**
   * PeriodicSyncManager instance for registering periodic background sync events
   *
   * This property is only available in Chromium-based browsers and requires
   * the PWA to be installed.
   */
  readonly periodicSync: PeriodicSyncManager;
}

// ============================================================================
// Periodic Sync Event
// ============================================================================

/**
 * PeriodicSyncEvent dispatched to service worker during periodic sync
 *
 * This event is fired in the service worker when a registered periodic sync
 * should be processed. The browser determines when to fire this event based
 * on various factors including battery level, network conditions, and usage patterns.
 */
export interface PeriodicSyncEvent extends ExtendableEvent {
  /**
   * The tag identifying this periodic sync event
   */
  readonly tag: PeriodicSyncTag;
}

/**
 * Periodic Sync event handler type
 *
 * Handler should return a promise that resolves when sync is complete.
 * If the promise rejects, the browser may retry the sync.
 */
export type PeriodicSyncEventHandler = (event: PeriodicSyncEvent) => void | Promise<void>;

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration options for periodic background sync feature
 */
export interface PeriodicSyncConfig {
  /**
   * Default tag to use for periodic sync registrations
   */
  defaultTag: string;

  /**
   * Minimum sync interval in milliseconds
   *
   * Must be at least 12 hours (43200000 ms) per browser requirements.
   * Recommended: 24 hours for most use cases.
   *
   * @minimum 43200000
   * @default 86400000
   */
  minInterval: number;

  /**
   * Whether to automatically register periodic sync on PWA install
   *
   * When true, periodic sync will be registered as soon as the app
   * detects that it's installed as a PWA.
   *
   * @default true
   */
  autoRegister: boolean;

  /**
   * Whether to show notifications after successful sync
   *
   * @default false
   */
  showNotifications: boolean;

  /**
   * Maximum duration for a sync operation in milliseconds
   *
   * If sync takes longer than this, it should be cancelled to avoid
   * excessive battery usage.
   *
   * @default 30000 (30 seconds)
   */
  maxSyncDuration: number;

  /**
   * Whether to respect user's data saver mode
   *
   * When true, reduce sync frequency or skip sync if data saver is enabled.
   *
   * @default true
   */
  respectDataSaver: boolean;

  /**
   * Whether to check battery level before syncing
   *
   * When true, skip sync if battery is low.
   *
   * @default true
   */
  checkBatteryLevel: boolean;

  /**
   * Minimum battery level (0-1) required for sync
   *
   * If battery is below this level, sync will be skipped.
   *
   * @default 0.15 (15%)
   */
  minBatteryLevel: number;

  /**
   * Network types allowed for sync
   *
   * @default ['wifi', '4g', '5g']
   */
  allowedNetworkTypes: NetworkType[];

  /**
   * Whether to enable smart sync strategy
   *
   * When true, adjust sync behavior based on usage patterns and device state.
   *
   * @default true
   */
  enableSmartSync: boolean;
}

/**
 * Network connection type
 */
export type NetworkType = 'wifi' | 'ethernet' | '4g' | '5g' | '3g' | '2g' | 'slow-2g' | 'cellular' | 'unknown';

/**
 * Network connection effective type
 */
export type EffectiveNetworkType = 'slow-2g' | '2g' | '3g' | '4g';

// ============================================================================
// User Preferences
// ============================================================================

/**
 * User preferences for periodic background sync
 *
 * These settings allow users to control when and how often
 * background sync occurs.
 */
export interface PeriodicSyncPreferences {
  /**
   * Whether periodic sync is enabled
   *
   * @default true
   */
  enabled: boolean;

  /**
   * Preferred sync frequency
   *
   * @default 'daily'
   */
  frequency: PeriodicSyncFrequency;

  /**
   * Only sync when connected to WiFi
   *
   * @default false
   */
  wifiOnly: boolean;

  /**
   * Only sync when device is charging
   *
   * @default false
   */
  chargingOnly: boolean;

  /**
   * Respect device's battery saver mode
   *
   * @default true
   */
  respectBatterySaver: boolean;

  /**
   * Respect device's data saver mode
   *
   * @default true
   */
  respectDataSaver: boolean;

  /**
   * Quiet hours: don't sync during these hours
   *
   * Format: { start: 22, end: 7 } means no sync between 10 PM and 7 AM
   */
  quietHours?: {
    /** Start hour (0-23) */
    start: number;
    /** End hour (0-23) */
    end: number;
    /** Whether quiet hours are enabled */
    enabled: boolean;
  };

  /**
   * Show notifications for completed syncs
   *
   * @default false
   */
  showNotifications: boolean;

  /**
   * Last updated timestamp
   */
  lastUpdated: number;
}

/**
 * Predefined sync frequency options
 */
export type PeriodicSyncFrequency =
  | 'twice-daily'  // Every 12 hours (minimum allowed)
  | 'daily'        // Every 24 hours
  | 'twice-weekly' // Every 3.5 days
  | 'weekly'       // Every 7 days
  | 'custom';      // Custom interval (use minInterval)

/**
 * Convert frequency to milliseconds
 */
export const PERIODIC_SYNC_INTERVALS: Record<PeriodicSyncFrequency, number> = {
  'twice-daily': 12 * 60 * 60 * 1000,      // 12 hours
  'daily': 24 * 60 * 60 * 1000,            // 24 hours
  'twice-weekly': 3.5 * 24 * 60 * 60 * 1000, // 84 hours
  'weekly': 7 * 24 * 60 * 60 * 1000,       // 168 hours
  'custom': 24 * 60 * 60 * 1000,           // Default to 24 hours
} as const;

// ============================================================================
// Metadata and Tracking
// ============================================================================

/**
 * Metadata about a periodic sync registration
 *
 * Tracks the state and history of a periodic sync registration.
 */
export interface PeriodicSyncMetadata {
  /**
   * Tag identifying this sync registration
   */
  tag: PeriodicSyncTag;

  /**
   * When this sync was registered
   */
  registeredAt: number;

  /**
   * Configured minimum interval in milliseconds
   */
  minInterval: number;

  /**
   * Last time this sync was triggered
   */
  lastTriggeredAt: number | null;

  /**
   * Last time this sync completed successfully
   */
  lastSuccessAt: number | null;

  /**
   * Last time this sync failed
   */
  lastFailureAt: number | null;

  /**
   * Total number of times this sync has been triggered
   */
  triggerCount: number;

  /**
   * Number of successful sync operations
   */
  successCount: number;

  /**
   * Number of failed sync operations
   */
  failureCount: number;

  /**
   * Whether this sync is currently active
   */
  isActive: boolean;

  /**
   * Next expected sync time (estimated)
   *
   * Note: This is an estimate. Browser controls actual timing.
   */
  nextExpectedSync: number | null;

  /**
   * User ID who registered this sync
   */
  userId?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Statistics about periodic sync operations
 *
 * Provides insights into sync performance and reliability.
 */
export interface PeriodicSyncStatistics {
  /**
   * Total number of sync attempts
   */
  totalAttempts: number;

  /**
   * Number of successful syncs
   */
  successfulSyncs: number;

  /**
   * Number of failed syncs
   */
  failedSyncs: number;

  /**
   * Number of skipped syncs (due to conditions not met)
   */
  skippedSyncs: number;

  /**
   * Success rate (0-1)
   */
  successRate: number;

  /**
   * Average sync duration in milliseconds
   */
  averageDuration: number;

  /**
   * Minimum sync duration in milliseconds
   */
  minDuration: number;

  /**
   * Maximum sync duration in milliseconds
   */
  maxDuration: number;

  /**
   * Total data transferred in bytes
   */
  bytesTransferred: number;

  /**
   * Number of items synced
   */
  itemsSynced: number;

  /**
   * Number of conflicts detected
   */
  conflictsDetected: number;

  /**
   * Last error message (if any)
   */
  lastError: string | null;

  /**
   * Last sync timestamp
   */
  lastSyncAt: number | null;

  /**
   * Statistics collection started at
   */
  startedAt: number;

  /**
   * Statistics last updated at
   */
  lastUpdatedAt: number;
}

// ============================================================================
// Smart Sync Strategy
// ============================================================================

/**
 * Smart sync strategy configuration
 *
 * Adjusts sync behavior based on device state and usage patterns.
 */
export interface SmartSyncStrategy {
  /**
   * Whether smart sync is enabled
   */
  enabled: boolean;

  /**
   * Battery level thresholds for sync decisions
   */
  battery: {
    /** Critical level - no sync (0-1) */
    critical: number;
    /** Low level - essential sync only (0-1) */
    low: number;
    /** Normal level - standard sync (0-1) */
    normal: number;
  };

  /**
   * Network type preferences and priorities
   */
  network: {
    /** Preferred network types (in order of preference) */
    preferred: NetworkType[];
    /** Network types to avoid */
    avoid: NetworkType[];
    /** Whether to sync on metered connections */
    allowMetered: boolean;
  };

  /**
   * Time-based sync adjustments
   */
  timing: {
    /** Peak usage hours (when user is likely active) */
    peakHours: number[];
    /** Off-peak hours (when user is likely inactive) */
    offPeakHours: number[];
    /** Prefer syncing during off-peak hours */
    preferOffPeak: boolean;
  };

  /**
   * Usage pattern tracking
   */
  usage: {
    /** Track app launch times to optimize sync timing */
    trackLaunchTimes: boolean;
    /** Minimum launches before adapting sync schedule */
    minLaunchesForAdaptation: number;
    /** Historical launch times (timestamps) */
    launchHistory: number[];
  };

  /**
   * Adaptive sync intervals based on content freshness
   */
  adaptive: {
    /** Enable adaptive interval adjustment */
    enabled: boolean;
    /** Increase interval if no changes detected */
    increaseOnNoChanges: boolean;
    /** Decrease interval if changes frequently detected */
    decreaseOnFrequentChanges: boolean;
    /** Maximum interval multiplier */
    maxMultiplier: number;
    /** Minimum interval multiplier */
    minMultiplier: number;
  };
}

// ============================================================================
// Browser Capabilities
// ============================================================================

/**
 * Periodic sync capability detection
 *
 * Determines what periodic sync features are available in the current browser.
 */
export interface PeriodicSyncCapabilities {
  /**
   * Whether Periodic Background Sync API is supported
   */
  hasPeriodicSync: boolean;

  /**
   * Whether the app is installed as a PWA
   *
   * Required for periodic sync to work.
   */
  isPWAInstalled: boolean;

  /**
   * Whether service worker is registered and active
   */
  hasServiceWorker: boolean;

  /**
   * Whether the origin is secure (HTTPS)
   */
  isSecureOrigin: boolean;

  /**
   * Whether Battery Status API is available
   */
  hasBatteryAPI: boolean;

  /**
   * Whether Network Information API is available
   */
  hasNetworkAPI: boolean;

  /**
   * Whether Notifications API is available
   */
  hasNotifications: boolean;

  /**
   * Current notification permission state
   */
  notificationPermission: NotificationPermission;

  /**
   * Whether all requirements for periodic sync are met
   */
  canUsePeriodicSync: boolean;

  /**
   * List of missing requirements
   */
  missingRequirements: string[];

  /**
   * Browser name and version info
   */
  browser: {
    name: string;
    version: string;
    isChromium: boolean;
  };

  /**
   * Device type
   */
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';

  /**
   * Platform information
   */
  platform: string;
}

// ============================================================================
// Sync Execution
// ============================================================================

/**
 * Status of a periodic sync execution
 */
export enum PeriodicSyncStatus {
  /** Sync is pending/scheduled */
  Pending = 'PENDING',

  /** Sync is currently in progress */
  InProgress = 'IN_PROGRESS',

  /** Sync completed successfully */
  Success = 'SUCCESS',

  /** Sync failed */
  Failed = 'FAILED',

  /** Sync was skipped (conditions not met) */
  Skipped = 'SKIPPED',

  /** Sync was cancelled */
  Cancelled = 'CANCELLED',
}

/**
 * Reason why a sync was skipped
 */
export enum PeriodicSyncSkipReason {
  /** Battery level too low */
  LowBattery = 'LOW_BATTERY',

  /** Not on allowed network type */
  NetworkType = 'NETWORK_TYPE',

  /** Offline/no network connection */
  Offline = 'OFFLINE',

  /** During quiet hours */
  QuietHours = 'QUIET_HOURS',

  /** Data saver mode enabled */
  DataSaver = 'DATA_SAVER',

  /** Battery saver mode enabled */
  BatterySaver = 'BATTERY_SAVER',

  /** User disabled periodic sync */
  UserDisabled = 'USER_DISABLED',

  /** Not charging (user preference) */
  NotCharging = 'NOT_CHARGING',

  /** Previous sync still in progress */
  AlreadyRunning = 'ALREADY_RUNNING',

  /** Unknown reason */
  Other = 'OTHER',
}

/**
 * Result of a periodic sync execution
 *
 * Captures the outcome and details of a sync operation.
 */
export interface PeriodicSyncResult {
  /**
   * Tag identifying the sync that executed
   */
  tag: PeriodicSyncTag;

  /**
   * Status of the sync execution
   */
  status: PeriodicSyncStatus;

  /**
   * When the sync was triggered
   */
  triggeredAt: number;

  /**
   * When the sync started executing
   */
  startedAt: number | null;

  /**
   * When the sync completed
   */
  completedAt: number | null;

  /**
   * Duration of the sync in milliseconds
   */
  duration: number | null;

  /**
   * Number of items synchronized
   */
  itemsSynced: number;

  /**
   * Number of items that failed to sync
   */
  itemsFailed: number;

  /**
   * Number of conflicts detected
   */
  conflictsDetected: number;

  /**
   * Data transferred in bytes
   */
  bytesTransferred: number;

  /**
   * Whether sync was successful
   */
  success: boolean;

  /**
   * Error message if sync failed
   */
  error: string | null;

  /**
   * Error stack trace if available
   */
  errorStack: string | null;

  /**
   * Reason for skip if status is Skipped
   */
  skipReason: PeriodicSyncSkipReason | null;

  /**
   * Device state at time of sync
   */
  deviceState: {
    /** Battery level (0-1) or null if unavailable */
    batteryLevel: number | null;
    /** Whether device is charging */
    isCharging: boolean | null;
    /** Network type */
    networkType: NetworkType | null;
    /** Effective network type */
    effectiveNetworkType: EffectiveNetworkType | null;
    /** Whether connection is metered */
    isMetered: boolean | null;
  };

  /**
   * Additional metadata about the sync
   */
  metadata?: Record<string, any>;
}

// ============================================================================
// History and Logging
// ============================================================================

/**
 * Historical record of periodic sync executions
 */
export interface PeriodicSyncHistory {
  /**
   * Tag this history is for
   */
  tag: PeriodicSyncTag;

  /**
   * All sync execution results (most recent first)
   */
  executions: PeriodicSyncResult[];

  /**
   * Maximum number of executions to keep in history
   */
  maxHistorySize: number;

  /**
   * When history was last updated
   */
  lastUpdatedAt: number;
}

/**
 * Aggregated periodic sync report
 */
export interface PeriodicSyncReport {
  /**
   * Report generation timestamp
   */
  generatedAt: number;

  /**
   * Time period covered by this report
   */
  period: {
    start: number;
    end: number;
  };

  /**
   * All registered periodic syncs
   */
  registrations: PeriodicSyncMetadata[];

  /**
   * Overall statistics across all syncs
   */
  overallStatistics: PeriodicSyncStatistics;

  /**
   * Per-tag statistics
   */
  tagStatistics: Record<PeriodicSyncTag, PeriodicSyncStatistics>;

  /**
   * Recent executions across all tags
   */
  recentExecutions: PeriodicSyncResult[];

  /**
   * Current capabilities
   */
  capabilities: PeriodicSyncCapabilities;

  /**
   * User preferences
   */
  preferences: PeriodicSyncPreferences;

  /**
   * Recommendations for optimization
   */
  recommendations: string[];
}

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * Storage keys for persisting periodic sync data
 *
 * Use these constants when storing/retrieving periodic sync data
 * from localStorage, IndexedDB, or other storage mechanisms.
 */
export const PERIODIC_SYNC_STORAGE_KEYS = {
  /** Periodic sync configuration */
  CONFIG: 'grocery_periodic_sync_config',

  /** User preferences for periodic sync */
  PREFERENCES: 'grocery_periodic_sync_preferences',

  /** Metadata for all registered syncs */
  METADATA: 'grocery_periodic_sync_metadata',

  /** Periodic sync statistics */
  STATISTICS: 'grocery_periodic_sync_statistics',

  /** Sync execution history */
  HISTORY: 'grocery_periodic_sync_history',

  /** Smart sync strategy configuration */
  SMART_STRATEGY: 'grocery_periodic_sync_smart_strategy',

  /** Cached capabilities detection result */
  CAPABILITIES: 'grocery_periodic_sync_capabilities',

  /** Last successful sync timestamp */
  LAST_SYNC: 'grocery_periodic_sync_last_sync',

  /** Currently registered tags */
  REGISTERED_TAGS: 'grocery_periodic_sync_registered_tags',
} as const;

// ============================================================================
// Constants
// ============================================================================

/**
 * Default periodic sync configuration
 */
export const DEFAULT_PERIODIC_SYNC_CONFIG: PeriodicSyncConfig = {
  defaultTag: 'grocery-periodic-sync',
  minInterval: 24 * 60 * 60 * 1000, // 24 hours
  autoRegister: true,
  showNotifications: false,
  maxSyncDuration: 30000, // 30 seconds
  respectDataSaver: true,
  checkBatteryLevel: true,
  minBatteryLevel: 0.15, // 15%
  allowedNetworkTypes: ['wifi', '4g', '5g', 'ethernet'],
  enableSmartSync: true,
};

/**
 * Default user preferences for periodic sync
 */
export const DEFAULT_PERIODIC_SYNC_PREFERENCES: PeriodicSyncPreferences = {
  enabled: true,
  frequency: 'daily',
  wifiOnly: false,
  chargingOnly: false,
  respectBatterySaver: true,
  respectDataSaver: true,
  quietHours: {
    start: 22, // 10 PM
    end: 7,    // 7 AM
    enabled: false,
  },
  showNotifications: false,
  lastUpdated: Date.now(),
};

/**
 * Default smart sync strategy
 */
export const DEFAULT_SMART_SYNC_STRATEGY: SmartSyncStrategy = {
  enabled: true,
  battery: {
    critical: 0.1,  // 10%
    low: 0.2,       // 20%
    normal: 0.5,    // 50%
  },
  network: {
    preferred: ['wifi', 'ethernet', '5g', '4g'],
    avoid: ['slow-2g', '2g'],
    allowMetered: false,
  },
  timing: {
    peakHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    offPeakHours: [0, 1, 2, 3, 4, 5, 6, 21, 22, 23],
    preferOffPeak: true,
  },
  usage: {
    trackLaunchTimes: true,
    minLaunchesForAdaptation: 10,
    launchHistory: [],
  },
  adaptive: {
    enabled: true,
    increaseOnNoChanges: true,
    decreaseOnFrequentChanges: true,
    maxMultiplier: 2.0,
    minMultiplier: 0.5,
  },
};

/**
 * Minimum allowed periodic sync interval (12 hours in milliseconds)
 *
 * This is enforced by Chromium browsers. Attempting to register a sync
 * with a shorter interval will still work, but the browser will enforce
 * this minimum.
 */
export const MIN_PERIODIC_SYNC_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Recommended periodic sync interval (24 hours in milliseconds)
 *
 * This provides a good balance between freshness and battery/data usage.
 */
export const RECOMMENDED_PERIODIC_SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if ServiceWorkerRegistration supports periodic sync
 */
export function hasPeriodicSync(
  registration: ServiceWorkerRegistration
): registration is ServiceWorkerRegistrationWithPeriodicSync {
  return 'periodicSync' in registration;
}

/**
 * Type guard to check if a sync result was successful
 */
export function isSuccessfulSync(result: PeriodicSyncResult): boolean {
  return result.status === PeriodicSyncStatus.Success && result.success;
}

/**
 * Type guard to check if a sync was skipped
 */
export function wasSkipped(result: PeriodicSyncResult): boolean {
  return result.status === PeriodicSyncStatus.Skipped;
}

/**
 * Type guard to check if a sync failed
 */
export function hasFailed(result: PeriodicSyncResult): boolean {
  return result.status === PeriodicSyncStatus.Failed || !result.success;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Callback for monitoring periodic sync events
 */
export type PeriodicSyncCallback = (result: PeriodicSyncResult) => void;

/**
 * Hook return type for periodic sync management
 */
export interface PeriodicSyncManager {
  /** Whether periodic sync is supported and available */
  isSupported: boolean;

  /** Whether periodic sync is currently registered */
  isRegistered: boolean;

  /** All registered periodic sync tags */
  registeredTags: PeriodicSyncTag[];

  /** Current capabilities */
  capabilities: PeriodicSyncCapabilities;

  /** User preferences */
  preferences: PeriodicSyncPreferences;

  /** Current statistics */
  statistics: PeriodicSyncStatistics;

  /** Last sync result */
  lastResult: PeriodicSyncResult | null;

  /** Register a periodic sync */
  register: (tag: PeriodicSyncTag, options?: PeriodicSyncRegistrationOptions) => Promise<void>;

  /** Unregister a periodic sync */
  unregister: (tag: PeriodicSyncTag) => Promise<void>;

  /** Unregister all periodic syncs */
  unregisterAll: () => Promise<void>;

  /** Update user preferences */
  updatePreferences: (preferences: Partial<PeriodicSyncPreferences>) => void;

  /** Get sync metadata for a specific tag */
  getMetadata: (tag: PeriodicSyncTag) => PeriodicSyncMetadata | null;

  /** Get sync history for a specific tag */
  getHistory: (tag: PeriodicSyncTag) => PeriodicSyncResult[];

  /** Generate a sync report */
  generateReport: () => PeriodicSyncReport;

  /** Check if sync should run based on current conditions */
  shouldSync: () => Promise<{ shouldSync: boolean; reason?: PeriodicSyncSkipReason }>;
}

/**
 * Options for periodic sync execution context
 */
export interface PeriodicSyncExecutionContext {
  /** The periodic sync event */
  event: PeriodicSyncEvent;

  /** User preferences at time of sync */
  preferences: PeriodicSyncPreferences;

  /** Smart sync strategy configuration */
  strategy: SmartSyncStrategy;

  /** Device state */
  deviceState: {
    batteryLevel: number | null;
    isCharging: boolean | null;
    networkType: NetworkType | null;
    effectiveNetworkType: EffectiveNetworkType | null;
    isMetered: boolean | null;
  };

  /** Abort signal for cancelling long-running syncs */
  signal: AbortSignal;
}
