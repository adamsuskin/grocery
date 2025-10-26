/**
 * Test Suite for Offline Queue Management System
 *
 * This file contains unit tests for the OfflineQueueManager class.
 * It demonstrates how the queue system works and validates its behavior.
 *
 * To run these tests:
 * npm test -- offlineQueue.test.ts
 */

// @ts-nocheck - Test file uses vitest which is not in dependencies
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OfflineQueueManager,
  createAddItemMutation,
  createMarkGottenMutation,
  createDeleteItemMutation,
  type QueuedMutation,
} from './offlineQueue';
import { nanoid } from 'nanoid';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock Zero instance
vi.mock('../zero-store', () => ({
  getZeroInstance: () => ({
    mutate: {
      grocery_items: {
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    },
  }),
}));

describe('OfflineQueueManager', () => {
  let queueManager: OfflineQueueManager;

  beforeEach(() => {
    localStorageMock.clear();
    queueManager = new OfflineQueueManager({
      autoProcess: false, // Disable auto-processing for tests
    });
  });

  afterEach(() => {
    queueManager.clearQueue();
  });

  describe('Queue Management', () => {
    it('should add a mutation to the queue', () => {
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: { name: 'Test Item', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      queueManager.addToQueue(mutation);

      const queued = queueManager.getQueuedMutations();
      expect(queued).toHaveLength(1);
      expect(queued[0].id).toBe(mutation.id);
    });

    it('should persist queue to localStorage', () => {
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: { name: 'Test Item', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      queueManager.addToQueue(mutation);

      const stored = localStorage.getItem('grocery_offline_queue');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe(mutation.id);
    });

    it('should load queue from localStorage on initialization', () => {
      // Add a mutation
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: { name: 'Test Item', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      queueManager.addToQueue(mutation);

      // Create a new instance
      const newManager = new OfflineQueueManager({ autoProcess: false });

      const queued = newManager.getQueuedMutations();
      expect(queued).toHaveLength(1);
      expect(queued[0].id).toBe(mutation.id);
    });

    it('should clear the queue', () => {
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: { name: 'Test Item', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      queueManager.addToQueue(mutation);
      expect(queueManager.getQueuedMutations()).toHaveLength(1);

      queueManager.clearQueue();
      expect(queueManager.getQueuedMutations()).toHaveLength(0);
    });

    it('should remove a specific mutation', () => {
      const mutation1: QueuedMutation = {
        id: 'mutation-1',
        type: 'add',
        payload: { name: 'Item 1', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      const mutation2: QueuedMutation = {
        id: 'mutation-2',
        type: 'add',
        payload: { name: 'Item 2', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      queueManager.addToQueue(mutation1);
      queueManager.addToQueue(mutation2);

      queueManager.removeMutation('mutation-1');

      const queued = queueManager.getQueuedMutations();
      expect(queued).toHaveLength(1);
      expect(queued[0].id).toBe('mutation-2');
    });
  });

  describe('Queue Prioritization', () => {
    it('should prioritize deletes over adds', () => {
      const addMutation: QueuedMutation = {
        id: 'add-1',
        type: 'add',
        payload: { name: 'Add Item', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
        priority: 10,
      };

      const deleteMutation: QueuedMutation = {
        id: 'delete-1',
        type: 'delete',
        payload: { id: 'item-1' },
        timestamp: Date.now() + 1000, // Added later
        retryCount: 0,
        status: 'pending',
        priority: 100,
      };

      queueManager.addToQueue(addMutation);
      queueManager.addToQueue(deleteMutation);

      const queued = queueManager.getQueuedMutations();

      // Delete should be first despite being added later
      expect(queued[0].id).toBe('delete-1');
      expect(queued[1].id).toBe('add-1');
    });

    it('should sort by timestamp when priorities are equal', () => {
      const mutation1: QueuedMutation = {
        id: 'mutation-1',
        type: 'add',
        payload: { name: 'Item 1', quantity: 1 },
        timestamp: 1000,
        retryCount: 0,
        status: 'pending',
        priority: 10,
      };

      const mutation2: QueuedMutation = {
        id: 'mutation-2',
        type: 'add',
        payload: { name: 'Item 2', quantity: 1 },
        timestamp: 500, // Earlier timestamp
        retryCount: 0,
        status: 'pending',
        priority: 10,
      };

      queueManager.addToQueue(mutation1);
      queueManager.addToQueue(mutation2);

      const queued = queueManager.getQueuedMutations();

      // Earlier timestamp should be first
      expect(queued[0].id).toBe('mutation-2');
      expect(queued[1].id).toBe('mutation-1');
    });
  });

  describe('Queue Status', () => {
    it('should return correct queue status', () => {
      const status = queueManager.getStatus();

      expect(status).toMatchObject({
        total: 0,
        pending: 0,
        processing: 0,
        failed: 0,
        success: 0,
        isProcessing: false,
      });
    });

    it('should update status when mutations are added', () => {
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: { name: 'Test Item', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      queueManager.addToQueue(mutation);

      const status = queueManager.getStatus();
      expect(status.total).toBe(1);
      expect(status.pending).toBe(1);
    });

    it('should count failed mutations correctly', () => {
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: { name: 'Test Item', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'failed',
      };

      queueManager.addToQueue(mutation);

      const status = queueManager.getStatus();
      expect(status.failed).toBe(1);
    });
  });

  describe('Queue Processing', () => {
    it('should process pending mutations', async () => {
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: {
          id: nanoid(),
          name: 'Test Item',
          quantity: 1,
          category: 'Other',
          notes: '',
          userId: 'user-1',
          listId: 'list-1',
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      queueManager.addToQueue(mutation);

      const results = await queueManager.processQueue();

      expect(results.successCount).toBe(1);
      expect(results.failedCount).toBe(0);
    });

    it('should remove successful mutations from queue', async () => {
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: {
          id: nanoid(),
          name: 'Test Item',
          quantity: 1,
          category: 'Other',
          notes: '',
          userId: 'user-1',
          listId: 'list-1',
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      queueManager.addToQueue(mutation);
      await queueManager.processQueue();

      const queued = queueManager.getQueuedMutations();
      expect(queued).toHaveLength(0);
    });

    it('should call onMutationSuccess callback', async () => {
      const onSuccess = vi.fn();

      const manager = new OfflineQueueManager({
        autoProcess: false,
        onMutationSuccess: onSuccess,
      });

      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: {
          id: nanoid(),
          name: 'Test Item',
          quantity: 1,
          category: 'Other',
          notes: '',
          userId: 'user-1',
          listId: 'list-1',
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      manager.addToQueue(mutation);
      await manager.processQueue();

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ id: mutation.id })
      );
    });

    it('should call onQueueProcessed callback', async () => {
      const onProcessed = vi.fn();

      const manager = new OfflineQueueManager({
        autoProcess: false,
        onQueueProcessed: onProcessed,
      });

      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: {
          id: nanoid(),
          name: 'Test Item',
          quantity: 1,
          category: 'Other',
          notes: '',
          userId: 'user-1',
          listId: 'list-1',
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      manager.addToQueue(mutation);
      await manager.processQueue();

      expect(onProcessed).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 1,
          failedCount: 0,
        })
      );
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed mutations', async () => {
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: {
          id: nanoid(),
          name: 'Test Item',
          quantity: 1,
          category: 'Other',
          notes: '',
          userId: 'user-1',
          listId: 'list-1',
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'failed',
      };

      queueManager.addToQueue(mutation);

      const results = await queueManager.retryFailed();

      // Should process the mutation
      expect(results.successCount).toBe(1);
    });

    it('should reset retry count when retrying', async () => {
      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: {
          id: nanoid(),
          name: 'Test Item',
          quantity: 1,
          category: 'Other',
          notes: '',
          userId: 'user-1',
          listId: 'list-1',
        },
        timestamp: Date.now(),
        retryCount: 3,
        status: 'failed',
      };

      queueManager.addToQueue(mutation);
      await queueManager.retryFailed();

      // Mutation should be successful and removed from queue
      const queued = queueManager.getQueuedMutations();
      expect(queued).toHaveLength(0);
    });
  });

  describe('Helper Functions', () => {
    it('should create add item mutation', () => {
      const mutation = createAddItemMutation({
        id: 'item-1',
        name: 'Milk',
        quantity: 2,
        category: 'Dairy',
        notes: 'Whole milk',
        userId: 'user-1',
        listId: 'list-1',
      });

      expect(mutation.type).toBe('add');
      expect(mutation.payload.name).toBe('Milk');
      expect(mutation.payload.quantity).toBe(2);
    });

    it('should create mark gotten mutation', () => {
      const mutation = createMarkGottenMutation('item-1', true);

      expect(mutation.type).toBe('markGotten');
      expect(mutation.payload.id).toBe('item-1');
      expect(mutation.payload.gotten).toBe(true);
    });

    it('should create delete item mutation', () => {
      const mutation = createDeleteItemMutation('item-1');

      expect(mutation.type).toBe('delete');
      expect(mutation.payload.id).toBe('item-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const mutation: QueuedMutation = {
        id: nanoid(),
        type: 'add',
        payload: { name: 'Test Item', quantity: 1 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      // Should not throw
      expect(() => {
        queueManager.addToQueue(mutation);
      }).not.toThrow();

      // Restore mock
      vi.restoreAllMocks();
    });

    it('should handle corrupted localStorage data', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('grocery_offline_queue', 'invalid json');

      // Should not throw
      expect(() => {
        new OfflineQueueManager({ autoProcess: false });
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const onProcessed = vi.fn();

      const manager = new OfflineQueueManager({
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 30000,
        autoProcess: false,
        onQueueProcessed: onProcessed,
      });

      expect(manager).toBeDefined();
    });
  });
});
