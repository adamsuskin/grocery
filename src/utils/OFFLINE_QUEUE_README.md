# Offline Queue Management System

A comprehensive offline-first queue management system for the grocery list app. This system ensures that user actions are never lost, even when the network is unavailable, by queueing mutations locally and syncing them when connectivity is restored.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Features

### Core Features

- **✅ Queue Persistence**: Mutations are persisted to localStorage and survive page refreshes
- **✅ Automatic Retry**: Failed mutations are automatically retried with exponential backoff
- **✅ Queue Prioritization**: Mutations are prioritized (deletes before adds) to avoid conflicts
- **✅ Conflict Detection**: Built-in conflict detection (currently delegated to Zero's CRDT engine)
- **✅ Progress Tracking**: Real-time callbacks for tracking queue processing progress
- **✅ Type Safety**: Full TypeScript support with strict typing
- **✅ React Integration**: Easy-to-use React hooks for seamless integration

### Advanced Features

- **Exponential Backoff**: Smart retry strategy that increases delay between retries
- **Maximum Retry Limits**: Configurable maximum retry attempts before giving up
- **Status Tracking**: Track individual mutation status (pending, processing, failed, success)
- **Batch Processing**: Process multiple mutations efficiently in priority order
- **Manual Controls**: Full manual control over queue processing and cleanup

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    OfflineQueueManager                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Queue Array (in-memory + localStorage)              │ │
│  │  - Sorted by priority and timestamp                  │ │
│  │  - Persisted to localStorage                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Processing Engine                                    │ │
│  │  - Exponential backoff retry logic                   │ │
│  │  - Conflict detection                                │ │
│  │  - Zero mutation execution                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Event System                                         │ │
│  │  - onQueueProcessed callbacks                        │ │
│  │  - onMutationSuccess callbacks                       │ │
│  │  - onMutationFailed callbacks                        │ │
│  │  - onStatusChange callbacks                          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Hook Layer                          │
│                   useOfflineQueue()                         │
│  - Wraps OfflineQueueManager                               │
│  - Provides reactive state                                 │
│  - Simplifies React integration                            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Detect Online/Offline
                    │
        ┌───────────┴───────────┐
        │                       │
    Online                  Offline
        │                       │
        ▼                       ▼
Execute Mutation        Queue Mutation
Immediately            (localStorage)
        │                       │
        │                       ▼
        │              Wait for Online
        │                       │
        │                       ▼
        │              Process Queue
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
            Zero Sync Engine
                    │
                    ▼
               Database
```

## Installation

The offline queue system is included in the utils directory:

```typescript
import {
  useOfflineQueue,
  OfflineQueueManager,
  createAddItemMutation,
  createMarkGottenMutation,
  createDeleteItemMutation,
} from './utils/offlineQueue';
```

## Quick Start

### Basic Usage with React Hook

```typescript
import { useOfflineQueue } from './utils/offlineQueue';

function MyComponent() {
  const {
    pendingCount,
    failedCount,
    retryFailed,
    processQueue
  } = useOfflineQueue();

  return (
    <div>
      <p>Pending mutations: {pendingCount}</p>
      {failedCount > 0 && (
        <button onClick={retryFailed}>
          Retry Failed ({failedCount})
        </button>
      )}
    </div>
  );
}
```

### Queueing Mutations

```typescript
import { useOfflineQueue, createAddItemMutation } from './utils/offlineQueue';
import { nanoid } from 'nanoid';

function AddItemForm() {
  const { addMutation } = useOfflineQueue();
  const isOnline = navigator.onLine;

  const handleAddItem = () => {
    if (!isOnline) {
      // Queue the mutation when offline
      addMutation(createAddItemMutation({
        id: nanoid(),
        name: 'Milk',
        quantity: 2,
        category: 'Dairy',
        notes: 'Whole milk',
        userId: 'user-123',
        listId: 'list-456',
      }));
    } else {
      // Execute directly when online
      // ... normal mutation code
    }
  };

  return <button onClick={handleAddItem}>Add Item</button>;
}
```

## API Reference

### Types

#### `QueuedMutation`

Represents a mutation queued for processing.

```typescript
interface QueuedMutation {
  id: string;                    // Unique identifier
  type: MutationType;            // 'add' | 'update' | 'delete' | 'markGotten'
  payload: any;                  // Mutation-specific payload
  timestamp: number;             // When mutation was queued
  retryCount: number;            // Number of retry attempts
  status: MutationStatus;        // Current status
  error?: string;                // Error message if failed
  priority?: number;             // Processing priority (higher = first)
}
```

#### `OfflineQueueConfig`

Configuration options for the queue manager.

```typescript
interface OfflineQueueConfig {
  maxRetries?: number;           // Default: 5
  baseDelay?: number;            // Default: 1000ms
  maxDelay?: number;             // Default: 60000ms
  autoProcess?: boolean;         // Default: true
  onQueueProcessed?: (results: ProcessingResult) => void;
  onMutationSuccess?: (mutation: QueuedMutation) => void;
  onMutationFailed?: (mutation: QueuedMutation, error: Error) => void;
  onStatusChange?: (status: QueueStatus) => void;
}
```

#### `QueueStatus`

Current status of the queue.

```typescript
interface QueueStatus {
  total: number;                 // Total mutations in queue
  pending: number;               // Pending mutations
  processing: number;            // Currently processing
  failed: number;                // Failed mutations
  success: number;               // Successful mutations
  isProcessing: boolean;         // Whether queue is being processed
  lastProcessed?: number;        // Last processing timestamp
}
```

### OfflineQueueManager Class

#### Constructor

```typescript
const queueManager = new OfflineQueueManager(config?: OfflineQueueConfig);
```

#### Methods

##### `addToQueue(mutation: QueuedMutation): void`

Add a mutation to the queue.

```typescript
queueManager.addToQueue({
  id: nanoid(),
  type: 'add',
  payload: { name: 'Milk', quantity: 2 },
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
});
```

##### `processQueue(): Promise<ProcessingResult>`

Process all pending and failed mutations in the queue.

```typescript
const results = await queueManager.processQueue();
console.log(`Processed: ${results.successCount} succeeded, ${results.failedCount} failed`);
```

##### `clearQueue(): void`

Clear all mutations from the queue.

```typescript
queueManager.clearQueue();
```

##### `getQueuedMutations(): QueuedMutation[]`

Get all mutations currently in the queue.

```typescript
const mutations = queueManager.getQueuedMutations();
console.log(`Queue has ${mutations.length} mutations`);
```

##### `retryFailed(): Promise<ProcessingResult>`

Reset all failed mutations to pending and process the queue.

```typescript
await queueManager.retryFailed();
```

##### `getStatus(): QueueStatus`

Get current queue status.

```typescript
const status = queueManager.getStatus();
console.log(`Pending: ${status.pending}, Failed: ${status.failed}`);
```

##### `removeMutation(mutationId: string): void`

Remove a specific mutation from the queue.

```typescript
queueManager.removeMutation('mutation-id-123');
```

### React Hook: `useOfflineQueue`

#### Usage

```typescript
const {
  // Status
  queueStatus,
  pendingCount,
  failedCount,
  successCount,
  totalCount,
  isProcessing,
  lastProcessed,
  lastUpdate,

  // Actions
  retryFailed,
  clearQueue,
  processQueue,
  addMutation,
  removeMutation,
  getQueuedMutations,

  // Direct access
  queueManager,
} = useOfflineQueue(config?: OfflineQueueConfig);
```

#### Return Values

| Name | Type | Description |
|------|------|-------------|
| `queueStatus` | `QueueStatus` | Complete queue status object |
| `pendingCount` | `number` | Number of pending mutations |
| `failedCount` | `number` | Number of failed mutations |
| `successCount` | `number` | Number of successful mutations |
| `totalCount` | `number` | Total mutations in queue |
| `isProcessing` | `boolean` | Whether queue is being processed |
| `lastProcessed` | `number \| undefined` | Timestamp of last processing |
| `lastUpdate` | `number` | Timestamp of last status update |
| `retryFailed` | `() => Promise<void>` | Retry all failed mutations |
| `clearQueue` | `() => void` | Clear entire queue |
| `processQueue` | `() => Promise<void>` | Process queue manually |
| `addMutation` | `(mutation) => void` | Add mutation to queue |
| `removeMutation` | `(id: string) => void` | Remove specific mutation |
| `getQueuedMutations` | `() => QueuedMutation[]` | Get all queued mutations |
| `queueManager` | `OfflineQueueManager` | Direct access to manager |

### Helper Functions

#### `createAddItemMutation()`

Create a queued mutation for adding an item.

```typescript
const mutation = createAddItemMutation({
  id: nanoid(),
  name: 'Milk',
  quantity: 2,
  category: 'Dairy',
  notes: 'Whole milk',
  userId: 'user-123',
  listId: 'list-456',
});
```

#### `createUpdateItemMutation()`

Create a queued mutation for updating an item.

```typescript
const mutation = createUpdateItemMutation('item-id', {
  name: 'Updated Name',
  quantity: 5,
});
```

#### `createMarkGottenMutation()`

Create a queued mutation for marking an item as gotten.

```typescript
const mutation = createMarkGottenMutation('item-id', true);
```

#### `createDeleteItemMutation()`

Create a queued mutation for deleting an item.

```typescript
const mutation = createDeleteItemMutation('item-id');
```

## Usage Examples

See `offlineQueue.example.tsx` for comprehensive examples including:

1. **OfflineQueueStatus**: Basic queue status display component
2. **QueueAwareItemForm**: Form that queues items when offline
3. **QueuedMutationsList**: Display individual queued mutations
4. **AdvancedQueueManager**: Custom configuration and logging
5. **QueueAwareGroceryItem**: Integration with existing item components
6. **GlobalOfflineIndicator**: Global offline status indicator

## Best Practices

### 1. Always Check Online Status

```typescript
const isOnline = navigator.onLine;

if (isOnline) {
  // Execute mutation directly
  await addItem(name, quantity, category, notes);
} else {
  // Queue mutation for later
  addMutation(createAddItemMutation({ ... }));
}
```

### 2. Listen for Online Events

```typescript
useEffect(() => {
  const handleOnline = () => {
    console.log('Back online, processing queue...');
    processQueue();
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, [processQueue]);
```

### 3. Provide User Feedback

```typescript
function OfflineIndicator() {
  const { pendingCount, isProcessing } = useOfflineQueue();
  const isOnline = navigator.onLine;

  return (
    <div>
      {!isOnline && <span>⚠️ Offline - {pendingCount} queued</span>}
      {isProcessing && <span>⏳ Syncing...</span>}
    </div>
  );
}
```

### 4. Handle Failed Mutations

```typescript
const { failedCount, retryFailed, getQueuedMutations } = useOfflineQueue();

// Show retry button when there are failures
if (failedCount > 0) {
  const failed = getQueuedMutations().filter(m => m.status === 'failed');

  return (
    <div>
      <p>⚠️ {failedCount} mutations failed</p>
      <button onClick={retryFailed}>Retry All</button>
      <ul>
        {failed.map(m => (
          <li key={m.id}>{m.error}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 5. Configure Retry Strategy

```typescript
const queueManager = new OfflineQueueManager({
  maxRetries: 3,        // Retry up to 3 times
  baseDelay: 2000,      // Start with 2 second delay
  maxDelay: 30000,      // Cap at 30 seconds
  autoProcess: true,    // Auto-process on initialization
});
```

### 6. Use Callbacks for Monitoring

```typescript
useOfflineQueue({
  onQueueProcessed: (results) => {
    toast.success(`Synced ${results.successCount} changes`);
  },

  onMutationFailed: (mutation, error) => {
    console.error('Mutation failed:', mutation.type, error.message);
    toast.error(`Failed to sync: ${error.message}`);
  },

  onStatusChange: (status) => {
    // Update global state, analytics, etc.
    updateSyncStatus(status);
  },
});
```

## Troubleshooting

### Queue Not Processing

**Problem**: Mutations stay in pending state.

**Solutions**:
- Check if `autoProcess` is enabled in config
- Manually call `processQueue()`
- Verify network connectivity
- Check browser console for errors

### Mutations Failing Repeatedly

**Problem**: Mutations reach max retry limit.

**Solutions**:
- Check network connectivity
- Verify Zero server is accessible
- Check mutation payload for invalid data
- Review error messages in failed mutations
- Increase `maxRetries` if transient failures

### localStorage Quota Exceeded

**Problem**: Too many mutations in queue.

**Solutions**:
- Call `clearQueue()` periodically
- Reduce queue size by processing more frequently
- Remove successful mutations automatically (already implemented)
- Consider implementing queue size limits

### Conflicts After Sync

**Problem**: Data conflicts when queue processes.

**Solutions**:
- Implement custom conflict resolution
- Use Zero's CRDT conflict resolution (default)
- Review mutation order and priority
- Consider versioning or timestamps

### Performance Issues

**Problem**: Queue processing is slow.

**Solutions**:
- Reduce `baseDelay` for faster retries
- Process queue in smaller batches
- Optimize mutation payloads (remove unnecessary data)
- Consider implementing rate limiting

## Advanced Topics

### Custom Mutation Types

You can extend the system with custom mutation types:

```typescript
// Extend MutationType
type CustomMutationType = MutationType | 'customAction';

// Create custom helper
function createCustomMutation(data: any) {
  return {
    type: 'customAction' as const,
    payload: data,
  };
}

// Handle in processMutation (extend OfflineQueueManager)
```

### Conflict Resolution Strategies

The current implementation delegates conflict resolution to Zero's CRDT engine. For custom strategies:

```typescript
private async detectConflict(mutation: QueuedMutation): Promise<boolean> {
  // Implement custom conflict detection logic
  // Return true if conflict detected

  // Example: Check if item was modified by another user
  const currentItem = await fetchCurrentItem(mutation.payload.id);
  const queuedItem = mutation.payload;

  if (currentItem.updatedAt > queuedItem.timestamp) {
    // Conflict: item was modified after mutation was queued
    return true;
  }

  return false;
}
```

### Integration with Redux/MobX

```typescript
// Redux action
function queueMutation(mutation: QueuedMutation) {
  return (dispatch) => {
    const queueManager = getQueueManager();
    queueManager.addToQueue(mutation);

    dispatch({ type: 'MUTATION_QUEUED', payload: mutation });
  };
}

// MobX store
class OfflineStore {
  @observable queueStatus: QueueStatus;

  constructor() {
    const queueManager = getQueueManager({
      onStatusChange: (status) => {
        runInAction(() => {
          this.queueStatus = status;
        });
      },
    });
  }
}
```

## Performance Considerations

- **localStorage Persistence**: Queue is persisted to localStorage on every change. For high-frequency mutations, consider debouncing.
- **Memory Usage**: Large queues consume memory. Implement automatic cleanup of old successful mutations.
- **Network Requests**: Each mutation triggers a Zero mutation. Consider batching for better performance.
- **React Renders**: Status polling happens every second. Adjust interval based on your needs.

## Security Considerations

- **Authentication**: Ensure mutations include proper user authentication
- **Authorization**: Verify user has permission to perform queued mutations
- **Data Validation**: Validate mutation payloads before processing
- **XSS Prevention**: Sanitize any user input in mutation payloads

## Future Enhancements

Potential improvements for future versions:

1. **Optimistic UI Updates**: Apply mutations locally before sync
2. **Undo/Redo**: Track mutation history for undo functionality
3. **Batch Processing**: Process multiple mutations in single Zero transaction
4. **Compression**: Compress queue data in localStorage
5. **Encryption**: Encrypt sensitive mutation data
6. **Analytics**: Track queue performance and success rates
7. **Conflict Resolution UI**: Show conflicts to users for manual resolution
8. **Priority Queue**: More sophisticated priority algorithms
9. **Selective Sync**: Allow users to choose which mutations to sync
10. **Background Sync**: Use Service Workers for background sync

## License

Part of the grocery list application.
