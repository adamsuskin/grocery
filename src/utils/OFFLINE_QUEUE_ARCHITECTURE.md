# Offline Queue System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          User Interface Layer                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │  Add Item  │  │ Mark Item  │  │Update Item │  │Delete Item │      │
│  │  Button    │  │ Checkbox   │  │   Form     │  │  Button    │      │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘      │
│        │               │               │               │              │
└────────┼───────────────┼───────────────┼───────────────┼──────────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      React Integration Layer                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    useOfflineQueue() Hook                        │  │
│  │  - Provides reactive state                                       │  │
│  │  - Wraps OfflineQueueManager                                     │  │
│  │  - Handles React lifecycle                                       │  │
│  │  - Auto-updates on queue changes                                 │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
│                              │                                          │
│  ┌───────────────────────────▼──────────────────────────────────────┐  │
│  │              useQueuedMutations() Hook (Custom)                  │  │
│  │  - Checks online/offline status                                  │  │
│  │  - Routes to direct execution or queue                           │  │
│  │  - Provides unified mutation API                                 │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
└────────────────────────────────┼──────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
               [Online]     [Offline]    [Retry]
                    │            │            │
                    ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Queue Management Layer                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   OfflineQueueManager Class                      │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  Queue Array (In-Memory)                                   │ │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │  │
│  │  │  │Mutation │  │Mutation │  │Mutation │  │Mutation │      │ │  │
│  │  │  │   #1    │  │   #2    │  │   #3    │  │   #4    │      │ │  │
│  │  │  │Priority │  │Priority │  │Priority │  │Priority │      │ │  │
│  │  │  │  100    │  │   50    │  │   50    │  │   10    │      │ │  │
│  │  │  │(delete) │  │(update) │  │ (mark)  │  │  (add)  │      │ │  │
│  │  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘      │ │  │
│  │  │       │            │            │            │            │ │  │
│  │  │       └────────────┴────────────┴────────────┘            │ │  │
│  │  │                    Sorted by Priority                     │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  Methods:                                                        │  │
│  │  • addToQueue()        → Add mutation to queue                  │  │
│  │  • processQueue()      → Process all pending mutations          │  │
│  │  • retryFailed()       → Retry failed mutations                 │  │
│  │  • clearQueue()        → Clear all mutations                    │  │
│  │  • getQueuedMutations() → Get all mutations                     │  │
│  │  • getStatus()         → Get queue status                       │  │
│  │  • removeMutation()    → Remove specific mutation               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Persistence Layer                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        localStorage                              │  │
│  │                                                                  │  │
│  │  Key: 'grocery_offline_queue'                                   │  │
│  │  Value: JSON.stringify(queueArray)                              │  │
│  │                                                                  │  │
│  │  Key: 'grocery_offline_queue_metadata'                          │  │
│  │  Value: { lastUpdated, totalMutations, lastProcessed }          │  │
│  │                                                                  │  │
│  │  Features:                                                       │  │
│  │  • Persists queue between page refreshes                        │  │
│  │  • Automatic save on every change                               │  │
│  │  • Handles quota exceeded errors                                │  │
│  │  • Validates JSON on load                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Processing Engine                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Mutation Processor                            │  │
│  │                                                                  │  │
│  │  1. Conflict Detection                                          │  │
│  │     └─→ Check if mutation would cause conflict                  │  │
│  │         └─→ Delegate to Zero CRDT engine                        │  │
│  │                                                                  │  │
│  │  2. Exponential Backoff                                         │  │
│  │     └─→ Calculate delay: baseDelay * 2^(retryCount-1)          │  │
│  │         └─→ Cap at maxDelay                                     │  │
│  │             └─→ Wait before retry                               │  │
│  │                                                                  │  │
│  │  3. Mutation Execution                                          │  │
│  │     └─→ Route to appropriate Zero mutation                      │  │
│  │         ├─→ add      → zero.mutate.grocery_items.create()      │  │
│  │         ├─→ update   → zero.mutate.grocery_items.update()      │  │
│  │         ├─→ delete   → zero.mutate.grocery_items.delete()      │  │
│  │         └─→ markGotten → zero.mutate.grocery_items.update()    │  │
│  │                                                                  │  │
│  │  4. Status Tracking                                             │  │
│  │     └─→ Update mutation status                                  │  │
│  │         ├─→ pending → processing                                │  │
│  │         ├─→ processing → success (remove from queue)            │  │
│  │         └─→ processing → failed (increment retry count)         │  │
│  │                                                                  │  │
│  │  5. Callbacks                                                   │  │
│  │     └─→ Fire appropriate callbacks                              │  │
│  │         ├─→ onMutationSuccess()                                 │  │
│  │         ├─→ onMutationFailed()                                  │  │
│  │         ├─→ onQueueProcessed()                                  │  │
│  │         └─→ onStatusChange()                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Zero Sync Layer                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Zero Instance                                 │  │
│  │                                                                  │  │
│  │  • Handles CRDT-based conflict resolution                       │  │
│  │  • Manages local IndexedDB cache                                │  │
│  │  • Syncs with Zero server                                       │  │
│  │  • Provides reactive queries                                    │  │
│  │  • Handles authentication                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Database Layer                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL Database                           │  │
│  │                                                                  │  │
│  │  Tables:                                                         │  │
│  │  • grocery_items  → Grocery list items                          │  │
│  │  • lists          → Shared lists                                │  │
│  │  • list_members   → List collaborators                          │  │
│  │  • users          → User accounts                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Adding an Item (Online)

```
User clicks "Add Item"
        ↓
useQueuedMutations checks navigator.onLine
        ↓
    [Online: true]
        ↓
Direct execution via Zero
        ↓
zero.mutate.grocery_items.create()
        ↓
Zero syncs to server
        ↓
Database updated
        ↓
UI updates automatically
```

### Adding an Item (Offline)

```
User clicks "Add Item"
        ↓
useQueuedMutations checks navigator.onLine
        ↓
    [Online: false]
        ↓
addMutation(createAddItemMutation(...))
        ↓
OfflineQueueManager.addToQueue()
        ↓
Add to in-memory queue (sorted by priority)
        ↓
Persist to localStorage
        ↓
Update UI with "queued" indicator
        ↓
Wait for online event...
```

### Processing Queue (When Back Online)

```
Browser fires 'online' event
        ↓
useOfflineQueue detects online
        ↓
Calls processQueue()
        ↓
OfflineQueueManager.processQueue()
        ↓
For each pending mutation:
  ├─→ Update status to 'processing'
  ├─→ Check retry count < maxRetries
  ├─→ Apply exponential backoff (if retry)
  ├─→ Check for conflicts (optional)
  ├─→ Execute mutation via Zero
  ├─→ Success?
  │   ├─→ Yes: Mark success, remove from queue
  │   └─→ No: Increment retry count, mark failed
  └─→ Fire callbacks
        ↓
Save updated queue to localStorage
        ↓
Return ProcessingResult
        ↓
UI updates with sync status
```

## State Transitions

### Mutation State Machine

```
                ┌─────────┐
                │ pending │ ← Initial state
                └────┬────┘
                     │
         processQueue() called
                     │
                     ▼
              ┌────────────┐
              │ processing │ ← Currently being processed
              └──────┬─────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    Success                   Failure
         │                       │
         ▼                       ▼
    ┌─────────┐           ┌─────────┐
    │ success │           │ failed  │
    └────┬────┘           └────┬────┘
         │                     │
    Removed from          retryCount++
      queue                    │
                         ┌─────┴─────┐
                         │           │
                   retryFailed()  maxRetries
                         │         reached?
                         ▼            │
                   ┌─────────┐       │
                   │ pending │       │
                   └─────────┘       ▼
                                Stay failed
```

## Priority System

```
Priority Queue (Higher priority processed first)
┌─────────────────────────────────────────────────┐
│                                                 │
│  Priority 100: DELETE operations                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ delete   │  │ delete   │  │ delete   │     │
│  │ item-1   │  │ item-2   │  │ item-3   │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Priority 50: UPDATE operations                 │
│  ┌──────────┐  ┌──────────┐                    │
│  │ update   │  │markGotten│                    │
│  │ item-4   │  │ item-5   │                    │
│  └──────────┘  └──────────┘                    │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Priority 10: ADD operations                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   add    │  │   add    │  │   add    │     │
│  │  Milk    │  │  Bread   │  │  Eggs    │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘

Within same priority: FIFO (oldest first)
```

## Retry Strategy (Exponential Backoff)

```
Retry Attempt    Delay Calculation           Actual Delay
────────────────────────────────────────────────────────────
    0            N/A (first try)                 0ms
    1            1000 * 2^0                    1,000ms (1s)
    2            1000 * 2^1                    2,000ms (2s)
    3            1000 * 2^2                    4,000ms (4s)
    4            1000 * 2^3                    8,000ms (8s)
    5            1000 * 2^4                   16,000ms (16s)
    6            1000 * 2^5                   32,000ms (32s)
    7+           1000 * 2^6 (capped)          60,000ms (60s max)

After 5 retries (configurable): Give up, mark as permanently failed
```

## Component Integration Pattern

```
┌────────────────────────────────────────────────┐
│              App.tsx                           │
│  ┌──────────────────────────────────────────┐ │
│  │  <OfflineIndicator />                    │ │
│  │  Shows: Online/Offline status            │ │
│  │         Pending mutations count          │ │
│  │         Failed mutations count           │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  <GroceryList />                         │ │
│  │    Uses: useQueuedMutations()            │ │
│  │    ┌──────────────────────────────────┐  │ │
│  │    │  <GroceryItem />                 │  │ │
│  │    │    Uses: queued mutations        │  │ │
│  │    │    Shows: "Queued" badge if      │  │ │
│  │    │           offline                 │  │ │
│  │    └──────────────────────────────────┘  │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  <Settings />                            │ │
│  │    ┌──────────────────────────────────┐  │ │
│  │    │  <QueueDebugPanel />             │  │ │
│  │    │    Shows: Detailed queue info    │  │ │
│  │    │           Individual mutations   │  │ │
│  │    │           Manual controls        │  │ │
│  │    └──────────────────────────────────┘  │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

## Event Flow

```
Browser Events                Queue Events               UI Updates
─────────────────            ──────────────            ────────────

window.offline     ─────────► [Queue Ready]    ─────►  Show offline badge
                                                       Disable sync buttons

User adds item     ─────────► addToQueue()     ─────►  Show "queued" label
                              └─► localStorage         Update pending count
                              └─► statusChange

window.online      ─────────► processQueue()   ─────►  Show "syncing..."
                              ├─► processing            Update UI state
                              ├─► conflict check
                              ├─► zero mutation
                              ├─► success/failed
                              └─► statusChange  ─────►  Show "synced"
                                                       Clear badges
                                                       Update counts

Retry timeout      ─────────► retryFailed()    ─────►  Show retry attempt
                              └─► processQueue()       Update status

Max retries        ─────────► [Permanent Fail] ─────►  Show error
reached                       └─► statusChange         Enable retry button
```

## Performance Characteristics

```
Operation              Time Complexity    Space Complexity
──────────────────────────────────────────────────────────
addToQueue()           O(n log n)        O(1)
                       (sorting)

getQueuedMutations()   O(n)              O(n)
                       (copy array)

processQueue()         O(n * m)          O(1)
                       n=mutations
                       m=avg processing time

retryFailed()          O(n)              O(1)
                       (filter + process)

clearQueue()           O(1)              O(1)

getStatus()            O(n)              O(1)
                       (count by status)

localStorage save      O(n)              O(n)
                       (JSON stringify)

localStorage load      O(n)              O(n)
                       (JSON parse)
```

## Thread Safety

```
┌─────────────────────────────────────────────────┐
│  JavaScript is single-threaded                  │
│                                                 │
│  No concurrent access issues within:            │
│  • Queue array modifications                    │
│  • localStorage operations                      │
│  • Status updates                               │
│                                                 │
│  However, be aware of:                          │
│  • Multiple tabs (separate queue instances)     │
│  • Service Workers (separate context)           │
│                                                 │
│  Solution: Use BroadcastChannel API for         │
│           cross-tab synchronization (future)    │
└─────────────────────────────────────────────────┘
```

## Error Recovery

```
Error Type              Recovery Strategy
──────────────────────────────────────────────────
Network timeout         → Retry with exponential backoff
Server error (5xx)      → Retry with exponential backoff
Client error (4xx)      → Mark as failed, don't retry
Validation error        → Mark as failed, don't retry
localStorage quota      → Log error, continue in-memory
Corrupted data          → Clear and start fresh
Zero sync error         → Retry with exponential backoff
Max retries exceeded    → Mark permanently failed, notify user
Conflict detected       → Delegate to Zero CRDT resolution
```

## Security Model

```
┌─────────────────────────────────────────────────┐
│              Security Layers                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Authentication                              │
│     • JWT tokens in mutations                   │
│     • User ID verification                      │
│     • Token expiry handling                     │
│                                                 │
│  2. Authorization                               │
│     • Check user owns item                      │
│     • Check list permissions                    │
│     • Validate before queue                     │
│                                                 │
│  3. Data Validation                             │
│     • Validate mutation payload                 │
│     • Sanitize user input                       │
│     • Type checking                             │
│                                                 │
│  4. XSS Prevention                              │
│     • Sanitize all user inputs                  │
│     • Escape HTML in notes                      │
│     • CSP headers (server-side)                 │
│                                                 │
│  5. localStorage Security                       │
│     • No sensitive data stored                  │
│     • Consider encryption (future)              │
│     • Clear on logout                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Future Architecture Enhancements

```
Current:    User → Queue → Zero → Server
            (Simple offline queue)

Future V2:  User → Queue → Optimistic UI
                    ↓          ↓
                  Undo     Preview
                    ↓          ↓
                   Zero → Server
            (Optimistic updates with undo)

Future V3:  User → Queue → Optimistic UI
                    ↓          ↓
             Service Worker  Conflict
                    ↓        Resolution
                   Zero    → UI Dialog
                    ↓          ↓
                  Server   User Choice
            (Background sync + manual conflict resolution)
```

This architecture provides a robust, scalable foundation for offline-first functionality in the grocery list application.
