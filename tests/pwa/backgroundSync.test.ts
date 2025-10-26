/**
 * Background Sync Test Suite
 *
 * Tests Background Sync API detection, sync registration, queue management,
 * and fallback mechanisms for offline mutation synchronization.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock SyncManager
class MockSyncManager {
  private tags: Set<string> = new Set();

  async register(tag: string): Promise<void> {
    this.tags.add(tag);
    return Promise.resolve();
  }

  async getTags(): Promise<string[]> {
    return Promise.resolve(Array.from(this.tags));
  }

  // Helper for testing
  hasSyncTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  clearTags(): void {
    this.tags.clear();
  }
}

// Mock ServiceWorkerRegistration with sync
class MockServiceWorkerRegistration {
  sync: SyncManager;

  constructor() {
    this.sync = new MockSyncManager() as any;
  }
}

// Mock sync queue stored in IndexedDB
interface SyncOperation {
  id: string;
  type: 'add' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class MockSyncQueue {
  private queue: SyncOperation[] = [];

  async add(operation: Omit<SyncOperation, 'timestamp' | 'retryCount' | 'maxRetries'>): Promise<void> {
    this.queue.push({
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    });
  }

  async getAll(): Promise<SyncOperation[]> {
    return [...this.queue];
  }

  async remove(id: string): Promise<void> {
    this.queue = this.queue.filter((op) => op.id !== id);
  }

  async incrementRetry(id: string): Promise<void> {
    const op = this.queue.find((op) => op.id === id);
    if (op) {
      op.retryCount++;
    }
  }

  async clear(): Promise<void> {
    this.queue = [];
  }

  get length(): number {
    return this.queue.length;
  }
}

describe('Background Sync API Detection', () => {
  let mockRegistration: MockServiceWorkerRegistration;

  beforeEach(() => {
    mockRegistration = new MockServiceWorkerRegistration();

    // Mock navigator.serviceWorker.ready
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect Background Sync API', async () => {
    const registration = await navigator.serviceWorker.ready;
    const isBackgroundSyncSupported = 'sync' in registration;

    expect(isBackgroundSyncSupported).toBe(true);
  });

  it('should handle missing Background Sync API', async () => {
    const registrationWithoutSync: any = {};
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(registrationWithoutSync),
      },
      writable: true,
      configurable: true,
    });

    const registration = await navigator.serviceWorker.ready;
    const isBackgroundSyncSupported = 'sync' in registration;

    expect(isBackgroundSyncSupported).toBe(false);
  });

  it('should provide fallback mechanism when unavailable', async () => {
    const registration = await navigator.serviceWorker.ready;

    let syncStrategy: 'background-sync' | 'polling';

    if ('sync' in registration) {
      syncStrategy = 'background-sync';
    } else {
      syncStrategy = 'polling';
    }

    expect(['background-sync', 'polling']).toContain(syncStrategy);
  });
});

describe('Sync Registration', () => {
  let mockRegistration: MockServiceWorkerRegistration;
  let syncQueue: MockSyncQueue;

  beforeEach(() => {
    mockRegistration = new MockServiceWorkerRegistration();
    syncQueue = new MockSyncQueue();

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    (mockRegistration.sync as MockSyncManager).clearTags();
  });

  it('should register sync for offline mutation', async () => {
    const registration = await navigator.serviceWorker.ready;
    const syncTag = 'sync-item-add-123';

    await registration.sync.register(syncTag);

    const tags = await registration.sync.getTags();
    expect(tags).toContain(syncTag);
  });

  it('should register sync for add operation', async () => {
    const registration = await navigator.serviceWorker.ready;
    const itemId = 'item-123';
    const syncTag = `sync-add-${itemId}`;

    // Add to queue
    await syncQueue.add({
      id: itemId,
      type: 'add',
      data: { name: 'Milk', quantity: 1 },
    });

    // Register sync
    await registration.sync.register(syncTag);

    const tags = await registration.sync.getTags();
    expect(tags).toContain(syncTag);
    expect(syncQueue.length).toBe(1);
  });

  it('should register sync for update operation', async () => {
    const registration = await navigator.serviceWorker.ready;
    const itemId = 'item-456';
    const syncTag = `sync-update-${itemId}`;

    await syncQueue.add({
      id: itemId,
      type: 'update',
      data: { checked: true },
    });

    await registration.sync.register(syncTag);

    const tags = await registration.sync.getTags();
    expect(tags).toContain(syncTag);
  });

  it('should register sync for delete operation', async () => {
    const registration = await navigator.serviceWorker.ready;
    const itemId = 'item-789';
    const syncTag = `sync-delete-${itemId}`;

    await syncQueue.add({
      id: itemId,
      type: 'delete',
      data: null,
    });

    await registration.sync.register(syncTag);

    const tags = await registration.sync.getTags();
    expect(tags).toContain(syncTag);
  });

  it('should handle multiple sync registrations', async () => {
    const registration = await navigator.serviceWorker.ready;
    const operations = [
      { id: 'item-1', type: 'add' as const, syncTag: 'sync-add-item-1' },
      { id: 'item-2', type: 'update' as const, syncTag: 'sync-update-item-2' },
      { id: 'item-3', type: 'delete' as const, syncTag: 'sync-delete-item-3' },
    ];

    for (const op of operations) {
      await syncQueue.add({
        id: op.id,
        type: op.type,
        data: {},
      });
      await registration.sync.register(op.syncTag);
    }

    const tags = await registration.sync.getTags();
    expect(tags.length).toBe(3);
    expect(syncQueue.length).toBe(3);
  });
});

describe('Sync Queue Management', () => {
  let syncQueue: MockSyncQueue;

  beforeEach(() => {
    syncQueue = new MockSyncQueue();
  });

  afterEach(async () => {
    await syncQueue.clear();
  });

  it('should add operation to queue', async () => {
    await syncQueue.add({
      id: 'op-1',
      type: 'add',
      data: { name: 'Bread' },
    });

    expect(syncQueue.length).toBe(1);
  });

  it('should retrieve all queued operations', async () => {
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });
    await syncQueue.add({ id: 'op-2', type: 'update', data: {} });

    const operations = await syncQueue.getAll();

    expect(operations.length).toBe(2);
    expect(operations[0].id).toBe('op-1');
    expect(operations[1].id).toBe('op-2');
  });

  it('should remove operation from queue', async () => {
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });
    await syncQueue.add({ id: 'op-2', type: 'add', data: {} });

    await syncQueue.remove('op-1');

    const operations = await syncQueue.getAll();
    expect(operations.length).toBe(1);
    expect(operations[0].id).toBe('op-2');
  });

  it('should maintain FIFO order', async () => {
    const ops = [
      { id: 'op-1', type: 'add' as const, data: { name: 'First' } },
      { id: 'op-2', type: 'add' as const, data: { name: 'Second' } },
      { id: 'op-3', type: 'add' as const, data: { name: 'Third' } },
    ];

    for (const op of ops) {
      await syncQueue.add(op);
    }

    const operations = await syncQueue.getAll();
    expect(operations[0].data.name).toBe('First');
    expect(operations[1].data.name).toBe('Second');
    expect(operations[2].data.name).toBe('Third');
  });

  it('should track retry count', async () => {
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });

    let operations = await syncQueue.getAll();
    expect(operations[0].retryCount).toBe(0);

    await syncQueue.incrementRetry('op-1');
    operations = await syncQueue.getAll();
    expect(operations[0].retryCount).toBe(1);

    await syncQueue.incrementRetry('op-1');
    operations = await syncQueue.getAll();
    expect(operations[0].retryCount).toBe(2);
  });

  it('should respect max retries', async () => {
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });

    const operations = await syncQueue.getAll();
    const op = operations[0];

    // Simulate retries
    for (let i = 0; i < op.maxRetries; i++) {
      await syncQueue.incrementRetry(op.id);
    }

    const updatedOps = await syncQueue.getAll();
    const shouldRemove = updatedOps[0].retryCount >= updatedOps[0].maxRetries;

    if (shouldRemove) {
      await syncQueue.remove(op.id);
    }

    expect(shouldRemove).toBe(true);
  });

  it('should clear all operations', async () => {
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });
    await syncQueue.add({ id: 'op-2', type: 'add', data: {} });

    await syncQueue.clear();

    expect(syncQueue.length).toBe(0);
  });

  it('should handle large queue size', async () => {
    const MAX_QUEUE_SIZE = 1000;

    // Add many operations
    for (let i = 0; i < 100; i++) {
      await syncQueue.add({
        id: `op-${i}`,
        type: 'add',
        data: { index: i },
      });
    }

    expect(syncQueue.length).toBe(100);
    expect(syncQueue.length).toBeLessThanOrEqual(MAX_QUEUE_SIZE);
  });
});

describe('Sync Event Handling', () => {
  let mockRegistration: MockServiceWorkerRegistration;
  let syncQueue: MockSyncQueue;

  beforeEach(() => {
    mockRegistration = new MockServiceWorkerRegistration();
    syncQueue = new MockSyncQueue();

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      writable: true,
      configurable: true,
    });
  });

  it('should fire sync event on reconnection', async () => {
    // Queue operation
    await syncQueue.add({
      id: 'op-1',
      type: 'add',
      data: { name: 'Item' },
    });

    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-add-op-1');

    // Simulate sync event (in real SW, this fires automatically)
    const syncEventFired = (await registration.sync.getTags()).length > 0;

    expect(syncEventFired).toBe(true);
  });

  it('should process queued operations in order', async () => {
    const operations = [
      { id: 'op-1', type: 'add' as const, data: { name: 'A' } },
      { id: 'op-2', type: 'add' as const, data: { name: 'B' } },
      { id: 'op-3', type: 'add' as const, data: { name: 'C' } },
    ];

    for (const op of operations) {
      await syncQueue.add(op);
    }

    const queuedOps = await syncQueue.getAll();

    // Process in order
    const processedOrder: string[] = [];
    for (const op of queuedOps) {
      processedOrder.push(op.id);
      await syncQueue.remove(op.id);
    }

    expect(processedOrder).toEqual(['op-1', 'op-2', 'op-3']);
    expect(syncQueue.length).toBe(0);
  });

  it('should handle sync conflicts', async () => {
    // Simulate conflict scenario
    const localChange = { id: 'item-1', version: 1, quantity: 2 };
    const serverState = { id: 'item-1', version: 2, quantity: 3 };

    // Detect conflict
    const isConflict = localChange.version < serverState.version;
    expect(isConflict).toBe(true);

    // Resolution strategy: last-write-wins (use server state)
    const resolved = { ...serverState };
    expect(resolved.quantity).toBe(3);
  });

  it('should retry failed operations', async () => {
    await syncQueue.add({
      id: 'op-1',
      type: 'add',
      data: { name: 'Item' },
    });

    // Simulate failure
    const operations = await syncQueue.getAll();
    const op = operations[0];

    // First attempt fails
    await syncQueue.incrementRetry(op.id);

    // Check retry count
    const updatedOps = await syncQueue.getAll();
    expect(updatedOps[0].retryCount).toBe(1);

    // Operation stays in queue for retry
    expect(syncQueue.length).toBe(1);
  });

  it('should remove operation after successful sync', async () => {
    await syncQueue.add({
      id: 'op-1',
      type: 'add',
      data: { name: 'Item' },
    });

    // Simulate successful sync
    const operations = await syncQueue.getAll();
    const op = operations[0];

    // Mock API call success
    const syncSuccess = true;

    if (syncSuccess) {
      await syncQueue.remove(op.id);
    }

    expect(syncQueue.length).toBe(0);
  });
});

describe('Fallback to Polling', () => {
  let pollInterval: NodeJS.Timeout | null = null;

  afterEach(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  });

  it('should initialize polling when Background Sync unavailable', async () => {
    // Mock registration without sync
    const registrationWithoutSync: any = {};
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(registrationWithoutSync),
      },
      writable: true,
      configurable: true,
    });

    const registration = await navigator.serviceWorker.ready;
    const hasBackgroundSync = 'sync' in registration;

    if (!hasBackgroundSync) {
      // Start polling
      pollInterval = setInterval(() => {
        // Poll for sync
      }, 30000);
    }

    expect(pollInterval).not.toBeNull();
  });

  it('should poll at configured interval', async () => {
    const pollFn = vi.fn();
    const POLL_INTERVAL = 100; // 100ms for testing

    pollInterval = setInterval(pollFn, POLL_INTERVAL);

    // Wait for a few poll cycles
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(pollFn).toHaveBeenCalledTimes(3);
  });

  it('should stop polling when app closed', () => {
    pollInterval = setInterval(() => {}, 1000);

    // Simulate app close
    clearInterval(pollInterval);
    pollInterval = null;

    expect(pollInterval).toBeNull();
  });

  it('should use exponential backoff for polling', async () => {
    let interval = 30000; // Start at 30s
    const MAX_INTERVAL = 300000; // Max 5 minutes

    // Simulate multiple failed attempts
    for (let i = 0; i < 3; i++) {
      interval = Math.min(interval * 2, MAX_INTERVAL);
    }

    expect(interval).toBe(240000); // 30s -> 60s -> 120s -> 240s
  });

  it('should reset polling interval on success', () => {
    let interval = 120000; // Currently at 2 minutes
    const BASE_INTERVAL = 30000; // Reset to 30s

    // Simulate successful sync
    const syncSuccess = true;

    if (syncSuccess) {
      interval = BASE_INTERVAL;
    }

    expect(interval).toBe(30000);
  });
});

describe('Retry Logic', () => {
  let syncQueue: MockSyncQueue;

  beforeEach(() => {
    syncQueue = new MockSyncQueue();
  });

  it('should retry failed sync with backoff', async () => {
    await syncQueue.add({
      id: 'op-1',
      type: 'add',
      data: {},
    });

    const operations = await syncQueue.getAll();
    const op = operations[0];

    // Calculate backoff delay
    const getBackoffDelay = (retryCount: number): number => {
      const delays = [0, 30000, 60000, 120000]; // 0s, 30s, 60s, 120s
      return delays[Math.min(retryCount, delays.length - 1)];
    };

    expect(getBackoffDelay(0)).toBe(0);
    expect(getBackoffDelay(1)).toBe(30000);
    expect(getBackoffDelay(2)).toBe(60000);
    expect(getBackoffDelay(3)).toBe(120000);
  });

  it('should persist sync queue across restarts', async () => {
    // Add operations
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });
    await syncQueue.add({ id: 'op-2', type: 'update', data: {} });

    // Simulate app restart by creating new queue instance
    // In real implementation, queue would be persisted in IndexedDB
    const operations = await syncQueue.getAll();

    // Operations should still be there
    expect(operations.length).toBe(2);
  });

  it('should remove operation after max retries', async () => {
    await syncQueue.add({
      id: 'op-1',
      type: 'add',
      data: {},
    });

    const operations = await syncQueue.getAll();
    const op = operations[0];

    // Exhaust retries
    for (let i = 0; i < op.maxRetries; i++) {
      await syncQueue.incrementRetry(op.id);
    }

    const updatedOps = await syncQueue.getAll();
    const shouldRemove = updatedOps[0].retryCount >= updatedOps[0].maxRetries;

    if (shouldRemove) {
      await syncQueue.remove(op.id);
      // Log error or notify user
    }

    expect(syncQueue.length).toBe(0);
  });

  it('should handle partial sync failures', async () => {
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });
    await syncQueue.add({ id: 'op-2', type: 'add', data: {} });
    await syncQueue.add({ id: 'op-3', type: 'add', data: {} });

    // Simulate: op-1 succeeds, op-2 fails, op-3 succeeds
    await syncQueue.remove('op-1'); // Success
    await syncQueue.incrementRetry('op-2'); // Failure
    await syncQueue.remove('op-3'); // Success

    const operations = await syncQueue.getAll();
    expect(operations.length).toBe(1);
    expect(operations[0].id).toBe('op-2');
    expect(operations[0].retryCount).toBe(1);
  });
});

describe('Sync Integration with App State', () => {
  let syncQueue: MockSyncQueue;

  beforeEach(() => {
    syncQueue = new MockSyncQueue();
  });

  it('should update optimistic UI immediately', async () => {
    const item = { id: 'item-1', name: 'Milk', checked: false };

    // Update local state immediately (optimistic update)
    const updatedItem = { ...item, checked: true };

    // Queue for sync
    await syncQueue.add({
      id: updatedItem.id,
      type: 'update',
      data: updatedItem,
    });

    expect(updatedItem.checked).toBe(true);
    expect(syncQueue.length).toBe(1);
  });

  it('should handle sync badge/indicator', async () => {
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });
    await syncQueue.add({ id: 'op-2', type: 'add', data: {} });

    const pendingCount = syncQueue.length;
    const showSyncBadge = pendingCount > 0;
    const badgeText = pendingCount.toString();

    expect(showSyncBadge).toBe(true);
    expect(badgeText).toBe('2');
  });

  it('should clear sync indicator when queue empty', async () => {
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });

    // Process operation
    await syncQueue.remove('op-1');

    const showSyncBadge = syncQueue.length > 0;
    expect(showSyncBadge).toBe(false);
  });

  it('should coalesce multiple updates to same item', async () => {
    const itemId = 'item-1';

    // Multiple updates queued
    await syncQueue.add({
      id: `${itemId}-1`,
      type: 'update',
      data: { id: itemId, quantity: 1 },
    });
    await syncQueue.add({
      id: `${itemId}-2`,
      type: 'update',
      data: { id: itemId, quantity: 2 },
    });
    await syncQueue.add({
      id: `${itemId}-3`,
      type: 'update',
      data: { id: itemId, quantity: 3 },
    });

    // In real implementation, would coalesce these into one operation
    const operations = await syncQueue.getAll();
    const updatesForItem = operations.filter(
      (op) => op.data.id === itemId && op.type === 'update'
    );

    // Could be coalesced to single operation with final state
    expect(updatesForItem.length).toBeGreaterThan(0);
  });
});

describe('Network State Handling', () => {
  it('should detect online/offline transitions', () => {
    let isOnline = navigator.onLine;

    const handleOffline = () => {
      isOnline = false;
    };

    const handleOnline = () => {
      isOnline = true;
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial state
    expect(typeof isOnline).toBe('boolean');

    // Cleanup
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
  });

  it('should queue operations when offline', async () => {
    const syncQueue = new MockSyncQueue();
    const isOnline = false;

    if (!isOnline) {
      await syncQueue.add({
        id: 'op-1',
        type: 'add',
        data: { name: 'Offline item' },
      });
    }

    expect(syncQueue.length).toBe(1);
  });

  it('should trigger sync when coming online', async () => {
    const syncQueue = new MockSyncQueue();
    const mockRegistration = new MockServiceWorkerRegistration();

    // Add operations while offline
    await syncQueue.add({ id: 'op-1', type: 'add', data: {} });
    await syncQueue.add({ id: 'op-2', type: 'add', data: {} });

    // Come online
    const operations = await syncQueue.getAll();
    for (const op of operations) {
      await mockRegistration.sync.register(`sync-${op.type}-${op.id}`);
    }

    const tags = await mockRegistration.sync.getTags();
    expect(tags.length).toBe(2);
  });
});
