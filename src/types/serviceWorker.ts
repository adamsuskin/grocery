/**
 * Service Worker and Background Sync API Type Definitions
 *
 * This module provides TypeScript definitions for the Service Worker API,
 * Background Sync API, and related browser features that may not have
 * complete type coverage in the standard TypeScript libraries.
 *
 * ## Browser Compatibility
 *
 * - **Background Sync API**: Chromium-based browsers (Chrome 49+, Edge 79+)
 * - **Service Workers**: All modern browsers (Chrome 40+, Firefox 44+, Safari 11.1+, Edge 17+)
 * - **Notifications API**: All modern browsers with user permission
 *
 * Note: Always feature-detect these APIs before using them, as support varies.
 */

/**
 * Represents a tag for identifying a sync event
 */
export type SyncTag = string;

/**
 * SyncManager interface for Background Sync API
 *
 * The SyncManager interface provides methods for registering sync events
 * that will be triggered when the browser has connectivity.
 */
export interface SyncManager {
  /**
   * Register a sync event with the given tag
   * @param tag - Unique identifier for this sync event
   * @returns Promise that resolves when the sync is registered
   */
  register(tag: SyncTag): Promise<void>;

  /**
   * Get all registered sync tags
   * @returns Promise that resolves to an array of registered tags
   */
  getTags(): Promise<string[]>;
}

/**
 * Extended ServiceWorkerRegistration interface with SyncManager
 *
 * This extends the standard ServiceWorkerRegistration to include
 * the sync property for Background Sync API access.
 */
export interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  /**
   * SyncManager instance for registering background sync events
   */
  readonly sync: SyncManager;
}

/**
 * SyncEvent dispatched to service worker when sync should occur
 *
 * This event is fired in the service worker when a registered sync
 * should be processed (typically when connectivity is restored).
 */
export interface SyncEvent extends ExtendableEvent {
  /**
   * The tag identifying this sync event
   */
  readonly tag: string;

  /**
   * Whether this is the last chance to process this sync
   * If true, the sync will be unregistered after this attempt
   */
  readonly lastChance: boolean;
}

/**
 * Notification options for the Notifications API
 */
export interface NotificationOptions {
  /**
   * Main body text of the notification
   */
  body?: string;

  /**
   * Icon URL to display in the notification
   */
  icon?: string;

  /**
   * Badge URL for the notification
   */
  badge?: string;

  /**
   * Tag to identify/replace notifications
   */
  tag?: string;

  /**
   * Data to attach to the notification
   */
  data?: any;

  /**
   * Whether the notification requires user interaction to dismiss
   */
  requireInteraction?: boolean;

  /**
   * Whether the notification should be silent
   */
  silent?: boolean;

  /**
   * Vibration pattern for mobile devices
   */
  vibrate?: number[];

  /**
   * Timestamp for the notification
   */
  timestamp?: number;

  /**
   * Actions to display on the notification
   */
  actions?: NotificationAction[];

  /**
   * Image URL to display in the notification
   */
  image?: string;

  /**
   * Direction of the notification text
   */
  dir?: 'auto' | 'ltr' | 'rtl';

  /**
   * Language of the notification
   */
  lang?: string;

  /**
   * Whether to renotify when replacing an existing notification
   */
  renotify?: boolean;
}

/**
 * Action button for a notification
 */
export interface NotificationAction {
  /**
   * Identifier for the action
   */
  action: string;

  /**
   * Title to display for the action
   */
  title: string;

  /**
   * Icon URL for the action
   */
  icon?: string;
}

/**
 * Permission state for notifications
 */
export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * Background Sync event handler type
 */
export type SyncEventHandler = (event: SyncEvent) => void | Promise<void>;

/**
 * Service worker message event data
 */
export interface ServiceWorkerMessage {
  /**
   * Type of message
   */
  type: string;

  /**
   * Message payload
   */
  payload?: any;
}

/**
 * Message types for communication with service worker
 */
export enum ServiceWorkerMessageType {
  /**
   * Request to sync offline queue
   */
  SYNC_QUEUE = 'SYNC_QUEUE',

  /**
   * Notification that queue has been synced
   */
  QUEUE_SYNCED = 'QUEUE_SYNCED',

  /**
   * Request queue status
   */
  QUEUE_STATUS = 'QUEUE_STATUS',

  /**
   * Response with queue status
   */
  QUEUE_STATUS_RESPONSE = 'QUEUE_STATUS_RESPONSE',

  /**
   * Notification that sync failed
   */
  SYNC_FAILED = 'SYNC_FAILED',

  /**
   * Skip waiting and activate service worker
   */
  SKIP_WAITING = 'SKIP_WAITING',

  /**
   * Client is ready to receive messages
   */
  CLIENT_READY = 'CLIENT_READY',
}

/**
 * Background Sync configuration
 */
export interface BackgroundSyncConfig {
  /**
   * Default sync tag to use
   */
  syncTag: string;

  /**
   * Whether to show notifications on sync completion
   */
  showNotifications: boolean;

  /**
   * Whether to fallback to polling when Background Sync is unavailable
   */
  enablePollingFallback: boolean;

  /**
   * Polling interval in milliseconds (when using fallback)
   */
  pollingInterval: number;

  /**
   * Maximum number of sync retries
   */
  maxRetries: number;
}

/**
 * Result of a background sync operation
 */
export interface BackgroundSyncResult {
  /**
   * Whether the sync was successful
   */
  success: boolean;

  /**
   * Number of items synced
   */
  itemsSynced: number;

  /**
   * Number of items that failed
   */
  itemsFailed: number;

  /**
   * Error message if sync failed
   */
  error?: string;

  /**
   * Timestamp of the sync
   */
  timestamp: number;
}

/**
 * Browser capability detection result
 */
export interface BrowserCapabilities {
  /**
   * Whether service workers are supported
   */
  hasServiceWorker: boolean;

  /**
   * Whether Background Sync API is supported
   */
  hasBackgroundSync: boolean;

  /**
   * Whether Notifications API is supported
   */
  hasNotifications: boolean;

  /**
   * Current notification permission state
   */
  notificationPermission: NotificationPermission;

  /**
   * Whether the browser is online
   */
  isOnline: boolean;
}

/**
 * Sync event metadata
 */
export interface SyncEventMetadata {
  /**
   * Unique identifier for this sync event
   */
  id: string;

  /**
   * Tag used to register the sync
   */
  tag: string;

  /**
   * Timestamp when sync was registered
   */
  registeredAt: number;

  /**
   * Timestamp when sync was triggered
   */
  triggeredAt?: number;

  /**
   * Number of retry attempts
   */
  retryCount: number;

  /**
   * Whether this was the last chance
   */
  lastChance: boolean;
}
