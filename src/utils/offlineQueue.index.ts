/**
 * Offline Queue Management System - Public API
 *
 * This file provides a clean, organized export of all public APIs
 * from the offline queue management system.
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   // Main class
 *   OfflineQueueManager,
 *   getQueueManager,
 *
 *   // React hook
 *   useOfflineQueue,
 *
 *   // Helper functions
 *   createAddItemMutation,
 *   createUpdateItemMutation,
 *   createMarkGottenMutation,
 *   createDeleteItemMutation,
 *
 *   // Types
 *   type QueuedMutation,
 *   type QueueStatus,
 *   type MutationType,
 *   type MutationStatus,
 *   type OfflineQueueConfig,
 *   type ProcessingResult,
 * } from './utils/offlineQueue';
 * ```
 */

// Re-export everything from the main module
export {
  // Classes
  OfflineQueueManager,

  // Functions
  getQueueManager,
  useOfflineQueue,

  // Helper functions
  createAddItemMutation,
  createUpdateItemMutation,
  createMarkGottenMutation,
  createDeleteItemMutation,

  // Types
  type QueuedMutation,
  type MutationType,
  type MutationStatus,
  type OfflineQueueConfig,
  type ProcessingResult,
  type QueueStatus,
} from './offlineQueue';
