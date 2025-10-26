# Server-Side Timestamp Implementation

## Overview

This document describes the server-side timestamp implementation in the Grocery List application. Server timestamps provide a consistent, authoritative source of truth for record modification times across all clients, which is essential for conflict resolution, data synchronization, and maintaining data integrity in a collaborative multi-user environment.

## Table of Contents

1. [Why Server Timestamps Matter](#why-server-timestamps-matter)
2. [Database Schema](#database-schema)
3. [Implementation Details](#implementation-details)
4. [Client-Side Integration](#client-side-integration)
5. [Migration Information](#migration-information)
6. [Backward Compatibility](#backward-compatibility)
7. [Conflict Resolution](#conflict-resolution)
8. [Best Practices for Developers](#best-practices-for-developers)
9. [Troubleshooting](#troubleshooting)

---

## Why Server Timestamps Matter

### The Problem with Client Timestamps

Client-side timestamps can be unreliable in collaborative applications:

1. **Clock Skew**: Different devices may have their clocks set incorrectly
2. **Time Zone Issues**: Clients in different time zones may report inconsistent times
3. **Malicious Manipulation**: Clients could potentially forge timestamps
4. **Offline Edits**: Client clocks may drift while offline for extended periods

### Benefits of Server Timestamps

Server-side timestamps solve these issues by:

1. **Single Source of Truth**: All timestamps come from a single, authoritative server clock
2. **Consistency**: Eliminates clock skew and time zone discrepancies
3. **Trust**: Server-generated timestamps cannot be manipulated by clients
4. **Accurate Ordering**: Ensures correct chronological ordering of events
5. **Reliable Conflict Resolution**: Enables timestamp-based conflict resolution strategies

### Use Cases in Our Application

- **Last-Write-Wins Conflict Resolution**: Determine which edit is most recent
- **Real-time Collaboration**: Show when other users last modified shared lists
- **Activity Tracking**: Log when list members were added or permissions changed
- **Data Synchronization**: Sync only records modified since last sync
- **Audit Trail**: Track when items were created and modified

---

## Database Schema

### Tables with `updated_at` Fields

The following tables have server-managed `updated_at` timestamp columns:

| Table | Primary Key | `updated_at` Added | Trigger Name | Backfill Strategy |
|-------|-------------|-------------------|--------------|-------------------|
| `users` | UUID | Initial schema | `update_users_updated_at` | Set to `created_at` |
| `lists` | UUID | Initial schema | `update_lists_updated_at` | Set to `created_at` |
| `list_members` | Composite (list_id, user_id) | Migration 011 | `update_list_members_updated_at` | Set to `joined_at` |
| `grocery_items` | UUID | Migration 010 | `update_grocery_items_updated_at` | Set to `created_at` |
| `push_subscriptions` | UUID | Initial schema | `update_push_subscriptions_updated_at` | Set to `created_at` |

### Column Specifications

All `updated_at` columns follow the same specification:

```sql
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
```

**Properties:**
- **Type**: `TIMESTAMP WITH TIME ZONE` - Stores time with timezone information
- **Default**: `CURRENT_TIMESTAMP` - Automatically set to server time on INSERT
- **NOT NULL**: Implicitly required (via DEFAULT)
- **Auto-Updated**: Via database trigger on UPDATE operations

### Tables Without `updated_at`

The following tables do NOT have `updated_at` fields:

- `refresh_tokens` - Tokens are immutable (only created and revoked)
- `list_activities` - Activity log entries are immutable (append-only)
- `list_pins` - Uses `pinned_at` timestamp (no updates needed)
- `schema_migrations` - Migration metadata (immutable)

---

## Implementation Details

### PostgreSQL Function

A shared trigger function automatically updates the `updated_at` timestamp:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';
```

**How it works:**
1. Function is invoked automatically BEFORE UPDATE operations
2. Sets `NEW.updated_at` to the current server timestamp
3. Returns the modified row with the new timestamp
4. Uses PostgreSQL's `CURRENT_TIMESTAMP` function (accurate to microseconds)

**Location in codebase:**
- `/home/adam/grocery/server/db/schema.sql` (line 56-62)
- `/home/adam/grocery/server/migrations/001_add_authentication.sql` (line 81-89)

### Database Triggers

Each table with `updated_at` has a dedicated trigger:

#### Users Table
```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Lists Table
```sql
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### List Members Table
```sql
CREATE TRIGGER update_list_members_updated_at
  BEFORE UPDATE ON list_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Grocery Items Table
```sql
CREATE TRIGGER update_grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Push Subscriptions Table
```sql
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Indexes for Performance

All `updated_at` columns are indexed for efficient queries:

```sql
-- Grocery Items
CREATE INDEX IF NOT EXISTS idx_grocery_items_updated_at
  ON grocery_items(updated_at DESC);

-- List Members
CREATE INDEX IF NOT EXISTS idx_list_members_updated_at
  ON list_members(updated_at DESC);
```

**Benefits:**
- Fast queries for "recently modified" records
- Efficient delta sync operations (WHERE updated_at > last_sync)
- Optimized sorting by modification time

---

## Client-Side Integration

### Zero Store Integration

The Zero store (`/home/adam/grocery/src/zero-store.ts`) integrates server timestamps seamlessly:

#### Reading Timestamps

```typescript
// useGroceryItems hook automatically includes updated_at
const allItems: GroceryItem[] = (query as any[]).map((item: any) => ({
  id: item.id,
  name: item.name,
  quantity: item.quantity,
  gotten: item.gotten,
  category: item.category,
  notes: item.notes,
  price: item.price,
  userId: item.user_id,
  listId: item.list_id,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt || item.createdAt,  // Fallback to createdAt
}));
```

#### Writing with Timestamps

```typescript
// Client sends current timestamp on mutation
await zero.mutate.grocery_items.update({
  id,
  gotten,
  updatedAt: Date.now(),  // Client timestamp (will be overwritten by server)
});
```

**Important**: The client-side `updatedAt` value is immediately overwritten by the server trigger. The client value serves as:
1. Optimistic UI update before server response
2. Fallback for offline operations
3. Compatibility layer during migration

### TypeScript Types

```typescript
// From /home/adam/grocery/src/types.ts
export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  gotten: boolean;
  category: 'Produce' | 'Dairy' | 'Meat' | 'Bakery' | 'Canned' |
            'Frozen' | 'Snacks' | 'Beverages' | 'Other';
  notes: string;
  price?: number;
  userId: string;
  listId: string;
  createdAt: number;    // Unix timestamp (milliseconds)
  updatedAt: number;    // Unix timestamp (milliseconds) - SERVER MANAGED
}

export interface ListMember {
  id: string;
  listId: string;
  userId: string;
  userEmail: string;
  userName: string;
  permission: PermissionLevel;
  addedAt: number;
  addedBy: string;
  updatedAt: number;    // SERVER MANAGED
}
```

### React Hooks Example

```typescript
import { useGroceryItems, useGroceryMutations } from './zero-store';

function GroceryList() {
  // Items automatically include server timestamps
  const items = useGroceryItems();
  const { updateItem } = useGroceryMutations();

  const handleUpdate = async (itemId: string, newName: string) => {
    // Client sends update, server sets timestamp
    await updateItem(itemId, { name: newName });

    // After sync, item will have server's updated_at timestamp
  };

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <small>Last modified: {new Date(item.updatedAt).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
```

---

## Migration Information

### Migration 010: Add updated_at to grocery_items

**File**: `/home/adam/grocery/server/migrations/010_add_updated_at_to_grocery_items.sql`

**Date**: 2025-10-26

**Actions performed:**

1. **Add Column**:
   ```sql
   ALTER TABLE grocery_items
     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
   ```

2. **Backfill Existing Data**:
   ```sql
   UPDATE grocery_items
   SET updated_at = created_at
   WHERE updated_at IS NULL;
   ```

3. **Create Trigger**:
   ```sql
   CREATE TRIGGER update_grocery_items_updated_at
     BEFORE UPDATE ON grocery_items
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   ```

4. **Add Index**:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_grocery_items_updated_at
     ON grocery_items(updated_at DESC);
   ```

5. **Add Documentation**:
   ```sql
   COMMENT ON COLUMN grocery_items.updated_at IS
     'Timestamp of last modification to the grocery item';
   ```

### Migration 011: Add updated_at to list_members

**File**: `/home/adam/grocery/server/migrations/011_add_updated_at_to_list_members.sql`

**Date**: 2025-10-26

**Actions performed:**

1. **Add Column**:
   ```sql
   ALTER TABLE list_members
     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
   ```

2. **Backfill Existing Data**:
   ```sql
   UPDATE list_members
     SET updated_at = joined_at
     WHERE updated_at IS NULL OR updated_at = CURRENT_TIMESTAMP;
   ```

3. **Create Trigger**:
   ```sql
   CREATE TRIGGER update_list_members_updated_at
     BEFORE UPDATE ON list_members
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   ```

4. **Add Index**:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_list_members_updated_at
     ON list_members(updated_at DESC);
   ```

5. **Add Documentation**:
   ```sql
   COMMENT ON COLUMN list_members.updated_at IS
     'Timestamp of when the list member record was last updated';
   ```

### Rollback Scripts

Both migrations have corresponding rollback scripts:

- `/home/adam/grocery/server/migrations/010_add_updated_at_to_grocery_items_rollback.sql`
- `/home/adam/grocery/server/migrations/011_add_updated_at_to_list_members_rollback.sql`

**Rollback actions:**
1. Drop the trigger
2. Drop the index
3. Drop the column

**Example rollback:**
```sql
-- Drop trigger
DROP TRIGGER IF EXISTS update_grocery_items_updated_at ON grocery_items;

-- Drop index
DROP INDEX IF EXISTS idx_grocery_items_updated_at;

-- Drop column
ALTER TABLE grocery_items DROP COLUMN IF EXISTS updated_at;
```

---

## Backward Compatibility

### Handling Missing Timestamps

The application is designed to handle records without `updated_at` gracefully:

#### In Zero Store Mapping
```typescript
// Fallback to createdAt if updatedAt is missing
updatedAt: item.updatedAt || item.createdAt
```

#### In Migration Backfill
```sql
-- Set updated_at to created_at for existing records
UPDATE grocery_items
SET updated_at = created_at
WHERE updated_at IS NULL;
```

### Gradual Rollout Strategy

1. **Phase 1**: Add columns with DEFAULT values (all new records get timestamps)
2. **Phase 2**: Backfill existing data (all old records get timestamps)
3. **Phase 3**: Add triggers (future updates automatically set timestamps)
4. **Phase 4**: Client code uses timestamps (conflict resolution enabled)

### Client Compatibility

The client sends timestamps on mutations for backward compatibility:

```typescript
// Client provides timestamp for offline support
await zero.mutate.grocery_items.update({
  id,
  gotten,
  updatedAt: Date.now(),  // Overwritten by server, but available offline
});
```

**Why this works:**
- Online: Server trigger overwrites client timestamp with authoritative time
- Offline: Client timestamp used for optimistic UI and queued mutations
- Hybrid: When connection is restored, server timestamps replace client ones

---

## Conflict Resolution

### Timestamp-Based Resolution

Server timestamps enable several conflict resolution strategies:

#### 1. Last-Write-Wins (LWW)

The most recent edit wins based on server timestamps:

```typescript
// From /home/adam/grocery/src/utils/conflictResolver.ts
private resolveLastWriteWins(conflict: Conflict): GroceryItem {
  const comparison = compareTimestamps(
    conflict.local.updatedAt,    // Client's cached version
    conflict.remote.updatedAt    // Server's current version
  );

  if (comparison > 0) {
    return { ...conflict.local };   // Local is newer
  } else {
    return { ...conflict.remote };  // Remote is newer
  }
}
```

#### 2. Field-Level Merge with Timestamps

```typescript
mergeFields(local: GroceryItem, remote: GroceryItem): GroceryItem {
  const merged: GroceryItem = { ...local };

  // Use the more recent timestamp for each field
  const useRemote = compareTimestamps(
    local.updatedAt,
    remote.updatedAt
  ) < 0;

  for (const field of this.conflictableFields) {
    if (hasConflict(local[field], remote[field])) {
      // Choose value based on timestamp
      merged[field] = useRemote ? remote[field] : local[field];
    }
  }

  return merged;
}
```

#### 3. Auto-Resolution with Time Heuristics

```typescript
autoResolve(conflict: Conflict): GroceryItem | null {
  // If timestamps differ by more than 5 minutes, use last-write-wins
  const timeDiff = Math.abs(
    conflict.local.updatedAt - conflict.remote.updatedAt
  );
  const fiveMinutes = 5 * 60 * 1000;

  if (timeDiff > fiveMinutes) {
    return this.resolveLastWriteWins(conflict);
  }

  // Otherwise, use more sophisticated resolution
  // ...
}
```

### Conflict Detection

```typescript
detectConflict(local: GroceryItem, remote: GroceryItem): Conflict | null {
  // Check for field-level conflicts
  const fieldConflicts: FieldConflict[] = [];

  for (const field of this.conflictableFields) {
    if (hasConflict(local[field], remote[field])) {
      fieldConflicts.push({
        field,
        localValue: local[field],
        remoteValue: remote[field],
        localTimestamp: local.updatedAt,   // Use updated_at for comparison
        remoteTimestamp: remote.updatedAt,
      });
    }
  }

  // Return conflict if differences found
  return fieldConflicts.length > 0 ? {
    id: local.id,
    type: 'concurrent_edit',
    local,
    remote,
    fieldConflicts,
    detectedAt: Date.now(),
    requiresManualResolution: this.requiresManualResolution(fieldConflicts),
  } : null;
}
```

### Offline Queue Integration

Timestamps enable smart offline sync:

```typescript
// From /home/adam/grocery/src/zero-store.ts
const markItemGotten = async (
  id: string,
  gotten: boolean,
  options?: { queueIfOffline?: boolean }
): Promise<void> => {
  if (options?.queueIfOffline && connectionStatus === ConnectionStatus.Offline) {
    // Queue with current timestamp
    const mutation = createMarkGottenMutation(id, gotten);
    queueManager.addToQueue({
      ...mutation,
      timestamp: Date.now(),  // Client timestamp for queue ordering
      retryCount: 0,
      status: 'pending',
    });
    return;
  }

  // Apply mutation with server timestamp
  await zero.mutate.grocery_items.update({
    id,
    gotten,
    updatedAt: Date.now(),  // Replaced by server trigger
  });
};
```

---

## Best Practices for Developers

### 1. Always Use Server Timestamps for Logic

**DO:**
```typescript
// Compare server timestamps for conflict resolution
if (remoteItem.updatedAt > localItem.updatedAt) {
  // Remote is newer, use remote version
  applyRemoteChanges(remoteItem);
}
```

**DON'T:**
```typescript
// Never use client Date.now() for comparison with server data
if (Date.now() > localItem.updatedAt) {
  // WRONG: Comparing client clock to server timestamp
}
```

### 2. Handle Missing Timestamps Gracefully

**DO:**
```typescript
// Always provide fallback
const timestamp = item.updatedAt || item.createdAt || Date.now();
```

**DON'T:**
```typescript
// Don't assume updatedAt always exists
const timestamp = item.updatedAt;  // May be undefined!
```

### 3. Index Timestamp Columns for Performance

**DO:**
```sql
-- Create index for timestamp queries
CREATE INDEX idx_table_updated_at ON table_name(updated_at DESC);

-- Query using index
SELECT * FROM table_name
WHERE updated_at > $1
ORDER BY updated_at DESC;
```

**DON'T:**
```sql
-- Avoid functions on timestamp columns (breaks index)
SELECT * FROM table_name
WHERE DATE(updated_at) = CURRENT_DATE;  -- Index not used
```

### 4. Use Triggers Consistently

**DO:**
```sql
-- One trigger function, multiple triggers
CREATE TRIGGER update_table_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**DON'T:**
```sql
-- Don't create separate functions for each table
CREATE FUNCTION update_table_specific_updated_at() ...
```

### 5. Document Timestamp Behavior

**DO:**
```sql
-- Add comments explaining timestamp behavior
COMMENT ON COLUMN table_name.updated_at IS
  'Server-managed timestamp of last modification. Updated automatically by trigger.';
```

**DON'T:**
```sql
-- Don't leave timestamp columns undocumented
ALTER TABLE table_name ADD COLUMN updated_at TIMESTAMP;
```

### 6. Test Timestamp Behavior

**DO:**
```typescript
describe('Timestamp updates', () => {
  it('should update timestamp on modification', async () => {
    const before = item.updatedAt;
    await updateItem(item.id, { name: 'New Name' });
    const after = (await getItem(item.id)).updatedAt;
    expect(after).toBeGreaterThan(before);
  });
});
```

### 7. Consider Time Zones

**DO:**
```sql
-- Always use TIMESTAMP WITH TIME ZONE
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
```

**DON'T:**
```sql
-- Don't use TIMESTAMP without time zone
updated_at TIMESTAMP DEFAULT NOW()  -- Time zone ambiguity
```

### 8. Use Timestamps for Delta Sync

**DO:**
```typescript
// Sync only records modified since last sync
const lastSync = getLastSyncTimestamp();
const changes = await fetch(`/api/items?since=${lastSync}`);
```

**DON'T:**
```typescript
// Don't sync all records every time
const allItems = await fetch('/api/items');  // Inefficient
```

### 9. Display Timestamps User-Friendly

**DO:**
```typescript
// Format for user display
const lastModified = new Date(item.updatedAt).toLocaleString('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
// "Oct 26, 2025, 3:45 PM"
```

**DON'T:**
```typescript
// Don't show raw timestamps
<div>Modified: {item.updatedAt}</div>  // "1730000000000" - Not helpful!
```

### 10. Monitor Timestamp Accuracy

**DO:**
```sql
-- Check for timestamp drift or issues
SELECT
  id,
  created_at,
  updated_at,
  updated_at - created_at as age,
  CASE
    WHEN updated_at < created_at THEN 'INVALID'
    ELSE 'OK'
  END as status
FROM grocery_items
WHERE updated_at < created_at;
```

---

## Troubleshooting

### Issue: Timestamps Not Updating

**Symptoms:**
- `updated_at` remains unchanged after UPDATE
- Client shows stale modification times

**Diagnosis:**
```sql
-- Check if trigger exists
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'grocery_items'::regclass;

-- Check if function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'update_updated_at_column';
```

**Solution:**
```sql
-- Recreate trigger
DROP TRIGGER IF EXISTS update_grocery_items_updated_at ON grocery_items;

CREATE TRIGGER update_grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Issue: Timestamps in Wrong Time Zone

**Symptoms:**
- Timestamps appear off by several hours
- Time zone conversions failing

**Diagnosis:**
```sql
-- Check database time zone
SHOW timezone;

-- Check column type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grocery_items'
  AND column_name = 'updated_at';
```

**Solution:**
```sql
-- Set correct timezone
ALTER DATABASE grocery_db SET timezone TO 'UTC';

-- Or update column to use timezone
ALTER TABLE grocery_items
  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
```

### Issue: NULL Timestamps After Migration

**Symptoms:**
- Some records have `updated_at = NULL`
- Client crashes on timestamp operations

**Diagnosis:**
```sql
-- Find NULL timestamps
SELECT COUNT(*)
FROM grocery_items
WHERE updated_at IS NULL;
```

**Solution:**
```sql
-- Backfill NULL timestamps
UPDATE grocery_items
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Add NOT NULL constraint (optional)
ALTER TABLE grocery_items
  ALTER COLUMN updated_at SET NOT NULL;
```

### Issue: Conflict Resolution Not Working

**Symptoms:**
- Conflicts always resolve to same version
- "Manual resolution required" for simple conflicts

**Diagnosis:**
```typescript
// Check timestamp comparison
console.log('Local timestamp:', item.updatedAt);
console.log('Remote timestamp:', remoteItem.updatedAt);
console.log('Comparison:', item.updatedAt - remoteItem.updatedAt);
```

**Solution:**
```typescript
// Ensure timestamps are numbers, not strings
const localTime = Number(item.updatedAt);
const remoteTime = Number(remoteItem.updatedAt);

if (localTime > remoteTime) {
  // Local is newer
}
```

### Issue: Performance Degradation on Timestamp Queries

**Symptoms:**
- Slow queries filtering by `updated_at`
- High database CPU usage

**Diagnosis:**
```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM grocery_items
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

**Solution:**
```sql
-- Create or rebuild index
CREATE INDEX CONCURRENTLY idx_grocery_items_updated_at
  ON grocery_items(updated_at DESC);

-- Analyze table
ANALYZE grocery_items;
```

### Issue: Trigger Not Firing

**Symptoms:**
- Manual UPDATE works, but timestamp doesn't change
- Trigger appears to be disabled

**Diagnosis:**
```sql
-- Check trigger status
SELECT tgname, tgenabled, tgtype
FROM pg_trigger
WHERE tgrelid = 'grocery_items'::regclass
  AND tgname = 'update_grocery_items_updated_at';

-- tgenabled values:
-- 'O' = enabled
-- 'D' = disabled
-- 'R' = replica enabled
-- 'A' = always enabled
```

**Solution:**
```sql
-- Enable trigger
ALTER TABLE grocery_items
  ENABLE TRIGGER update_grocery_items_updated_at;

-- Or recreate
DROP TRIGGER IF EXISTS update_grocery_items_updated_at ON grocery_items;
CREATE TRIGGER update_grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Summary

Server-side timestamps provide a robust foundation for:
- Reliable conflict resolution in collaborative editing
- Accurate data synchronization across clients
- Consistent audit trails and activity tracking
- Efficient delta sync operations

**Key Takeaways:**
1. All write operations automatically update `updated_at` via database triggers
2. Client timestamps are overwritten by server for consistency
3. Timestamps enable Last-Write-Wins and field-level merge strategies
4. Indexes on `updated_at` columns ensure query performance
5. Backward compatibility maintained through fallbacks and gradual migration

**Related Documentation:**
- `/home/adam/grocery/server/migrations/010_add_updated_at_to_grocery_items.sql`
- `/home/adam/grocery/server/migrations/011_add_updated_at_to_list_members.sql`
- `/home/adam/grocery/src/utils/conflictResolver.ts`
- `/home/adam/grocery/src/zero-store.ts`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-26
**Author**: System Documentation
**Status**: Current
