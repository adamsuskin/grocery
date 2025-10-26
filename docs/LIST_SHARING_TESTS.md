# List Sharing Test Scenarios

Comprehensive test scenarios for the grocery list sharing and collaboration feature.

## Table of Contents
- [Test Environment Setup](#test-environment-setup)
- [API Endpoints Tested](#api-endpoints-tested)
- [UI Components Tested](#ui-components-tested)
- [Test Scenarios](#test-scenarios)
  - [Basic List Operations](#basic-list-operations)
  - [List Sharing Operations](#list-sharing-operations)
  - [Permission Enforcement](#permission-enforcement)
  - [Real-time Synchronization](#real-time-synchronization)
  - [Edge Cases and Error Handling](#edge-cases-and-error-handling)
  - [Security and Authorization](#security-and-authorization)

---

## Test Environment Setup

### Prerequisites
- PostgreSQL database running with all migrations applied
- Zero sync server running on port 4848
- Backend API server running on port 3001
- Frontend dev server running on port 5173
- At least 3 test user accounts created

### Test Data Setup

```sql
-- Create test users
INSERT INTO users (id, username, email, password_hash, created_at) VALUES
  ('user-1-id', 'alice', 'alice@example.com', '$2a$10$...', CURRENT_TIMESTAMP),
  ('user-2-id', 'bob', 'bob@example.com', '$2a$10$...', CURRENT_TIMESTAMP),
  ('user-3-id', 'carol', 'carol@example.com', '$2a$10$...', CURRENT_TIMESTAMP),
  ('user-4-id', 'david', 'david@example.com', '$2a$10$...', CURRENT_TIMESTAMP);

-- Clear any existing test lists
DELETE FROM lists WHERE name LIKE 'Test List%';
DELETE FROM list_members WHERE list_id IN (SELECT id FROM lists WHERE name LIKE 'Test List%');
```

### Test User Credentials
- **User 1 (Alice)**: alice@example.com / password123
- **User 2 (Bob)**: bob@example.com / password123
- **User 3 (Carol)**: carol@example.com / password123
- **User 4 (David)**: david@example.com / password123

### Browser Setup
- Use multiple browser profiles or incognito windows for multi-user testing
- Enable browser console for debugging
- Clear IndexedDB between test runs for clean state

---

## API Endpoints Tested

### List Management
- `POST /api/lists` - Create a new list
- `GET /api/lists` - Get all accessible lists
- `GET /api/lists/:id` - Get specific list with members
- `PUT /api/lists/:id` - Update list name
- `DELETE /api/lists/:id` - Delete list

### Member Management
- `POST /api/lists/:id/members` - Add member to list
- `GET /api/lists/:id/members` - Get list members
- `DELETE /api/lists/:id/members/:userId` - Remove member from list
- `PUT /api/lists/:id/members/:userId` - Update member permission
- `POST /api/lists/:id/leave` - Leave a shared list

### Item Operations (with permission checks)
- `POST /api/items` - Add item to list
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

---

## UI Components Tested

### ShareListModal Component
**File**: `/home/adam/grocery/src/components/ShareListModal.tsx`

**Features Tested**:
- Email validation and error handling
- Permission level selection (editor/viewer)
- Current members display
- Add member functionality
- Remove member functionality
- Update member permission
- Success/error message display
- Loading states

### ListManagement Component
**Features Tested**:
- List details display
- Share list button and modal integration
- Member count display
- Delete list functionality

### ListContext Hook
**File**: `/home/adam/grocery/src/contexts/ListContext.tsx`

**Features Tested**:
- Active list management
- Permission checking (canEdit, canManage)
- List member tracking
- Owner detection

### useListPermissions Hook
**File**: `/home/adam/grocery/src/hooks/useListPermissions.ts`

**Features Tested**:
- Permission level detection
- Can view/edit flags
- Owner status check

---

## Test Scenarios

### Basic List Operations

#### Scenario 1: Create a New List
**Objective**: Verify list creation functionality

**Steps**:
1. Log in as User 1 (Alice)
2. Click "Create New List" button
3. Enter list name: "Test List 1"
4. Submit the form

**Expected Results**:
- List is created successfully
- User 1 is set as the owner
- User 1 is added as a member with 'owner' permission
- List appears in user's list dropdown
- Success message is displayed

**API Calls**:
- `POST /api/lists` with body `{ name: "Test List 1" }`

**Database Verification**:
```sql
SELECT * FROM lists WHERE name = 'Test List 1';
SELECT * FROM list_members WHERE list_id = (SELECT id FROM lists WHERE name = 'Test List 1');
```

---

#### Scenario 2: View List Details
**Objective**: Verify list details display

**Steps**:
1. Log in as User 1 (Alice)
2. Select "Test List 1" from dropdown
3. Click "Manage List" button

**Expected Results**:
- List name is displayed correctly
- Owner information is shown
- Member count is displayed
- User sees "Share List" button (owner)

**API Calls**:
- `GET /api/lists/:id`

---

#### Scenario 3: Update List Name
**Objective**: Verify list name update functionality

**Steps**:
1. Log in as User 1 (Alice - owner)
2. Open list management for "Test List 1"
3. Click "Edit Name" button
4. Change name to "Weekly Groceries"
5. Save changes

**Expected Results**:
- List name is updated successfully
- Updated name appears in dropdown
- Success message is displayed
- updated_at timestamp is changed

**API Calls**:
- `PUT /api/lists/:id` with body `{ name: "Weekly Groceries" }`

---

#### Scenario 4: Delete List (Owner)
**Objective**: Verify list deletion by owner

**Steps**:
1. Log in as User 1 (Alice - owner)
2. Create a new list "Test Delete List"
3. Open list management
4. Click "Delete List" button
5. Confirm deletion

**Expected Results**:
- List is deleted successfully
- List removed from user's dropdown
- All associated members are removed
- All associated items are deleted (cascade)
- User is redirected to default list

**API Calls**:
- `DELETE /api/lists/:id`

**Database Verification**:
```sql
-- Should return no rows
SELECT * FROM lists WHERE name = 'Test Delete List';
SELECT * FROM list_members WHERE list_id = 'deleted-list-id';
SELECT * FROM grocery_items WHERE list_id = 'deleted-list-id';
```

---

### List Sharing Operations

#### Scenario 5: Share List with Editor Permission
**Objective**: Verify sharing list with editor permission

**Steps**:
1. Log in as User 1 (Alice - owner)
2. Select "Weekly Groceries" list
3. Click "Share List" button
4. Enter User 2's email: bob@example.com
5. Select permission: "Editor"
6. Click "Add Member"

**Expected Results**:
- Member is added successfully
- Success message: "Successfully invited bob@example.com as editor"
- Bob appears in members list
- Bob's permission shows as "Editor"
- Email input is cleared
- Member count increases

**API Calls**:
- `POST /api/lists/:id/members` with body:
  ```json
  {
    "email": "bob@example.com",
    "permissionLevel": "editor"
  }
  ```

**Database Verification**:
```sql
SELECT * FROM list_members WHERE list_id = 'list-id' AND user_email = 'bob@example.com';
-- Should show permission = 'editor'
```

---

#### Scenario 6: Share List with Viewer Permission
**Objective**: Verify sharing list with viewer permission

**Steps**:
1. Log in as User 1 (Alice - owner)
2. Open "Weekly Groceries" list sharing modal
3. Enter User 3's email: carol@example.com
4. Select permission: "Viewer"
5. Click "Add Member"

**Expected Results**:
- Member is added successfully
- Carol appears in members list with "Viewer" badge
- Member count increases
- Success message is displayed

**API Calls**:
- `POST /api/lists/:id/members` with body:
  ```json
  {
    "email": "carol@example.com",
    "permissionLevel": "viewer"
  }
  ```

---

#### Scenario 7: View Shared List (Editor)
**Objective**: Verify editor can see shared list

**Steps**:
1. Log out User 1
2. Log in as User 2 (Bob - editor)
3. Check list dropdown

**Expected Results**:
- "Weekly Groceries" appears in Bob's list dropdown
- List shows "(shared)" indicator or owner name
- Bob can select and view the list
- Bob sees all items in the list

**API Calls**:
- `GET /api/lists` - should include shared lists
- `GET /api/lists/shared` - specific endpoint for shared lists

**Real-time Sync**:
- Zero sync should automatically sync the list to Bob's client
- IndexedDB should contain the list data

---

#### Scenario 8: View Shared List (Viewer)
**Objective**: Verify viewer can see shared list

**Steps**:
1. Log in as User 3 (Carol - viewer)
2. Check list dropdown
3. Select "Weekly Groceries"

**Expected Results**:
- List appears in Carol's dropdown
- Carol can view all items
- Carol sees read-only interface (no add/edit/delete buttons)
- Permission badge shows "Viewer"

---

#### Scenario 9: Update Member Permission (Editor to Viewer)
**Objective**: Verify permission level can be changed

**Steps**:
1. Log in as User 1 (Alice - owner)
2. Open "Weekly Groceries" sharing modal
3. Find Bob in members list
4. Change permission dropdown from "Editor" to "Viewer"

**Expected Results**:
- Permission is updated successfully
- UI updates to show "Viewer" immediately
- Success message is displayed
- Bob's capabilities are restricted (verified in next scenario)

**API Calls**:
- `PUT /api/lists/:id/members/:userId` with body:
  ```json
  {
    "permissionLevel": "viewer"
  }
  ```

---

#### Scenario 10: Verify Permission Change Takes Effect
**Objective**: Confirm permission changes are enforced in real-time

**Steps**:
1. Logged in as User 2 (Bob - now viewer)
2. View "Weekly Groceries" list
3. Try to add an item

**Expected Results**:
- Bob's UI shows read-only mode
- Add item button is disabled or hidden
- Edit/delete buttons on items are hidden
- If Bob tries API call directly, receives 403 Forbidden

**Real-time Sync**:
- Permission change should sync to Bob's client via Zero
- UI should update automatically without page refresh

---

#### Scenario 11: Remove Member from List
**Objective**: Verify member removal functionality

**Steps**:
1. Log in as User 1 (Alice - owner)
2. Open "Weekly Groceries" sharing modal
3. Find Carol in members list
4. Click "Remove" (X) button
5. Confirm removal

**Expected Results**:
- Member is removed successfully
- Carol disappears from members list
- Member count decreases
- Success message is displayed

**API Calls**:
- `DELETE /api/lists/:id/members/:userId`

---

#### Scenario 12: Verify Removed Member Loses Access
**Objective**: Confirm removed member cannot access list

**Steps**:
1. Logged in as User 3 (Carol - removed)
2. Check list dropdown

**Expected Results**:
- "Weekly Groceries" no longer appears in Carol's dropdown
- If Carol tries to access by URL, receives 403 Forbidden
- Carol's items in that list remain (or are deleted based on requirements)

**Real-time Sync**:
- List should disappear from Carol's UI automatically via Zero sync

---

### Permission Enforcement

#### Scenario 13: Editor Can Add Items
**Objective**: Verify editor permission allows adding items

**Steps**:
1. Log in as User 2 (Bob - editor)
2. Select "Weekly Groceries" list
3. Add a new item: "Milk, Quantity: 2, Category: Dairy"
4. Submit

**Expected Results**:
- Item is added successfully
- Item appears in list immediately
- Item syncs to all members in real-time
- Bob's user ID is associated with the item

**API Calls**:
- `POST /api/items` or Zero mutation
- Item has `user_id` = Bob's ID, `list_id` = list ID

---

#### Scenario 14: Editor Can Edit Items
**Objective**: Verify editor can modify items (including others' items)

**Steps**:
1. Logged in as User 2 (Bob - editor)
2. View item added by Alice
3. Click edit button
4. Change quantity from 1 to 3
5. Save

**Expected Results**:
- Item is updated successfully
- Change syncs to all members
- Alice sees the update in real-time

**Zero Mutation**:
```typescript
zero.mutate.grocery_items.update({
  id: 'item-id',
  quantity: 3
});
```

---

#### Scenario 15: Editor Can Delete Items
**Objective**: Verify editor can delete items

**Steps**:
1. Logged in as User 2 (Bob - editor)
2. Select an item
3. Click delete button
4. Confirm deletion

**Expected Results**:
- Item is deleted successfully
- Item disappears from all members' views
- Deletion syncs in real-time

---

#### Scenario 16: Viewer Cannot Add Items
**Objective**: Verify viewer permission prevents adding items

**Steps**:
1. Log in as User 3 (Carol - viewer)
2. Select shared list
3. Look for "Add Item" button

**Expected Results**:
- Add Item button is disabled or hidden
- If Carol tries API call directly: `POST /api/items`
- API returns 403 Forbidden error
- Error message: "You need edit permission to perform this action"

**UI Verification**:
- `useCanEditList()` hook returns `false`
- `canEdit` flag from `useListPermissions` is `false`

---

#### Scenario 17: Viewer Cannot Edit Items
**Objective**: Verify viewer cannot modify items

**Steps**:
1. Logged in as User 3 (Carol - viewer)
2. View item in shared list
3. Look for edit controls

**Expected Results**:
- Edit button is hidden
- Item appears read-only
- If Carol tries API call: `PUT /api/items/:id`
- API returns 403 Forbidden

---

#### Scenario 18: Viewer Cannot Delete Items
**Objective**: Verify viewer cannot delete items

**Steps**:
1. Logged in as User 3 (Carol - viewer)
2. View item in shared list
3. Look for delete controls

**Expected Results**:
- Delete button is hidden
- If Carol tries API call: `DELETE /api/items/:id`
- API returns 403 Forbidden

---

#### Scenario 19: Non-Owner Cannot Delete List
**Objective**: Verify only owner can delete list

**Steps**:
1. Share list with User 2 (Bob - editor)
2. Log in as User 2
3. Open list management
4. Look for delete list option

**Expected Results**:
- Delete button is hidden or disabled
- If Bob tries API call: `DELETE /api/lists/:id`
- API returns 403 Forbidden
- Error message: "Only the list owner can delete the list"

---

#### Scenario 20: Non-Owner Cannot Add Members
**Objective**: Verify only owner can add members

**Steps**:
1. Log in as User 2 (Bob - editor)
2. Try to access share list functionality

**Expected Results**:
- Share list button is hidden or disabled
- If Bob tries API call: `POST /api/lists/:id/members`
- API returns 403 Forbidden
- Error message: "Only the list owner can add members"

---

#### Scenario 21: Non-Owner Cannot Remove Members
**Objective**: Verify only owner can remove members

**Steps**:
1. Logged in as User 2 (Bob - editor)
2. If Bob can see member list
3. Try to remove a member

**Expected Results**:
- Remove button is hidden
- If Bob tries API call: `DELETE /api/lists/:id/members/:userId`
- API returns 403 Forbidden

---

### Real-time Synchronization

#### Scenario 22: Item Addition Syncs to All Members
**Objective**: Verify real-time sync of new items

**Steps**:
1. Open "Weekly Groceries" in two browsers:
   - Browser A: User 1 (Alice - owner)
   - Browser B: User 2 (Bob - editor)
2. In Browser A, add item "Bread"
3. Observe Browser B

**Expected Results**:
- Browser B receives the update within 1-2 seconds
- "Bread" appears in Bob's list automatically
- No page refresh required
- Item appears with correct details (name, quantity, category)

**Zero Sync Verification**:
- Check browser console for Zero sync messages
- Verify IndexedDB is updated in both browsers

---

#### Scenario 23: Item Update Syncs to All Members
**Objective**: Verify real-time sync of item modifications

**Steps**:
1. Both Alice and Bob viewing same list
2. Alice marks "Bread" as gotten
3. Observe Bob's browser

**Expected Results**:
- Item updates in Bob's view within 1-2 seconds
- Checkbox state changes
- Item moves to "gotten" section if filtered

---

#### Scenario 24: Item Deletion Syncs to All Members
**Objective**: Verify real-time sync of item deletion

**Steps**:
1. Both Alice and Bob viewing same list
2. Bob deletes "Milk"
3. Observe Alice's browser

**Expected Results**:
- Item disappears from Alice's view within 1-2 seconds
- No error or stale state in UI

---

#### Scenario 25: Member Addition Syncs to Owner
**Objective**: Verify member list updates in real-time

**Steps**:
1. Alice has sharing modal open
2. In another browser, make an API call to add David
3. Observe Alice's sharing modal

**Expected Results**:
- David appears in the members list automatically
- Member count updates
- No refresh needed

---

#### Scenario 26: Permission Change Syncs to Affected User
**Objective**: Verify permission changes take effect immediately

**Steps**:
1. Browser A (Alice): Open sharing modal
2. Browser B (Bob): Viewing list with edit capabilities
3. Alice changes Bob's permission from "Editor" to "Viewer"
4. Observe Browser B

**Expected Results**:
- Bob's UI changes to read-only mode within 1-2 seconds
- Add/Edit/Delete buttons disappear or disable
- Permission badge updates to "Viewer"

---

#### Scenario 27: Member Removal Syncs to Removed User
**Objective**: Verify removed members lose access immediately

**Steps**:
1. Browser A (Alice): Open sharing modal
2. Browser B (Bob): Viewing list
3. Alice removes Bob from list
4. Observe Browser B

**Expected Results**:
- List disappears from Bob's dropdown within 1-2 seconds
- If Bob is viewing the list, show "Access Denied" message
- Bob is redirected to default list

---

### Edge Cases and Error Handling

#### Scenario 28: Share with Non-Existent User
**Objective**: Verify error handling for invalid email

**Steps**:
1. Log in as User 1 (Alice)
2. Open sharing modal
3. Enter email: "nonexistent@example.com"
4. Click "Add Member"

**Expected Results**:
- API returns 404 Not Found error
- Error message displayed: "User not found"
- Email input remains filled for correction
- No member is added to the list

**API Response**:
```json
{
  "success": false,
  "error": "User not found",
  "message": "No user found with email: nonexistent@example.com"
}
```

---

#### Scenario 29: Share with Already-Added User
**Objective**: Verify duplicate member prevention

**Steps**:
1. Log in as User 1 (Alice)
2. Share list with Bob
3. Try to share with Bob again

**Expected Results**:
- Client-side validation shows error
- Error message: "This user is already a member of this list"
- API call is not made (prevented by UI)
- If API call is made, returns 400 Bad Request

---

#### Scenario 30: Invalid Email Format
**Objective**: Verify email validation

**Steps**:
1. Log in as User 1 (Alice)
2. Open sharing modal
3. Enter invalid emails:
   - "notanemail"
   - "test@"
   - "@example.com"
4. Try to submit

**Expected Results**:
- Client-side validation prevents submission
- Error message: "Please enter a valid email address"
- Add Member button remains disabled
- No API call is made

**UI Validation**:
```typescript
// In ShareListModal.tsx
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

---

#### Scenario 31: Try to Remove List Owner
**Objective**: Verify owner cannot be removed

**Steps**:
1. Log in as User 1 (Alice - owner)
2. Open sharing modal
3. Try to remove self from members list

**Expected Results**:
- Remove button is hidden for owner
- Owner has "Owner" badge instead of remove button
- If API call attempted: `DELETE /api/lists/:id/members/:ownerId`
- API returns 400 Bad Request
- Error message: "Cannot remove the list owner"

---

#### Scenario 32: Concurrent Item Addition
**Objective**: Test conflict resolution with simultaneous edits

**Steps**:
1. Browser A (Alice) and Browser B (Bob) viewing same list
2. Both add an item at the exact same time
3. Observe both browsers

**Expected Results**:
- Both items are created successfully
- Each item has unique ID
- Both items appear in both browsers
- No item is lost or overwritten
- Zero handles eventual consistency

---

#### Scenario 33: Network Disconnection and Reconnection
**Objective**: Verify offline resilience and sync on reconnect

**Steps**:
1. Log in as User 1 (Alice)
2. Add item "Eggs"
3. Disconnect network
4. Add item "Cheese"
5. Try to mark "Eggs" as gotten
6. Reconnect network
7. Wait for sync

**Expected Results**:
- Offline changes are queued locally
- UI shows "offline" indicator
- On reconnect, all changes sync to server
- Other members receive all updates
- No data loss occurs

**Zero Behavior**:
- Changes stored in IndexedDB
- Sync resumes automatically on reconnect

---

#### Scenario 34: Empty List Name
**Objective**: Verify list name validation

**Steps**:
1. Try to create list with empty name
2. Try to update list to empty name

**Expected Results**:
- Client-side validation prevents submission
- Error message: "List name is required"
- API validation also checks: returns 400 if bypassed

---

#### Scenario 35: Very Long List Name
**Objective**: Verify list name length limits

**Steps**:
1. Try to create list with name longer than 255 characters

**Expected Results**:
- Client-side validation enforces max length
- API validates: returns 400 Bad Request
- Error message: "List name must be between 1 and 255 characters"

---

### Security and Authorization

#### Scenario 36: Access List Without Permission
**Objective**: Verify authorization checks

**Steps**:
1. User 1 creates a list
2. User 4 (David - not a member) tries to access:
   - Direct URL: `/lists/:listId`
   - API call: `GET /api/lists/:listId`

**Expected Results**:
- API returns 403 Forbidden
- Error message: "You do not have access to this list"
- UI shows "Access Denied" or redirects to default list

---

#### Scenario 37: Token Expiration During Session
**Objective**: Verify token refresh handling

**Steps**:
1. Log in as User 1
2. Wait for token to expire (or manipulate time)
3. Try to perform an action (add item, share list)

**Expected Results**:
- Token refresh happens automatically
- Operation completes successfully
- User is not logged out
- No error is shown to user

**Token Refresh Flow**:
- API returns 401 Unauthorized
- Client intercepts and calls `/api/auth/refresh`
- New token is obtained and stored
- Original request is retried with new token

---

#### Scenario 38: Malicious Permission Escalation Attempt
**Objective**: Verify permission checks cannot be bypassed

**Steps**:
1. User 2 (Bob - editor) tries to:
   - Add a member via API call
   - Change his own permission to "owner"
   - Delete the list

**Expected Results**:
- All API calls return 403 Forbidden
- Appropriate error messages are shown
- No unauthorized changes occur
- Security audit log may record attempts

---

#### Scenario 39: XSS Prevention in List/Item Names
**Objective**: Verify input sanitization

**Steps**:
1. Create list with name: `<script>alert('XSS')</script>`
2. Add item with name: `<img src=x onerror=alert('XSS')>`

**Expected Results**:
- Scripts do not execute
- Names are displayed as plain text
- HTML is escaped in UI
- Data is sanitized on backend

---

#### Scenario 40: SQL Injection Prevention
**Objective**: Verify SQL injection protection

**Steps**:
1. Try to create list with name: `'; DROP TABLE lists; --`
2. Try to share with email: `' OR '1'='1`

**Expected Results**:
- Queries use parameterized statements
- No SQL injection occurs
- Database remains intact
- Invalid input may be rejected or escaped

---

## Testing Checklist

### Pre-Test Setup
- [ ] Database migrations applied
- [ ] Zero sync server running
- [ ] Backend API server running
- [ ] Frontend dev server running
- [ ] Test users created
- [ ] Browser profiles/incognito windows prepared
- [ ] Clear IndexedDB and localStorage

### Functional Testing
- [ ] All 40 scenarios executed
- [ ] Expected results verified
- [ ] API responses logged
- [ ] Database state verified

### Real-time Sync Testing
- [ ] Multiple browser testing completed
- [ ] Sync latency measured (<2 seconds)
- [ ] Offline behavior tested
- [ ] Reconnection tested

### Permission Testing
- [ ] Owner permissions verified
- [ ] Editor permissions verified
- [ ] Viewer permissions verified
- [ ] Permission enforcement at API level
- [ ] Permission enforcement at UI level

### Security Testing
- [ ] Authorization checks verified
- [ ] XSS prevention verified
- [ ] SQL injection prevention verified
- [ ] Token handling verified
- [ ] Audit logging checked

### Performance Testing
- [ ] List with 10+ members tested
- [ ] List with 100+ items tested
- [ ] Concurrent user testing (5+ simultaneous users)
- [ ] Network latency simulation

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Known Issues and Limitations

### Current Limitations
1. No invite notification system (users must be pre-registered)
2. No activity audit log in UI
3. No "pending invitation" state
4. Cannot transfer list ownership
5. No bulk member management

### Future Enhancements
1. Email invitations for non-registered users
2. Activity feed showing who added/modified items
3. List templates and cloning
4. Member roles beyond owner/editor/viewer
5. List archiving instead of deletion

---

## Test Results Template

```markdown
## Test Run: [Date]

**Tester**: [Name]
**Environment**: [Dev/Staging/Production]
**Build Version**: [Version]

### Results Summary
- Total Scenarios: 40
- Passed: X
- Failed: Y
- Blocked: Z

### Failed Scenarios
| Scenario | Issue | Severity | Notes |
|----------|-------|----------|-------|
| S-XX | Description | High/Med/Low | Details |

### Performance Metrics
- Average sync latency: X ms
- API response time: X ms
- List with 100 items load time: X ms

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## Automation Opportunities

The following scenarios are good candidates for automated E2E testing:

### High Priority (Core Flows)
- Scenario 1: Create List
- Scenario 5: Share List with Editor
- Scenario 13: Editor Can Add Items
- Scenario 16: Viewer Cannot Add Items
- Scenario 19: Non-Owner Cannot Delete List

### Medium Priority (Edge Cases)
- Scenario 28: Share with Non-Existent User
- Scenario 29: Share with Already-Added User
- Scenario 30: Invalid Email Format

### Low Priority (Security)
- Scenario 36: Access List Without Permission
- Scenario 38: Malicious Permission Escalation

### Example Playwright Test
```typescript
test('Share list with editor permission', async ({ page }) => {
  // Login as Alice
  await page.goto('/login');
  await page.fill('[name="email"]', 'alice@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Create and share list
  await page.click('button:has-text("Create List")');
  await page.fill('[name="listName"]', 'Test List');
  await page.click('button:has-text("Create")');

  await page.click('button:has-text("Share List")');
  await page.fill('[name="email"]', 'bob@example.com');
  await page.selectOption('select[name="permission"]', 'editor');
  await page.click('button:has-text("Add Member")');

  // Verify success
  await expect(page.locator('.share-message-success')).toContainText('Successfully invited bob@example.com');
  await expect(page.locator('.share-members-list')).toContainText('bob@example.com');
});
```

---

## Conclusion

This comprehensive test plan covers 40 distinct scenarios across:
- Basic list operations (4 scenarios)
- List sharing operations (8 scenarios)
- Permission enforcement (9 scenarios)
- Real-time synchronization (6 scenarios)
- Edge cases and error handling (8 scenarios)
- Security and authorization (5 scenarios)

All scenarios include:
- Clear objectives
- Step-by-step instructions
- Expected results
- API endpoints called
- Database verification queries
- Real-time sync expectations

This document should serve as a complete testing guide for QA engineers and developers implementing or maintaining the list sharing feature.
