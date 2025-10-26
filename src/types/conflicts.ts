/**
 * Conflict resolution types for offline-first synchronization
 *
 * This module provides comprehensive types for handling conflicts that arise
 * when multiple users edit the same data while offline, and those changes
 * need to be reconciled when they come back online.
 */

import { GroceryItem } from '../types';

// ============================================================================
// Conflict Resolution Strategies
// ============================================================================

/**
 * Available strategies for resolving conflicts between local and remote versions
 *
 * - LastWriteWins: The most recent timestamp wins (simplest but may lose data)
 * - Manual: User must manually choose which version to keep
 * - FieldMerge: Intelligently merge changes field-by-field
 * - Custom: Application-specific resolution logic
 */
export enum ConflictResolutionStrategy {
  LastWriteWins = 'LAST_WRITE_WINS',
  Manual = 'MANUAL',
  FieldMerge = 'FIELD_MERGE',
  Custom = 'CUSTOM',
}

/**
 * Configuration for conflict resolution behavior
 */
export interface ConflictResolutionConfig {
  /** Default strategy to use when conflicts are detected */
  defaultStrategy: ConflictResolutionStrategy;

  /** Whether to automatically resolve conflicts when possible */
  autoResolve: boolean;

  /** Maximum number of conflicts to keep in history */
  maxConflictHistory: number;

  /** Whether to notify user of conflict resolutions */
  notifyOnResolution: boolean;

  /** Field-specific resolution strategies */
  fieldStrategies?: Record<string, ConflictResolutionStrategy>;
}

// ============================================================================
// Conflict Types
// ============================================================================

/**
 * Represents the type of conflict detected
 */
export enum ConflictType {
  /** Both local and remote modified the same item */
  UpdateUpdate = 'UPDATE_UPDATE',

  /** Local updated while remote deleted */
  UpdateDelete = 'UPDATE_DELETE',

  /** Local deleted while remote updated */
  DeleteUpdate = 'DELETE_UPDATE',

  /** Both created items with same ID (rare) */
  CreateCreate = 'CREATE_CREATE',
}

/**
 * Represents a field-level change in a conflict
 */
export interface FieldChange<T = any> {
  /** Name of the field that changed */
  field: string;

  /** Original value (from common ancestor) */
  baseValue: T;

  /** Local version value */
  localValue: T;

  /** Remote version value */
  remoteValue: T;

  /** Whether this field has a conflict */
  hasConflict: boolean;

  /** Resolved value (if resolution has been applied) */
  resolvedValue?: T;
}

/**
 * Metadata about when and how a change was made
 */
export interface ChangeMetadata {
  /** User who made the change */
  userId: string;

  /** Display name of user who made the change */
  userName: string;

  /** Timestamp when change was made (Unix timestamp in ms) */
  timestamp: number;

  /** Device/client identifier where change originated */
  deviceId?: string;

  /** Version number for optimistic concurrency control */
  version?: number;
}

/**
 * Represents a detected conflict between local and remote versions
 */
export interface Conflict<T = GroceryItem> {
  /** Unique identifier for this conflict */
  id: string;

  /** Type of conflict */
  type: ConflictType;

  /** ID of the entity in conflict */
  entityId: string;

  /** Type of entity (e.g., 'grocery_item', 'list') */
  entityType: string;

  /** Base version (common ancestor) - null if both created */
  baseVersion: T | null;

  /** Local version of the entity */
  localVersion: T | null;

  /** Remote version of the entity */
  remoteVersion: T | null;

  /** Metadata about the local change */
  localMetadata: ChangeMetadata;

  /** Metadata about the remote change */
  remoteMetadata: ChangeMetadata;

  /** Field-level changes */
  fieldChanges: FieldChange[];

  /** When this conflict was detected */
  detectedAt: number;

  /** Current resolution strategy being used */
  resolutionStrategy: ConflictResolutionStrategy;

  /** Whether this conflict has been resolved */
  resolved: boolean;

  /** Resolved version (if resolved) */
  resolvedVersion?: T;

  /** When this conflict was resolved */
  resolvedAt?: number;

  /** User who resolved the conflict */
  resolvedBy?: string;

  /** Additional context or notes about the conflict */
  context?: Record<string, any>;
}

/**
 * Type guard to check if a conflict is for a GroceryItem
 */
export function isGroceryItemConflict(conflict: Conflict<any>): conflict is Conflict<GroceryItem> {
  return conflict.entityType === 'grocery_item';
}

/**
 * Type guard to check if a conflict has been resolved
 */
export function isConflictResolved<T>(conflict: Conflict<T>): conflict is Conflict<T> & {
  resolved: true;
  resolvedVersion: T;
  resolvedAt: number;
  resolvedBy: string;
} {
  return conflict.resolved &&
         conflict.resolvedVersion !== undefined &&
         conflict.resolvedAt !== undefined &&
         conflict.resolvedBy !== undefined;
}

// ============================================================================
// Sync Status Types
// ============================================================================

/**
 * Network connection status
 */
export enum ConnectionStatus {
  Online = 'ONLINE',
  Offline = 'OFFLINE',
  Connecting = 'CONNECTING',
  Unknown = 'UNKNOWN',
}

/**
 * Synchronization state
 */
export enum SyncState {
  /** Idle, no sync in progress */
  Idle = 'IDLE',

  /** Currently syncing */
  Syncing = 'SYNCING',

  /** Sync completed successfully */
  Synced = 'SYNCED',

  /** Sync failed */
  Failed = 'FAILED',

  /** Conflicts detected, requires resolution */
  Conflicts = 'CONFLICTS',
}

/**
 * Tracks the overall synchronization status
 */
export interface SyncStatus {
  /** Current connection status */
  connectionStatus: ConnectionStatus;

  /** Current sync state */
  syncState: SyncState;

  /** Last successful sync timestamp */
  lastSyncedAt: number | null;

  /** Last sync attempt timestamp */
  lastSyncAttempt: number | null;

  /** Number of items waiting to be synced */
  pendingChanges: number;

  /** Number of unresolved conflicts */
  unresolvedConflicts: number;

  /** Current sync progress (0-100) */
  syncProgress: number;

  /** Error message if sync failed */
  errorMessage?: string;

  /** Whether auto-sync is enabled */
  autoSyncEnabled: boolean;

  /** Next scheduled sync time */
  nextSyncAt?: number;
}

/**
 * Detailed sync statistics
 */
export interface SyncStatistics {
  /** Total items synced in current session */
  itemsSynced: number;

  /** Total conflicts detected */
  conflictsDetected: number;

  /** Conflicts auto-resolved */
  conflictsAutoResolved: number;

  /** Conflicts requiring manual resolution */
  conflictsManualResolution: number;

  /** Failed sync attempts */
  failedAttempts: number;

  /** Average sync duration in ms */
  averageSyncDuration: number;

  /** Data transferred in bytes */
  bytesTransferred: number;
}

// ============================================================================
// Offline Queue Types
// ============================================================================

/**
 * Type of mutation operation
 */
export enum MutationType {
  Create = 'CREATE',
  Update = 'UPDATE',
  Delete = 'DELETE',
  BulkUpdate = 'BULK_UPDATE',
  BulkDelete = 'BULK_DELETE',
}

/**
 * Status of a queued mutation
 */
export enum QueuedMutationStatus {
  /** Waiting to be synced */
  Pending = 'PENDING',

  /** Currently being synced */
  InProgress = 'IN_PROGRESS',

  /** Successfully synced */
  Completed = 'COMPLETED',

  /** Sync failed, will retry */
  Failed = 'FAILED',

  /** Conflict detected */
  Conflict = 'CONFLICT',
}

/**
 * Represents a mutation that was made offline and needs to be synced
 */
export interface QueuedMutation<T = any> {
  /** Unique identifier for this queued mutation */
  id: string;

  /** Type of mutation */
  type: MutationType;

  /** Entity type being mutated */
  entityType: string;

  /** Entity ID (for update/delete) */
  entityId?: string;

  /** The mutation data/payload */
  data: T;

  /** Previous version (for updates) */
  previousData?: T;

  /** Status of this mutation */
  status: QueuedMutationStatus;

  /** When this mutation was created locally */
  createdAt: number;

  /** When this mutation was last attempted */
  lastAttemptedAt?: number;

  /** Number of retry attempts */
  retryCount: number;

  /** Maximum retry attempts before giving up */
  maxRetries: number;

  /** User who initiated this mutation */
  userId: string;

  /** List ID this mutation belongs to */
  listId?: string;

  /** Error message if failed */
  errorMessage?: string;

  /** Optimistic update applied locally */
  optimistic: boolean;

  /** Dependencies (other mutations that must complete first) */
  dependencies?: string[];

  /** Priority (higher numbers = higher priority) */
  priority: number;
}

/**
 * Configuration for the offline queue
 */
export interface OfflineQueueConfig {
  /** Maximum number of mutations to keep in queue */
  maxQueueSize: number;

  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Base retry delay in ms (will use exponential backoff) */
  retryDelay: number;

  /** Whether to use exponential backoff for retries */
  exponentialBackoff: boolean;

  /** Whether to persist queue to storage */
  persistQueue: boolean;

  /** Batch size for sync operations */
  batchSize: number;
}

/**
 * Represents the offline mutation queue
 */
export interface OfflineQueue {
  /** All queued mutations */
  mutations: QueuedMutation[];

  /** Number of pending mutations */
  pendingCount: number;

  /** Number of failed mutations */
  failedCount: number;

  /** Number of mutations with conflicts */
  conflictCount: number;

  /** Queue configuration */
  config: OfflineQueueConfig;

  /** When queue was last processed */
  lastProcessedAt: number | null;

  /** Whether queue is currently being processed */
  processing: boolean;
}

/**
 * Type guard to check if a queued mutation is pending
 */
export function isPendingMutation(mutation: QueuedMutation): boolean {
  return mutation.status === QueuedMutationStatus.Pending;
}

/**
 * Type guard to check if a queued mutation has failed
 */
export function isFailedMutation(mutation: QueuedMutation): boolean {
  return mutation.status === QueuedMutationStatus.Failed;
}

/**
 * Type guard to check if a queued mutation has a conflict
 */
export function hasConflict(mutation: QueuedMutation): boolean {
  return mutation.status === QueuedMutationStatus.Conflict;
}

// ============================================================================
// Conflict Log Types
// ============================================================================

/**
 * Resolution outcome
 */
export enum ResolutionOutcome {
  /** Accepted local version */
  LocalAccepted = 'LOCAL_ACCEPTED',

  /** Accepted remote version */
  RemoteAccepted = 'REMOTE_ACCEPTED',

  /** Merged both versions */
  Merged = 'MERGED',

  /** Created new version */
  Custom = 'CUSTOM',

  /** Conflict was skipped */
  Skipped = 'SKIPPED',
}

/**
 * Represents a log entry for a resolved conflict
 */
export interface ConflictLogEntry {
  /** Unique identifier for this log entry */
  id: string;

  /** Reference to the original conflict ID */
  conflictId: string;

  /** Type of conflict that was resolved */
  conflictType: ConflictType;

  /** Entity type */
  entityType: string;

  /** Entity ID */
  entityId: string;

  /** Strategy used to resolve */
  resolutionStrategy: ConflictResolutionStrategy;

  /** Outcome of the resolution */
  outcome: ResolutionOutcome;

  /** When the conflict was detected */
  detectedAt: number;

  /** When the conflict was resolved */
  resolvedAt: number;

  /** User who resolved the conflict */
  resolvedBy: string;

  /** Display name of user who resolved */
  resolvedByName: string;

  /** Summary of what was changed */
  changeSummary: string;

  /** Snapshot of local version */
  localSnapshot: any;

  /** Snapshot of remote version */
  remoteSnapshot: any;

  /** Final resolved version */
  resolvedSnapshot: any;

  /** Additional notes or context */
  notes?: string;

  /** Whether resolution was automatic or manual */
  automatic: boolean;
}

/**
 * Audit trail of all conflict resolutions
 */
export interface ConflictLog {
  /** All conflict log entries */
  entries: ConflictLogEntry[];

  /** Total number of conflicts resolved */
  totalResolved: number;

  /** Number of automatically resolved conflicts */
  autoResolved: number;

  /** Number of manually resolved conflicts */
  manualResolved: number;

  /** When log was last updated */
  lastUpdatedAt: number;
}

/**
 * Filters for querying conflict log
 */
export interface ConflictLogFilter {
  /** Filter by entity type */
  entityType?: string;

  /** Filter by resolution strategy */
  resolutionStrategy?: ConflictResolutionStrategy;

  /** Filter by outcome */
  outcome?: ResolutionOutcome;

  /** Filter by user who resolved */
  resolvedBy?: string;

  /** Filter by automatic vs manual */
  automatic?: boolean;

  /** Filter by date range */
  dateRange?: {
    start: number;
    end: number;
  };

  /** Limit number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

// ============================================================================
// Conflict Resolution Actions
// ============================================================================

/**
 * Action to resolve a conflict manually
 */
export interface ResolveConflictAction {
  /** ID of conflict to resolve */
  conflictId: string;

  /** Chosen resolution strategy */
  strategy: ConflictResolutionStrategy;

  /** For manual resolution, the chosen version */
  chosenVersion?: 'local' | 'remote' | 'custom';

  /** For custom resolution, the custom data */
  customResolution?: any;

  /** Optional notes about the resolution */
  notes?: string;
}

/**
 * Result of a conflict resolution attempt
 */
export interface ConflictResolutionResult<T = any> {
  /** Whether resolution was successful */
  success: boolean;

  /** The resolved version */
  resolvedVersion?: T;

  /** Error message if resolution failed */
  error?: string;

  /** Log entry created for this resolution */
  logEntry?: ConflictLogEntry;
}

/**
 * Batch conflict resolution request
 */
export interface BatchConflictResolution {
  /** Conflicts to resolve */
  conflicts: ResolveConflictAction[];

  /** Whether to stop on first error */
  stopOnError: boolean;
}

/**
 * Result of batch conflict resolution
 */
export interface BatchConflictResolutionResult {
  /** Number of conflicts successfully resolved */
  successCount: number;

  /** Number of conflicts that failed to resolve */
  failureCount: number;

  /** Individual results */
  results: ConflictResolutionResult[];

  /** Overall success status */
  success: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract mutable fields from GroceryItem for conflict detection
 */
export type MutableGroceryItemFields = Pick<
  GroceryItem,
  'name' | 'quantity' | 'gotten' | 'category' | 'notes'
>;

/**
 * Field names that can have conflicts in GroceryItem
 */
export type GroceryItemConflictField = keyof MutableGroceryItemFields;

/**
 * Represents a version-controlled entity
 */
export interface Versioned<T> {
  /** The entity data */
  data: T;

  /** Version number for optimistic concurrency */
  version: number;

  /** Last modified timestamp */
  lastModified: number;

  /** User who last modified */
  lastModifiedBy: string;

  /** Device where modification occurred */
  deviceId?: string;
}

/**
 * Options for conflict detection
 */
export interface ConflictDetectionOptions {
  /** Whether to detect field-level conflicts */
  fieldLevel: boolean;

  /** Fields to ignore when detecting conflicts */
  ignoreFields?: string[];

  /** Custom comparison function for specific fields */
  fieldComparators?: Record<string, (a: any, b: any) => boolean>;

  /** Timestamp tolerance in ms (for clock skew) */
  timestampTolerance: number;
}

/**
 * Hook return type for conflict management
 */
export interface ConflictManager {
  /** All detected conflicts */
  conflicts: Conflict[];

  /** Number of unresolved conflicts */
  unresolvedCount: number;

  /** Current sync status */
  syncStatus: SyncStatus;

  /** Offline queue */
  queue: OfflineQueue;

  /** Conflict log */
  log: ConflictLog;

  /** Resolve a conflict */
  resolveConflict: (action: ResolveConflictAction) => Promise<ConflictResolutionResult>;

  /** Resolve multiple conflicts */
  resolveBatch: (action: BatchConflictResolution) => Promise<BatchConflictResolutionResult>;

  /** Get conflicts for a specific entity */
  getConflictsForEntity: (entityType: string, entityId: string) => Conflict[];

  /** Query conflict log */
  queryLog: (filter: ConflictLogFilter) => ConflictLogEntry[];

  /** Clear resolved conflicts */
  clearResolved: () => void;

  /** Force sync */
  forceSync: () => Promise<void>;

  /** Enable/disable auto-sync */
  setAutoSync: (enabled: boolean) => void;
}

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * Storage keys for persisting conflict resolution data
 */
export const CONFLICT_STORAGE_KEYS = {
  CONFLICTS: 'grocery_conflicts',
  QUEUE: 'grocery_offline_queue',
  LOG: 'grocery_conflict_log',
  SYNC_STATUS: 'grocery_sync_status',
  CONFIG: 'grocery_conflict_config',
  LAST_SYNC: 'grocery_last_sync_timestamp',
} as const;

// ============================================================================
// Constants
// ============================================================================

/**
 * Default conflict resolution configuration
 */
export const DEFAULT_CONFLICT_CONFIG: ConflictResolutionConfig = {
  defaultStrategy: ConflictResolutionStrategy.LastWriteWins,
  autoResolve: true,
  maxConflictHistory: 1000,
  notifyOnResolution: true,
  fieldStrategies: {
    gotten: ConflictResolutionStrategy.LastWriteWins,
    quantity: ConflictResolutionStrategy.FieldMerge,
  },
};

/**
 * Default offline queue configuration
 */
export const DEFAULT_QUEUE_CONFIG: OfflineQueueConfig = {
  maxQueueSize: 500,
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  persistQueue: true,
  batchSize: 10,
};

/**
 * Default sync status
 */
export const DEFAULT_SYNC_STATUS: SyncStatus = {
  connectionStatus: ConnectionStatus.Unknown,
  syncState: SyncState.Idle,
  lastSyncedAt: null,
  lastSyncAttempt: null,
  pendingChanges: 0,
  unresolvedConflicts: 0,
  syncProgress: 0,
  autoSyncEnabled: true,
};
