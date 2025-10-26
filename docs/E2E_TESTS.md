# End-to-End Test Plan

Comprehensive end-to-end testing guide for the Grocery List application covering complete user journeys from account creation through collaboration workflows.

## Table of Contents
- [Overview](#overview)
- [Test Environment Setup](#test-environment-setup)
- [Primary User Journey](#primary-user-journey)
- [Complete E2E Test Scenarios](#complete-e2e-test-scenarios)
- [Test Data Management](#test-data-management)
- [Expected Timings](#expected-timings)
- [Verification Checkpoints](#verification-checkpoints)
- [Troubleshooting](#troubleshooting)

---

## Overview

This document provides a comprehensive end-to-end testing strategy that validates complete user workflows through the Grocery List application. Unlike unit or integration tests, E2E tests verify the entire system working together from a user's perspective.

### Test Objectives
- Validate complete user journeys from signup to collaboration
- Verify real-time synchronization across multiple users
- Test permission changes and their immediate effects
- Validate list ownership transfer workflows
- Test data export and archiving features
- Ensure seamless multi-user collaboration

### Test Coverage
- **User Management**: Registration, login, profile management
- **List Operations**: Create, edit, delete, archive, export
- **Item Management**: Add, edit, delete, mark as gotten, bulk operations
- **Collaboration**: Share, invite, permission management, ownership transfer
- **Real-Time Sync**: Multi-user concurrent operations
- **Notifications**: Activity feeds, updates, alerts
- **Search & Filter**: Find items, category filtering, sorting

---

## Test Environment Setup

### Prerequisites

#### System Requirements
```bash
# Required services
1. PostgreSQL 14+ (running on port 5432)
2. Node.js 18+ and pnpm
3. Zero sync server (port 4848)
4. Backend API server (port 3001)
5. Frontend dev server (port 5173)
```

#### Service Startup
```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Run database migrations
cd server
pnpm migrate

# 3. Start Zero sync server
pnpm zero:dev

# 4. Start backend API server (separate terminal)
cd server
pnpm dev

# 5. Start frontend dev server (separate terminal)
pnpm dev
```

#### Service Health Checks
```bash
# Verify all services are running
curl http://localhost:3001/health        # API server
curl http://localhost:4848/health        # Zero sync
curl http://localhost:5173               # Frontend
psql -h localhost -U grocery -d grocery_db -c "SELECT 1"  # PostgreSQL
```

### Browser Configuration

#### Multi-User Testing Setup
For testing collaboration features, you'll need multiple isolated browser sessions:

**Option 1: Multiple Browser Profiles (Recommended)**
```
Chrome:
1. Create Profile A: Settings > Add Person > "User A"
2. Create Profile B: Settings > Add Person > "User B"
3. Each profile maintains separate cookies/storage
```

**Option 2: Different Browsers**
```
- Chrome for User A
- Firefox for User B
- Safari for User C (if available)
```

**Option 3: Incognito Windows**
```
- Regular window for User A
- Incognito window for User B
- Note: May have limitations with some features
```

#### Browser Developer Tools Setup
Enable these panels in each browser:
- **Console**: Monitor logs, errors, Zero sync messages
- **Network**: Track API calls, WebSocket connections, timing
- **Application > IndexedDB**: Inspect local cache
- **Application > Local Storage**: View auth tokens, user data
- **Application > Session Storage**: Check temporary state

### Test Data Preparation

#### Clean Database State
```sql
-- Clear all test data (run before test suite)
DELETE FROM activities WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'E2E Test%'
);
DELETE FROM grocery_items WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'E2E Test%'
);
DELETE FROM list_members WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'E2E Test%'
);
DELETE FROM lists WHERE name LIKE 'E2E Test%';
DELETE FROM users WHERE email LIKE '%@e2etest.com';
```

#### Test User Credentials Template
```
User A (List Owner):
  - Email: user-a@e2etest.com
  - Password: TestPass123!
  - Name: Alice Cooper

User B (Collaborator):
  - Email: user-b@e2etest.com
  - Password: TestPass123!
  - Name: Bob Smith

User C (Viewer):
  - Email: user-c@e2etest.com
  - Password: TestPass123!
  - Name: Carol Davis
```

### Network Simulation

#### Test Different Network Conditions
```javascript
// Chrome DevTools > Network > Throttling

// Good Connection (default)
Network: No throttling

// Standard Connection
Network: Fast 3G
- Download: 1.6 Mbps
- Upload: 750 Kbps
- Latency: 150ms

// Slow Connection
Network: Slow 3G
- Download: 400 Kbps
- Upload: 400 Kbps
- Latency: 2000ms

// Offline
Network: Offline
```

---

## Primary User Journey

### Complete User Journey: Signup to Collaboration

This is the **primary end-to-end test scenario** that validates the most common user workflow.

#### Journey Overview
```
Timeline: ~5-10 minutes
Users: User A (Owner) and User B (Collaborator)

Flow:
1. User A creates account
2. User A creates list and adds items
3. User A shares list with User B
4. User B accepts and adds items
5. Both users see real-time updates
6. User A changes User B's permission
7. User B sees UI update (read-only)
8. User A transfers ownership
9. Original User A can still edit
10. Test list archiving and export
```

---

#### Scenario E2E-01: Complete User Journey (Primary)
**Priority**: P0 (Critical)
**Duration**: 8-10 minutes
**Users**: 2 (User A, User B)

##### Setup
- Clean database state
- Two browser profiles/windows ready
- All services running and healthy

##### Test Steps

**Phase 1: User A Registration and List Creation (Browser A)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 1.1 | Navigate to http://localhost:5173 | App loads, shows login/register page | 1-2s | ✓ Page renders |
| 1.2 | Click "Register" link | Registration form appears | <100ms | ✓ Form visible |
| 1.3 | Fill form:<br>- Name: "Alice Cooper"<br>- Email: "user-a@e2etest.com"<br>- Password: "TestPass123!"<br>- Confirm: "TestPass123!" | Fields accept input | N/A | ✓ No validation errors |
| 1.4 | Click "Create Account" | Registration successful, auto-login | 300-500ms | ✓ Redirect to dashboard |
| 1.5 | Verify dashboard loads | Shows empty list, welcome message | 200-400ms | ✓ Dashboard visible |
| 1.6 | Click "Create New List" | List creation modal opens | <100ms | ✓ Modal appears |
| 1.7 | Enter list name: "E2E Test Shopping" | Name field updates | N/A | ✓ Text appears |
| 1.8 | Click "Create List" | List created, added to dropdown | 400-600ms | ✓ List selected |
| 1.9 | Verify list is active | List name appears in header | <100ms | ✓ Header updated |

**Verification Checkpoint 1A:**
```javascript
// In Browser A console
console.assert(
  document.querySelector('.list-selector')?.textContent.includes('E2E Test Shopping'),
  'List should be created and selected'
);
```

**Database Verification 1A:**
```sql
-- Verify user and list were created
SELECT
  u.name as user_name,
  u.email,
  l.name as list_name,
  lm.permission_level
FROM users u
JOIN list_members lm ON lm.user_id = u.id
JOIN lists l ON l.id = lm.list_id
WHERE u.email = 'user-a@e2etest.com'
  AND l.name = 'E2E Test Shopping';

-- Expected: 1 row showing Alice as owner
```

---

**Phase 2: User A Adds Items (Browser A)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 2.1 | Fill add item form:<br>- Name: "Milk"<br>- Quantity: 2<br>- Category: "Dairy" | Form accepts input | N/A | ✓ Fields filled |
| 2.2 | Click "Add Item" | Item appears in list | 200-400ms | ✓ Item visible |
| 2.3 | Add second item:<br>- Name: "Bread"<br>- Quantity: 1<br>- Category: "Bakery" | Item appears in list | 200-400ms | ✓ Item visible |
| 2.4 | Add third item:<br>- Name: "Apples"<br>- Quantity: 6<br>- Category: "Produce" | Item appears in list | 200-400ms | ✓ Item visible |
| 2.5 | Add fourth item with notes:<br>- Name: "Coffee"<br>- Quantity: 1<br>- Category: "Beverages"<br>- Notes: "Dark roast only" | Item with notes icon | 200-400ms | ✓ Notes icon visible |
| 2.6 | Add fifth item:<br>- Name: "Eggs"<br>- Quantity: 12<br>- Category: "Dairy" | Item appears in list | 200-400ms | ✓ Item visible |

**Verification Checkpoint 2A:**
```javascript
// In Browser A console
const itemCount = document.querySelectorAll('.grocery-item').length;
console.assert(itemCount === 5, `Expected 5 items, got ${itemCount}`);
```

**Database Verification 2A:**
```sql
-- Verify items were created
SELECT
  name,
  quantity,
  category,
  notes,
  gotten
FROM grocery_items
WHERE list_id = (SELECT id FROM lists WHERE name = 'E2E Test Shopping')
ORDER BY created_at;

-- Expected: 5 rows with correct data
```

---

**Phase 3: User B Registration (Browser B)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 3.1 | Open http://localhost:5173 in Browser B | App loads, shows login/register | 1-2s | ✓ Page renders |
| 3.2 | Click "Register" | Registration form appears | <100ms | ✓ Form visible |
| 3.3 | Fill form:<br>- Name: "Bob Smith"<br>- Email: "user-b@e2etest.com"<br>- Password: "TestPass123!"<br>- Confirm: "TestPass123!" | Fields accept input | N/A | ✓ No validation errors |
| 3.4 | Click "Create Account" | Registration successful, auto-login | 300-500ms | ✓ Redirect to dashboard |
| 3.5 | Verify empty state | Dashboard shows "No lists yet" | <100ms | ✓ Empty state visible |

**Verification Checkpoint 3A:**
```javascript
// In Browser B console
console.assert(
  document.querySelector('.empty-state') !== null,
  'Should show empty state for new user'
);
```

---

**Phase 4: User A Shares List with User B (Browser A)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 4.1 | Click "Share List" button (in header or list actions) | Share modal opens | <100ms | ✓ Modal appears |
| 4.2 | Enter email: "user-b@e2etest.com" | Email field accepts input | N/A | ✓ Email entered |
| 4.3 | Select permission: "Editor" | Dropdown shows "Editor" selected | <50ms | ✓ Permission selected |
| 4.4 | Click "Add Member" | Member added to list | 400-800ms | ✓ Success message |
| 4.5 | Verify Bob appears in members | Shows "Bob Smith (Editor)" | <100ms | ✓ Member listed |
| 4.6 | Close share modal | Modal closes, returns to list | <100ms | ✓ Modal closed |

**Verification Checkpoint 4A:**
```javascript
// In Browser A console
const membersList = document.querySelector('.members-list')?.textContent;
console.assert(
  membersList?.includes('Bob Smith'),
  'Bob should appear in members list'
);
```

**Database Verification 4A:**
```sql
-- Verify list membership
SELECT
  u.name,
  u.email,
  lm.permission_level,
  lm.joined_at
FROM list_members lm
JOIN users u ON u.id = lm.user_id
WHERE lm.list_id = (SELECT id FROM lists WHERE name = 'E2E Test Shopping')
ORDER BY lm.joined_at;

-- Expected: 2 rows (Alice: owner, Bob: editor)
```

---

**Phase 5: User B Sees Shared List (Browser B)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 5.1 | Wait for sync (no manual refresh) | List appears in dropdown | 1-3s | ✓ List synced |
| 5.2 | Observe list dropdown | "E2E Test Shopping (shared)" visible | N/A | ✓ Shared indicator |
| 5.3 | Click on shared list | List opens, shows all 5 items | 300-500ms | ✓ Items loaded |
| 5.4 | Verify all items visible | Milk, Bread, Apples, Coffee (w/notes), Eggs | N/A | ✓ All items present |
| 5.5 | Verify editor permissions | Add item form is enabled | N/A | ✓ Can edit |
| 5.6 | Check permission badge | Shows "Editor" badge in UI | N/A | ✓ Badge visible |

**Verification Checkpoint 5A:**
```javascript
// In Browser B console
const itemCount = document.querySelectorAll('.grocery-item').length;
console.assert(itemCount === 5, `Expected 5 items, got ${itemCount}`);

const addButton = document.querySelector('.add-item-form button[type="submit"]');
console.assert(!addButton.disabled, 'Add button should be enabled for editor');
```

---

**Phase 6: User B Adds Items (Browser B)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 6.1 | Add item:<br>- Name: "Cheese"<br>- Quantity: 1<br>- Category: "Dairy" | Item appears in Browser B | 200-400ms | ✓ Item visible |
| 6.2 | Observe Browser A (no interaction) | "Cheese" appears automatically | 500-1500ms | ✓ Real-time sync |
| 6.3 | Add item:<br>- Name: "Bananas"<br>- Quantity: 4<br>- Category: "Produce" | Item appears in Browser B | 200-400ms | ✓ Item visible |
| 6.4 | Observe Browser A | "Bananas" appears automatically | 500-1500ms | ✓ Real-time sync |

**Verification Checkpoint 6A:**
```javascript
// In Browser A console (should now show 7 items)
const itemCount = document.querySelectorAll('.grocery-item').length;
console.assert(itemCount === 7, `Expected 7 items, got ${itemCount}`);
```

**Verification Checkpoint 6B:**
```javascript
// In Browser B console (should also show 7 items)
const itemCount = document.querySelectorAll('.grocery-item').length;
console.assert(itemCount === 7, `Expected 7 items, got ${itemCount}`);
```

---

**Phase 7: Both Users Mark Items (Real-Time Sync Test)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 7.1 | **Browser A**: Check "Milk" | Item marked as gotten in A | <100ms | ✓ Checkbox checked |
| 7.2 | **Browser B**: Observe | "Milk" gets checked | 500-1500ms | ✓ Synced to B |
| 7.3 | **Browser B**: Check "Bread" | Item marked as gotten in B | <100ms | ✓ Checkbox checked |
| 7.4 | **Browser A**: Observe | "Bread" gets checked | 500-1500ms | ✓ Synced to A |
| 7.5 | Both browsers | Both show 2 items checked | N/A | ✓ Consistent state |

**Verification Checkpoint 7A:**
```javascript
// Run in BOTH Browser A and Browser B consoles
const checkedCount = document.querySelectorAll('.grocery-item input[type="checkbox"]:checked').length;
console.assert(checkedCount === 2, `Expected 2 checked items, got ${checkedCount}`);
```

---

**Phase 8: User A Changes User B's Permission to Viewer (Browser A)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 8.1 | Click "Share List" button | Share modal opens | <100ms | ✓ Modal appears |
| 8.2 | Find Bob in members list | Bob Smith listed as "Editor" | N/A | ✓ Member found |
| 8.3 | Change permission dropdown from "Editor" to "Viewer" | Dropdown updates | <50ms | ✓ Selection changed |
| 8.4 | Permission auto-saves | Success message appears | 400-800ms | ✓ Permission saved |
| 8.5 | Verify Bob now shows "Viewer" | Member list updates | <100ms | ✓ UI updated |
| 8.6 | Close modal | Modal closes | <50ms | ✓ Modal closed |

**Verification Checkpoint 8A:**
```javascript
// In Browser A console
const bobPermission = document.querySelector('.members-list')?.textContent;
console.assert(
  bobPermission?.includes('Viewer'),
  'Bob should now be Viewer'
);
```

---

**Phase 9: User B Sees UI Update to Read-Only (Browser B)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 9.1 | Wait for sync (no manual action) | UI updates automatically | 1-3s | ✓ Permission synced |
| 9.2 | Observe add item form | Form becomes disabled | N/A | ✓ Form disabled |
| 9.3 | Observe item checkboxes | All checkboxes disabled | N/A | ✓ Checkboxes disabled |
| 9.4 | Observe delete buttons | All delete buttons hidden/disabled | N/A | ✓ Buttons hidden |
| 9.5 | Check permission badge | Shows "Viewer" badge | N/A | ✓ Badge updated |
| 9.6 | Try to check an item | Checkbox does not respond | N/A | ✓ Interaction blocked |
| 9.7 | Observe read-only notice | "View-only access" message visible | N/A | ✓ Notice shown |

**Verification Checkpoint 9A:**
```javascript
// In Browser B console
const addButton = document.querySelector('.add-item-form button[type="submit"]');
console.assert(addButton?.disabled === true, 'Add button should be disabled');

const checkboxes = document.querySelectorAll('.grocery-item input[type="checkbox"]');
const allDisabled = Array.from(checkboxes).every(cb => cb.disabled);
console.assert(allDisabled, 'All checkboxes should be disabled');
```

---

**Phase 10: User A Transfers Ownership to User B (Browser A)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 10.1 | Open share modal | Modal opens | <100ms | ✓ Modal appears |
| 10.2 | Find "Transfer Ownership" section | Section visible (usually at bottom) | N/A | ✓ Section found |
| 10.3 | Select Bob from ownership dropdown | Bob selected | <50ms | ✓ Selection made |
| 10.4 | Click "Transfer Ownership" button | Confirmation dialog appears | <100ms | ✓ Confirm dialog |
| 10.5 | Type list name to confirm | Confirmation field accepts input | N/A | ✓ Confirmation typed |
| 10.6 | Confirm transfer | Ownership transferred | 600-1000ms | ✓ Success message |
| 10.7 | Verify Alice is now "Editor" | Members list shows Alice as Editor | <100ms | ✓ Role changed |
| 10.8 | Verify Bob is now "Owner" | Members list shows Bob as Owner | <100ms | ✓ Ownership transferred |

**Verification Checkpoint 10A:**
```javascript
// In Browser A console
const membersList = document.querySelector('.members-list')?.textContent;
console.assert(
  membersList?.includes('Bob Smith') && membersList?.includes('Owner'),
  'Bob should be owner'
);
console.assert(
  membersList?.includes('Alice Cooper') && membersList?.includes('Editor'),
  'Alice should be editor'
);
```

**Database Verification 10A:**
```sql
-- Verify ownership transfer
SELECT
  u.name,
  u.email,
  lm.permission_level,
  l.owner_user_id
FROM list_members lm
JOIN users u ON u.id = lm.user_id
JOIN lists l ON l.id = lm.list_id
WHERE l.name = 'E2E Test Shopping';

-- Expected: Bob is owner, Alice is editor
```

---

**Phase 11: User B (Now Owner) Verifies Full Access (Browser B)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 11.1 | Wait for sync | Permission updates | 1-3s | ✓ Permissions updated |
| 11.2 | Observe UI changes | All controls become enabled | N/A | ✓ Full access |
| 11.3 | Verify add item form | Form is enabled | N/A | ✓ Can add items |
| 11.4 | Verify checkboxes | All interactive | N/A | ✓ Can toggle |
| 11.5 | Check for "Share List" button | Button is now visible | N/A | ✓ Owner control |
| 11.6 | Verify "Owner" badge | Shows owner badge | N/A | ✓ Badge updated |

**Verification Checkpoint 11A:**
```javascript
// In Browser B console
const addButton = document.querySelector('.add-item-form button[type="submit"]');
console.assert(!addButton?.disabled, 'Add button should be enabled');

const shareButton = document.querySelector('.btn-share');
console.assert(shareButton !== null, 'Share button should be visible');
```

---

**Phase 12: User A (Now Editor) Can Still Edit (Browser A)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 12.1 | Verify Alice is editor | Shows "Editor" badge | N/A | ✓ Badge visible |
| 12.2 | Add new item:<br>- Name: "Butter"<br>- Quantity: 1<br>- Category: "Dairy" | Item added successfully | 200-400ms | ✓ Item created |
| 12.3 | Mark "Apples" as gotten | Checkbox toggles | <100ms | ✓ Can mark items |
| 12.4 | Edit "Coffee" quantity to 2 | Edit succeeds | 300-500ms | ✓ Can edit |
| 12.5 | Verify no ownership controls | "Share List" button hidden | N/A | ✓ No owner controls |

**Verification Checkpoint 12A:**
```javascript
// In Browser A console
const addButton = document.querySelector('.add-item-form button[type="submit"]');
console.assert(!addButton?.disabled, 'Editor should be able to add items');

const shareButton = document.querySelector('.btn-share');
console.assert(shareButton === null || shareButton.disabled, 'Editor should not see share button');
```

---

**Phase 13: Test List Export (Browser B - Owner)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 13.1 | Click list actions menu | Menu opens | <100ms | ✓ Menu visible |
| 13.2 | Click "Export List" | Export options appear | <100ms | ✓ Options shown |
| 13.3 | Select "Export as CSV" | CSV download starts | 500-1000ms | ✓ Download initiated |
| 13.4 | Verify CSV file | File contains all 8 items | N/A | ✓ Data correct |
| 13.5 | Select "Export as JSON" | JSON download starts | 500-1000ms | ✓ Download initiated |
| 13.6 | Verify JSON file | File contains complete data | N/A | ✓ JSON valid |

**Verification Checkpoint 13A:**
```javascript
// Manual verification of downloaded files

// CSV should contain:
// Name,Quantity,Category,Gotten,Notes
// Milk,2,Dairy,true,
// Bread,1,Bakery,true,
// Apples,6,Produce,true,
// Coffee,2,Beverages,false,"Dark roast only"
// Eggs,12,Dairy,false,
// Cheese,1,Dairy,false,
// Bananas,4,Produce,false,
// Butter,1,Dairy,false,

// JSON should contain complete list and item objects
```

---

**Phase 14: Test List Archiving (Browser B - Owner)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 14.1 | Click list actions menu | Menu opens | <100ms | ✓ Menu visible |
| 14.2 | Click "Archive List" | Confirmation dialog appears | <100ms | ✓ Dialog shown |
| 14.3 | Confirm archiving | List archived successfully | 400-800ms | ✓ Success message |
| 14.4 | Verify list moved to archived | List removed from active lists | <200ms | ✓ List archived |
| 14.5 | Navigate to "Archived Lists" | Archived section shows list | 300-500ms | ✓ List visible |
| 14.6 | Verify read-only mode | All editing disabled | N/A | ✓ Read-only |
| 14.7 | Observe Browser A | List also archived for Alice | 1-3s | ✓ Synced |

**Verification Checkpoint 14A:**
```javascript
// In Browser B console
const archivedBadge = document.querySelector('.archived-badge');
console.assert(archivedBadge !== null, 'List should show archived badge');

const addButton = document.querySelector('.add-item-form button[type="submit"]');
console.assert(addButton === null || addButton.disabled, 'Cannot add items to archived list');
```

**Database Verification 14A:**
```sql
-- Verify list is archived
SELECT
  name,
  is_archived,
  archived_at,
  archived_by_user_id
FROM lists
WHERE name = 'E2E Test Shopping';

-- Expected: is_archived = true, archived_at has timestamp
```

---

**Phase 15: Restore from Archive (Browser B - Owner)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 15.1 | In archived view, click "Restore" | Confirmation dialog | <100ms | ✓ Dialog shown |
| 15.2 | Confirm restore | List restored to active | 400-800ms | ✓ Success message |
| 15.3 | Verify list in active lists | List appears in main dropdown | <200ms | ✓ List active |
| 15.4 | Verify editing enabled | All controls active | N/A | ✓ Can edit |
| 15.5 | Observe Browser A | List restored for Alice too | 1-3s | ✓ Synced |

**Verification Checkpoint 15A:**
```javascript
// In Browser B console
const addButton = document.querySelector('.add-item-form button[type="submit"]');
console.assert(!addButton?.disabled, 'Should be able to add items after restore');
```

---

**Phase 16: Cleanup (Optional)**

| Step | Action | Expected Result | Timing | Checkpoint |
|------|--------|----------------|--------|------------|
| 16.1 | Browser B: Delete list | Confirmation dialog | <100ms | ✓ Dialog shown |
| 16.2 | Type list name to confirm | Confirmation accepted | N/A | ✓ Confirmed |
| 16.3 | Confirm deletion | List deleted | 600-1000ms | ✓ Success message |
| 16.4 | Both browsers redirect | Return to empty state | <200ms | ✓ List gone |
| 16.5 | Logout both users | Return to login page | <100ms | ✓ Logged out |

---

### Primary Journey Summary

**Total Steps**: 79
**Total Duration**: 8-10 minutes
**Total Sync Points**: 12 real-time synchronization checks
**Database Verifications**: 5
**Users Involved**: 2

**Key Validations**:
- ✓ User registration and authentication
- ✓ List creation and management
- ✓ Item CRUD operations
- ✓ Real-time multi-user collaboration
- ✓ Permission system (owner, editor, viewer)
- ✓ Dynamic permission changes
- ✓ Ownership transfer
- ✓ Export functionality (CSV, JSON)
- ✓ List archiving and restoration
- ✓ Graceful state synchronization

---

## Complete E2E Test Scenarios

### Scenario Index

| ID | Scenario | Users | Duration | Priority |
|----|----------|-------|----------|----------|
| E2E-01 | Complete User Journey (Primary) | 2 | 8-10 min | P0 |
| E2E-02 | Three-User Collaboration | 3 | 10-12 min | P0 |
| E2E-03 | Concurrent Editing Stress Test | 4 | 8-10 min | P1 |
| E2E-04 | Offline-to-Online Recovery | 2 | 12-15 min | P1 |
| E2E-05 | Permission Downgrade Flow | 2 | 6-8 min | P0 |
| E2E-06 | List Template Creation & Use | 2 | 8-10 min | P1 |
| E2E-07 | Bulk Operations Workflow | 2 | 6-8 min | P1 |
| E2E-08 | Search and Filter Integration | 1 | 5-7 min | P2 |
| E2E-09 | Mobile Responsive Journey | 1 | 8-10 min | P1 |
| E2E-10 | Account Recovery Flow | 1 | 6-8 min | P0 |
| E2E-11 | Multi-List Management | 2 | 10-12 min | P1 |
| E2E-12 | Category Management | 2 | 6-8 min | P2 |
| E2E-13 | Notification System | 2 | 8-10 min | P1 |
| E2E-14 | List Sharing via Invite Link | 2 | 8-10 min | P0 |
| E2E-15 | Member Removal & Re-invitation | 3 | 10-12 min | P1 |
| E2E-16 | Data Import from External | 1 | 6-8 min | P2 |
| E2E-17 | Activity Log Verification | 2 | 6-8 min | P2 |
| E2E-18 | Keyboard Navigation | 1 | 8-10 min | P2 |
| E2E-19 | Network Interruption Recovery | 2 | 10-12 min | P1 |
| E2E-20 | Security: Session Management | 2 | 8-10 min | P0 |
| E2E-21 | Performance: Large List Handling | 2 | 10-15 min | P1 |
| E2E-22 | Cross-Browser Compatibility | 2 | 15-20 min | P1 |

---

### Scenario E2E-02: Three-User Collaboration
**Priority**: P0
**Duration**: 10-12 minutes
**Users**: 3 (Owner, Editor, Viewer)

#### Objective
Test collaboration with three different permission levels simultaneously.

#### Setup
- Three browser profiles (A, B, C)
- Clean database state
- All services running

#### Test Flow

**Phase 1: Setup Users and List**
1. User A registers and creates list "Team Shopping"
2. User B registers
3. User C registers
4. User A shares list:
   - User B as Editor
   - User C as Viewer

**Phase 2: Multi-User Operations**
5. User A adds 3 items
6. User B adds 2 items (all 3 users see updates)
7. User C observes all 5 items (cannot edit)
8. User B marks 2 items as gotten
9. All users see gotten items simultaneously

**Phase 3: Permission Testing**
10. User C tries to add item → blocked (verify)
11. User B successfully adds item
12. User A changes User B to Viewer
13. User B loses edit access (UI updates)
14. User A promotes User C to Editor
15. User C gains edit access (UI updates)

**Phase 4: Concurrent Editing**
16. User A and User C both add items simultaneously
17. Both items appear for all users
18. User A marks item as gotten
19. User C marks different item
20. All users see both changes

#### Expected Results
- All permission levels work correctly
- Real-time sync works with 3 concurrent users
- Permission changes take effect immediately
- No conflicts or data loss

#### Verification Checkpoints
```javascript
// All 3 browsers should show same item count
const itemCount = document.querySelectorAll('.grocery-item').length;
console.log('Item count:', itemCount);

// User C should have viewer UI
const addButton = document.querySelector('.add-item-form button[type="submit"]');
console.assert(addButton?.disabled === true, 'Viewer should not be able to add items');
```

---

### Scenario E2E-03: Concurrent Editing Stress Test
**Priority**: P1
**Duration**: 8-10 minutes
**Users**: 4

#### Objective
Validate system stability under heavy concurrent editing load.

#### Test Flow

**Phase 1: Setup**
1. Create 4 test users (all editors)
2. Owner creates list and shares with all
3. All 4 users open list simultaneously

**Phase 2: Rapid Concurrent Operations**
4. Within 30 seconds, all users perform:
   - User A: Add 5 items rapidly
   - User B: Add 5 items rapidly
   - User C: Mark 5 items as gotten
   - User D: Edit 5 item quantities

**Phase 3: Verification**
5. Wait 10 seconds for all syncs to complete
6. All users should see same final state
7. Total items should be correct
8. No duplicates or lost updates

#### Expected Results
- All 20 operations complete successfully
- No data corruption
- All users reach eventual consistency
- No system crashes or errors

#### Performance Expectations
- Sync latency < 2 seconds
- UI remains responsive
- No WebSocket disconnections

---

### Scenario E2E-04: Offline-to-Online Recovery
**Priority**: P1
**Duration**: 12-15 minutes
**Users**: 2

#### Objective
Test offline resilience and data synchronization upon reconnection.

#### Test Flow

**Phase 1: Normal Operation**
1. User A and B both viewing shared list
2. Both users add 2 items each (4 total)
3. Verify sync works normally

**Phase 2: User A Goes Offline**
4. Disable network in Browser A (DevTools > Network > Offline)
5. User A adds 3 items while offline
6. User A marks 2 items as gotten
7. User A edits 1 item quantity
8. Verify changes appear locally in Browser A

**Phase 3: User B Makes Changes (While A is Offline)**
9. User B adds 2 items
10. User B deletes 1 item
11. User B marks 2 items as gotten
12. Verify changes appear in Browser B only

**Phase 4: User A Reconnects**
13. Re-enable network in Browser A
14. Wait for automatic reconnection (1-5s)
15. Observe sync process

**Phase 5: Verification**
16. Both browsers should show identical state
17. All 6 operations from User A should be reflected
18. All 3 operations from User B should be reflected
19. No data loss or corruption

#### Expected Results
- Offline changes queued locally
- Reconnection happens automatically
- All queued mutations sync successfully
- Eventual consistency achieved
- No conflicts or lost data

#### Verification Checkpoints
```javascript
// After reconnection, both browsers should match
const itemCount = document.querySelectorAll('.grocery-item').length;
const gottenCount = document.querySelectorAll('.grocery-item input:checked').length;
console.log('Total items:', itemCount, 'Gotten:', gottenCount);
```

---

### Scenario E2E-05: Permission Downgrade Flow
**Priority**: P0
**Duration**: 6-8 minutes
**Users**: 2

#### Objective
Test permission changes and their immediate effect on UI and functionality.

#### Test Flow

**Phase 1: Setup**
1. User A (Owner) creates list with 5 items
2. User B joins as Editor

**Phase 2: Editor Capabilities**
3. User B adds 2 items successfully
4. User B marks 2 items as gotten
5. User B edits 1 item
6. Verify all operations succeed

**Phase 3: Downgrade to Viewer**
7. User A changes User B permission to Viewer
8. User B's UI updates within 2 seconds
9. Verify User B cannot:
   - Add items (button disabled)
   - Check items (checkboxes disabled)
   - Edit items (no edit button)
   - Delete items (no delete button)

**Phase 4: Attempt Restricted Actions**
10. User B tries to check an item → blocked
11. User B sees "View-only access" notice
12. Verify API calls return 403 Forbidden

**Phase 5: Upgrade Back to Editor**
13. User A changes User B back to Editor
14. User B's UI updates within 2 seconds
15. User B can now edit again
16. User B adds an item successfully

#### Expected Results
- Permission changes sync within 2 seconds
- UI updates match permission level
- API enforces permissions
- Clear user feedback on restrictions

---

### Scenario E2E-06: List Template Creation & Use
**Priority**: P1
**Duration**: 8-10 minutes
**Users**: 2

#### Objective
Test creating reusable list templates and using them to create new lists.

#### Test Flow

**Phase 1: Create Template**
1. User A creates list "Weekly Groceries Template"
2. User A adds 15 common items:
   - 5 produce items
   - 5 dairy items
   - 5 pantry items
3. User A marks list as template
4. Template saved successfully

**Phase 2: Use Template**
5. User B creates new list from template
6. Select "Weekly Groceries Template"
7. Name new list "My Weekly Shopping"
8. All 15 items copied to new list
9. Items are unchecked (reset gotten status)
10. User B is owner of new list

**Phase 3: Modify and Share**
11. User B adds 3 additional items
12. User B shares list with User A as Editor
13. User A can see and edit the list
14. Original template unchanged

#### Expected Results
- Templates can be created and saved
- Templates can be used to create new lists
- All items copied correctly
- Ownership properly assigned
- Template remains unmodified

---

### Scenario E2E-07: Bulk Operations Workflow
**Priority**: P1
**Duration**: 6-8 minutes
**Users**: 2

#### Objective
Test bulk operations on items and their synchronization.

#### Test Flow

**Phase 1: Setup Large List**
1. User A creates list with 20 items
2. User B joins as Editor
3. Both users mark 10 items as gotten

**Phase 2: Bulk Operations**
4. User A selects "Mark All as Gotten"
5. All 20 items get checked
6. User B sees all items checked within 2 seconds
7. User A selects "Clear Gotten Items"
8. All 20 gotten items deleted
9. User B sees items disappear
10. List is now empty

**Phase 3: Bulk Add**
11. User B uses "Import from Template"
12. Selects template with 15 items
13. All 15 items added to list
14. User A sees all new items

**Phase 4: Category Bulk Actions**
15. User A filters by "Produce" (5 items)
16. User A selects "Mark Category as Gotten"
17. All 5 produce items checked
18. Other categories remain unchecked
19. User B sees same state

#### Expected Results
- Bulk operations complete successfully
- Changes sync to all users
- Performance acceptable for large operations
- No partial states or inconsistencies

---

### Scenario E2E-08: Search and Filter Integration
**Priority**: P2
**Duration**: 5-7 minutes
**Users**: 1

#### Objective
Test search, filter, and sort functionality with real-time updates.

#### Test Flow

**Phase 1: Setup Data**
1. User creates list with 30 items
2. Items across 5 categories
3. 15 items marked as gotten

**Phase 2: Search**
4. Search for "milk" → 3 results
5. Clear search → all 30 items
6. Search for "apple" → 2 results

**Phase 3: Filter by Category**
7. Select "Produce" filter → 10 items
8. Select "Dairy" filter → 8 items
9. Select "All Categories" → 30 items

**Phase 4: Filter by Status**
10. Select "Needed" → 15 ungotten items
11. Select "Gotten" → 15 gotten items
12. Select "All" → 30 items

**Phase 5: Sort**
13. Sort by "Name A-Z" → alphabetical order
14. Sort by "Name Z-A" → reverse order
15. Sort by "Date Added" → chronological
16. Sort by "Category" → grouped by category

**Phase 6: Combined Filters**
17. Category: "Produce" + Status: "Needed" → 5 items
18. Search: "milk" + Category: "Dairy" → 2 items
19. Clear all filters → 30 items

#### Expected Results
- All filters work correctly
- Search is case-insensitive
- Multiple filters can be combined
- Sort orders maintain filter criteria
- Counts update correctly

---

### Scenario E2E-14: List Sharing via Invite Link
**Priority**: P0
**Duration**: 8-10 minutes
**Users**: 2

#### Objective
Test list sharing using invite links instead of direct user invitation.

#### Test Flow

**Phase 1: Generate Invite Link**
1. User A creates list "Shared via Link"
2. User A adds 5 items
3. User A clicks "Share via Link"
4. User A sets permission: "Editor"
5. User A sets expiry: 7 days
6. Invite link generated
7. User A copies link

**Phase 2: User B Joins via Link**
8. User B (not logged in) opens invite link
9. Registration/login prompt appears
10. User B registers new account
11. After registration, redirected to list
12. User B automatically joined as Editor
13. User B sees all 5 items

**Phase 3: Test Invite Link Features**
14. User B adds 2 items successfully
15. User A sees new items
16. User A views "Members" → sees User B
17. Invite link still valid (reusable)

**Phase 4: Revoke Invite Link**
18. User A clicks "Revoke Invite Link"
19. Confirmation dialog appears
20. Link revoked successfully
21. New users can't use old link
22. Existing members (User B) retain access

**Phase 5: Test Expired Link**
23. User A creates new invite link
24. User A sets expiry: "1 hour"
25. Manually update database to expired date
26. User C tries to use expired link
27. Error: "Invite link has expired"

#### Expected Results
- Invite links work for new users
- Links can be reusable or single-use
- Expiration is enforced
- Revoked links don't work
- Existing members unaffected by revocation

---

### Additional Scenario Summaries

**E2E-09: Mobile Responsive Journey**
- Test complete flow on mobile viewport
- Touch interactions for all features
- Responsive UI adapts correctly
- Performance acceptable on mobile

**E2E-10: Account Recovery Flow**
- Forgot password workflow
- Email verification (mock)
- Password reset
- Re-login with new password

**E2E-11: Multi-List Management**
- Create 5 different lists
- Switch between lists
- Different members per list
- Archive/unarchive multiple lists

**E2E-12: Category Management**
- Create custom categories
- Edit category colors
- Filter by custom categories
- Delete categories (items reassigned)

**E2E-13: Notification System**
- New item notifications
- Member joined notifications
- Permission change alerts
- Activity feed updates

**E2E-15: Member Removal & Re-invitation**
- Remove member from list
- Member loses access
- Re-invite same member
- Member regains access with new permissions

**E2E-16: Data Import from External**
- Import CSV file
- Parse and validate data
- Create items from import
- Handle errors gracefully

**E2E-17: Activity Log Verification**
- All actions logged correctly
- Activity feed shows recent actions
- Filters work (by user, by type)
- Export activity log

**E2E-18: Keyboard Navigation**
- Tab through all controls
- Enter to submit forms
- Arrow keys for navigation
- Keyboard shortcuts (e.g., Cmd+N for new item)

**E2E-19: Network Interruption Recovery**
- Simulate intermittent connection
- Multiple disconnect/reconnect cycles
- Operations queued and synced
- No data loss

**E2E-20: Security: Session Management**
- Token expiration handling
- Automatic token refresh
- Logout from all devices
- Concurrent session management

**E2E-21: Performance: Large List Handling**
- List with 500+ items
- Scroll performance
- Search/filter speed
- Bulk operations on large dataset

**E2E-22: Cross-Browser Compatibility**
- Test on Chrome, Firefox, Safari
- Same features work on all
- UI renders correctly
- No browser-specific bugs

---

## Test Data Management

### Test Data Generation Scripts

#### Generate Test Users
```bash
#!/bin/bash
# generate-test-users.sh

API_URL="http://localhost:3001"

echo "Creating E2E test users..."

# User A - List Owner
USER_A=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Cooper",
    "email": "user-a@e2etest.com",
    "password": "TestPass123!"
  }' | jq -r '.data.user.id')

echo "✓ User A created: $USER_A"

# User B - Collaborator
USER_B=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "email": "user-b@e2etest.com",
    "password": "TestPass123!"
  }' | jq -r '.data.user.id')

echo "✓ User B created: $USER_B"

# User C - Viewer
USER_C=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carol Davis",
    "email": "user-c@e2etest.com",
    "password": "TestPass123!"
  }' | jq -r '.data.user.id')

echo "✓ User C created: $USER_C"

# User D - Additional collaborator
USER_D=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "David Johnson",
    "email": "user-d@e2etest.com",
    "password": "TestPass123!"
  }' | jq -r '.data.user.id')

echo "✓ User D created: $USER_D"

echo ""
echo "All test users created successfully!"
echo "User IDs saved to .test-users.env"

cat > .test-users.env <<EOF
USER_A_ID=$USER_A
USER_A_EMAIL=user-a@e2etest.com
USER_B_ID=$USER_B
USER_B_EMAIL=user-b@e2etest.com
USER_C_ID=$USER_C
USER_C_EMAIL=user-c@e2etest.com
USER_D_ID=$USER_D
USER_D_EMAIL=user-d@e2etest.com
EOF
```

#### Generate Test List with Items
```bash
#!/bin/bash
# generate-test-list.sh

source .test-users.env
API_URL="http://localhost:3001"

# Login as User A
TOKEN_A=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_A_EMAIL\",
    \"password\": \"TestPass123!\"
  }" | jq -r '.data.accessToken')

echo "✓ Logged in as User A"

# Create test list
LIST_ID=$(curl -s -X POST "$API_URL/api/lists" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{
    "name": "E2E Test Shopping List"
  }' | jq -r '.data.list.id')

echo "✓ Created list: $LIST_ID"

# Add test items
ITEMS=(
  '{"name":"Milk","quantity":2,"category":"Dairy"}'
  '{"name":"Bread","quantity":1,"category":"Bakery"}'
  '{"name":"Apples","quantity":6,"category":"Produce"}'
  '{"name":"Eggs","quantity":12,"category":"Dairy"}'
  '{"name":"Coffee","quantity":1,"category":"Beverages","notes":"Dark roast only"}'
  '{"name":"Bananas","quantity":4,"category":"Produce"}'
  '{"name":"Butter","quantity":1,"category":"Dairy"}'
  '{"name":"Orange Juice","quantity":1,"category":"Beverages"}'
  '{"name":"Chicken Breast","quantity":2,"category":"Meat"}'
  '{"name":"Pasta","quantity":1,"category":"Pantry"}'
)

echo "Adding items..."
for item in "${ITEMS[@]}"; do
  curl -s -X POST "$API_URL/api/items" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_A" \
    -d "{\"listId\":\"$LIST_ID\",$(echo $item | jq -r 'to_entries | map("\"\(.key)\":\(.value|tojson)") | join(",")' )}" > /dev/null
  echo "  ✓ Added item"
done

echo ""
echo "Test list created successfully!"
echo "List ID: $LIST_ID"

# Save to env file
echo "LIST_ID=$LIST_ID" >> .test-users.env
echo "TOKEN_A=$TOKEN_A" >> .test-users.env
```

### Cleanup Scripts

#### Clean Test Data
```bash
#!/bin/bash
# cleanup-test-data.sh

echo "Cleaning up E2E test data..."

psql -h localhost -U grocery -d grocery_db <<EOF
-- Delete test activities
DELETE FROM activities WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'E2E Test%'
);

-- Delete test items
DELETE FROM grocery_items WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'E2E Test%'
);

-- Delete test list members
DELETE FROM list_members WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE 'E2E Test%'
);

-- Delete test lists
DELETE FROM lists WHERE name LIKE 'E2E Test%';

-- Delete test users
DELETE FROM users WHERE email LIKE '%@e2etest.com';

-- Show summary
SELECT
  'Remaining test users' as type,
  COUNT(*) as count
FROM users WHERE email LIKE '%@e2etest.com'
UNION ALL
SELECT
  'Remaining test lists' as type,
  COUNT(*) as count
FROM lists WHERE name LIKE 'E2E Test%';
EOF

echo "✓ Test data cleaned up"
rm -f .test-users.env
echo "✓ Environment file removed"
```

### Test Data Fixtures

#### Standard Test List Template
```json
{
  "listName": "E2E Test Shopping",
  "items": [
    {
      "name": "Milk",
      "quantity": 2,
      "category": "Dairy",
      "notes": ""
    },
    {
      "name": "Bread",
      "quantity": 1,
      "category": "Bakery",
      "notes": ""
    },
    {
      "name": "Apples",
      "quantity": 6,
      "category": "Produce",
      "notes": "Gala or Fuji"
    },
    {
      "name": "Coffee",
      "quantity": 1,
      "category": "Beverages",
      "notes": "Dark roast only"
    },
    {
      "name": "Eggs",
      "quantity": 12,
      "category": "Dairy",
      "notes": "Free range"
    }
  ],
  "members": [
    {
      "email": "user-b@e2etest.com",
      "permission": "editor"
    }
  ]
}
```

---

## Expected Timings

### Operation Performance Benchmarks

#### User Operations
| Operation | Target Time | Acceptable Time | Poor |
|-----------|-------------|-----------------|------|
| Page Load (Initial) | < 2s | 2-4s | > 4s |
| Registration | < 500ms | 500ms-1s | > 1s |
| Login | < 400ms | 400-800ms | > 800ms |
| Logout | < 200ms | 200-400ms | > 400ms |

#### List Operations
| Operation | Target Time | Acceptable Time | Poor |
|-----------|-------------|-----------------|------|
| Create List | < 400ms | 400-800ms | > 800ms |
| Load List (10 items) | < 300ms | 300-600ms | > 600ms |
| Load List (100 items) | < 800ms | 800ms-1.5s | > 1.5s |
| Delete List | < 600ms | 600ms-1s | > 1s |
| Archive List | < 500ms | 500ms-1s | > 1s |
| Export CSV | < 1s | 1-2s | > 2s |
| Export JSON | < 1s | 1-2s | > 2s |

#### Item Operations
| Operation | Target Time | Acceptable Time | Poor |
|-----------|-------------|-----------------|------|
| Add Item | < 300ms | 300-600ms | > 600ms |
| Edit Item | < 300ms | 300-600ms | > 600ms |
| Delete Item | < 300ms | 300-600ms | > 600ms |
| Mark as Gotten | < 200ms | 200-400ms | > 400ms |
| Bulk Mark (10 items) | < 800ms | 800ms-1.5s | > 1.5s |
| Bulk Delete (10 items) | < 1s | 1-2s | > 2s |

#### Collaboration Operations
| Operation | Target Time | Acceptable Time | Poor |
|-----------|-------------|-----------------|------|
| Share List (Add Member) | < 600ms | 600ms-1s | > 1s |
| Remove Member | < 500ms | 500ms-1s | > 1s |
| Change Permission | < 500ms | 500ms-1s | > 1s |
| Transfer Ownership | < 800ms | 800ms-1.5s | > 1.5s |
| Generate Invite Link | < 400ms | 400-800ms | > 800ms |

#### Real-Time Sync
| Operation | Target Time | Acceptable Time | Poor |
|-----------|-------------|-----------------|------|
| Item Add (sync to other user) | < 500ms | 500ms-1.5s | > 1.5s |
| Item Edit (sync) | < 500ms | 500ms-1.5s | > 1.5s |
| Item Delete (sync) | < 500ms | 500ms-1.5s | > 1.5s |
| Permission Change (sync) | < 1s | 1-3s | > 3s |
| Member Add (sync) | < 1s | 1-3s | > 3s |
| WebSocket Reconnect | < 2s | 2-5s | > 5s |

#### Search and Filter
| Operation | Target Time | Acceptable Time | Poor |
|-----------|-------------|-----------------|------|
| Search (10 items) | < 100ms | 100-300ms | > 300ms |
| Search (100 items) | < 200ms | 200-500ms | > 500ms |
| Filter by Category | < 100ms | 100-200ms | > 200ms |
| Sort List | < 150ms | 150-300ms | > 300ms |

### Cumulative Timing Guidelines

#### Complete User Journey (E2E-01)
| Phase | Target Duration | Notes |
|-------|----------------|-------|
| Registration (both users) | 1-2 min | Includes form filling |
| List creation + 5 items | 1-2 min | User A setup |
| Sharing + B joins | 1-2 min | Includes sync time |
| Collaborative editing | 2-3 min | Multiple operations |
| Permission changes | 1-2 min | Includes UI updates |
| Ownership transfer | 1-2 min | Includes verification |
| Export + Archive | 1-2 min | Final operations |
| **Total** | **8-13 min** | Full journey |

#### Quick Smoke Test
A subset of E2E-01 for rapid validation:
- User A: Register → Create list → Add 2 items (2 min)
- User B: Register → Join list → Add 1 item (2 min)
- Verify sync working (1 min)
- **Total: ~5 minutes**

---

## Verification Checkpoints

### Checkpoint Types

#### 1. Visual Verification
Manual inspection of UI state at key points.

**Example Checkpoints**:
- ✓ Button text matches expected action
- ✓ Badge shows correct permission level
- ✓ Success message appears after operation
- ✓ Item count displayed correctly
- ✓ Icons render properly

#### 2. Console Verification
JavaScript assertions run in browser console.

**Template**:
```javascript
// Checkpoint: Verify item count after adding items
const itemCount = document.querySelectorAll('.grocery-item').length;
const expectedCount = 5;
console.assert(
  itemCount === expectedCount,
  `Expected ${expectedCount} items, found ${itemCount}`
);
```

#### 3. Database Verification
SQL queries to validate backend state.

**Template**:
```sql
-- Checkpoint: Verify list membership after sharing
SELECT
  u.name,
  u.email,
  lm.permission_level
FROM list_members lm
JOIN users u ON u.id = lm.user_id
WHERE lm.list_id = 'your-list-id'
ORDER BY lm.joined_at;

-- Expected: 2 rows (owner + new member)
```

#### 4. Network Verification
Monitor API calls and responses.

**How to Check**:
1. Open DevTools > Network tab
2. Filter by "Fetch/XHR"
3. Verify:
   - Correct endpoints called
   - Response status codes (200, 201, 403, etc.)
   - Response data structure
   - Request timing

#### 5. WebSocket Verification
Monitor real-time sync messages.

**How to Check**:
1. Open DevTools > Network tab
2. Filter by "WS" (WebSocket)
3. Click on WebSocket connection
4. Monitor Messages tab
5. Verify sync messages appear

### Checkpoint Documentation Template

For each major step in a test scenario:

```markdown
**Verification Checkpoint X.Y:**

**Type**: [Visual | Console | Database | Network | WebSocket]

**What to Check**:
- [ ] Item 1 is true
- [ ] Item 2 has correct value
- [ ] Item 3 is not present

**How to Verify**:
[Code snippet or SQL query]

**Expected Result**:
[Clear description of expected state]

**Failure Actions**:
[What to do if checkpoint fails]
```

### Critical Checkpoints for E2E-01

#### Checkpoint 1: After Registration (Phase 1.4)
```javascript
// Console verification
const userEmail = localStorage.getItem('userEmail');
const authToken = localStorage.getItem('authToken');
console.assert(
  userEmail === 'user-a@e2etest.com',
  'User email should be stored'
);
console.assert(
  authToken !== null && authToken.length > 0,
  'Auth token should be present'
);
```

#### Checkpoint 2: After List Creation (Phase 1.9)
```sql
-- Database verification
SELECT
  l.name,
  l.owner_user_id,
  lm.permission_level
FROM lists l
JOIN list_members lm ON l.id = lm.list_id
WHERE l.name = 'E2E Test Shopping'
  AND l.owner_user_id = (SELECT id FROM users WHERE email = 'user-a@e2etest.com');

-- Expected: 1 row showing list with owner permission
```

#### Checkpoint 3: After Adding Items (Phase 2.6)
```javascript
// Console verification
const items = document.querySelectorAll('.grocery-item');
const itemNames = Array.from(items).map(item =>
  item.querySelector('.item-name')?.textContent.trim()
);

const expectedItems = ['Milk', 'Bread', 'Apples', 'Coffee', 'Eggs'];
const allPresent = expectedItems.every(name => itemNames.includes(name));

console.assert(allPresent, 'All 5 items should be present');
console.log('Item names:', itemNames);
```

#### Checkpoint 4: After Sharing (Phase 4.6)
```javascript
// Console verification in Browser A
const membersCount = document.querySelectorAll('.member-item').length;
console.assert(membersCount === 2, `Expected 2 members, found ${membersCount}`);
```

```javascript
// Console verification in Browser B (after sync)
const listDropdown = document.querySelector('.list-selector');
const hasSharedList = listDropdown?.textContent.includes('E2E Test Shopping');
console.assert(hasSharedList, 'Shared list should appear in dropdown');
```

#### Checkpoint 5: After Permission Change (Phase 9.7)
```javascript
// Console verification in Browser B
const formDisabled = document.querySelector('.add-item-form fieldset[disabled]');
const checkboxesDisabled = Array.from(
  document.querySelectorAll('.grocery-item input[type="checkbox"]')
).every(cb => cb.disabled);

console.assert(formDisabled !== null, 'Form should be disabled for viewer');
console.assert(checkboxesDisabled, 'All checkboxes should be disabled');
```

#### Checkpoint 6: After Ownership Transfer (Phase 10.8)
```sql
-- Database verification
SELECT
  l.name,
  l.owner_user_id,
  owner.email as owner_email,
  lm.permission_level,
  u.email as member_email
FROM lists l
JOIN users owner ON l.owner_user_id = owner.id
JOIN list_members lm ON l.id = lm.list_id
JOIN users u ON lm.user_id = u.id
WHERE l.name = 'E2E Test Shopping'
ORDER BY lm.permission_level DESC;

-- Expected: Bob is owner, Alice is editor
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Real-Time Sync Not Working

**Symptoms**:
- Changes in Browser A don't appear in Browser B
- Long delay (>10 seconds) or never syncs

**Diagnostic Steps**:
```javascript
// 1. Check WebSocket connection status
const wsConnections = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('4848'));
console.log('WebSocket connections:', wsConnections);

// 2. Check Zero sync status
const zero = (window as any).__ZERO__;
if (zero) {
  console.log('Zero instance:', zero);
  console.log('Zero status:', zero.status);
}

// 3. Check for errors
console.log('Errors in console:', /* look for red errors */);
```

**Solutions**:
1. **Restart Zero sync server**:
   ```bash
   # Kill zero-cache
   pkill -f zero-cache
   # Restart
   pnpm zero:dev
   ```

2. **Clear browser cache**:
   ```javascript
   // Clear IndexedDB
   indexedDB.deleteDatabase('zero-cache');
   // Refresh page
   location.reload();
   ```

3. **Check network connectivity**:
   ```bash
   curl http://localhost:4848/health
   ```

---

#### Issue 2: Permission Changes Not Taking Effect

**Symptoms**:
- User B's permission changed but UI still shows old permissions
- Can still perform restricted actions

**Diagnostic Steps**:
```sql
-- Check actual permission in database
SELECT
  u.email,
  lm.permission_level,
  lm.updated_at
FROM list_members lm
JOIN users u ON u.id = lm.user_id
WHERE lm.list_id = 'your-list-id'
  AND u.email = 'user-b@e2etest.com';
```

**Solutions**:
1. **Hard refresh in Browser B**: Ctrl+Shift+R or Cmd+Shift+R
2. **Logout and login again** in Browser B
3. **Check for caching issues**:
   ```javascript
   // Clear auth state
   localStorage.clear();
   sessionStorage.clear();
   ```

---

#### Issue 3: Items Appear Duplicated

**Symptoms**:
- Same item appears multiple times
- Item count incorrect

**Diagnostic Steps**:
```sql
-- Check for duplicate items
SELECT
  name,
  COUNT(*) as count
FROM grocery_items
WHERE list_id = 'your-list-id'
GROUP BY name
HAVING COUNT(*) > 1;
```

**Solutions**:
1. **Remove duplicates manually**:
   ```sql
   DELETE FROM grocery_items
   WHERE id NOT IN (
     SELECT MIN(id)
     FROM grocery_items
     GROUP BY list_id, name, quantity, category
   )
   AND list_id = 'your-list-id';
   ```

2. **Clear local cache and re-sync**:
   ```javascript
   indexedDB.deleteDatabase('zero-cache');
   location.reload();
   ```

---

#### Issue 4: Unable to Login After Registration

**Symptoms**:
- Registration succeeds but can't login
- "Invalid credentials" error

**Diagnostic Steps**:
```sql
-- Check if user was created
SELECT
  id,
  email,
  name,
  created_at
FROM users
WHERE email = 'user-a@e2etest.com';
```

```bash
# Check API server logs
# Look for authentication errors
```

**Solutions**:
1. **Verify password meets requirements**:
   - Minimum 8 characters
   - Contains uppercase, lowercase, number

2. **Check for email typos**: Ensure exact match

3. **Reset password** using forgot password flow

4. **Check database connection**:
   ```bash
   psql -h localhost -U grocery -d grocery_db -c "SELECT 1;"
   ```

---

#### Issue 5: Export Functionality Not Working

**Symptoms**:
- Export button does nothing
- Download doesn't start
- Empty file downloaded

**Diagnostic Steps**:
```javascript
// Check for errors when clicking export
console.log('Attempting export...');
// Click export button
// Check console for errors
```

**Solutions**:
1. **Check browser download settings**: Ensure downloads not blocked

2. **Verify items exist**:
   ```sql
   SELECT COUNT(*) FROM grocery_items WHERE list_id = 'your-list-id';
   ```

3. **Try different export format** (CSV vs JSON)

4. **Check API endpoint**:
   ```bash
   curl -X GET "http://localhost:3001/api/lists/your-list-id/export/csv" \
     -H "Authorization: Bearer $TOKEN"
   ```

---

#### Issue 6: Slow Performance with Many Items

**Symptoms**:
- App becomes sluggish with 100+ items
- Long load times
- UI freezes

**Diagnostic Steps**:
```javascript
// Check item count
const itemCount = document.querySelectorAll('.grocery-item').length;
console.log('Total items:', itemCount);

// Check memory usage
if (performance.memory) {
  console.log('Memory usage:', {
    used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB'
  });
}
```

**Solutions**:
1. **Implement pagination** or virtual scrolling

2. **Archive old items**:
   ```sql
   -- Archive gotten items older than 30 days
   UPDATE grocery_items
   SET archived = true
   WHERE gotten = true
     AND updated_at < NOW() - INTERVAL '30 days';
   ```

3. **Optimize database queries** (add indexes)

4. **Clear old data**:
   ```sql
   -- Delete old gotten items
   DELETE FROM grocery_items
   WHERE gotten = true
     AND updated_at < NOW() - INTERVAL '90 days';
   ```

---

### Test Failure Debugging Checklist

When a test fails, work through this checklist:

- [ ] **Verify all services are running**
  ```bash
  curl http://localhost:3001/health
  curl http://localhost:4848/health
  curl http://localhost:5173
  ```

- [ ] **Check database connectivity**
  ```bash
  psql -h localhost -U grocery -d grocery_db -c "SELECT 1;"
  ```

- [ ] **Review console errors** in both browsers

- [ ] **Check network tab** for failed requests

- [ ] **Verify test data exists** (run database queries)

- [ ] **Check timing** - did operations timeout?

- [ ] **Verify user permissions** in database

- [ ] **Clear caches and retry**:
  ```javascript
  localStorage.clear();
  sessionStorage.clear();
  indexedDB.deleteDatabase('zero-cache');
  location.reload();
  ```

- [ ] **Restart all services** as last resort

- [ ] **Check for race conditions** - add wait times

- [ ] **Review recent code changes** that may have broken functionality

---

### Performance Debugging

#### Measure Operation Timing
```javascript
// Measure time for an operation
const startTime = performance.now();

// Perform operation (e.g., add item)
// ...

const endTime = performance.now();
const duration = endTime - startTime;
console.log(`Operation took ${duration.toFixed(2)}ms`);

// Check if within acceptable range
if (duration > 1000) {
  console.warn('Operation took longer than expected!');
}
```

#### Monitor Real-Time Sync Latency
```javascript
// In Browser A - before making change
window.testStartTime = Date.now();
console.log('Making change at:', window.testStartTime);

// Make change (add item, check item, etc.)

// In Browser B - when change appears
if (window.testStartTime) {
  const latency = Date.now() - window.testStartTime;
  console.log(`Sync latency: ${latency}ms`);

  if (latency > 2000) {
    console.warn('Sync latency higher than expected!');
  }
}
```

---

## Test Execution Workflow

### Pre-Test Checklist

Before running any E2E test:

1. **Environment Setup**
   - [ ] PostgreSQL running
   - [ ] Database migrated to latest version
   - [ ] Zero sync server running on port 4848
   - [ ] Backend API server running on port 3001
   - [ ] Frontend dev server running on port 5173

2. **Test Data**
   - [ ] Database cleaned of old test data
   - [ ] Test users created (if needed)
   - [ ] Browser caches cleared
   - [ ] Multiple browser profiles ready

3. **Tools**
   - [ ] Browser DevTools open in each window
   - [ ] Console tab visible
   - [ ] Network tab monitoring
   - [ ] Test script/checklist printed or visible

### During Test Execution

1. **Follow the script** - Don't skip steps
2. **Document deviations** - Note any unexpected behavior
3. **Capture screenshots** - Especially for failures
4. **Record timing** - Note if operations are slow
5. **Check all verification points** - Don't assume success
6. **Monitor both browsers** simultaneously during sync tests

### Post-Test Checklist

After each test scenario:

1. **Document Results**
   - [ ] Mark test as Pass/Fail
   - [ ] Record any issues encountered
   - [ ] Note actual timings vs expected
   - [ ] Save screenshots of failures

2. **Clean Up**
   - [ ] Delete test data (unless debugging)
   - [ ] Logout all test users
   - [ ] Clear browser caches
   - [ ] Reset database to clean state

3. **Report**
   - [ ] Update test results spreadsheet
   - [ ] File bug reports for failures
   - [ ] Share findings with team
   - [ ] Update documentation if needed

---

## Summary

This comprehensive E2E test plan provides:

- **1 Primary User Journey** (E2E-01): The essential workflow every release must pass
- **21 Additional Scenarios**: Cover edge cases, performance, security, and cross-browser compatibility
- **Detailed Step-by-Step Instructions**: Every action, expected result, timing, and checkpoint
- **Verification Strategies**: Console checks, database queries, visual inspection
- **Expected Timings**: Performance benchmarks for every operation
- **Troubleshooting Guide**: Solutions to common issues
- **Test Data Management**: Scripts to generate and clean test data

### Test Priority Matrix

| Priority | Description | Scenarios | Before Release |
|----------|-------------|-----------|----------------|
| P0 | Critical - Must pass | 6 scenarios | Required |
| P1 | High - Should pass | 10 scenarios | Recommended |
| P2 | Medium - Nice to have | 6 scenarios | Optional |

### Recommended Test Schedule

**Before Every Release**:
- Run P0 scenarios (E2E-01, E2E-02, E2E-05, E2E-14, E2E-20)
- Total time: ~50-60 minutes

**Weekly Regression Testing**:
- Run all P0 + P1 scenarios
- Total time: 2-3 hours

**Full Test Suite**:
- Run all 22 scenarios
- Total time: 4-5 hours
- Schedule: Before major releases

---

**Document Version**: 1.0
**Last Updated**: 2025-10-26
**Maintained By**: QA Team
**Related Documents**:
- [LIST_SHARING_TESTS.md](/home/adam/grocery/docs/LIST_SHARING_TESTS.md)
- [REALTIME_TESTS.md](/home/adam/grocery/docs/REALTIME_TESTS.md)
- [PERMISSION_TESTS.md](/home/adam/grocery/docs/PERMISSION_TESTS.md)
