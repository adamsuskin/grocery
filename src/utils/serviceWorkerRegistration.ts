/**
 * Service Worker Registration Utilities
 *
 * This module provides utilities for registering, updating, and managing
 * the service worker in the Grocery List app.
 *
 * Features:
 * - Service worker registration with error handling
 * - Update detection and prompt logic
 * - Unregister function for development
 * - TypeScript types for SW events
 * - Integration with Workbox for lifecycle management
 */

/**
 * Configuration options for service worker registration
 */
export interface ServiceWorkerConfig {
  /** Callback when service worker is registered successfully */
  onSuccess?: (registration: ServiceWorkerRegistration) => void;

  /** Callback when a new service worker update is available */
  onUpdate?: (registration: ServiceWorkerRegistration) => void;

  /** Callback when service worker registration fails */
  onError?: (error: Error) => void;

  /** Callback when service worker becomes active and ready */
  onReady?: (registration: ServiceWorkerRegistration) => void;

  /** Callback when service worker is installed and waiting to activate */
  onWaiting?: (registration: ServiceWorkerRegistration) => void;

  /** Automatically update service worker without user confirmation */
  autoUpdate?: boolean;

  /** Check for updates interval in milliseconds (0 = no polling) */
  updateCheckInterval?: number;
}

/**
 * Service worker lifecycle state
 */
export type ServiceWorkerState =
  | 'installing'
  | 'installed'
  | 'activating'
  | 'activated'
  | 'redundant';

/**
 * Extended service worker registration with custom properties
 */
export interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  installing: ServiceWorker | null;
}

/**
 * Message types for service worker communication
 */
export type ServiceWorkerMessageType =
  | 'SKIP_WAITING'
  | 'GET_VERSION'
  | 'CLEAR_CACHE'
  | 'CHECK_OFFLINE_QUEUE';

/**
 * Message payload for service worker communication
 */
export interface ServiceWorkerMessage {
  type: ServiceWorkerMessageType;
  payload?: any;
}

/**
 * Check if service workers are supported in the current browser
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Check if Background Sync API is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
}

/**
 * Check if Push API is supported
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check if Notifications API is supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported');
  }

  return Notification.requestPermission();
}

/**
 * Register the service worker
 *
 * @param swUrl - URL to the service worker file
 * @param config - Configuration options
 */
export async function register(
  swUrl: string = '/sw.js',
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | undefined> {
  if (!isServiceWorkerSupported()) {
    console.warn('[ServiceWorker] Service workers are not supported in this browser');
    return undefined;
  }

  // Only register in production or when explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_SW_DEV) {
    console.log('[ServiceWorker] Service worker registration skipped in development');
    return undefined;
  }

  try {
    console.log('[ServiceWorker] Registering service worker:', swUrl);

    const registration = await navigator.serviceWorker.register(swUrl, {
      type: 'module',
      scope: '/',
    });

    console.log('[ServiceWorker] Service worker registered:', registration);

    // Set up update detection
    setupUpdateListener(registration, config);

    // Set up ready listener
    if (config.onReady) {
      navigator.serviceWorker.ready.then((reg) => {
        console.log('[ServiceWorker] Service worker is ready');
        config.onReady!(reg);
      });
    }

    // Check for updates periodically
    if (config.updateCheckInterval && config.updateCheckInterval > 0) {
      setInterval(() => {
        registration.update().catch((error) => {
          console.error('[ServiceWorker] Update check failed:', error);
        });
      }, config.updateCheckInterval);
    }

    // Call success callback
    if (config.onSuccess) {
      config.onSuccess(registration);
    }

    return registration;
  } catch (error) {
    console.error('[ServiceWorker] Service worker registration failed:', error);

    if (config.onError && error instanceof Error) {
      config.onError(error);
    }

    throw error;
  }
}

/**
 * Set up listener for service worker updates
 */
function setupUpdateListener(
  registration: ServiceWorkerRegistration,
  config: ServiceWorkerConfig
): void {
  // Listen for state changes on the installing service worker
  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing;

    if (!installingWorker) {
      return;
    }

    console.log('[ServiceWorker] New service worker installing');

    installingWorker.addEventListener('statechange', () => {
      console.log('[ServiceWorker] State changed:', installingWorker.state);

      if (installingWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New service worker is waiting to activate
          console.log('[ServiceWorker] New update available');

          if (config.onUpdate) {
            config.onUpdate(registration);
          }

          if (config.onWaiting) {
            config.onWaiting(registration);
          }

          // Auto-update if configured
          if (config.autoUpdate) {
            skipWaiting(registration);
          }
        } else {
          // First time service worker is installed
          console.log('[ServiceWorker] Service worker installed for the first time');

          if (config.onSuccess) {
            config.onSuccess(registration);
          }
        }
      }
    });
  });
}

/**
 * Tell the waiting service worker to skip waiting and activate immediately
 */
export function skipWaiting(registration: ServiceWorkerRegistration): void {
  const waitingServiceWorker = registration.waiting;

  if (!waitingServiceWorker) {
    console.warn('[ServiceWorker] No waiting service worker found');
    return;
  }

  console.log('[ServiceWorker] Sending SKIP_WAITING message');

  // Send message to service worker to skip waiting
  waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });

  // Listen for controlling service worker change
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) {
      return;
    }
    refreshing = true;
    console.log('[ServiceWorker] Controller changed, reloading page');
    window.location.reload();
  });
}

/**
 * Unregister the service worker
 * Useful for development or when completely removing PWA features
 */
export async function unregister(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const unregistered = await registration.unregister();

    console.log('[ServiceWorker] Service worker unregistered:', unregistered);

    return unregistered;
  } catch (error) {
    console.error('[ServiceWorker] Failed to unregister service worker:', error);
    return false;
  }
}

/**
 * Update the service worker manually
 * This will check for a new service worker and install it if available
 */
export async function update(): Promise<ServiceWorkerRegistration | undefined> {
  if (!isServiceWorkerSupported()) {
    return undefined;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[ServiceWorker] Update check complete');
    return registration;
  } catch (error) {
    console.error('[ServiceWorker] Failed to check for updates:', error);
    return undefined;
  }
}

/**
 * Get the current service worker registration
 */
export async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!isServiceWorkerSupported()) {
    return undefined;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('[ServiceWorker] Failed to get registration:', error);
    return undefined;
  }
}

/**
 * Check if a service worker is currently active
 */
export async function isActive(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration?.active;
  } catch (error) {
    console.error('[ServiceWorker] Failed to check if service worker is active:', error);
    return false;
  }
}

/**
 * Send a message to the service worker
 */
export async function sendMessage(message: ServiceWorkerMessage): Promise<any> {
  if (!isServiceWorkerSupported()) {
    throw new Error('Service workers are not supported');
  }

  const registration = await navigator.serviceWorker.ready;

  if (!registration.active) {
    throw new Error('No active service worker');
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    registration.active?.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Get the service worker version
 */
export async function getVersion(): Promise<string | undefined> {
  try {
    const response = await sendMessage({ type: 'GET_VERSION' });
    return response.version;
  } catch (error) {
    console.error('[ServiceWorker] Failed to get version:', error);
    return undefined;
  }
}

/**
 * Clear all service worker caches
 */
export async function clearCaches(): Promise<boolean> {
  try {
    await sendMessage({ type: 'CLEAR_CACHE' });
    return true;
  } catch (error) {
    console.error('[ServiceWorker] Failed to clear caches:', error);
    return false;
  }
}

/**
 * Trigger offline queue sync
 */
export async function triggerSync(): Promise<void> {
  if (!isBackgroundSyncSupported()) {
    console.warn('[ServiceWorker] Background Sync is not supported');
    return;
  }

  try {
    await sendMessage({ type: 'CHECK_OFFLINE_QUEUE' });
    console.log('[ServiceWorker] Sync triggered');
  } catch (error) {
    console.error('[ServiceWorker] Failed to trigger sync:', error);
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription | undefined> {
  if (!isPushSupported()) {
    console.warn('[ServiceWorker] Push notifications are not supported');
    return undefined;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      console.log('[ServiceWorker] Push subscription created:', subscription);
    }

    return subscription;
  } catch (error) {
    console.error('[ServiceWorker] Failed to subscribe to push:', error);
    return undefined;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const unsubscribed = await subscription.unsubscribe();
      console.log('[ServiceWorker] Push unsubscribed:', unsubscribed);
      return unsubscribed;
    }

    return true;
  } catch (error) {
    console.error('[ServiceWorker] Failed to unsubscribe from push:', error);
    return false;
  }
}

/**
 * Helper function to convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Default export for easy importing
 */
export default {
  register,
  unregister,
  update,
  getRegistration,
  isActive,
  skipWaiting,
  sendMessage,
  getVersion,
  clearCaches,
  triggerSync,
  subscribeToPush,
  unsubscribeFromPush,
  isServiceWorkerSupported,
  isBackgroundSyncSupported,
  isPushSupported,
  isNotificationSupported,
  requestNotificationPermission,
};
