# Offline Conflict Resolution Test Plan

Comprehensive test scenarios for offline functionality and conflict resolution in the Grocery List app.

## Table of Contents
- [Overview](#overview)
- [Test Environment Setup](#test-environment-setup)
- [Offline Architecture](#offline-architecture)
- [Basic Conflict Detection Tests](#basic-conflict-detection-tests)
- [Automatic Conflict Resolution Tests](#automatic-conflict-resolution-tests)
- [Manual Conflict Resolution Tests](#manual-conflict-resolution-tests)
- [Offline Queue Tests](#offline-queue-tests)
- [Sync Status Tests](#sync-status-tests)
- [Multi-User Offline Scenarios](#multi-user-offline-scenarios)
- [Edge Cases](#edge-cases)
- [Performance Tests](#performance-tests)
- [Integration Tests](#integration-tests)
- [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

The Grocery List app supports offline-first functionality with automatic conflict resolution when multiple users edit the same items while disconnected. This document outlines 90+ comprehensive test scenarios covering:

- **Offline Capability**: Work without network connection
- **Conflict Detection**: Identify concurrent edits to the same item
- **Automatic Resolution**: Apply last-write-wins and field-level merge rules
- **Manual Resolution**: User-driven conflict resolution for complex cases
- **Queue Management**: Persist and process offline mutations
- **Sync Status**: Visual indicators for connection state and sync progress

### Conflict Resolution Strategy

The app uses a hybrid conflict resolution approach:

1. **Automatic Resolution** (No user intervention):
   - Last-write-wins for simple field updates
   - Prefer "gotten" status over "not gotten"
   - Merge quantities (sum both values)
   - Concatenate notes with separator

2. **Manual Resolution** (User chooses):
   - Update vs Delete conflicts
   - Multiple field changes on same item
   - Category conflicts with significant differences
   - Complex multi-field edits

### Expected Behavior

| Scenario | Resolution Method | User Action Required |
|----------|------------------|---------------------|
| User A offline edits name, User B online edits quantity | Automatic (field-level merge) | No |
| User A offline marks gotten, User B online edits name | Automatic (merge both changes) | No |
| User A offline edits item, User B online deletes it | Manual (show conflict modal) | Yes - choose version |
| User A and B both offline, edit same field | Automatic (last sync wins) | No |
| User A offline edits multiple fields, User B deletes | Manual (show conflict modal) | Yes - keep or discard |

---

## Test Environment Setup

### Prerequisites

#### Required Services
```bash
# 1. PostgreSQL database
docker compose up -d

# 2. Zero cache server (real-time sync)
pnpm zero:dev

# 3. Authentication API server
pnpm server:dev

# 4. Frontend development server
pnpm dev
```

#### Service Verification
```bash
# Check all services are running
curl http://localhost:3001/health        # API server
curl http://localhost:4848/health        # Zero cache server
curl http://localhost:5173               # Frontend (Vite)
psql -h localhost -U grocery -d grocery_db -c "SELECT 1"  # PostgreSQL
```

### Test User Setup

Create test users for multi-user offline scenarios:

```bash
# Using API endpoints
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Cooper",
    "email": "alice@test.com",
    "password": "TestPass123"
  }'

curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "email": "bob@test.com",
    "password": "TestPass123"
  }'

curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carol Davis",
    "email": "carol@test.com",
    "password": "TestPass123"
  }'
```

### Network Simulation Tools

#### Chrome DevTools Network Throttling
```
1. Open DevTools (F12)
2. Go to Network tab
3. Select throttling profile:
   - Online: No throttling
   - Offline: Offline mode
   - Slow 3G: Simulate slow connection
   - Custom: Create custom profile
```

#### Manual Network Control
```bash
# Linux - Disable network interface
sudo ifconfig eth0 down
sudo ifconfig eth0 up

# macOS - Disable Wi-Fi
networksetup -setairportpower en0 off
networksetup -setairportpower en0 on

# Windows - Disable network adapter via PowerShell
Disable-NetAdapter -Name "Ethernet"
Enable-NetAdapter -Name "Ethernet"
```

#### Browser API for Testing
```javascript
// Simulate offline mode programmatically
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false
});

// Trigger offline event
window.dispatchEvent(new Event('offline'));

// Back online
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});
window.dispatchEvent(new Event('online'));
```

### Database Setup

```sql
-- Verify schema is up to date
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'lists', 'list_members', 'grocery_items', 'conflict_history');

-- Clean test data before each run
DELETE FROM grocery_items WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'Offline Test%'
);
DELETE FROM list_members WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'Offline Test%'
);
DELETE FROM lists WHERE name LIKE 'Offline Test%';

-- Create test list with shared access
INSERT INTO lists (id, name, owner_id, created_at, updated_at) VALUES
  ('offline-test-list-1', 'Offline Test List', 'alice-user-id', NOW(), NOW());

INSERT INTO list_members (list_id, user_id, permission_level, joined_at) VALUES
  ('offline-test-list-1', 'alice-user-id', 'owner', NOW()),
  ('offline-test-list-1', 'bob-user-id', 'editor', NOW()),
  ('offline-test-list-1', 'carol-user-id', 'editor', NOW());
```

### Test Data Script

Create a script to populate test items:

```javascript
// test-data-setup.js
const testItems = [
  { name: 'Milk', quantity: 2, category: 'Dairy', gotten: false },
  { name: 'Bread', quantity: 1, category: 'Bakery', gotten: false },
  { name: 'Apples', quantity: 5, category: 'Produce', gotten: false },
  { name: 'Cheese', quantity: 1, category: 'Dairy', gotten: true },
  { name: 'Eggs', quantity: 12, category: 'Dairy', gotten: false }
];

async function setupTestData(zero, listId) {
  for (const item of testItems) {
    await zero.mutate.grocery_items.create({
      id: crypto.randomUUID(),
      list_id: listId,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      gotten: item.gotten,
      created_at: Date.now(),
      updated_at: Date.now()
    });
  }
}
```

---

## Offline Architecture

### How Offline Mode Works

```
┌─────────────┐                           ┌──────────────┐
│  Browser    │    Network Disconnect     │   Zero       │
│  (Client)   │◄────────────────────────X │   Server     │
└─────────────┘                           └──────────────┘
      │                                           │
      │ User makes changes                        │
      │ (add, edit, delete)                       │
      ▼                                           │
┌─────────────┐                                   │
│  IndexedDB  │                                   │
│  Mutation   │                                   │
│   Queue     │                                   │
└─────────────┘                                   │
      │                                           │
      │ Network Reconnect                         │
      ▼                                           ▼
┌─────────────┐    Process Queue            ┌──────────────┐
│  Zero SDK   │─────────────────────────────►│   Zero       │
│             │    Sync Mutations            │   Server     │
└─────────────┘◄─────────────────────────────└──────────────┘
      │                                           │
      │ Conflict Detection                        │
      ▼                                           ▼
┌─────────────┐                           ┌──────────────┐
│  Conflict   │                           │  PostgreSQL  │
│  Resolution │                           │   Database   │
│   Modal     │                           └──────────────┘
└─────────────┘
```

### Offline Mutation Flow

```
1. User goes offline (network disconnected)
   └─► navigator.onLine = false
   └─► Zero detects disconnection

2. User adds item "Cheese" while offline
   └─► zero.mutate.grocery_items.create({ ... })
   └─► Mutation queued in IndexedDB (pending state)
   └─► UI updates optimistically (shows item immediately with "syncing" badge)

3. User edits another item "Milk" while offline
   └─► zero.mutate.grocery_items.update({ id, quantity: 3 })
   └─► Another mutation queued
   └─► UI shows both pending mutations

4. Browser comes back online
   └─► navigator.onLine = true
   └─► Zero reconnects WebSocket automatically
   └─► Offline indicator changes to "syncing"

5. Zero processes mutation queue
   └─► Sends mutations to server in order
   └─► Server applies changes to PostgreSQL
   └─► Server checks for conflicts

6. Conflict resolution (if needed)
   └─► Server detects concurrent edit on "Milk"
   └─► Returns conflict data to client
   └─► Client shows conflict resolution modal
   └─► User chooses resolution
   └─► Final state syncs to all clients
```

### IndexedDB Structure for Offline Queue

```javascript
// IndexedDB Schema
{
  mutations: {
    keyPath: 'id',
    indexes: ['timestamp', 'status', 'itemId']
  },
  items: [
    {
      id: 'mutation-uuid-1',
      type: 'create' | 'update' | 'delete',
      table: 'grocery_items',
      itemId: 'item-uuid',
      data: { name: 'Cheese', quantity: 1, ... },
      timestamp: 1698765432000,
      status: 'pending' | 'syncing' | 'synced' | 'conflict',
      retryCount: 0,
      error: null
    },
    // ... more queued mutations
  ]
}
```

---

## Basic Conflict Detection Tests

### Test CD-1: No Conflict - Different Items Edited [P0]

**Objective**: Verify no conflict when users edit different items

**Setup**:
- Alice and Bob both have "Offline Test List" open
- List contains: "Milk", "Bread", "Apples"

**Test Steps**:
1. **Browser A (Alice)**: Go offline via DevTools
2. **Browser A**: Edit "Milk" - change quantity from 2 to 3
3. **Browser B (Bob)**: While online, edit "Bread" - change quantity from 1 to 2
4. **Browser A**: Go back online
5. **Observe both browsers**

**Expected Results**:
- No conflict detected
- Both changes apply successfully
- Alice's view shows: Milk (qty: 3), Bread (qty: 2)
- Bob's view shows: Milk (qty: 3), Bread (qty: 2)
- Sync completes within 2 seconds
- No conflict modal appears

**Verification**:
```sql
SELECT name, quantity FROM grocery_items
WHERE name IN ('Milk', 'Bread')
ORDER BY name;
-- Expected:
-- Milk, 3
-- Bread, 2
```

**Success Criteria**:
- ✅ No conflict detected
- ✅ Both edits preserved
- ✅ Data consistent across all clients
- ✅ No user intervention required

---

### Test CD-2: No Conflict - Different Fields on Same Item [P0]

**Objective**: Verify field-level merge when editing different fields

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Edit "Apples" - change quantity from 5 to 8
3. **Browser B (Bob)**: While online, edit "Apples" - add note "Get organic"
4. **Browser A**: Go back online

**Expected Results**:
- No conflict modal appears
- Automatic field-level merge occurs
- Final state: Apples, quantity: 8, notes: "Get organic"
- Both changes preserved
- Sync indicator shows success

**Conflict Resolution Logic**:
```javascript
// Server-side merge logic
const merged = {
  ...serverVersion,  // Start with server version
  ...clientChanges   // Apply only changed fields from client
};
// Result: quantity from client (8), notes from server ("Get organic")
```

**Success Criteria**:
- ✅ Automatic merge succeeds
- ✅ Both field changes preserved
- ✅ No data loss
- ✅ No user prompt

---

### Test CD-3: Conflict Detected - Same Field Edited [P0]

**Objective**: Verify conflict detection for same field edits

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Edit "Milk" quantity from 2 to 5
3. **Browser B (Bob)**: While online, edit "Milk" quantity from 2 to 3
4. **Browser B**: Save (server now has quantity: 3)
5. **Browser A**: Go back online

**Expected Results**:
- Conflict detected
- Zero detects version mismatch
- **Automatic resolution**: Last write wins (Alice's 5 wins because it synced last)
- Final quantity: 5
- Alice sees success, Bob sees update from Alice
- No manual intervention required (simple field conflict)

**Note**: For critical conflicts, may show conflict modal depending on conflict resolution strategy

**Verification**:
```javascript
// Check conflict resolution
const item = await zero.query.grocery_items
  .where('name', 'Milk')
  .first();
console.log('Final quantity:', item.quantity); // Should be 5
```

**Success Criteria**:
- ✅ Conflict detected
- ✅ Resolution applied (last-write-wins)
- ✅ All clients eventually consistent
- ✅ Sync completes successfully

---

### Test CD-4: Update vs Delete Conflict [P0]

**Objective**: Verify conflict when one user updates, another deletes

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Edit "Bread" - change quantity to 3, add note "Whole wheat"
3. **Browser B (Bob)**: While online, delete "Bread"
4. **Browser A**: Go back online

**Expected Results**:
- **Conflict detected**: Update vs Delete
- **Manual resolution required**
- Conflict modal appears showing:
  - "Item was deleted by Bob Smith"
  - "You made changes while offline"
  - Options: "Restore My Changes" or "Keep Deleted"
- User must choose resolution
- Based on choice:
  - Restore: Item reappears with Alice's changes
  - Keep Deleted: Alice's changes discarded

**Conflict Modal Content**:
```
╔════════════════════════════════════════╗
║  Conflict: Item Deleted                ║
╠════════════════════════════════════════╣
║                                        ║
║  The item "Bread" was deleted by       ║
║  Bob Smith while you were offline.     ║
║                                        ║
║  Your Changes:                         ║
║  • Quantity: 3                         ║
║  • Note: "Whole wheat"                 ║
║                                        ║
║  ┌────────────────┐  ┌──────────────┐ ║
║  │ Restore Item   │  │ Keep Deleted │ ║
║  └────────────────┘  └──────────────┘ ║
╚════════════════════════════════════════╝
```

**Success Criteria**:
- ✅ Conflict detected correctly
- ✅ Modal appears with clear options
- ✅ User choice is respected
- ✅ Final state syncs to all clients

---

### Test CD-5: Delete vs Update Conflict [P0]

**Objective**: Verify conflict when one user deletes, another updates

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Delete "Cheese"
3. **Browser B (Bob)**: While online, edit "Cheese" - mark as not gotten, change quantity to 2
4. **Browser A**: Go back online

**Expected Results**:
- Conflict detected
- Conflict modal shows:
  - "You tried to delete this item"
  - "Bob Smith made changes"
  - Shows Bob's changes
  - Options: "Delete Anyway" or "Keep Changes"
- User chooses resolution
- Result syncs to all clients

**Success Criteria**:
- ✅ Conflict detected
- ✅ Both versions shown clearly
- ✅ User can make informed decision
- ✅ Resolution applies correctly

---

### Test CD-6: Delete vs Delete - No Conflict [P1]

**Objective**: Verify no conflict when both users delete same item

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Delete "Eggs"
3. **Browser B (Bob)**: While online, delete "Eggs"
4. **Browser A**: Go back online

**Expected Results**:
- No conflict detected
- Item already deleted on server
- Alice's delete operation is idempotent (no-op)
- Success message: "Item already deleted"
- No modal appears
- Item remains deleted

**Success Criteria**:
- ✅ No conflict modal
- ✅ Item deleted on all clients
- ✅ No error shown
- ✅ Graceful handling

---

### Test CD-7: Multiple Users Edit Same Item [P0]

**Objective**: Verify conflict with 3+ users editing same item

**Test Steps**:
1. **Browser A (Alice)**: Go offline, edit "Milk" quantity to 5
2. **Browser B (Bob)**: While online, edit "Milk" quantity to 3
3. **Browser C (Carol)**: While online, edit "Milk" category to "Beverages"
4. **Browser A**: Go back online

**Expected Results**:
- Alice's change conflicts with Bob's (same field)
- Carol's change doesn't conflict (different field)
- Final state after resolution:
  - Quantity: 5 (Alice's change, last write)
  - Category: "Beverages" (Carol's change, merged)
- Conflict resolution applied
- All clients sync to same final state

**Success Criteria**:
- ✅ Correct conflict detection
- ✅ Field-level merge where possible
- ✅ Last-write-wins for conflicting fields
- ✅ All clients eventually consistent

---

### Test CD-8: Rapid Sequential Edits [P1]

**Objective**: Verify conflict detection with rapid edits

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Edit "Apples" quantity to 5
3. **Browser A**: Wait 1 second
4. **Browser A**: Edit "Apples" quantity to 6
5. **Browser A**: Wait 1 second
6. **Browser A**: Edit "Apples" quantity to 7
7. **Browser B (Bob)**: While online, edit "Apples" quantity to 10
8. **Browser A**: Go back online

**Expected Results**:
- Only latest offline change (7) conflicts with online change (10)
- Intermediate changes (5, 6) are not considered
- Last write wins: 7 (Alice's most recent)
- Mutations are coalesced in queue
- Only one conflict resolution needed

**Success Criteria**:
- ✅ Mutation coalescing works
- ✅ Only latest conflict detected
- ✅ Efficient queue processing
- ✅ Correct final state

---

### Test CD-9: Conflicting Notes Concatenation [P1]

**Objective**: Verify notes are concatenated on conflict

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Edit "Bread" notes to "Get whole wheat"
3. **Browser B (Bob)**: While online, edit "Bread" notes to "From bakery section"
4. **Browser A**: Go back online

**Expected Results**:
- Both notes merged automatically
- Final notes: "From bakery section\n---\nGet whole wheat"
- Or: Shows conflict modal with option to concatenate or choose one
- Separator clearly divides the two notes
- Both users' input is preserved

**Auto-Merge Logic**:
```javascript
// Automatic note merge
if (clientNotes !== serverNotes && bothHaveNotes) {
  merged.notes = `${serverNotes}\n---\n${clientNotes}`;
}
```

**Success Criteria**:
- ✅ Both notes preserved
- ✅ Clear separation between notes
- ✅ User informed of merge
- ✅ Can edit merged notes afterward

---

### Test CD-10: Category Conflict [P1]

**Objective**: Verify category conflict handling

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Change "Cheese" category from "Dairy" to "Deli"
3. **Browser B (Bob)**: While online, change "Cheese" category to "Snacks"
4. **Browser A**: Go back online

**Expected Results**:
- Conflict detected (same field)
- Automatic resolution: Last write wins
- Final category: "Deli" (Alice's, last synced)
- Or: Show conflict modal if significant difference
- Bob sees update from Alice

**Success Criteria**:
- ✅ Conflict resolved
- ✅ One category chosen
- ✅ All clients consistent
- ✅ No data loss

---

### Test CD-11: Gotten Status Conflict - Prefer Gotten [P0]

**Objective**: Verify "gotten" status takes precedence

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Mark "Milk" as gotten
3. **Browser B (Bob)**: While online, mark "Milk" as not gotten
4. **Browser A**: Go back online

**Expected Results**:
- Conflict detected
- **Automatic resolution**: Prefer gotten status
- Final state: gotten = true
- Rationale: Once item is marked as purchased, keep it that way
- No modal needed (automatic rule)

**Resolution Rule**:
```javascript
// Prefer gotten status
if (clientGotten === true || serverGotten === true) {
  merged.gotten = true;
}
```

**Success Criteria**:
- ✅ Gotten status prioritized
- ✅ Automatic resolution
- ✅ Logical outcome
- ✅ All clients updated

---

### Test CD-12: No Conflict - Item Created While Offline [P0]

**Objective**: Verify new items don't conflict

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Add new item "Yogurt" (qty: 3, category: Dairy)
3. **Browser B (Bob)**: While online, working normally
4. **Browser A**: Go back online

**Expected Results**:
- No conflict (new item, unique ID)
- Item syncs to server successfully
- Bob sees "Yogurt" appear in list
- Sync indicator shows success
- Item persists in database

**Success Criteria**:
- ✅ No conflict detected
- ✅ Item syncs successfully
- ✅ Appears in all clients
- ✅ No errors

---

---

## Automatic Conflict Resolution Tests

### Test AR-1: Last-Write-Wins for Simple Field [P0]

**Objective**: Verify last-write-wins strategy for simple conflicts

**Test Steps**:
1. **Setup**: Item "Milk" with quantity 2
2. **Browser A (Alice)**: Go offline, change quantity to 5
3. **Browser B (Bob)**: While online, change quantity to 3
4. **Browser A**: Go back online (Alice's change syncs last)

**Expected Results**:
- Conflict detected on quantity field
- Automatic resolution: Last write wins
- Final quantity: 5 (Alice's value)
- No modal shown
- Both clients show quantity: 5
- Sync completes in < 2 seconds

**Server Logic**:
```javascript
// Conflict resolution
if (clientVersion.quantity !== serverVersion.quantity) {
  // Check timestamps
  if (clientMutation.timestamp > serverVersion.updated_at) {
    resolved.quantity = clientVersion.quantity; // Last write wins
  }
}
```

**Success Criteria**:
- ✅ Automatic resolution applied
- ✅ Last write (Alice) wins
- ✅ No user intervention
- ✅ Consistent final state

---

### Test AR-2: Prefer Gotten Status Rule [P0]

**Objective**: Verify gotten=true takes precedence

**Test Steps**:
1. **Setup**: Item "Bread" with gotten=false
2. **Browser A (Alice)**: Go offline, mark as gotten
3. **Browser B (Bob)**: While online, keep as not gotten (or change to false)
4. **Browser A**: Go back online

**Expected Results**:
- Conflict on gotten field
- **Automatic rule**: gotten=true wins
- Final state: gotten=true
- Rationale: Once purchased, keep purchased
- No modal needed

**Resolution Rule**:
```javascript
// Prefer gotten status
if (clientVersion.gotten === true || serverVersion.gotten === true) {
  resolved.gotten = true;
  resolved.gottenBy = clientVersion.gotten ? clientUserId : serverVersion.gottenBy;
}
```

**Success Criteria**:
- ✅ Gotten status preferred
- ✅ Automatic resolution
- ✅ Makes logical sense
- ✅ Consistent across clients

---

### Test AR-3: Quantity Merge - Sum Both Values [P1]

**Objective**: Verify quantity merging strategy (optional feature)

**Test Steps**:
1. **Setup**: Item "Apples" with quantity 3
2. **Browser A (Alice)**: Go offline, change to 5 (increase by 2)
3. **Browser B (Bob)**: While online, change to 6 (increase by 3)
4. **Browser A**: Go back online

**Expected Results**:
- Conflict on quantity
- **Option 1**: Last write wins → final: 5
- **Option 2**: Sum increases → final: 3 + 2 + 3 = 8
- **Option 3**: Show modal with both options

**If Implementing Sum Logic**:
```javascript
// Calculate delta from original
const aliceDelta = 5 - 3; // +2
const bobDelta = 6 - 3;   // +3
const merged = 3 + aliceDelta + bobDelta; // 8
```

**Success Criteria**:
- ✅ Conflict resolved intelligently
- ✅ No quantity lost
- ✅ Makes sense for shopping lists
- ✅ Consistent result

---

### Test AR-4: Notes Concatenation [P0]

**Objective**: Verify automatic notes merging

**Test Steps**:
1. **Setup**: Item "Cheese" with no notes
2. **Browser A (Alice)**: Go offline, add note "Sharp cheddar"
3. **Browser B (Bob)**: While online, add note "From deli counter"
4. **Browser A**: Go back online

**Expected Results**:
- Conflict on notes field
- Automatic concatenation
- Final notes:
  ```
  From deli counter
  ---
  Sharp cheddar
  ```
- Clear separator between notes
- Both contributions preserved

**Merge Logic**:
```javascript
function mergeNotes(serverNotes, clientNotes) {
  if (!serverNotes) return clientNotes;
  if (!clientNotes) return serverNotes;
  if (serverNotes === clientNotes) return serverNotes;

  return `${serverNotes}\n---\n${clientNotes}`;
}
```

**Success Criteria**:
- ✅ Both notes preserved
- ✅ Clear separation
- ✅ Automatic merge
- ✅ User can edit afterward

---

### Test AR-5: Field-Level Merge [P0]

**Objective**: Verify independent field merging

**Test Steps**:
1. **Setup**: Item "Milk" (qty: 2, category: Dairy, notes: "", gotten: false)
2. **Browser A (Alice)**: Go offline, change quantity to 3, add note "2% fat"
3. **Browser B (Bob)**: While online, change category to "Beverages", mark as gotten
4. **Browser A**: Go back online

**Expected Results**:
- No conflict (different fields)
- Automatic field-level merge
- Final state:
  - quantity: 3 (Alice)
  - category: "Beverages" (Bob)
  - notes: "2% fat" (Alice)
  - gotten: true (Bob)
- All changes preserved
- No modal needed

**Merge Logic**:
```javascript
// Merge only changed fields
const merged = {
  ...serverVersion,
  ...getChangedFields(clientVersion, originalVersion)
};
```

**Success Criteria**:
- ✅ All changes preserved
- ✅ No conflicts detected
- ✅ Efficient merge
- ✅ Correct final state

---

### Test AR-6: Name Change with Last-Write-Wins [P0]

**Objective**: Verify name field conflict resolution

**Test Steps**:
1. **Setup**: Item "Apples"
2. **Browser A (Alice)**: Go offline, rename to "Granny Smith Apples"
3. **Browser B (Bob)**: While online, rename to "Red Delicious Apples"
4. **Browser A**: Go back online

**Expected Results**:
- Conflict on name field
- Last write wins
- Final name: "Granny Smith Apples" (Alice's, synced last)
- Bob sees name update
- Automatic resolution

**Success Criteria**:
- ✅ Last write wins
- ✅ No modal needed
- ✅ Clear final state
- ✅ All clients updated

---

### Test AR-7: Category Change with Last-Write-Wins [P1]

**Objective**: Verify category conflict resolution

**Test Steps**:
1. **Setup**: Item "Cheese" (category: Dairy)
2. **Browser A (Alice)**: Go offline, change to "Snacks"
3. **Browser B (Bob)**: While online, change to "Deli"
4. **Browser A**: Go back online

**Expected Results**:
- Conflict on category
- Last write wins: "Snacks" (Alice)
- All clients show "Snacks"
- Automatic resolution

**Success Criteria**:
- ✅ Conflict resolved
- ✅ Last write applied
- ✅ Consistent state
- ✅ No user prompt

---

### Test AR-8: Multiple Field Merge with One Conflict [P0]

**Objective**: Verify partial merge with one conflicting field

**Test Steps**:
1. **Setup**: Item "Bread" (qty: 1, notes: "", category: Bakery)
2. **Browser A (Alice)**: Go offline, change qty to 2, add note "Whole wheat"
3. **Browser B (Bob)**: While online, change qty to 3, change category to "Grains"
4. **Browser A**: Go back online

**Expected Results**:
- Quantity conflict (both changed)
- Category and notes merge cleanly
- Final state:
  - quantity: 2 (Alice, last write)
  - notes: "Whole wheat" (Alice, no conflict)
  - category: "Grains" (Bob, no conflict)
- Partial automatic merge

**Success Criteria**:
- ✅ Non-conflicting fields merged
- ✅ Conflicting field uses last-write
- ✅ Efficient resolution
- ✅ No data loss

---

### Test AR-9: Timestamp-Based Resolution [P0]

**Objective**: Verify timestamp determines winner

**Test Steps**:
1. **Setup**: Item "Eggs" (qty: 12)
2. **Browser A (Alice)**: Go offline at 10:00:00, change qty to 6
3. **Browser B (Bob)**: Online, change qty to 18 at 10:00:30
4. **Browser A**: Go back online at 10:01:00

**Expected Results**:
- Alice's mutation has older timestamp (10:00:00)
- Bob's mutation has newer timestamp (10:00:30)
- Alice's sync attempt at 10:01:00 detects conflict
- **Last write wins**: Bob's 18 (newer timestamp)
- Alice sees her change overwritten
- Final quantity: 18

**Timestamp Logic**:
```javascript
if (clientMutation.timestamp < serverVersion.updated_at) {
  // Server version is newer, reject client mutation
  resolution = 'server_wins';
} else {
  // Client mutation is newer, accept it
  resolution = 'client_wins';
}
```

**Success Criteria**:
- ✅ Timestamp comparison correct
- ✅ Newer write wins
- ✅ No ambiguity
- ✅ Clear resolution

---

### Test AR-10: Empty String vs Null Handling [P2]

**Objective**: Verify handling of empty/null values

**Test Steps**:
1. **Setup**: Item "Milk" with notes: "Organic"
2. **Browser A (Alice)**: Go offline, clear notes (set to "")
3. **Browser B (Bob)**: While online, clear notes (set to null)
4. **Browser A**: Go back online

**Expected Results**:
- Both cleared notes (intent is the same)
- No conflict detected
- Final notes: "" or null (consistent)
- Treat empty string and null as equivalent
- Automatic resolution

**Equivalence Logic**:
```javascript
function areNotesEqual(notes1, notes2) {
  const n1 = notes1 || '';
  const n2 = notes2 || '';
  return n1 === n2;
}
```

**Success Criteria**:
- ✅ Empty values handled correctly
- ✅ No false conflicts
- ✅ Sensible behavior
- ✅ Consistent nulls/empties

---

### Test AR-11: Boolean Field Conflict [P1]

**Objective**: Verify boolean field resolution

**Test Steps**:
1. **Setup**: Item "Bread" with gotten=false
2. **Browser A (Alice)**: Go offline, set gotten=true
3. **Browser B (Bob)**: While online, set gotten=false (or leave unchanged)
4. **Browser A**: Go back online

**Expected Results**:
- Conflict on gotten field
- **Rule**: Prefer true (gotten=true wins)
- Final: gotten=true
- Automatic resolution

**Success Criteria**:
- ✅ Boolean conflict resolved
- ✅ Prefer true rule applied
- ✅ Makes logical sense
- ✅ No modal needed

---

### Test AR-12: Numeric Increment Merge [P2]

**Objective**: Verify smart numeric merging (advanced feature)

**Test Steps**:
1. **Setup**: Item "Apples" with quantity 10
2. **Browser A (Alice)**: Go offline, increment to 12 (+2)
3. **Browser B (Bob)**: While online, increment to 13 (+3)
4. **Browser A**: Go back online

**Expected Results**:
- Detect both are increments from base value
- **Smart merge**: Apply both deltas → 10 + 2 + 3 = 15
- Or: Last write wins → 12
- Depends on implementation strategy

**Smart Merge Logic**:
```javascript
// Track original value
const original = 10;
const aliceDelta = 12 - original; // +2
const bobDelta = 13 - original;   // +3
const smartMerged = original + aliceDelta + bobDelta; // 15
```

**Success Criteria**:
- ✅ Smart merge if implemented
- ✅ Or last-write-wins
- ✅ No lost increments
- ✅ Makes sense for quantities

---

---

## Manual Conflict Resolution Tests

### Test MR-1: Conflict Modal Opens [P0]

**Objective**: Verify conflict modal appears for complex conflicts

**Test Steps**:
1. **Setup**: Item "Cheese"
2. **Browser A (Alice)**: Go offline, edit name, quantity, notes
3. **Browser B (Bob)**: While online, delete item
4. **Browser A**: Go back online

**Expected Results**:
- Conflict detected: Update vs Delete
- Conflict modal opens automatically
- Modal shows:
  - Title: "Conflict Detected"
  - Description of conflict type
  - Alice's changes
  - Bob's action (deleted)
  - Resolution options
- Modal is modal (blocks other actions)
- Can't dismiss without choosing

**Modal Content**:
```
╔════════════════════════════════════════════╗
║         Conflict Detected                  ║
╠════════════════════════════════════════════╣
║                                            ║
║  The item "Cheese" was deleted by          ║
║  Bob Smith on [timestamp]                  ║
║                                            ║
║  You made these changes while offline:     ║
║  • Name: "Aged Cheddar"                    ║
║  • Quantity: 2                             ║
║  • Notes: "From specialty shop"            ║
║                                            ║
║  Choose how to resolve:                    ║
║                                            ║
║  ┌──────────────────┐  ┌────────────────┐ ║
║  │  Restore My Item │  │  Keep Deleted  │ ║
║  └──────────────────┘  └────────────────┘ ║
║                                            ║
╚════════════════════════════════════════════╝
```

**Success Criteria**:
- ✅ Modal appears
- ✅ Clear information displayed
- ✅ Options are obvious
- ✅ Can't proceed without choosing

---

### Test MR-2: Field-by-Field Selection [P1]

**Objective**: Verify granular field selection in modal

**Test Steps**:
1. **Setup**: Item "Milk" with multiple fields changed
2. **Browser A (Alice)**: Go offline, change qty to 3, add note "Organic"
3. **Browser B (Bob)**: While online, change qty to 5, change category to "Beverages"
4. **Browser A**: Go back online

**Expected Results**:
- Conflict modal shows field-by-field comparison
- Table/list showing:
  | Field | Your Value | Server Value | Choose |
  |-------|------------|--------------|--------|
  | Quantity | 3 | 5 | [Mine] [Theirs] |
  | Category | Dairy | Beverages | [Mine] [Theirs] |
  | Notes | "Organic" | "" | [Mine] [Theirs] |
- User can select per-field
- "Apply" button to confirm choices

**Advanced Modal**:
```
╔═════════════════════════════════════════════════╗
║         Resolve Conflict: Milk                  ║
╠═════════════════════════════════════════════════╣
║                                                 ║
║  Multiple fields were changed by both you       ║
║  and Bob Smith. Choose values for each:         ║
║                                                 ║
║  Quantity:                                      ║
║  ( ) 3 (Your value)                             ║
║  (•) 5 (Bob's value) ← Selected                 ║
║                                                 ║
║  Category:                                      ║
║  (•) Dairy (Your value) ← Selected              ║
║  ( ) Beverages (Bob's value)                    ║
║                                                 ║
║  Notes:                                         ║
║  (•) "Organic" (Your value) ← Selected          ║
║  ( ) (Empty) (Bob's value)                      ║
║                                                 ║
║  ┌─────────────┐  ┌───────────┐                ║
║  │   Apply     │  │  Cancel   │                ║
║  └─────────────┘  └───────────┘                ║
╚═════════════════════════════════════════════════╝
```

**Success Criteria**:
- ✅ All conflicts shown
- ✅ Can choose per field
- ✅ Preview updates
- ✅ Apply merges correctly

---

### Test MR-3: Quick Action - Use Mine [P0]

**Objective**: Verify "Use Mine" button

**Test Steps**:
1. **Setup**: Create conflict scenario
2. Conflict modal opens
3. Click "Use Mine" / "Keep My Changes"

**Expected Results**:
- All of Alice's changes are applied
- Server version is overwritten
- Modal closes
- Item updates to Alice's version
- Sync completes
- Bob sees Alice's changes

**Button Behavior**:
```javascript
function handleUseMine() {
  const resolution = {
    resolution: 'use_client',
    values: clientVersion
  };
  await zero.resolveConflict(conflictId, resolution);
  closeModal();
}
```

**Success Criteria**:
- ✅ One-click resolution
- ✅ Client version wins
- ✅ Modal closes
- ✅ Changes sync

---

### Test MR-4: Quick Action - Use Theirs [P0]

**Objective**: Verify "Use Theirs" button

**Test Steps**:
1. **Setup**: Create conflict scenario
2. Conflict modal opens
3. Click "Use Theirs" / "Use Server Version"

**Expected Results**:
- Server version is kept
- Alice's offline changes are discarded
- Modal closes
- Item keeps server state
- Alice sees server version

**Success Criteria**:
- ✅ One-click resolution
- ✅ Server version wins
- ✅ Client changes discarded
- ✅ Modal closes

---

### Test MR-5: Preview Updates Correctly [P0]

**Objective**: Verify real-time preview in conflict modal

**Test Steps**:
1. **Setup**: Conflict modal open with field selection
2. Toggle between "Mine" and "Theirs" for each field
3. Observe preview section

**Expected Results**:
- Preview updates in real-time
- Shows exactly what item will look like
- Updates as user toggles fields
- Preview is accurate representation
- No lag in preview updates

**Preview Section**:
```
╔═════════════════════════════════════════╗
║  Preview of Resolved Item:              ║
╠═════════════════════════════════════════╣
║                                         ║
║  Name: Milk                             ║
║  Quantity: 5 ← (Bob's value selected)   ║
║  Category: Dairy ← (Your value)         ║
║  Notes: "Organic" ← (Your value)        ║
║  Gotten: false                          ║
║                                         ║
╚═════════════════════════════════════════╝
```

**Success Criteria**:
- ✅ Preview updates instantly
- ✅ Reflects user choices
- ✅ Accurate representation
- ✅ Helps user decide

---

### Test MR-6: Apply Resolution [P0]

**Objective**: Verify applying manual resolution

**Test Steps**:
1. **Setup**: Conflict modal open
2. Select desired values for each field
3. Click "Apply" button

**Expected Results**:
- Modal closes
- Selected values are applied
- Item updates in UI
- Sync to server completes
- Other users see resolved version
- Success message shown

**Success Criteria**:
- ✅ Apply button works
- ✅ Resolution sent to server
- ✅ Item updates correctly
- ✅ Syncs to all clients

---

### Test MR-7: Cancel Conflict Resolution [P1]

**Objective**: Verify canceling conflict modal

**Test Steps**:
1. **Setup**: Conflict modal open
2. Click "Cancel" button or X to close

**Expected Results**:
- Modal closes
- **Behavior option 1**: Default to server version (safest)
- **Behavior option 2**: Re-queue conflict for later
- **Behavior option 3**: Keep offline change in pending state
- User is informed of choice made
- Can re-open conflict later from pending list

**Success Criteria**:
- ✅ Cancel works
- ✅ Clear what happens
- ✅ Can revisit conflict
- ✅ No data lost

---

### Test MR-8: Multiple Conflicts Queued [P0]

**Objective**: Verify handling multiple conflicts

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Edit "Milk", "Bread", "Cheese"
3. **Browser B (Bob)**: While online, delete all three items
4. **Browser A**: Go back online

**Expected Results**:
- 3 conflicts detected
- **Option 1**: Show conflicts one at a time
- **Option 2**: Show all conflicts in list, let user choose order
- **Option 3**: Show all in single modal with tabs
- User can resolve each conflict
- Progress indicator shows "Conflict 1 of 3"
- Can skip to next conflict

**Multiple Conflicts UI**:
```
╔════════════════════════════════════════╗
║  Conflicts Detected (3)                ║
╠════════════════════════════════════════╣
║                                        ║
║  [●] Milk - Update vs Delete           ║
║  [ ] Bread - Update vs Delete          ║
║  [ ] Cheese - Update vs Delete         ║
║                                        ║
║  Resolving: Milk (1 of 3)              ║
║  ───────────────────────────────────   ║
║                                        ║
║  [Conflict details here]               ║
║                                        ║
║  ┌────────┐  ┌────────┐  ┌──────────┐ ║
║  │ Apply  │  │ Skip   │  │ Skip All │ ║
║  └────────┘  └────────┘  └──────────┘ ║
╚════════════════════════════════════════╝
```

**Success Criteria**:
- ✅ All conflicts detected
- ✅ Clear count shown
- ✅ Can resolve one by one
- ✅ Progress indicator
- ✅ Can skip conflicts

---

### Test MR-9: Conflict History Tracking [P2]

**Objective**: Verify conflicts are logged

**Test Steps**:
1. Resolve several conflicts
2. Check conflict history log

**Expected Results**:
- Conflicts stored in database
- Log includes:
  - Timestamp
  - Item involved
  - Users involved
  - Conflict type
  - Resolution chosen
  - Who resolved it
- Can view past conflicts
- Useful for debugging

**Database Query**:
```sql
SELECT * FROM conflict_history
WHERE list_id = 'list-id'
ORDER BY created_at DESC
LIMIT 10;
```

**Success Criteria**:
- ✅ Conflicts logged
- ✅ Complete information
- ✅ Accessible to admins
- ✅ Helps debugging

---

### Test MR-10: Conflict on Recently Created Item [P1]

**Objective**: Verify conflict on item created offline

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Create item "Butter" with ID "uuid-123"
3. **Browser B (Bob)**: While online, by chance create item with same ID (very rare)
4. **Browser A**: Go back online

**Expected Results**:
- UUID collision detected (extremely rare)
- Conflict modal shows both items
- User can:
  - Keep both (assign new ID to one)
  - Merge into one item
  - Delete one
- Resolution prevents duplicate IDs

**Success Criteria**:
- ✅ Rare edge case handled
- ✅ No duplicate IDs
- ✅ User can resolve
- ✅ Data integrity maintained

---

### Test MR-11: Conflict with Stale Data [P1]

**Objective**: Verify handling when client data is very old

**Test Steps**:
1. **Browser A (Alice)**: Go offline at 9:00 AM
2. **Browser B (Bob)**: Make 10 edits to "Milk" between 9:00 AM - 5:00 PM
3. **Browser A**: Come back online at 5:00 PM, try to edit

**Expected Results**:
- Client version is very stale
- Conflict modal shows:
  - "Your version is 8 hours old"
  - "Server has been updated 10 times since"
  - Recommend using server version
- User can still choose
- Warning about staleness

**Success Criteria**:
- ✅ Staleness detected
- ✅ User warned
- ✅ Can still choose
- ✅ Informed decision

---

### Test MR-12: Accessibility in Conflict Modal [P2]

**Objective**: Verify modal is accessible

**Test Steps**:
1. Open conflict modal
2. Test with keyboard navigation
3. Test with screen reader

**Expected Results**:
- Modal is keyboard accessible
- Tab order is logical
- Focus trapped in modal
- Esc key closes modal
- Screen reader announces conflict
- ARIA labels present
- Buttons have clear labels

**Accessibility Checklist**:
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] ARIA attributes present
- [ ] Screen reader friendly
- [ ] High contrast mode works
- [ ] Keyboard shortcuts documented

**Success Criteria**:
- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard accessible
- ✅ Screen reader works
- ✅ Focus management correct

---

---

## Offline Queue Tests

### Test OQ-1: Add Items While Offline [P0]

**Objective**: Verify items can be added offline

**Test Steps**:
1. **Browser A (Alice)**: Login and select list
2. **Browser A**: Go offline via DevTools
3. **Browser A**: Add 3 items:
   - "Yogurt" (qty: 3, category: Dairy)
   - "Crackers" (qty: 2, category: Snacks)
   - "Juice" (qty: 1, category: Beverages)
4. **Observe UI**

**Expected Results**:
- Items appear immediately in list (optimistic UI)
- Items show "syncing" or "pending" badge
- Items have subtle visual indicator (e.g., opacity, icon)
- Items are interactive (can edit, delete)
- IndexedDB contains mutation queue with 3 create operations
- Offline indicator visible in UI

**IndexedDB Verification**:
```javascript
// Check mutation queue
const mutations = await getMutationsFromIndexedDB();
console.log('Queued mutations:', mutations);
// Expected: 3 create operations with status: 'pending'
```

**Success Criteria**:
- ✅ All 3 items added locally
- ✅ Optimistic UI works
- ✅ Items have pending indicator
- ✅ Queue persisted in IndexedDB

---

### Test OQ-2: Update Items While Offline [P0]

**Objective**: Verify items can be edited offline

**Test Steps**:
1. **Browser A (Alice)**: Offline mode
2. **Browser A**: Edit existing item "Milk":
   - Change quantity from 2 to 4
   - Add note "Low fat"
   - Change category to "Beverages"
3. **Browser A**: Edit "Bread":
   - Mark as gotten

**Expected Results**:
- Changes apply immediately in UI
- Items show pending status
- 2 update mutations queued
- Can undo changes before syncing
- IndexedDB queue has 2 update operations

**Success Criteria**:
- ✅ Edits work offline
- ✅ Changes persist locally
- ✅ Queue updated correctly
- ✅ UI reflects changes

---

### Test OQ-3: Delete Items While Offline [P0]

**Objective**: Verify items can be deleted offline

**Test Steps**:
1. **Browser A (Alice)**: Offline mode
2. **Browser A**: Delete 2 items:
   - Delete "Cheese"
   - Delete "Eggs"
3. **Observe UI and queue**

**Expected Results**:
- Items disappear from list immediately
- Can undo deletion before syncing
- 2 delete mutations queued in IndexedDB
- Deleted items marked as pending_delete
- Items removed from local cache

**Success Criteria**:
- ✅ Deletions work offline
- ✅ UI updates immediately
- ✅ Queue has delete operations
- ✅ Can be undone

---

### Test OQ-4: Queue Persistence Across Page Refresh [P0]

**Objective**: Verify queue survives page reload

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Add item "Butter"
3. **Browser A**: Edit item "Milk"
4. **Browser A**: Delete item "Cheese"
5. **Browser A**: Refresh page (F5)
6. **Observe state after reload**

**Expected Results**:
- All 3 mutations still in queue
- Items show correct state:
  - "Butter" appears (create)
  - "Milk" shows edited values (update)
  - "Cheese" is absent (delete)
- Pending indicators still visible
- Still offline
- Queue count accurate

**IndexedDB Persistence**:
```javascript
// After reload
const queue = await getMutationsFromIndexedDB();
console.log('Mutations after reload:', queue.length); // Should be 3
```

**Success Criteria**:
- ✅ Queue persists
- ✅ State consistent
- ✅ No data loss
- ✅ UI correct after reload

---

### Test OQ-5: Queue Processing When Online [P0]

**Objective**: Verify queue processes when connection restored

**Test Steps**:
1. **Browser A (Alice)**: Has 5 mutations queued offline
2. **Browser A**: Go back online
3. **Observe queue processing**

**Expected Results**:
- Automatic queue processing starts
- Mutations sent to server in order
- Progress indicator shows "Syncing X of Y"
- Items' pending badges change to success checkmarks
- Queue empties as mutations succeed
- Sync completes within 5 seconds for 5 mutations
- Success message: "Synced 5 changes"

**Processing Flow**:
```
Queue: [create, update, update, delete, create]
  ↓
Processing: create (1/5) → Success
Processing: update (2/5) → Success
Processing: update (3/5) → Success
Processing: delete (4/5) → Success
Processing: create (5/5) → Success
  ↓
Queue empty, all synced ✓
```

**Success Criteria**:
- ✅ Queue processes automatically
- ✅ All mutations sync
- ✅ Order preserved
- ✅ UI updates correctly
- ✅ Success feedback shown

---

### Test OQ-6: Retry Failed Mutations [P0]

**Objective**: Verify failed mutations are retried

**Test Steps**:
1. **Browser A (Alice)**: Offline, add item "Test"
2. **Browser A**: Go online, but simulate server error (e.g., 500)
3. **Observe retry behavior**

**Expected Results**:
- Mutation fails first attempt
- Automatic retry after delay (exponential backoff)
- Retry attempts: 0s, 2s, 4s, 8s, 16s, 32s
- Max retries: 5 attempts
- If all fail: Keep in queue with error state
- Show error indicator on item
- User can manually retry

**Retry Logic**:
```javascript
async function processMutation(mutation, retryCount = 0) {
  try {
    await sendToServer(mutation);
    markAsSynced(mutation);
  } catch (error) {
    if (retryCount < 5) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      setTimeout(() => processMutation(mutation, retryCount + 1), delay);
    } else {
      markAsFailed(mutation, error);
    }
  }
}
```

**Success Criteria**:
- ✅ Automatic retry works
- ✅ Exponential backoff applied
- ✅ Max retries enforced
- ✅ Failed mutations flagged
- ✅ User can manually retry

---

### Test OQ-7: Queue Prioritization [P1]

**Objective**: Verify mutations processed in correct order

**Test Steps**:
1. **Browser A (Alice)**: Offline, perform operations:
   - Create item "A"
   - Update item "A" (change quantity)
   - Create item "B"
   - Delete item "A"
   - Create item "C"
2. **Browser A**: Go online

**Expected Results**:
- Queue processes in order:
  1. Create "A"
  2. Update "A" (change quantity)
  3. Create "B"
  4. Delete "A" (cancels create + update)
  5. Create "C"
- Optimization: Create + Delete can cancel out
- Final result: Only "B" and "C" exist
- "A" never syncs to server (optimized away)

**Queue Optimization**:
```javascript
// Optimize queue before syncing
function optimizeQueue(mutations) {
  const optimized = [];
  const itemOps = {};

  for (const mutation of mutations) {
    const itemId = mutation.itemId;
    if (!itemOps[itemId]) itemOps[itemId] = [];
    itemOps[itemId].push(mutation);
  }

  // For each item, combine or cancel operations
  for (const itemId in itemOps) {
    const ops = itemOps[itemId];
    const final = combineOperations(ops); // Create + Delete = no-op
    if (final) optimized.push(final);
  }

  return optimized;
}
```

**Success Criteria**:
- ✅ Order preserved
- ✅ Optimization works
- ✅ Redundant ops removed
- ✅ Correct final state

---

### Test OQ-8: Conflict During Queue Processing [P0]

**Objective**: Verify conflict handling during queue sync

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit "Milk" quantity to 5
2. **Browser B (Bob)**: While online, edit "Milk" quantity to 3
3. **Browser A**: Go online, queue processes

**Expected Results**:
- Queue processing starts
- Conflict detected during sync
- Queue processing pauses
- Conflict modal appears
- User resolves conflict
- Queue processing resumes
- Remaining mutations process

**Success Criteria**:
- ✅ Conflict detected during processing
- ✅ Queue pauses gracefully
- ✅ User can resolve
- ✅ Processing resumes after resolution

---

### Test OQ-9: Large Queue Processing [P1]

**Objective**: Verify handling of large mutation queues

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Add 50 items rapidly
3. **Browser A**: Edit 20 items
4. **Browser A**: Delete 10 items
5. **Browser A**: Go online

**Expected Results**:
- 80 mutations queued
- Processing starts automatically
- Progress indicator: "Syncing 15 of 80..."
- Batching: Send multiple mutations per request
- Processing completes in < 30 seconds
- No UI freeze or lag
- All mutations succeed
- Final state is correct

**Batching Strategy**:
```javascript
// Process in batches for efficiency
const BATCH_SIZE = 10;
async function processQueue(mutations) {
  for (let i = 0; i < mutations.length; i += BATCH_SIZE) {
    const batch = mutations.slice(i, i + BATCH_SIZE);
    await sendBatch(batch);
    updateProgress(i + batch.length, mutations.length);
  }
}
```

**Success Criteria**:
- ✅ Large queue handled
- ✅ Efficient batching
- ✅ UI responsive
- ✅ All mutations sync
- ✅ Progress shown

---

### Test OQ-10: Queue Persistence Across Login/Logout [P2]

**Objective**: Verify queue survives auth changes

**Test Steps**:
1. **Browser A (Alice)**: Offline, add 5 items
2. **Browser A**: Logout while offline
3. **Browser A**: Login again as Alice
4. **Browser A**: Go online

**Expected Results**:
- Queue persists across logout (tied to user)
- After re-login, queue is loaded
- Mutations process normally
- All 5 items sync
- No data loss

**Success Criteria**:
- ✅ Queue persists
- ✅ User-specific queues
- ✅ No data loss on logout
- ✅ Syncs after re-login

---

### Test OQ-11: Mixed Create/Update/Delete Queue [P0]

**Objective**: Verify complex queue operations

**Test Steps**:
1. **Browser A (Alice)**: Offline
2. **Browser A**: Perform complex operations:
   - Add "Yogurt"
   - Add "Crackers"
   - Edit "Yogurt" (mark as gotten)
   - Add "Juice"
   - Delete "Crackers"
   - Edit "Milk" (existing item)
3. **Browser A**: Go online

**Expected Results**:
- 6 mutations queued (or optimized to 4):
  - Create Yogurt + Update Yogurt = Create with gotten=true
  - Create Crackers + Delete Crackers = no-op
  - Create Juice
  - Update Milk
- Queue processes correctly
- Final state:
  - Yogurt exists (gotten=true)
  - Crackers doesn't exist
  - Juice exists
  - Milk updated
- Optimization reduces network calls

**Success Criteria**:
- ✅ Complex queue handled
- ✅ Optimization works
- ✅ Correct final state
- ✅ Efficient processing

---

### Test OQ-12: Queue Status Visibility [P0]

**Objective**: Verify queue status is visible to user

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Add 3 items, edit 2, delete 1
3. **Observe UI**

**Expected Results**:
- Pending changes counter: "6 changes pending"
- Offline indicator with count
- Items have pending badges
- Can view queue details
- Show "Sync Now" button (disabled while offline)

**Queue Status UI**:
```
╔═══════════════════════════════════╗
║  Offline Mode                     ║
║  6 changes pending sync           ║
║                                   ║
║  • 3 items added                  ║
║  • 2 items updated                ║
║  • 1 item deleted                 ║
║                                   ║
║  Changes will sync when online    ║
╚═══════════════════════════════════╝
```

**Success Criteria**:
- ✅ Queue count visible
- ✅ Breakdown shown
- ✅ Clear messaging
- ✅ User understands state

---

### Test OQ-13: Clear Queue Option [P2]

**Objective**: Verify user can clear pending changes

**Test Steps**:
1. **Browser A (Alice)**: Offline with 10 pending changes
2. **Browser A**: Click "Discard Pending Changes"
3. **Confirm action**

**Expected Results**:
- Confirmation dialog appears
- Warning: "This will discard 10 pending changes. This cannot be undone."
- If confirmed:
  - Queue is cleared
  - Local changes reverted
  - Items return to last synced state
  - Pending indicators removed

**Use Case**: User made mistakes offline, wants to start fresh

**Success Criteria**:
- ✅ Clear queue option available
- ✅ Confirmation required
- ✅ Queue cleared correctly
- ✅ State reverted

---

### Test OQ-14: Queue Conflict on Create Then Update [P1]

**Objective**: Verify conflict on item created offline

**Test Steps**:
1. **Browser A (Alice)**: Offline, create "Butter" with ID "uuid-abc"
2. **Browser A**: Still offline, edit "Butter" quantity to 3
3. **Browser B (Bob)**: While online, create "Butter" with ID "uuid-xyz"
4. **Browser A**: Go online

**Expected Results**:
- Create syncs successfully (different IDs)
- Two items named "Butter" exist briefly
- Option 1: Allow duplicates (by design)
- Option 2: Detect duplicate names, show modal
- Update applies to Alice's "Butter"
- No conflict since different items

**Success Criteria**:
- ✅ Create syncs
- ✅ Update applies
- ✅ No ID collision
- ✅ Clear behavior

---

### Test OQ-15: Queue Priority for Critical Operations [P2]

**Objective**: Verify priority queue for urgent operations

**Test Steps**:
1. **Browser A (Alice)**: Offline with 20 pending operations
2. **Browser A**: Mark "Milk" as gotten (critical operation)
3. **Browser A**: Go online

**Expected Results**:
- Option: Priority queue for certain operations
- "Gotten" status syncs before other changes
- Or: All process in order (simpler)
- Clear behavior documented

**Success Criteria**:
- ✅ Priority logic clear
- ✅ Works as documented
- ✅ Critical ops prioritized (if feature exists)
- ✅ Queue processes correctly

---

---

## Sync Status Tests

### Test SS-1: Online Indicator [P0]

**Objective**: Verify online status is visible

**Test Steps**:
1. **Browser A (Alice)**: Login and ensure online
2. **Observe UI**

**Expected Results**:
- Online indicator visible (e.g., green dot, "Online" text)
- Connection status: "Connected"
- Last sync timestamp: "Synced 2 seconds ago"
- No pending changes shown
- Sync is active

**UI Element**:
```
┌─────────────────────────────┐
│ ● Online                    │
│ Last synced: 2s ago         │
└─────────────────────────────┘
```

**Success Criteria**:
- ✅ Online status visible
- ✅ Connection info clear
- ✅ Last sync shown
- ✅ No confusion

---

### Test SS-2: Offline Indicator [P0]

**Objective**: Verify offline status is visible

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Observe UI**

**Expected Results**:
- Offline indicator visible (e.g., red/gray dot, "Offline" text)
- Warning message: "You're offline. Changes will sync when reconnected."
- Pending changes count: "3 changes pending"
- Clear visual indication (banner, icon, color change)

**UI Element**:
```
╔═══════════════════════════════════════╗
║ ⚠ Offline Mode                        ║
║ Changes will sync when reconnected    ║
║ 3 changes pending                     ║
╚═══════════════════════════════════════╝
```

**Success Criteria**:
- ✅ Offline status clear
- ✅ Warning visible
- ✅ Pending count shown
- ✅ User understands state

---

### Test SS-3: Syncing Indicator [P0]

**Objective**: Verify syncing status is shown

**Test Steps**:
1. **Browser A (Alice)**: Go offline, make 5 changes
2. **Browser A**: Go online
3. **Observe syncing process**

**Expected Results**:
- Syncing indicator appears: "Syncing..." with spinner
- Progress shown: "Syncing 2 of 5 changes"
- Items show syncing badge while in progress
- After completion: "Synced ✓"
- Indicator auto-hides after 3 seconds

**UI During Sync**:
```
┌─────────────────────────────┐
│ ⟳ Syncing...                │
│ 2 of 5 changes              │
│ [████████░░] 40%            │
└─────────────────────────────┘
```

**Success Criteria**:
- ✅ Syncing status visible
- ✅ Progress shown
- ✅ Updates in real-time
- ✅ Auto-hides when done

---

### Test SS-4: Pending Count Accuracy [P0]

**Objective**: Verify pending counter is accurate

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Add 3 items, edit 2, delete 1
3. **Check pending count**

**Expected Results**:
- Pending count: "6 changes pending"
- Breakdown available:
  - 3 items added
  - 2 items updated
  - 1 item deleted
- Count updates live as user makes changes
- Count decreases as mutations sync

**Success Criteria**:
- ✅ Count accurate
- ✅ Updates live
- ✅ Breakdown correct
- ✅ Decrements on sync

---

### Test SS-5: Last Sync Timestamp [P0]

**Objective**: Verify last sync time is shown

**Test Steps**:
1. **Browser A (Alice)**: Make a change while online
2. **Observe last sync time**

**Expected Results**:
- Timestamp updates: "Last synced: just now"
- Updates to: "2s ago", "1m ago", "5m ago"
- Refreshes automatically
- Relative time is human-readable

**Timestamp Formats**:
- "just now" (< 5 seconds)
- "5s ago" (< 1 minute)
- "2m ago" (< 1 hour)
- "1h ago" (< 24 hours)
- "Yesterday at 3:45 PM" (< 7 days)
- "Jan 15 at 2:30 PM" (older)

**Success Criteria**:
- ✅ Timestamp shown
- ✅ Updates automatically
- ✅ Human-readable format
- ✅ Accurate time

---

### Test SS-6: Manual Retry Button [P0]

**Objective**: Verify manual sync retry button

**Test Steps**:
1. **Browser A (Alice)**: Offline with pending changes
2. **Browser A**: Go online but server is down
3. **Mutations fail to sync**
4. **Click "Retry Sync" button**

**Expected Results**:
- "Retry Sync" button appears when sync fails
- Clicking button triggers manual sync attempt
- Loading indicator during retry
- Success or error message after attempt
- Button disabled during retry

**Success Criteria**:
- ✅ Retry button available
- ✅ Manual sync works
- ✅ Feedback provided
- ✅ Button state managed

---

### Test SS-7: Auto-Hide Success Indicator [P1]

**Objective**: Verify success indicator auto-hides

**Test Steps**:
1. **Browser A (Alice)**: Sync changes successfully
2. **Observe success indicator**

**Expected Results**:
- Success message: "All changes synced ✓"
- Green checkmark or success color
- Message auto-hides after 3 seconds
- Doesn't block UI
- Smooth fade-out animation

**Success Criteria**:
- ✅ Success shown
- ✅ Auto-hides after delay
- ✅ Smooth animation
- ✅ Non-intrusive

---

### Test SS-8: Persistent Error Indicator [P0]

**Objective**: Verify error indicator stays visible

**Test Steps**:
1. **Browser A (Alice)**: Sync fails multiple times
2. **Observe error indicator**

**Expected Results**:
- Error indicator persists: "Sync failed ⚠"
- Does NOT auto-hide
- Shows error details on hover/click
- "Retry" button available
- Error icon in sync status area

**Error Details**:
```
╔═══════════════════════════════════════╗
║ ⚠ Sync Failed                         ║
║                                       ║
║ Failed to sync 3 changes:             ║
║ • Item "Milk" - Server error (500)    ║
║ • Item "Bread" - Network timeout      ║
║ • Item "Cheese" - Conflict detected   ║
║                                       ║
║ ┌─────────┐  ┌──────────────────┐    ║
║ │  Retry  │  │  View Details    │    ║
║ └─────────┘  └──────────────────┘    ║
╚═══════════════════════════════════════╝
```

**Success Criteria**:
- ✅ Error persists
- ✅ Details available
- ✅ Can retry
- ✅ Clear messaging

---

### Test SS-9: Connection Lost During Edit [P0]

**Objective**: Verify handling connection loss mid-edit

**Test Steps**:
1. **Browser A (Alice)**: Online, start editing "Milk"
2. **Browser A**: Lose connection while edit form is open
3. **Browser A**: Save changes

**Expected Results**:
- Connection loss detected
- Offline indicator appears
- Changes save locally
- Added to queue
- No error shown to user
- Edit completes successfully
- Will sync when reconnected

**Success Criteria**:
- ✅ Graceful degradation
- ✅ No data loss
- ✅ User informed
- ✅ Edit succeeds locally

---

### Test SS-10: Reconnection Notification [P0]

**Objective**: Verify user is notified of reconnection

**Test Steps**:
1. **Browser A (Alice)**: Offline with pending changes
2. **Browser A**: Go back online

**Expected Results**:
- Reconnection detected immediately
- Notification: "Back online! Syncing changes..."
- Sync status changes to "Syncing..."
- Progress shown
- Success notification: "All changes synced ✓"
- Auto-hide after 3 seconds

**Success Criteria**:
- ✅ Reconnection detected
- ✅ User notified
- ✅ Sync starts automatically
- ✅ Clear feedback

---

---

## Multi-User Offline Scenarios

### Test MU-1: Both Users Offline, Edit Same Item [P0]

**Objective**: Verify conflict when both users offline

**Test Steps**:
1. **Browser A (Alice)**: Go offline, edit "Milk" quantity to 5
2. **Browser B (Bob)**: Go offline, edit "Milk" quantity to 3
3. **Browser A**: Go back online first, syncs successfully
4. **Browser B**: Go back online, detects conflict

**Expected Results**:
- Alice syncs first: server has quantity 5
- Bob tries to sync: conflict detected
- Conflict modal shows for Bob
- Bob sees:
  - Your value: 3
  - Server value (Alice): 5
- Bob chooses resolution
- Final state syncs to both

**Success Criteria**:
- ✅ Both offline edits work
- ✅ Conflict detected
- ✅ Last to sync sees modal
- ✅ Resolution applied

---

### Test MU-2: User A Offline, User B Online [P0]

**Objective**: Verify mixed online/offline scenario

**Test Steps**:
1. **Browser A (Alice)**: Go offline, add "Yogurt"
2. **Browser B (Bob)**: While online, add "Crackers"
3. **Browser B**: Edit existing item "Milk"
4. **Browser A**: Go back online

**Expected Results**:
- Bob's changes ("Crackers", "Milk" edit) sync normally
- Alice comes online, sees Bob's changes
- Alice's "Yogurt" syncs to server
- No conflict (different items/operations)
- Both users see all items: Yogurt, Crackers, Milk (edited)

**Success Criteria**:
- ✅ Online user works normally
- ✅ Offline user syncs on reconnect
- ✅ No conflicts
- ✅ Final state consistent

---

### Test MU-3: Sequential Reconnection [P0]

**Objective**: Verify staggered reconnection handling

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit "Milk" to quantity 5
2. **Browser B (Bob)**: Offline, edit "Milk" to quantity 3
3. **Browser C (Carol)**: Offline, edit "Milk" to quantity 8
4. **Reconnect in order**: Alice → Bob → Carol

**Expected Results**:
1. Alice reconnects: Syncs quantity 5 successfully
2. Bob reconnects: Conflict with Alice's 5, resolves to 3 (last write)
3. Carol reconnects: Conflict with Bob's 3, resolves to 8 (last write)
4. Final quantity: 8 (Carol's value)
5. All clients eventually consistent

**Success Criteria**:
- ✅ Sequential conflicts handled
- ✅ Last write wins overall
- ✅ All clients sync
- ✅ Final state consistent

---

### Test MU-4: Multiple Conflicts Queued Across Users [P0]

**Objective**: Verify handling multiple cross-user conflicts

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit "Milk", "Bread", "Cheese"
2. **Browser B (Bob)**: Offline, edit same 3 items
3. **Browser C (Carol)**: Online, edit all 3 items
4. **Alice reconnects first**
5. **Bob reconnects second**

**Expected Results**:
- Alice's edits conflict with Carol's (online)
- 3 conflicts detected for Alice
- Alice resolves conflicts
- Bob's edits conflict with Alice's resolved state
- 3 more conflicts for Bob
- Bob resolves conflicts
- Final state: Last resolved values

**Success Criteria**:
- ✅ Multiple conflicts detected
- ✅ Per-user conflict resolution
- ✅ Order preserved
- ✅ All users eventually consistent

---

### Test MU-5: Conflict Resolution Propagation [P0]

**Objective**: Verify resolved conflicts sync to all users

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit "Milk"
2. **Browser B (Bob)**: Online, edit "Milk"
3. **Browser C (Carol)**: Online, viewing "Milk"
4. **Alice reconnects**
5. **Alice sees conflict modal, chooses "Use Mine"**

**Expected Results**:
- Alice's resolution syncs to server
- Bob sees update: "Milk" changes to Alice's value
- Carol sees update: "Milk" changes to Alice's value
- All clients show same final state
- Update propagates within 2 seconds

**Success Criteria**:
- ✅ Resolution syncs to server
- ✅ Other users receive update
- ✅ Real-time propagation
- ✅ All clients consistent

---

### Test MU-6: Simultaneous Reconnection [P1]

**Objective**: Verify handling simultaneous reconnection

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit "Milk" to 5
2. **Browser B (Bob)**: Offline, edit "Milk" to 3
3. **Both reconnect at same time** (within 100ms)

**Expected Results**:
- Server receives both sync requests nearly simultaneously
- Server processes in order received (race condition)
- One wins based on server-side timestamp/ordering
- The other detects conflict
- Loser sees conflict modal
- Resolution applied
- Final state consistent

**Success Criteria**:
- ✅ Race condition handled
- ✅ One request wins
- ✅ Other sees conflict
- ✅ Server determines order
- ✅ No data corruption

---

### Test MU-7: One User Deletes, Another Edits (Multi-User) [P0]

**Objective**: Verify delete vs edit across users

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit "Bread" extensively
2. **Browser B (Bob)**: Online, delete "Bread"
3. **Alice reconnects**

**Expected Results**:
- Alice tries to update item
- Server says item doesn't exist (404)
- Conflict detected: Update vs Delete
- Modal shows:
  - "Item was deleted by Bob"
  - "Your changes: [details]"
  - Options: "Restore" or "Keep Deleted"
- If restored: Item reappears with Alice's changes
- If kept deleted: Alice's changes discarded

**Success Criteria**:
- ✅ Conflict detected
- ✅ Modal shows options
- ✅ User can choose
- ✅ Resolution syncs

---

### Test MU-8: Three-Way Conflict [P1]

**Objective**: Verify 3+ user conflict handling

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit "Milk" to 5
2. **Browser B (Bob)**: Offline, edit "Milk" to 3
3. **Browser C (Carol)**: Online, edit "Milk" to 10
4. **Alice reconnects first**
5. **Bob reconnects second**

**Expected Results**:
- Carol's 10 is on server
- Alice reconnects: Conflict with Carol's 10
- Alice resolves: Say she chooses 5
- Server now has 5
- Bob reconnects: Conflict with Alice's 5 (not Carol's 10)
- Bob resolves: Say he chooses 3
- Final: 3 (last resolution)

**Success Criteria**:
- ✅ Multiple conflicts handled
- ✅ Sequential resolution
- ✅ Last resolution wins
- ✅ All users consistent

---

### Test MU-9: Offline User Misses Multiple Online Edits [P0]

**Objective**: Verify catching up after long offline period

**Test Steps**:
1. **Browser A (Alice)**: Go offline at 9 AM
2. **Browser B (Bob)**: 9 AM - 5 PM, makes 20 edits to various items
3. **Browser C (Carol)**: Also makes 15 edits
4. **Browser A (Alice)**: Reconnects at 5 PM

**Expected Results**:
- Alice's client is very stale
- On reconnect, Alice receives all 35 changes from Bob/Carol
- Alice's local changes (if any) are checked for conflicts
- Conflicts detected for items Alice edited
- Other items auto-update to latest server state
- Alice brought up to date

**Success Criteria**:
- ✅ Full sync on reconnect
- ✅ All server changes downloaded
- ✅ Conflicts detected for edited items
- ✅ Clean items auto-update
- ✅ No data loss

---

### Test MU-10: Permission Change While Offline [P1]

**Objective**: Verify handling permission change during offline period

**Test Steps**:
1. **Browser A (Alice)**: Offline as editor, makes changes
2. **Owner**: While Alice offline, changes Alice to viewer
3. **Browser A (Alice)**: Reconnects

**Expected Results**:
- Alice tries to sync edits
- Server rejects: "Insufficient permissions"
- Alice notified: "You no longer have edit access to this list"
- Alice's pending changes are blocked
- Alice can:
  - View changes that failed
  - Copy data out
  - Discard changes
- Alice's UI updates to viewer mode

**Success Criteria**:
- ✅ Permission change detected
- ✅ Sync blocked appropriately
- ✅ User informed
- ✅ UI updated to reflect new permission
- ✅ No data applied incorrectly

---

### Test MU-11: List Deleted While User Offline [P1]

**Objective**: Verify handling list deletion during offline

**Test Steps**:
1. **Browser A (Alice)**: Offline, making changes to "Shared List"
2. **Owner**: Delete "Shared List" while Alice is offline
3. **Browser A (Alice)**: Reconnects

**Expected Results**:
- Alice tries to sync changes
- Server returns: "List not found (404)"
- Alice notified: "This list was deleted by [Owner]"
- Alice's pending changes cannot sync
- Alice is redirected to default list
- Optionally: Offer to save changes to new list

**Success Criteria**:
- ✅ Deletion detected
- ✅ Sync blocked
- ✅ User informed
- ✅ Graceful handling
- ✅ Optional data recovery

---

### Test MU-12: Removed from List While Offline [P0]

**Objective**: Verify handling member removal during offline

**Test Steps**:
1. **Browser A (Alice)**: Offline as editor, makes changes
2. **Owner**: Remove Alice from list while she's offline
3. **Browser A (Alice)**: Reconnects

**Expected Results**:
- Alice tries to sync changes
- Server returns: "Forbidden (403)"
- Alice notified: "You were removed from this list"
- Alice's pending changes are blocked
- List disappears from Alice's dropdown
- Alice redirected to default list

**Success Criteria**:
- ✅ Removal detected
- ✅ Sync blocked
- ✅ User informed
- ✅ List access revoked
- ✅ Graceful redirect

---

### Test MU-13: Owner Transfers Ownership While Editor Offline [P2]

**Objective**: Verify ownership transfer during offline period

**Test Steps**:
1. **Browser A (Alice)**: Offline as editor
2. **Original Owner**: Transfer ownership to Alice
3. **Browser A (Alice)**: Reconnects

**Expected Results**:
- Alice's permission updated to owner
- On reconnect, permission syncs
- Alice's UI updates to show owner capabilities
- Alice can now manage members, delete list, etc.
- Alice's offline changes sync normally
- No issues with permission upgrade

**Success Criteria**:
- ✅ Ownership transfer syncs
- ✅ UI updates correctly
- ✅ New permissions apply
- ✅ No sync issues

---

### Test MU-14: Concurrent Different Item Edits (No Conflict) [P0]

**Objective**: Verify no conflicts when editing different items

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit "Milk"
2. **Browser B (Bob)**: Offline, edit "Bread"
3. **Browser C (Carol)**: Offline, edit "Cheese"
4. **All reconnect**

**Expected Results**:
- No conflicts detected (different items)
- All three edits sync successfully
- All users see all three changes
- Sync completes quickly (< 3 seconds)
- Success messages for all users

**Success Criteria**:
- ✅ No conflicts
- ✅ All edits succeed
- ✅ Fast sync
- ✅ All users consistent

---

### Test MU-15: Conflict Then Immediate Edit [P1]

**Objective**: Verify editing item immediately after resolving conflict

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit "Milk" to 5
2. **Browser B (Bob)**: Online, edit "Milk" to 3
3. **Browser A**: Reconnect, resolve conflict (choose 5)
4. **Browser A**: Immediately edit "Milk" to 7
5. **Observe sync behavior**

**Expected Results**:
- Conflict resolved: "Milk" = 5 syncs
- Alice's immediate edit to 7 queues normally
- Edit syncs successfully (no conflict)
- Final state: "Milk" = 7
- No issues with rapid edits after conflict

**Success Criteria**:
- ✅ Conflict resolved
- ✅ Immediate edit works
- ✅ No issues
- ✅ Final state correct

---

---

## Edge Cases

### Test EC-1: Rapid Online/Offline Switching [P0]

**Objective**: Verify handling rapid connection changes

**Test Steps**:
1. **Browser A (Alice)**: Toggle offline/online rapidly (10 times in 5 seconds)
2. **Browser A**: Make edits during switching
3. **Observe behavior**

**Expected Results**:
- Connection state updates correctly
- No errors or crashes
- Edits queued appropriately
- Sync happens when stable online
- No duplicate syncs
- Queue doesn't get corrupted

**Success Criteria**:
- ✅ No crashes
- ✅ State updates correctly
- ✅ Queue integrity maintained
- ✅ Syncs once stable

---

### Test EC-2: Very Long Offline Period [P0]

**Objective**: Verify handling extended offline time

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Wait 7 days**
3. **Browser A**: Make edits
4. **Browser A**: Go back online

**Expected Results**:
- Offline mode still works after 7 days
- Queue persisted correctly
- On reconnect, full sync occurs
- Stale data warnings shown
- Conflicts detected for edited items
- Successful sync (may take longer)

**Success Criteria**:
- ✅ Long offline handled
- ✅ Queue persisted
- ✅ Sync works
- ✅ User warned about staleness

---

### Test EC-3: Large Queue Sizes [P0]

**Objective**: Verify handling very large queues

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Add 200 items rapidly
3. **Browser A**: Edit 100 items
4. **Browser A**: Delete 50 items
5. **Browser A**: Go online

**Expected Results**:
- 350 mutations queued
- Queue persists in IndexedDB (within quota)
- Progress indicator: "Syncing 45 of 350..."
- Batching for efficiency
- Sync completes in reasonable time (< 2 minutes)
- No UI freeze
- All mutations succeed

**Success Criteria**:
- ✅ Large queue handled
- ✅ Efficient batching
- ✅ Progress shown
- ✅ UI responsive
- ✅ All mutations sync

---

### Test EC-4: Concurrent Conflicts on Multiple Items [P0]

**Objective**: Verify handling many conflicts at once

**Test Steps**:
1. **Browser A (Alice)**: Offline, edit 10 items
2. **Browser B (Bob)**: Online, edit same 10 items
3. **Browser A**: Reconnect

**Expected Results**:
- 10 conflicts detected
- Conflict queue: "10 conflicts to resolve"
- Can resolve one by one
- Progress shown: "Conflict 3 of 10"
- Can skip conflicts
- All resolved conflicts sync
- Skipped conflicts kept in queue

**Success Criteria**:
- ✅ All conflicts detected
- ✅ Can resolve sequentially
- ✅ Progress clear
- ✅ Can skip
- ✅ All resolved

---

### Test EC-5: Network Timeout Handling [P0]

**Objective**: Verify handling network timeouts

**Test Steps**:
1. **Browser A (Alice)**: Offline with changes
2. **Browser A**: Go online but simulate very slow network (timeout)
3. **Observe behavior**

**Expected Results**:
- Sync attempt starts
- Request times out after 30 seconds
- Error message: "Sync failed: Network timeout"
- Mutations remain in queue
- Automatic retry scheduled
- "Retry" button available

**Success Criteria**:
- ✅ Timeout handled
- ✅ Error message shown
- ✅ Queue preserved
- ✅ Retry mechanism works

---

### Test EC-6: IndexedDB Storage Limits [P1]

**Objective**: Verify handling storage quota limits

**Test Steps**:
1. **Browser A (Alice)**: Go offline
2. **Browser A**: Add huge queue (exceed quota)
3. **Observe behavior**

**Expected Results**:
- IndexedDB quota error detected
- User warned: "Storage limit reached"
- Oldest mutations may be dropped
- Or: Force sync before adding more
- Clear error messaging
- Prevents data corruption

**Quota Check**:
```javascript
navigator.storage.estimate().then(estimate => {
  const percentUsed = (estimate.usage / estimate.quota) * 100;
  if (percentUsed > 90) {
    showWarning('Storage nearly full');
  }
});
```

**Success Criteria**:
- ✅ Quota monitored
- ✅ User warned
- ✅ Graceful handling
- ✅ No corruption

---

### Test EC-7: Browser Crash During Queue Processing [P2]

**Objective**: Verify recovery after browser crash

**Test Steps**:
1. **Browser A (Alice)**: Offline with 20 mutations
2. **Browser A**: Start syncing (5 synced, 15 pending)
3. **Browser A**: Force close browser (simulate crash)
4. **Browser A**: Reopen browser and login

**Expected Results**:
- 15 pending mutations still in queue
- 5 synced mutations marked complete
- Queue resumes from where it left off
- No duplicate syncs
- Recovery is automatic

**Success Criteria**:
- ✅ Queue recovered
- ✅ No duplicates
- ✅ Resumes correctly
- ✅ Data integrity

---

### Test EC-8: Sync During Page Navigation [P1]

**Objective**: Verify queue persists during navigation

**Test Steps**:
1. **Browser A (Alice)**: Offline with pending changes
2. **Browser A**: Navigate to different page/route
3. **Browser A**: Go online
4. **Observe sync behavior**

**Expected Results**:
- Queue persists across navigation
- Sync happens in background
- User can continue working
- Success notification appears
- Queue cleared after sync

**Success Criteria**:
- ✅ Queue persists
- ✅ Background sync works
- ✅ Navigation doesn't block
- ✅ User notified

---

### Test EC-9: Conflicting Category Color [P2]

**Objective**: Verify handling custom category properties

**Test Steps**:
1. **Setup**: Custom categories with colors
2. **Browser A (Alice)**: Offline, change "Milk" category to "Beverages" (blue)
3. **Browser B (Bob)**: Online, change "Milk" category to "Dairy" (yellow)
4. **Browser A**: Reconnect

**Expected Results**:
- Category conflict detected
- Last write wins: "Beverages" (Alice)
- Color updates to blue
- All clients see "Beverages" (blue)

**Success Criteria**:
- ✅ Category and properties sync together
- ✅ Conflict resolved
- ✅ Visual properties update

---

### Test EC-10: Null vs Undefined vs Empty String [P2]

**Objective**: Verify handling of missing values

**Test Steps**:
1. **Browser A (Alice)**: Offline, set notes to "" (empty string)
2. **Browser B (Bob)**: Online, set notes to null
3. **Browser A**: Reconnect

**Expected Results**:
- Treat empty string and null as equivalent
- No conflict detected
- Both represent "no notes"
- Final state: null or "" (consistent)

**Success Criteria**:
- ✅ Empty values handled
- ✅ No false conflicts
- ✅ Consistent representation

---

### Test EC-11: Timezone Differences [P2]

**Objective**: Verify timestamp handling across timezones

**Test Steps**:
1. **Browser A (Alice)**: Pacific timezone (UTC-8)
2. **Browser B (Bob)**: Tokyo timezone (UTC+9)
3. **Both offline at same moment**
4. **Both edit "Milk"**
5. **Both reconnect**

**Expected Results**:
- Timestamps in UTC on server
- Conflict detection uses UTC timestamps
- Last write determined correctly regardless of timezone
- No timezone-related bugs

**Success Criteria**:
- ✅ Timezone-agnostic
- ✅ UTC timestamps
- ✅ Correct conflict detection
- ✅ No bugs

---

### Test EC-12: Unicode and Special Characters [P2]

**Objective**: Verify handling special characters in conflicts

**Test Steps**:
1. **Browser A (Alice)**: Offline, add item with emoji "🥛 Milk"
2. **Browser B (Bob)**: Online, add item "Milk"
3. **Browser A**: Reconnect

**Expected Results**:
- Both items created (different names)
- Unicode handled correctly
- No encoding issues
- Items display correctly
- No conflict (different items)

**Success Criteria**:
- ✅ Unicode supported
- ✅ No encoding errors
- ✅ Correct display
- ✅ Names compared correctly

---

### Test EC-13: Mutation Ordering Edge Case [P1]

**Objective**: Verify correct ordering with timestamps

**Test Steps**:
1. **Browser A (Alice)**: Offline
2. **Browser A**: Edit "Milk" at 10:00:00
3. **Change system time to 9:00:00** (time goes backward)
4. **Browser A**: Edit "Bread" at 9:00:00
5. **Browser A**: Reconnect

**Expected Results**:
- Mutations have wrong timestamp order
- Server detects anomaly
- Uses received order or sequence numbers
- Both mutations processed correctly
- No corruption

**Success Criteria**:
- ✅ Timestamp anomaly detected
- ✅ Fallback ordering works
- ✅ No corruption
- ✅ Both mutations succeed

---

### Test EC-14: Circular Dependency in Mutations [P2]

**Objective**: Verify no circular dependency issues

**Test Steps**:
1. **Browser A (Alice)**: Offline
2. **Browser A**: Create item "A" referencing item "B"
3. **Browser A**: Create item "B" referencing item "A"
4. **Browser A**: Reconnect

**Expected Results**:
- No circular dependency (if foreign keys exist)
- Or: No issue (simple item list)
- Both items created successfully
- No deadlock in sync

**Success Criteria**:
- ✅ No circular issues
- ✅ Both items sync
- ✅ No deadlock
- ✅ Correct final state

---

### Test EC-15: Conflict on Read-Only Field [P2]

**Objective**: Verify handling conflicts on immutable fields

**Test Steps**:
1. **Setup**: createdAt is read-only
2. **Browser A (Alice)**: Try to modify createdAt (shouldn't be possible)
3. **Browser A**: Offline, manual IndexedDB edit
4. **Browser A**: Reconnect

**Expected Results**:
- Server rejects change to read-only field
- Edit ignored or error returned
- Other valid changes applied
- Read-only field remains unchanged

**Success Criteria**:
- ✅ Read-only enforced
- ✅ Invalid change rejected
- ✅ Valid changes applied
- ✅ Data integrity

---

---

## Performance Tests

### Test PF-1: Queue Processing Speed [P0]

**Objective**: Measure queue processing performance

**Test Setup**:
- 100 mutations queued offline
- Mix: 50 creates, 30 updates, 20 deletes

**Test Steps**:
1. Go online
2. Measure time to process entire queue

**Performance Targets**:
- **Excellent**: < 10 seconds (10 mutations/sec)
- **Good**: 10-20 seconds
- **Acceptable**: 20-30 seconds
- **Poor**: > 30 seconds

**Measurements**:
```javascript
const startTime = performance.now();
await processQueue();
const endTime = performance.now();
console.log(`Queue processed in ${endTime - startTime}ms`);
```

**Success Criteria**:
- ✅ All mutations processed
- ✅ Time within acceptable range
- ✅ No UI blocking
- ✅ Progress shown

---

### Test PF-2: Conflict Detection Performance [P0]

**Objective**: Measure conflict detection speed

**Test Setup**:
- 50 items edited offline
- 50 items edited online (same items)
- 50 conflicts to detect

**Test Steps**:
1. Reconnect
2. Measure time to detect all conflicts

**Performance Targets**:
- **Excellent**: < 1 second
- **Good**: 1-3 seconds
- **Acceptable**: 3-5 seconds
- **Poor**: > 5 seconds

**Success Criteria**:
- ✅ All conflicts detected
- ✅ Detection is fast
- ✅ No UI lag
- ✅ Accurate detection

---

### Test PF-3: Memory Usage with Large Queue [P1]

**Objective**: Measure memory usage

**Test Setup**:
- 500 mutations queued

**Test Steps**:
1. Monitor memory before queue
2. Add 500 mutations
3. Monitor memory after
4. Process queue
5. Monitor memory after processing

**Performance Targets**:
- Memory increase: < 50 MB for 500 mutations
- Memory released after processing
- No memory leaks

**Memory Monitoring**:
```javascript
if (performance.memory) {
  const baseline = performance.memory.usedJSHeapSize;
  // ... add mutations ...
  const after = performance.memory.usedJSHeapSize;
  const increase = (after - baseline) / 1048576; // MB
  console.log(`Memory increased by ${increase.toFixed(2)} MB`);
}
```

**Success Criteria**:
- ✅ Memory usage reasonable
- ✅ No memory leaks
- ✅ Memory released
- ✅ Browser stable

---

### Test PF-4: UI Responsiveness During Sync [P0]

**Objective**: Verify UI remains responsive

**Test Setup**:
- 200 mutations syncing

**Test Steps**:
1. Start sync
2. Try to interact with UI (scroll, click, type)
3. Measure response time

**Performance Targets**:
- UI remains interactive
- Click response: < 100ms
- Scroll smooth (60 FPS)
- No freezing

**Success Criteria**:
- ✅ UI stays responsive
- ✅ No freezing
- ✅ Smooth animations
- ✅ Can cancel sync

---

### Test PF-5: IndexedDB Write Performance [P1]

**Objective**: Measure IndexedDB write speed

**Test Setup**:
- Write 1000 mutations to IndexedDB

**Test Steps**:
1. Measure time to write 1000 mutations

**Performance Targets**:
- **Excellent**: < 500ms (2000 ops/sec)
- **Good**: 500ms - 1s
- **Acceptable**: 1-2s
- **Poor**: > 2s

**Success Criteria**:
- ✅ Writes are fast
- ✅ No UI blocking
- ✅ All data persisted
- ✅ No errors

---

---

## Integration Tests

### Test IT-1: Works with Authentication [P0]

**Objective**: Verify offline works with auth system

**Test Steps**:
1. Login as Alice
2. Go offline
3. Make changes
4. Token expires while offline
5. Go online

**Expected Results**:
- Offline changes persist
- On reconnect, token refresh triggered
- New token obtained
- Mutations sync with new token
- No re-login required

**Success Criteria**:
- ✅ Auth integrated correctly
- ✅ Token refresh works
- ✅ Mutations sync
- ✅ No auth errors

---

### Test IT-2: Works with List Sharing [P0]

**Objective**: Verify offline works with shared lists

**Test Steps**:
1. Alice and Bob share a list
2. Both go offline
3. Both make changes
4. Both reconnect

**Expected Results**:
- Both can work offline on shared list
- Changes sync correctly
- Conflicts detected across users
- Permissions enforced during sync
- Real-time updates after sync

**Success Criteria**:
- ✅ Sharing compatible
- ✅ Multi-user offline works
- ✅ Conflicts handled
- ✅ Permissions enforced

---

### Test IT-3: Works with Permissions [P0]

**Objective**: Verify permissions enforced during sync

**Test Steps**:
1. Alice (editor) goes offline
2. Alice makes changes
3. Owner changes Alice to viewer
4. Alice reconnects

**Expected Results**:
- Alice's edits rejected (now viewer)
- Permission error shown
- Alice's UI updates to viewer mode
- Pending changes blocked
- Clear error message

**Success Criteria**:
- ✅ Permissions checked during sync
- ✅ Invalid changes blocked
- ✅ User notified
- ✅ UI updated

---

### Test IT-4: Respects Viewer Role [P0]

**Objective**: Verify viewers can't make offline changes

**Test Steps**:
1. Login as Carol (viewer)
2. Go offline
3. Try to add/edit/delete items

**Expected Results**:
- Add/edit/delete disabled in UI
- Viewer cannot queue mutations
- Offline indicator shows read-only mode
- If API called directly: Rejected

**Success Criteria**:
- ✅ Viewer restrictions enforced
- ✅ No mutations queued
- ✅ UI disabled correctly
- ✅ Read-only mode

---

### Test IT-5: Respects Editor Role [P0]

**Objective**: Verify editors can make offline changes

**Test Steps**:
1. Login as Bob (editor)
2. Go offline
3. Add, edit, delete items
4. Reconnect

**Expected Results**:
- All operations work offline
- Mutations queue successfully
- Changes sync on reconnect
- No permission errors
- Editor can do everything except manage members

**Success Criteria**:
- ✅ Editor permissions work offline
- ✅ All item operations allowed
- ✅ Syncs successfully
- ✅ No errors

---

### Test IT-6: Works with Categories [P0]

**Objective**: Verify category system works offline

**Test Steps**:
1. Go offline
2. Add items with categories
3. Change item categories
4. Filter by category
5. Reconnect

**Expected Results**:
- Categories work offline
- Filtering works offline
- Category changes queue
- Changes sync correctly
- Category conflicts handled

**Success Criteria**:
- ✅ Categories work offline
- ✅ Filtering works
- ✅ Changes sync
- ✅ Conflicts handled

---

### Test IT-7: Works with Notes/Descriptions [P0]

**Objective**: Verify notes field works offline

**Test Steps**:
1. Go offline
2. Add notes to items
3. Edit existing notes
4. Reconnect (potential note conflicts)

**Expected Results**:
- Notes editable offline
- Note changes queue
- Note conflicts detected
- Automatic concatenation works
- Final notes correct

**Success Criteria**:
- ✅ Notes work offline
- ✅ Changes queue
- ✅ Conflicts handled
- ✅ Concatenation works

---

### Test IT-8: Works with Gotten Status [P0]

**Objective**: Verify gotten status works offline

**Test Steps**:
1. Go offline
2. Mark items as gotten
3. Unmark items
4. Reconnect (potential conflicts)

**Expected Results**:
- Gotten status changes offline
- Changes queue correctly
- Conflicts use "prefer gotten" rule
- Visual indicators update
- Sync works correctly

**Success Criteria**:
- ✅ Gotten status offline
- ✅ Prefer gotten rule works
- ✅ Visual updates
- ✅ Syncs correctly

---

### Test IT-9: Works with Search/Filter [P0]

**Objective**: Verify search and filter work offline

**Test Steps**:
1. Go offline
2. Search for items
3. Filter by category
4. Filter by gotten status
5. Add new item matching search

**Expected Results**:
- Search works on local data
- Filters work offline
- Newly added items appear in filtered views
- No errors
- Fast and responsive

**Success Criteria**:
- ✅ Search works offline
- ✅ Filters work
- ✅ New items filtered correctly
- ✅ Fast performance

---

### Test IT-10: Works with Real-Time Sync [P0]

**Objective**: Verify offline integrates with real-time sync

**Test Steps**:
1. Alice and Bob online, working together
2. Alice goes offline
3. Bob continues making changes (online)
4. Alice makes changes (offline)
5. Alice reconnects

**Expected Results**:
- Alice sees Bob's changes on reconnect
- Alice's changes sync to Bob
- Conflicts detected where applicable
- Real-time updates resume
- Zero sync continues working

**Success Criteria**:
- ✅ Offline and real-time compatible
- ✅ Full sync on reconnect
- ✅ Conflicts handled
- ✅ Real-time resumes

---

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Offline Changes Not Syncing

**Symptoms**:
- Made changes offline
- Reconnected but changes don't sync
- Queue shows pending mutations
- No error message

**Diagnostic Steps**:
```javascript
// 1. Check if online
console.log('Navigator online:', navigator.onLine);

// 2. Check queue
const queue = await getMutationsFromIndexedDB();
console.log('Queued mutations:', queue);

// 3. Check WebSocket connection
console.log('WebSocket state:', ws.readyState);
// 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED

// 4. Check for errors in queue
const failed = queue.filter(m => m.status === 'error');
console.log('Failed mutations:', failed);
```

**Solutions**:

**A. Force Manual Sync**:
```javascript
// Trigger manual sync
await zero.sync();
// Or click "Retry Sync" button in UI
```

**B. Check Server Health**:
```bash
curl http://localhost:4848/health
curl http://localhost:3001/health
```

**C. Clear and Re-sync**:
```javascript
// Last resort: Clear queue and re-fetch
await clearMutationQueue();
await zero.pull(); // Re-fetch all data from server
```

---

#### Issue 2: Conflict Modal Not Appearing

**Symptoms**:
- Conflicts exist but modal doesn't show
- Silent conflict resolution
- User unaware of conflicts

**Diagnostic Steps**:
```javascript
// Check conflict queue
const conflicts = await getConflictsFromIndexedDB();
console.log('Unresolved conflicts:', conflicts);

// Check modal state
console.log('Conflict modal open:', isConflictModalOpen);

// Check console for errors
// Look for React errors, modal rendering issues
```

**Solutions**:

**A. Check Modal Component**:
```javascript
// Verify modal is rendered
document.querySelector('.conflict-modal'); // Should exist

// Check React state
// Use React DevTools to inspect ConflictModal component
```

**B. Manually Trigger Conflict Resolution**:
```javascript
// Force conflict modal to open
showConflictModal(conflicts[0]);
```

**C. Restart App**:
```javascript
// Refresh page
location.reload();
// Conflicts should re-trigger modal
```

---

#### Issue 3: Queue Growing Too Large

**Symptoms**:
- Hundreds of pending mutations
- Slow sync
- Storage quota warnings
- Browser laggy

**Diagnostic Steps**:
```javascript
// Check queue size
const queue = await getMutationsFromIndexedDB();
console.log('Queue length:', queue.length);

// Check storage usage
navigator.storage.estimate().then(estimate => {
  console.log('Storage used:', (estimate.usage / estimate.quota * 100).toFixed(2) + '%');
});

// Check for stuck mutations
const old = queue.filter(m => Date.now() - m.timestamp > 3600000); // > 1 hour
console.log('Old mutations:', old.length);
```

**Solutions**:

**A. Process Queue in Batches**:
```javascript
// Force batch processing
await processQueueInBatches(BATCH_SIZE = 50);
```

**B. Clear Failed Mutations**:
```javascript
// Remove permanently failed mutations
const failed = queue.filter(m => m.retryCount > 5);
await deleteFromQueue(failed);
```

**C. Optimize Queue**:
```javascript
// Combine redundant operations
await optimizeQueue(); // Create + Delete = no-op
```

---

#### Issue 4: IndexedDB Quota Exceeded

**Symptoms**:
- Error: "QuotaExceededError"
- Can't add more offline changes
- Browser storage full

**Diagnostic Steps**:
```javascript
// Check quota
navigator.storage.estimate().then(estimate => {
  const percentUsed = (estimate.usage / estimate.quota) * 100;
  console.log(`Storage: ${percentUsed.toFixed(2)}% used`);
  console.log(`${(estimate.usage / 1048576).toFixed(2)} MB used of ${(estimate.quota / 1048576).toFixed(2)} MB`);
});
```

**Solutions**:

**A. Clear Old Data**:
```javascript
// Clear old gotten items
await clearOldGottenItems(daysOld = 30);

// Clear old mutations
await clearSyncedMutations();
```

**B. Request More Quota (Chrome)**:
```javascript
// Request persistent storage
navigator.storage.persist().then(granted => {
  console.log('Persistent storage:', granted);
});
```

**C. Sync Immediately**:
```javascript
// Force sync before quota exceeded
if (percentUsed > 90) {
  await forceSyncNow();
}
```

---

#### Issue 5: Conflicts Not Resolving Automatically

**Symptoms**:
- Simple conflicts showing modal
- Expected auto-resolution not working
- User prompted unnecessarily

**Diagnostic Steps**:
```javascript
// Check conflict type
console.log('Conflict type:', conflict.type);
// Should be: 'field', 'delete', 'complex'

// Check auto-resolution rules
console.log('Auto-resolve enabled:', config.autoResolve);

// Check conflict complexity
console.log('Fields changed:', conflict.fieldsChanged);
```

**Solutions**:

**A. Verify Auto-Resolve Config**:
```javascript
// Check configuration
const config = getConflictResolutionConfig();
console.log('Auto-resolve settings:', config);

// Enable auto-resolve if disabled
config.autoResolve = true;
config.lastWriteWins = true;
config.preferGotten = true;
```

**B. Check Conflict Complexity**:
```javascript
// Simple conflicts should auto-resolve
if (conflict.fieldsChanged.length === 1 && !conflict.isDelete) {
  // Should auto-resolve
  await autoResolveConflict(conflict);
}
```

---

#### Issue 6: Data Loss After Offline Period

**Symptoms**:
- Made changes offline
- Reconnected
- Changes disappeared
- Queue was cleared

**Diagnostic Steps**:
```javascript
// Check if mutations were sent
console.log('Sync log:', syncLog);

// Check server response
console.log('Server response:', lastSyncResponse);

// Check for errors
console.log('Sync errors:', syncErrors);

// Verify server has data
await fetch(`/api/items?listId=${listId}`);
```

**Solutions**:

**A. Check Sync Logs**:
```sql
-- Server-side: Check if mutations received
SELECT * FROM sync_log
WHERE user_id = 'user-id'
ORDER BY created_at DESC
LIMIT 10;
```

**B. Restore from Local Backup**:
```javascript
// If local backup exists
const backup = await getLocalBackup();
await restoreFromBackup(backup);
```

**C. Contact Support**:
- Data loss is critical issue
- Provide sync logs
- Provide IndexedDB dump
- Report bug

---

#### Issue 7: WebSocket Connection Issues

**Symptoms**:
- Online but not syncing
- WebSocket closed
- Can't reconnect

**Diagnostic Steps**:
```javascript
// Check WebSocket state
console.log('WebSocket:', ws.readyState);
// 1 = OPEN, 3 = CLOSED

// Check connection errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Check reconnection attempts
console.log('Reconnect attempts:', reconnectCount);
```

**Solutions**:

**A. Manual Reconnect**:
```javascript
// Force WebSocket reconnect
await zero.reconnect();
```

**B. Check Zero Server**:
```bash
# Ensure zero-cache is running
ps aux | grep zero-cache

# Check logs
tail -f zero-cache.log

# Restart if needed
pnpm zero:dev
```

**C. Check Firewall/Proxy**:
```bash
# Test WebSocket connection
wscat -c ws://localhost:4848

# Check if port 4848 is accessible
curl http://localhost:4848/health
```

---

### Debug Tools

#### IndexedDB Inspector

```javascript
// Utility to inspect IndexedDB
async function inspectOfflineQueue() {
  const db = await openDatabase('zero-cache');
  const tx = db.transaction('mutations', 'readonly');
  const store = tx.objectStore('mutations');
  const all = await store.getAll();

  console.table(all.map(m => ({
    id: m.id.substring(0, 8),
    type: m.type,
    itemId: m.itemId?.substring(0, 8),
    status: m.status,
    timestamp: new Date(m.timestamp).toLocaleString(),
    retries: m.retryCount
  })));

  return all;
}

// Run in console
await inspectOfflineQueue();
```

#### Conflict Logger

```javascript
// Log all conflicts for debugging
function setupConflictLogger() {
  window.addEventListener('conflict-detected', (event) => {
    console.group('Conflict Detected');
    console.log('Type:', event.detail.type);
    console.log('Item:', event.detail.item);
    console.log('Client version:', event.detail.clientVersion);
    console.log('Server version:', event.detail.serverVersion);
    console.log('Changed fields:', event.detail.changedFields);
    console.groupEnd();
  });
}

setupConflictLogger();
```

#### Queue Monitor

```javascript
// Monitor queue in real-time
function monitorQueue() {
  setInterval(async () => {
    const queue = await getMutationsFromIndexedDB();
    const summary = {
      total: queue.length,
      pending: queue.filter(m => m.status === 'pending').length,
      syncing: queue.filter(m => m.status === 'syncing').length,
      failed: queue.filter(m => m.status === 'error').length,
      synced: queue.filter(m => m.status === 'synced').length
    };

    console.clear();
    console.table(summary);
  }, 2000);
}

monitorQueue();
```

---

### Testing Checklist

#### Pre-Test Verification
- [ ] Database is running and accessible
- [ ] Zero server is running
- [ ] API server is running
- [ ] Test users created
- [ ] Test list with items created
- [ ] Network tools ready (DevTools, proxy)
- [ ] IndexedDB cleared for clean start

#### During Testing
- [ ] Document all failures
- [ ] Take screenshots of conflicts
- [ ] Record sync timings
- [ ] Note any UI issues
- [ ] Check console for errors
- [ ] Verify IndexedDB state
- [ ] Test on multiple browsers

#### Post-Test Verification
- [ ] All conflicts resolved
- [ ] Final state consistent
- [ ] No pending mutations
- [ ] Queue cleared
- [ ] Clean database state
- [ ] No errors in logs
- [ ] Performance metrics recorded

---

## Conclusion

This comprehensive offline conflict resolution test plan covers **90+ test scenarios** across:

- **Basic Conflict Detection** (12 tests)
- **Automatic Conflict Resolution** (12 tests)
- **Manual Conflict Resolution** (12 tests)
- **Offline Queue Tests** (15 tests)
- **Sync Status Tests** (10 tests)
- **Multi-User Offline Scenarios** (15 tests)
- **Edge Cases** (15 tests)
- **Performance Tests** (5 tests)
- **Integration Tests** (10 tests)

### Key Features Tested

| Feature | Tests | Priority |
|---------|-------|----------|
| Offline Capability | 30+ | P0 |
| Conflict Detection | 15+ | P0 |
| Automatic Resolution | 12+ | P0 |
| Manual Resolution | 12+ | P0 |
| Queue Management | 15+ | P0 |
| Multi-User Scenarios | 15+ | P0 |
| Edge Cases | 15+ | P1-P2 |
| Performance | 5+ | P0 |
| Integration | 10+ | P0 |

### Success Criteria for Production

Before deploying to production, ensure:
- ✅ All P0 tests pass consistently
- ✅ Conflict detection accuracy: 100%
- ✅ Automatic resolution success rate: > 95%
- ✅ Queue processing time: < 30s for 100 mutations
- ✅ UI remains responsive during sync
- ✅ No data loss scenarios
- ✅ Memory usage acceptable (< 200MB)
- ✅ Works across Chrome, Firefox, Safari
- ✅ Accessible conflict resolution UI
- ✅ Comprehensive error handling

---

**Document Version**: 1.0
**Last Updated**: 2025-10-26
**Maintained By**: Development Team
**Related Docs**: [REALTIME_TESTS.md](./REALTIME_TESTS.md), [PERMISSION_TESTS.md](./PERMISSION_TESTS.md), [LIST_SHARING_TESTS.md](./LIST_SHARING_TESTS.md)
