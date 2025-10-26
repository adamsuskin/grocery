/**
 * Service Worker for Grocery List App
 *
 * This service worker provides:
 * - Offline support with intelligent caching strategies
 * - Background sync for offline mutations
 * - Periodic background sync for content updates
 * - Push notification support
 * - Automatic updates with skip waiting
 * - Cache versioning and cleanup
 * - Battery-aware and network-aware syncing
 *
 * Uses Workbox for cache management and strategies
 */

/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  NetworkFirst,
  NetworkOnly,
  CacheFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Cache version - increment this when you need to force cache refresh
const CACHE_VERSION = 'v1';
const APP_CACHE = `grocery-app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `grocery-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `grocery-images-${CACHE_VERSION}`;
const API_CACHE = `grocery-api-${CACHE_VERSION}`;
const FONT_CACHE = `grocery-fonts-${CACHE_VERSION}`;

// Service worker lifecycle: take control immediately
self.skipWaiting();
clientsClaim();

/**
 * Precache and route for app shell
 * This will be populated by Workbox during build
 */
precacheAndRoute(self.__WB_MANIFEST || []);

/**
 * App Shell - Cache-First Strategy
 * HTML, CSS, JS bundles are cached first for fast loading
 */
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  // Don't cache these paths
  denylist: [
    /^\/api\//, // API routes
    /^\/auth\//, // Auth routes
    /^\/admin\//, // Admin routes
  ],
});
registerRoute(navigationRoute);

/**
 * Static Assets - Cache-First Strategy
 * Cache CSS and JS with automatic updates
 */
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: APP_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * Images - Cache-First with Expiration
 * Cache images for fast loading with size limits
 */
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * Google Fonts - Stale-While-Revalidate
 * Serve cached fonts while checking for updates
 */
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: FONT_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * Zero Sync API - Network-First Strategy
 * Try network first, fall back to cache if offline
 * This ensures real-time sync when online
 */
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/zero') || url.pathname.includes('/sync'),
  new NetworkFirst({
    cacheName: API_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes - short cache for API data
        purgeOnQuotaError: true,
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

/**
 * Background Sync Plugin for Offline Queue
 * Sync offline mutations when connection is restored
 */
const bgSyncPlugin = new BackgroundSyncPlugin('offline-sync-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
  onSync: async ({ queue }) => {
    console.log('[ServiceWorker] Background sync started');
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('[ServiceWorker] Synced:', entry.request.url);
      } catch (error) {
        console.error('[ServiceWorker] Sync failed, re-queuing:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
    console.log('[ServiceWorker] Background sync completed');
  },
});

/**
 * API Mutations - Network-Only with Background Sync
 * POST, PUT, DELETE requests use background sync when offline
 */
registerRoute(
  ({ url, request }) =>
    (url.pathname.startsWith('/api/') || url.pathname.includes('/mutate')) &&
    (request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'DELETE' ||
      request.method === 'PATCH'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  ({ url, request }) =>
    (url.pathname.startsWith('/api/') || url.pathname.includes('/mutate')) &&
    (request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'DELETE' ||
      request.method === 'PATCH'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PUT'
);

registerRoute(
  ({ url, request }) =>
    (url.pathname.startsWith('/api/') || url.pathname.includes('/mutate')) &&
    (request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'DELETE' ||
      request.method === 'PATCH'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'DELETE'
);

registerRoute(
  ({ url, request }) =>
    (url.pathname.startsWith('/api/') || url.pathname.includes('/mutate')) &&
    (request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'DELETE' ||
      request.method === 'PATCH'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PATCH'
);

/**
 * Install Event - Pre-cache critical resources
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);

      // Pre-cache critical app shell resources
      const criticalResources = [
        '/',
        '/index.html',
        '/manifest.json',
      ];

      try {
        await cache.addAll(criticalResources);
        console.log('[ServiceWorker] Critical resources cached');
      } catch (error) {
        console.error('[ServiceWorker] Failed to cache critical resources:', error);
      }
    })()
  );

  // Force immediate activation
  self.skipWaiting();
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const validCaches = [
        APP_CACHE,
        RUNTIME_CACHE,
        IMAGE_CACHE,
        API_CACHE,
        FONT_CACHE,
      ];

      // Delete old caches
      await Promise.all(
        cacheNames
          .filter((cacheName) => !validCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );

      console.log('[ServiceWorker] Cache cleanup complete');
    })()
  );

  // Take control of all clients immediately
  self.clients.claim();
});

/**
 * Fetch Event - Custom fetch handling
 */
self.addEventListener('fetch', (event) => {
  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Let Workbox handle the request through registered routes
});

/**
 * Message Event - Handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        event.ports[0].postMessage({ success: true });
      })()
    );
  }

  if (event.data && event.data.type === 'CHECK_OFFLINE_QUEUE') {
    // Trigger background sync if possible
    if ('sync' in self.registration) {
      self.registration.sync
        .register('offline-sync-queue')
        .then(() => {
          console.log('[ServiceWorker] Background sync registered');
        })
        .catch((error) => {
          console.error('[ServiceWorker] Background sync registration failed:', error);
        });
    }
  }

  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    // Manually trigger a periodic sync
    event.waitUntil(
      (async () => {
        try {
          console.log('[ServiceWorker] Manual sync triggered');
          const result = await syncContent();

          // Post message back to the client
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              success: result.success,
              timestamp: Date.now(),
              error: result.error,
            });
          });
        } catch (error) {
          console.error('[ServiceWorker] Manual sync failed:', error);
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              success: false,
              timestamp: Date.now(),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
        }
      })()
    );
  }
});

/**
 * Sync Event - Background Sync
 * Triggered when browser thinks connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'offline-sync-queue') {
    event.waitUntil(
      (async () => {
        // Post message to all clients to process offline queue
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: 'BACKGROUND_SYNC',
            tag: event.tag,
          });
        });
      })()
    );
  }
});

/**
 * Helper Functions for Periodic Background Sync
 */

/**
 * Check battery level and charging status
 * Returns true if conditions are favorable for sync
 */
async function checkBatteryConditions(): Promise<boolean> {
  try {
    // Check if Battery API is available
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      const isCharging = battery.charging;
      const batteryLevel = battery.level;

      console.log('[ServiceWorker] Battery status:', {
        level: `${(batteryLevel * 100).toFixed(0)}%`,
        charging: isCharging,
      });

      // Sync if charging or battery level is above 20%
      if (isCharging || batteryLevel > 0.2) {
        return true;
      }

      console.log('[ServiceWorker] Battery too low for sync:', `${(batteryLevel * 100).toFixed(0)}%`);
      return false;
    }

    // Battery API not available, assume conditions are OK
    console.log('[ServiceWorker] Battery API not available, proceeding with sync');
    return true;
  } catch (error) {
    console.warn('[ServiceWorker] Failed to check battery status:', error);
    // On error, assume conditions are OK
    return true;
  }
}

/**
 * Check network conditions
 * Returns true if network quality is sufficient for sync
 */
function checkNetworkConditions(): boolean {
  try {
    // Check if Network Information API is available
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    if (!connection) {
      console.log('[ServiceWorker] Network Information API not available, proceeding with sync');
      return true;
    }

    const { effectiveType, saveData, downlink } = connection;

    console.log('[ServiceWorker] Network status:', {
      effectiveType,
      saveData,
      downlink: `${downlink} Mbps`,
    });

    // Respect data saver mode
    if (saveData) {
      console.log('[ServiceWorker] Data saver mode enabled, skipping sync');
      return false;
    }

    // Check for slow connections (2g)
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      console.log('[ServiceWorker] Network too slow for sync:', effectiveType);
      return false;
    }

    // Check downlink speed if available (require at least 0.5 Mbps)
    if (downlink !== undefined && downlink < 0.5) {
      console.log('[ServiceWorker] Downlink too slow for sync:', downlink);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('[ServiceWorker] Failed to check network conditions:', error);
    // On error, assume conditions are OK
    return true;
  }
}

/**
 * Check storage quota
 * Returns true if sufficient storage is available
 */
async function checkStorageQuota(): Promise<boolean> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

      console.log('[ServiceWorker] Storage status:', {
        usage: `${(usage / 1024 / 1024).toFixed(2)} MB`,
        quota: `${(quota / 1024 / 1024).toFixed(2)} MB`,
        percentUsed: `${percentUsed.toFixed(1)}%`,
      });

      // Only sync if less than 90% of storage is used
      if (percentUsed < 90) {
        return true;
      }

      console.log('[ServiceWorker] Storage quota too high for sync:', `${percentUsed.toFixed(1)}%`);
      return false;
    }

    // Storage API not available, assume conditions are OK
    console.log('[ServiceWorker] Storage API not available, proceeding with sync');
    return true;
  } catch (error) {
    console.warn('[ServiceWorker] Failed to check storage quota:', error);
    // On error, assume conditions are OK
    return true;
  }
}

/**
 * Sync content from Zero API
 * Fetches latest data and updates cache
 */
async function syncContent(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[ServiceWorker] Starting content sync');

    // Fetch latest data from Zero sync API
    const syncEndpoints = [
      '/api/zero/pull',
      '/api/zero/changes',
      '/sync/latest',
    ];

    let syncData = null;
    let syncUrl = null;

    // Try each endpoint until one succeeds
    for (const endpoint of syncEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          syncData = await response.json();
          syncUrl = endpoint;
          console.log('[ServiceWorker] Successfully fetched from:', endpoint);
          break;
        }
      } catch (error) {
        console.log('[ServiceWorker] Failed to fetch from:', endpoint, error);
        // Continue to next endpoint
      }
    }

    if (!syncData || !syncUrl) {
      throw new Error('Failed to fetch sync data from any endpoint');
    }

    // Update API cache with fresh content
    const cache = await caches.open(API_CACHE);
    const response = new Response(JSON.stringify(syncData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300', // 5 minutes
        'X-Sync-Timestamp': new Date().toISOString(),
      },
    });

    await cache.put(syncUrl, response);
    console.log('[ServiceWorker] Updated cache with fresh content');

    // Also update any related cached API responses
    const cacheKeys = await cache.keys();
    const apiKeys = cacheKeys.filter((request) =>
      request.url.includes('/api/') || request.url.includes('/sync')
    );

    console.log('[ServiceWorker] Found', apiKeys.length, 'cached API responses to refresh');

    // Refresh up to 10 cached API responses
    const refreshPromises = apiKeys.slice(0, 10).map(async (request) => {
      try {
        const freshResponse = await fetch(request.url, {
          credentials: 'include',
        });
        if (freshResponse.ok) {
          await cache.put(request, freshResponse.clone());
          console.log('[ServiceWorker] Refreshed cache for:', request.url);
        }
      } catch (error) {
        console.log('[ServiceWorker] Failed to refresh:', request.url, error);
      }
    });

    await Promise.allSettled(refreshPromises);

    console.log('[ServiceWorker] Content sync completed successfully');
    return { success: true };
  } catch (error) {
    console.error('[ServiceWorker] Content sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Periodic Background Sync Event
 * Triggered periodically to sync content in the background
 */
self.addEventListener('periodicsync', (event: any) => {
  console.log('[ServiceWorker] Periodic sync event:', event.tag);

  if (event.tag === 'grocery-list-sync' || event.tag === 'content-sync') {
    event.waitUntil(
      (async () => {
        try {
          console.log('[ServiceWorker] Starting periodic content sync');

          // Check battery conditions
          const batteryOk = await checkBatteryConditions();
          if (!batteryOk) {
            console.log('[ServiceWorker] Skipping sync due to low battery');
            return;
          }

          // Check network conditions
          const networkOk = checkNetworkConditions();
          if (!networkOk) {
            console.log('[ServiceWorker] Skipping sync due to poor network or data saver mode');
            return;
          }

          // Check storage quota
          const storageOk = await checkStorageQuota();
          if (!storageOk) {
            console.log('[ServiceWorker] Skipping sync due to low storage');
            return;
          }

          // All conditions met, perform sync
          console.log('[ServiceWorker] All conditions met, proceeding with sync');
          const result = await syncContent();

          // Post message to all clients about sync completion
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'PERIODIC_SYNC_COMPLETE',
              tag: event.tag,
              success: result.success,
              timestamp: new Date().toISOString(),
              error: result.error,
            });
          });

          if (result.success) {
            console.log('[ServiceWorker] Periodic sync completed successfully');
          } else {
            console.error('[ServiceWorker] Periodic sync completed with errors:', result.error);
          }
        } catch (error) {
          console.error('[ServiceWorker] Periodic sync error:', error);

          // Notify clients about error
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'PERIODIC_SYNC_COMPLETE',
              tag: event.tag,
              success: false,
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
        }
      })()
    );
  }
});

/**
 * Push Event - Push Notifications
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  let notificationData = {
    title: 'Grocery List',
    body: 'You have updates',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'grocery-notification',
    requireInteraction: false,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
    } catch (error) {
      console.error('[ServiceWorker] Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

/**
 * Notification Click Event - Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // If app is already open, focus it
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }

      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })()
  );
});

/**
 * Error Event - Global error handler
 */
self.addEventListener('error', (event) => {
  console.error('[ServiceWorker] Error:', event.error);
});

/**
 * Unhandled Rejection Event - Promise rejection handler
 */
self.addEventListener('unhandledrejection', (event) => {
  console.error('[ServiceWorker] Unhandled rejection:', event.reason);
});

console.log('[ServiceWorker] Service worker loaded successfully');
