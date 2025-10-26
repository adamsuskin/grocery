# Periodic Background Sync Architecture

**Project:** Grocery List App
**Document Type:** Technical Architecture
**Version:** 1.0
**Last Updated:** October 2025
**Audience:** Developers, Architects

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Component Interaction Flow](#component-interaction-flow)
4. [Service Worker Integration](#service-worker-integration)
5. [Zero Sync Integration](#zero-sync-integration)
6. [Fallback Strategies](#fallback-strategies)
7. [Technical Implementation Details](#technical-implementation-details)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [State Management](#state-management)
10. [Concurrency and Race Conditions](#concurrency-and-race-conditions)
11. [Performance Architecture](#performance-architecture)
12. [Security Architecture](#security-architecture)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Browser Environment                            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Main Thread (React App)                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │ │
│  │  │    React     │  │     Zero     │  │    Sync      │            │ │
│  │  │   Components │◄─┤    Client    │◄─┤   Context    │            │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │ │
│  │         │                  │                  │                     │ │
│  │         └──────────────────┴──────────────────┘                     │ │
│  │                            │                                        │ │
│  │                    ┌───────▼────────┐                              │ │
│  │                    │  IndexedDB     │                              │ │
│  │                    │  (Zero Cache)  │                              │ │
│  │                    └────────────────┘                              │ │
│  └────────────────────────────┬─────────────────────────────────────┘ │
│                                │                                        │
│                                │ postMessage / BroadcastChannel         │
│                                │                                        │
│  ┌────────────────────────────▼─────────────────────────────────────┐ │
│  │                   Service Worker Thread                          │ │
│  │  ┌──────────────────────────────────────────────────────────┐   │ │
│  │  │          Periodic Sync Event Handler                      │   │ │
│  │  │  - Listens for 'periodicsync' events                      │   │ │
│  │  │  - Coordinates sync operations                            │   │ │
│  │  │  - Manages sync lifecycle                                 │   │ │
│  │  └──────────────────────────────────────────────────────────┘   │ │
│  │  ┌──────────────────────────────────────────────────────────┐   │ │
│  │  │          Cache Management Layer                           │   │ │
│  │  │  - Workbox routing & strategies                           │   │ │
│  │  │  - Cache versioning                                       │   │ │
│  │  │  - Expiration policies                                    │   │ │
│  │  └──────────────────────────────────────────────────────────┘   │ │
│  │  ┌──────────────────────────────────────────────────────────┐   │ │
│  │  │          Background Sync Queue                            │   │ │
│  │  │  - Workbox BackgroundSyncPlugin                           │   │ │
│  │  │  - Offline mutations queue                                │   │ │
│  │  │  - Retry logic                                            │   │ │
│  │  └──────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────┬─────────────────────────────────────┘ │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                          Server Infrastructure                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │    Zero      │  │     REST     │  │  PostgreSQL  │                 │
│  │    Server    │  │     API      │  │   Database   │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Progressive Enhancement:**
   - Core functionality works without periodic sync
   - Enhanced experience when available
   - Graceful degradation on unsupported browsers

2. **Separation of Concerns:**
   - Service Worker: Handles background sync events
   - React App: Manages UI and user interaction
   - Zero Client: Handles real-time sync logic
   - SyncContext: Coordinates sync state

3. **Event-Driven Architecture:**
   - Components communicate via events
   - Loose coupling between layers
   - Observable state changes

4. **Resilience:**
   - Multiple fallback mechanisms
   - Error recovery
   - Retry logic
   - Graceful failures

### Key Architectural Decisions

#### Decision 1: Service Worker as Sync Coordinator

**Rationale:**
- Service workers can run in background
- Independent of main thread
- Can wake up for sync events
- Browser-managed lifecycle

**Alternatives Considered:**
- Web Workers: Cannot access Cache API
- Main Thread: Cannot run in background

**Trade-offs:**
- Pro: Reliable background execution
- Con: Limited debugging capabilities
- Pro: Browser-scheduled for efficiency
- Con: Cannot guarantee exact timing

#### Decision 2: Zero for State Management

**Rationale:**
- CRDT-based conflict resolution
- Real-time sync capabilities
- IndexedDB persistence
- Offline-first design

**Alternatives Considered:**
- Redux + Manual Sync: More complex
- Apollo Client: Requires GraphQL
- Custom Solution: Reinventing the wheel

**Trade-offs:**
- Pro: Built-in conflict resolution
- Pro: Real-time updates
- Con: Learning curve
- Con: Alpha software (potential bugs)

#### Decision 3: Workbox for Caching

**Rationale:**
- Production-ready library
- Multiple caching strategies
- Background sync support
- Well-documented

**Alternatives Considered:**
- Custom Cache API: More work
- Other SW libraries: Less mature

**Trade-offs:**
- Pro: Battle-tested
- Pro: Active maintenance
- Con: Added bundle size
- Con: Learning curve

---

## System Components

### 1. Periodic Sync Manager

**Location:** `src/utils/periodicSync.ts`

**Responsibilities:**
- Register/unregister periodic sync
- Check browser support
- Query permission status
- Manage sync tags

**Key Functions:**

```typescript
interface PeriodicSyncManager {
  // Registration
  register(tag: string, options?: PeriodicSyncOptions): Promise<boolean>;
  unregister(tag: string): Promise<boolean>;

  // Query
  getTags(): Promise<string[]>;
  isRegistered(tag: string): Promise<boolean>;

  // Support detection
  isSupported(): boolean;
  getPermission(): Promise<PermissionState>;
}
```

**State:**
```typescript
interface PeriodicSyncState {
  supported: boolean;
  registered: boolean;
  tags: string[];
  permission: PermissionState;
  lastSync: number | null;
}
```

### 2. Service Worker Sync Handler

**Location:** `src/sw.ts`

**Responsibilities:**
- Listen for `periodicsync` events
- Coordinate sync operations
- Manage sync lifecycle
- Notify clients of sync events

**Event Handlers:**

```typescript
interface ServiceWorkerSyncHandlers {
  // Main event handler
  onPeriodicSync(event: PeriodicSyncEvent): Promise<void>;

  // Sync operations
  performSync(): Promise<void>;
  syncZeroData(): Promise<void>;
  processOfflineQueue(): Promise<void>;

  // Communication
  notifyClients(type: string, data?: any): Promise<void>;

  // Helpers
  getLastSyncTime(): Promise<number>;
  setLastSyncTime(time: number): Promise<void>;
}
```

### 3. Sync Context Provider

**Location:** `src/contexts/SyncContext.tsx`

**Responsibilities:**
- Manage sync state in React
- Provide sync controls to components
- Listen for sync events from SW
- Coordinate with Zero Client

**API:**

```typescript
interface SyncContextValue {
  // State
  connectionState: ConnectionState;
  syncState: SyncState;
  periodicSyncEnabled: boolean;
  lastPeriodicSync: number | null;

  // Actions
  enablePeriodicSync(): Promise<boolean>;
  disablePeriodicSync(): Promise<boolean>;
  triggerManualSync(): Promise<void>;

  // Query
  isPeriodicSyncSupported: boolean;
  getSyncHistory(): SyncEvent[];
}
```

### 4. Zero Client Integration

**Location:** Embedded in React components via `useZero` hook

**Responsibilities:**
- Manage IndexedDB cache
- Handle real-time sync
- Resolve conflicts (CRDT)
- Provide reactive data

**Integration Points:**

```typescript
interface ZeroIntegration {
  // Data access
  query: <T>(query: Query<T>) => T[];

  // Mutations
  mutate: {
    create(data: any): Promise<void>;
    update(data: any): Promise<void>;
    delete(id: string): Promise<void>;
  };

  // Sync status
  isOnline: boolean;
  isSyncing: boolean;

  // Events
  onSyncComplete(callback: () => void): void;
}
```

### 5. Offline Queue Manager

**Location:** `src/utils/offlineQueue.ts`

**Responsibilities:**
- Queue mutations when offline
- Retry failed mutations
- Track queue status
- Integrate with Background Sync

**API:**

```typescript
interface OfflineQueueManager {
  // Queue operations
  enqueue(mutation: Mutation): Promise<void>;
  dequeue(): Promise<Mutation | null>;
  clear(): Promise<void>;

  // Processing
  processQueue(): Promise<void>;
  retryFailed(): Promise<void>;

  // Status
  getStatus(): QueueStatus;
  getPendingCount(): number;
  getFailedCount(): number;
}
```

### 6. Cache Manager

**Location:** `src/sw.ts` (Workbox integration)

**Responsibilities:**
- Manage cache storage
- Implement caching strategies
- Handle cache expiration
- Version cache names

**Strategies:**

```typescript
interface CacheStrategies {
  // Static assets
  cacheFirst(request: Request): Promise<Response>;

  // API calls
  networkFirst(request: Request): Promise<Response>;

  // Real-time data
  staleWhileRevalidate(request: Request): Promise<Response>;

  // Mutations
  networkOnly(request: Request): Promise<Response>;
}
```

---

## Component Interaction Flow

### Flow 1: Periodic Sync Registration

```
User Action (Enable Sync)
        │
        ▼
┌────────────────────┐
│  React Component   │
│  (Settings Page)   │
└────────┬───────────┘
         │ onClick
         ▼
┌────────────────────┐
│   SyncContext      │
│ enablePeriodicSync()│
└────────┬───────────┘
         │ calls
         ▼
┌────────────────────┐
│  periodicSync.ts   │
│ registerPeriodicSync()│
└────────┬───────────┘
         │ calls
         ▼
┌────────────────────┐
│ Navigator API      │
│ registration.      │
│ periodicSync.      │
│ register()         │
└────────┬───────────┘
         │ browser schedules
         ▼
┌────────────────────┐
│  Browser Scheduler │
│  (12+ hours later) │
└────────┬───────────┘
         │ fires event
         ▼
┌────────────────────┐
│  Service Worker    │
│  'periodicsync'    │
│  event handler     │
└────────────────────┘
```

### Flow 2: Periodic Sync Execution

```
Browser Scheduler
        │
        ▼
┌───────────────────────────────────────────┐
│ Service Worker 'periodicsync' Event       │
└───────────────┬───────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ performSync() │
        └───────┬───────┘
                │
    ┌───────────┴──────────────┬────────────────────┐
    │                          │                     │
    ▼                          ▼                     ▼
┌─────────────┐      ┌──────────────────┐  ┌─────────────────┐
│ notifyClients│      │  syncZeroData()  │  │ processOffline  │
│ (START)      │      │                  │  │ Queue()         │
└─────────────┘      └────────┬─────────┘  └────────┬────────┘
                              │                      │
                              ▼                      ▼
                     ┌─────────────────┐   ┌──────────────────┐
                     │ Fetch from      │   │ Retry queued     │
                     │ Zero Server     │   │ mutations        │
                     └────────┬────────┘   └────────┬─────────┘
                              │                      │
                              ▼                      ▼
                     ┌─────────────────┐   ┌──────────────────┐
                     │ Update          │   │ Remove from      │
                     │ IndexedDB       │   │ queue on success │
                     └────────┬────────┘   └────────┬─────────┘
                              │                      │
                              └──────────┬───────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │ notifyClients    │
                              │ (COMPLETE)       │
                              └──────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │ React Components │
                              │ update UI        │
                              └──────────────────┘
```

### Flow 3: Data Synchronization

```
Service Worker Sync
        │
        ▼
┌─────────────────────┐
│ syncZeroData()      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ GET /api/zero/sync  │
│ { lastSync: T }     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Zero Server         │
│ - Query changes     │
│ - Apply CRDT merge  │
│ - Return delta      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Response:           │
│ {                   │
│   items: [...],     │
│   operations: [...],│
│   timestamp: T2     │
│ }                   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Service Worker      │
│ - Parse response    │
│ - Validate data     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Update IndexedDB    │
│ (Zero Cache)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Notify Clients      │
│ via postMessage     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ React App           │
│ - Zero detects      │
│   IndexedDB change  │
│ - Re-renders        │
│   components        │
└─────────────────────┘
```

### Flow 4: Offline Queue Processing

```
Service Worker Sync
        │
        ▼
┌──────────────────────┐
│ processOfflineQueue()│
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Get queued mutations │
│ from Workbox Queue   │
└────────┬─────────────┘
         │
         ▼
    ┌────────┐
    │ Empty? │──Yes──┐
    └───┬────┘       │
        │ No         │
        ▼            │
┌──────────────────────┐│
│ For each mutation:   ││
│ - Replay request     ││
│ - Check response     ││
└────────┬─────────────┘│
         │              │
    ┌────▼──────┐       │
    │ Success?  │       │
    └─┬────┬────┘       │
      │    │            │
     Yes   No           │
      │    │            │
      │    ▼            │
      │ ┌────────────┐ │
      │ │ Keep in    │ │
      │ │ queue for  │ │
      │ │ retry      │ │
      │ └────────────┘ │
      │                │
      ▼                │
┌──────────────────┐   │
│ Remove from queue│   │
└────────┬─────────┘   │
         │             │
         └─────────────┘
         │
         ▼
┌──────────────────┐
│ Update stats     │
│ Notify clients   │
└──────────────────┘
```

### Flow 5: Client-Service Worker Communication

```
React Component
        │
        ▼
┌─────────────────────┐
│ Trigger Action      │
│ (e.g., add item)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Zero Client         │
│ .mutate.create()    │
└──────────┬──────────┘
           │
      ┌────▼─────┐
      │ Online?  │
      └─┬────┬───┘
       Yes   No
        │    │
        │    ▼
        │ ┌────────────────┐
        │ │ Queue in       │
        │ │ OfflineQueue   │
        │ └────────┬───────┘
        │          │
        │          ▼
        │ ┌────────────────┐
        │ │ SW Background  │
        │ │ Sync Queue     │
        │ └────────────────┘
        │
        ▼
┌─────────────────────┐
│ POST /api/mutate    │
└──────────┬──────────┘
           │
      ┌────▼─────┐
      │ Success? │
      └─┬────┬───┘
       Yes   No
        │    │
        │    ▼
        │ ┌────────────────┐
        │ │ Queue for retry│
        │ │ in SW          │
        │ └────────────────┘
        │
        ▼
┌─────────────────────┐
│ Update IndexedDB    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Zero reactive       │
│ update triggers     │
│ component re-render │
└─────────────────────┘
```

---

## Service Worker Integration

### Service Worker Lifecycle

```
┌──────────────┐
│   Install    │
│              │
│ - Download   │
│ - Parse      │
│ - Execute    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Waiting    │◄──────┐
│              │       │
│ - skipWaiting│   Update
│   (optional) │   available
└──────┬───────┘       │
       │               │
       ▼               │
┌──────────────┐       │
│   Activate   │       │
│              │       │
│ - Claim      │       │
│ - Clean cache│       │
└──────┬───────┘       │
       │               │
       ▼               │
┌──────────────┐       │
│    Idle      │       │
│              │       │
└──────┬───────┘       │
       │               │
       ├───────────────┘
       │
       ▼
┌──────────────┐
│   Events     │
│              │
│ - fetch      │
│ - periodicsync│
│ - sync       │
│ - push       │
│ - message    │
└──────────────┘
```

### Periodic Sync Event Handling

**Event Registration:**

```typescript
// In main thread
async function setupPeriodicSync() {
  // Wait for service worker to be ready
  const registration = await navigator.serviceWorker.ready;

  // Check support
  if (!('periodicSync' in registration)) {
    console.warn('Periodic sync not supported');
    return;
  }

  // Register periodic sync
  await registration.periodicSync.register('grocery-sync', {
    minInterval: 12 * 60 * 60 * 1000, // 12 hours
  });

  console.log('Periodic sync registered');
}
```

**Event Handler:**

```typescript
// In service worker (sw.ts)
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  console.log('[SW] Periodic sync event:', event.tag);

  if (event.tag === 'grocery-sync') {
    // Extend event lifetime until sync completes
    event.waitUntil(
      performPeriodicSync()
        .then(() => {
          console.log('[SW] Periodic sync completed');
        })
        .catch((error) => {
          console.error('[SW] Periodic sync failed:', error);
          // Don't rethrow - let browser retry later
        })
    );
  }
});

async function performPeriodicSync(): Promise<void> {
  const startTime = performance.now();

  try {
    // Step 1: Notify clients sync starting
    await notifyClients('SYNC_START', {
      timestamp: Date.now(),
    });

    // Step 2: Check prerequisites
    await checkSyncPrerequisites();

    // Step 3: Sync Zero data
    await syncZeroData();

    // Step 4: Process offline queue
    await processOfflineQueue();

    // Step 5: Update last sync time
    await setLastSyncTime(Date.now());

    // Step 6: Notify clients sync completed
    const duration = performance.now() - startTime;
    await notifyClients('SYNC_COMPLETE', {
      timestamp: Date.now(),
      duration,
    });
  } catch (error) {
    // Notify clients of error
    await notifyClients('SYNC_ERROR', {
      error: error.message,
      timestamp: Date.now(),
    });

    throw error;
  }
}
```

### Client-Service Worker Communication

**Message Types:**

```typescript
type MessageType =
  | 'SYNC_START'
  | 'SYNC_COMPLETE'
  | 'SYNC_ERROR'
  | 'SYNC_PROGRESS'
  | 'CACHE_UPDATED'
  | 'OFFLINE_QUEUE_UPDATED';

interface SyncMessage {
  type: MessageType;
  data?: any;
  timestamp: number;
}
```

**Sending from Service Worker:**

```typescript
async function notifyClients(
  type: MessageType,
  data?: any
): Promise<void> {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  const message: SyncMessage = {
    type,
    data,
    timestamp: Date.now(),
  };

  clients.forEach((client) => {
    client.postMessage(message);
  });
}
```

**Receiving in React:**

```typescript
useEffect(() => {
  if (!('serviceWorker' in navigator)) return;

  const handleMessage = (event: MessageEvent<SyncMessage>) => {
    const { type, data, timestamp } = event.data;

    switch (type) {
      case 'SYNC_START':
        setSyncState('syncing');
        break;

      case 'SYNC_COMPLETE':
        setSyncState('synced');
        setLastSyncTime(timestamp);
        break;

      case 'SYNC_ERROR':
        setSyncState('failed');
        console.error('Sync error:', data.error);
        break;
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage);
  };
}, []);
```

### Workbox Integration

**Configuration:**

```typescript
// vite.config.ts
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  injectManifest: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\/api\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});
```

**Background Sync Plugin:**

```typescript
import { BackgroundSyncPlugin } from 'workbox-background-sync';

const bgSyncPlugin = new BackgroundSyncPlugin('offline-sync-queue', {
  maxRetentionTime: 24 * 60, // 24 hours
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        console.log('Synced:', entry.request.url);
      } catch (error) {
        console.error('Sync failed:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Use with mutations
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') &&
    request.method !== 'GET',
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  })
);
```

---

## Zero Sync Integration

### Zero Architecture

```
┌─────────────────────────────────────────────┐
│              React Application               │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │         Zero Client Instance           │ │
│  │                                        │ │
│  │  ┌──────────────┐  ┌───────────────┐ │ │
│  │  │   Query API  │  │  Mutate API   │ │ │
│  │  └──────┬───────┘  └───────┬───────┘ │ │
│  │         │                   │         │ │
│  │         └─────────┬─────────┘         │ │
│  │                   │                   │ │
│  │         ┌─────────▼─────────┐         │ │
│  │         │  IndexedDB Cache  │         │ │
│  │         │  (Reactive Store) │         │ │
│  │         └─────────┬─────────┘         │ │
│  │                   │                   │ │
│  └───────────────────┼───────────────────┘ │
│                      │                      │
└──────────────────────┼──────────────────────┘
                       │
                       │ WebSocket (WSS)
                       │
┌──────────────────────▼──────────────────────┐
│              Zero Server                     │
│                                              │
│  ┌────────────────┐  ┌───────────────────┐ │
│  │  CRDT Engine   │  │  PostgreSQL DB    │ │
│  │  (Replicache)  │◄─┤  (Source of Truth)│ │
│  └────────────────┘  └───────────────────┘ │
└──────────────────────────────────────────────┘
```

### Periodic Sync with Zero

**Sync Strategy:**

```typescript
// Service worker sync handler
async function syncZeroData(): Promise<void> {
  // Get last sync time from IndexedDB
  const lastSync = await getLastSyncTime();

  // Fetch changes since last sync
  const response = await fetch('/api/zero/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`,
    },
    body: JSON.stringify({
      lastSyncVersion: lastSync,
      clientID: await getClientID(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  const data = await response.json();

  // Apply changes to IndexedDB
  await applyChangesToCache(data);

  // Update last sync time
  await setLastSyncTime(data.currentVersion);
}

async function applyChangesToCache(data: SyncResponse): Promise<void> {
  // Open Zero's IndexedDB
  const db = await openDB('zero-cache');

  // Begin transaction
  const tx = db.transaction(['items', 'operations'], 'readwrite');

  try {
    // Apply item changes
    for (const item of data.items) {
      if (item.deleted) {
        await tx.objectStore('items').delete(item.id);
      } else {
        await tx.objectStore('items').put(item);
      }
    }

    // Apply operations (CRDT)
    for (const op of data.operations) {
      await tx.objectStore('operations').put(op);
    }

    // Commit transaction
    await tx.done;
  } catch (error) {
    // Abort transaction on error
    tx.abort();
    throw error;
  }
}
```

### CRDT Conflict Resolution

**Conflict Detection:**

```typescript
interface ConflictDetection {
  // Compare versions
  hasConflict(local: Item, remote: Item): boolean;

  // Resolve using CRDT rules
  resolve(local: Item, remote: Item): Item;
}

function hasConflict(local: Item, remote: Item): boolean {
  // Check if both have been modified since last sync
  return (
    local.version !== remote.version &&
    local.lastModified > lastSyncTime &&
    remote.lastModified > lastSyncTime
  );
}

function resolve(local: Item, remote: Item): Item {
  // Use CRDT Last-Write-Wins register
  if (remote.lastModified > local.lastModified) {
    // Remote wins
    return remote;
  } else if (local.lastModified > remote.lastModified) {
    // Local wins
    return local;
  } else {
    // Same timestamp - use client ID as tiebreaker
    return remote.clientID > local.clientID ? remote : local;
  }
}
```

### Zero Reactive Updates

**Automatic Re-rendering:**

```typescript
// React component using Zero
function GroceryList() {
  // Zero query - automatically updates when IndexedDB changes
  const items = useZero((z) => z.query.grocery_items
    .where('list_id', listId)
    .orderBy('position')
  );

  // Component re-renders when items change
  return (
    <ul>
      {items.map((item) => (
        <GroceryItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
```

**IndexedDB Observer Pattern:**

```
Service Worker Sync
        │
        ▼
Update IndexedDB
        │
        ▼
IndexedDB Change Event
        │
        ▼
Zero Client Detects Change
        │
        ▼
Notify React Subscriptions
        │
        ▼
Component Re-renders
```

---

## Fallback Strategies

### Fallback Hierarchy

```
┌────────────────────────────────────────┐
│     Periodic Background Sync           │
│     (Chrome/Edge/Opera)                │
│     - Automatic, browser-scheduled     │
└────────────┬───────────────────────────┘
             │ IF NOT SUPPORTED
             ▼
┌────────────────────────────────────────┐
│     Regular Background Sync            │
│     (Chrome/Edge/Firefox/Opera)        │
│     - One-time sync when online        │
└────────────┬───────────────────────────┘
             │ IF NOT SUPPORTED
             ▼
┌────────────────────────────────────────┐
│     Visibility Events                  │
│     (All modern browsers)              │
│     - Sync when app becomes visible    │
└────────────┬───────────────────────────┘
             │ IF FAILS
             ▼
┌────────────────────────────────────────┐
│     Manual Sync                        │
│     (All browsers)                     │
│     - User-triggered refresh           │
└────────────────────────────────────────┘
```

### Implementation of Fallbacks

**Feature Detection:**

```typescript
function getSyncStrategy(): SyncStrategy {
  // Level 1: Periodic Background Sync
  if ('periodicSync' in ServiceWorkerRegistration.prototype) {
    return {
      type: 'periodic',
      setup: setupPeriodicSync,
      priority: 1,
    };
  }

  // Level 2: Regular Background Sync
  if ('sync' in ServiceWorkerRegistration.prototype) {
    return {
      type: 'background',
      setup: setupBackgroundSync,
      priority: 2,
    };
  }

  // Level 3: Visibility Events
  if ('addEventListener' in document) {
    return {
      type: 'visibility',
      setup: setupVisibilitySync,
      priority: 3,
    };
  }

  // Level 4: Manual Sync
  return {
    type: 'manual',
    setup: setupManualSync,
    priority: 4,
  };
}
```

**Visibility-Based Sync:**

```typescript
function setupVisibilitySync(): void {
  let lastSync = 0;
  const MIN_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  document.addEventListener('visibilitychange', async () => {
    // Only sync when becoming visible
    if (document.hidden) return;

    // Throttle syncs
    const now = Date.now();
    if (now - lastSync < MIN_SYNC_INTERVAL) return;

    // Only sync if online
    if (!navigator.onLine) return;

    try {
      await syncData();
      lastSync = now;
    } catch (error) {
      console.error('Visibility sync failed:', error);
    }
  });

  // Also sync on focus (for mobile)
  window.addEventListener('focus', async () => {
    const now = Date.now();
    if (now - lastSync < MIN_SYNC_INTERVAL) return;
    if (!navigator.onLine) return;

    try {
      await syncData();
      lastSync = now;
    } catch (error) {
      console.error('Focus sync failed:', error);
    }
  });
}
```

**Background Sync Fallback:**

```typescript
async function setupBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  if (!('sync' in ServiceWorkerRegistration.prototype)) return;

  // Register background sync on going online
  window.addEventListener('online', async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('grocery-sync');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  });

  // Also register when app gains focus
  window.addEventListener('focus', async () => {
    if (!navigator.onLine) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('grocery-sync');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  });
}

// In service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'grocery-sync') {
    event.waitUntil(performSync());
  }
});
```

**Manual Sync:**

```typescript
function setupManualSync(): void {
  // Provide manual sync button
  const syncButton = document.querySelector('#sync-button');

  if (syncButton) {
    syncButton.addEventListener('click', async () => {
      syncButton.disabled = true;
      syncButton.textContent = 'Syncing...';

      try {
        await syncData();
        syncButton.textContent = 'Synced!';
        setTimeout(() => {
          syncButton.textContent = 'Sync';
        }, 2000);
      } catch (error) {
        syncButton.textContent = 'Sync Failed';
        console.error('Manual sync failed:', error);
      } finally {
        syncButton.disabled = false;
      }
    });
  }
}
```

### Adaptive Fallback

**Dynamic Strategy Selection:**

```typescript
class SyncManager {
  private strategy: SyncStrategy;

  constructor() {
    this.strategy = this.detectBestStrategy();
  }

  private detectBestStrategy(): SyncStrategy {
    return getSyncStrategy();
  }

  async sync(): Promise<void> {
    console.log(`Using sync strategy: ${this.strategy.type}`);

    try {
      await this.strategy.setup();
    } catch (error) {
      console.error(`${this.strategy.type} sync failed:`, error);

      // Try fallback strategy
      await this.fallback();
    }
  }

  private async fallback(): Promise<void> {
    // Get next best strategy
    const nextStrategy = this.getNextBestStrategy();

    if (nextStrategy) {
      console.log(`Falling back to: ${nextStrategy.type}`);
      this.strategy = nextStrategy;
      await nextStrategy.setup();
    } else {
      console.error('No fallback strategy available');
    }
  }

  private getNextBestStrategy(): SyncStrategy | null {
    const strategies = getAllStrategies();
    const currentPriority = this.strategy.priority;

    // Find next strategy with higher priority number (lower quality)
    return strategies.find(s => s.priority > currentPriority) || null;
  }
}
```

---

## Technical Implementation Details

### IndexedDB Schema

**Zero Cache Structure:**

```typescript
interface IndexedDBSchema {
  // Object stores
  stores: {
    // Grocery items
    items: {
      key: string; // item ID
      value: GroceryItem;
      indexes: {
        list_id: string;
        created_at: number;
        updated_at: number;
      };
    };

    // CRDT operations log
    operations: {
      key: string; // operation ID
      value: CRDTOperation;
      indexes: {
        timestamp: number;
        client_id: string;
      };
    };

    // Sync metadata
    sync_meta: {
      key: string; // metadata key
      value: any;
    };

    // Offline queue
    offline_queue: {
      key: string; // mutation ID
      value: QueuedMutation;
      indexes: {
        status: 'pending' | 'failed';
        timestamp: number;
      };
    };
  };
}
```

**Accessing IndexedDB:**

```typescript
async function openDB(name: string, version: number = 1): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // Create object stores if needed
      if (!db.objectStoreNames.contains('items')) {
        const itemStore = db.createObjectStore('items', { keyPath: 'id' });
        itemStore.createIndex('list_id', 'list_id');
        itemStore.createIndex('created_at', 'created_at');
        itemStore.createIndex('updated_at', 'updated_at');
      }

      if (!db.objectStoreNames.contains('operations')) {
        const opStore = db.createObjectStore('operations', { keyPath: 'id' });
        opStore.createIndex('timestamp', 'timestamp');
        opStore.createIndex('client_id', 'client_id');
      }

      if (!db.objectStoreNames.contains('sync_meta')) {
        db.createObjectStore('sync_meta', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('offline_queue')) {
        const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' });
        queueStore.createIndex('status', 'status');
        queueStore.createIndex('timestamp', 'timestamp');
      }
    };
  });
}
```

### Sync Metadata Management

**Last Sync Time:**

```typescript
async function getLastSyncTime(): Promise<number> {
  const db = await openDB('zero-cache');
  const tx = db.transaction('sync_meta', 'readonly');
  const store = tx.objectStore('sync_meta');

  const result = await store.get('last_sync_time');
  return result?.value || 0;
}

async function setLastSyncTime(time: number): Promise<void> {
  const db = await openDB('zero-cache');
  const tx = db.transaction('sync_meta', 'readwrite');
  const store = tx.objectStore('sync_meta');

  await store.put({
    key: 'last_sync_time',
    value: time,
  });

  await tx.done;
}
```

**Sync Version Tracking:**

```typescript
interface SyncVersion {
  version: number;
  timestamp: number;
  clientID: string;
}

async function getCurrentSyncVersion(): Promise<SyncVersion> {
  const db = await openDB('zero-cache');
  const tx = db.transaction('sync_meta', 'readonly');
  const store = tx.objectStore('sync_meta');

  const result = await store.get('sync_version');
  return result?.value || { version: 0, timestamp: 0, clientID: '' };
}

async function updateSyncVersion(version: SyncVersion): Promise<void> {
  const db = await openDB('zero-cache');
  const tx = db.transaction('sync_meta', 'readwrite');
  const store = tx.objectStore('sync_meta');

  await store.put({
    key: 'sync_version',
    value: version,
  });

  await tx.done;
}
```

### Authentication in Service Worker

**Token Management:**

```typescript
// Store auth token in IndexedDB (accessible from SW)
async function storeAuthToken(token: string): Promise<void> {
  const db = await openDB('auth-cache');
  const tx = db.transaction('auth', 'readwrite');
  await tx.objectStore('auth').put({
    key: 'token',
    value: token,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  });
  await tx.done;
}

async function getAuthToken(): Promise<string | null> {
  const db = await openDB('auth-cache');
  const tx = db.transaction('auth', 'readonly');
  const result = await tx.objectStore('auth').get('token');

  if (!result) return null;

  // Check expiration
  if (result.expiresAt < Date.now()) {
    await deleteAuthToken();
    return null;
  }

  return result.value;
}

async function deleteAuthToken(): Promise<void> {
  const db = await openDB('auth-cache');
  const tx = db.transaction('auth', 'readwrite');
  await tx.objectStore('auth').delete('token');
  await tx.done;
}
```

**Authenticated Requests:**

```typescript
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    await deleteAuthToken();
    throw new Error('Authentication required');
  }

  return response;
}
```

### Error Handling and Retry Logic

**Exponential Backoff:**

```typescript
interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2,
  }
): Promise<T> {
  let lastError: Error;
  let delay = options.initialDelay;

  for (let i = 0; i <= options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (i === options.maxRetries) break;

      // Don't retry on 4xx errors (except 429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      // Wait before retry
      await sleep(delay);

      // Exponential backoff
      delay = Math.min(delay * options.factor, options.maxDelay);
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Circuit Breaker:**

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      // Check if timeout has elapsed
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      // Success - reset circuit
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
      }
      this.failures = 0;

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold exceeded
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

// Usage
const circuitBreaker = new CircuitBreaker(5, 60000);

async function performSyncWithCircuitBreaker(): Promise<void> {
  await circuitBreaker.execute(() => performPeriodicSync());
}
```

---

## Data Flow Diagrams

### Complete Sync Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser Scheduler                            │
│  - Monitors: Battery, Network, User Engagement                      │
│  - Decision: Should sync now?                                        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ YES: Trigger periodic sync
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Service Worker: periodicsync Event                 │
│  - Event tag: 'grocery-sync'                                         │
│  - Action: event.waitUntil(performPeriodicSync())                    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      performPeriodicSync()                           │
│  1. notifyClients('SYNC_START')                                      │
│  2. checkSyncPrerequisites()                                         │
│  3. syncZeroData()                                                   │
│  4. processOfflineQueue()                                            │
│  5. setLastSyncTime()                                                │
│  6. notifyClients('SYNC_COMPLETE')                                   │
└───────┬────────────────────────────────┬────────────────────────────┘
        │                                 │
        ▼                                 ▼
┌──────────────────┐           ┌──────────────────────┐
│  syncZeroData()  │           │ processOfflineQueue()│
└────────┬─────────┘           └──────────┬───────────┘
         │                                 │
         ▼                                 ▼
┌──────────────────┐           ┌──────────────────────┐
│ GET /api/zero/   │           │ GET queued mutations │
│ sync?since=T     │           │ from Workbox Queue   │
└────────┬─────────┘           └──────────┬───────────┘
         │                                 │
         ▼                                 ▼
┌──────────────────┐           ┌──────────────────────┐
│ Response:        │           │ For each mutation:   │
│ {                │           │ - Fetch(mutation)    │
│   items: [...],  │           │ - Check success      │
│   operations, [] │           │ - Remove if success  │
│   version: V     │           │ - Keep if fail       │
│ }                │           └──────────┬───────────┘
└────────┬─────────┘                      │
         │                                 │
         ▼                                 │
┌──────────────────┐                      │
│ Update IndexedDB │                      │
│ with new data    │                      │
└────────┬─────────┘                      │
         │                                 │
         └─────────────┬───────────────────┘
                       │
                       ▼
         ┌──────────────────────────┐
         │ notifyClients(           │
         │   'SYNC_COMPLETE',       │
         │   { timestamp, duration }│
         │ )                        │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │ React App (Main Thread)  │
         │ - Receives message       │
         │ - Updates SyncContext    │
         │ - Zero detects DB change │
         │ - Components re-render   │
         └──────────────────────────┘
```

### Offline Mutation Flow

```
User Action (Add Item)
        │
        ▼
┌───────────────────┐
│ React Component   │
│ onClick handler   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Zero Client       │
│ .mutate.create()  │
└────────┬──────────┘
         │
    ┌────▼─────┐
    │ Online?  │
    └─┬────┬───┘
     Yes   No
      │    │
      │    ▼
      │ ┌────────────────────────┐
      │ │ Zero Client queues     │
      │ │ mutation locally       │
      │ └──────────┬─────────────┘
      │            │
      │            ▼
      │ ┌────────────────────────┐
      │ │ Update IndexedDB       │
      │ │ (optimistic update)    │
      │ └──────────┬─────────────┘
      │            │
      │            ▼
      │ ┌────────────────────────┐
      │ │ Add to Workbox         │
      │ │ BackgroundSyncQueue    │
      │ └──────────┬─────────────┘
      │            │
      │            ▼
      │ ┌────────────────────────┐
      │ │ Register background    │
      │ │ sync (if supported)    │
      │ └────────────────────────┘
      │
      ▼
┌───────────────────┐
│ POST /api/mutate  │
└────────┬──────────┘
         │
    ┌────▼─────┐
    │ Success? │
    └─┬────┬───┘
     Yes   No
      │    │
      │    ▼
      │ ┌────────────────────────┐
      │ │ Network error?         │
      │ └─┬────────────────┬─────┘
      │  Yes              No (4xx/5xx)
      │   │                │
      │   ▼                ▼
      │ ┌───────────┐   ┌───────────┐
      │ │ Add to    │   │ Show error│
      │ │ Workbox   │   │ Don't retry│
      │ │ Queue     │   └───────────┘
      │ └───────────┘
      │
      ▼
┌───────────────────┐
│ Update IndexedDB  │
│ with server       │
│ response          │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Zero reactive     │
│ update            │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Component         │
│ re-renders        │
└───────────────────┘
```

---

## State Management

### Sync State Machine

```
┌──────────┐
│   IDLE   │
└────┬─────┘
     │ trigger sync
     ▼
┌──────────┐
│  SYNCING │◄──────┐
└────┬─────┘       │
     │             │ retry
     │             │
  ┌──▼──┐          │
  │Done?│──No──────┘
  └──┬──┘
     │ Yes
     ▼
  ┌─────────┐
  │Success? │
  └─┬────┬──┘
   Yes   No
    │    │
    ▼    ▼
┌───────┐ ┌────────┐
│SYNCED │ │ FAILED │
└───┬───┘ └───┬────┘
    │         │
    │ timeout │ timeout
    │         │
    └────┬────┘
         │
         ▼
    ┌──────────┐
    │   IDLE   │
    └──────────┘
```

**State Transitions:**

```typescript
type SyncState = 'idle' | 'syncing' | 'synced' | 'failed';

interface SyncStateMachine {
  state: SyncState;
  timestamp: number;
  error?: Error;
}

class SyncStateManager {
  private state: SyncStateMachine = {
    state: 'idle',
    timestamp: Date.now(),
  };

  private listeners: ((state: SyncStateMachine) => void)[] = [];

  transition(newState: SyncState, error?: Error): void {
    // Validate transition
    if (!this.isValidTransition(this.state.state, newState)) {
      console.warn(`Invalid transition: ${this.state.state} -> ${newState}`);
      return;
    }

    // Update state
    this.state = {
      state: newState,
      timestamp: Date.now(),
      error,
    };

    // Notify listeners
    this.notifyListeners();

    // Auto-transition back to idle after delay
    if (newState === 'synced' || newState === 'failed') {
      setTimeout(() => {
        if (this.state.state === newState) {
          this.transition('idle');
        }
      }, 3000);
    }
  }

  private isValidTransition(from: SyncState, to: SyncState): boolean {
    const validTransitions: Record<SyncState, SyncState[]> = {
      idle: ['syncing'],
      syncing: ['synced', 'failed'],
      synced: ['idle', 'syncing'],
      failed: ['idle', 'syncing'],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  subscribe(listener: (state: SyncStateMachine) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  getState(): SyncStateMachine {
    return { ...this.state };
  }
}
```

### React State Management

**SyncContext State:**

```typescript
interface SyncContextState {
  // Connection
  connectionState: 'online' | 'offline' | 'connecting';

  // Sync
  syncState: 'idle' | 'syncing' | 'synced' | 'failed';
  periodicSyncEnabled: boolean;
  lastPeriodicSync: number | null;
  nextPeriodicSync: number | null; // estimated

  // Queue
  pendingCount: number;
  failedCount: number;

  // Stats
  stats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
  };

  // History
  syncHistory: SyncEvent[];
}
```

**State Updates:**

```typescript
function SyncProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SyncContextState>(initialState);

  // Listen for service worker messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'SYNC_START':
          setState(prev => ({
            ...prev,
            syncState: 'syncing',
          }));
          break;

        case 'SYNC_COMPLETE':
          setState(prev => ({
            ...prev,
            syncState: 'synced',
            lastPeriodicSync: data.timestamp,
            stats: {
              ...prev.stats,
              totalSyncs: prev.stats.totalSyncs + 1,
              successfulSyncs: prev.stats.successfulSyncs + 1,
              averageDuration: calculateAverage(
                prev.stats.averageDuration,
                data.duration,
                prev.stats.totalSyncs
              ),
            },
            syncHistory: [
              ...prev.syncHistory,
              {
                type: 'sync_complete',
                timestamp: data.timestamp,
                duration: data.duration,
              },
            ].slice(-50), // Keep last 50 events
          }));
          break;

        case 'SYNC_ERROR':
          setState(prev => ({
            ...prev,
            syncState: 'failed',
            stats: {
              ...prev.stats,
              totalSyncs: prev.stats.totalSyncs + 1,
              failedSyncs: prev.stats.failedSyncs + 1,
            },
          }));
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // ... rest of provider
}
```

---

## Concurrency and Race Conditions

### Race Condition Scenarios

**Scenario 1: Simultaneous Updates**

```
Device A                    Device B
   │                           │
   ├─ Update item X            │
   │  (timestamp: T1)          │
   │                           ├─ Update item X
   │                           │  (timestamp: T2)
   │                           │
   ├─ Periodic sync            │
   │  receives B's update      │
   │                           ├─ Periodic sync
   │                           │  receives A's update
   │                           │
   ├─ CONFLICT!                │
   │  (both modified X)        │
   │                           ├─ CONFLICT!
   │                           │  (both modified X)
   │                           │
   └─ Resolve with CRDT        │
      (LWW: T2 > T1)           └─ Resolve with CRDT
                                  (LWW: T2 > T1)
```

**Resolution:**

```typescript
// Use CRDT Last-Write-Wins with hybrid clock
interface HybridClock {
  logicalTime: number;
  physicalTime: number;
  clientID: string;
}

function resolveConflict(
  local: Item & { clock: HybridClock },
  remote: Item & { clock: HybridClock }
): Item {
  // Compare logical times first
  if (remote.clock.logicalTime > local.clock.logicalTime) {
    return remote;
  } else if (local.clock.logicalTime > remote.clock.logicalTime) {
    return local;
  }

  // Logical times equal - compare physical times
  if (remote.clock.physicalTime > local.clock.physicalTime) {
    return remote;
  } else if (local.clock.physicalTime > remote.clock.physicalTime) {
    return local;
  }

  // Both times equal - use client ID as tiebreaker
  return remote.clock.clientID > local.clock.clientID ? remote : local;
}
```

**Scenario 2: Sync During Mutation**

```
User Action                 Service Worker
   │                            │
   ├─ Start mutation            │
   │  (POST /api/mutate)        │
   │                            ├─ Periodic sync triggered
   │                            │
   │                            ├─ Fetch /api/sync
   │                            │  (gets stale data)
   │                            │
   ├─ Mutation complete         │
   │  (new data on server)      │
   │                            ├─ Update IndexedDB
   │                            │  (with stale data)
   │                            │
   └─ Update IndexedDB          │
      (with new data)           └─ CONFLICT!
                                   (DB updated twice)
```

**Resolution:**

```typescript
// Use optimistic locking with version numbers
interface VersionedItem {
  id: string;
  data: any;
  version: number;
  lastModified: number;
}

async function updateItemWithLocking(
  item: VersionedItem
): Promise<VersionedItem> {
  const db = await openDB('zero-cache');
  const tx = db.transaction('items', 'readwrite');

  try {
    // Read current version
    const current = await tx.objectStore('items').get(item.id);

    // Check version
    if (current && current.version >= item.version) {
      // Stale update - abort
      throw new Error('Stale version');
    }

    // Update with incremented version
    const updated = {
      ...item,
      version: (current?.version || 0) + 1,
      lastModified: Date.now(),
    };

    await tx.objectStore('items').put(updated);
    await tx.done;

    return updated;
  } catch (error) {
    tx.abort();
    throw error;
  }
}
```

### Synchronization Primitives

**Mutex Lock:**

```typescript
class Mutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<() => void> {
    while (this.locked) {
      await new Promise<void>(resolve => {
        this.queue.push(resolve);
      });
    }

    this.locked = true;

    // Return release function
    return () => {
      this.locked = false;
      const next = this.queue.shift();
      if (next) next();
    };
  }
}

// Usage
const syncMutex = new Mutex();

async function performPeriodicSync(): Promise<void> {
  const release = await syncMutex.acquire();

  try {
    await syncZeroData();
    await processOfflineQueue();
  } finally {
    release();
  }
}
```

**Debounce:**

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: number | undefined;
  let resolvers: ((value: ReturnType<T>) => void)[] = [];

  return (...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      resolvers.push(resolve);

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolvers.forEach(r => r(result));
          resolvers = [];
        } catch (error) {
          reject(error);
        } finally {
          timeoutId = undefined;
        }
      }, delay);
    });
  };
}

// Usage
const debouncedSync = debounce(performPeriodicSync, 1000);
```

**Throttle:**

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastRun = 0;
  let timeout: number | undefined;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun >= limit) {
      lastRun = now;
      return fn(...args);
    } else {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        lastRun = Date.now();
        fn(...args);
      }, limit - (now - lastRun));
    }
  };
}

// Usage
const throttledSync = throttle(performPeriodicSync, 5000);
```

---

## Performance Architecture

### Performance Budget

```typescript
const PERFORMANCE_BUDGET = {
  // Sync duration
  maxSyncDuration: 30000, // 30 seconds
  targetSyncDuration: 10000, // 10 seconds

  // Data size
  maxDataPerSync: 5 * 1024 * 1024, // 5 MB
  targetDataPerSync: 1 * 1024 * 1024, // 1 MB

  // Memory
  maxMemoryUsage: 50 * 1024 * 1024, // 50 MB

  // Cache
  maxCacheSize: 100 * 1024 * 1024, // 100 MB

  // Errors
  maxErrorRate: 5, // 5% of syncs can fail
};
```

### Performance Monitoring

**Metrics Collection:**

```typescript
interface PerformanceMetrics {
  // Duration
  syncDuration: number;
  fetchDuration: number;
  dbWriteDuration: number;

  // Data
  itemsSync: number;
  bytesTransferred: number;

  // Resources
  memoryUsed: number;
  cacheSize: number;

  // Timestamp
  timestamp: number;
}

async function collectMetrics(): Promise<PerformanceMetrics> {
  const syncStart = performance.now();

  // Perform sync
  const { itemsSynced, bytesTransferred } = await performPeriodicSync();

  const syncDuration = performance.now() - syncStart;

  // Get memory usage (if available)
  const memory = (performance as any).memory;
  const memoryUsed = memory?.usedJSHeapSize || 0;

  // Get cache size
  const cacheSize = await getCacheSize();

  return {
    syncDuration,
    fetchDuration: 0, // measured internally
    dbWriteDuration: 0, // measured internally
    itemsSynced,
    bytesTransferred,
    memoryUsed,
    cacheSize,
    timestamp: Date.now(),
  };
}

async function getCacheSize(): Promise<number> {
  if (!('storage' in navigator)) return 0;

  const estimate = await navigator.storage.estimate();
  return estimate.usage || 0;
}
```

**Performance Tracking:**

```typescript
class PerformanceTracker {
  private metrics: PerformanceMetrics[] = [];

  track(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Check against budget
    this.checkBudget(metric);
  }

  private checkBudget(metric: PerformanceMetrics): void {
    if (metric.syncDuration > PERFORMANCE_BUDGET.maxSyncDuration) {
      console.warn('Sync duration exceeded budget:', {
        actual: metric.syncDuration,
        budget: PERFORMANCE_BUDGET.maxSyncDuration,
      });
    }

    if (metric.bytesTransferred > PERFORMANCE_BUDGET.maxDataPerSync) {
      console.warn('Data size exceeded budget:', {
        actual: metric.bytesTransferred,
        budget: PERFORMANCE_BUDGET.maxDataPerSync,
      });
    }
  }

  getAverages(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const sum = this.metrics.reduce((acc, m) => ({
      syncDuration: acc.syncDuration + m.syncDuration,
      fetchDuration: acc.fetchDuration + m.fetchDuration,
      dbWriteDuration: acc.dbWriteDuration + m.dbWriteDuration,
      itemsSynced: acc.itemsSynced + m.itemsSynced,
      bytesTransferred: acc.bytesTransferred + m.bytesTransferred,
    }), {
      syncDuration: 0,
      fetchDuration: 0,
      dbWriteDuration: 0,
      itemsSynced: 0,
      bytesTransferred: 0,
    });

    const count = this.metrics.length;

    return {
      syncDuration: sum.syncDuration / count,
      fetchDuration: sum.fetchDuration / count,
      dbWriteDuration: sum.dbWriteDuration / count,
      itemsSynced: sum.itemsSynced / count,
      bytesTransferred: sum.bytesTransferred / count,
    };
  }
}
```

### Optimization Techniques

**1. Incremental Sync:**

```typescript
async function syncZeroData(): Promise<void> {
  const lastSync = await getLastSyncTime();

  // Only fetch changes since last sync
  const response = await fetch(`/api/sync?since=${lastSync}`);
  const { items, deleted } = await response.json();

  // Apply incremental updates
  const db = await openDB('zero-cache');
  const tx = db.transaction('items', 'readwrite');

  // Update changed items
  for (const item of items) {
    await tx.objectStore('items').put(item);
  }

  // Delete removed items
  for (const id of deleted) {
    await tx.objectStore('items').delete(id);
  }

  await tx.done;
}
```

**2. Batch Processing:**

```typescript
async function batchUpdate(items: Item[]): Promise<void> {
  const db = await openDB('zero-cache');
  const BATCH_SIZE = 100;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const tx = db.transaction('items', 'readwrite');

    await Promise.all(
      batch.map(item => tx.objectStore('items').put(item))
    );

    await tx.done;

    // Allow other tasks to run
    await sleep(0);
  }
}
```

**3. Compression:**

```typescript
async function syncWithCompression(): Promise<void> {
  const response = await fetch('/api/sync', {
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
    },
  });

  // Response is automatically decompressed
  const data = await response.json();

  // Process compressed data
  await processData(data);
}
```

**4. Lazy Loading:**

```typescript
async function lazyLoadItems(): Promise<void> {
  // Load essential data first
  await syncEssentialData();

  // Load remaining data in background
  setTimeout(async () => {
    await syncAdditionalData();
  }, 1000);
}
```

---

## Security Architecture

### Threat Model

**Threats:**

1. **Man-in-the-Middle (MITM):**
   - Attack: Intercept sync requests
   - Mitigation: HTTPS required, certificate pinning

2. **Token Theft:**
   - Attack: Steal auth token from IndexedDB
   - Mitigation: Short-lived tokens, refresh mechanism

3. **Cache Poisoning:**
   - Attack: Inject malicious data into cache
   - Mitigation: Validate all data, sanitize inputs

4. **Denial of Service:**
   - Attack: Exhaust storage/battery
   - Mitigation: Rate limiting, size limits

5. **Cross-Site Scripting (XSS):**
   - Attack: Execute malicious script
   - Mitigation: Content Security Policy, sanitization

### Security Measures

**1. HTTPS Enforcement:**

```typescript
// Service worker only installs on HTTPS
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  throw new Error('Service workers require HTTPS');
}
```

**2. Content Security Policy:**

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  worker-src 'self';
  connect-src 'self' https://api.grocery-app.com wss://api.grocery-app.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
">
```

**3. Data Validation:**

```typescript
function validateSyncData(data: unknown): SyncData {
  const schema = {
    items: Array,
    operations: Array,
    version: Number,
    timestamp: Number,
  };

  // Validate structure
  if (!isValidStructure(data, schema)) {
    throw new Error('Invalid sync data structure');
  }

  // Validate items
  const validated = data as SyncData;
  validated.items.forEach(item => {
    validateItem(item);
  });

  return validated;
}

function validateItem(item: unknown): void {
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid item');
  }

  const i = item as any;

  if (typeof i.id !== 'string') {
    throw new Error('Invalid item ID');
  }

  if (typeof i.name !== 'string') {
    throw new Error('Invalid item name');
  }

  // Sanitize name
  i.name = sanitize(i.name);
}
```

**4. Token Management:**

```typescript
interface AuthToken {
  value: string;
  expiresAt: number;
  refreshToken?: string;
}

class TokenManager {
  private token: AuthToken | null = null;

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await this.loadToken();
    }

    if (!this.token) return null;

    // Check expiration
    if (Date.now() >= this.token.expiresAt) {
      // Try to refresh
      await this.refreshToken();
    }

    return this.token.value;
  }

  private async refreshToken(): Promise<void> {
    if (!this.token?.refreshToken) {
      this.token = null;
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.token.refreshToken,
        }),
      });

      if (!response.ok) {
        this.token = null;
        return;
      }

      const data = await response.json();
      this.token = {
        value: data.accessToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
        refreshToken: data.refreshToken,
      };

      await this.saveToken(this.token);
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.token = null;
    }
  }

  private async loadToken(): Promise<AuthToken | null> {
    const db = await openDB('auth-cache');
    const tx = db.transaction('auth', 'readonly');
    const result = await tx.objectStore('auth').get('token');
    return result || null;
  }

  private async saveToken(token: AuthToken): Promise<void> {
    const db = await openDB('auth-cache');
    const tx = db.transaction('auth', 'readwrite');
    await tx.objectStore('auth').put(token, 'token');
    await tx.done;
  }
}
```

**5. Rate Limiting:**

```typescript
class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async checkLimit(): Promise<boolean> {
    const now = Date.now();

    // Remove old requests
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }
}

// Usage
const syncRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

async function performPeriodicSync(): Promise<void> {
  if (!(await syncRateLimiter.checkLimit())) {
    console.warn('Sync rate limit exceeded');
    return;
  }

  await syncZeroData();
}
```

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Maintainer:** Development Team

This architecture document provides a comprehensive technical overview of the Periodic Background Sync implementation. For user-facing documentation, see [PERIODIC_SYNC.md](./PERIODIC_SYNC.md).
