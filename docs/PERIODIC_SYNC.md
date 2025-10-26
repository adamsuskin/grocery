# Periodic Background Sync Documentation

**Project:** Grocery List App
**Feature:** Periodic Background Sync
**Version:** 1.0
**Last Updated:** October 2025
**Status:** Implementation Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Browser Support Matrix](#browser-support-matrix)
3. [How It Works in This App](#how-it-works-in-this-app)
4. [User Guide](#user-guide)
5. [Developer Guide](#developer-guide)
6. [API Reference](#api-reference)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [FAQ](#faq)
9. [Security and Privacy](#security-and-privacy)
10. [Performance Considerations](#performance-considerations)
11. [Best Practices](#best-practices)
12. [Related Documentation](#related-documentation)

---

## Overview

### What is Periodic Background Sync?

Periodic Background Sync is a web API that allows Progressive Web Apps (PWAs) to periodically synchronize data in the background, even when the app is not open. This ensures that data stays fresh and up-to-date without requiring the user to manually open the app.

### Key Features

- **Automatic Updates:** Keep grocery lists synchronized automatically
- **Battery-Aware:** Browser schedules syncs based on device state
- **Network-Aware:** Waits for stable connections before syncing
- **User-Controlled:** Users can enable/disable background sync
- **Power-Efficient:** Leverages OS-level scheduling for optimal battery life

### Benefits for Grocery List App

1. **Fresh Data:** Always see the latest items added by collaborators
2. **Reduced Manual Syncs:** No need to manually refresh the app
3. **Better Offline Experience:** Pre-sync data before going offline
4. **Seamless Collaboration:** Changes from others appear automatically
5. **Reduced Data Usage:** Efficient syncing reduces network traffic

### Limitations

- **Browser Support:** Limited to Chromium-based browsers (Chrome, Edge, Opera)
- **User Engagement Required:** Requires app to be installed as PWA
- **Minimum Interval:** Cannot sync more frequently than 12 hours
- **Battery Constraints:** May not run on low battery
- **Network Constraints:** Requires stable connection

---

## Browser Support Matrix

### Full Support

| Browser | Platform | Minimum Version | Notes |
|---------|----------|-----------------|-------|
| Chrome | Desktop | 80+ | Full support |
| Chrome | Android | 80+ | Full support |
| Edge | Desktop | 80+ | Full support (Chromium) |
| Edge | Android | 80+ | Full support |
| Opera | Desktop | 67+ | Full support |
| Opera | Android | 57+ | Full support |
| Samsung Internet | Android | 13.0+ | Full support |

### No Support (Fallback Required)

| Browser | Platform | Reason | Fallback Strategy |
|---------|----------|--------|-------------------|
| Firefox | All | Not implemented | Regular Background Sync |
| Safari | All | Not implemented | Visibility/Focus events |
| iOS Safari | iOS | Not implemented | Visibility/Focus events |
| Internet Explorer | All | Not supported | Manual refresh |

### Feature Detection

```javascript
// Check if Periodic Background Sync is supported
if ('periodicSync' in ServiceWorkerRegistration.prototype) {
  console.log('Periodic Background Sync is supported');
} else {
  console.log('Periodic Background Sync is NOT supported');
}
```

### Browser Behavior Differences

#### Chrome (Desktop)
- Syncs every 12 hours by default
- Respects power saver mode
- Reduces frequency on low battery
- Can sync while app is closed

#### Chrome (Android)
- More aggressive battery optimization
- May skip syncs on low battery
- Requires app engagement (site visit)
- Syncs less frequently than desktop

#### Edge (Chromium)
- Identical behavior to Chrome
- Follows same battery/network constraints
- Syncs every 12+ hours

#### Samsung Internet
- More conservative sync scheduling
- May require more frequent app engagement
- Similar to Chrome Android

---

## How It Works in This App

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Grocery List App                         │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   React UI     │  │  Zero Client   │  │  SyncContext  │ │
│  └────────┬───────┘  └────────┬───────┘  └───────┬───────┘ │
│           │                    │                    │         │
│           └────────────────────┴────────────────────┘         │
│                              │                                │
└──────────────────────────────┼────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────┐
│              Service Worker (sw.ts)                           │
│  ┌──────────────────────────────────────────────────────────┐│
│  │         Periodic Sync Event Handler                       ││
│  │  - Registered tag: 'grocery-sync'                         ││
│  │  - Interval: 12 hours (minimum)                           ││
│  │  - Triggers: Zero sync, offline queue processing          ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │         Background Sync Queue (Fallback)                  ││
│  │  - Used when periodic sync unavailable                    ││
│  │  - Workbox BackgroundSyncPlugin                           ││
│  └──────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                   Browser Scheduler                           │
│  - Monitors battery level                                     │
│  - Monitors network connectivity                              │
│  - Schedules sync events based on constraints                 │
└───────────────────────────────────────────────────────────────┘
```

### Integration with Zero Sync

The Grocery List App uses Zero for real-time synchronization. Periodic Background Sync complements Zero by:

1. **Pre-fetching Updates:** Syncs data before user opens app
2. **Offline Queue Processing:** Processes pending mutations periodically
3. **Conflict Prevention:** Reduces chances of conflicts by staying current
4. **Battery Efficiency:** Leverages browser scheduling instead of polling

### Data Flow

```
1. Browser schedules periodic sync (every 12+ hours)
   │
   ├──> Checks battery level (>= 20%)
   ├──> Checks network connection (WiFi preferred)
   └──> Checks user engagement (visited recently)

2. Service worker receives 'periodicsync' event
   │
   ├──> Fetches latest data from Zero server
   ├──> Processes offline queue if any
   ├──> Updates IndexedDB cache
   └──> Resolves conflicts if needed

3. App automatically reflects changes when opened
   │
   └──> Zero client reads from IndexedDB cache
```

### Sync Triggers

Periodic syncs are triggered by:

1. **Time-based:** Every 12+ hours (browser decides exact interval)
2. **Engagement-based:** After user visits app (Chrome optimization)
3. **Network-based:** When good network connection available
4. **Battery-based:** When device has sufficient battery

### Fallback Strategies

When Periodic Background Sync is not available:

1. **Regular Background Sync:** One-time sync when connection restored
2. **Visibility Events:** Sync when user returns to app
3. **Focus Events:** Sync when app gains focus
4. **Manual Sync:** User-triggered sync button

---

## User Guide

### Enabling Periodic Background Sync

#### Prerequisites

1. **Install PWA:** Add app to home screen
   - **Chrome Desktop:** Click install button in address bar
   - **Chrome Android:** Menu → "Add to Home screen"
   - **Edge Desktop:** Click install button in address bar

2. **Grant Permissions:** Allow notifications (optional but recommended)
   - Click "Allow" when prompted
   - Or: Settings → Notifications → Enable for this site

3. **Use App Regularly:** Visit app at least once per week
   - Browser requires engagement to enable periodic sync
   - More frequent visits = more reliable syncing

#### Steps to Enable

1. Open the Grocery List app
2. Click the **Settings** icon (gear icon)
3. Navigate to **Sync Settings**
4. Toggle **"Enable Periodic Background Sync"** to ON
5. Choose sync interval (if supported):
   - Default: 12 hours (browser minimum)
   - Custom: 24 hours, 48 hours (more battery-friendly)

#### Verifying It's Working

Check sync status:

1. Open app
2. Look for sync indicator in header
3. Click sync icon to expand details
4. Check "Last Periodic Sync" timestamp
5. Verify "Next Periodic Sync" shows estimated time

### Configuring Sync Preferences

#### Sync Frequency

While the browser enforces a minimum 12-hour interval, you can configure preferences:

- **Default (12 hours):** Balanced approach
- **Daily (24 hours):** Better battery life
- **Every 2 days (48 hours):** Maximum battery savings

**Note:** Browser may schedule less frequently than requested based on:
- Battery level
- Network availability
- App usage patterns

#### Battery Optimization

Configure when syncs should occur:

- **Always Sync:** Sync regardless of battery level (not recommended)
- **Skip on Low Battery:** Skip syncs when battery < 20% (default)
- **WiFi Only:** Only sync on WiFi connections (recommended for mobile)

#### Notification Preferences

Control notifications after background syncs:

- **Notify on New Items:** Get notified when collaborators add items
- **Notify on Updates:** Get notified when items are modified
- **Notify on Sync Errors:** Get notified if sync fails
- **Silent Sync:** No notifications (default)

### Monitoring Sync Activity

#### Sync Status Indicator

The app displays real-time sync status:

- **Green Dot:** Last sync successful
- **Yellow Dot:** Sync in progress
- **Red Dot:** Sync failed or disabled
- **Gray Dot:** Periodic sync not supported

#### Sync History

View detailed sync history:

1. Open **Settings**
2. Navigate to **Sync History**
3. View list of recent syncs:
   - Timestamp
   - Sync type (periodic, manual, automatic)
   - Items synced
   - Duration
   - Success/failure status

#### Debug Mode

Enable detailed logging:

1. Open **Settings**
2. Navigate to **Advanced**
3. Enable **"Debug Mode"**
4. Open browser DevTools (F12)
5. View console logs with `[PeriodicSync]` prefix

### Troubleshooting Common Issues

#### Issue: Periodic Sync Not Working

**Symptoms:**
- "Last Periodic Sync" shows "Never"
- Sync status shows "Not supported" or "Disabled"

**Solutions:**
1. Verify browser support (Chrome/Edge 80+)
2. Ensure app is installed as PWA
3. Check site permissions (Settings → Site Settings)
4. Verify app engagement (visit at least weekly)
5. Check battery level (should be > 20%)

#### Issue: Syncs Too Infrequent

**Symptoms:**
- Syncs happen less than every 12 hours
- Data not updating in background

**Solutions:**
1. Use app more frequently (increases priority)
2. Keep app installed and engaged with
3. Ensure WiFi/good network connection
4. Check battery optimization settings
5. Verify sync preferences in app settings

#### Issue: Battery Drain

**Symptoms:**
- Battery draining faster than usual
- Phone heating up

**Solutions:**
1. Increase sync interval to 24 or 48 hours
2. Enable "WiFi Only" mode
3. Enable "Skip on Low Battery"
4. Disable sync temporarily
5. Check other apps for battery usage

#### Issue: Sync Errors

**Symptoms:**
- Sync fails repeatedly
- Error messages in sync history

**Solutions:**
1. Check internet connection
2. Verify server is reachable
3. Clear app cache (Settings → Clear Cache)
4. Re-install PWA
5. Contact support with error logs

### Disabling Periodic Background Sync

If you prefer manual syncing:

1. Open **Settings**
2. Navigate to **Sync Settings**
3. Toggle **"Enable Periodic Background Sync"** to OFF
4. Choose alternative sync methods:
   - Manual Sync: Tap refresh button
   - Automatic Sync: Sync when app opens
   - Visibility Sync: Sync when switching to app

---

## Developer Guide

### Implementation Overview

This section covers how to implement and extend Periodic Background Sync in the Grocery List app.

### Prerequisites

**Knowledge Requirements:**
- Service Workers fundamentals
- Workbox library
- Zero sync architecture
- PWA concepts
- TypeScript/JavaScript

**Technical Requirements:**
- Node.js 16+
- Vite build tool
- vite-plugin-pwa installed
- HTTPS development environment

### Project Structure

```
grocery/
├── src/
│   ├── sw.ts                          # Service worker (periodic sync handler)
│   ├── utils/
│   │   ├── serviceWorkerRegistration.ts  # SW registration & setup
│   │   ├── periodicSync.ts            # Periodic sync utilities
│   │   └── offlineQueue.ts            # Offline queue manager
│   ├── contexts/
│   │   └── SyncContext.tsx            # Sync state management
│   └── components/
│       └── SyncStatus.tsx             # Sync status UI
├── docs/
│   ├── PERIODIC_SYNC.md               # This file
│   ├── PERIODIC_SYNC_ARCHITECTURE.md  # Technical architecture
│   ├── PERIODIC_SYNC_BROWSER_SUPPORT.md  # Browser compatibility
│   └── PERIODIC_SYNC_TESTING.md       # Testing guide
└── vite.config.ts                     # Vite PWA configuration
```

### Basic Implementation

#### 1. Service Worker Setup

Add periodic sync handler to `src/sw.ts`:

```typescript
/**
 * Periodic Sync Event Handler
 * Triggered by browser at configured intervals
 */
self.addEventListener('periodicsync', (event) => {
  console.log('[PeriodicSync] Event received:', event.tag);

  if (event.tag === 'grocery-sync') {
    event.waitUntil(
      performPeriodicSync()
        .then(() => {
          console.log('[PeriodicSync] Sync completed successfully');
        })
        .catch((error) => {
          console.error('[PeriodicSync] Sync failed:', error);
        })
    );
  }
});

/**
 * Perform periodic sync operation
 */
async function performPeriodicSync(): Promise<void> {
  try {
    // 1. Notify all clients that sync is starting
    await notifyClients('PERIODIC_SYNC_START');

    // 2. Fetch latest data from Zero server
    await syncZeroData();

    // 3. Process offline queue if any
    await processOfflineQueue();

    // 4. Notify clients of completion
    await notifyClients('PERIODIC_SYNC_COMPLETE', {
      timestamp: Date.now(),
      itemsSynced: 0, // Update with actual count
    });
  } catch (error) {
    console.error('[PeriodicSync] Error during sync:', error);
    await notifyClients('PERIODIC_SYNC_ERROR', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Sync data with Zero server
 */
async function syncZeroData(): Promise<void> {
  // Fetch latest changes from Zero
  const response = await fetch('/api/zero/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lastSyncTime: await getLastSyncTime(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  const data = await response.json();

  // Update local cache with new data
  await updateLocalCache(data);
}

/**
 * Process offline queue
 */
async function processOfflineQueue(): Promise<void> {
  // Get pending mutations from queue
  const queue = await getOfflineQueue();

  if (queue.length === 0) {
    return;
  }

  // Process each queued mutation
  for (const mutation of queue) {
    try {
      await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers,
        body: mutation.body,
      });

      // Remove from queue on success
      await removeFromQueue(mutation.id);
    } catch (error) {
      console.error('[PeriodicSync] Failed to process mutation:', error);
      // Keep in queue for next sync
    }
  }
}

/**
 * Notify all clients of sync events
 */
async function notifyClients(type: string, data?: any): Promise<void> {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  clients.forEach((client) => {
    client.postMessage({
      type,
      data,
      timestamp: Date.now(),
    });
  });
}
```

#### 2. Registration in Client

Create `src/utils/periodicSync.ts`:

```typescript
/**
 * Periodic Background Sync Utilities
 */

/**
 * Register periodic background sync
 * @param tag - Sync tag identifier
 * @param minInterval - Minimum interval in milliseconds (12 hours minimum)
 */
export async function registerPeriodicSync(
  tag: string = 'grocery-sync',
  minInterval: number = 12 * 60 * 60 * 1000 // 12 hours
): Promise<boolean> {
  // Check if periodic sync is supported
  if (!('periodicSync' in ServiceWorkerRegistration.prototype)) {
    console.warn('[PeriodicSync] Not supported in this browser');
    return false;
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Request permission for periodic sync
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as PermissionName,
    });

    if (status.state === 'denied') {
      console.warn('[PeriodicSync] Permission denied');
      return false;
    }

    // Register periodic sync
    await registration.periodicSync.register(tag, {
      minInterval,
    });

    console.log('[PeriodicSync] Registered successfully:', tag);
    return true;
  } catch (error) {
    console.error('[PeriodicSync] Registration failed:', error);
    return false;
  }
}

/**
 * Unregister periodic background sync
 * @param tag - Sync tag identifier
 */
export async function unregisterPeriodicSync(
  tag: string = 'grocery-sync'
): Promise<boolean> {
  if (!('periodicSync' in ServiceWorkerRegistration.prototype)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.periodicSync.unregister(tag);
    console.log('[PeriodicSync] Unregistered successfully:', tag);
    return true;
  } catch (error) {
    console.error('[PeriodicSync] Unregistration failed:', error);
    return false;
  }
}

/**
 * Get list of registered periodic syncs
 */
export async function getPeriodicSyncTags(): Promise<string[]> {
  if (!('periodicSync' in ServiceWorkerRegistration.prototype)) {
    return [];
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const tags = await registration.periodicSync.getTags();
    return tags;
  } catch (error) {
    console.error('[PeriodicSync] Failed to get tags:', error);
    return [];
  }
}

/**
 * Check if a specific periodic sync is registered
 * @param tag - Sync tag to check
 */
export async function isPeriodicSyncRegistered(
  tag: string = 'grocery-sync'
): Promise<boolean> {
  const tags = await getPeriodicSyncTags();
  return tags.includes(tag);
}

/**
 * Check if periodic sync is supported
 */
export function isPeriodicSyncSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'periodicSync' in ServiceWorkerRegistration.prototype
  );
}

/**
 * Get permission status for periodic sync
 */
export async function getPeriodicSyncPermission(): Promise<PermissionState> {
  if (!isPeriodicSyncSupported()) {
    return 'denied';
  }

  try {
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as PermissionName,
    });
    return status.state;
  } catch (error) {
    console.error('[PeriodicSync] Permission query failed:', error);
    return 'denied';
  }
}
```

#### 3. React Integration

Update `src/contexts/SyncContext.tsx`:

```typescript
import {
  registerPeriodicSync,
  unregisterPeriodicSync,
  isPeriodicSyncRegistered,
  isPeriodicSyncSupported,
} from '../utils/periodicSync';

export function SyncProvider({ children }: { children: ReactNode }) {
  const [periodicSyncEnabled, setPeriodicSyncEnabled] = useState(false);
  const [lastPeriodicSync, setLastPeriodicSync] = useState<number | null>(null);

  // Check if periodic sync is already registered
  useEffect(() => {
    async function checkPeriodicSync() {
      if (isPeriodicSyncSupported()) {
        const registered = await isPeriodicSyncRegistered();
        setPeriodicSyncEnabled(registered);
      }
    }
    checkPeriodicSync();
  }, []);

  // Listen for periodic sync events from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PERIODIC_SYNC_COMPLETE') {
        setLastPeriodicSync(event.data.timestamp);
        console.log('[PeriodicSync] Sync completed:', event.data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Enable periodic sync
  const enablePeriodicSync = useCallback(async () => {
    const success = await registerPeriodicSync('grocery-sync');
    setPeriodicSyncEnabled(success);
    return success;
  }, []);

  // Disable periodic sync
  const disablePeriodicSync = useCallback(async () => {
    const success = await unregisterPeriodicSync('grocery-sync');
    setPeriodicSyncEnabled(!success);
    return success;
  }, []);

  // Add to context value
  const value = {
    // ... existing context values
    periodicSyncEnabled,
    lastPeriodicSync,
    enablePeriodicSync,
    disablePeriodicSync,
    isPeriodicSyncSupported: isPeriodicSyncSupported(),
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
```

### Advanced Implementation

#### Custom Sync Intervals

Allow users to configure sync interval:

```typescript
export async function setPeriodicSyncInterval(
  hours: number = 12
): Promise<boolean> {
  const minInterval = hours * 60 * 60 * 1000;

  // Unregister existing
  await unregisterPeriodicSync('grocery-sync');

  // Re-register with new interval
  return await registerPeriodicSync('grocery-sync', minInterval);
}
```

#### Conditional Syncing

Only sync when certain conditions are met:

```typescript
async function performPeriodicSync(): Promise<void> {
  // Check battery level
  const battery = await navigator.getBattery?.();
  if (battery && battery.level < 0.2) {
    console.log('[PeriodicSync] Skipping sync due to low battery');
    return;
  }

  // Check network connection
  const connection = (navigator as any).connection;
  if (connection && connection.effectiveType === 'slow-2g') {
    console.log('[PeriodicSync] Skipping sync due to slow connection');
    return;
  }

  // Proceed with sync
  await syncZeroData();
}
```

#### Sync Statistics

Track sync performance:

```typescript
interface SyncStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  lastSyncTime: number | null;
}

async function trackSyncStats(
  success: boolean,
  duration: number
): Promise<void> {
  const stats: SyncStats = JSON.parse(
    localStorage.getItem('periodic_sync_stats') || '{}'
  );

  stats.totalSyncs = (stats.totalSyncs || 0) + 1;

  if (success) {
    stats.successfulSyncs = (stats.successfulSyncs || 0) + 1;
  } else {
    stats.failedSyncs = (stats.failedSyncs || 0) + 1;
  }

  stats.averageDuration = (
    (stats.averageDuration || 0) * (stats.totalSyncs - 1) + duration
  ) / stats.totalSyncs;

  stats.lastSyncTime = Date.now();

  localStorage.setItem('periodic_sync_stats', JSON.stringify(stats));
}
```

### Testing During Development

#### Enable in DevTools

1. Open Chrome DevTools (F12)
2. Navigate to **Application** → **Service Workers**
3. Check **"Update on reload"**
4. Click **"periodicSync"** button to trigger manually

#### Simulate Sync Events

```typescript
// In DevTools Console
navigator.serviceWorker.ready.then(reg => {
  reg.periodicSync.register('grocery-sync', { minInterval: 1000 });
});

// Trigger sync manually (Chrome 80+)
// Application → Background Services → Periodic Background Sync
// Click "Start recording" and trigger sync
```

#### Debug Logging

Enable verbose logging:

```typescript
// In sw.ts
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[PeriodicSync]', ...args);
  }
}
```

### Extending Functionality

#### Add Custom Sync Logic

```typescript
// src/utils/customSync.ts
export async function syncCategories(): Promise<void> {
  // Custom sync logic for categories
  const response = await fetch('/api/categories');
  const categories = await response.json();

  // Update IndexedDB
  const db = await openDB('grocery-db');
  await db.put('categories', categories);
}

export async function syncPriceHistory(): Promise<void> {
  // Custom sync logic for price history
  // ...
}

// In sw.ts periodic sync handler
async function performPeriodicSync(): Promise<void> {
  await syncZeroData();
  await syncCategories();
  await syncPriceHistory();
}
```

#### Prioritized Syncing

Sync high-priority data first:

```typescript
async function performPeriodicSync(): Promise<void> {
  const priorities = [
    { name: 'Critical', fn: syncGroceryItems, weight: 1 },
    { name: 'Important', fn: syncSharedLists, weight: 2 },
    { name: 'Normal', fn: syncCategories, weight: 3 },
    { name: 'Low', fn: syncPriceHistory, weight: 4 },
  ];

  for (const task of priorities) {
    try {
      await task.fn();
      console.log(`[PeriodicSync] ${task.name} sync completed`);
    } catch (error) {
      console.error(`[PeriodicSync] ${task.name} sync failed:`, error);
      if (task.weight <= 2) {
        // Critical/Important tasks - abort sync
        throw error;
      }
      // Continue with remaining tasks for Normal/Low priority
    }
  }
}
```

---

## API Reference

### PeriodicSyncManager Interface

#### Methods

##### `register()`

Register a periodic background sync.

**Syntax:**
```typescript
periodicSync.register(tag: string, options?: PeriodicSyncOptions): Promise<void>
```

**Parameters:**
- `tag` (string): Unique identifier for the periodic sync
- `options` (object, optional):
  - `minInterval` (number): Minimum interval in milliseconds (default: 12 hours)

**Returns:** Promise that resolves when registration is complete

**Example:**
```typescript
const registration = await navigator.serviceWorker.ready;
await registration.periodicSync.register('grocery-sync', {
  minInterval: 12 * 60 * 60 * 1000 // 12 hours
});
```

**Errors:**
- `NotSupportedError`: Periodic sync not supported
- `NotAllowedError`: Permission denied
- `InvalidStateError`: Service worker not active

##### `unregister()`

Unregister a periodic background sync.

**Syntax:**
```typescript
periodicSync.unregister(tag: string): Promise<void>
```

**Parameters:**
- `tag` (string): Identifier of the periodic sync to unregister

**Returns:** Promise that resolves when unregistration is complete

**Example:**
```typescript
const registration = await navigator.serviceWorker.ready;
await registration.periodicSync.unregister('grocery-sync');
```

##### `getTags()`

Get list of registered periodic sync tags.

**Syntax:**
```typescript
periodicSync.getTags(): Promise<string[]>
```

**Returns:** Promise that resolves with array of registered tags

**Example:**
```typescript
const registration = await navigator.serviceWorker.ready;
const tags = await registration.periodicSync.getTags();
console.log('Registered tags:', tags); // ['grocery-sync']
```

### Events

#### `periodicsync`

Fired in service worker when periodic sync should occur.

**Event Properties:**
- `tag` (string): The tag of the periodic sync
- `waitUntil(promise)`: Extend event lifetime until promise resolves

**Example:**
```typescript
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'grocery-sync') {
    event.waitUntil(performSync());
  }
});
```

### TypeScript Definitions

```typescript
// Global namespace augmentation
declare global {
  interface ServiceWorkerRegistration {
    periodicSync: PeriodicSyncManager;
  }

  interface PeriodicSyncManager {
    register(tag: string, options?: PeriodicSyncOptions): Promise<void>;
    unregister(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }

  interface PeriodicSyncOptions {
    minInterval?: number;
  }

  interface PeriodicSyncEvent extends ExtendableEvent {
    tag: string;
  }

  interface ServiceWorkerGlobalScopeEventMap {
    periodicsync: PeriodicSyncEvent;
  }
}
```

### Permissions API

#### Query Permission

```typescript
const status = await navigator.permissions.query({
  name: 'periodic-background-sync' as PermissionName
});

console.log('Permission state:', status.state);
// 'granted', 'denied', or 'prompt'
```

#### Permission States

- `granted`: User has granted permission
- `denied`: User has denied permission
- `prompt`: User hasn't been asked yet

### Browser API Differences

#### Chrome/Edge

```typescript
// Full API support
await registration.periodicSync.register('tag', {
  minInterval: 12 * 60 * 60 * 1000
});
```

#### Firefox/Safari

```typescript
// Not supported - use feature detection
if ('periodicSync' in ServiceWorkerRegistration.prototype) {
  // Use periodic sync
} else {
  // Use fallback (regular background sync or visibility events)
}
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Periodic Sync Not Firing

**Symptoms:**
- Service worker never receives `periodicsync` event
- No sync activity in Chrome DevTools
- Data not updating in background

**Diagnostic Steps:**

1. **Check Browser Support**
   ```javascript
   console.log('Periodic sync supported:',
     'periodicSync' in ServiceWorkerRegistration.prototype
   );
   ```

2. **Check Registration**
   ```javascript
   const registration = await navigator.serviceWorker.ready;
   const tags = await registration.periodicSync.getTags();
   console.log('Registered tags:', tags);
   ```

3. **Check Service Worker Status**
   ```javascript
   console.log('SW state:', registration.active?.state);
   console.log('SW controller:', navigator.serviceWorker.controller);
   ```

**Solutions:**

- **Use Chrome/Edge 80+:** Periodic sync only works on Chromium browsers
- **Install as PWA:** Must be installed to home screen
- **Visit regularly:** Use app at least once per week
- **Check battery:** Device must have > 20% battery
- **Wait for browser:** Browser decides when to sync (may take 12+ hours)

#### Issue 2: Sync Happens Too Infrequently

**Symptoms:**
- Syncs occur less than once per day
- Browser ignores minInterval setting
- Stale data when opening app

**Diagnostic Steps:**

1. **Check Last Sync Time**
   ```javascript
   const lastSync = localStorage.getItem('last_periodic_sync');
   console.log('Last sync:', new Date(parseInt(lastSync)));
   ```

2. **Check Browser Heuristics**
   - Open chrome://site-engagement
   - Find your app's domain
   - Check engagement score

**Solutions:**

- **Increase Engagement:** Use app more frequently
- **Keep PWA Installed:** Don't uninstall app
- **Use on WiFi:** Syncs more likely on WiFi
- **Charge Device:** Syncs more likely when charging
- **Clear Browser Data:** Reset sync schedule
  - Settings → Privacy → Clear browsing data
  - Check "Site settings"

#### Issue 3: Permission Denied

**Symptoms:**
- `registration.periodicSync.register()` throws error
- Permission query returns 'denied'
- Cannot register periodic sync

**Diagnostic Steps:**

1. **Check Permission Status**
   ```javascript
   const permission = await navigator.permissions.query({
     name: 'periodic-background-sync'
   });
   console.log('Permission:', permission.state);
   ```

2. **Check Site Settings**
   - Chrome: chrome://settings/content/siteDetails?site=[YOUR_URL]
   - Look for "Background sync" permission

**Solutions:**

- **Reset Permissions:**
  - Click lock icon in address bar
  - Reset permissions
  - Reload app

- **Re-install PWA:**
  - Uninstall app from home screen
  - Clear site data
  - Re-install and grant permissions

- **Check Browser Flags:**
  - chrome://flags
  - Search for "Periodic Background Sync"
  - Ensure enabled

#### Issue 4: Service Worker Not Updating

**Symptoms:**
- Changes to service worker not taking effect
- Old version still running
- Sync logic not executing

**Diagnostic Steps:**

1. **Check Service Worker Version**
   ```javascript
   // In sw.ts
   const VERSION = 'v1.2.3';
   console.log('SW Version:', VERSION);
   ```

2. **Check Registration Status**
   - DevTools → Application → Service Workers
   - Check for "waiting to activate"

**Solutions:**

- **Force Update:**
  ```javascript
  const registration = await navigator.serviceWorker.ready;
  await registration.update();
  ```

- **Skip Waiting:**
  ```javascript
  // In sw.ts
  self.addEventListener('install', () => {
    self.skipWaiting();
  });
  ```

- **Unregister and Re-register:**
  ```javascript
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    await reg.unregister();
  }
  // Reload page to re-register
  ```

#### Issue 5: Sync Causes Performance Issues

**Symptoms:**
- App freezes during sync
- High CPU/memory usage
- Battery drain
- Network congestion

**Diagnostic Steps:**

1. **Monitor Sync Duration**
   ```javascript
   const start = performance.now();
   await performPeriodicSync();
   const duration = performance.now() - start;
   console.log('Sync duration:', duration, 'ms');
   ```

2. **Check Network Activity**
   - DevTools → Network tab
   - Monitor requests during sync

**Solutions:**

- **Optimize Sync Logic:**
  ```javascript
  // Batch requests
  const data = await Promise.all([
    fetch('/api/items'),
    fetch('/api/categories'),
    fetch('/api/lists')
  ]);
  ```

- **Implement Pagination:**
  ```javascript
  async function syncInBatches(pageSize = 50) {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `/api/items?page=${page}&limit=${pageSize}`
      );
      const data = await response.json();

      await processPage(data);

      hasMore = data.hasMore;
      page++;
    }
  }
  ```

- **Use Incremental Sync:**
  ```javascript
  const lastSync = await getLastSyncTime();
  const response = await fetch(
    `/api/items?since=${lastSync}`
  );
  // Only fetch changes since last sync
  ```

- **Add Sync Timeout:**
  ```javascript
  const SYNC_TIMEOUT = 30000; // 30 seconds

  await Promise.race([
    performPeriodicSync(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sync timeout')), SYNC_TIMEOUT)
    )
  ]);
  ```

### Debug Tools and Techniques

#### Chrome DevTools

**Application Panel:**
1. Open DevTools (F12)
2. Navigate to **Application** tab
3. Select **Service Workers**
4. Options:
   - Update: Force service worker update
   - Unregister: Remove service worker
   - Start/Stop: Control service worker

**Background Services:**
1. Navigate to **Application** → **Background Services**
2. Select **Periodic Background Sync**
3. Click **"Start recording"**
4. Trigger sync events
5. View sync history with:
   - Timestamp
   - Event type
   - Tag
   - Result

**Console Logging:**
```javascript
// Enable verbose service worker logging
localStorage.setItem('debug_periodic_sync', 'true');

// In sw.ts
const DEBUG = localStorage.getItem('debug_periodic_sync') === 'true';
if (DEBUG) {
  console.log('[PeriodicSync] Debug logging enabled');
}
```

#### Chrome Internals

**chrome://serviceworker-internals**
- View all registered service workers
- Inspect service worker details
- Start/stop/unregister workers
- View console logs

**chrome://inspect/#service-workers**
- Inspect running service workers
- Access DevTools for service worker context
- View console, network, sources

**chrome://site-engagement**
- View site engagement scores
- Higher scores = more reliable periodic syncs

#### Performance Monitoring

```typescript
// Add to sw.ts
const syncMetrics = {
  startTime: 0,
  endTime: 0,
  duration: 0,
  itemsSynced: 0,
  errors: 0,
};

self.addEventListener('periodicsync', async (event) => {
  if (event.tag === 'grocery-sync') {
    syncMetrics.startTime = performance.now();

    event.waitUntil(
      performPeriodicSync()
        .then(() => {
          syncMetrics.endTime = performance.now();
          syncMetrics.duration = syncMetrics.endTime - syncMetrics.startTime;

          console.log('[PeriodicSync] Metrics:', syncMetrics);

          // Send metrics to analytics
          sendAnalytics('periodic_sync', syncMetrics);
        })
        .catch((error) => {
          syncMetrics.errors++;
          console.error('[PeriodicSync] Error:', error);
        })
    );
  }
});
```

### Error Codes and Messages

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `NotSupportedError` | Periodic sync not supported | Browser doesn't support API | Use fallback strategy |
| `NotAllowedError` | Permission denied | User denied permission | Request permission again |
| `InvalidStateError` | Service worker not active | SW not installed/activated | Register service worker |
| `NetworkError` | Network request failed | No internet connection | Retry when online |
| `TimeoutError` | Sync operation timed out | Sync took too long | Optimize sync logic |
| `QuotaExceededError` | Storage quota exceeded | Too much cached data | Clear old cache data |

---

## FAQ

### General Questions

#### Q: What is the difference between Background Sync and Periodic Background Sync?

**A:**
- **Background Sync:** One-time sync triggered when connection is restored after being offline
- **Periodic Background Sync:** Recurring sync that happens automatically at regular intervals (every 12+ hours)

Background Sync is for handling offline actions (like submitting a form while offline). Periodic Background Sync is for keeping data fresh (like syncing grocery list updates from collaborators).

#### Q: Why can't I sync more frequently than every 12 hours?

**A:**
The 12-hour minimum is enforced by the browser to:
- Preserve battery life
- Prevent abuse by developers
- Respect user's device resources
- Comply with OS-level background task restrictions

Browsers may sync even less frequently (24-48 hours) based on:
- User engagement with the app
- Battery level
- Network connectivity
- Other background tasks

#### Q: Does Periodic Background Sync work when the app is closed?

**A:**
Yes! That's the main benefit. Periodic sync works even when:
- App is closed
- Browser is closed (on mobile)
- Device is locked
- User hasn't opened app recently

However, the browser still controls when syncs occur based on device conditions.

#### Q: Will this drain my battery?

**A:**
No, if implemented correctly. Periodic sync is designed to be battery-efficient:
- Browser schedules syncs intelligently
- Won't sync on low battery (< 20%)
- Waits for good network conditions
- Uses OS-level scheduling (efficient)
- Syncs only when device is idle

Compare this to polling (checking for updates every minute), which would drain battery significantly.

#### Q: What happens if sync fails?

**A:**
If a periodic sync fails:
1. Browser may retry automatically
2. Next scheduled sync will attempt again
3. App can still sync manually when opened
4. Offline queue preserves pending changes
5. Error is logged for debugging

#### Q: Can users disable Periodic Background Sync?

**A:**
Yes, users can disable it:
- In app settings (recommended UX)
- In browser site settings
- By uninstalling the PWA
- By revoking background sync permission

Always provide a setting in your app for users to control this.

### Technical Questions

#### Q: How do I test Periodic Background Sync locally?

**A:**
Testing options:

1. **Chrome DevTools:**
   - Application → Service Workers
   - Click "periodicSync" button
   - Manually trigger sync events

2. **Chrome Command Line:**
   ```bash
   chrome --enable-features=PeriodicBackgroundSync
   ```

3. **Wait for Real Sync:**
   - Install PWA
   - Wait 12+ hours
   - Check sync occurred

4. **Simulate with Regular Sync:**
   ```javascript
   // Use regular background sync for testing
   await registration.sync.register('test-sync');
   ```

#### Q: How do I know when a periodic sync occurs?

**A:**
Multiple ways to track syncs:

1. **Service Worker Messages:**
   ```javascript
   navigator.serviceWorker.addEventListener('message', (event) => {
     if (event.data.type === 'PERIODIC_SYNC_COMPLETE') {
       console.log('Sync completed at:', event.data.timestamp);
     }
   });
   ```

2. **Local Storage:**
   ```javascript
   // In sw.ts after sync
   await storeLastSyncTime(Date.now());

   // In app
   const lastSync = getLastSyncTime();
   ```

3. **Chrome DevTools:**
   - Application → Background Services → Periodic Background Sync
   - View sync history

#### Q: Can I have multiple periodic syncs?

**A:**
Yes, you can register multiple periodic syncs with different tags:

```javascript
await registration.periodicSync.register('grocery-sync');
await registration.periodicSync.register('price-sync');
await registration.periodicSync.register('category-sync');
```

However:
- Each sync must respect 12-hour minimum
- Browser schedules all syncs
- May batch syncs together for efficiency
- More syncs = more complexity

Generally, use a single sync tag and handle all syncing logic in one place.

#### Q: What data should I sync periodically?

**A:**
Sync data that:
- Changes frequently
- Is important for user experience
- Is needed when app opens
- Can be fetched quickly
- Doesn't require user interaction

For Grocery List App:
- ✅ New items added by collaborators
- ✅ Updated item states (checked/unchecked)
- ✅ Deleted items
- ✅ Shared list updates
- ✅ Price changes
- ❌ User profile (rarely changes)
- ❌ App settings (user-specific)
- ❌ Large images (too much data)

#### Q: How do I handle conflicts during periodic sync?

**A:**
Conflict resolution strategies:

1. **Last-Write-Wins:**
   ```javascript
   if (remoteItem.updated_at > localItem.updated_at) {
     // Use remote version
     await updateLocal(remoteItem);
   }
   ```

2. **Server Authority:**
   ```javascript
   // Always prefer server version
   await updateLocal(remoteItem);
   ```

3. **User Resolution:**
   ```javascript
   // Queue conflict for user to resolve
   await addConflict({
     local: localItem,
     remote: remoteItem,
     resolutionRequired: true,
   });
   ```

4. **Merge:**
   ```javascript
   // Merge non-conflicting fields
   const merged = {
     ...localItem,
     ...remoteItem,
     merged_at: Date.now(),
   };
   ```

For this app, we use **Last-Write-Wins** with Zero's CRDT-based conflict resolution.

#### Q: How much data should I sync at once?

**A:**
Guidelines:

- **Ideal:** < 1 MB per sync
- **Maximum:** < 5 MB per sync
- **Time:** Complete within 30 seconds

Strategies for large datasets:

1. **Pagination:**
   ```javascript
   for (let page = 0; page < totalPages; page++) {
     await syncPage(page, pageSize: 100);
   }
   ```

2. **Incremental Sync:**
   ```javascript
   const since = lastSyncTime;
   const changes = await fetchChangesSince(since);
   ```

3. **Priority-Based:**
   ```javascript
   await syncHighPriority(); // Critical data first
   await syncMediumPriority(); // If time allows
   await syncLowPriority(); // If time allows
   ```

### Platform-Specific Questions

#### Q: Does this work on iOS?

**A:**
No, iOS Safari does not support Periodic Background Sync. Use fallback strategies:

1. **Regular Background Sync:** Not supported on iOS either
2. **Visibility Events:** Sync when user returns to app
3. **Focus Events:** Sync when app gains focus
4. **Manual Sync:** Provide refresh button

```typescript
// Fallback for iOS
if (!isPeriodicSyncSupported()) {
  // Sync when app becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncData();
    }
  });
}
```

#### Q: Does this work on Firefox?

**A:**
No, Firefox does not support Periodic Background Sync. However, Firefox does support regular Background Sync, so you can:

1. Use Background Sync for offline queue
2. Sync when app opens (visibility events)
3. Provide manual sync option

#### Q: What about Samsung Internet?

**A:**
Yes! Samsung Internet 13.0+ (based on Chromium) supports Periodic Background Sync with same behavior as Chrome Android.

---

## Security and Privacy

### Privacy Considerations

#### User Control

Users must have control over periodic syncing:

1. **Explicit Consent:** Ask before enabling
2. **Easy Disable:** Provide clear toggle in settings
3. **Transparent:** Explain what data is synced
4. **Respect Choices:** Honor user preferences

#### Data Minimization

Only sync necessary data:

```typescript
// Good: Only sync changed items
const changes = await fetchChangesSince(lastSyncTime);

// Bad: Sync entire database every time
const allData = await fetchAllData();
```

#### Secure Transmission

Always use HTTPS:

```typescript
// Service worker only works on HTTPS
if (location.protocol !== 'https:') {
  console.error('Periodic sync requires HTTPS');
}
```

### Security Best Practices

#### Authentication

Ensure sync requests are authenticated:

```typescript
async function performPeriodicSync(): Promise<void> {
  // Get auth token
  const token = await getAuthToken();

  if (!token) {
    console.error('[PeriodicSync] No auth token');
    return;
  }

  // Sync with authentication
  const response = await fetch('/api/sync', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}
```

#### Token Refresh

Handle expired tokens:

```typescript
async function performPeriodicSync(): Promise<void> {
  try {
    await syncWithAuth();
  } catch (error) {
    if (error.status === 401) {
      // Token expired - refresh
      await refreshAuthToken();
      await syncWithAuth();
    }
  }
}
```

#### Rate Limiting

Prevent abuse:

```typescript
// Server-side rate limiting
app.use('/api/sync', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: 'Too many sync requests',
}));
```

#### Data Validation

Validate synced data:

```typescript
async function processSyncedData(data: any): Promise<void> {
  // Validate data structure
  const schema = {
    items: Array,
    timestamp: Number,
    userId: String,
  };

  if (!validateSchema(data, schema)) {
    throw new Error('Invalid sync data');
  }

  // Sanitize data
  const sanitized = sanitizeData(data);

  // Update local storage
  await updateLocalData(sanitized);
}
```

### Compliance

#### GDPR Considerations

1. **Right to Access:** Users can view sync history
2. **Right to Erasure:** Users can delete sync data
3. **Right to Portability:** Export sync data
4. **Consent:** Explicit opt-in for periodic sync

#### Data Retention

Configure data retention:

```typescript
const SYNC_HISTORY_RETENTION = 30; // days

async function cleanupOldSyncData(): Promise<void> {
  const cutoff = Date.now() - (SYNC_HISTORY_RETENTION * 24 * 60 * 60 * 1000);

  // Delete old sync history
  await deleteSyncHistoryBefore(cutoff);

  // Delete old cached data
  await deleteCachedDataBefore(cutoff);
}
```

---

## Performance Considerations

### Optimization Strategies

#### Efficient Syncing

1. **Incremental Sync:**
   ```typescript
   // Only fetch changes since last sync
   const lastSync = await getLastSyncTime();
   const changes = await fetch(`/api/sync?since=${lastSync}`);
   ```

2. **Compression:**
   ```typescript
   const response = await fetch('/api/sync', {
     headers: {
       'Accept-Encoding': 'gzip, deflate, br',
     },
   });
   ```

3. **Parallel Requests:**
   ```typescript
   const [items, categories, lists] = await Promise.all([
     fetch('/api/items'),
     fetch('/api/categories'),
     fetch('/api/lists'),
   ]);
   ```

4. **Request Batching:**
   ```typescript
   // Batch multiple resources in one request
   const response = await fetch('/api/batch-sync', {
     method: 'POST',
     body: JSON.stringify({
       resources: ['items', 'categories', 'lists'],
       since: lastSyncTime,
     }),
   });
   ```

#### Cache Management

1. **Cache Only Essential Data:**
   ```typescript
   // Don't cache everything
   const essentialData = filterEssentialData(syncedData);
   await cacheData(essentialData);
   ```

2. **Set Expiration:**
   ```typescript
   await cache.put(request, response, {
     expirationTime: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
   });
   ```

3. **Implement LRU:**
   ```typescript
   // Least Recently Used cache eviction
   if (cacheSize > MAX_CACHE_SIZE) {
     await evictLRUEntries();
   }
   ```

### Monitoring and Metrics

#### Key Metrics

Track these metrics:

1. **Sync Success Rate:**
   ```typescript
   const successRate = (successfulSyncs / totalSyncs) * 100;
   ```

2. **Average Sync Duration:**
   ```typescript
   const avgDuration = totalDuration / totalSyncs;
   ```

3. **Data Synced Per Session:**
   ```typescript
   const avgDataSize = totalBytesTransferred / totalSyncs;
   ```

4. **Error Rate:**
   ```typescript
   const errorRate = (failedSyncs / totalSyncs) * 100;
   ```

#### Performance Budgets

Set performance budgets:

```typescript
const PERFORMANCE_BUDGETS = {
  maxSyncDuration: 30000, // 30 seconds
  maxDataSize: 5 * 1024 * 1024, // 5 MB
  maxMemoryUsage: 50 * 1024 * 1024, // 50 MB
  maxErrors: 5, // per 100 syncs
};

// Check against budget
if (syncDuration > PERFORMANCE_BUDGETS.maxSyncDuration) {
  console.warn('[PeriodicSync] Sync exceeded duration budget');
}
```

#### Analytics Integration

```typescript
async function performPeriodicSync(): Promise<void> {
  const startTime = performance.now();

  try {
    await syncData();

    const duration = performance.now() - startTime;

    // Send to analytics
    gtag('event', 'periodic_sync', {
      event_category: 'sync',
      event_label: 'success',
      value: duration,
    });
  } catch (error) {
    // Track error
    gtag('event', 'periodic_sync_error', {
      event_category: 'sync',
      event_label: error.message,
    });
  }
}
```

---

## Best Practices

### Do's

1. **Do use feature detection**
   ```typescript
   if ('periodicSync' in ServiceWorkerRegistration.prototype) {
     // Use periodic sync
   } else {
     // Use fallback
   }
   ```

2. **Do provide user controls**
   - Allow users to enable/disable
   - Show sync status
   - Provide manual sync option

3. **Do handle errors gracefully**
   ```typescript
   try {
     await performPeriodicSync();
   } catch (error) {
     console.error('Sync failed:', error);
     // Don't throw - let browser retry
   }
   ```

4. **Do optimize for battery**
   - Keep syncs short (< 30s)
   - Sync only essential data
   - Batch requests

5. **Do implement fallbacks**
   - Regular background sync
   - Visibility events
   - Manual sync

### Don'ts

1. **Don't rely solely on periodic sync**
   - Not supported on all browsers
   - Browser may skip syncs
   - Use as enhancement, not requirement

2. **Don't sync large amounts of data**
   - Keep under 5 MB per sync
   - Use pagination for large datasets
   - Implement incremental sync

3. **Don't ignore user preferences**
   - Respect disable setting
   - Honor battery saver mode
   - Follow network preferences

4. **Don't sync sensitive data without encryption**
   - Always use HTTPS
   - Encrypt sensitive data
   - Validate on server

5. **Don't make sync block app startup**
   - Sync in background
   - Don't wait for sync to complete
   - Show cached data immediately

### Recommended Patterns

#### Progressive Enhancement

```typescript
// Start with basic sync
function basicSync() {
  window.addEventListener('online', () => {
    syncData();
  });
}

// Enhance with background sync if available
if ('sync' in ServiceWorkerRegistration.prototype) {
  registration.sync.register('sync-data');
}

// Further enhance with periodic sync if available
if ('periodicSync' in ServiceWorkerRegistration.prototype) {
  registration.periodicSync.register('periodic-sync');
}
```

#### Graceful Degradation

```typescript
async function ensureDataFresh() {
  if (await hasPeriodicSync()) {
    // Data kept fresh automatically
    return;
  }

  if (await hasBackgroundSync()) {
    // Sync when online
    await registration.sync.register('sync-data');
    return;
  }

  // Fallback: Manual sync
  await syncData();
}
```

---

## Related Documentation

### Internal Documentation

- [PERIODIC_SYNC_ARCHITECTURE.md](./PERIODIC_SYNC_ARCHITECTURE.md) - Technical architecture details
- [PERIODIC_SYNC_BROWSER_SUPPORT.md](./PERIODIC_SYNC_BROWSER_SUPPORT.md) - Browser compatibility matrix
- [PERIODIC_SYNC_TESTING.md](./PERIODIC_SYNC_TESTING.md) - Testing procedures
- [PWA_RESEARCH.md](./PWA_RESEARCH.md) - PWA implementation research
- [SERVICE_WORKER_UPDATE_SYSTEM.md](./SERVICE_WORKER_UPDATE_SYSTEM.md) - Service worker update system

### External Resources

#### Specifications

- [Periodic Background Sync Spec](https://wicg.github.io/periodic-background-sync/)
- [Background Sync Spec](https://wicg.github.io/background-sync/)
- [Service Workers Spec](https://w3c.github.io/ServiceWorker/)

#### Guides

- [web.dev: Periodic Background Sync](https://web.dev/periodic-background-sync/)
- [MDN: Background Sync](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Chrome Developers: Background Sync](https://developers.google.com/web/updates/2015/12/background-sync)

#### Tools

- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Workbox](https://developers.google.com/web/tools/workbox)

#### Community

- [PWA Slack](https://aka.ms/pwa-slack)
- [Stack Overflow: periodic-background-sync](https://stackoverflow.com/questions/tagged/periodic-background-sync)
- [Web Platform Incubator CG](https://github.com/WICG/periodic-background-sync)

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Maintainer:** Development Team
**Status:** Complete

For questions or issues, please refer to the troubleshooting section or create an issue in the project repository.
