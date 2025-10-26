/**
 * Service Worker for Grocery List App
 *
 * This service worker provides:
 * - Offline support with intelligent caching strategies
 * - Background sync for offline mutations
 * - Push notification support
 * - Automatic updates with skip waiting
 * - Cache versioning and cleanup
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
