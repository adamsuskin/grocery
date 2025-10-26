# Offline Conflict Resolution - Best Practices

Best practices for developers implementing and maintaining the offline conflict resolution system.

## Table of Contents

- [When to Use Which Resolution Strategy](#when-to-use-which-resolution-strategy)
- [Error Handling Patterns](#error-handling-patterns)
- [Testing Recommendations](#testing-recommendations)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Monitoring and Observability](#monitoring-and-observability)
- [Migration and Deployment](#migration-and-deployment)

---

## When to Use Which Resolution Strategy

### Strategy Selection Guide

#### 1. Last-Write-Wins
**Use when:**
- Fields have no semantic meaning (e.g., UI preferences)
- Latest information is always correct
- Users are unlikely to edit simultaneously
- Performance is critical (fastest strategy)

**Example:**
```typescript
// Settings/preferences - latest always wins
if (field === 'theme' || field === 'language') {
  strategy = 'last-write-wins';
}
```

**Avoid when:**
- Data loss would be significant
- Fields have cumulative meaning (e.g., quantity)
- Multiple users actively edit

#### 2. Field-Level-Merge
**Use when:**
- Different users edit different fields
- Changes can be combined safely
- You want to preserve all user input

**Example:**
```typescript
// Multiple fields changed independently
const conflict = detectConflict(local, remote);
if (conflict.fieldConflicts.length > 1) {
  // Merge each field independently
  strategy = 'field-level-merge';
}
```

**Avoid when:**
- Fields are interdependent
- Business logic requires consistency
- Semantic conflicts exist

#### 3. Prefer-Gotten
**Use when:**
- Marking items as completed/done
- Status changes should persist
- User intent is clear (they got the item)

**Example:**
```typescript
// Shopping list - prefer "gotten" state
if (field === 'gotten' && (local.gotten || remote.gotten)) {
  strategy = 'prefer-gotten';
}
```

**Best for:** E-commerce checkouts, task completion, status updates

#### 4. Prefer-Local / Prefer-Remote
**Use when:**
- One source is authoritative
- Testing/debugging
- User explicitly chose a version

**Example:**
```typescript
// User manually resolved conflict
if (userChoice === 'keep-mine') {
  strategy = 'prefer-local';
}
```

**Avoid in production:** These strategies discard changes, use only when intentional.

#### 5. Manual
**Use when:**
- Critical fields conflict (name, category)
- Semantic meaning prevents auto-resolution
- Business rules require human judgment
- Legal/compliance requirements

**Example:**
```typescript
// Name changes require user input
if (conflict.fieldConflicts.some(fc => fc.field === 'name')) {
  strategy = 'manual';
  showConflictDialog(conflict);
}
```

### Decision Tree

```
Conflict Detected
    │
    ├─ Critical field (name, category)?
    │   └─ YES → Manual
    │
    ├─ "Gotten" state differs?
    │   └─ YES → Prefer-Gotten
    │
    ├─ Multiple non-critical fields?
    │   └─ YES → Field-Level-Merge
    │
    ├─ Timestamp diff > threshold?
    │   └─ YES → Last-Write-Wins
    │
    └─ Default → Manual
```

---

## Error Handling Patterns

### 1. Network Errors

**Pattern: Retry with Exponential Backoff**

```typescript
async function processWithRetry(mutation: QueuedMutation) {
  const maxRetries = 5;
  const baseDelay = 1000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await processMutation(mutation);
      return; // Success
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error; // Don't retry non-network errors
      }

      if (attempt === maxRetries) {
        throw new Error('Max retries exceeded');
      }

      // Exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        60000 // Max 60 seconds
      );

      console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
}

function isNetworkError(error: Error): boolean {
  return (
    error.name === 'NetworkError' ||
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('timeout')
  );
}
```

### 2. Storage Quota Errors

**Pattern: Graceful Degradation with Cleanup**

```typescript
function saveToStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, cleaning up...');

      // Strategy 1: Remove old successful mutations
      cleanupSuccessfulMutations();

      // Strategy 2: Remove old conflict logs
      if (stillExceedsQuota()) {
        cleanupOldConflictLogs();
      }

      // Strategy 3: Clear non-essential data
      if (stillExceedsQuota()) {
        clearCachedData();
      }

      // Retry
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        // Last resort: notify user
        notifyUser('Storage full. Some offline features disabled.');
        throw retryError;
      }
    } else {
      throw error;
    }
  }
}

function stillExceedsQuota(): boolean {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return false;
  } catch {
    return true;
  }
}
```

### 3. Conflict Resolution Errors

**Pattern: Fallback with User Notification**

```typescript
async function resolveConflictSafely(conflict: Conflict): Promise<GroceryItem> {
  try {
    // Try auto-resolution
    const resolved = resolver.autoResolve(conflict);

    if (resolved) {
      logResolution(conflict, 'auto', resolved);
      return resolved;
    }

    // Auto-resolution failed, require manual
    const userResolution = await showConflictDialog(conflict);

    if (!userResolution) {
      // User cancelled, use safe default
      console.warn('User cancelled conflict resolution, using last-write-wins');
      return resolver.resolveConflict(conflict, 'last-write-wins');
    }

    logResolution(conflict, 'manual', userResolution);
    return userResolution;

  } catch (error) {
    // Resolution failed, log and use fallback
    console.error('Conflict resolution failed:', error);

    // Fallback: prefer local version
    notifyUser('Conflict resolution failed. Using your version.');
    return conflict.local;
  }
}
```

### 4. Validation Errors

**Pattern: Fail Fast with Clear Messages**

```typescript
function validateMutation(mutation: QueuedMutation): void {
  const errors: string[] = [];

  // Validate mutation structure
  if (!mutation.id) {
    errors.push('Mutation missing ID');
  }

  if (!mutation.type || !['add', 'update', 'delete', 'markGotten'].includes(mutation.type)) {
    errors.push(`Invalid mutation type: ${mutation.type}`);
  }

  // Validate payload based on type
  switch (mutation.type) {
    case 'add':
      if (!mutation.payload.name) {
        errors.push('Add mutation missing name');
      }
      if (typeof mutation.payload.quantity !== 'number') {
        errors.push('Add mutation missing quantity');
      }
      break;

    case 'update':
    case 'delete':
    case 'markGotten':
      if (!mutation.payload.id) {
        errors.push(`${mutation.type} mutation missing item ID`);
      }
      break;
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Invalid mutation: ${errors.join(', ')}`,
      errors
    );
  }
}

class ValidationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

## Testing Recommendations

### Unit Tests

**Test: Conflict Detection**
```typescript
describe('ConflictResolver.detectConflict', () => {
  it('should detect quantity conflicts', () => {
    const local = createItem({ quantity: 2 });
    const remote = createItem({ quantity: 3 });

    const conflict = resolver.detectConflict(local, remote);

    expect(conflict).not.toBeNull();
    expect(conflict?.fieldConflicts).toHaveLength(1);
    expect(conflict?.fieldConflicts[0].field).toBe('quantity');
  });

  it('should return null for identical items', () => {
    const item = createItem();
    const conflict = resolver.detectConflict(item, item);

    expect(conflict).toBeNull();
  });

  it('should detect multiple field conflicts', () => {
    const local = createItem({ quantity: 2, notes: 'Organic' });
    const remote = createItem({ quantity: 3, notes: 'Store brand' });

    const conflict = resolver.detectConflict(local, remote);

    expect(conflict?.fieldConflicts).toHaveLength(2);
  });
});
```

**Test: Auto-Resolution**
```typescript
describe('ConflictResolver.autoResolve', () => {
  it('should prefer gotten state', () => {
    const local = createItem({ gotten: true, quantity: 2 });
    const remote = createItem({ gotten: false, quantity: 3 });

    const resolved = resolver.autoResolve(
      resolver.detectConflict(local, remote)!
    );

    expect(resolved?.gotten).toBe(true);
  });

  it('should return null for name conflicts', () => {
    const local = createItem({ name: 'Milk' });
    const remote = createItem({ name: 'Whole Milk' });

    const resolved = resolver.autoResolve(
      resolver.detectConflict(local, remote)!
    );

    expect(resolved).toBeNull();
  });
});
```

### Integration Tests

**Test: Offline Queue Processing**
```typescript
describe('OfflineQueueManager.processQueue', () => {
  it('should process pending mutations', async () => {
    const queueManager = new OfflineQueueManager();

    queueManager.addToQueue(createMutation('add'));
    queueManager.addToQueue(createMutation('update'));

    const result = await queueManager.processQueue();

    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(0);
  });

  it('should retry failed mutations', async () => {
    const queueManager = new OfflineQueueManager({
      maxRetries: 3,
    });

    // Add mutation that will fail
    queueManager.addToQueue(createFailingMutation());

    const result = await queueManager.processQueue();

    expect(result.failedCount).toBe(1);

    // Should have retried 3 times
    const mutations = queueManager.getQueuedMutations();
    expect(mutations[0].retryCount).toBe(3);
  });
});
```

### End-to-End Tests

**Test: Full Offline-to-Online Sync**
```typescript
describe('Offline Sync Flow', () => {
  it('should queue mutations when offline and sync when online', async () => {
    // Setup
    const queueManager = new OfflineQueueManager();
    mockOffline();

    // Add item while offline
    const mutation = createAddItemMutation(testItem);
    queueManager.addToQueue({
      ...mutation,
      id: nanoid(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    });

    // Verify queued
    expect(queueManager.getStatus().pending).toBe(1);

    // Go online
    mockOnline();
    const result = await queueManager.processQueue();

    // Verify synced
    expect(result.successCount).toBe(1);
    expect(queueManager.getStatus().pending).toBe(0);

    // Verify item in database
    const items = await queryItems();
    expect(items).toContainEqual(expect.objectContaining({
      name: testItem.name,
    }));
  });
});
```

### Performance Tests

**Test: Large Queue Processing**
```typescript
describe('Performance', () => {
  it('should process 100 mutations in under 10 seconds', async () => {
    const queueManager = new OfflineQueueManager();

    // Add 100 mutations
    for (let i = 0; i < 100; i++) {
      queueManager.addToQueue(createMutation('add'));
    }

    const startTime = Date.now();
    await queueManager.processQueue();
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(10000);
  }, 15000);

  it('should detect conflicts in under 100ms', () => {
    const local = createItem();
    const remote = createItem({ quantity: 5 });

    const startTime = performance.now();
    resolver.detectConflict(local, remote);
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(100);
  });
});
```

---

## Performance Optimization

### 1. Queue Size Management

**Limit Queue Growth:**
```typescript
const MAX_QUEUE_SIZE = 500;

function addToQueue(mutation: QueuedMutation) {
  // Clean up before adding
  if (queue.length >= MAX_QUEUE_SIZE) {
    // Remove old successful mutations
    queue = queue.filter(m =>
      m.status !== 'success' ||
      Date.now() - m.timestamp < 24 * 60 * 60 * 1000 // Keep last 24h
    );

    // Still too large? Remove oldest pending
    if (queue.length >= MAX_QUEUE_SIZE) {
      queue = queue
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_QUEUE_SIZE - 1);
    }
  }

  queue.push(mutation);
}
```

### 2. Batch Processing

**Process Multiple Mutations Together:**
```typescript
async function processBatch(mutations: QueuedMutation[]): Promise<void> {
  const BATCH_SIZE = 10;

  for (let i = 0; i < mutations.length; i += BATCH_SIZE) {
    const batch = mutations.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    await Promise.all(
      batch.map(m => processMutation(m))
    );

    // Small delay between batches
    if (i + BATCH_SIZE < mutations.length) {
      await sleep(100);
    }
  }
}
```

### 3. Debounced Status Updates

**Reduce Re-renders:**
```typescript
import { debounce } from 'lodash';

const notifyStatusChange = debounce((status: QueueStatus) => {
  config.onStatusChange(status);
}, 250); // Update at most every 250ms
```

### 4. Lazy Conflict Detection

**Only Detect When Necessary:**
```typescript
async function processMutation(mutation: QueuedMutation) {
  // Skip conflict detection for deletes
  if (mutation.type === 'delete') {
    await applyMutation(mutation);
    return;
  }

  // Only check conflicts if item still exists
  const exists = await itemExists(mutation.payload.id);
  if (!exists && mutation.type === 'add') {
    await applyMutation(mutation);
    return;
  }

  // Now check for conflicts
  const conflict = await detectConflict(mutation);
  // ...
}
```

### 5. Storage Optimization

**Compress Queue Data:**
```typescript
import LZString from 'lz-string';

function saveQueue(queue: QueuedMutation[]) {
  const json = JSON.stringify(queue);
  const compressed = LZString.compress(json);

  localStorage.setItem(STORAGE_KEY, compressed);
}

function loadQueue(): QueuedMutation[] {
  const compressed = localStorage.getItem(STORAGE_KEY);
  if (!compressed) return [];

  const json = LZString.decompress(compressed);
  return JSON.parse(json || '[]');
}
```

---

## Security Considerations

### 1. Input Validation

**Sanitize All Inputs:**
```typescript
function sanitizeItem(item: any): GroceryItem {
  return {
    id: String(item.id || '').slice(0, 50),
    name: String(item.name || '').slice(0, 200),
    quantity: Math.max(0, Math.min(Number(item.quantity) || 1, 9999)),
    gotten: Boolean(item.gotten),
    category: isValidCategory(item.category) ? item.category : 'Other',
    notes: String(item.notes || '').slice(0, 1000),
    userId: String(item.userId || '').slice(0, 50),
    listId: String(item.listId || '').slice(0, 50),
    createdAt: Number(item.createdAt) || Date.now(),
  };
}
```

### 2. Authorization Checks

**Verify Permissions:**
```typescript
async function processMutation(mutation: QueuedMutation) {
  const user = getCurrentUser();
  const list = await getList(mutation.payload.listId);

  // Check permission
  const permission = getPermission(user.id, list.id);

  if (mutation.type === 'delete' && permission === 'viewer') {
    throw new Error('Insufficient permissions');
  }

  if (['add', 'update', 'markGotten'].includes(mutation.type) &&
      permission === 'viewer') {
    throw new Error('Insufficient permissions');
  }

  await applyMutation(mutation);
}
```

### 3. XSS Prevention

**Escape User Content:**
```typescript
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function displayItem(item: GroceryItem) {
  return `
    <div class="item">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.notes)}</p>
    </div>
  `;
}
```

### 4. Rate Limiting

**Prevent Abuse:**
```typescript
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const window = 60 * 1000; // 1 minute
  const maxRequests = 100;

  const userRequests = rateLimiter.get(userId) || [];

  // Remove old requests
  const recentRequests = userRequests.filter(t => now - t < window);

  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);

  return true;
}
```

---

## Monitoring and Observability

### 1. Metrics Collection

```typescript
interface Metrics {
  queueSize: number;
  pendingCount: number;
  failedCount: number;
  successRate: number;
  avgProcessingTime: number;
  conflictRate: number;
  autoResolveRate: number;
}

function collectMetrics(): Metrics {
  const status = queueManager.getStatus();
  const history = getProcessingHistory();

  return {
    queueSize: status.total,
    pendingCount: status.pending,
    failedCount: status.failed,
    successRate: history.successCount / history.totalCount,
    avgProcessingTime: history.totalTime / history.successCount,
    conflictRate: history.conflictCount / history.totalCount,
    autoResolveRate: history.autoResolvedCount / history.conflictCount,
  };
}

// Report metrics every 5 minutes
setInterval(() => {
  const metrics = collectMetrics();
  sendToAnalytics(metrics);
}, 5 * 60 * 1000);
```

### 2. Error Tracking

```typescript
function trackError(error: Error, context: any) {
  // Log to console
  console.error('[Offline Sync Error]', {
    message: error.message,
    stack: error.stack,
    context,
  });

  // Send to error tracking service
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      extra: context,
    });
  }

  // Store locally for debugging
  const errorLog = JSON.parse(
    localStorage.getItem('error_log') || '[]'
  );

  errorLog.push({
    timestamp: Date.now(),
    message: error.message,
    context,
  });

  // Keep only last 100 errors
  localStorage.setItem(
    'error_log',
    JSON.stringify(errorLog.slice(-100))
  );
}
```

### 3. Performance Monitoring

```typescript
function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  return fn().finally(() => {
    const duration = performance.now() - startTime;

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

    // Track slow operations
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation: ${name} took ${duration}ms`);
      trackSlowOperation(name, duration);
    }
  });
}

// Usage
const result = await measurePerformance(
  'processQueue',
  () => queueManager.processQueue()
);
```

---

## Migration and Deployment

### Version Compatibility

```typescript
const QUEUE_VERSION = 2;

function migrateQueue(stored: any): QueuedMutation[] {
  const version = stored.version || 1;

  if (version === QUEUE_VERSION) {
    return stored.queue;
  }

  console.log(`Migrating queue from v${version} to v${QUEUE_VERSION}`);

  let queue = stored.queue || stored; // v1 had no version

  // Migrate v1 -> v2
  if (version === 1) {
    queue = queue.map((m: any) => ({
      ...m,
      priority: m.priority || MUTATION_PRIORITY[m.type] || 0,
    }));
  }

  // Save migrated version
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: QUEUE_VERSION,
    queue,
  }));

  return queue;
}
```

### Feature Flags

```typescript
const features = {
  offlineQueue: true,
  autoConflictResolution: true,
  manualConflictResolution: true,
  conflictLogging: true,
};

function isFeatureEnabled(feature: keyof typeof features): boolean {
  // Check remote config
  const remoteConfig = getRemoteConfig();
  if (remoteConfig[feature] !== undefined) {
    return remoteConfig[feature];
  }

  // Fallback to local config
  return features[feature];
}

// Usage
if (isFeatureEnabled('autoConflictResolution')) {
  const resolved = resolver.autoResolve(conflict);
}
```

### Gradual Rollout

```typescript
function shouldEnableForUser(userId: string): boolean {
  const percentage = 20; // 20% rollout

  // Consistent hash of user ID
  const hash = hashString(userId);
  return hash % 100 < percentage;
}

// In app initialization
if (shouldEnableForUser(user.id)) {
  initializeOfflineQueue();
}
```

---

## Summary

Following these best practices ensures:

✓ **Reliable Conflict Resolution**: Appropriate strategy for each scenario
✓ **Robust Error Handling**: Graceful degradation and recovery
✓ **Comprehensive Testing**: Unit, integration, and E2E coverage
✓ **Optimal Performance**: Efficient queue processing and storage
✓ **Strong Security**: Input validation, authorization, XSS prevention
✓ **Observable System**: Metrics, error tracking, performance monitoring
✓ **Safe Deployment**: Version compatibility, feature flags, gradual rollout

**Key Takeaways:**
- Choose resolution strategies based on data semantics
- Always validate inputs and check permissions
- Test offline scenarios thoroughly
- Monitor queue size and performance
- Plan for gradual rollouts and migrations

For more information, see:
- [API Reference](./CONFLICT_API_REFERENCE.md)
- [Architecture](./OFFLINE_ARCHITECTURE.md)
- [User Guide](../OFFLINE_CONFLICT_RESOLUTION_GUIDE.md)

---

**Version:** 1.0.0
**Last Updated:** October 2025
