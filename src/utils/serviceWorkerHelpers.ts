/**
 * Service Worker Helper Functions
 *
 * Utility functions for service worker state management and communication.
 * Provides helpers for:
 * - Communicating with service workers via postMessage
 * - Waiting for service worker activation
 * - Manually checking for updates
 * - Registering service workers
 */

/**
 * Service worker registration state
 */
export interface ServiceWorkerState {
  /** The service worker registration */
  registration: ServiceWorkerRegistration | null;
  /** Currently installing service worker */
  installing: ServiceWorker | null;
  /** Service worker waiting to activate */
  waiting: ServiceWorker | null;
  /** Currently active service worker */
  active: ServiceWorker | null;
  /** Whether an update is available */
  updateAvailable: boolean;
}

/**
 * Type alias for service worker state strings
 */
export type ServiceWorkerStateString = 'parsed' | 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';

/**
 * Message types for service worker communication
 */
export type ServiceWorkerMessageType =
  | 'SKIP_WAITING'
  | 'CLIENTS_CLAIM'
  | 'CACHE_URLS'
  | 'CLEAR_CACHE'
  | 'GET_CACHE_NAMES';

/**
 * Message structure for service worker communication
 */
export interface ServiceWorkerMessage {
  type: ServiceWorkerMessageType;
  payload?: any;
}

/**
 * Send a message to the service worker
 *
 * @param registration - Service worker registration
 * @param message - Message to send
 * @returns Promise that resolves when message is sent
 */
export function postMessageToServiceWorker(
  registration: ServiceWorkerRegistration,
  message: ServiceWorkerMessage
): Promise<void> {
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data);
      }
    };

    // Send to waiting service worker if available (during update)
    // Otherwise send to active service worker
    const targetWorker = registration.waiting || registration.active;

    if (!targetWorker) {
      reject(new Error('No service worker available to receive message'));
      return;
    }

    targetWorker.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Wait for a service worker to reach a specific state
 *
 * @param worker - Service worker to monitor
 * @param targetState - Target state to wait for
 * @param timeout - Timeout in milliseconds (default: 30000)
 * @returns Promise that resolves when state is reached
 */
export function waitForServiceWorkerState(
  worker: ServiceWorker,
  targetState: ServiceWorkerStateString,
  timeout = 30000
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (worker.state === targetState) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      worker.removeEventListener('statechange', handleStateChange);
      reject(new Error(`Service worker did not reach ${targetState} state within ${timeout}ms`));
    }, timeout);

    const handleStateChange = () => {
      if (worker.state === targetState) {
        clearTimeout(timeoutId);
        worker.removeEventListener('statechange', handleStateChange);
        resolve();
      }
    };

    worker.addEventListener('statechange', handleStateChange);
  });
}

/**
 * Wait for service worker activation
 * Useful after calling skipWaiting() to know when to reload
 *
 * @param registration - Service worker registration
 * @param timeout - Timeout in milliseconds (default: 30000)
 * @returns Promise that resolves when activation is complete
 */
export async function waitForActivation(
  registration: ServiceWorkerRegistration,
  timeout = 30000
): Promise<void> {
  // If there's a waiting worker, wait for it to become active
  if (registration.waiting) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        reject(new Error(`Service worker activation timeout after ${timeout}ms`));
      }, timeout);

      const handleControllerChange = () => {
        clearTimeout(timeoutId);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        resolve();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    });
  }

  // If there's an installing worker, wait for it
  if (registration.installing) {
    await waitForServiceWorkerState(registration.installing, 'activated', timeout);
  }

  return Promise.resolve();
}

/**
 * Trigger skipWaiting on the service worker
 * This tells a waiting service worker to activate immediately
 *
 * @param registration - Service worker registration
 * @returns Promise that resolves when skipWaiting is triggered
 */
export async function skipWaiting(
  registration: ServiceWorkerRegistration
): Promise<void> {
  if (!registration.waiting) {
    throw new Error('No service worker waiting to activate');
  }

  console.log('[ServiceWorker] Triggering skipWaiting');

  // Send skip waiting message
  await postMessageToServiceWorker(registration, {
    type: 'SKIP_WAITING',
  });

  // Wait for the new service worker to take control
  await waitForActivation(registration);
}

/**
 * Check for service worker updates
 * Manually triggers an update check
 *
 * @param registration - Service worker registration
 * @returns Promise that resolves with update available status
 */
export async function checkForUpdates(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  console.log('[ServiceWorker] Checking for updates');

  try {
    await registration.update();

    // Check if there's a waiting worker after the update
    return registration.waiting !== null;
  } catch (error) {
    console.error('[ServiceWorker] Update check failed:', error);
    throw error;
  }
}

/**
 * Register a service worker
 *
 * @param scriptURL - URL to the service worker script
 * @param options - Registration options
 * @returns Promise that resolves with the registration
 */
export async function registerServiceWorker(
  scriptURL: string,
  options?: RegistrationOptions
): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser');
  }

  console.log('[ServiceWorker] Registering service worker:', scriptURL);

  try {
    const registration = await navigator.serviceWorker.register(scriptURL, options);
    console.log('[ServiceWorker] Registration successful:', registration);
    return registration;
  } catch (error) {
    console.error('[ServiceWorker] Registration failed:', error);
    throw error;
  }
}

/**
 * Unregister a service worker
 *
 * @param registration - Service worker registration to unregister
 * @returns Promise that resolves when unregistered
 */
export async function unregisterServiceWorker(
  registration: ServiceWorkerRegistration
): Promise<void> {
  console.log('[ServiceWorker] Unregistering service worker');

  try {
    const success = await registration.unregister();
    if (success) {
      console.log('[ServiceWorker] Unregistration successful');
    } else {
      console.warn('[ServiceWorker] Unregistration failed');
    }
  } catch (error) {
    console.error('[ServiceWorker] Unregistration error:', error);
    throw error;
  }
}

/**
 * Get the current service worker state
 *
 * @param registration - Service worker registration
 * @returns Current state object
 */
export function getServiceWorkerState(
  registration: ServiceWorkerRegistration | null
): ServiceWorkerState {
  if (!registration) {
    return {
      registration: null,
      installing: null,
      waiting: null,
      active: null,
      updateAvailable: false,
    };
  }

  return {
    registration,
    installing: registration.installing,
    waiting: registration.waiting,
    active: registration.active,
    updateAvailable: registration.waiting !== null,
  };
}

/**
 * Reload the page after service worker update
 * Ensures clean state after update
 */
export function reloadAfterUpdate(): void {
  console.log('[ServiceWorker] Reloading page after update');
  window.location.reload();
}

/**
 * Clear all caches
 * Useful for troubleshooting or forcing fresh content
 *
 * @returns Promise that resolves when caches are cleared
 */
export async function clearAllCaches(): Promise<void> {
  console.log('[ServiceWorker] Clearing all caches');

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[ServiceWorker] All caches cleared');
  } catch (error) {
    console.error('[ServiceWorker] Failed to clear caches:', error);
    throw error;
  }
}

/**
 * Get cache information
 *
 * @returns Promise with cache names and estimated sizes
 */
export async function getCacheInfo(): Promise<{
  names: string[];
  count: number;
}> {
  try {
    const cacheNames = await caches.keys();
    return {
      names: cacheNames,
      count: cacheNames.length,
    };
  } catch (error) {
    console.error('[ServiceWorker] Failed to get cache info:', error);
    throw error;
  }
}
