# Sync Status Tracking System

This document describes the comprehensive sync status tracking system implemented for the grocery list application. The system provides real-time monitoring of online/offline state, sync progress, and pending mutations.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Usage Examples](#usage-examples)
5. [API Reference](#api-reference)
6. [Storage & Persistence](#storage--persistence)
7. [Event System](#event-system)
8. [Performance Monitoring](#performance-monitoring)
9. [Debugging](#debugging)

## Overview

The sync tracking system consists of three main pieces:

1. **SyncContext** (`src/contexts/SyncContext.tsx`) - React Context for managing sync state
2. **useSyncStatus Hook** (`src/contexts/SyncContext.tsx`) - Hook for accessing sync state
3. **useOfflineDetection Hook** (`src/hooks/useOfflineDetection.ts`) - Hook for offline detection

### Key Features

- Real-time online/offline detection using `navigator.onLine`
- Sync state tracking (idle/syncing/synced/failed)
- Pending mutations count from OfflineQueueManager
- Last sync timestamp tracking
- Sync control functions (retry, clear queue)
- localStorage persistence for sync state
- Event emission for sync state changes
- Performance monitoring (sync duration, success rate)
- Debugging utilities
- Conflict resolution integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         SyncProvider                         │
│  (React Context providing sync state and operations)        │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴───────────┐
        │                        │
┌───────▼──────────┐  ┌─────────▼───────────┐
│  useSyncStatus   │  │ useOfflineDetection │
│   (Main Hook)    │  │  (Offline Hook)     │
└───────┬──────────┘  └─────────┬───────────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────▼────────────┐
        │   OfflineQueueManager  │
        │  (Mutation Queue Mgmt) │
        └────────────────────────┘
```

### Data Flow

1. **Network Events** → `navigator.onLine` events → SyncContext updates
2. **Queue Changes** → OfflineQueueManager → SyncContext updates
3. **User Actions** → Component → SyncContext methods → OfflineQueueManager
4. **Sync State** → SyncContext → useSyncStatus → Components

## Components

### 1. SyncContext (`src/contexts/SyncContext.tsx`)

The central hub for sync state management.

#### State Properties

```typescript
interface SyncContextState {
  connectionState: ConnectionState;     // 'online' | 'offline' | 'connecting'
  syncState: SyncState;                 // 'idle' | 'syncing' | 'synced' | 'failed'
  pendingCount: number;                 // Number of pending mutations
  failedCount: number;                  // Number of failed mutations
  lastSyncTime: number | null;          // Timestamp of last successful sync
  lastOfflineTime: number | null;       // Timestamp when went offline
  isSyncing: boolean;                   // Whether currently syncing
  stats: SyncStats;                     // Performance statistics
  queueStatus: QueueStatus | null;      // Detailed queue status
  conflicts: Conflict[];                // Active conflicts
}
```

#### Methods

```typescript
interface SyncContextValue {
  retrySync: () => Promise<void>;          // Retry failed mutations
  clearQueue: () => void;                  // Clear all pending mutations
  triggerSync: () => Promise<void>;        // Manually trigger sync
  getSyncHistory: () => SyncEvent[];       // Get sync event history
  clearSyncHistory: () => void;            // Clear sync history
  getDebugInfo: () => any;                 // Get debug information
  resolveConflict: (id, resolution, item?) => void;  // Resolve conflict
  dismissConflict: (id) => void;           // Dismiss conflict
}
```

### 2. useSyncStatus Hook

Hook for accessing sync status in components.

```typescript
const {
  // Legacy format (for SyncStatus component)
  isOnline,
  isSyncing,
  queuedCount,
  lastSyncTime,
  onRetrySync,

  // Extended properties
  connectionState,
  syncState,
  pendingCount,
  failedCount,
  lastOfflineTime,
  stats,
  queueStatus,
  retrySync,
  clearQueue,
  triggerSync,
  getSyncHistory,
  clearSyncHistory,
  getDebugInfo,
} = useSyncStatus();
```

### 3. useOfflineDetection Hook

Standalone hook for offline detection with advanced features.

```typescript
const {
  isOnline,              // Whether device is online
  isOffline,             // Whether device is offline
  isReconnecting,        // Whether attempting to reconnect
  connectionQuality,     // 'good' | 'poor' | 'offline'
  lastOfflineTime,       // When device went offline
  offlineDuration,       // How long was offline (ms)
  checkConnection,       // Manual connection check
  forceReconnect,        // Force reconnection attempt
} = useOfflineDetection({
  onOnline: () => console.log('Connected!'),
  onOffline: () => console.log('Disconnected!'),
  detectSlowConnection: true,
  slowConnectionTimeout: 5000,
  pingUrl: '/api/ping',
  checkInterval: 30000,
});
```

## Usage Examples

### Basic Sync Status Display

```tsx
import { useSyncStatus } from './contexts/SyncContext';

function SyncIndicator() {
  const {
    connectionState,
    syncState,
    pendingCount,
    lastSyncTime
  } = useSyncStatus();

  return (
    <div>
      <p>Connection: {connectionState}</p>
      <p>Sync: {syncState}</p>
      <p>Pending: {pendingCount}</p>
      <p>Last Sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}</p>
    </div>
  );
}
```

### Retry Failed Syncs

```tsx
import { useSyncStatus } from './contexts/SyncContext';

function SyncControls() {
  const { failedCount, retrySync, clearQueue } = useSyncStatus();

  if (failedCount === 0) return null;

  return (
    <div className="sync-controls">
      <p>{failedCount} failed mutations</p>
      <button onClick={retrySync}>Retry</button>
      <button onClick={clearQueue}>Clear Queue</button>
    </div>
  );
}
```

### Performance Statistics

```tsx
import { useSyncStatus } from './contexts/SyncContext';

function SyncStats() {
  const { stats } = useSyncStatus();

  return (
    <div className="sync-stats">
      <p>Success Rate: {stats.successRate.toFixed(1)}%</p>
      <p>Total Syncs: {stats.totalSyncs}</p>
      <p>Total Failures: {stats.totalFailures}</p>
      <p>Avg Duration: {stats.averageSyncDuration}ms</p>
      <p>Last Duration: {stats.lastSyncDuration}ms</p>
    </div>
  );
}
```

### Offline Detection with Callbacks

```tsx
import { useOfflineDetection } from './hooks/useOfflineDetection';

function OfflineWarning() {
  const {
    isOffline,
    offlineDuration,
    forceReconnect
  } = useOfflineDetection({
    onOnline: () => {
      console.log('Back online!');
      // Trigger sync or other operations
    },
    onOffline: () => {
      console.log('Lost connection');
      // Show warning, pause operations, etc.
    },
  });

  if (!isOffline) return null;

  return (
    <div className="offline-warning">
      <p>You are offline</p>
      {offlineDuration && (
        <p>For {Math.floor(offlineDuration / 1000)}s</p>
      )}
      <button onClick={forceReconnect}>Retry Connection</button>
    </div>
  );
}
```

### Sync Event History

```tsx
import { useSyncStatus } from './contexts/SyncContext';

function SyncLog() {
  const { getSyncHistory, clearSyncHistory } = useSyncStatus();
  const history = getSyncHistory();

  return (
    <div className="sync-log">
      <h3>Sync History</h3>
      <button onClick={clearSyncHistory}>Clear</button>
      <ul>
        {history.map(event => (
          <li key={event.timestamp}>
            {event.type} - {new Date(event.timestamp).toLocaleString()}
            {event.data && <pre>{JSON.stringify(event.data, null, 2)}</pre>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Debug Information

```tsx
import { useSyncStatus } from './contexts/SyncContext';

function DebugPanel() {
  const { getDebugInfo } = useSyncStatus();
  const debugInfo = getDebugInfo();

  return (
    <details className="debug-panel">
      <summary>Debug Info</summary>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </details>
  );
}
```

## API Reference

### ConnectionState Type

```typescript
type ConnectionState = 'online' | 'offline' | 'connecting';
```

- `online`: Device has network connectivity
- `offline`: Device has no network connectivity
- `connecting`: Device is attempting to reconnect

### SyncState Type

```typescript
type SyncState = 'idle' | 'syncing' | 'synced' | 'failed';
```

- `idle`: No active sync operation
- `syncing`: Currently syncing mutations
- `synced`: Recently completed successful sync
- `failed`: Recent sync failed

### SyncStats Interface

```typescript
interface SyncStats {
  lastSyncDuration: number | null;      // Duration of last sync (ms)
  averageSyncDuration: number | null;   // Average duration (ms)
  totalSyncs: number;                   // Total successful syncs
  totalFailures: number;                // Total failed syncs
  successRate: number;                  // Success rate (0-100)
}
```

### SyncEvent Interface

```typescript
interface SyncEvent {
  type: 'sync_start' | 'sync_complete' | 'sync_failed' | 'connection_change' | 'queue_change';
  timestamp: number;
  connectionState: ConnectionState;
  syncState: SyncState;
  pendingCount: number;
  data?: any;
}
```

### QueueStatus Interface

```typescript
interface QueueStatus {
  total: number;              // Total mutations in queue
  pending: number;            // Pending mutations
  processing: number;         // Currently processing
  failed: number;             // Failed mutations
  success: number;            // Successful mutations
  isProcessing: boolean;      // Whether queue is processing
  lastProcessed?: number;     // Last processed timestamp
}
```

## Storage & Persistence

The sync system persists data to localStorage for continuity across sessions:

### Storage Keys

```typescript
const SYNC_STORAGE_KEYS = {
  LAST_SYNC_TIME: 'grocery_sync_last_sync_time',
  LAST_OFFLINE_TIME: 'grocery_sync_last_offline_time',
  SYNC_STATS: 'grocery_sync_stats',
  SYNC_HISTORY: 'grocery_sync_history',
};
```

### Data Format

**Last Sync Time** (string):
```
"1678901234567"
```

**Last Offline Time** (string):
```
"1678901234567"
```

**Sync Stats** (JSON):
```json
{
  "lastSyncDuration": 150,
  "averageSyncDuration": 175,
  "totalSyncs": 45,
  "totalFailures": 3,
  "successRate": 93.75
}
```

**Sync History** (JSON array, max 50 events):
```json
[
  {
    "type": "sync_start",
    "timestamp": 1678901234567,
    "connectionState": "online",
    "syncState": "syncing",
    "pendingCount": 3
  },
  {
    "type": "sync_complete",
    "timestamp": 1678901234717,
    "connectionState": "online",
    "syncState": "synced",
    "pendingCount": 0,
    "data": {
      "duration": 150,
      "success": true
    }
  }
]
```

## Event System

The sync system emits events that can be used for logging, analytics, or triggering side effects.

### Event Types

1. **sync_start**: Sync operation started
2. **sync_complete**: Sync operation completed successfully
3. **sync_failed**: Sync operation failed
4. **connection_change**: Network connection state changed
5. **queue_change**: Queue status changed (mutations added/removed)

### Event Flow

```
User Action
    │
    ├─→ Mutation Added to Queue
    │       │
    │       └─→ queue_change event
    │
    ├─→ Online Event Detected
    │       │
    │       └─→ connection_change event
    │
    ├─→ Queue Processing Started
    │       │
    │       └─→ sync_start event
    │
    └─→ Queue Processing Complete
            │
            ├─→ sync_complete event (if success)
            └─→ sync_failed event (if failed)
```

### Accessing Events

```tsx
const { getSyncHistory } = useSyncStatus();
const events = getSyncHistory();

// Filter events by type
const syncStarts = events.filter(e => e.type === 'sync_start');
const syncFails = events.filter(e => e.type === 'sync_failed');
```

## Performance Monitoring

The sync system tracks performance metrics to help identify issues and optimize sync operations.

### Metrics Tracked

1. **Sync Duration**: Time taken for each sync operation
2. **Success Rate**: Percentage of successful syncs
3. **Total Syncs**: Count of completed sync operations
4. **Total Failures**: Count of failed sync operations
5. **Average Duration**: Running average of sync durations

### Calculating Metrics

```typescript
// Success rate
const successRate = (totalSyncs / (totalSyncs + totalFailures)) * 100;

// Average duration (running average)
const avgDuration = (
  (previousAvg * (totalSyncs - 1) + newDuration) / totalSyncs
);
```

### Using Metrics

```tsx
const { stats } = useSyncStatus();

// Check if performance is degrading
if (stats.averageSyncDuration > 5000) {
  console.warn('Sync performance degrading');
}

// Check if failure rate is high
if (stats.successRate < 80) {
  console.error('High sync failure rate');
}
```

## Debugging

### Debug Panel

```tsx
import { useSyncStatus } from './contexts/SyncContext';

function DevTools() {
  const { getDebugInfo } = useSyncStatus();

  return (
    <button onClick={() => {
      const info = getDebugInfo();
      console.table(info.state);
      console.log('Queue Status:', info.queueStatus);
      console.log('Recent Events:', info.syncHistory);
      console.log('Navigator:', info.navigator);
      console.log('Storage:', info.storage);
    }}>
      Log Debug Info
    </button>
  );
}
```

### Console Logging

The sync system includes comprehensive console logging:

```javascript
// Enable debug logging
localStorage.setItem('DEBUG', 'sync:*');

// Or in code
console.debug('[SyncContext] Event:', event);
console.log('[SyncContext] Connection restored');
console.warn('[SyncContext] Cannot sync while offline');
console.error('[SyncContext] Retry sync failed:', error);
```

### Common Issues

#### 1. Sync Not Triggering

**Symptoms**: Pending mutations not syncing
**Debugging**:
```tsx
const { pendingCount, queueStatus, connectionState } = useSyncStatus();
console.log('Pending:', pendingCount);
console.log('Queue:', queueStatus);
console.log('Connection:', connectionState);
```

#### 2. High Failure Rate

**Symptoms**: Many failed syncs
**Debugging**:
```tsx
const { stats, getSyncHistory } = useSyncStatus();
const failures = getSyncHistory().filter(e => e.type === 'sync_failed');
console.log('Failure rate:', (1 - stats.successRate / 100));
console.log('Recent failures:', failures);
```

#### 3. Slow Sync Performance

**Symptoms**: Syncs taking too long
**Debugging**:
```tsx
const { stats } = useSyncStatus();
if (stats.averageSyncDuration > 5000) {
  console.warn('Average sync time:', stats.averageSyncDuration, 'ms');
  // Check queue size, network quality, etc.
}
```

### Testing

#### Simulating Offline State

```javascript
// In browser console
window.dispatchEvent(new Event('offline'));

// Wait a bit...
setTimeout(() => {
  window.dispatchEvent(new Event('online'));
}, 5000);
```

#### Simulating Slow Connection

```tsx
const { checkConnection } = useOfflineDetection({
  detectSlowConnection: true,
  slowConnectionTimeout: 1000, // Very short timeout
  pingUrl: '/api/ping',
});

// Manually trigger check
await checkConnection();
```

## Integration with Existing Components

The sync tracking system is already integrated with:

1. **SyncStatus Component** (`src/components/SyncStatus.tsx`)
   - Visual indicator of sync state
   - Shows pending mutations count
   - Retry button for failed syncs

2. **App Component** (`src/App.tsx`)
   - Displays SyncStatus in header
   - Keyboard shortcut (Ctrl+R) for retry sync

3. **OfflineQueueManager** (`src/utils/offlineQueue.ts`)
   - Provides mutation queue data
   - Processes pending mutations

## Future Enhancements

Possible improvements for the sync tracking system:

1. **Network Quality Detection**: Detect slow/poor connections
2. **Sync Scheduling**: Smart scheduling based on network conditions
3. **Conflict Auto-Resolution**: Automatic conflict resolution strategies
4. **Sync Analytics**: Detailed analytics dashboard
5. **Background Sync**: Use Background Sync API for PWA
6. **Sync Prioritization**: Priority-based sync queue
7. **Bandwidth Throttling**: Respect user's data preferences

## Conclusion

The sync tracking system provides comprehensive monitoring and control of online/offline state and sync operations. It's designed to be:

- **Reliable**: Handles edge cases and network transitions
- **Performant**: Minimal overhead with efficient state updates
- **Debuggable**: Rich logging and debugging tools
- **Extensible**: Easy to add new features and integrations
- **User-Friendly**: Clear feedback on sync status

For questions or issues, refer to the source code documentation or create an issue in the project repository.
