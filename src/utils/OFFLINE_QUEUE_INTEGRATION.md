# Offline Queue Integration Guide

This guide shows you how to integrate the offline queue system into your grocery list application in just a few steps.

## Step 1: Add Global Offline Indicator

Add a global component that shows offline status and queue information.

**File: `src/components/OfflineIndicator.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { useOfflineQueue } from '../utils/offlineQueue';

export function OfflineIndicator() {
  const {
    pendingCount,
    failedCount,
    isProcessing,
    processQueue,
    retryFailed,
  } = useOfflineQueue();

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-process queue when coming back online
      processQueue();
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

  // Don't show if online and no queued items
  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="font-semibold">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {isProcessing && <span className="text-sm">⏳ Syncing...</span>}
      </div>

      {pendingCount > 0 && (
        <div className="text-sm text-gray-600">
          {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending sync
        </div>
      )}

      {failedCount > 0 && (
        <div className="mt-2">
          <div className="text-sm text-red-600 mb-2">
            ⚠️ {failedCount} change{failedCount !== 1 ? 's' : ''} failed
          </div>
          <button
            onClick={retryFailed}
            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Retry Failed
          </button>
        </div>
      )}
    </div>
  );
}
```

**Add to your App component:**

```typescript
import { OfflineIndicator } from './components/OfflineIndicator';

function App() {
  return (
    <div>
      <OfflineIndicator />
      {/* Rest of your app */}
    </div>
  );
}
```

## Step 2: Update Item Mutations to Use Queue

Modify your existing mutation functions to queue when offline.

**File: `src/hooks/useQueuedMutations.ts`**

```typescript
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { useGroceryMutations } from '../zero-store';
import {
  useOfflineQueue,
  createAddItemMutation,
  createMarkGottenMutation,
  createDeleteItemMutation,
} from '../utils/offlineQueue';

export function useQueuedMutations() {
  const { addItem, markItemGotten, deleteItem } = useGroceryMutations();
  const { addMutation } = useOfflineQueue();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queuedAddItem = async (
    name: string,
    quantity: number,
    category: string,
    notes: string,
    listId?: string
  ) => {
    const userId = 'current-user-id'; // Get from auth context

    if (isOnline) {
      // When online, add directly
      return await addItem(name, quantity, category, notes, listId);
    } else {
      // When offline, queue the mutation
      const itemId = nanoid();
      addMutation(
        createAddItemMutation({
          id: itemId,
          name,
          quantity,
          category,
          notes,
          userId,
          listId: listId || '',
        })
      );
      return itemId;
    }
  };

  const queuedMarkGotten = async (id: string, gotten: boolean) => {
    if (isOnline) {
      return await markItemGotten(id, gotten);
    } else {
      addMutation(createMarkGottenMutation(id, gotten));
    }
  };

  const queuedDeleteItem = async (id: string) => {
    if (isOnline) {
      return await deleteItem(id);
    } else {
      addMutation(createDeleteItemMutation(id));
    }
  };

  return {
    addItem: queuedAddItem,
    markItemGotten: queuedMarkGotten,
    deleteItem: queuedDeleteItem,
    isOnline,
  };
}
```

## Step 3: Update Components to Use Queued Mutations

Replace your existing mutation hooks with the queued versions.

**Before:**

```typescript
import { useGroceryMutations } from '../zero-store';

function MyComponent() {
  const { addItem, markItemGotten, deleteItem } = useGroceryMutations();

  // ... use mutations
}
```

**After:**

```typescript
import { useQueuedMutations } from '../hooks/useQueuedMutations';

function MyComponent() {
  const { addItem, markItemGotten, deleteItem, isOnline } = useQueuedMutations();

  // ... use mutations (same API, but now queued when offline)
}
```

## Step 4: Add Queue Status to Settings/Debug Panel

Show detailed queue information in your settings or debug panel.

**File: `src/components/QueueDebugPanel.tsx`**

```typescript
import React from 'react';
import { useOfflineQueue } from '../utils/offlineQueue';

export function QueueDebugPanel() {
  const {
    queueStatus,
    pendingCount,
    failedCount,
    retryFailed,
    clearQueue,
    processQueue,
    getQueuedMutations,
  } = useOfflineQueue();

  const mutations = getQueuedMutations();

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="text-lg font-bold mb-4">Queue Status</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold">{queueStatus.total}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold">{pendingCount}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Failed</div>
          <div className="text-2xl font-bold text-red-600">{failedCount}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Success</div>
          <div className="text-2xl font-bold text-green-600">
            {queueStatus.success}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={processQueue}
          disabled={queueStatus.isProcessing}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {queueStatus.isProcessing ? 'Processing...' : 'Process Queue'}
        </button>

        {failedCount > 0 && (
          <button
            onClick={retryFailed}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Retry Failed ({failedCount})
          </button>
        )}

        {queueStatus.total > 0 && (
          <button
            onClick={clearQueue}
            className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear Queue
          </button>
        )}
      </div>

      {mutations.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Queued Mutations:</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mutations.map(mutation => (
              <div
                key={mutation.id}
                className="p-2 bg-white rounded text-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{mutation.type}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      mutation.status === 'pending'
                        ? 'bg-blue-100 text-blue-800'
                        : mutation.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : mutation.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {mutation.status}
                  </span>
                </div>
                {mutation.error && (
                  <div className="text-xs text-red-600 mt-1">
                    {mutation.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Step 5: Add Queue Initialization

Initialize the queue when your app starts.

**File: `src/App.tsx` or `src/main.tsx`**

```typescript
import { getQueueManager } from './utils/offlineQueue';

// Initialize queue manager on app startup
const queueManager = getQueueManager({
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 60000,
  autoProcess: true,

  onQueueProcessed: (results) => {
    console.log('Queue processed:', results);
    if (results.successCount > 0) {
      // Show success notification
      console.log(`✅ Synced ${results.successCount} changes`);
    }
    if (results.failedCount > 0) {
      // Show error notification
      console.error(`❌ ${results.failedCount} changes failed to sync`);
    }
  },

  onMutationFailed: (mutation, error) => {
    console.error('Mutation failed:', mutation.type, error.message);
  },
});
```

## Step 6: Add CSS Styles (Optional)

Add some basic styles for the offline indicator.

**File: `src/App.css` or `src/index.css`**

```css
/* Offline Indicator Styles */
.offline-indicator {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  max-width: 20rem;
  z-index: 9999;
}

.offline-indicator.online {
  border-left: 4px solid #10b981;
}

.offline-indicator.offline {
  border-left: 4px solid #ef4444;
}

.status-dot {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-dot.online {
  background-color: #10b981;
}

.status-dot.offline {
  background-color: #ef4444;
}

/* Queue mutations list */
.mutations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mutation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.blue {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-badge.yellow {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.red {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.green {
  background-color: #d1fae5;
  color: #065f46;
}
```

## Step 7: Test the Implementation

1. **Test Offline Mode:**
   - Open DevTools (F12)
   - Go to Network tab
   - Set throttling to "Offline"
   - Try adding/updating/deleting items
   - Check that mutations are queued

2. **Test Online Mode:**
   - Set throttling back to "Online"
   - Watch mutations sync automatically
   - Verify items appear in the list

3. **Test Retry Logic:**
   - Set throttling to "Offline"
   - Queue some mutations
   - Go back online
   - Verify they process automatically

4. **Test Failed Mutations:**
   - Use DevTools to block specific requests
   - Verify failed mutations show in the UI
   - Test the "Retry Failed" button

## Common Integration Issues

### Issue: Mutations not queueing when offline

**Solution:** Make sure you're checking `navigator.onLine` before deciding to queue:

```typescript
const isOnline = navigator.onLine;

if (!isOnline) {
  // Queue the mutation
  addMutation(createAddItemMutation(...));
}
```

### Issue: Queue not processing when coming back online

**Solution:** Add event listeners for online/offline events:

```typescript
useEffect(() => {
  const handleOnline = () => {
    processQueue(); // Process queue when coming back online
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, [processQueue]);
```

### Issue: localStorage quota exceeded

**Solution:** Implement periodic queue cleanup:

```typescript
useEffect(() => {
  const cleanup = setInterval(() => {
    const status = queueManager.getStatus();
    if (status.success > 10) {
      // Clear successful mutations older than 1 hour
      queueManager.clearQueue();
    }
  }, 60000); // Check every minute

  return () => clearInterval(cleanup);
}, []);
```

### Issue: TypeScript errors

**Solution:** Make sure types are properly imported:

```typescript
import type { QueuedMutation, QueueStatus } from '../utils/offlineQueue';
```

## Next Steps

Once you've completed the basic integration:

1. **Add User Feedback:** Show toast notifications for sync events
2. **Implement Analytics:** Track queue metrics and sync success rates
3. **Add Conflict Resolution:** Handle data conflicts when they occur
4. **Optimize Performance:** Batch mutations or implement rate limiting
5. **Add Testing:** Write integration tests for offline scenarios

## Support

For more information, see:
- Full documentation: `OFFLINE_QUEUE_README.md`
- Usage examples: `offlineQueue.example.tsx`
- Test suite: `offlineQueue.test.ts`
