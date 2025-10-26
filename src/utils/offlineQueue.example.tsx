/**
 * Example Usage of the Offline Queue System
 *
 * This file demonstrates how to integrate the offline queue management system
 * into your grocery list application components.
 */

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import {
  useOfflineQueue,
  createAddItemMutation,
  createMarkGottenMutation,
  createDeleteItemMutation,
  OfflineQueueManager,
  type QueuedMutation,
} from './offlineQueue';
import { useGroceryMutations } from '../zero-store';
import type { Category } from '../types';

/**
 * Example 1: Basic Component with Queue Status Display
 *
 * Shows how to display the current queue status and provide manual controls
 */
export function OfflineQueueStatus() {
  const {
    queueStatus,
    pendingCount,
    failedCount,
    isProcessing,
    retryFailed,
    clearQueue,
    processQueue,
  } = useOfflineQueue();

  return (
    <div className="offline-queue-status">
      <h3>Offline Queue</h3>

      {/* Queue statistics */}
      <div className="queue-stats">
        <div className="stat">
          <span className="label">Pending:</span>
          <span className="value">{pendingCount}</span>
        </div>
        <div className="stat">
          <span className="label">Failed:</span>
          <span className="value">{failedCount}</span>
        </div>
        <div className="stat">
          <span className="label">Total:</span>
          <span className="value">{queueStatus.total}</span>
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="processing-indicator">
          <span className="spinner">⏳</span>
          Processing queue...
        </div>
      )}

      {/* Action buttons */}
      <div className="queue-actions">
        <button
          onClick={processQueue}
          disabled={isProcessing || pendingCount === 0}
        >
          Process Queue
        </button>

        {failedCount > 0 && (
          <button onClick={retryFailed} disabled={isProcessing}>
            Retry Failed ({failedCount})
          </button>
        )}

        {queueStatus.total > 0 && (
          <button
            onClick={clearQueue}
            disabled={isProcessing}
            className="danger"
          >
            Clear Queue
          </button>
        )}
      </div>

      {/* Last processed time */}
      {queueStatus.lastProcessed && (
        <div className="last-processed">
          Last processed:{' '}
          {new Date(queueStatus.lastProcessed).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Queue-Aware Item Addition
 *
 * Shows how to queue item additions when offline
 */
export function QueueAwareItemForm() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState<Category>('Other');
  const [notes, setNotes] = useState('');

  const { addItem } = useGroceryMutations();
  const { addMutation, isProcessing } = useOfflineQueue();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemId = nanoid();
    const userId = 'current-user-id'; // Get from auth context
    const listId = 'current-list-id'; // Get from selected list

    if (isOnline) {
      // When online, add directly
      try {
        await addItem(name, quantity, category, notes, listId);
        console.log('Item added successfully');
      } catch (error) {
        console.error('Failed to add item:', error);
        // Fallback to queue if direct addition fails
        addMutation(
          createAddItemMutation({
            id: itemId,
            name,
            quantity,
            category,
            notes,
            userId,
            listId,
          })
        );
      }
    } else {
      // When offline, add to queue
      addMutation(
        createAddItemMutation({
          id: itemId,
          name,
          quantity,
          category,
          notes,
          userId,
          listId,
        })
      );
      console.log('Item queued for sync');
    }

    // Reset form
    setName('');
    setQuantity(1);
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="queue-aware-form">
      {/* Online/Offline indicator */}
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 Online' : '🔴 Offline'}
      </div>

      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Item name"
        required
      />

      <input
        type="number"
        value={quantity}
        onChange={e => setQuantity(parseInt(e.target.value))}
        min={1}
        required
      />

      <select
        value={category}
        onChange={e => setCategory(e.target.value as Category)}
      >
        <option value="Produce">Produce</option>
        <option value="Dairy">Dairy</option>
        <option value="Meat">Meat</option>
        <option value="Bakery">Bakery</option>
        <option value="Pantry">Pantry</option>
        <option value="Frozen">Frozen</option>
        <option value="Beverages">Beverages</option>
        <option value="Other">Other</option>
      </select>

      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes (optional)"
      />

      <button type="submit" disabled={isProcessing}>
        {isOnline ? 'Add Item' : 'Queue Item'}
      </button>
    </form>
  );
}

/**
 * Example 3: Queue Mutation List with Individual Controls
 *
 * Shows how to display individual queued mutations and allow per-mutation actions
 */
export function QueuedMutationsList() {
  const { getQueuedMutations, removeMutation } = useOfflineQueue();
  const [mutations, setMutations] = useState<QueuedMutation[]>([]);

  // Refresh mutations list periodically
  React.useEffect(() => {
    const updateMutations = () => {
      setMutations(getQueuedMutations());
    };

    updateMutations();
    const interval = setInterval(updateMutations, 1000);

    return () => clearInterval(interval);
  }, [getQueuedMutations]);

  const getMutationDescription = (mutation: QueuedMutation): string => {
    switch (mutation.type) {
      case 'add':
        return `Add "${mutation.payload.name}"`;
      case 'update':
        return `Update item ${mutation.payload.id}`;
      case 'markGotten':
        return `Mark item ${mutation.payload.gotten ? 'gotten' : 'not gotten'}`;
      case 'delete':
        return `Delete item ${mutation.payload.id}`;
      default:
        return 'Unknown mutation';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'blue';
      case 'processing':
        return 'yellow';
      case 'failed':
        return 'red';
      case 'success':
        return 'green';
      default:
        return 'gray';
    }
  };

  if (mutations.length === 0) {
    return (
      <div className="empty-queue">
        <p>No queued mutations</p>
      </div>
    );
  }

  return (
    <div className="queued-mutations-list">
      <h3>Queued Mutations</h3>

      <ul className="mutations-list">
        {mutations.map(mutation => (
          <li key={mutation.id} className="mutation-item">
            <div className="mutation-info">
              <span
                className={`status-badge ${getStatusColor(mutation.status)}`}
              >
                {mutation.status}
              </span>
              <span className="description">
                {getMutationDescription(mutation)}
              </span>
              <span className="timestamp">
                {new Date(mutation.timestamp).toLocaleString()}
              </span>
              {mutation.retryCount > 0 && (
                <span className="retry-count">
                  Retry: {mutation.retryCount}
                </span>
              )}
            </div>

            {mutation.error && (
              <div className="error-message">{mutation.error}</div>
            )}

            <button
              onClick={() => removeMutation(mutation.id)}
              className="remove-button"
              title="Remove from queue"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 4: Advanced Queue Manager with Custom Configuration
 *
 * Shows how to create a custom queue manager with specific configuration
 */
export function AdvancedQueueManager() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Create queue manager with custom configuration
  const queueManager = React.useMemo(
    () =>
      new OfflineQueueManager({
        maxRetries: 3,
        baseDelay: 2000, // 2 seconds
        maxDelay: 30000, // 30 seconds
        autoProcess: true,

        onQueueProcessed: results => {
          addLog(
            `Queue processed: ${results.successCount} succeeded, ${results.failedCount} failed`
          );
        },

        onMutationSuccess: mutation => {
          addLog(`Mutation succeeded: ${mutation.type} ${mutation.id}`);
        },

        onMutationFailed: (mutation, error) => {
          addLog(`Mutation failed: ${mutation.type} ${mutation.id} - ${error.message}`);
        },

        onStatusChange: status => {
          addLog(
            `Status changed: ${status.pending} pending, ${status.failed} failed`
          );
        },
      }),
    []
  );

  return (
    <div className="advanced-queue-manager">
      <h3>Advanced Queue Manager</h3>

      <div className="logs-container">
        <h4>Activity Log</h4>
        <div className="logs">
          {logs.map((log, index) => (
            <div key={index} className="log-entry">
              {log}
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => queueManager.processQueue()}>
        Process Queue
      </button>
      <button onClick={() => queueManager.clearQueue()}>Clear Queue</button>
      <button onClick={() => setLogs([])}>Clear Logs</button>
    </div>
  );
}

/**
 * Example 5: Integration with Existing Item Component
 *
 * Shows how to modify an existing item component to use the queue
 */
interface GroceryItemProps {
  id: string;
  name: string;
  gotten: boolean;
  onToggle: (id: string, gotten: boolean) => void;
  onDelete: (id: string) => void;
}

export function QueueAwareGroceryItem({
  id,
  name,
  gotten,
  onToggle,
  onDelete,
}: GroceryItemProps) {
  const { addMutation } = useOfflineQueue();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggle = () => {
    if (isOnline) {
      // When online, toggle directly
      onToggle(id, !gotten);
    } else {
      // When offline, queue the mutation
      addMutation(createMarkGottenMutation(id, !gotten));
    }
  };

  const handleDelete = () => {
    if (isOnline) {
      // When online, delete directly
      onDelete(id);
    } else {
      // When offline, queue the mutation
      addMutation(createDeleteItemMutation(id));
    }
  };

  return (
    <div className={`grocery-item ${gotten ? 'gotten' : ''}`}>
      <input
        type="checkbox"
        checked={gotten}
        onChange={handleToggle}
        disabled={!isOnline}
      />
      <span className="item-name">{name}</span>
      <button onClick={handleDelete} disabled={!isOnline}>
        Delete
      </button>
      {!isOnline && <span className="offline-badge">Queued</span>}
    </div>
  );
}

/**
 * Example 6: Global Offline Indicator
 *
 * Shows how to create a global indicator that shows offline status and queue info
 */
export function GlobalOfflineIndicator() {
  const { pendingCount, failedCount, isProcessing, processQueue } =
    useOfflineQueue();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDetails, setShowDetails] = useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically process queue when coming back online
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processQueue]);

  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null; // Don't show anything when online and queue is empty
  }

  return (
    <div className="global-offline-indicator">
      <div className="indicator-header" onClick={() => setShowDetails(!showDetails)}>
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
        <span className="status-text">
          {isOnline ? 'Online' : 'Offline'}
          {pendingCount > 0 && ` - ${pendingCount} pending`}
          {failedCount > 0 && ` - ${failedCount} failed`}
        </span>
        {isProcessing && <span className="spinner">⏳</span>}
        <button className="toggle-details">
          {showDetails ? '▼' : '▲'}
        </button>
      </div>

      {showDetails && (
        <div className="indicator-details">
          <OfflineQueueStatus />
        </div>
      )}
    </div>
  );
}
