# Permission Testing Plan

Comprehensive test scenarios for verifying permission levels (owner, editor, viewer) in the grocery list application.

## Table of Contents
- [Overview](#overview)
- [Permission Levels](#permission-levels)
- [Test Environment Setup](#test-environment-setup)
- [API Permission Tests](#api-permission-tests)
- [UI Permission Tests](#ui-permission-tests)
- [Expected Error Messages](#expected-error-messages)
- [Test Verification Guide](#test-verification-guide)

---

## Overview

This document outlines 30+ comprehensive test scenarios to verify that permission restrictions are properly enforced at both the API and UI levels. Each test includes expected behavior, verification steps, and expected error messages.

### Test Priority Legend
- **P0**: Critical - Must pass before release
- **P1**: High - Should pass before release
- **P2**: Medium - Can be addressed post-release

---

## Permission Levels

### Owner (Full Control)
- Create, read, update, and delete the list
- Add, remove, and update members
- Full control over all list items (add, edit, delete, mark as gotten)
- View activity logs
- Generate and revoke invite links
- Delete the entire list

### Editor (Content Management)
- Read list and items
- Add new items to the list
- Edit existing items (name, quantity, category, notes)
- Delete items
- Mark items as gotten/not gotten
- View activity logs
- **Cannot**: Manage members, update list settings, delete list

### Viewer (Read-Only)
- Read list and items
- View activity logs
- View list members
- **Cannot**: Add, edit, or delete items
- **Cannot**: Mark items as gotten
- **Cannot**: Manage members
- **Cannot**: Update list settings
- **Cannot**: Delete list

---

## Test Environment Setup

### Prerequisites
```bash
# 1. Ensure database is running with all migrations applied
npm run migrate

# 2. Start backend server
cd server && npm run dev

# 3. Start frontend server
npm run dev

# 4. Have curl or Postman ready for API testing
# 5. Have multiple browser sessions/profiles for multi-user testing
```

### Test Data Setup

Create three test users:

```sql
-- Insert test users
INSERT INTO users (email, password_hash, name) VALUES
  ('owner@test.com', '$2a$10$...', 'Owner User'),
  ('editor@test.com', '$2a$10$...', 'Editor User'),
  ('viewer@test.com', '$2a$10$...', 'Viewer User');
```

Or use the registration endpoint:

```bash
# Register owner
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.com","password":"Test123!","name":"Owner User"}'

# Register editor
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@test.com","password":"Test123!","name":"Editor User"}'

# Register viewer
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@test.com","password":"Test123!","name":"Viewer User"}'
```

### Create Test List with Members

```bash
# 1. Login as owner and get access token
OWNER_TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.com","password":"Test123!"}' \
  | jq -r '.data.accessToken')

# 2. Create a test list
LIST_ID=$(curl -X POST http://localhost:3001/api/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"name":"Test Permissions List"}' \
  | jq -r '.data.list.id')

# 3. Get editor user ID
EDITOR_ID=$(curl -X GET "http://localhost:3001/api/users/search?email=editor@test.com" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  | jq -r '.data.users[0].id')

# 4. Get viewer user ID
VIEWER_ID=$(curl -X GET "http://localhost:3001/api/users/search?email=viewer@test.com" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  | jq -r '.data.users[0].id')

# 5. Add editor to list
curl -X POST http://localhost:3001/api/lists/$LIST_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"userId\":\"$EDITOR_ID\",\"permission\":\"editor\"}"

# 6. Add viewer to list
curl -X POST http://localhost:3001/api/lists/$LIST_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"userId\":\"$VIEWER_ID\",\"permission\":\"viewer\"}"

# 7. Login as editor and viewer to get their tokens
EDITOR_TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@test.com","password":"Test123!"}' \
  | jq -r '.data.accessToken')

VIEWER_TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@test.com","password":"Test123!"}' \
  | jq -r '.data.accessToken')
```

---

## API Permission Tests

### Test Category 1: Viewer Permissions (Read-Only)

#### Test 1.1: Viewer Can View List [P0]
**Objective**: Verify viewer can read list data

**API Request**:
```bash
curl -X GET http://localhost:3001/api/lists/$LIST_ID \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

**Expected Result**:
- Status: 200 OK
- Response contains list data with `permission: "viewer"`
- Response includes list members

**Verification**:
```bash
# Should return success with list data
echo "Response should contain: success: true, data.list.permission: 'viewer'"
```

---

#### Test 1.2: Viewer Cannot Add Items [P0]
**Objective**: Verify viewer cannot create new items

**API Request**:
```bash
curl -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d "{\"listId\":\"$LIST_ID\",\"name\":\"Test Item\",\"quantity\":1,\"category\":\"Other\"}"
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "This action requires editor permission or higher"

**Verification**:
```bash
# Should return 403 error
echo "Check for status 403 and error message about editor permission"
```

---

#### Test 1.3: Viewer Cannot Edit Items [P0]
**Objective**: Verify viewer cannot update existing items

**Setup**: First create an item as owner
```bash
ITEM_ID=$(curl -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"listId\":\"$LIST_ID\",\"name\":\"Test Item\",\"quantity\":1,\"category\":\"Other\"}" \
  | jq -r '.data.item.id')
```

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/items/$ITEM_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{"name":"Updated Name","quantity":2}'
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "This action requires editor permission or higher"

---

#### Test 1.4: Viewer Cannot Delete Items [P0]
**Objective**: Verify viewer cannot delete items

**API Request**:
```bash
curl -X DELETE http://localhost:3001/api/items/$ITEM_ID \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "This action requires editor permission or higher"

---

#### Test 1.5: Viewer Cannot Mark Items as Gotten [P0]
**Objective**: Verify viewer cannot toggle item gotten status

**API Request**:
```bash
curl -X PATCH http://localhost:3001/api/items/$ITEM_ID/gotten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{"gotten":true}'
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "This action requires editor permission or higher"

---

#### Test 1.6: Viewer Cannot Add Members [P0]
**Objective**: Verify viewer cannot add new members to list

**API Request**:
```bash
curl -X POST http://localhost:3001/api/lists/$LIST_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{"userId":"some-user-id","permission":"viewer"}'
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can add members"

---

#### Test 1.7: Viewer Cannot Remove Members [P0]
**Objective**: Verify viewer cannot remove members from list

**API Request**:
```bash
curl -X DELETE http://localhost:3001/api/lists/$LIST_ID/members/$EDITOR_ID \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can remove members"

---

#### Test 1.8: Viewer Cannot Update Member Permissions [P0]
**Objective**: Verify viewer cannot change member permissions

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/lists/$LIST_ID/members/$EDITOR_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{"permission":"viewer"}'
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can update member permissions"

---

#### Test 1.9: Viewer Cannot Update List Name [P0]
**Objective**: Verify viewer cannot rename the list

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/lists/$LIST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{"name":"New List Name"}'
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can update the list"

---

#### Test 1.10: Viewer Cannot Delete List [P0]
**Objective**: Verify viewer cannot delete the entire list

**API Request**:
```bash
curl -X DELETE http://localhost:3001/api/lists/$LIST_ID \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can delete the list"

---

### Test Category 2: Editor Permissions

#### Test 2.1: Editor Can View List [P0]
**Objective**: Verify editor can read list data

**API Request**:
```bash
curl -X GET http://localhost:3001/api/lists/$LIST_ID \
  -H "Authorization: Bearer $EDITOR_TOKEN"
```

**Expected Result**:
- Status: 200 OK
- Response contains list data with `permission: "editor"`

---

#### Test 2.2: Editor Can Add Items [P0]
**Objective**: Verify editor can create new items

**API Request**:
```bash
curl -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -d "{\"listId\":\"$LIST_ID\",\"name\":\"Editor Added Item\",\"quantity\":2,\"category\":\"Dairy\"}"
```

**Expected Result**:
- Status: 201 Created
- Response contains created item data
- Item is visible to all list members

---

#### Test 2.3: Editor Can Edit Items [P0]
**Objective**: Verify editor can update existing items

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/items/$ITEM_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -d '{"name":"Updated by Editor","quantity":5,"category":"Produce"}'
```

**Expected Result**:
- Status: 200 OK
- Response contains updated item data
- Changes are visible to all list members

---

#### Test 2.4: Editor Can Delete Items [P0]
**Objective**: Verify editor can delete items

**API Request**:
```bash
curl -X DELETE http://localhost:3001/api/items/$ITEM_ID \
  -H "Authorization: Bearer $EDITOR_TOKEN"
```

**Expected Result**:
- Status: 200 OK
- Item is removed from list
- Deletion is visible to all list members

---

#### Test 2.5: Editor Can Mark Items as Gotten [P0]
**Objective**: Verify editor can toggle item gotten status

**API Request**:
```bash
curl -X PATCH http://localhost:3001/api/items/$ITEM_ID/gotten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -d '{"gotten":true}'
```

**Expected Result**:
- Status: 200 OK
- Item gotten status is updated
- Change is visible to all list members

---

#### Test 2.6: Editor Can Update Item Notes [P1]
**Objective**: Verify editor can update item notes/descriptions

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/items/$ITEM_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -d '{"notes":"Important note added by editor"}'
```

**Expected Result**:
- Status: 200 OK
- Item notes are updated
- Notes are visible to all list members

---

#### Test 2.7: Editor Cannot Add Members [P0]
**Objective**: Verify editor cannot add new members to list

**API Request**:
```bash
curl -X POST http://localhost:3001/api/lists/$LIST_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -d '{"userId":"some-user-id","permission":"viewer"}'
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can add members"

---

#### Test 2.8: Editor Cannot Remove Members [P0]
**Objective**: Verify editor cannot remove members from list

**API Request**:
```bash
curl -X DELETE http://localhost:3001/api/lists/$LIST_ID/members/$VIEWER_ID \
  -H "Authorization: Bearer $EDITOR_TOKEN"
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can remove members"

---

#### Test 2.9: Editor Cannot Update Member Permissions [P0]
**Objective**: Verify editor cannot change member permissions

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/lists/$LIST_ID/members/$VIEWER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -d '{"permission":"editor"}'
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can update member permissions"

---

#### Test 2.10: Editor Cannot Update List Name [P0]
**Objective**: Verify editor cannot rename the list

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/lists/$LIST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -d '{"name":"Editor Updated Name"}'
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can update the list"

---

#### Test 2.11: Editor Cannot Delete List [P0]
**Objective**: Verify editor cannot delete the entire list

**API Request**:
```bash
curl -X DELETE http://localhost:3001/api/lists/$LIST_ID \
  -H "Authorization: Bearer $EDITOR_TOKEN"
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can delete the list"

---

#### Test 2.12: Editor Cannot Generate Invite Links [P1]
**Objective**: Verify editor cannot create invite links

**API Request**:
```bash
curl -X POST http://localhost:3001/api/lists/$LIST_ID/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -d '{"expiresInDays":7}'
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "Only the list owner can perform this action"

---

### Test Category 3: Owner Permissions

#### Test 3.1: Owner Can Perform All Item Operations [P0]
**Objective**: Verify owner has full control over items

**Test Steps**:
1. Create item
2. Update item
3. Mark as gotten
4. Delete item

**Expected Result**: All operations succeed with 200/201 status codes

---

#### Test 3.2: Owner Can Add Members [P0]
**Objective**: Verify owner can add new members

**API Request**: (See setup section)

**Expected Result**:
- Status: 201 Created
- New member is added with specified permission level
- Activity log shows member addition

---

#### Test 3.3: Owner Can Remove Members [P0]
**Objective**: Verify owner can remove members from list

**Expected Result**:
- Status: 200 OK
- Member is removed from list
- Member loses access to list
- Activity log shows member removal

---

#### Test 3.4: Owner Can Update Member Permissions [P0]
**Objective**: Verify owner can change member permission levels

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/lists/$LIST_ID/members/$EDITOR_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"permission":"viewer"}'
```

**Expected Result**:
- Status: 200 OK
- Member permission is updated
- Member's access changes accordingly
- Activity log shows permission change

---

#### Test 3.5: Owner Can Update List Name [P0]
**Objective**: Verify owner can rename the list

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/lists/$LIST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"name":"Renamed List"}'
```

**Expected Result**:
- Status: 200 OK
- List name is updated
- All members see new name
- Activity log shows list rename

---

#### Test 3.6: Owner Can Delete List [P0]
**Objective**: Verify owner can delete the entire list

**Warning**: This is destructive - use a separate test list

**API Request**:
```bash
curl -X DELETE http://localhost:3001/api/lists/$TEST_LIST_ID \
  -H "Authorization: Bearer $OWNER_TOKEN"
```

**Expected Result**:
- Status: 200 OK
- List is deleted
- All members lose access
- All items are deleted (cascade)
- Activity log entry is created

---

#### Test 3.7: Owner Can Generate Invite Links [P0]
**Objective**: Verify owner can create invite links

**API Request**:
```bash
curl -X POST http://localhost:3001/api/lists/$LIST_ID/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"expiresInDays":7}'
```

**Expected Result**:
- Status: 200 OK
- Response contains invite token and URL
- Invite link is valid for specified duration

---

#### Test 3.8: Owner Can Revoke Invite Links [P0]
**Objective**: Verify owner can revoke existing invite links

**API Request**:
```bash
curl -X DELETE http://localhost:3001/api/lists/$LIST_ID/invite \
  -H "Authorization: Bearer $OWNER_TOKEN"
```

**Expected Result**:
- Status: 200 OK
- Invite link is invalidated
- Previous invite links no longer work

---

#### Test 3.9: Owner Cannot Remove Self [P1]
**Objective**: Verify owner cannot remove themselves from list

**API Request**:
```bash
curl -X DELETE http://localhost:3001/api/lists/$LIST_ID/members/$OWNER_ID \
  -H "Authorization: Bearer $OWNER_TOKEN"
```

**Expected Result**:
- Status: 400 Bad Request
- Error message: "Cannot remove the list owner"

---

#### Test 3.10: Owner Cannot Change Own Permission [P1]
**Objective**: Verify owner cannot downgrade their own permission

**API Request**:
```bash
curl -X PUT http://localhost:3001/api/lists/$LIST_ID/members/$OWNER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"permission":"editor"}'
```

**Expected Result**:
- Status: 400 Bad Request
- Error message: "Cannot change the list owner's permission"

---

### Test Category 4: Non-Member Access

#### Test 4.1: Non-Member Cannot View List [P0]
**Objective**: Verify users without list access get 403

**Setup**: Create a new user not added to any list

**API Request**:
```bash
curl -X GET http://localhost:3001/api/lists/$LIST_ID \
  -H "Authorization: Bearer $NON_MEMBER_TOKEN"
```

**Expected Result**:
- Status: 403 Forbidden
- Error message: "You do not have access to this list"

---

#### Test 4.2: Non-Member Cannot Perform Any Operations [P0]
**Objective**: Verify non-members are blocked from all operations

**Test**: Try adding item, deleting item, managing members

**Expected Result**: All return 403 Forbidden

---

### Test Category 5: Authentication & Authorization

#### Test 5.1: Unauthenticated Request Returns 401 [P0]
**Objective**: Verify all protected endpoints require authentication

**API Request**:
```bash
curl -X GET http://localhost:3001/api/lists/$LIST_ID
```

**Expected Result**:
- Status: 401 Unauthorized
- Error message: "Authentication required"

---

#### Test 5.2: Invalid Token Returns 401 [P0]
**Objective**: Verify invalid tokens are rejected

**API Request**:
```bash
curl -X GET http://localhost:3001/api/lists/$LIST_ID \
  -H "Authorization: Bearer invalid-token-12345"
```

**Expected Result**:
- Status: 401 Unauthorized
- Error message: "Invalid or expired token"

---

#### Test 5.3: Expired Token Returns 401 [P1]
**Objective**: Verify expired tokens are rejected

**Setup**: Use a token that has expired (or wait for access token to expire)

**Expected Result**:
- Status: 401 Unauthorized
- Error message: "Token expired"
- Client should refresh token

---

---

## UI Permission Tests

### Test Category 6: Viewer UI Restrictions

#### Test 6.1: Viewer Sees Read-Only Badge [P0]
**Component**: `GroceryItem.tsx`

**Steps**:
1. Login as viewer user
2. Navigate to shared list
3. Observe items in list

**Expected Result**:
- Eye icon (👁️) badge is visible on items
- Tooltip shows "View-only access"
- All interactive elements are visually disabled

**Verification**:
```javascript
// Check for read-only badge
document.querySelector('.read-only-badge') !== null
```

---

#### Test 6.2: Viewer Cannot Check Item Checkboxes [P0]
**Component**: `GroceryItem.tsx`

**Steps**:
1. Login as viewer
2. Try to click checkbox on item
3. Observe that checkbox is disabled

**Expected Result**:
- Checkbox has `disabled` attribute
- Clicking does nothing
- Cursor shows "not-allowed" on hover
- Tooltip shows "View-only access"

**Verification**:
```javascript
// Check checkbox is disabled
document.querySelector('.grocery-item .checkbox').disabled === true
```

---

#### Test 6.3: Viewer Cannot Delete Items [P0]
**Component**: `GroceryItem.tsx`

**Steps**:
1. Login as viewer
2. Try to click delete button on item

**Expected Result**:
- Delete button is disabled
- Button is grayed out
- Tooltip shows "View-only access"
- No delete confirmation appears

**Verification**:
```javascript
// Check delete button is disabled
document.querySelector('.btn-delete').disabled === true
```

---

#### Test 6.4: Viewer Cannot Access Add Item Form [P0]
**Component**: `AddItemForm.tsx`

**Steps**:
1. Login as viewer
2. Navigate to list
3. Observe add item form

**Expected Result**:
- Form inputs are disabled
- Notice message: "You have view-only access to this list"
- Submit button is disabled
- Form has visual indication of disabled state

**Verification**:
```javascript
// Check form is disabled
document.querySelector('.add-item-form input[type="text"]').disabled === true
document.querySelector('.add-item-form button[type="submit"]').disabled === true
```

---

#### Test 6.5: Viewer Cannot Access Bulk Operations [P1]
**Component**: `BulkOperations.tsx`

**Steps**:
1. Login as viewer
2. Navigate to list
3. Look for bulk operations buttons

**Expected Result**:
- Bulk operation buttons are either hidden or disabled
- "Clear Gotten Items" button is not clickable
- "Delete All Items" button is not clickable

---

#### Test 6.6: Viewer Cannot See Share/Manage Buttons [P0]
**Component**: `ListManagement.tsx`

**Steps**:
1. Login as viewer
2. Navigate to list
3. Look for share/manage member buttons

**Expected Result**:
- "Share List" button is hidden or disabled
- Cannot access member management modal
- Cannot see "Add Member" functionality

---

#### Test 6.7: Viewer Cannot Edit Item Details [P1]
**Component**: Item edit modal/form (if exists)

**Steps**:
1. Login as viewer
2. Try to edit item name, quantity, or notes

**Expected Result**:
- Edit functionality is disabled
- No edit button appears
- Cannot modify any item fields

---

### Test Category 7: Editor UI Functionality

#### Test 7.1: Editor Can Add Items [P0]
**Component**: `AddItemForm.tsx`

**Steps**:
1. Login as editor
2. Fill out add item form
3. Submit form

**Expected Result**:
- Form is enabled and interactive
- All fields are editable
- Submit button is active
- Item is added successfully
- Success feedback is shown

---

#### Test 7.2: Editor Can Edit Items [P0]
**Component**: `GroceryItem.tsx`

**Steps**:
1. Login as editor
2. Click checkbox to mark item as gotten
3. Verify change persists

**Expected Result**:
- Checkbox is enabled
- Click toggles gotten state
- Visual feedback shows state change
- Change syncs across all users

---

#### Test 7.3: Editor Can Delete Items [P0]
**Component**: `GroceryItem.tsx`

**Steps**:
1. Login as editor
2. Click delete button on item
3. Confirm deletion

**Expected Result**:
- Delete button is enabled
- Confirmation dialog appears
- Item is removed after confirmation
- Deletion syncs across all users

---

#### Test 7.4: Editor Cannot Access Share Modal [P0]
**Component**: `ShareListModal.tsx`

**Steps**:
1. Login as editor
2. Look for share/manage members button
3. Try to access member management

**Expected Result**:
- Share button is hidden or disabled
- Cannot open share modal
- Cannot add/remove members
- Cannot change permissions

**Verification**:
```javascript
// Share button should not be clickable for editor
document.querySelector('.btn-share')?.disabled === true
```

---

#### Test 7.5: Editor Cannot Delete List [P0]
**Component**: List management section

**Steps**:
1. Login as editor
2. Look for delete list button
3. Try to access list settings

**Expected Result**:
- Delete list button is hidden or disabled
- Cannot access destructive list operations

---

#### Test 7.6: Editor Can Use Bulk Operations [P1]
**Component**: `BulkOperations.tsx`

**Steps**:
1. Login as editor
2. Use "Clear Gotten Items" feature
3. Verify items are cleared

**Expected Result**:
- Bulk operation buttons are enabled
- Operations execute successfully
- Changes sync across all users

---

#### Test 7.7: Editor Cannot Rename List [P0]
**Component**: List header/settings

**Steps**:
1. Login as editor
2. Try to edit list name

**Expected Result**:
- List name field is not editable
- No rename button appears
- Cannot modify list metadata

---

### Test Category 8: Owner UI Controls

#### Test 8.1: Owner Can Access All Features [P0]

**Steps**:
1. Login as owner
2. Verify all UI elements are accessible

**Expected Result**:
- All item operations available
- Share/manage members button visible
- Delete list button visible
- List rename functionality available
- All bulk operations available

---

#### Test 8.2: Owner Can Open Share Modal [P0]
**Component**: `ShareListModal.tsx`

**Steps**:
1. Login as owner
2. Click "Share List" button
3. Verify modal opens

**Expected Result**:
- Share button is visible and enabled
- Modal opens successfully
- Shows current members list
- Shows add member form
- Shows permission controls

---

#### Test 8.3: Owner Can Add Members via UI [P0]
**Component**: `ShareListModal.tsx`

**Steps**:
1. Open share modal
2. Enter user email
3. Select permission level
4. Click add member

**Expected Result**:
- Email search works
- User suggestions appear
- Permission dropdown works
- Member is added successfully
- Member appears in members list
- Success message is shown

---

#### Test 8.4: Owner Can Remove Members via UI [P0]
**Component**: `ShareListModal.tsx`

**Steps**:
1. Open share modal
2. Click remove button next to member
3. Confirm removal

**Expected Result**:
- Remove button appears for each member
- Confirmation dialog appears
- Member is removed successfully
- Member loses list access
- Success message is shown

---

#### Test 8.5: Owner Can Change Member Permissions [P0]
**Component**: `ShareListModal.tsx`

**Steps**:
1. Open share modal
2. Change permission dropdown for a member
3. Save changes

**Expected Result**:
- Permission dropdown is editable
- Options: viewer, editor
- Change saves successfully
- Member's access updates immediately
- Success message is shown

---

#### Test 8.6: Owner Can Delete List [P0]
**Component**: List management section

**Steps**:
1. Click delete list button
2. Confirm deletion

**Expected Result**:
- Delete button is visible and enabled
- Confirmation dialog appears
- Warning message about permanent deletion
- List is deleted after confirmation
- Redirected to lists page

---

#### Test 8.7: Owner Can Rename List [P0]
**Component**: List header/settings

**Steps**:
1. Click on list name or edit button
2. Enter new name
3. Save changes

**Expected Result**:
- List name is editable
- Changes save successfully
- New name appears for all users
- Success message is shown

---

---

## Expected Error Messages

### API Error Messages

| Status Code | Error Type | Message |
|-------------|-----------|---------|
| 401 | Unauthorized | "Authentication required" |
| 401 | Unauthorized | "Invalid or expired token" |
| 401 | Unauthorized | "Token expired" |
| 403 | Forbidden | "You do not have access to this list" |
| 403 | Forbidden | "This action requires editor permission or higher" |
| 403 | Forbidden | "Only the list owner can add members" |
| 403 | Forbidden | "Only the list owner can remove members" |
| 403 | Forbidden | "Only the list owner can update member permissions" |
| 403 | Forbidden | "Only the list owner can update the list" |
| 403 | Forbidden | "Only the list owner can delete the list" |
| 403 | Forbidden | "Only the list owner can perform this action" |
| 404 | Not Found | "List not found" |
| 404 | Not Found | "Item not found" |
| 404 | Not Found | "Member not found in this list" |
| 404 | Not Found | "User not found" |
| 400 | Bad Request | "Cannot remove the list owner" |
| 400 | Bad Request | "Cannot change the list owner's permission" |
| 400 | Validation | "Invalid email format" |
| 400 | Validation | "User is already a member of this list" |

### UI Error Messages

| Scenario | Message |
|----------|---------|
| Viewer tries to add item | "You have view-only access to this list" |
| No list selected | "Please select a list to add items" |
| Form disabled (viewer) | Tooltip: "View-only access" |
| Checkbox disabled | Tooltip: "View-only access" |
| Delete button disabled | Tooltip: "View-only access" |
| Network error | "Failed to connect to server. Please try again." |
| Permission denied | "You don't have permission to perform this action" |

---

## Test Verification Guide

### How to Verify Each Test

#### 1. API Tests with cURL

**Response Structure to Check**:
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "This action requires editor permission or higher"
}
```

**Verification Script**:
```bash
#!/bin/bash
# Run API test and verify response

test_api_permission() {
  local description=$1
  local endpoint=$2
  local method=$3
  local token=$4
  local expected_status=$5

  echo "Testing: $description"

  response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json")

  status_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" -eq "$expected_status" ]; then
    echo "✓ PASS: Got expected status $expected_status"
  else
    echo "✗ FAIL: Expected $expected_status, got $status_code"
  fi

  echo "Response: $body"
  echo "---"
}

# Example usage
test_api_permission \
  "Viewer cannot add items" \
  "http://localhost:3001/api/items" \
  "POST" \
  "$VIEWER_TOKEN" \
  403
```

---

#### 2. UI Tests with Browser DevTools

**Manual Verification Checklist**:

```
Viewer UI Tests:
□ Form inputs are disabled (check .disabled attribute)
□ Read-only badge is visible (check for .read-only-badge)
□ Checkboxes are disabled
□ Delete buttons are disabled
□ Share button is hidden or disabled
□ Permission notice message is displayed
```

**Browser Console Verification**:
```javascript
// Run in browser console to verify viewer restrictions

function verifyViewerRestrictions() {
  const tests = {
    'Add item form disabled': document.querySelector('.add-item-form input[type="text"]')?.disabled === true,
    'Submit button disabled': document.querySelector('.add-item-form button[type="submit"]')?.disabled === true,
    'Checkbox disabled': document.querySelector('.grocery-item .checkbox')?.disabled === true,
    'Delete button disabled': document.querySelector('.btn-delete')?.disabled === true,
    'Read-only badge visible': document.querySelector('.read-only-badge') !== null,
    'Permission notice shown': document.querySelector('.permission-notice') !== null
  };

  console.table(tests);

  const passed = Object.values(tests).every(v => v === true);
  console.log(passed ? '✓ All viewer restrictions verified' : '✗ Some restrictions failed');

  return tests;
}

verifyViewerRestrictions();
```

---

#### 3. Database Verification

**Check permissions after operations**:
```sql
-- Verify member permissions
SELECT
  u.name,
  u.email,
  lm.permission_level,
  lm.joined_at
FROM list_members lm
JOIN users u ON lm.user_id = u.id
WHERE lm.list_id = 'your-list-id'
ORDER BY lm.joined_at;

-- Verify activity log for permission checks
SELECT
  a.action,
  u.name as user_name,
  a.details,
  a.created_at
FROM activities a
JOIN users u ON a.user_id = u.id
WHERE a.list_id = 'your-list-id'
ORDER BY a.created_at DESC
LIMIT 20;

-- Check for unauthorized modifications
SELECT
  gi.name,
  gi.updated_at,
  u.name as last_modified_by
FROM grocery_items gi
JOIN users u ON gi.updated_by = u.id
WHERE gi.list_id = 'your-list-id'
ORDER BY gi.updated_at DESC;
```

---

#### 4. End-to-End Permission Flow Test

**Multi-User Test Scenario**:

```bash
#!/bin/bash
# Complete permission verification flow

echo "=== Starting Multi-User Permission Test ==="

# Setup: Create users and list (as shown in setup section)
source ./test-setup.sh

echo "Step 1: Owner creates item"
curl -X POST http://localhost:3001/api/items \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"listId\":\"$LIST_ID\",\"name\":\"Test Item\",\"quantity\":1,\"category\":\"Other\"}"

echo "Step 2: Editor marks item as gotten (should succeed)"
curl -X PATCH http://localhost:3001/api/items/$ITEM_ID/gotten \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gotten":true}'

echo "Step 3: Viewer tries to mark item (should fail with 403)"
curl -X PATCH http://localhost:3001/api/items/$ITEM_ID/gotten \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gotten":false}'

echo "Step 4: Editor tries to add member (should fail with 403)"
curl -X POST http://localhost:3001/api/lists/$LIST_ID/members \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"some-user-id","permission":"viewer"}'

echo "Step 5: Owner changes editor to viewer"
curl -X PUT http://localhost:3001/api/lists/$LIST_ID/members/$EDITOR_ID \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permission":"viewer"}'

echo "Step 6: Former editor tries to add item (should now fail with 403)"
curl -X POST http://localhost:3001/api/items \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"listId\":\"$LIST_ID\",\"name\":\"Should Fail\",\"quantity\":1,\"category\":\"Other\"}"

echo "=== Test Complete ==="
```

---

#### 5. Automated Test Suite

**Example using Vitest**:

```typescript
// tests/permissions.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { setupTestUsers, createTestList } from './helpers';

describe('Permission Tests', () => {
  let owner, editor, viewer;
  let listId, ownerToken, editorToken, viewerToken;

  beforeAll(async () => {
    // Setup test data
    ({ owner, editor, viewer } = await setupTestUsers());
    ({ listId, ownerToken, editorToken, viewerToken } = await createTestList(owner, editor, viewer));
  });

  describe('Viewer Permissions', () => {
    it('viewer can read list', async () => {
      const response = await fetch(`http://localhost:3001/api/lists/${listId}`, {
        headers: { Authorization: `Bearer ${viewerToken}` }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.list.permission).toBe('viewer');
    });

    it('viewer cannot add items', async () => {
      const response = await fetch('http://localhost:3001/api/items', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${viewerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listId,
          name: 'Test Item',
          quantity: 1,
          category: 'Other'
        })
      });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain('editor permission');
    });

    // Add more tests...
  });

  describe('Editor Permissions', () => {
    it('editor can add items', async () => {
      const response = await fetch('http://localhost:3001/api/items', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${editorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listId,
          name: 'Editor Item',
          quantity: 2,
          category: 'Dairy'
        })
      });
      expect(response.status).toBe(201);
    });

    it('editor cannot add members', async () => {
      const response = await fetch(`http://localhost:3001/api/lists/${listId}/members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${editorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'some-user-id',
          permission: 'viewer'
        })
      });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain('owner');
    });

    // Add more tests...
  });

  describe('Owner Permissions', () => {
    it('owner can perform all operations', async () => {
      // Test multiple operations
      const operations = [
        { method: 'POST', endpoint: 'items', expected: 201 },
        { method: 'PUT', endpoint: `lists/${listId}`, expected: 200 },
        { method: 'POST', endpoint: `lists/${listId}/members`, expected: 201 }
      ];

      for (const op of operations) {
        const response = await fetch(`http://localhost:3001/api/${op.endpoint}`, {
          method: op.method,
          headers: {
            Authorization: `Bearer ${ownerToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({/* appropriate body */})
        });
        expect(response.status).toBe(op.expected);
      }
    });

    // Add more tests...
  });
});
```

---

### Test Execution Checklist

**Before Testing**:
- [ ] Database migrations are up to date
- [ ] Backend server is running
- [ ] Frontend server is running
- [ ] Test users are created
- [ ] Test list with all three permission levels exists
- [ ] Browser DevTools console is open
- [ ] Network tab is monitoring requests

**During Testing**:
- [ ] Record all HTTP status codes
- [ ] Capture error messages
- [ ] Note any unexpected UI behavior
- [ ] Check browser console for JavaScript errors
- [ ] Verify database state after operations
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)

**After Testing**:
- [ ] Document any failures
- [ ] Clean up test data
- [ ] Review activity logs
- [ ] Compare results with expected outcomes
- [ ] File bug reports for failed tests
- [ ] Update test documentation as needed

---

## Summary

This comprehensive permission testing plan covers:

- **30+ test scenarios** across viewer, editor, and owner roles
- **API-level permission enforcement** with specific HTTP status codes
- **UI-level restriction verification** with disabled controls and visual feedback
- **Expected error messages** for every permission violation
- **Detailed verification steps** including manual, automated, and database checks
- **Multi-user testing flows** to validate real-world collaboration scenarios

### Coverage Matrix

| Action | Viewer | Editor | Owner | Test IDs |
|--------|--------|--------|-------|----------|
| View list | ✓ | ✓ | ✓ | 1.1, 2.1, 3.1 |
| Add items | ✗ | ✓ | ✓ | 1.2, 2.2 |
| Edit items | ✗ | ✓ | ✓ | 1.3, 2.3 |
| Delete items | ✗ | ✓ | ✓ | 1.4, 2.4 |
| Mark as gotten | ✗ | ✓ | ✓ | 1.5, 2.5 |
| Add members | ✗ | ✗ | ✓ | 1.6, 2.7, 3.2 |
| Remove members | ✗ | ✗ | ✓ | 1.7, 2.8, 3.3 |
| Update permissions | ✗ | ✗ | ✓ | 1.8, 2.9, 3.4 |
| Update list name | ✗ | ✗ | ✓ | 1.9, 2.10, 3.5 |
| Delete list | ✗ | ✗ | ✓ | 1.10, 2.11, 3.6 |
| Generate invites | ✗ | ✗ | ✓ | 2.12, 3.7 |

### Priority Summary

- **P0 Tests (Critical)**: 25 tests - Must pass before release
- **P1 Tests (High)**: 7 tests - Should pass before release
- **P2 Tests (Medium)**: Additional edge cases

All tests include both **API verification** (HTTP status codes and error messages) and **UI verification** (disabled buttons, visual indicators, tooltips).
