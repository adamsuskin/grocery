# Real-Time Collaboration Test Plan

Comprehensive test scenarios for real-time synchronization and multi-user collaboration in the Grocery List app using Zero sync.

## Table of Contents
- [Overview](#overview)
- [Test Environment Setup](#test-environment-setup)
- [Real-Time Architecture](#real-time-architecture)
- [Test Scenarios](#test-scenarios)
- [Network Conditions Testing](#network-conditions-testing)
- [Performance Metrics](#performance-metrics)
- [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

The Grocery List app uses [Zero](https://zero.rocicorp.dev/) for real-time collaborative synchronization. Zero provides:
- **Real-time Sync**: Changes propagate instantly via WebSocket connections
- **Offline Support**: Works offline with local IndexedDB cache
- **Conflict Resolution**: Last-write-wins with automatic merge
- **Type Safety**: Fully typed queries with TypeScript
- **Local-First**: Fast, responsive UI with zero-cache server

### Expected Sync Latency
- **Optimal Conditions**: 50-200ms
- **Standard Network**: 200-500ms
- **Slow Network (3G)**: 500-2000ms
- **Offline-to-Online**: 1-5 seconds for full sync

### Zero Components
- **zero-cache**: Local sync server (port 4848)
- **IndexedDB**: Client-side persistent storage
- **WebSocket**: Real-time bidirectional communication
- **PostgreSQL**: Server-side data persistence

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

Create test user accounts with distinct profiles:

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

curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "David Johnson",
    "email": "david@test.com",
    "password": "TestPass123"
  }'
```

### Browser Configuration

#### Multi-User Testing Setup
1. **Chrome Profiles**: Use separate Chrome user profiles for each test user
2. **Incognito Windows**: Alternative approach for isolated sessions
3. **Different Browsers**: Chrome, Firefox, Safari for cross-browser testing

#### Browser DevTools Setup
Enable these panels for debugging:
- **Console**: Monitor Zero sync messages and errors
- **Network**: Track WebSocket connections and API calls
- **Application > IndexedDB**: Inspect local data cache
- **Application > Local Storage**: Verify auth tokens

#### Recommended Browser Extensions
- **React Developer Tools**: Inspect component state
- **Redux DevTools**: If using Redux (optional)
- **WebSocket Monitor**: Track real-time messages

### Database Setup

```sql
-- Verify schema is up to date
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'lists', 'list_members', 'grocery_items');

-- Clean test data before each run
DELETE FROM grocery_items WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'RT Test%'
);
DELETE FROM list_members WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'RT Test%'
);
DELETE FROM lists WHERE name LIKE 'RT Test%';
```

---

## Real-Time Architecture

### How Zero Sync Works

```
┌─────────────┐         WebSocket         ┌──────────────┐
│  Client A   │◄──────────────────────────►│ zero-cache   │
│  (Browser)  │         (port 4848)        │   Server     │
└─────────────┘                            └──────────────┘
      ▲                                           │
      │ IndexedDB                                 │ PostgreSQL
      │ (local cache)                             │ (persistence)
      ▼                                           ▼
┌─────────────┐                            ┌──────────────┐
│  IndexedDB  │                            │  PostgreSQL  │
│   Cache     │                            │   Database   │
└─────────────┘                            └──────────────┘
      ▲                                           ▲
      │                                           │
      │         WebSocket                         │
┌─────────────┐                            ┌──────────────┐
│  Client B   │◄──────────────────────────►│ zero-cache   │
│  (Browser)  │                            │   Server     │
└─────────────┘                            └──────────────┘
```

### Sync Flow for Item Addition

```
1. User A adds item "Milk" in Browser A
   └─► zero.mutate.grocery_items.create({ name: "Milk", ... })

2. Zero client sends mutation to zero-cache server
   └─► WebSocket: { type: "mutation", data: {...} }

3. zero-cache persists to PostgreSQL
   └─► INSERT INTO grocery_items VALUES (...)

4. zero-cache broadcasts change to all connected clients
   └─► WebSocket: { type: "update", data: {...} }

5. Browser B receives update via WebSocket
   └─► IndexedDB updated automatically

6. React query hook re-renders with new data
   └─► useGroceryItems() returns updated list

Total Time: 50-500ms (typical)
```

### Offline-to-Online Sync

```
1. Browser goes offline (network disconnected)
   └─► Zero detects WebSocket disconnection

2. User adds item "Cheese" while offline
   └─► Mutation stored in IndexedDB queue
   └─► UI updates optimistically (shows item immediately)

3. Browser comes back online
   └─► Zero reconnects WebSocket automatically

4. Zero sends queued mutations to server
   └─► Server processes mutations in order

5. Server broadcasts updates to other clients
   └─► All clients receive the "Cheese" item

6. Conflict resolution (if any concurrent edits)
   └─► Last-write-wins strategy
```

---

## Test Scenarios

### Scenario 1: Two Users Open Same Shared List

**Objective**: Verify initial data synchronization when multiple users access the same list.

**Test Setup**:
1. Create a list "RT Test Groceries" as Alice (owner)
2. Add 5 items to the list
3. Share list with Bob (editor permission)

**Test Steps**:
1. **Browser A**: Login as Alice
2. **Browser A**: Open "RT Test Groceries" list
3. **Browser B**: Login as Bob (separate browser/profile)
4. **Browser B**: Open "RT Test Groceries" list from dropdown

**Expected Results**:
- Both browsers show identical 5 items
- Item order is consistent (sorted by creation date desc by default)
- All item details match (name, quantity, category, notes, gotten status)
- WebSocket connection established in both browsers (check Network tab)
- IndexedDB contains the list data in both browsers

**Verification**:
```javascript
// In browser console
// Check WebSocket connection
console.log('WebSocket connections:',
  performance.getEntriesByType('resource')
    .filter(r => r.name.includes('4848'))
);

// Check IndexedDB
indexedDB.databases().then(dbs => console.log('Databases:', dbs));
```

**Success Criteria**:
- ✅ Both users see same data within 500ms of opening
- ✅ WebSocket status shows "connected"
- ✅ No errors in console
- ✅ IndexedDB populated with grocery_items table

---

### Scenario 2: User A Adds Item, User B Sees It Instantly

**Objective**: Verify real-time propagation of new item creation.

**Test Setup**:
- Alice and Bob both have "RT Test Groceries" open
- Both browsers visible side-by-side

**Test Steps**:
1. **Browser A (Alice)**: Click "Add Item" button
2. **Browser A**: Enter item details:
   - Name: "Organic Bananas"
   - Quantity: 3
   - Category: Produce
   - Notes: "Ripe ones from the front"
3. **Browser A**: Click "Add Item" to submit
4. **Browser B (Bob)**: Observe the list (do NOT refresh)

**Expected Results**:
- **Latency**: Item appears in Browser B within 200-500ms
- **Visual**: "Organic Bananas" appears at top of list (newest first)
- **Data Integrity**: All fields match exactly (quantity: 3, category badge shows "Produce", notes icon visible)
- **Animation**: Item may fade-in or slide-in smoothly (UI animation)
- **No Flicker**: List doesn't jump or reorder unexpectedly

**Monitoring**:
```javascript
// In Browser B console - monitor Zero updates
const zero = (window as any).__ZERO__;
zero?.on('sync', (e) => console.log('Sync event:', e));
```

**Performance Timing**:
- Measure time from submit to appearance:
  ```javascript
  // Browser A
  const startTime = performance.now();
  // [Add item via UI]

  // Browser B
  // When item appears, log:
  console.log('Sync latency:', performance.now() - startTime, 'ms');
  ```

**Success Criteria**:
- ✅ Item appears within 500ms
- ✅ All fields accurate
- ✅ No page refresh required
- ✅ Smooth UI update
- ✅ Console shows no errors

---

### Scenario 3: User A Checks Item, User B Sees Update

**Objective**: Verify real-time propagation of item status changes.

**Test Setup**:
- Alice and Bob viewing same shared list
- List contains "Organic Bananas" (from previous test)

**Test Steps**:
1. **Browser A (Alice)**: Find "Organic Bananas" in the list
2. **Browser A**: Click the checkbox to mark as gotten
3. **Browser B (Bob)**: Watch for status change

**Expected Results**:
- **Latency**: Checkbox updates in Browser B within 200-500ms
- **Visual Changes**:
  - Checkbox becomes checked
  - Item text gets strikethrough style
  - Item may move to "gotten" section if filtering is enabled
- **State Persistence**: Refreshing either browser shows item as checked

**Edge Case Testing**:
- **Rapid Toggling**:
  1. Alice checks and unchecks rapidly (5 times in 2 seconds)
  2. Bob should see final state correctly (not stuck in intermediate state)

- **Simultaneous Toggle**:
  1. Alice and Bob click checkbox at exact same time
  2. Last write wins - one final state emerges
  3. Both browsers eventually show same state (eventual consistency)

**Success Criteria**:
- ✅ Status syncs within 500ms
- ✅ Visual styling updates correctly
- ✅ No stuck/inconsistent state
- ✅ Simultaneous edits resolve correctly

---

### Scenario 4: User B Deletes Item, User A Sees Removal

**Objective**: Verify real-time propagation of item deletion.

**Test Setup**:
- Alice and Bob viewing shared list with multiple items

**Test Steps**:
1. **Browser B (Bob)**: Select "Organic Bananas"
2. **Browser B**: Click delete button (trash icon)
3. **Browser B**: Confirm deletion in dialog
4. **Browser A (Alice)**: Watch the list

**Expected Results**:
- **Latency**: Item disappears from Browser A within 200-500ms
- **Visual**: Item fades out or slides away (smooth removal animation)
- **List Updates**: Item count decreases by 1
- **No Ghost State**: Item doesn't reappear after refresh
- **Database**: Item is hard-deleted from PostgreSQL

**Verification**:
```sql
-- Verify item is deleted
SELECT * FROM grocery_items WHERE name = 'Organic Bananas';
-- Should return 0 rows
```

**Edge Cases**:
- **Delete While Editing**:
  1. Alice opens edit form for item
  2. Bob deletes the same item
  3. Alice tries to save edit
  4. Expected: Edit fails gracefully with error message

- **Simultaneous Delete**:
  1. Alice and Bob both click delete at same time
  2. Expected: Only one delete succeeds, other gets "already deleted" state
  3. Both browsers show item removed

**Success Criteria**:
- ✅ Deletion syncs within 500ms
- ✅ Item removed from both views
- ✅ No console errors
- ✅ Database confirms deletion

---

### Scenario 5: User Leaves and Rejoins (Sees Latest State)

**Objective**: Verify state persistence and reconnection after disconnect.

**Test Setup**:
- Alice working on shared list
- Bob has been disconnected (closed browser)

**Test Steps**:
1. **Browser A (Alice)**: While Bob is offline, perform actions:
   - Add 2 new items: "Milk" and "Bread"
   - Mark "Eggs" as gotten
   - Delete "Old Item"
   - Update "Apples" quantity from 2 to 5
2. **Browser B (Bob)**: Close browser entirely (not just tab)
3. **Wait 30 seconds**
4. **Browser B (Bob)**: Reopen browser and login
5. **Browser B**: Navigate to the shared list

**Expected Results**:
- **Full Sync**: Bob sees all 4 changes Alice made
- **Sync Time**: All changes appear within 1-5 seconds of opening list
- **Data Accuracy**:
  - "Milk" and "Bread" are present
  - "Eggs" shows as gotten (checked)
  - "Old Item" is absent
  - "Apples" shows quantity 5
- **No Stale Data**: Bob doesn't see old state at any point

**Technical Details**:
- Zero's IndexedDB cache is persistent across sessions
- On reconnection, Zero fetches latest state from server
- Local cache is updated with server truth
- React queries re-render with fresh data

**Verification**:
```javascript
// In Browser B console after reconnect
// Check IndexedDB was updated
const dbRequest = indexedDB.open('zero-cache');
dbRequest.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('grocery_items', 'readonly');
  const store = tx.objectStore('grocery_items');
  const getAllRequest = store.getAll();
  getAllRequest.onsuccess = () => {
    console.log('Items in IndexedDB:', getAllRequest.result);
  };
};
```

**Success Criteria**:
- ✅ All changes from Alice are visible
- ✅ No stale data shown
- ✅ Sync completes in < 5 seconds
- ✅ WebSocket reconnects automatically

---

### Scenario 6: Test with 3+ Users Simultaneously

**Objective**: Verify real-time sync scales to multiple concurrent users.

**Test Setup**:
- Create shared list "RT Test Multi-User"
- Share with Alice (owner), Bob (editor), Carol (editor), David (viewer)

**Test Steps**:
1. **All 4 browsers**: Login and open same list
2. **Coordinated Actions** (within 10-second window):
   - **Alice** adds "Tomatoes"
   - **Bob** adds "Lettuce"
   - **Carol** marks "Bread" as gotten
   - **David** just watches
3. **Observe all browsers**

**Expected Results**:
- **All Users See All Changes**: Each browser shows all 3 updates
- **No Lost Updates**: Both new items appear, status change applies
- **Correct Order**: Items appear in creation timestamp order
- **Viewer Restrictions**: David sees updates but cannot edit
- **Sync Time**: All updates propagate within 1-2 seconds max

**Simultaneous Edit Conflict**:
1. **Alice and Bob** both edit same item "Apples" at exact same time:
   - Alice changes quantity to 3
   - Bob changes quantity to 5
2. **Expected Resolution**:
   - Last write wins (based on server timestamp)
   - Both browsers eventually show same value (either 3 or 5)
   - No data corruption or mixed state
   - Eventual consistency achieved within 1-2 seconds

**Load Testing**:
```javascript
// Stress test: All users add items rapidly
// Browser A, B, C (in console):
async function addManyItems() {
  for (let i = 0; i < 10; i++) {
    await addItem(`Item ${Date.now()}-${i}`, 1, 'Other', '');
    await new Promise(r => setTimeout(r, 100)); // 100ms delay
  }
}
```

**Expected**: All 30 items (10 per user) appear in all browsers within 5 seconds.

**Success Criteria**:
- ✅ All 4 users see all changes
- ✅ No updates lost
- ✅ Conflicts resolve correctly
- ✅ Performance stays responsive
- ✅ WebSocket connections stable

---

### Scenario 7: Test Offline/Online Transitions

**Objective**: Verify offline resilience and sync on reconnection.

**Test Setup**:
- Alice and Bob viewing shared list
- Both online initially

**Test Steps (Browser A - Alice)**:
1. **Simulate Offline**:
   - Open DevTools > Network tab
   - Select "Offline" from throttling dropdown
   - Or disable network in browser settings

2. **Work Offline**:
   - Add item "Cheese" (name: "Cheddar Cheese", qty: 2)
   - Mark "Milk" as gotten
   - Try to delete "Old Bread"
   - Add another item "Yogurt"

3. **Observe UI**:
   - Changes appear immediately in Browser A (optimistic updates)
   - Check for "offline" indicator in UI
   - Items show in local view

4. **Go Back Online**:
   - Re-enable network in DevTools
   - Wait for reconnection

5. **Browser B (Bob)**:
   - Watch for incoming changes

**Expected Results**:

**While Offline (Browser A)**:
- ✅ All changes apply immediately to local UI (optimistic)
- ✅ Changes stored in IndexedDB queue
- ✅ Offline indicator visible (if implemented)
- ✅ No errors or crashes
- ✅ User can continue working seamlessly

**On Reconnection (Browser A)**:
- ✅ WebSocket reconnects automatically (within 1-2 seconds)
- ✅ Queued mutations sent to server
- ✅ Server confirms all changes
- ✅ Offline indicator disappears
- ✅ No data loss

**Browser B During Reconnection**:
- ✅ Receives all 4 updates from Alice:
  - "Cheese" appears
  - "Milk" marked as gotten
  - "Old Bread" deleted
  - "Yogurt" appears
- ✅ Updates arrive within 2-5 seconds of Alice reconnecting
- ✅ All changes accurate and in order

**Edge Case - Offline Conflict**:
1. Alice goes offline, edits "Apples" quantity to 3
2. Bob (online) edits same item quantity to 5
3. Alice reconnects
4. **Expected**: Last write wins, final value is either 3 or 5 (both browsers agree)

**Verification**:
```javascript
// Check IndexedDB for queued mutations while offline
// Browser A console while offline:
indexedDB.open('zero-cache').onsuccess = (e) => {
  const db = e.target.result;
  // Check if mutations table exists
  console.log('Object stores:', [...db.objectStoreNames]);
};
```

**Success Criteria**:
- ✅ Offline changes work locally
- ✅ All changes sync on reconnect
- ✅ No data loss
- ✅ Reconnection is automatic
- ✅ Other users receive updates

---

### Scenario 8: Test Conflict Resolution

**Objective**: Verify Zero's conflict resolution with concurrent edits.

**Test Setup**:
- Alice and Bob viewing shared list
- List contains item "Apples" (quantity: 2)

**Test Steps**:

**Simple Conflict**:
1. **Browser A (Alice)**: Start editing "Apples"
2. **Browser B (Bob)**: Start editing same "Apples" item
3. **Browser A**: Change quantity to 5, save
4. **Browser B**: Change quantity to 8, save
5. **Observe both browsers**

**Expected Result**:
- Last write wins (based on server timestamp)
- Both browsers eventually show same quantity (either 5 or 8)
- No error messages to users
- Consistency achieved within 1 second

**Complex Conflict (Different Fields)**:
1. **Browser A**: Change "Apples" quantity to 5
2. **Browser B**: Change "Apples" category to "Bakery"
3. **Browser A**: Save first
4. **Browser B**: Save second
5. **Expected**: Item shows quantity 5 AND category Bakery (both changes preserved)

**Delete Conflict**:
1. **Browser A**: Start editing "Apples"
2. **Browser B**: Delete "Apples"
3. **Browser A**: Try to save edit
4. **Expected**:
   - Edit fails gracefully
   - Error message: "Item was deleted by another user"
   - Item disappears from both browsers

**Rapid Updates**:
1. **Browser A**: Toggle "Milk" checkbox 10 times rapidly (on/off/on/off...)
2. **Browser B**: Observe the changes
3. **Expected**:
   - All toggles eventually sync
   - Final state matches last toggle
   - No "stuck" or flickering state

**Success Criteria**:
- ✅ Last write wins consistently
- ✅ No data corruption
- ✅ Both users reach same final state
- ✅ Graceful handling of delete conflicts
- ✅ Rapid updates don't cause issues

---

### Scenario 9: Member Added to List in Real-Time

**Objective**: Verify real-time sync of list membership changes.

**Test Setup**:
- Alice (owner) has "RT Test Groceries" open
- Carol is logged in but not a member yet

**Test Steps**:
1. **Browser A (Alice)**: Open "Manage List" dialog
2. **Browser A**: Go to "Members" tab
3. **Browser C (Carol)**: Stay on dashboard (viewing her lists)
4. **Browser A**: Add Carol as editor:
   - Enter "carol@test.com"
   - Select "Editor" permission
   - Click "Add Member"
5. **Browser C (Carol)**: Watch list dropdown (do NOT refresh)

**Expected Results**:
- **Browser A**:
  - Success message: "Carol added as editor"
  - Carol appears in members list immediately
  - Member count increases

- **Browser C**:
  - "RT Test Groceries" appears in dropdown within 1-2 seconds
  - Carol can now select and open the list
  - List shows with "(shared)" indicator
  - Carol has full editor permissions

**Verification**:
```javascript
// Browser C console - monitor list updates
const zero = (window as any).__ZERO__;
zero?.query.lists.where('id', listId).on('change', (lists) => {
  console.log('List access granted:', lists);
});
```

**Success Criteria**:
- ✅ List appears for new member within 2 seconds
- ✅ No page refresh required
- ✅ Correct permissions applied
- ✅ New member can immediately access list

---

### Scenario 10: Permission Changed in Real-Time

**Objective**: Verify real-time enforcement of permission changes.

**Test Setup**:
- Alice (owner) and Bob (editor) viewing shared list
- Bob has edit capabilities active

**Test Steps**:
1. **Browser B (Bob)**: Viewing list with "Add Item" button visible
2. **Browser A (Alice)**: Open "Manage List" > "Members"
3. **Browser A**: Change Bob's permission from "Editor" to "Viewer"
4. **Browser B (Bob)**: Continue viewing same list (no refresh)

**Expected Results**:
- **Latency**: Changes take effect in Browser B within 1-2 seconds
- **UI Changes in Browser B**:
  - "Add Item" button disappears or becomes disabled
  - Edit buttons (pencil icons) on items disappear
  - Delete buttons (trash icons) disappear
  - Checkboxes become read-only or disappear
  - Permission badge updates to "Viewer"
- **Functional Test**:
  - Bob tries to check an item → blocked
  - Bob tries API call → 403 Forbidden
- **No Disruption**: Bob's view remains stable, just becomes read-only

**Reverse Test (Viewer to Editor)**:
1. **Browser A (Alice)**: Change Bob back to "Editor"
2. **Browser B (Bob)**: UI updates within 1-2 seconds
3. **Expected**: All edit controls reappear, Bob can edit again

**Success Criteria**:
- ✅ Permission change syncs within 2 seconds
- ✅ UI updates automatically
- ✅ Permissions enforced immediately
- ✅ No page refresh required
- ✅ Smooth transition (no errors)

---

### Scenario 11: Member Removed from List in Real-Time

**Objective**: Verify immediate access revocation when member removed.

**Test Setup**:
- Alice (owner) and Bob (editor) viewing shared list
- Carol viewing list dropdown

**Test Steps**:
1. **Browser B (Bob)**: Actively viewing "RT Test Groceries"
2. **Browser A (Alice)**: Open "Manage List" > "Members"
3. **Browser A**: Click "Remove" (X) next to Bob's name
4. **Browser A**: Confirm removal
5. **Browser B (Bob)**: Continue viewing list (no manual action)

**Expected Results**:
- **Browser A**:
  - Bob removed from members list immediately
  - Success message displayed
  - Member count decreases

- **Browser B (Bob)**:
  - Access revoked within 1-2 seconds
  - Redirected to default list or dashboard
  - "RT Test Groceries" disappears from dropdown
  - Friendly message: "You no longer have access to this list"
  - Cannot navigate back to list via URL

**Graceful Degradation**:
- Bob's in-progress actions (e.g., typing in add form) are cancelled
- No error dialog spam
- Data autosave abandoned gracefully

**Verification**:
```sql
-- Verify membership removed
SELECT * FROM list_members
WHERE list_id = 'list-id' AND user_id = 'bob-id';
-- Should return 0 rows
```

**Success Criteria**:
- ✅ Access revoked within 2 seconds
- ✅ Member cannot view list anymore
- ✅ List removed from dropdown
- ✅ Graceful handling (no crashes)
- ✅ Clear user messaging

---

### Scenario 12: Bulk Operations Sync to All Users

**Objective**: Verify real-time sync of bulk operations (mark all, delete all).

**Test Setup**:
- Alice and Bob viewing shared list with 10 items
- 5 items are marked as gotten

**Test Steps**:
1. **Browser A (Alice)**: Click "Mark All as Gotten" button
2. **Browser A**: Confirm action
3. **Browser B (Bob)**: Watch for updates

**Expected Results**:
- **Browser A**:
  - All 5 ungotten items become checked
  - Success message displayed
  - UI updates within 200ms

- **Browser B**:
  - All items update to checked within 500ms-1s
  - Updates may appear in batches or individually
  - Final state matches Browser A
  - No flicker or visual glitches

**Delete All Gotten Test**:
1. **Browser B (Bob)**: Click "Delete All Gotten" button
2. **Browser B**: Confirm deletion
3. **Browser A (Alice)**: Watch for removals

**Expected**:
- All 10 gotten items disappear from both browsers
- Removals sync within 1-2 seconds
- Item count updates correctly
- No orphaned items

**Performance**:
- Bulk operations should be batched/optimized
- Not sent as 10 individual WebSocket messages
- Zero should batch mutations for efficiency

**Success Criteria**:
- ✅ Bulk changes sync to all users
- ✅ All items affected correctly
- ✅ Sync time < 2 seconds for 10 items
- ✅ No partial/inconsistent states
- ✅ Performance is acceptable

---

### Scenario 13: Category Filter Updates Sync

**Objective**: Verify real-time sync when items' categories change.

**Test Setup**:
- Alice and Bob viewing list
- Bob has "Produce" category filter active (only showing Produce items)

**Test Steps**:
1. **Browser B (Bob)**: Enable category filter for "Produce" only
2. **Browser B**: Should see only Produce items (e.g., "Apples", "Bananas")
3. **Browser A (Alice)**: Edit "Apples"
4. **Browser A**: Change category from "Produce" to "Bakery"
5. **Browser A**: Save
6. **Browser B (Bob)**: Observe the list

**Expected Results**:
- **Browser B**: "Apples" disappears from view within 500ms
  - Item is now "Bakery" category, filtered out by Bob's "Produce" filter
  - Item count decreases
  - No error or flicker
  - If Bob disables filter, "Apples" reappears with "Bakery" badge

**Reverse Test**:
1. **Browser A**: Change "Bread" from "Bakery" to "Produce"
2. **Browser B** (Produce filter active): "Bread" appears in list

**Success Criteria**:
- ✅ Item appears/disappears based on category change
- ✅ Filters work correctly with real-time updates
- ✅ No state inconsistencies
- ✅ Smooth UX

---

### Scenario 14: Notes Field Updates in Real-Time

**Objective**: Verify real-time sync of optional notes field.

**Test Setup**:
- Alice and Bob viewing shared list
- List has item "Milk" with no notes

**Test Steps**:
1. **Browser A (Alice)**: Edit "Milk" item
2. **Browser A**: Add note: "Get the organic brand from the back"
3. **Browser A**: Save
4. **Browser B (Bob)**: Watch item

**Expected Results**:
- **Browser B**:
  - Notes icon (📋) appears next to "Milk" within 500ms
  - Bob clicks notes icon to expand
  - Sees full note text exactly as Alice entered
  - Note formatting preserved (line breaks, etc.)

**Complex Note Test**:
1. **Browser A**: Add note with special characters:
   ```
   - Brand: Organic Valley
   - Location: Back left corner
   - Get 2% (not whole milk!)
   ```
2. **Browser B**: Should see all formatting preserved

**Success Criteria**:
- ✅ Notes sync in real-time
- ✅ Formatting preserved
- ✅ Icons update correctly
- ✅ No text truncation or corruption

---

### Scenario 15: Search Results Update in Real-Time

**Objective**: Verify real-time updates respect active search filters.

**Test Setup**:
- Alice and Bob viewing list
- Bob has search active: "milk"

**Test Steps**:
1. **Browser B (Bob)**: Enter "milk" in search box
2. **Browser B**: Should see items matching "milk" (e.g., "Milk", "Almond Milk")
3. **Browser A (Alice)**: Add new item "Oat Milk"
4. **Browser B (Bob)**: Continue viewing search results

**Expected Results**:
- **Browser B**: "Oat Milk" appears in search results within 500ms
  - Matches search term "milk"
  - Appears in correct sorted position
  - Search counter updates

**Negative Test**:
1. **Browser A**: Add item "Bread" (doesn't match "milk")
2. **Browser B**: "Bread" should NOT appear in search results
3. **Browser B**: Clears search → "Bread" now visible

**Dynamic Search**:
1. **Browser A**: Renames "Milk" to "Dairy Beverage"
2. **Browser B** (search: "milk"): Item disappears from results
3. **Browser B** (search: "dairy"): Same item now appears

**Success Criteria**:
- ✅ Search results update in real-time
- ✅ Filters applied correctly
- ✅ Count updates accurately
- ✅ No stale results

---

### Scenario 16: List Renamed Updates for All Members

**Objective**: Verify real-time sync of list name changes.

**Test Setup**:
- Alice (owner) and Bob (editor) viewing list "RT Test Groceries"

**Test Steps**:
1. **Browser B (Bob)**: Viewing list "RT Test Groceries" in dropdown and header
2. **Browser A (Alice)**: Click "Manage List" > "General" tab
3. **Browser A**: Change name to "Weekly Shopping List"
4. **Browser A**: Click "Save" or "Rename"
5. **Browser B (Bob)**: Watch dropdown and page header

**Expected Results**:
- **Browser B**:
  - List name updates in dropdown within 1 second
  - Page header title updates to "Weekly Shopping List"
  - Breadcrumb updates (if present)
  - No page reload or navigation disruption
  - Bob can continue working on same list

**Verification**:
```sql
-- Check database
SELECT name FROM lists WHERE id = 'list-id';
-- Should show "Weekly Shopping List"
```

**Success Criteria**:
- ✅ Name syncs to all members
- ✅ UI updates in < 1 second
- ✅ No disruption to workflows
- ✅ Database persistence confirmed

---

### Scenario 17: List Deleted - All Members Notified

**Objective**: Verify graceful handling when owner deletes list.

**Test Setup**:
- Alice (owner), Bob (editor), Carol (viewer) all viewing "RT Test Groceries"

**Test Steps**:
1. **All browsers**: Actively viewing the same list
2. **Browser A (Alice)**: Click "Manage List" > "Danger Zone"
3. **Browser A**: Click "Delete List"
4. **Browser A**: Confirm deletion by typing list name
5. **Browsers B & C**: Continue viewing list

**Expected Results**:
- **Browser A (Alice)**:
  - List deleted immediately
  - Redirected to dashboard or default list
  - Success message: "List deleted successfully"

- **Browsers B & C (Bob & Carol)**:
  - Within 1-2 seconds:
    - Receive notification: "This list has been deleted by the owner"
    - Redirected to dashboard or default list
    - List removed from dropdown
    - Cannot navigate back to list
  - Graceful handling (no crashes or errors)

**Database Cleanup**:
```sql
-- Verify cascading deletes
SELECT COUNT(*) FROM lists WHERE id = 'deleted-list-id';
-- Should be 0

SELECT COUNT(*) FROM list_members WHERE list_id = 'deleted-list-id';
-- Should be 0

SELECT COUNT(*) FROM grocery_items WHERE list_id = 'deleted-list-id';
-- Should be 0
```

**Success Criteria**:
- ✅ All members notified within 2 seconds
- ✅ Graceful redirect and messaging
- ✅ Complete database cleanup
- ✅ No broken states or errors

---

### Scenario 18: Simultaneous Edits from Multiple Users

**Objective**: Stress test real-time sync with high concurrency.

**Test Setup**:
- Alice, Bob, Carol, David all viewing same list
- List has 20 items

**Test Steps**:
1. **Coordinated Actions** (all within 5 seconds):
   - **Alice**: Adds 3 new items
   - **Bob**: Marks 5 items as gotten
   - **Carol**: Deletes 2 items
   - **David**: Edits 3 items (change quantities)
2. **All browsers**: Watch for updates

**Expected Results**:
- **All Browsers Eventually Show Same State**:
  - All 3 new items from Alice appear
  - All 5 status changes from Bob applied
  - 2 items deleted by Carol are gone
  - 3 items edited by David show new quantities
- **Timing**: All changes propagate within 3-5 seconds
- **No Data Loss**: All 13 operations are applied
- **Consistency**: Final state is identical across all browsers
- **No Errors**: Console clean, no WebSocket disconnections

**Conflict Scenarios**:
1. **Alice and Bob edit same item simultaneously**:
   - Last write wins
   - Both eventually see same value

2. **Carol deletes item that David is editing**:
   - Delete takes precedence
   - David's edit fails gracefully
   - Item disappears from both browsers

**Performance Metrics**:
- WebSocket message count: Should be optimized (batch updates if possible)
- Browser CPU usage: Should remain reasonable (< 50%)
- UI responsiveness: No freezing or lag

**Success Criteria**:
- ✅ All 13 operations complete successfully
- ✅ All users reach same final state
- ✅ Sync time < 5 seconds
- ✅ No errors or crashes
- ✅ Performance acceptable

---

## Network Conditions Testing

### Network Profiles

Test real-time sync under various network conditions to ensure robustness.

#### 1. Optimal Network (Fast Connection)
**Profile**:
- Latency: 10-50ms
- Download: 50+ Mbps
- Upload: 10+ Mbps
- Packet Loss: 0%

**Expected Sync Latency**: 50-200ms

**DevTools Setup**:
```
Chrome DevTools > Network > Throttling > No throttling
```

**Test**: Run Scenarios 2, 3, 4 (basic sync operations)

**Success Criteria**:
- ✅ Sync latency < 200ms
- ✅ WebSocket stable
- ✅ All updates smooth

---

#### 2. Standard Broadband (Typical Home/Office)
**Profile**:
- Latency: 50-100ms
- Download: 10-20 Mbps
- Upload: 5-10 Mbps
- Packet Loss: 0-1%

**Expected Sync Latency**: 200-500ms

**DevTools Setup**:
```
Chrome DevTools > Network > Throttling > Fast 3G
```

**Test**: Run full test suite (all scenarios)

**Success Criteria**:
- ✅ Sync latency < 500ms
- ✅ No timeout errors
- ✅ Offline queue works

---

#### 3. Slow 3G (Mobile Network)
**Profile**:
- Latency: 200-400ms
- Download: 1-2 Mbps
- Upload: 500 kbps
- Packet Loss: 2-5%

**Expected Sync Latency**: 500-2000ms

**DevTools Setup**:
```
Chrome DevTools > Network > Throttling > Slow 3G
```

**Test Focus**:
- Scenario 2 (item addition)
- Scenario 7 (offline/online)
- Scenario 12 (bulk operations)

**Success Criteria**:
- ✅ Sync latency < 2000ms
- ✅ UI remains responsive
- ✅ Optimistic updates work
- ✅ Retry logic functions

---

#### 4. Intermittent Connection (Flaky Network)
**Profile**:
- Periodic disconnections (every 10-30 seconds)
- Reconnects after 2-5 seconds
- Variable latency: 50-500ms
- Packet Loss: 5-10%

**Simulation**:
```javascript
// In browser console - simulate intermittent connection
setInterval(() => {
  console.log('Simulating disconnect...');
  // Disable network
  // Wait 3 seconds
  setTimeout(() => {
    console.log('Reconnecting...');
    // Re-enable network
  }, 3000);
}, 20000); // Every 20 seconds
```

**DevTools Setup**:
- Manually toggle "Offline" in Network tab every 20 seconds

**Test Focus**:
- Scenario 7 (offline resilience)
- Scenario 18 (simultaneous edits during flaky connection)

**Success Criteria**:
- ✅ Reconnection is automatic
- ✅ Queued mutations sync on reconnect
- ✅ No data loss
- ✅ User sees offline indicator

---

#### 5. High Latency (Satellite/International)
**Profile**:
- Latency: 500-1000ms
- Download: 5 Mbps
- Upload: 1 Mbps
- Packet Loss: 1-2%

**Expected Sync Latency**: 1000-3000ms

**DevTools Setup**:
```
Chrome DevTools > Network > Add custom profile:
- Download: 5000 kbps
- Upload: 1000 kbps
- Latency: 800ms
```

**Test Focus**:
- User experience with high latency
- Optimistic UI updates
- User doesn't notice delay due to optimistic updates

**Success Criteria**:
- ✅ Local updates immediate (optimistic)
- ✅ Server sync eventually completes
- ✅ No timeout errors
- ✅ Acceptable UX despite latency

---

### Network Failure Scenarios

#### Scenario N1: WebSocket Connection Drops
**Test Steps**:
1. Alice and Bob viewing list
2. Simulate WebSocket failure:
   ```javascript
   // In console
   const ws = performance.getEntriesByType('resource')
     .find(r => r.name.includes('4848'));
   // Close WebSocket manually
   ```
3. Alice adds item while disconnected
4. Zero should auto-reconnect

**Expected**:
- ✅ Auto-reconnect within 5 seconds
- ✅ Queued updates sync on reconnect
- ✅ No user intervention required

---

#### Scenario N2: Zero Cache Server Restart
**Test Steps**:
1. All users viewing shared list
2. Restart zero-cache server:
   ```bash
   # Stop zero-cache
   pkill -f zero-cache

   # Wait 5 seconds

   # Restart
   pnpm zero:dev
   ```
3. Observe client reconnection

**Expected**:
- ✅ Clients detect disconnection
- ✅ Clients retry connection automatically
- ✅ Reconnect within 10 seconds
- ✅ Full state re-sync from PostgreSQL
- ✅ No data loss

---

#### Scenario N3: PostgreSQL Connection Loss
**Test Steps**:
1. Users viewing list
2. Stop PostgreSQL:
   ```bash
   docker compose stop postgres
   ```
3. Try to add item
4. Restart PostgreSQL:
   ```bash
   docker compose start postgres
   ```

**Expected**:
- ✅ Mutations queue locally
- ✅ Error messages in zero-cache logs
- ✅ On reconnect, mutations sync
- ✅ Eventual consistency achieved

---

## Performance Metrics

### Key Performance Indicators (KPIs)

#### Sync Latency
**Measurement**: Time from action in Browser A to update in Browser B

| Scenario | Target | Acceptable | Poor |
|----------|--------|------------|------|
| Item Add | < 200ms | 200-500ms | > 500ms |
| Item Update | < 200ms | 200-500ms | > 500ms |
| Item Delete | < 200ms | 200-500ms | > 500ms |
| Bulk Operation (10 items) | < 1s | 1-2s | > 2s |
| Member Add/Remove | < 500ms | 500ms-1s | > 1s |
| List Delete | < 1s | 1-2s | > 2s |

#### WebSocket Metrics
**Measurement**: Connection stability and message throughput

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Connection Uptime | > 99% | 95-99% | < 95% |
| Reconnect Time | < 2s | 2-5s | > 5s |
| Message Processing Rate | > 100/s | 50-100/s | < 50/s |
| Ping/Pong Latency | < 50ms | 50-100ms | > 100ms |

#### Client Performance
**Measurement**: Browser resource usage

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| IndexedDB Read Time | < 10ms | 10-50ms | > 50ms |
| IndexedDB Write Time | < 20ms | 20-100ms | > 100ms |
| Memory Usage | < 100MB | 100-200MB | > 200MB |
| CPU Usage (idle) | < 5% | 5-10% | > 10% |
| CPU Usage (syncing) | < 20% | 20-40% | > 40% |

### Performance Testing Tools

#### Browser Performance API
```javascript
// Measure sync latency
const startTime = performance.now();
// [Trigger action in Browser A]

// In Browser B - when update appears:
const syncLatency = performance.now() - startTime;
console.log('Sync latency:', syncLatency, 'ms');
```

#### WebSocket Monitoring
```javascript
// Monitor WebSocket messages
const originalWebSocket = WebSocket;
window.WebSocket = function(...args) {
  const ws = new originalWebSocket(...args);

  let messageCount = 0;
  let startTime = Date.now();

  ws.addEventListener('message', (e) => {
    messageCount++;
    console.log('WS message:', e.data);
  });

  setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    console.log('Messages/sec:', (messageCount / elapsed).toFixed(2));
  }, 5000);

  return ws;
};
```

#### IndexedDB Performance
```javascript
// Measure IndexedDB operations
async function measureIndexedDBPerf() {
  const dbName = 'zero-cache';

  // Read performance
  const readStart = performance.now();
  const db = await new Promise((resolve) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = () => resolve(req.result);
  });
  const readTime = performance.now() - readStart;
  console.log('IndexedDB read:', readTime, 'ms');

  // Transaction performance
  const txStart = performance.now();
  const tx = db.transaction('grocery_items', 'readonly');
  const store = tx.objectStore('grocery_items');
  await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = resolve;
  });
  const txTime = performance.now() - txStart;
  console.log('IndexedDB transaction:', txTime, 'ms');
}
```

#### Zero Stats API
```javascript
// If Zero exposes stats API
const zero = (window as any).__ZERO__;
if (zero?.getStats) {
  const stats = zero.getStats();
  console.log('Zero Stats:', {
    mutationsQueued: stats.mutationsQueued,
    mutationsSent: stats.mutationsSent,
    bytesReceived: stats.bytesReceived,
    bytesSent: stats.bytesSent,
    connectionState: stats.connectionState
  });
}
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Changes Not Syncing Between Browsers

**Symptoms**:
- User A adds item, User B doesn't see it
- Updates take > 10 seconds or never appear
- Console shows no errors

**Diagnostic Steps**:
```bash
# 1. Check zero-cache server is running
ps aux | grep zero-cache
# Should see process running

# 2. Check zero-cache logs
# Look for errors in terminal running pnpm zero:dev

# 3. Verify WebSocket connection in browser
# DevTools > Network > WS filter
# Should see connection to localhost:4848

# 4. Check PostgreSQL is accessible
psql -h localhost -U grocery -d grocery_db -c "SELECT COUNT(*) FROM grocery_items;"
```

**Solutions**:

**A. Restart zero-cache server**:
```bash
# Kill existing process
pkill -f zero-cache

# Restart
pnpm zero:dev
```

**B. Check firewall/port access**:
```bash
# Verify port 4848 is accessible
curl http://localhost:4848/health

# If blocked, check firewall rules
sudo ufw status  # Linux
# Or check Windows Firewall settings
```

**C. Clear IndexedDB cache**:
```javascript
// In browser console
indexedDB.deleteDatabase('zero-cache');
// Then refresh page
```

**D. Verify environment variables**:
```bash
# Check .env file
cat .env | grep ZERO_SERVER

# Should be: VITE_ZERO_SERVER=http://localhost:4848
```

---

#### Issue 2: WebSocket Connection Keeps Dropping

**Symptoms**:
- Frequent "disconnected" messages
- Sync works intermittently
- Console shows repeated connection attempts

**Diagnostic Steps**:
```javascript
// Monitor WebSocket state
const ws = performance.getEntriesByType('resource')
  .find(r => r.name.includes('4848'));
console.log('WebSocket connection:', ws);

// Check connection state over time
setInterval(() => {
  const state = ws?.connectionState || 'unknown';
  console.log('WS State:', state, new Date().toISOString());
}, 2000);
```

**Solutions**:

**A. Check network stability**:
- Try different network (mobile hotspot vs WiFi)
- Check for VPN or proxy interference
- Disable browser extensions that may block WebSockets

**B. Increase WebSocket timeout** (if configurable):
```typescript
// In zero-store.ts
new Zero<Schema>({
  userID,
  auth: token,
  server: import.meta.env.VITE_ZERO_SERVER,
  schema,
  kvStore: 'idb',
  // Add timeout config if supported by Zero SDK
  connectionTimeout: 30000, // 30 seconds
});
```

**C. Check zero-cache server health**:
```bash
# Monitor zero-cache memory/CPU
top | grep zero-cache

# Check zero-cache logs for errors
# Look for "connection lost" or "timeout" messages
```

---

#### Issue 3: Offline Changes Not Syncing When Online

**Symptoms**:
- Made changes while offline
- Reconnected but changes don't appear on server
- Other users don't see offline changes

**Diagnostic Steps**:
```javascript
// Check if mutations are queued
indexedDB.open('zero-cache').onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('mutations', 'readonly');
  const store = tx.objectStore('mutations');
  const req = store.getAll();
  req.onsuccess = () => {
    console.log('Queued mutations:', req.result);
  };
};
```

**Solutions**:

**A. Force sync**:
```javascript
// If Zero exposes sync API
const zero = (window as any).__ZERO__;
if (zero?.sync) {
  zero.sync().then(() => {
    console.log('Manual sync completed');
  });
}
```

**B. Verify online status**:
```javascript
// Check browser online status
console.log('Navigator online:', navigator.onLine);

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('Browser is online');
});
```

**C. Clear and resync**:
```javascript
// Last resort: clear local cache and re-sync from server
indexedDB.deleteDatabase('zero-cache');
location.reload();
// All data will re-sync from server
```

---

#### Issue 4: High Latency (Slow Sync)

**Symptoms**:
- Updates take 5-10+ seconds to sync
- UI feels sluggish
- WebSocket messages delayed

**Diagnostic Steps**:
```bash
# 1. Check server load
top

# 2. Check database performance
psql -h localhost -U grocery -d grocery_db -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS bytes
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY bytes DESC;
"

# 3. Check network latency
ping localhost -c 10
```

**Solutions**:

**A. Optimize database queries**:
```sql
-- Check for missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';

-- Add indexes if missing
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON grocery_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON list_members(user_id);
```

**B. Reduce data volume**:
```sql
-- Archive or delete old lists
DELETE FROM lists WHERE updated_at < NOW() - INTERVAL '90 days';

-- Vacuum database
VACUUM ANALYZE;
```

**C. Scale zero-cache**:
- Increase zero-cache memory allocation
- Run zero-cache on dedicated server
- Use connection pooling

---

#### Issue 5: Conflict Resolution Not Working

**Symptoms**:
- Simultaneous edits cause errors
- Data gets overwritten unexpectedly
- Different users see different final states

**Diagnostic Steps**:
```javascript
// Monitor conflict events (if Zero exposes them)
const zero = (window as any).__ZERO__;
if (zero?.on) {
  zero.on('conflict', (event) => {
    console.log('Conflict detected:', event);
  });
}
```

**Solutions**:

**A. Verify Zero version**:
```bash
# Check package.json
cat package.json | grep "@rocicorp/zero"

# Update to latest version if needed
pnpm update @rocicorp/zero
```

**B. Check schema version**:
```typescript
// In zero-schema.ts
export const schema = {
  version: 5, // Increment if schema changed
  tables: { ... }
};
```

**C. Understand last-write-wins**:
- Zero uses last-write-wins by default
- Server timestamp determines winner
- Educate users about concurrent edits

---

#### Issue 6: Memory Leak / High Memory Usage

**Symptoms**:
- Browser memory usage grows over time
- Page becomes slow after extended use
- Eventually crashes or freezes

**Diagnostic Steps**:
```javascript
// Monitor memory usage
if (performance.memory) {
  console.log('Memory usage:', {
    usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
    jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
  });
}

// Check IndexedDB size
navigator.storage.estimate().then(estimate => {
  console.log('IndexedDB usage:', {
    usage: (estimate.usage / 1048576).toFixed(2) + ' MB',
    quota: (estimate.quota / 1048576).toFixed(2) + ' MB',
    percent: ((estimate.usage / estimate.quota) * 100).toFixed(2) + '%'
  });
});
```

**Solutions**:

**A. Clear old data**:
```javascript
// Implement data cleanup
async function cleanupOldData() {
  const zero = getZeroInstance();
  const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days

  // Delete old gotten items
  const oldItems = await zero.query.grocery_items
    .where('gotten', true)
    .where('createdAt', '<', cutoffDate)
    .toArray();

  for (const item of oldItems) {
    await zero.mutate.grocery_items.delete({ id: item.id });
  }
}
```

**B. Implement pagination**:
- Don't load all items at once
- Use virtual scrolling for long lists
- Limit query results

**C. Periodic refresh**:
```javascript
// Suggest page refresh after extended use
setInterval(() => {
  if (performance.memory && performance.memory.usedJSHeapSize > 200 * 1048576) {
    console.warn('High memory usage detected. Consider refreshing page.');
    // Optionally show user notification
  }
}, 60000); // Check every minute
```

---

### Debugging Tools

#### Enable Zero Debug Logging

```typescript
// In zero-store.ts or main.tsx
if (import.meta.env.DEV) {
  // Enable Zero debug logs
  (window as any).ZERO_DEBUG = true;
}
```

#### WebSocket Message Logging

```javascript
// Add to main.tsx or App.tsx
const originalWebSocket = WebSocket;
window.WebSocket = function(...args) {
  const ws = new originalWebSocket(...args);

  ws.addEventListener('message', (event) => {
    console.log('[WS RX]', event.data);
  });

  const originalSend = ws.send;
  ws.send = function(data) {
    console.log('[WS TX]', data);
    return originalSend.call(this, data);
  };

  return ws;
};
```

#### IndexedDB Inspector

```javascript
// Utility to inspect IndexedDB contents
async function inspectIndexedDB() {
  const dbs = await indexedDB.databases();
  console.log('Available databases:', dbs);

  for (const db of dbs) {
    const dbConnection = await new Promise((resolve) => {
      const req = indexedDB.open(db.name);
      req.onsuccess = () => resolve(req.result);
    });

    console.log(`\nDatabase: ${db.name}`);
    console.log('Object stores:', [...dbConnection.objectStoreNames]);

    for (const storeName of dbConnection.objectStoreNames) {
      const tx = dbConnection.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const count = await new Promise((resolve) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
      });
      console.log(`  ${storeName}: ${count} records`);
    }
  }
}

// Run in console
inspectIndexedDB();
```

---

## Test Results Template

Use this template to document test runs:

```markdown
# Real-Time Sync Test Results

## Test Run Information
- **Date**: 2025-10-26
- **Tester**: [Your Name]
- **Environment**: Development / Staging / Production
- **Zero Version**: [Version from package.json]
- **Browser**: Chrome 120.0.6099.109

## Test Summary
- **Total Scenarios**: 18
- **Passed**: X
- **Failed**: Y
- **Blocked**: Z
- **Pass Rate**: XX%

## Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Item Add Sync | < 200ms | 150ms | ✅ Pass |
| Item Update Sync | < 200ms | 180ms | ✅ Pass |
| Bulk Operation (10 items) | < 1s | 850ms | ✅ Pass |
| WebSocket Uptime | > 99% | 99.8% | ✅ Pass |
| Reconnect Time | < 2s | 1.2s | ✅ Pass |
| Memory Usage | < 100MB | 85MB | ✅ Pass |

## Scenario Results

### Scenario 2: Item Add Sync
- **Status**: ✅ Pass
- **Sync Latency**: 150ms
- **Notes**: Item appeared instantly, no issues

### Scenario 7: Offline/Online
- **Status**: ❌ Fail
- **Issue**: Offline changes didn't sync after 30 seconds
- **Error**: WebSocket failed to reconnect automatically
- **Severity**: High
- **Action**: Filed bug #123

[Repeat for all scenarios]

## Issues Found

### Issue 1: Slow Reconnection After Network Drop
- **Severity**: Medium
- **Scenario**: Scenario 7 (Offline/Online)
- **Description**: WebSocket takes 8-10 seconds to reconnect after network loss
- **Expected**: < 2 seconds
- **Actual**: 9.2 seconds average
- **Reproduction**:
  1. Disable network
  2. Wait 10 seconds
  3. Re-enable network
  4. Measure time to "connected" state
- **Environment**: Chrome 120, macOS 14
- **Recommendation**: Investigate reconnection backoff strategy

## Network Conditions Tested

| Profile | Latency | Result | Notes |
|---------|---------|--------|-------|
| Optimal | 50ms | ✅ Pass | All scenarios passed |
| Standard | 100ms | ✅ Pass | Slight delay, acceptable |
| Slow 3G | 400ms | ⚠️ Partial | Bulk ops timeout |
| Intermittent | Variable | ❌ Fail | Reconnection issues |

## Recommendations

1. **Improve Reconnection Logic**: Reduce backoff time for first reconnect attempt
2. **Add Offline Indicator**: Users should know when offline mode is active
3. **Optimize Bulk Operations**: Batch mutations for better performance
4. **Memory Optimization**: Clear old gotten items automatically

## Next Steps

- [ ] Fix Issue #1 (reconnection delay)
- [ ] Retest Scenario 7 after fix
- [ ] Performance test with 100+ items
- [ ] Cross-browser testing (Firefox, Safari)
```

---

## Conclusion

This comprehensive test plan covers 18 real-time collaboration scenarios, network condition testing, performance benchmarks, and detailed troubleshooting guidance.

### Test Coverage Summary

| Category | Scenarios | Focus |
|----------|-----------|-------|
| Basic Sync | 1-4 | Core sync operations |
| Reconnection | 5-7 | Offline/online transitions |
| Conflict Resolution | 8 | Concurrent edit handling |
| Membership Sync | 9-11 | Real-time access control |
| Bulk & Filters | 12-15 | Complex operations |
| List Management | 16-17 | List-level changes |
| Stress Testing | 18 | High concurrency |

### Key Takeaways

1. **Zero Handles Most Complexity**: Real-time sync, offline support, and conflict resolution are automatic
2. **WebSocket is Critical**: Monitor connection health and implement reconnection strategies
3. **Optimistic UI**: Local updates should be instant, sync happens in background
4. **Test Edge Cases**: Concurrent edits, network failures, and permission changes require special attention
5. **Performance Matters**: Measure sync latency and optimize for 200-500ms target

### Success Criteria for Production

Before deploying to production, ensure:
- ✅ All 18 scenarios pass consistently
- ✅ Sync latency < 500ms on standard network
- ✅ WebSocket uptime > 99%
- ✅ Offline mode works reliably
- ✅ No memory leaks after extended use
- ✅ Cross-browser compatibility verified
- ✅ Performance acceptable with 100+ items and 10+ users

---

**Document Version**: 1.0
**Last Updated**: 2025-10-26
**Maintained By**: Development Team
