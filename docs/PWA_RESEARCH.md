# PWA and Service Worker Research Document

**Project:** Grocery List App
**Tech Stack:** React, TypeScript, Vite, Zero (real-time sync), PostgreSQL, JWT Auth
**Date:** October 2025
**Standards:** 2024 PWA Requirements

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [PWA Requirements Checklist](#pwa-requirements-checklist)
3. [Service Worker Architecture](#service-worker-architecture)
4. [Browser Compatibility Matrix](#browser-compatibility-matrix)
5. [Cache Strategies](#cache-strategies)
6. [Background Sync API](#background-sync-api)
7. [Push Notifications](#push-notifications)
8. [Implementation Best Practices](#implementation-best-practices)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)
11. [Common Pitfalls](#common-pitfalls)
12. [Vite-Specific Considerations](#vite-specific-considerations)
13. [Integration with Zero Sync](#integration-with-zero-sync)
14. [Resources](#resources)

---

## Executive Summary

This document outlines best practices for implementing Progressive Web App (PWA) capabilities in the Grocery List collaborative app. The app already has a robust offline queue system with localStorage and conflict resolution via Zero's CRDT-based sync, providing a strong foundation for PWA enhancement.

**Key Recommendations:**
- Use **Workbox 7+** for service worker management with Vite plugin
- Implement **stale-while-revalidate** for API calls, **cache-first** for static assets
- Use **Background Sync API** with fallback to existing offline queue
- Implement **Web Push** with VAPID keys for list updates
- Follow **manifest.json** best practices for installability
- Leverage existing offline infrastructure instead of duplicating logic

---

## PWA Requirements Checklist

### Core Requirements (Must Have)

- [ ] **Web App Manifest** (`manifest.json`)
  - App name, short name, description
  - Icons (192x192, 512x512 minimum)
  - Start URL and display mode
  - Theme color and background color
  - Orientation preference

- [ ] **HTTPS Connection**
  - Required for service workers (except localhost)
  - SSL certificate for production
  - Secure WebSocket connections for Zero sync

- [ ] **Service Worker**
  - Registered and active
  - Handles fetch events
  - Implements caching strategy
  - Offline fallback page

- [ ] **Installability Criteria**
  - Valid manifest.json
  - Service worker with fetch handler
  - HTTPS (or localhost)
  - Not already installed
  - User engagement signals (visited at least twice, with at least 5 minutes between visits)

### Enhanced Features (Should Have)

- [ ] **Offline Functionality**
  - Core features work offline
  - Graceful degradation
  - Sync when connection restored
  - User feedback for offline state

- [ ] **App-like Experience**
  - No browser chrome (standalone mode)
  - Custom splash screen
  - Status bar styling
  - Proper viewport configuration

- [ ] **Performance**
  - Fast initial load (<3s on 3G)
  - Smooth 60fps interactions
  - Optimized cache usage
  - Lazy loading of non-critical resources

### Advanced Features (Nice to Have)

- [ ] **Background Sync**
  - Queue mutations when offline
  - Auto-sync when connection restored
  - Progress feedback

- [ ] **Push Notifications**
  - List updates from collaborators
  - Item additions/removals
  - User permissions
  - VAPID authentication

- [ ] **App Shortcuts**
  - Quick actions (Add item, New list)
  - Context menu integration
  - Defined in manifest

- [ ] **Share Target API**
  - Receive shared text/files
  - Import lists from other apps

---

## Service Worker Architecture

### Recommended Approach: Workbox with Vite

**Why Workbox over Custom Service Worker:**

1. **Battle-tested**: Used by millions of sites
2. **Automatic precaching**: Integrates with Vite build
3. **Multiple strategies**: Built-in cache patterns
4. **Background sync**: Native support with fallbacks
5. **Debugging tools**: Chrome DevTools integration
6. **Maintenance**: Actively maintained by Google Chrome team

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                     Application                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   React UI   │◄─┤ Zero Client  │◄─┤ Offline Queue│ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────┐
│              Service Worker Layer                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Workbox Router & Strategies             │  │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │  │
│  │  │Cache-First │ │Network-First│ │Stale-While-  │ │  │
│  │  │(Static)    │ │(API/HTML)   │ │Revalidate    │ │  │
│  │  └────────────┘ └────────────┘ └──────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Background Sync Queue                     │  │
│  │  (Delegates to App's OfflineQueueManager)        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Push Notification Handler                 │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────┐
│                    Network & Storage                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │Cache Storage │  │ IndexedDB    │  │localStorage  │ │
│  │(Static+API)  │  │(Zero data)   │  │(Queue)       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Service Worker Lifecycle

```
Install → Waiting → Activate → Idle ⇄ Fetch/Message → Terminated
            ↓                              ↓
         Skip Waiting              Handle Request
```

**Key Lifecycle Events:**

1. **Install**: Download and precache static assets
2. **Activate**: Clean up old caches, take control
3. **Fetch**: Intercept network requests, apply strategies
4. **Message**: Communicate with app (skip waiting, cache updates)
5. **Sync**: Handle background sync events
6. **Push**: Handle push notifications

---

## Browser Compatibility Matrix

### Service Worker Support (2024)

| Browser | Version | Notes |
|---------|---------|-------|
| **Chrome** | 40+ | Full support, best debugging tools |
| **Edge** | 17+ | Full support (Chromium-based) |
| **Firefox** | 44+ | Full support, good debugging |
| **Safari** | 11.1+ | **Limited PWA support** (see below) |
| **iOS Safari** | 11.3+ | **Restricted features** (see below) |
| **Samsung Internet** | 4+ | Full support |
| **Opera** | 27+ | Full support |

### Safari/iOS Limitations (Critical for Planning)

**Safari 16+ (2024) Improvements:**
- Web Push now supported (iOS 16.4+, macOS 13+)
- Web App Manifest improvements
- Better service worker reliability
- IndexedDB improvements

**Remaining Limitations:**
1. **No Background Sync API** - Must rely on app's offline queue
2. **No Periodic Background Sync** - Cannot auto-sync without user action
3. **Limited Push** - Requires user to install PWA first
4. **50MB Storage Limit** - Cache and IndexedDB combined
5. **7-Day Inactivity Purge** - All data cleared if not used
6. **No App Shortcuts** - Not supported in manifest
7. **No Share Target API** - Cannot receive shared content

**Safari Fallback Strategy:**
```typescript
const hasBgSync = 'sync' in ServiceWorkerRegistration.prototype;
const hasPeriodicSync = 'periodicSync' in ServiceWorkerRegistration.prototype;
const hasNotifications = 'Notification' in window && 'serviceWorker' in navigator;

// Use existing OfflineQueueManager for Safari
if (!hasBgSync) {
  // Rely on app-level offline queue with visibility/focus events
}
```

### Feature Detection Table

| Feature | Chrome/Edge | Firefox | Safari/iOS | Detection API |
|---------|-------------|---------|------------|---------------|
| Service Worker | ✅ | ✅ | ✅ | `'serviceWorker' in navigator` |
| Background Sync | ✅ | ✅ | ❌ | `'sync' in ServiceWorkerRegistration.prototype` |
| Periodic Sync | ✅ | ❌ | ❌ | `'periodicSync' in ServiceWorkerRegistration.prototype` |
| Web Push | ✅ | ✅ | ✅ (16.4+) | `'PushManager' in window` |
| Notification | ✅ | ✅ | ✅ (16.4+) | `'Notification' in window` |
| Share Target | ✅ | ❌ | ❌ | Feature detection in manifest |
| App Shortcuts | ✅ | ❌ | ❌ | Feature detection in manifest |
| Cache API | ✅ | ✅ | ✅ | `'caches' in window` |
| IndexedDB | ✅ | ✅ | ✅ | `'indexedDB' in window` |

---

## Cache Strategies

### Strategy Selection Guide

| Resource Type | Strategy | Reason | Fallback |
|--------------|----------|--------|----------|
| **Static Assets** (JS, CSS, fonts) | Cache-First | Versioned files, immutable | Network |
| **App Shell** (HTML) | Network-First | Always fresh | Cache |
| **API Calls** (/api/*) | Stale-While-Revalidate | Fast response + freshness | Offline Queue |
| **Images/Icons** | Cache-First | Rarely change | Placeholder |
| **Zero Sync WS** | Network-Only | Real-time required | Handled by Zero |
| **User Data** | Network-First | Accuracy critical | Cache (temp) |

### 1. Cache-First (Static Assets)

**Use for:** JS bundles, CSS, fonts, versioned images

```typescript
// Workbox configuration
new workbox.strategies.CacheFirst({
  cacheName: 'static-assets-v1',
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      maxEntries: 60,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    }),
    new workbox.cacheableResponse.CacheableResponsePlugin({
      statuses: [0, 200],
    }),
  ],
});
```

**Flow:**
1. Check cache first
2. Return cached response if found
3. Fetch from network if not cached
4. Cache network response for future

**Pros:**
- Fastest response time
- Works completely offline
- Reduces bandwidth

**Cons:**
- May serve stale content if not versioned
- Requires cache busting for updates

### 2. Network-First (App Shell, HTML)

**Use for:** index.html, API endpoints requiring freshness

```typescript
new workbox.strategies.NetworkFirst({
  cacheName: 'dynamic-content-v1',
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 24 * 60 * 60, // 24 hours
    }),
    new workbox.cacheableResponse.CacheableResponsePlugin({
      statuses: [0, 200],
    }),
  ],
  networkTimeoutSeconds: 3, // Fallback to cache after 3s
});
```

**Flow:**
1. Attempt network request first
2. Return network response if successful
3. Update cache with fresh response
4. Fallback to cache if network fails

**Pros:**
- Always tries for fresh content
- Graceful offline fallback
- Good for HTML and dynamic data

**Cons:**
- Slower than cache-first
- Network dependency for best experience

### 3. Stale-While-Revalidate (API Calls)

**Use for:** REST API calls, JSON data, grocery items

```typescript
new workbox.strategies.StaleWhileRevalidate({
  cacheName: 'api-cache-v1',
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    }),
    new workbox.cacheableResponse.CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new workbox.broadcastUpdate.BroadcastUpdatePlugin(), // Notify app of updates
  ],
});
```

**Flow:**
1. Check cache and return immediately if found
2. Simultaneously fetch from network
3. Update cache with fresh response
4. Notify app of update via BroadcastChannel

**Pros:**
- Fast response (cache)
- Always updating in background
- Best of both worlds
- Ideal for real-time apps

**Cons:**
- May show stale data briefly
- Extra network requests
- More complex state management

### 4. Network-Only (Real-time Connections)

**Use for:** WebSocket connections (Zero sync), authentication

```typescript
// Don't cache WebSocket or real-time connections
workbox.routing.registerRoute(
  ({url}) => url.pathname.includes('/zero-sync'),
  new workbox.strategies.NetworkOnly()
);
```

### 5. Cache-Only (Offline Fallbacks)

**Use for:** Offline fallback page, placeholder images

```typescript
workbox.routing.registerRoute(
  ({request}) => request.destination === 'document',
  async ({event}) => {
    try {
      return await fetch(event.request);
    } catch (error) {
      return caches.match('/offline.html');
    }
  }
);
```

### Recommended Configuration for Grocery App

```typescript
// vite-plugin-pwa configuration
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      strategies: 'injectManifest', // For custom service worker
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      manifest: {
        // See manifest section below
      },

      workbox: {
        // Runtime caching rules
        runtimeCaching: [
          // Static assets (JS, CSS, fonts)
          {
            urlPattern: /\.(?:js|css|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },

          // Images
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },

          // API calls
          {
            urlPattern: /^https:\/\/.*\/api\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // HTML pages
          {
            urlPattern: ({request}) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
              },
            },
          },
        ],

        // Precache these files on install
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Don't cache these
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
};
```

---

## Background Sync API

### Overview

Background Sync allows service workers to defer actions until the user has stable connectivity. Perfect for syncing grocery list mutations when back online.

**Browser Support:**
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari/iOS: ❌ Not supported (use app-level queue)

### Integration with Existing Offline Queue

**Strategy:** Use Background Sync as an enhancement, not replacement

```typescript
// In service worker (sw.ts)
import { BackgroundSyncPlugin } from 'workbox-background-sync';

const bgSyncPlugin = new BackgroundSyncPlugin('groceryQueue', {
  maxRetentionTime: 7 * 24 * 60, // Retry for 7 days (minutes)
  onSync: async ({queue}) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        console.log('[BgSync] Request synced:', entry.request.url);
      } catch (error) {
        console.error('[BgSync] Sync failed:', error);
        await queue.unshiftRequest(entry); // Put back at front
        throw error; // Trigger retry
      }
    }
  },
});

// Use with NetworkOnly for mutation endpoints
workbox.routing.registerRoute(
  /\/api\/grocery-items\/(add|update|delete)/,
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);
```

### Hybrid Approach: SW Background Sync + App Offline Queue

**Problem:** Background Sync only works in supported browsers, and service workers can be terminated.

**Solution:** Two-tier approach

```typescript
// In app code (e.g., useGroceryMutations.ts)
import { getQueueManager } from './offlineQueue';
import { useServiceWorker } from './useServiceWorker';

export function useGroceryMutations() {
  const queueManager = getQueueManager();
  const { hasBgSync } = useServiceWorker();

  const addItem = async (item: GroceryItem) => {
    try {
      // Try immediate mutation via Zero
      await zero.mutate.grocery_items.create(item);
    } catch (error) {
      // Failed - queue for retry
      if (hasBgSync) {
        // Register background sync (service worker handles retry)
        await navigator.serviceWorker.ready.then(reg =>
          reg.sync.register('sync-groceries')
        );
      } else {
        // Fallback to app-level queue (Safari, etc.)
        queueManager.addToQueue({
          type: 'add',
          payload: item,
          // ... other fields
        });
      }
    }
  };

  return { addItem };
}
```

### Background Sync Events in Service Worker

```typescript
// sw.ts - Handle sync event
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-groceries') {
    event.waitUntil(syncGroceryMutations());
  }
});

async function syncGroceryMutations() {
  // Get queued mutations from IndexedDB or communicate with app
  const mutations = await getQueuedMutations();

  for (const mutation of mutations) {
    try {
      await fetch('/api/grocery-items', {
        method: 'POST',
        body: JSON.stringify(mutation),
        headers: {'Content-Type': 'application/json'},
      });
      await removeMutation(mutation.id);
    } catch (error) {
      console.error('[BgSync] Failed to sync mutation:', error);
      // Will retry on next sync event
    }
  }
}
```

### Feature Detection and Fallback

```typescript
// utils/serviceWorkerFeatures.ts
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  if (!('sync' in ServiceWorkerRegistration.prototype)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    return true;
  } catch (error) {
    console.error('[BgSync] Registration failed:', error);
    return false;
  }
}

export function hasBackgroundSync(): boolean {
  return (
    'serviceWorker' in navigator &&
    'sync' in ServiceWorkerRegistration.prototype
  );
}
```

### Safari Fallback: Visibility + Focus Events

```typescript
// For browsers without Background Sync (Safari)
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
  isOnline = true;
  processOfflineQueue();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isOnline) {
    processOfflineQueue(); // Sync when user returns to app
  }
});

window.addEventListener('focus', () => {
  if (isOnline) {
    processOfflineQueue(); // Sync when app gains focus
  }
});
```

---

## Push Notifications

### Overview

Web Push notifications require:
1. User permission
2. Service worker
3. VAPID keys (server identification)
4. Push service subscription
5. Backend server to send pushes

### VAPID Keys Setup

**VAPID** (Voluntary Application Server Identification) authenticates your server with push services.

#### Generating VAPID Keys

```bash
# Using web-push library (Node.js)
npm install web-push --save

# Generate keys
npx web-push generate-vapid-keys

# Output:
# Public Key: BJT...xyz (share with client)
# Private Key: abc...123 (keep secret on server)
```

#### Store in Environment Variables

```bash
# .env
VITE_VAPID_PUBLIC_KEY=BJT...xyz
VAPID_PRIVATE_KEY=abc...123  # Server only
VAPID_SUBJECT=mailto:admin@grocery-app.com
```

### Client-Side Push Setup

```typescript
// utils/pushNotifications.ts
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  if (!('PushManager' in window)) return null;

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[Push] Permission denied');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // Required
        applicationServerKey: convertedVapidKey,
      });
    }

    // Send subscription to backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        subscription,
        userId: getCurrentUserId(),
      }),
    });

    return subscription;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return null;
  }
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### Service Worker Push Handler

```typescript
// sw.ts
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};

  const options: NotificationOptions = {
    body: data.body || 'New update to your grocery list',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'grocery-update',
    data: {
      url: data.url || '/',
      listId: data.listId,
      action: data.action,
    },
    actions: [
      {
        action: 'view',
        title: 'View List',
        icon: '/icons/view.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Grocery List Update',
      options
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUnmerged: true })
        .then((clientList) => {
          // Focus existing window if open
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
```

### Backend Push Implementation (Express)

```typescript
// server/routes/push.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Store subscriptions in database
interface PushSubscription {
  userId: string;
  subscription: webpush.PushSubscription;
  createdAt: Date;
}

// Subscribe endpoint
router.post('/api/push/subscribe', authenticateJWT, async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.id;

  try {
    // Store subscription in database
    await db.insertInto('push_subscriptions')
      .values({
        user_id: userId,
        subscription: JSON.stringify(subscription),
        created_at: new Date(),
      })
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('[Push] Subscription storage failed:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Send push notification
export async function sendPushNotification(
  userId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
    listId?: string;
    action?: string;
  }
) {
  try {
    // Get user's subscriptions
    const subscriptions = await db.selectFrom('push_subscriptions')
      .where('user_id', '=', userId)
      .selectAll()
      .execute();

    const pushPromises = subscriptions.map(sub => {
      const subscription = JSON.parse(sub.subscription);
      return webpush.sendNotification(
        subscription,
        JSON.stringify(payload),
        {
          TTL: 24 * 60 * 60, // 24 hours
        }
      ).catch(error => {
        // Handle expired subscriptions
        if (error.statusCode === 410) {
          // Remove from database
          db.deleteFrom('push_subscriptions')
            .where('id', '=', sub.id)
            .execute();
        }
        console.error('[Push] Send failed:', error);
      });
    });

    await Promise.allSettled(pushPromises);
  } catch (error) {
    console.error('[Push] Notification failed:', error);
  }
}

// Trigger push on list updates
// Called when item is added/updated/deleted
export async function notifyListCollaborators(
  listId: string,
  action: 'added' | 'updated' | 'deleted',
  itemName: string,
  actorUserId: string
) {
  // Get list collaborators (excluding actor)
  const collaborators = await db.selectFrom('list_collaborators')
    .where('list_id', '=', listId)
    .where('user_id', '!=', actorUserId)
    .select('user_id')
    .execute();

  // Send push to each collaborator
  for (const collab of collaborators) {
    await sendPushNotification(collab.user_id, {
      title: 'Grocery List Updated',
      body: `${itemName} was ${action}`,
      url: `/lists/${listId}`,
      listId,
      action,
    });
  }
}
```

### Push Notification Best Practices

1. **Always ask permission at appropriate time** - Not on page load
2. **Explain the value** - Tell users why notifications are useful
3. **Allow opt-out** - Provide settings to disable/manage
4. **Respect frequency** - Don't spam users
5. **Group related notifications** - Use `tag` to replace similar notifications
6. **Handle errors gracefully** - Remove expired subscriptions
7. **Test on all platforms** - iOS requires PWA installation first

### Safari Push Limitations (iOS 16.4+)

- Requires app to be installed as PWA
- Must be added to home screen
- Notification permission requested differently
- More restricted notification frequency
- Different UI/UX for notifications

---

## Implementation Best Practices

### 1. Service Worker Registration

**Best Practice:** Register in main.tsx after app initialization

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './utils/serviceWorker';

// Initialize React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker after app loads
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}
```

```typescript
// src/utils/serviceWorker.ts
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      type: 'module', // If using ES modules
    });

    console.log('[SW] Registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          showUpdateNotification();
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

function showUpdateNotification() {
  // Notify user of update
  if (confirm('New version available! Reload to update?')) {
    window.location.reload();
  }
}
```

### 2. Update Strategy

**Use Skip Waiting for Quick Updates**

```typescript
// sw.ts
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(clients.claim());

  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('old-'))
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});
```

**Or: Notify user and let them choose**

```typescript
// In app
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Client-side
if (registration.waiting) {
  registration.waiting.postMessage('SKIP_WAITING');
}
```

### 3. Communication Between App and Service Worker

**Use BroadcastChannel or postMessage**

```typescript
// sw.ts - Notify app of cache updates
const broadcast = new BroadcastChannel('app-updates');

broadcast.postMessage({
  type: 'CACHE_UPDATED',
  url: '/api/grocery-items',
  timestamp: Date.now(),
});

// App code - Listen for updates
const channel = new BroadcastChannel('app-updates');
channel.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_UPDATED') {
    // Refresh UI or show notification
    refetchData();
  }
});
```

### 4. Debugging Service Workers

**Chrome DevTools:**
1. Open DevTools → Application → Service Workers
2. Check "Update on reload" during development
3. Use "Skip waiting" button for testing
4. Inspect cache storage in Application → Cache Storage
5. View background sync events in Application → Background Services

**Best Practices for Debugging:**
```typescript
// Add detailed logging in development
const isDev = import.meta.env.DEV;

function log(...args: any[]) {
  if (isDev) {
    console.log('[SW]', ...args);
  }
}

self.addEventListener('fetch', (event) => {
  log('Fetch:', event.request.url);
  // ... handle request
});
```

### 5. Testing Service Workers

**Test Offline Mode:**
1. Chrome DevTools → Network → Throttling → Offline
2. Or Application → Service Workers → Offline checkbox

**Test Update Flow:**
1. Register service worker
2. Make changes to sw.js
3. Reload page (with "Update on reload" checked)
4. Verify new version activates

**Test Background Sync:**
1. Go offline
2. Perform mutations
3. Go online
4. Verify sync event fires

### 6. Unregistering Service Workers (for debugging)

```typescript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

---

## Security Considerations

### 1. HTTPS Requirement

**Why:** Service workers can intercept ALL network requests, making them a security risk if served over HTTP.

**Requirements:**
- Production: Valid SSL certificate
- Development: localhost or 127.0.0.1 (exempt from HTTPS)
- Zero sync: WSS (WebSocket Secure) in production

**Certificate Options:**
- Let's Encrypt (free, automated)
- Cloudflare (free SSL)
- Paid certificate from CA

### 2. Content Security Policy (CSP)

**Update CSP headers to allow service worker:**

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  worker-src 'self';
  connect-src 'self' wss://your-zero-server.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
">
```

**For VAPID push:**
```
connect-src 'self' https://fcm.googleapis.com https://your-api.com
```

### 3. Sensitive Data in Cache

**Never cache:**
- Authentication tokens (in URLs or responses)
- User passwords
- Payment information
- Personal identifiable information (PII)

**Strategies:**
```typescript
// Exclude sensitive endpoints from caching
workbox.routing.registerRoute(
  /\/api\/(auth|user\/profile|payment)/,
  new workbox.strategies.NetworkOnly()
);

// Strip sensitive headers before caching
new workbox.cacheableResponse.CacheableResponsePlugin({
  statuses: [0, 200],
  headers: {
    'x-exclude-from-cache': 'true', // Custom header
  },
});

// Sanitize cached responses
const sanitizePlugin = {
  cacheWillUpdate: async ({response}) => {
    const clone = response.clone();
    const json = await clone.json();

    // Remove sensitive fields
    delete json.authToken;
    delete json.password;

    return new Response(JSON.stringify(json), {
      status: response.status,
      headers: response.headers,
    });
  },
};
```

### 4. Service Worker Scope Limitations

**Restrict scope to prevent over-reaching:**

```typescript
// Register with specific scope
navigator.serviceWorker.register('/sw.js', {
  scope: '/', // Only control pages under this path
});

// Don't register at root if you only need PWA for /app
navigator.serviceWorker.register('/sw.js', {
  scope: '/app',
});
```

### 5. Validate Cached Data

**Add integrity checks:**

```typescript
// Add hash/version to cached data
const cacheData = async (key: string, data: any, version: string) => {
  const cache = await caches.open('api-cache-v1');
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(data))
  );

  const response = new Response(JSON.stringify({
    data,
    version,
    hash: Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''),
  }));

  await cache.put(key, response);
};
```

### 6. Rate Limiting Push Notifications

**Prevent notification spam:**

```typescript
// Backend rate limiting
const pushRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 pushes per user per 15 min
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many push notifications. Please try again later.',
    });
  },
});

router.post('/api/push/send', authenticateJWT, pushRateLimiter, sendPush);
```

### 7. Subscription Management

**Verify push subscriptions:**

```typescript
// Server-side: Verify subscription belongs to user
router.post('/api/push/send', authenticateJWT, async (req, res) => {
  const subscription = await db.selectFrom('push_subscriptions')
    .where('user_id', '=', req.user.id)
    .where('id', '=', req.body.subscriptionId)
    .selectAll()
    .executeTakeFirst();

  if (!subscription) {
    return res.status(403).json({ error: 'Unauthorized subscription' });
  }

  // Send push...
});
```

### 8. Clear Caches on Logout

```typescript
// utils/auth.ts
export async function logout() {
  // Clear authentication
  localStorage.removeItem('authToken');

  // Clear sensitive caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.includes('api-cache'))
        .map(name => caches.delete(name))
    );
  }

  // Redirect to login
  window.location.href = '/login';
}
```

---

## Performance Optimization

### 1. Precaching Strategy

**Only precache essentials:**

```typescript
// vite.config.ts - Limit precache
VitePWA({
  workbox: {
    globPatterns: [
      '**/*.{js,css,html}',
      'icons/icon-192x192.png',
      'icons/icon-512x512.png',
    ],
    globIgnores: [
      '**/node_modules/**/*',
      '**/dev/**/*',
      '**/test/**/*',
    ],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB max
  },
});
```

**Progressive caching:** Cache routes as user visits them

### 2. Cache Expiration

**Set appropriate TTLs:**

```typescript
new workbox.expiration.ExpirationPlugin({
  maxEntries: 50, // Keep max 50 entries
  maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
  purgeOnQuotaError: true, // Auto-cleanup if storage full
})
```

### 3. Cache Size Management

**Monitor and limit cache size:**

```typescript
// Get cache size
async function getCacheSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

// Check before adding to cache
const maxCacheSize = 50 * 1024 * 1024; // 50MB
const currentSize = await getCacheSize();

if (currentSize < maxCacheSize) {
  await cache.put(request, response);
} else {
  console.warn('[Cache] Size limit reached, skipping cache');
}
```

### 4. Lazy Loading Service Worker

**Only register when needed:**

```typescript
// Register SW on user interaction or after delay
let swRegistered = false;

function lazyRegisterSW() {
  if (swRegistered) return;

  registerServiceWorker();
  swRegistered = true;
}

// Register after 5 seconds or on first interaction
setTimeout(lazyRegisterSW, 5000);
['click', 'scroll', 'keydown'].forEach(event => {
  window.addEventListener(event, lazyRegisterSW, { once: true });
});
```

### 5. Optimize Sync Frequency

**Batch sync requests:**

```typescript
// Debounce sync events
let syncTimer: NodeJS.Timeout;

function requestSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    navigator.serviceWorker.ready.then(reg =>
      reg.sync.register('sync-groceries')
    );
  }, 1000); // Wait 1s before syncing
}
```

### 6. Use Compression

**Enable compression for cached responses:**

```typescript
// Server: Send compressed responses
app.use(compression());

// Service worker: Cache compressed responses
// (No special handling needed, but verify Content-Encoding)
```

### 7. Navigation Preload

**Speed up navigation requests:**

```typescript
// sw.ts - Enable navigation preload
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Use preloaded response if available
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) return preloadResponse;

          return await fetch(event.request);
        } catch {
          return caches.match('/offline.html');
        }
      })()
    );
  }
});
```

### 8. Measure Performance

**Add performance metrics:**

```typescript
// Measure cache hit rate
let cacheHits = 0;
let cacheMisses = 0;

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open('api-cache-v1');
      const cached = await cache.match(event.request);

      if (cached) {
        cacheHits++;
        return cached;
      } else {
        cacheMisses++;
        const response = await fetch(event.request);
        await cache.put(event.request, response.clone());
        return response;
      }
    })()
  );
});

// Report metrics periodically
setInterval(() => {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total * 100).toFixed(2) : 0;
  console.log(`[Perf] Cache hit rate: ${hitRate}%`);
}, 60000); // Every minute
```

---

## Common Pitfalls

### 1. Caching Index.html Aggressively

**Problem:** Users get stuck on old version of app

**Solution:** Use Network-First for HTML

```typescript
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'html-cache',
    networkTimeoutSeconds: 3,
  })
);
```

### 2. Not Handling Service Worker Updates

**Problem:** New service worker stays in "waiting" state forever

**Solution:** Implement update flow

```typescript
// Prompt user to update
registration.addEventListener('updatefound', () => {
  const newWorker = registration.installing;
  newWorker?.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // Show update prompt
      showUpdatePrompt(() => {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  });
});
```

### 3. Caching POST Requests

**Problem:** POST requests shouldn't be cached

**Solution:** Only cache GET requests

```typescript
workbox.routing.registerRoute(
  /\/api\/.*/,
  new workbox.strategies.StaleWhileRevalidate(),
  'GET' // Only match GET requests
);
```

### 4. Forgetting to Clean Up Old Caches

**Problem:** Storage fills up with old cache versions

**Solution:** Delete old caches on activate

```typescript
const CACHE_VERSION = 'v2';

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names
          .filter(name => name !== CACHE_VERSION)
          .map(name => caches.delete(name))
      );
    })
  );
});
```

### 5. Not Testing Offline Properly

**Problem:** App breaks when offline

**Solution:**
- Test with DevTools offline mode
- Test on real device with airplane mode
- Test slow 3G connections
- Test edge cases (flaky network)

### 6. Ignoring iOS Safari Limitations

**Problem:** PWA doesn't work on iOS

**Solution:**
- Feature detection for all APIs
- Fallbacks for unsupported features
- Test on real iOS devices
- Clear documentation for users

### 7. Over-caching

**Problem:** Storage quota exceeded

**Solution:**
- Set cache expiration policies
- Limit cache sizes
- Use purgeOnQuotaError
- Monitor storage usage

```typescript
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const {usage, quota} = await navigator.storage.estimate();
  console.log(`Using ${usage} of ${quota} bytes (${(usage! / quota! * 100).toFixed(2)}%)`);
}
```

### 8. Not Handling Service Worker Errors

**Problem:** Silent failures, poor user experience

**Solution:** Implement error handling

```typescript
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
  // Log to error tracking service
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
});

// In fetch handler
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(error => {
      console.error('[SW] Fetch failed:', error);
      return caches.match('/offline.html');
    })
  );
});
```

### 9. Blocking Main Thread

**Problem:** Service worker registration slows down app

**Solution:** Register after load

```typescript
// Wait for page load
window.addEventListener('load', () => {
  registerServiceWorker();
});

// Or use requestIdleCallback
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    registerServiceWorker();
  });
} else {
  setTimeout(registerServiceWorker, 2000);
}
```

### 10. Not Versioning Cache Names

**Problem:** Can't force cache refresh

**Solution:** Include version in cache names

```typescript
const CACHE_VERSION = 'v1.2.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
```

---

## Vite-Specific Considerations

### 1. vite-plugin-pwa

**Recommended plugin for Vite + PWA**

```bash
npm install vite-plugin-pwa -D
```

**Configuration:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // Enable in dev for testing
      },

      manifest: {
        name: 'Grocery List',
        short_name: 'Groceries',
        description: 'Collaborative grocery list app',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable', // For adaptive icons
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\/api\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],

  build: {
    target: 'esnext',
    sourcemap: true, // Helpful for debugging SW
  },
});
```

### 2. TypeScript Support

**Types for service worker:**

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_VAPID_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 3. Development Mode

**Enable service worker in development:**

```typescript
VitePWA({
  devOptions: {
    enabled: true,
    type: 'module',
  },
})
```

**Or use separate config:**

```typescript
// vite.config.dev.ts
export default defineConfig({
  plugins: [
    react(),
    // No PWA plugin in dev
  ],
});

// vite.config.prod.ts
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ /* config */ }),
  ],
});
```

### 4. Handling Vite's HMR

**Service worker shouldn't interfere with HMR:**

```typescript
// sw.ts
const isDev = import.meta.env.DEV;

if (isDev) {
  // Don't cache in development
  self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
  });
} else {
  // Production caching logic
}
```

### 5. Asset Hashing

Vite automatically hashes assets. Service worker should respect this:

```typescript
// Precache manifest includes hashed files
const precacheManifest = self.__WB_MANIFEST;

workbox.precaching.precacheAndRoute(precacheManifest);
```

### 6. Build Output

**Service worker location:**
- Generated at: `dist/sw.js`
- Registered from: `/sw.js` (root)
- Scope: `/` (entire app)

### 7. Custom Service Worker (injectManifest)

**For more control:**

```typescript
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
})
```

```typescript
// src/sw.ts
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Precache assets
precacheAndRoute(self.__WB_MANIFEST);

// Custom logic
self.addEventListener('fetch', (event) => {
  // Custom fetch handling
});
```

---

## Integration with Zero Sync

### Understanding Zero's Architecture

Zero provides real-time sync with:
- **Client-side cache**: IndexedDB
- **Real-time updates**: WebSocket connection
- **Offline mutations**: Queued automatically
- **Conflict resolution**: CRDT-based

### Service Worker's Role with Zero

**What SW Should Handle:**
1. Static asset caching (JS, CSS)
2. App shell (HTML)
3. Background sync triggers
4. Push notifications for updates

**What SW Should NOT Handle:**
1. Zero's WebSocket connection (let Zero manage)
2. Zero's IndexedDB (let Zero manage)
3. Duplicate offline queue (use app's queue)

### Recommended Integration Pattern

```typescript
// Don't cache Zero sync endpoints
workbox.routing.registerRoute(
  ({url}) => url.pathname.includes('/zero-sync'),
  new workbox.strategies.NetworkOnly()
);

// Don't interfere with WebSocket connections
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Let Zero handle its own connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return; // Don't intercept
  }

  // ... other fetch handling
});
```

### Coordinating Offline State

**Share online/offline state between Zero and SW:**

```typescript
// Use BroadcastChannel for coordination
const syncChannel = new BroadcastChannel('sync-state');

// Zero client
window.addEventListener('online', () => {
  syncChannel.postMessage({ type: 'ONLINE' });
  // Zero will auto-sync
});

window.addEventListener('offline', () => {
  syncChannel.postMessage({ type: 'OFFLINE' });
});

// Service worker
const syncChannel = new BroadcastChannel('sync-state');
syncChannel.addEventListener('message', (event) => {
  if (event.data.type === 'ONLINE') {
    // Trigger background sync if needed
    self.registration.sync.register('sync-groceries');
  }
});
```

### Push Notifications for Zero Updates

**Notify users of real-time changes from other clients:**

```typescript
// Backend: After mutation is processed
if (mutation.type === 'grocery_item_added') {
  // Send push to all collaborators
  const listCollaborators = await getListCollaborators(mutation.listId);

  for (const userId of listCollaborators) {
    await sendPushNotification(userId, {
      title: 'Item Added',
      body: `${mutation.itemName} was added to the list`,
      url: `/lists/${mutation.listId}`,
    });
  }
}
```

### Avoiding Conflicts

**Don't cache Zero mutation responses:**

```typescript
workbox.routing.registerRoute(
  /\/api\/zero-mutate/,
  new workbox.strategies.NetworkOnly()
);
```

**Use app's conflict resolution:**

Zero already has CRDT-based conflict resolution. Service worker should not interfere.

---

## Resources

### Official Documentation

- **PWA:**
  - [web.dev PWA Guide](https://web.dev/progressive-web-apps/) - Google's comprehensive guide
  - [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
  - [PWA Builder](https://www.pwabuilder.com/) - Tools and validation

- **Service Workers:**
  - [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
  - [Service Worker Cookbook](https://serviceworke.rs/) - Recipes and examples
  - [Chrome Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)

- **Workbox:**
  - [Workbox Documentation](https://developers.google.com/web/tools/workbox/)
  - [Workbox Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
  - [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) - Vite integration

- **Background Sync:**
  - [Background Sync API](https://developers.google.com/web/updates/2015/12/background-sync)
  - [Periodic Background Sync](https://web.dev/periodic-background-sync/)

- **Push Notifications:**
  - [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications/)
  - [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292)
  - [web-push Library](https://github.com/web-push-libs/web-push)

- **Safari/iOS:**
  - [Apple PWA Documentation](https://developer.apple.com/documentation/webkit/progressive_web_apps)
  - [iOS 16.4 Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

### Tools

- **Testing:**
  - [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA auditing
  - [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
  - [PWA Audit Tool](https://www.pwaaudit.com/)

- **Icon Generation:**
  - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
  - [RealFaviconGenerator](https://realfavicongenerator.net/)

- **Debugging:**
  - Chrome DevTools → Application tab
  - Firefox DevTools → Storage tab
  - Safari → Develop → Service Workers

### Libraries

```json
{
  "dependencies": {
    "workbox-window": "^7.0.0",
    "web-push": "^3.6.6"
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.19.0",
    "workbox-build": "^7.0.0",
    "workbox-core": "^7.0.0",
    "workbox-precaching": "^7.0.0",
    "workbox-routing": "^7.0.0",
    "workbox-strategies": "^7.0.0",
    "workbox-expiration": "^7.0.0",
    "workbox-background-sync": "^7.0.0"
  }
}
```

### Learning Resources

- [PWA Masterclass (free)](https://firt.dev/pwa)
- [Service Worker Fundamentals (YouTube)](https://www.youtube.com/watch?v=ksXwaWHCW6k)
- [Workbox Crash Course](https://www.youtube.com/watch?v=zBRzVeLiEQE)

### Community

- [PWA Slack Community](https://aka.ms/pwa-slack)
- [r/PWA on Reddit](https://reddit.com/r/PWA)
- Stack Overflow: `[progressive-web-apps]` tag

### Browser Status

- [Can I Use - Service Worker](https://caniuse.com/serviceworkers)
- [Can I Use - Push API](https://caniuse.com/push-api)
- [Can I Use - Background Sync](https://caniuse.com/background-sync)
- [MDN Browser Compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API#browser_compatibility)

---

## Next Steps for Implementation

1. **Phase 1: Basic PWA**
   - Add manifest.json
   - Generate icons
   - Register service worker
   - Test installability

2. **Phase 2: Offline Support**
   - Configure Workbox caching
   - Test offline functionality
   - Add offline fallback page

3. **Phase 3: Background Sync**
   - Integrate Background Sync API
   - Connect to existing offline queue
   - Test sync behavior

4. **Phase 4: Push Notifications**
   - Generate VAPID keys
   - Implement push subscription
   - Backend notification system
   - Test on all platforms

5. **Phase 5: Optimization**
   - Performance auditing
   - Cache strategy tuning
   - Safari compatibility testing
   - Production deployment

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Maintainer:** Development Team
