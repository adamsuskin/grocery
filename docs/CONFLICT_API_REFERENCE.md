# Conflict Resolution API Reference

Complete API documentation for the offline conflict resolution system.

## Table of Contents

- [OfflineQueueManager Class](#offlinequeuemanager-class)
- [ConflictResolver Class](#conflictresolver-class)
- [React Hooks](#react-hooks)
- [TypeScript Interfaces](#typescript-interfaces)
- [Helper Functions](#helper-functions)
- [Usage Examples](#usage-examples)

---

## OfflineQueueManager Class

The `OfflineQueueManager` class manages a queue of mutations that need to be synced when online.

### Constructor

```typescript
constructor(config?: OfflineQueueConfig)
```

Creates a new OfflineQueueManager instance with optional configuration.

**Parameters:**
- `config` (optional): Configuration options for the queue manager

**Example:**
```typescript
import { OfflineQueueManager } from './utils/offlineQueue';

const queueManager = new OfflineQueueManager({
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 60000,
  autoProcess: true,
  onQueueProcessed: (results) => {
    console.log('Queue processed:', results);
  },
  onMutationSuccess: (mutation) => {
    console.log('Mutation succeeded:', mutation.id);
  },
  onMutationFailed: (mutation, error) => {
    console.error('Mutation failed:', mutation.id, error);
  },
  onStatusChange: (status) => {
    console.log('Queue status changed:', status);
  },
});
```

### Methods

#### addToQueue()

```typescript
addToQueue(mutation: QueuedMutation): void
```

Adds a mutation to the offline queue.

**Parameters:**
- `mutation`: The mutation object to queue

**Behavior:**
- Assigns priority based on mutation type if not provided
- Sorts queue by priority (highest first) and timestamp (oldest first)
- Persists queue to localStorage
- Notifies status change listeners

**Example:**
```typescript
queueManager.addToQueue({
  id: nanoid(),
  type: 'add',
  payload: {
    id: 'item-123',
    name: 'Milk',
    quantity: 2,
    category: 'Dairy',
    notes: 'Organic',
    userId: 'user-456',
    listId: 'list-789',
    createdAt: Date.now(),
  },
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
  priority: 10,
});
```

#### processQueue()

```typescript
async processQueue(): Promise<ProcessingResult>
```

Processes all pending and failed mutations in the queue.

**Returns:** Promise resolving to processing results

**Behavior:**
- Checks if already processing (returns early if so)
- Processes mutations in priority order
- Applies exponential backoff for retries
- Detects and handles conflicts
- Cleans up successful mutations
- Updates queue status throughout

**Example:**
```typescript
const result = await queueManager.processQueue();
console.log('Processed:', result.successCount);
console.log('Failed:', result.failedCount);
console.log('Time:', result.processingTime + 'ms');
```

**Return Type:**
```typescript
interface ProcessingResult {
  successCount: number;        // Mutations successfully processed
  failedCount: number;          // Mutations that failed
  pendingCount: number;         // Mutations still pending
  failedMutationIds: string[]; // IDs of failed mutations
  processingTime: number;       // Total time in milliseconds
}
```

#### clearQueue()

```typescript
clearQueue(): void
```

Clears all mutations from the queue.

**Behavior:**
- Removes all mutations from memory and localStorage
- Notifies status change listeners
- Logs the action

**Example:**
```typescript
queueManager.clearQueue();
console.log('Queue cleared');
```

#### getQueuedMutations()

```typescript
getQueuedMutations(): QueuedMutation[]
```

Returns a copy of all queued mutations.

**Returns:** Array of queued mutations

**Example:**
```typescript
const mutations = queueManager.getQueuedMutations();
console.log('Pending:', mutations.filter(m => m.status === 'pending').length);
console.log('Failed:', mutations.filter(m => m.status === 'failed').length);
```

#### retryFailed()

```typescript
async retryFailed(): Promise<ProcessingResult>
```

Resets all failed mutations to pending and processes the queue.

**Returns:** Promise resolving to processing results

**Behavior:**
- Finds all failed mutations
- Resets status to 'pending'
- Resets retry count to 0
- Clears error messages
- Calls processQueue()

**Example:**
```typescript
const result = await queueManager.retryFailed();
console.log('Retried', result.successCount, 'failed mutations');
```

#### getStatus()

```typescript
getStatus(): QueueStatus
```

Returns the current status of the queue.

**Returns:** Queue status object

**Example:**
```typescript
const status = queueManager.getStatus();
console.log('Total:', status.total);
console.log('Pending:', status.pending);
console.log('Processing:', status.processing);
console.log('Failed:', status.failed);
console.log('Success:', status.success);
console.log('Is Processing:', status.isProcessing);
console.log('Last Processed:', new Date(status.lastProcessed || 0));
```

**Return Type:**
```typescript
interface QueueStatus {
  total: number;          // Total mutations in queue
  pending: number;        // Pending mutations
  processing: number;     // Currently processing
  failed: number;         // Failed mutations
  success: number;        // Successful mutations
  isProcessing: boolean;  // Whether processing
  lastProcessed?: number; // Last processed timestamp
}
```

#### removeMutation()

```typescript
removeMutation(mutationId: string): void
```

Removes a specific mutation from the queue by ID.

**Parameters:**
- `mutationId`: ID of the mutation to remove

**Example:**
```typescript
queueManager.removeMutation('mut_abc123');
```

### Configuration

```typescript
interface OfflineQueueConfig {
  maxRetries?: number;              // Default: 5
  baseDelay?: number;               // Default: 1000ms
  maxDelay?: number;                // Default: 60000ms
  autoProcess?: boolean;            // Default: true
  onQueueProcessed?: (results: ProcessingResult) => void;
  onMutationSuccess?: (mutation: QueuedMutation) => void;
  onMutationFailed?: (mutation: QueuedMutation, error: Error) => void;
  onStatusChange?: (status: QueueStatus) => void;
}
```

---

## ConflictResolver Class

The `ConflictResolver` class detects and resolves conflicts between local and remote versions of items.

### Constructor

```typescript
constructor()
```

Creates a new ConflictResolver instance.

**Example:**
```typescript
import { ConflictResolver } from './utils/conflictResolver';

const resolver = new ConflictResolver();
```

### Methods

#### detectConflict()

```typescript
detectConflict(local: GroceryItem, remote: GroceryItem): Conflict | null
```

Detects if there's a conflict between local and remote versions.

**Parameters:**
- `local`: Local version of the item
- `remote`: Remote version of the item

**Returns:** Conflict object if detected, null otherwise

**Throws:**
- Error if inputs are invalid or IDs don't match

**Example:**
```typescript
const local = {
  id: 'item-123',
  name: 'Milk',
  quantity: 2,
  gotten: false,
  category: 'Dairy',
  notes: 'Organic',
  userId: 'user-456',
  listId: 'list-789',
  createdAt: 1698765432000,
};

const remote = {
  ...local,
  quantity: 3,
  gotten: true,
  createdAt: 1698765433000,
};

const conflict = resolver.detectConflict(local, remote);

if (conflict) {
  console.log('Conflict detected!');
  console.log('Conflicting fields:', conflict.fieldConflicts);
  console.log('Requires manual resolution:', conflict.requiresManualResolution);
}
```

**Return Type:**
```typescript
interface Conflict {
  id: string;                         // Item ID
  type: ConflictType;                 // Conflict type
  local: GroceryItem;                 // Local version
  remote: GroceryItem;                // Remote version
  fieldConflicts: FieldConflict[];    // Field-level conflicts
  detectedAt: number;                 // Detection timestamp
  requiresManualResolution: boolean;  // Manual resolution needed?
}

interface FieldConflict {
  field: keyof GroceryItem;     // Field name
  localValue: any;              // Local value
  remoteValue: any;             // Remote value
  localTimestamp?: number;      // Local timestamp
  remoteTimestamp?: number;     // Remote timestamp
}
```

#### resolveConflict()

```typescript
resolveConflict(
  conflict: Conflict,
  strategy: ConflictResolutionStrategy
): GroceryItem
```

Resolves a conflict using the specified strategy.

**Parameters:**
- `conflict`: The conflict to resolve
- `strategy`: Resolution strategy to use

**Returns:** Resolved GroceryItem

**Throws:** Error if manual resolution is required but not provided

**Strategies:**
- `'last-write-wins'`: Most recent timestamp wins
- `'field-level-merge'`: Merge fields intelligently
- `'prefer-local'`: Keep all local changes
- `'prefer-remote'`: Keep all remote changes
- `'prefer-gotten'`: Prefer version with gotten=true
- `'manual'`: Requires manual intervention (throws error)

**Example:**
```typescript
const resolved = resolver.resolveConflict(conflict, 'field-level-merge');
console.log('Resolved item:', resolved);
```

#### autoResolve()

```typescript
autoResolve(conflict: Conflict): GroceryItem | null
```

Attempts to automatically resolve a conflict using heuristics.

**Parameters:**
- `conflict`: The conflict to resolve

**Returns:** Resolved GroceryItem if successful, null if manual resolution required

**Auto-Resolution Rules:**
1. Prefer "gotten" state (if one is gotten, use that version)
2. Use last-write-wins if timestamps differ by >5 minutes
3. Use field-level merge if only mergable fields conflict
4. Use higher quantity if both users increased it

**Example:**
```typescript
const resolved = resolver.autoResolve(conflict);

if (resolved) {
  console.log('Auto-resolved:', resolved);
  applyResolution(resolved);
} else {
  console.log('Manual resolution required');
  showConflictDialog(conflict);
}
```

#### mergeFields()

```typescript
mergeFields(local: GroceryItem, remote: GroceryItem): GroceryItem
```

Intelligently merges non-conflicting fields from both versions.

**Parameters:**
- `local`: Local version
- `remote`: Remote version

**Returns:** Merged GroceryItem

**Merge Strategy:**
- `gotten`: Always prefer `true` (someone got the item)
- `quantity`: Use higher value (someone needed more)
- `notes`: Concatenate with " | " separator
- Other fields: Use most recent based on timestamp

**Example:**
```typescript
const merged = resolver.mergeFields(local, remote);
console.log('Merged item:', merged);
```

---

## React Hooks

### useOfflineQueue()

React hook for accessing the offline queue.

```typescript
function useOfflineQueue(config?: OfflineQueueConfig): UseOfflineQueueReturn
```

**Parameters:**
- `config` (optional): Queue configuration

**Returns:** Object with queue status and control functions

**Example:**
```typescript
import { useOfflineQueue } from './utils/offlineQueue';

function MyComponent() {
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
  } = useOfflineQueue();

  return (
    <div>
      <p>Pending: {pendingCount}</p>
      <p>Failed: {failedCount}</p>

      {isProcessing && <p>Syncing...</p>}

      {failedCount > 0 && (
        <button onClick={retryFailed}>
          Retry Failed ({failedCount})
        </button>
      )}

      <button onClick={clearQueue}>
        Clear Queue
      </button>
    </div>
  );
}
```

**Return Type:**
```typescript
interface UseOfflineQueueReturn {
  // Status
  queueStatus: QueueStatus;
  pendingCount: number;
  failedCount: number;
  successCount: number;
  totalCount: number;
  isProcessing: boolean;
  lastProcessed?: number;
  lastUpdate: number;

  // Actions
  retryFailed: () => Promise<void>;
  clearQueue: () => void;
  processQueue: () => Promise<void>;
  addMutation: (mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => void;
  removeMutation: (mutationId: string) => void;
  getQueuedMutations: () => QueuedMutation[];

  // Direct access
  queueManager: OfflineQueueManager;
}
```

### useGroceryItems()

Hook for querying and mutating grocery items (from zero-store).

```typescript
function useGroceryItems(listId: string): UseGroceryItemsReturn
```

**Parameters:**
- `listId`: ID of the list to query

**Returns:** Object with items and mutation functions

**Example:**
```typescript
import { useGroceryItems } from './hooks/useGroceryItems';

function GroceryList({ listId }: { listId: string }) {
  const { items, addItem, updateItem, deleteItem, markGotten } = useGroceryItems(listId);

  const handleAdd = async () => {
    await addItem({
      name: 'Milk',
      quantity: 2,
      category: 'Dairy',
      notes: 'Organic',
    });
  };

  return (
    <div>
      <button onClick={handleAdd}>Add Item</button>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.name} ({item.quantity})
            <button onClick={() => markGotten(item.id, !item.gotten)}>
              {item.gotten ? 'Undo' : 'Mark Gotten'}
            </button>
            <button onClick={() => deleteItem(item.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## TypeScript Interfaces

### Core Types

#### QueuedMutation

```typescript
interface QueuedMutation {
  id: string;                    // Unique mutation ID
  type: MutationType;            // Mutation type
  payload: any;                  // Mutation data
  timestamp: number;             // Creation time
  retryCount: number;            // Retry attempts
  status: MutationStatus;        // Current status
  error?: string;                // Error message
  priority?: number;             // Queue priority
}

type MutationType = 'add' | 'update' | 'delete' | 'markGotten';
type MutationStatus = 'pending' | 'processing' | 'failed' | 'success';
```

#### Conflict

```typescript
interface Conflict {
  id: string;                         // Item ID
  type: ConflictType;                 // Conflict type
  local: GroceryItem;                 // Local version
  remote: GroceryItem;                // Remote version
  fieldConflicts: FieldConflict[];    // Field conflicts
  detectedAt: number;                 // Detection time
  requiresManualResolution: boolean;  // Manual needed?
}

type ConflictType = 'field' | 'delete' | 'concurrent_edit';

interface FieldConflict {
  field: keyof GroceryItem;
  localValue: any;
  remoteValue: any;
  localTimestamp?: number;
  remoteTimestamp?: number;
}
```

#### ConflictResolutionStrategy

```typescript
type ConflictResolutionStrategy =
  | 'last-write-wins'
  | 'field-level-merge'
  | 'prefer-local'
  | 'prefer-remote'
  | 'prefer-gotten'
  | 'manual';
```

#### GroceryItem

```typescript
interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  gotten: boolean;
  category: Category;
  notes: string;
  userId: string;
  listId: string;
  createdAt: number;
}

type Category =
  | 'Produce'
  | 'Dairy'
  | 'Meat'
  | 'Bakery'
  | 'Pantry'
  | 'Frozen'
  | 'Beverages'
  | 'Other';
```

### Extended Conflict Types

#### Advanced Conflict Types (from conflicts.ts)

```typescript
enum ConflictResolutionStrategy {
  LastWriteWins = 'LAST_WRITE_WINS',
  Manual = 'MANUAL',
  FieldMerge = 'FIELD_MERGE',
  Custom = 'CUSTOM',
}

enum ConflictType {
  UpdateUpdate = 'UPDATE_UPDATE',    // Both modified
  UpdateDelete = 'UPDATE_DELETE',    // Local updated, remote deleted
  DeleteUpdate = 'DELETE_UPDATE',    // Local deleted, remote updated
  CreateCreate = 'CREATE_CREATE',    // Both created with same ID
}

interface ChangeMetadata {
  userId: string;
  userName: string;
  timestamp: number;
  deviceId?: string;
  version?: number;
}

interface Conflict<T = GroceryItem> {
  id: string;
  type: ConflictType;
  entityId: string;
  entityType: string;
  baseVersion: T | null;              // Common ancestor
  localVersion: T | null;
  remoteVersion: T | null;
  localMetadata: ChangeMetadata;
  remoteMetadata: ChangeMetadata;
  fieldChanges: FieldChange[];
  detectedAt: number;
  resolutionStrategy: ConflictResolutionStrategy;
  resolved: boolean;
  resolvedVersion?: T;
  resolvedAt?: number;
  resolvedBy?: string;
  context?: Record<string, any>;
}

interface FieldChange<T = any> {
  field: string;
  baseValue: T;
  localValue: T;
  remoteValue: T;
  hasConflict: boolean;
  resolvedValue?: T;
}
```

#### Sync Status Types

```typescript
enum ConnectionStatus {
  Online = 'ONLINE',
  Offline = 'OFFLINE',
  Connecting = 'CONNECTING',
  Unknown = 'UNKNOWN',
}

enum SyncState {
  Idle = 'IDLE',
  Syncing = 'SYNCING',
  Synced = 'SYNCED',
  Failed = 'FAILED',
  Conflicts = 'CONFLICTS',
}

interface SyncStatus {
  connectionStatus: ConnectionStatus;
  syncState: SyncState;
  lastSyncedAt: number | null;
  lastSyncAttempt: number | null;
  pendingChanges: number;
  unresolvedConflicts: number;
  syncProgress: number;
  errorMessage?: string;
  autoSyncEnabled: boolean;
  nextSyncAt?: number;
}
```

---

## Helper Functions

### createAddItemMutation()

```typescript
function createAddItemMutation(
  item: Omit<GroceryItem, 'id' | 'gotten' | 'createdAt'> & { id: string }
): Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount' | 'status'>
```

Creates a mutation object for adding an item.

**Example:**
```typescript
import { createAddItemMutation } from './utils/offlineQueue';
import { nanoid } from 'nanoid';

const mutation = createAddItemMutation({
  id: nanoid(),
  name: 'Milk',
  quantity: 2,
  category: 'Dairy',
  notes: 'Organic',
  userId: 'user-123',
  listId: 'list-456',
});

queueManager.addToQueue({
  ...mutation,
  id: nanoid(),
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
});
```

### createUpdateItemMutation()

```typescript
function createUpdateItemMutation(
  id: string,
  updates: Partial<Omit<GroceryItem, 'id'>>
): Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount' | 'status'>
```

Creates a mutation object for updating an item.

**Example:**
```typescript
import { createUpdateItemMutation } from './utils/offlineQueue';

const mutation = createUpdateItemMutation('item-123', {
  quantity: 3,
  notes: 'Low fat',
});

queueManager.addToQueue({
  ...mutation,
  id: nanoid(),
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
});
```

### createMarkGottenMutation()

```typescript
function createMarkGottenMutation(
  id: string,
  gotten: boolean
): Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount' | 'status'>
```

Creates a mutation object for marking an item as gotten/not gotten.

**Example:**
```typescript
import { createMarkGottenMutation } from './utils/offlineQueue';

const mutation = createMarkGottenMutation('item-123', true);

queueManager.addToQueue({
  ...mutation,
  id: nanoid(),
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
});
```

### createDeleteItemMutation()

```typescript
function createDeleteItemMutation(
  id: string
): Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount' | 'status'>
```

Creates a mutation object for deleting an item.

**Example:**
```typescript
import { createDeleteItemMutation } from './utils/offlineQueue';

const mutation = createDeleteItemMutation('item-123');

queueManager.addToQueue({
  ...mutation,
  id: nanoid(),
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
});
```

### getQueueManager()

```typescript
function getQueueManager(config?: OfflineQueueConfig): OfflineQueueManager
```

Returns the singleton queue manager instance.

**Example:**
```typescript
import { getQueueManager } from './utils/offlineQueue';

const queueManager = getQueueManager({
  maxRetries: 5,
  baseDelay: 1000,
});

// Subsequent calls return the same instance
const sameInstance = getQueueManager();
console.log(queueManager === sameInstance); // true
```

### createConflictResolver()

```typescript
function createConflictResolver(): ConflictResolver
```

Creates a new ConflictResolver instance.

**Example:**
```typescript
import { createConflictResolver } from './utils/conflictResolver';

const resolver = createConflictResolver();
const conflict = resolver.detectConflict(local, remote);
```

### compareTimestamps()

```typescript
function compareTimestamps(t1: number, t2: number): number
```

Compares two timestamps.

**Returns:**
- Positive number if t1 > t2
- Negative number if t1 < t2
- Zero if equal

**Example:**
```typescript
import { compareTimestamps } from './utils/conflictResolver';

const result = compareTimestamps(1698765432000, 1698765433000);
console.log(result); // -1000 (t1 is older)
```

### hasConflict()

```typescript
function hasConflict(local: any, remote: any): boolean
```

Checks if two values represent a conflict.

**Returns:** true if values conflict, false otherwise

**Example:**
```typescript
import { hasConflict } from './utils/conflictResolver';

console.log(hasConflict('apple', 'orange')); // true
console.log(hasConflict('apple', 'apple'));  // false
console.log(hasConflict(null, undefined));   // false
console.log(hasConflict('', null));          // false
```

### logConflict()

```typescript
function logConflict(conflict: Conflict): void
```

Logs conflict information to console for debugging.

**Example:**
```typescript
import { logConflict } from './utils/conflictResolver';

const conflict = resolver.detectConflict(local, remote);
logConflict(conflict);
// Outputs formatted conflict details to console
```

---

## Usage Examples

### Example 1: Basic Offline Queue Usage

```typescript
import { useOfflineQueue, createAddItemMutation } from './utils/offlineQueue';
import { nanoid } from 'nanoid';

function AddItemOffline() {
  const { addMutation, pendingCount } = useOfflineQueue();
  const isOnline = navigator.onLine;

  const handleAddItem = () => {
    const mutation = createAddItemMutation({
      id: nanoid(),
      name: 'Milk',
      quantity: 2,
      category: 'Dairy',
      notes: 'Organic',
      userId: 'user-123',
      listId: 'list-456',
    });

    if (!isOnline) {
      // Queue for later when online
      addMutation(mutation);
    } else {
      // Direct sync when online
      zero.mutate.grocery_items.create(mutation.payload);
    }
  };

  return (
    <div>
      <button onClick={handleAddItem}>Add Item</button>
      {pendingCount > 0 && (
        <span>({pendingCount} queued)</span>
      )}
    </div>
  );
}
```

### Example 2: Conflict Detection and Resolution

```typescript
import { ConflictResolver } from './utils/conflictResolver';
import { GroceryItem } from './types';

async function syncItemWithConflictResolution(
  localItem: GroceryItem,
  remoteItem: GroceryItem
) {
  const resolver = new ConflictResolver();

  // Detect conflict
  const conflict = resolver.detectConflict(localItem, remoteItem);

  if (!conflict) {
    // No conflict, use remote version
    return remoteItem;
  }

  // Try auto-resolution
  const resolved = resolver.autoResolve(conflict);

  if (resolved) {
    console.log('Auto-resolved conflict');
    return resolved;
  }

  // Manual resolution required
  console.log('Manual resolution needed');
  const userChoice = await showConflictDialog(conflict);

  switch (userChoice.strategy) {
    case 'keep-local':
      return conflict.local;
    case 'keep-remote':
      return conflict.remote;
    case 'merge':
      return resolver.mergeFields(conflict.local, conflict.remote);
    case 'custom':
      return userChoice.customVersion;
  }
}
```

### Example 3: Custom Queue Processing

```typescript
import { getQueueManager } from './utils/offlineQueue';

const queueManager = getQueueManager({
  maxRetries: 3,
  baseDelay: 2000,
  onQueueProcessed: (results) => {
    if (results.failedCount > 0) {
      notifyUser(`${results.failedCount} items failed to sync`);
    } else {
      notifyUser(`All ${results.successCount} items synced successfully`);
    }
  },
  onMutationFailed: (mutation, error) => {
    console.error('Mutation failed:', mutation.type, error.message);

    if (mutation.retryCount >= 3) {
      // Max retries reached, notify user
      notifyUser(`Failed to sync ${mutation.payload.name} after 3 attempts`);
    }
  },
});

// Manual processing trigger
document.getElementById('sync-btn')?.addEventListener('click', async () => {
  const result = await queueManager.processQueue();
  console.log('Sync complete:', result);
});
```

### Example 4: SyncStatus Component Integration

```typescript
import { useOfflineQueue } from './utils/offlineQueue';
import { SyncStatus } from './components/SyncStatus';

function App() {
  const {
    pendingCount,
    isProcessing,
    lastProcessed,
    processQueue,
  } = useOfflineQueue();

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue(); // Auto-sync when coming online
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processQueue]);

  return (
    <div>
      <SyncStatus
        isOnline={isOnline}
        isSyncing={isProcessing}
        queuedCount={pendingCount}
        lastSyncTime={lastProcessed ? new Date(lastProcessed) : null}
        onRetrySync={processQueue}
      />

      {/* Rest of app */}
    </div>
  );
}
```

### Example 5: Field-Level Merge with Custom Logic

```typescript
import { ConflictResolver } from './utils/conflictResolver';

const resolver = new ConflictResolver();

// Extend with custom merge logic
class CustomConflictResolver extends ConflictResolver {
  mergeFields(local: GroceryItem, remote: GroceryItem): GroceryItem {
    const merged = super.mergeFields(local, remote);

    // Custom logic: If both users changed category, use local
    if (local.category !== remote.category) {
      merged.category = local.category;
    }

    // Custom logic: Merge notes with timestamps
    if (local.notes !== remote.notes) {
      merged.notes = [
        `Local (${new Date(local.createdAt).toLocaleString()}): ${local.notes}`,
        `Remote (${new Date(remote.createdAt).toLocaleString()}): ${remote.notes}`,
      ].join('\n');
    }

    return merged;
  }
}

const customResolver = new CustomConflictResolver();
```

### Example 6: Batch Queue Operations

```typescript
import { getQueueManager, createAddItemMutation } from './utils/offlineQueue';
import { nanoid } from 'nanoid';

async function addMultipleItemsOffline(items: Array<{
  name: string;
  quantity: number;
  category: Category;
}>) {
  const queueManager = getQueueManager();

  // Queue all items
  items.forEach(item => {
    const mutation = createAddItemMutation({
      id: nanoid(),
      ...item,
      notes: '',
      userId: 'user-123',
      listId: 'list-456',
    });

    queueManager.addToQueue({
      ...mutation,
      id: nanoid(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    });
  });

  console.log(`Queued ${items.length} items`);

  // Process when online
  if (navigator.onLine) {
    const result = await queueManager.processQueue();
    console.log(`Synced ${result.successCount}/${items.length} items`);
  }
}
```

---

## Error Handling

### Common Errors

#### NetworkError

```typescript
try {
  await queueManager.processQueue();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    // Will retry automatically with exponential backoff
  }
}
```

#### QuotaExceededError

```typescript
try {
  queueManager.addToQueue(mutation);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.error('Storage quota exceeded');

    // Clean up old entries
    queueManager.clearQueue();

    // Notify user
    alert('Storage full. Some offline changes were cleared.');
  }
}
```

#### ConflictError

```typescript
try {
  const resolved = resolver.autoResolve(conflict);
  if (!resolved) {
    throw new Error('Manual resolution required');
  }
} catch (error) {
  console.log('Conflict requires manual resolution');
  showConflictDialog(conflict);
}
```

---

## Best Practices

1. **Always check online status before queuing:**
   ```typescript
   if (!navigator.onLine) {
     queueManager.addToQueue(mutation);
   } else {
     await directSync(mutation);
   }
   ```

2. **Use helper functions for creating mutations:**
   ```typescript
   const mutation = createAddItemMutation(item); // ✓ Good
   // vs
   const mutation = { type: 'add', payload: { ... } }; // ✗ Bad
   ```

3. **Handle callback errors gracefully:**
   ```typescript
   const queueManager = new OfflineQueueManager({
     onMutationFailed: (mutation, error) => {
       try {
         logError(mutation, error);
       } catch (e) {
         // Don't let callback errors break queue processing
         console.error('Error in callback:', e);
       }
     },
   });
   ```

4. **Clean up successful mutations:**
   ```typescript
   // Automatic cleanup after successful sync
   queue = queue.filter(m => m.status !== 'success');
   ```

5. **Monitor queue size:**
   ```typescript
   const status = queueManager.getStatus();
   if (status.total > 100) {
     console.warn('Queue getting large:', status.total);
   }
   ```

---

## See Also

- [User Guide](../OFFLINE_CONFLICT_RESOLUTION_GUIDE.md)
- [Architecture Documentation](./OFFLINE_ARCHITECTURE.md)
- [Best Practices](./OFFLINE_BEST_PRACTICES.md)
- [Zero Documentation](https://zero.rocicorp.dev)

---

**Version:** 1.0.0
**Last Updated:** October 2025
