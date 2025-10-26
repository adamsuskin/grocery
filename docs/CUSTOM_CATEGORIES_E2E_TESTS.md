# End-to-End Test Plan: Custom Categories

Comprehensive manual end-to-end testing guide for custom category functionality in the Grocery List application.

## Table of Contents
- [Overview](#overview)
- [Test Environment Setup](#test-environment-setup)
- [Test Scenarios](#test-scenarios)
  - [Scenario 1: Create Custom Category](#scenario-1-create-custom-category)
  - [Scenario 2: Use Custom Category When Adding Item](#scenario-2-use-custom-category-when-adding-item)
  - [Scenario 3: Filter by Custom Category](#scenario-3-filter-by-custom-category)
  - [Scenario 4: Edit Custom Category](#scenario-4-edit-custom-category)
  - [Scenario 5: Delete Custom Category](#scenario-5-delete-custom-category)
  - [Scenario 6: Real-Time Sync](#scenario-6-real-time-sync)
- [Advanced Test Scenarios](#advanced-test-scenarios)
- [Test Data](#test-data)
- [Verification Checkpoints](#verification-checkpoints)
- [Troubleshooting](#troubleshooting)

---

## Overview

This document provides step-by-step end-to-end test procedures for custom category functionality. These tests validate the complete user workflow from creating categories through using them with items and real-time synchronization.

### Test Objectives
- Verify users can create, edit, and delete custom categories
- Validate category assignment to grocery items
- Test filtering and searching by custom categories
- Confirm real-time synchronization across multiple users
- Ensure proper permission enforcement
- Verify data integrity when deleting categories

### Prerequisites
- Grocery List application running locally or in test environment
- Database with test data
- At least 2 test user accounts
- Multiple browser sessions/profiles for multi-user testing

### Test Duration
- Core scenarios (1-6): 30-40 minutes
- Advanced scenarios: 20-30 minutes
- Total: ~60-70 minutes

---

## Test Environment Setup

### 1. Start All Services

```bash
# Terminal 1: Start database
docker compose up -d postgres

# Terminal 2: Start Zero sync server
pnpm zero:dev

# Terminal 3: Start backend API server
cd server
pnpm dev

# Terminal 4: Start frontend dev server
pnpm dev
```

### 2. Verify Services

```bash
# Check all services are running
curl http://localhost:3001/health        # API server
curl http://localhost:4848/health        # Zero sync
curl http://localhost:5173               # Frontend
```

### 3. Prepare Test Users

Create two test user accounts:

**User A (List Owner)**:
- Email: `category-test-a@e2etest.com`
- Password: `TestPass123!`
- Name: Alice Category

**User B (Collaborator/Editor)**:
- Email: `category-test-b@e2etest.com`
- Password: `TestPass123!`
- Name: Bob Category

### 4. Browser Setup

**Option 1: Multiple Browser Profiles (Recommended)**
- Create two Chrome profiles for User A and User B
- Each maintains separate session/cookies

**Option 2: Different Browsers**
- Use Chrome for User A, Firefox for User B

**Option 3: Incognito Mode**
- Regular window for User A
- Incognito for User B

### 5. Clean Database State

Before starting tests, clean up any previous test data:

```sql
-- Delete test categories
DELETE FROM custom_categories
WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE '%Category Test%'
);

-- Delete test items
DELETE FROM grocery_items
WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE '%Category Test%'
);

-- Delete test lists
DELETE FROM lists WHERE name LIKE '%Category Test%';

-- Verify cleanup
SELECT COUNT(*) FROM custom_categories
WHERE list_id IN (
  SELECT id FROM lists WHERE name LIKE '%Category Test%'
);
-- Expected: 0
```

---

## Test Scenarios

## Scenario 1: Create Custom Category

**Objective**: Verify user can create a new custom category with name, color, and icon.

**Priority**: P0 (Critical)

**Duration**: 5-7 minutes

**User**: User A (Owner)

### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1.1 | Open http://localhost:5173 in Browser A | App loads successfully | ☐ |
| 1.2 | Login as User A (category-test-a@e2etest.com) | Dashboard appears | ☐ |
| 1.3 | Click "Create New List" button | List creation modal opens | ☐ |
| 1.4 | Enter list name: "Category Test List" | Name appears in field | ☐ |
| 1.5 | Click "Create List" button | List created, redirects to list view | ☐ |
| 1.6 | Verify list appears in header/dropdown | List name visible | ☐ |
| 1.7 | Look for "Manage Categories" button (in settings or menu) | Button is visible | ☐ |
| 1.8 | Click "Manage Categories" button | Category manager modal opens | ☐ |
| 1.9 | Verify predefined categories are shown | See: Produce, Dairy, Meat, etc. | ☐ |
| 1.10 | Verify "Add Custom Category" form is visible | Form with name, color, icon fields | ☐ |
| 1.11 | In "Category Name" field, type: "Snacks" | Text appears in field | ☐ |
| 1.12 | Click on color picker | Color picker opens | ☐ |
| 1.13 | Select color: Orange (#FF9800) | Color updates to orange | ☐ |
| 1.14 | Click on icon picker | Icon/emoji picker opens | ☐ |
| 1.15 | Select emoji: 🍿 (popcorn) | Emoji appears in icon field | ☐ |
| 1.16 | Click "Add Category" button | Loading indicator appears briefly | ☐ |
| 1.17 | Wait for operation to complete | Success message appears | ☐ |
| 1.18 | Verify "Snacks" appears in Custom Categories section | Category visible with orange color and 🍿 icon | ☐ |
| 1.19 | Verify form is cleared | Name, color, icon reset to defaults | ☐ |
| 1.20 | Leave modal open for next test | Modal remains open | ☐ |

### Verification Checkpoints

**Visual Verification:**
- [ ] Custom category "Snacks" appears in the list
- [ ] Orange color (#FF9800) is displayed correctly
- [ ] Popcorn emoji (🍿) is visible
- [ ] Category is in "Custom Categories" section (not predefined)
- [ ] Success message confirms creation

**Console Verification:**
```javascript
// Open Browser DevTools Console
// Check that category was added to local state
const customCategories = document.querySelectorAll('.custom-category-item');
console.log('Custom category count:', customCategories.length);
// Expected: At least 1

// Check if the new category contains expected text
const snacksCategory = Array.from(customCategories).find(
  el => el.textContent.includes('Snacks')
);
console.log('Snacks category found:', snacksCategory !== undefined);
// Expected: true
```

**Database Verification:**
```sql
-- Verify category was created in database
SELECT
  id,
  name,
  color,
  icon,
  list_id,
  created_by,
  created_at
FROM custom_categories
WHERE name = 'Snacks'
  AND list_id = (SELECT id FROM lists WHERE name = 'Category Test List');

-- Expected: 1 row with:
-- - name: 'Snacks'
-- - color: '#FF9800'
-- - icon: '🍿'
-- - created_by: User A's ID
```

### Expected Results
- Category is created successfully
- All fields (name, color, icon) are saved correctly
- Success message is displayed
- Form is cleared for next entry
- Category appears in category manager immediately

### Edge Cases to Test
- [ ] Try creating category with empty name (should show error)
- [ ] Try creating duplicate category name (should show error)
- [ ] Try creating category with predefined name like "Produce" (should show error)
- [ ] Create category with only name (no color/icon) (should succeed with defaults)
- [ ] Create category with very long name (50+ chars) (should show error or truncate)

---

## Scenario 2: Use Custom Category When Adding Item

**Objective**: Verify custom categories appear in item creation form and can be assigned to items.

**Priority**: P0 (Critical)

**Duration**: 5-7 minutes

**User**: User A (Owner)

### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 2.1 | Close category manager modal (from previous test) | Modal closes, returns to list view | ☐ |
| 2.2 | Locate "Add Item" form | Form with name, quantity, category fields visible | ☐ |
| 2.3 | In "Item Name" field, type: "Potato Chips" | Text appears in field | ☐ |
| 2.4 | In "Quantity" field, enter: 2 | Number appears in field | ☐ |
| 2.5 | Click on "Category" dropdown | Dropdown opens | ☐ |
| 2.6 | Verify predefined categories are listed | See: Produce, Dairy, Meat, Bakery, etc. | ☐ |
| 2.7 | Verify "Snacks" category appears in dropdown | "Snacks" with 🍿 icon visible | ☐ |
| 2.8 | Select "Snacks" from dropdown | Dropdown closes, "Snacks" selected | ☐ |
| 2.9 | Click "Add Item" button | Loading indicator briefly | ☐ |
| 2.10 | Wait for item to appear | Item appears in list | ☐ |
| 2.11 | Verify item shows "Potato Chips" | Item name is correct | ☐ |
| 2.12 | Verify item shows quantity "2" | Quantity is correct | ☐ |
| 2.13 | Verify item shows category "Snacks" with icon | Category badge with 🍿 visible | ☐ |
| 2.14 | Add second item with custom category: <br> - Name: "Pretzels" <br> - Quantity: 1 <br> - Category: "Snacks" | Item appears with Snacks category | ☐ |
| 2.15 | Add third item with predefined category: <br> - Name: "Milk" <br> - Quantity: 1 <br> - Category: "Dairy" | Item appears with Dairy category | ☐ |
| 2.16 | Verify all 3 items are in the list | All items visible | ☐ |

### Verification Checkpoints

**Visual Verification:**
- [ ] "Snacks" category appears in category dropdown
- [ ] Custom category has icon/color displayed
- [ ] Items show correct category badge
- [ ] Category icon appears next to category name on items
- [ ] Custom and predefined categories are distinguishable

**Console Verification:**
```javascript
// Check items have correct categories
const items = document.querySelectorAll('.grocery-item');
console.log('Total items:', items.length);
// Expected: 3

// Check for Snacks category badges
const snacksItems = Array.from(items).filter(
  item => item.textContent.includes('Snacks')
);
console.log('Items with Snacks category:', snacksItems.length);
// Expected: 2
```

**Database Verification:**
```sql
-- Verify items have correct category
SELECT
  gi.name as item_name,
  gi.quantity,
  gi.category,
  gi.custom_category_id,
  cc.name as custom_category_name,
  cc.icon
FROM grocery_items gi
LEFT JOIN custom_categories cc ON gi.custom_category_id = cc.id
WHERE gi.list_id = (SELECT id FROM lists WHERE name = 'Category Test List')
ORDER BY gi.created_at;

-- Expected: 3 rows
-- Row 1: Potato Chips, category='Snacks', custom_category_name='Snacks', icon='🍿'
-- Row 2: Pretzels, category='Snacks', custom_category_name='Snacks', icon='🍿'
-- Row 3: Milk, category='Dairy', custom_category_id=NULL
```

### Expected Results
- Custom categories appear in dropdown alongside predefined categories
- Items can be assigned custom categories successfully
- Category information is displayed on items
- Both custom and predefined categories work correctly
- Multiple items can share the same custom category

### Edge Cases to Test
- [ ] Create item without selecting category (defaults to "Other")
- [ ] Switch category after creating item (via edit)
- [ ] Category dropdown shows categories alphabetically
- [ ] Category icon/color displays correctly in dropdown

---

## Scenario 3: Filter by Custom Category

**Objective**: Verify filtering functionality works with custom categories.

**Priority**: P0 (Critical)

**Duration**: 4-5 minutes

**User**: User A (Owner)

### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 3.1 | Verify list has 3 items (from Scenario 2) | 2 Snacks items, 1 Dairy item visible | ☐ |
| 3.2 | Locate category filter dropdown/buttons | Filter controls visible | ☐ |
| 3.3 | If not visible, look for "Filter" or "Categories" button | Click to show filters | ☐ |
| 3.4 | Click on category filter | Filter options appear | ☐ |
| 3.5 | Verify "Snacks" appears as filter option | Custom category listed | ☐ |
| 3.6 | Verify predefined categories also listed | Produce, Dairy, Meat, etc. visible | ☐ |
| 3.7 | Click on "Snacks" filter | Filter activates | ☐ |
| 3.8 | Verify only 2 items are shown | Potato Chips and Pretzels visible | ☐ |
| 3.9 | Verify Milk (Dairy) is hidden | Milk not visible | ☐ |
| 3.10 | Verify filter badge/indicator shows "Snacks" | Active filter indicated | ☐ |
| 3.11 | Verify item count updates | Shows "2 items" or similar | ☐ |
| 3.12 | Click on "Dairy" filter (or change filter) | Filter changes | ☐ |
| 3.13 | Verify only Milk is shown | Only Dairy items visible | ☐ |
| 3.14 | Verify Snacks items are hidden | Potato Chips and Pretzels not visible | ☐ |
| 3.15 | Click "All Categories" or clear filter | All items appear again | ☐ |
| 3.16 | Verify all 3 items are visible | All items back | ☐ |

### Verification Checkpoints

**Visual Verification:**
- [ ] Category filter includes custom categories
- [ ] Filtering works correctly for custom categories
- [ ] Filtered items match selected category
- [ ] Item count updates when filtering
- [ ] Clear filter button works
- [ ] Visual indication of active filter

**Console Verification:**
```javascript
// After filtering by Snacks
const visibleItems = document.querySelectorAll('.grocery-item:not(.hidden)');
console.log('Visible items after filter:', visibleItems.length);
// Expected: 2

// Verify all visible items are in Snacks category
const allSnacks = Array.from(visibleItems).every(
  item => item.textContent.includes('Snacks')
);
console.log('All visible items are Snacks:', allSnacks);
// Expected: true
```

**URL/State Verification:**
```javascript
// Check if filter is reflected in URL or app state
console.log('Current URL:', window.location.href);
// May include: ?category=Snacks or similar

// Check component state if accessible
console.log('Active filter:', /* check app state */);
```

### Expected Results
- Custom categories appear in filter options
- Filtering by custom category shows only relevant items
- Other items are hidden when filter is active
- Item count reflects filtered results
- Filter can be cleared to show all items
- Multiple filter changes work smoothly

### Edge Cases to Test
- [ ] Filter by category with no items (shows empty state)
- [ ] Filter by multiple categories at once (if supported)
- [ ] Filter persists after page refresh (if designed to)
- [ ] Filter works with search (combined filtering)

---

## Scenario 4: Edit Custom Category

**Objective**: Verify users can edit custom category name, color, and icon.

**Priority**: P0 (Critical)

**Duration**: 6-8 minutes

**User**: User A (Owner)

### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 4.1 | Open "Manage Categories" modal | Category manager opens | ☐ |
| 4.2 | Locate "Snacks" category in Custom Categories section | Category visible with 🍿 and orange color | ☐ |
| 4.3 | Hover over "Snacks" category | Edit/Delete buttons appear | ☐ |
| 4.4 | Click "Edit" button (pencil icon) | Edit mode activates | ☐ |
| 4.5 | Verify inline editing form appears | Name, color, icon fields editable | ☐ |
| 4.6 | Change name to: "Snacks & Treats" | Text updates in field | ☐ |
| 4.7 | Change color to: Blue (#2196F3) | Color picker shows, select blue | ☐ |
| 4.8 | Change icon to: 🍪 (cookie) | Icon picker shows, select cookie | ☐ |
| 4.9 | Click "Save" button | Loading indicator appears | ☐ |
| 4.10 | Wait for update to complete | Success message appears | ☐ |
| 4.11 | Verify name changed to "Snacks & Treats" | New name displayed | ☐ |
| 4.12 | Verify color changed to blue | Blue background/badge | ☐ |
| 4.13 | Verify icon changed to 🍪 | Cookie emoji displayed | ☐ |
| 4.14 | Verify edit mode exits | Returns to view mode | ☐ |
| 4.15 | Close category manager | Modal closes | ☐ |
| 4.16 | Return to list view | List of items visible | ☐ |
| 4.17 | Find items that had "Snacks" category | Potato Chips and Pretzels | ☐ |
| 4.18 | Verify category name updated on items | Shows "Snacks & Treats" | ☐ |
| 4.19 | Verify icon updated on items | Shows 🍪 cookie emoji | ☐ |
| 4.20 | Verify color updated on items | Blue badge/indicator | ☐ |
| 4.21 | Open category dropdown in add item form | Dropdown opens | ☐ |
| 4.22 | Verify updated category name in dropdown | "Snacks & Treats" visible | ☐ |

### Verification Checkpoints

**Visual Verification:**
- [ ] Edit mode activates correctly
- [ ] All fields are editable (name, color, icon)
- [ ] Changes are saved successfully
- [ ] Success message appears
- [ ] Category updates immediately in manager
- [ ] Items reflect updated category information
- [ ] Category dropdown shows updated name

**Console Verification:**
```javascript
// Verify category name updated in DOM
const categoryElements = document.querySelectorAll('.category-badge');
const updatedCategories = Array.from(categoryElements).filter(
  el => el.textContent.includes('Snacks & Treats')
);
console.log('Categories with updated name:', updatedCategories.length);
// Expected: 2 (both items)

// Verify emoji updated
const hasNewEmoji = Array.from(categoryElements).some(
  el => el.textContent.includes('🍪')
);
console.log('New emoji present:', hasNewEmoji);
// Expected: true
```

**Database Verification:**
```sql
-- Verify category was updated in database
SELECT
  id,
  name,
  color,
  icon,
  updated_at
FROM custom_categories
WHERE list_id = (SELECT id FROM lists WHERE name = 'Category Test List')
  AND name = 'Snacks & Treats';

-- Expected: 1 row with:
-- - name: 'Snacks & Treats'
-- - color: '#2196F3'
-- - icon: '🍪'
-- - updated_at: Recent timestamp

-- Verify items still reference this category
SELECT
  gi.name as item_name,
  cc.name as category_name,
  cc.icon,
  cc.color
FROM grocery_items gi
JOIN custom_categories cc ON gi.custom_category_id = cc.id
WHERE gi.list_id = (SELECT id FROM lists WHERE name = 'Category Test List')
  AND cc.name = 'Snacks & Treats';

-- Expected: 2 rows (Potato Chips, Pretzels) both showing updated category
```

### Expected Results
- Category can be edited successfully
- All fields (name, color, icon) can be updated
- Changes save correctly to database
- Items immediately reflect category changes
- Edit operation completes without errors
- No data loss during update

### Edge Cases to Test
- [ ] Try changing name to duplicate (should show error)
- [ ] Try changing name to predefined category (should show error)
- [ ] Cancel edit without saving (changes discarded)
- [ ] Edit only name (color/icon unchanged)
- [ ] Edit only color (name/icon unchanged)
- [ ] Edit only icon (name/color unchanged)

---

## Scenario 5: Delete Custom Category

**Objective**: Verify custom category deletion and item reassignment to 'Other'.

**Priority**: P0 (Critical)

**Duration**: 6-8 minutes

**User**: User A (Owner)

### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 5.1 | Open "Manage Categories" modal | Category manager opens | ☐ |
| 5.2 | Verify "Snacks & Treats" category exists | Category visible | ☐ |
| 5.3 | Hover over "Snacks & Treats" category | Edit/Delete buttons appear | ☐ |
| 5.4 | Click "Delete" button (trash icon) | Confirmation dialog appears | ☐ |
| 5.5 | Read confirmation message | Warning about items using this category | ☐ |
| 5.6 | Verify dialog shows item count (2 items) | Shows "2 items will be moved to 'Other'" | ☐ |
| 5.7 | Verify "Cancel" and "Delete" buttons present | Both buttons visible | ☐ |
| 5.8 | Click "Delete" button in dialog | Loading indicator appears | ☐ |
| 5.9 | Wait for deletion to complete | Success message appears | ☐ |
| 5.10 | Verify "Snacks & Treats" removed from list | Category no longer visible | ☐ |
| 5.11 | Verify only predefined categories remain | No custom categories in list | ☐ |
| 5.12 | Close category manager | Modal closes | ☐ |
| 5.13 | Return to list view | Items list visible | ☐ |
| 5.14 | Find Potato Chips item | Item visible in list | ☐ |
| 5.15 | Verify category changed to "Other" | Shows "Other" category | ☐ |
| 5.16 | Find Pretzels item | Item visible in list | ☐ |
| 5.17 | Verify category changed to "Other" | Shows "Other" category | ☐ |
| 5.18 | Verify items still have correct names/quantities | Data intact, only category changed | ☐ |
| 5.19 | Open category dropdown in add item form | Dropdown opens | ☐ |
| 5.20 | Verify "Snacks & Treats" is gone | Not in dropdown anymore | ☐ |

### Verification Checkpoints

**Visual Verification:**
- [ ] Delete confirmation dialog appears
- [ ] Dialog shows warning about affected items
- [ ] Item count is accurate
- [ ] Category is removed from manager after deletion
- [ ] Items are reassigned to "Other" category
- [ ] No broken references or missing items
- [ ] Success message confirms deletion

**Console Verification:**
```javascript
// Verify category removed from DOM
const customCategories = document.querySelectorAll('.custom-category-item');
console.log('Remaining custom categories:', customCategories.length);
// Expected: 0

// Verify items now show "Other"
const itemCategories = Array.from(document.querySelectorAll('.category-badge'))
  .map(el => el.textContent.trim());
console.log('Item categories:', itemCategories);
// Expected: ['Other', 'Other', 'Dairy'] or similar
```

**Database Verification:**
```sql
-- Verify category was deleted
SELECT COUNT(*)
FROM custom_categories
WHERE list_id = (SELECT id FROM lists WHERE name = 'Category Test List')
  AND name = 'Snacks & Treats';
-- Expected: 0

-- Verify items were reassigned to 'Other'
SELECT
  name,
  category,
  custom_category_id
FROM grocery_items
WHERE list_id = (SELECT id FROM lists WHERE name = 'Category Test List')
  AND name IN ('Potato Chips', 'Pretzels');

-- Expected: 2 rows with:
-- - category: 'Other'
-- - custom_category_id: NULL

-- Verify all item data is intact
SELECT
  name,
  quantity,
  category,
  notes,
  gotten
FROM grocery_items
WHERE list_id = (SELECT id FROM lists WHERE name = 'Category Test List')
ORDER BY name;

-- Expected: 3 rows, all data intact except categories updated
```

### Expected Results
- Delete confirmation dialog appears with warning
- Item count in dialog is accurate
- Category is deleted successfully
- Items using deleted category are reassigned to "Other"
- No items are lost or corrupted
- Category no longer appears in any dropdowns
- Success message confirms completion

### Edge Cases to Test
- [ ] Cancel deletion (category remains)
- [ ] Delete category with no items (simpler flow)
- [ ] Delete category then immediately create new one with same name (should work)
- [ ] Verify deletion is permanent (can't undo)
- [ ] Delete while another user is viewing (sync test)

---

## Scenario 6: Real-Time Sync

**Objective**: Verify category changes synchronize in real-time across multiple users.

**Priority**: P0 (Critical)

**Duration**: 10-12 minutes

**Users**: User A (Owner) and User B (Editor)

### Setup Phase

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 6.1 | Ensure User A is logged in (Browser A) | User A authenticated | ☐ |
| 6.2 | Open Browser B (separate profile/window) | New browser session | ☐ |
| 6.3 | Navigate to http://localhost:5173 | App loads | ☐ |
| 6.4 | Login as User B (category-test-b@e2etest.com) | Dashboard appears | ☐ |
| 6.5 | In Browser A, share "Category Test List" with User B | Share modal opens | ☐ |
| 6.6 | Enter User B's email: category-test-b@e2etest.com | Email entered | ☐ |
| 6.7 | Set permission to "Editor" | Editor selected | ☐ |
| 6.8 | Click "Add Member" | Member added | ☐ |
| 6.9 | Wait for sync (1-3 seconds) | - | ☐ |
| 6.10 | In Browser B, verify list appears | "Category Test List" in dropdown | ☐ |
| 6.11 | In Browser B, select the shared list | List opens with items | ☐ |
| 6.12 | Verify Browser B sees existing items | Milk and 2 items with "Other" category | ☐ |

### Test Part 1: Create Category in Browser A, Sync to Browser B

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 6.13 | **Browser A**: Open "Manage Categories" | Category manager opens | ☐ |
| 6.14 | **Browser A**: Create new category: <br> - Name: "Frozen Foods" <br> - Color: Blue (#03A9F4) <br> - Icon: ❄️ | Enter details | ☐ |
| 6.15 | **Browser A**: Click "Add Category" | Category created | ☐ |
| 6.16 | **Browser A**: Verify success message | "Category created" message | ☐ |
| 6.17 | **Browser A**: Verify category in list | "Frozen Foods" visible | ☐ |
| 6.18 | **Browser B**: Wait 1-3 seconds | Watch for update | ☐ |
| 6.19 | **Browser B**: Open "Manage Categories" | Category manager opens | ☐ |
| 6.20 | **Browser B**: Verify "Frozen Foods" appears | Category synced with ❄️ icon | ☐ |
| 6.21 | **Browser B**: Verify color is blue | Blue color visible | ☐ |
| 6.22 | **Both**: Close category managers | Both modals close | ☐ |

### Test Part 2: Use Synced Category in Browser B

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 6.23 | **Browser B**: Open add item form | Form visible | ☐ |
| 6.24 | **Browser B**: Add item: <br> - Name: "Ice Cream" <br> - Quantity: 1 <br> - Category: "Frozen Foods" | Enter details | ☐ |
| 6.25 | **Browser B**: Verify "Frozen Foods" in dropdown | Synced category available | ☐ |
| 6.26 | **Browser B**: Select "Frozen Foods" | Category selected | ☐ |
| 6.27 | **Browser B**: Click "Add Item" | Item added | ☐ |
| 6.28 | **Browser B**: Verify item appears with "Frozen Foods" category | Item visible with ❄️ icon | ☐ |
| 6.29 | **Browser A**: Wait 1-3 seconds | Watch for update | ☐ |
| 6.30 | **Browser A**: Verify "Ice Cream" item appears | Item synced to Browser A | ☐ |
| 6.31 | **Browser A**: Verify category is "Frozen Foods" | Category badge with ❄️ | ☐ |

### Test Part 3: Edit Category in Browser B, Sync to Browser A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 6.32 | **Browser B**: Open "Manage Categories" | Category manager opens | ☐ |
| 6.33 | **Browser B**: Find "Frozen Foods" category | Category visible | ☐ |
| 6.34 | **Browser B**: Click "Edit" on category | Edit mode activates | ☐ |
| 6.35 | **Browser B**: Change name to "Frozen & Cold" | New name entered | ☐ |
| 6.36 | **Browser B**: Change icon to 🧊 (ice cube) | New icon selected | ☐ |
| 6.37 | **Browser B**: Click "Save" | Changes saved | ☐ |
| 6.38 | **Browser B**: Verify success message | "Category updated" | ☐ |
| 6.39 | **Browser A**: Wait 1-3 seconds | Watch for update | ☐ |
| 6.40 | **Browser A**: Open "Manage Categories" | Category manager opens | ☐ |
| 6.41 | **Browser A**: Verify "Frozen & Cold" name | Name updated | ☐ |
| 6.42 | **Browser A**: Verify 🧊 icon | Icon updated | ☐ |
| 6.43 | **Browser A**: Close category manager | Modal closes | ☐ |
| 6.44 | **Browser A**: Check "Ice Cream" item | Item visible | ☐ |
| 6.45 | **Browser A**: Verify category updated on item | Shows "Frozen & Cold" with 🧊 | ☐ |
| 6.46 | **Both**: Verify category dropdown has updated name | Both browsers show "Frozen & Cold" | ☐ |

### Test Part 4: Delete Category in Browser A, Sync to Browser B

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 6.47 | **Browser A**: Open "Manage Categories" | Category manager opens | ☐ |
| 6.48 | **Browser A**: Find "Frozen & Cold" category | Category visible | ☐ |
| 6.49 | **Browser A**: Click "Delete" on category | Confirmation dialog appears | ☐ |
| 6.50 | **Browser A**: Confirm deletion | Category deleted | ☐ |
| 6.51 | **Browser A**: Verify success message | "Category deleted" | ☐ |
| 6.52 | **Browser A**: Verify category removed | Not in list anymore | ☐ |
| 6.53 | **Browser A**: Check "Ice Cream" item | Item visible | ☐ |
| 6.54 | **Browser A**: Verify category changed to "Other" | Shows "Other" category | ☐ |
| 6.55 | **Browser B**: Wait 1-3 seconds | Watch for update | ☐ |
| 6.56 | **Browser B**: Open "Manage Categories" | Category manager opens | ☐ |
| 6.57 | **Browser B**: Verify "Frozen & Cold" removed | Category not in list | ☐ |
| 6.58 | **Browser B**: Close category manager | Modal closes | ☐ |
| 6.59 | **Browser B**: Check "Ice Cream" item | Item visible | ☐ |
| 6.60 | **Browser B**: Verify category changed to "Other" | Synced to "Other" | ☐ |

### Verification Checkpoints

**Real-Time Sync Verification:**
- [ ] Category creation syncs within 1-3 seconds
- [ ] Category updates sync within 1-3 seconds
- [ ] Category deletion syncs within 1-3 seconds
- [ ] Item category changes sync immediately
- [ ] No manual refresh needed
- [ ] Both users see identical data

**Console Verification (Both Browsers):**
```javascript
// Check WebSocket connection status
const wsConnections = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('4848'));
console.log('WebSocket connections:', wsConnections);
// Should see active WebSocket connection

// Monitor sync events in console
// Look for Zero sync logs or custom sync indicators
```

**Network Verification:**
```
Open DevTools > Network > WS (WebSocket)
- Verify WebSocket connection is established
- Monitor messages during operations
- Should see sync messages when changes occur
```

### Expected Results
- Category creation syncs to all users immediately
- Category updates sync in real-time
- Category deletion syncs and reassigns items
- No conflicts or lost updates
- Consistent state across all browsers
- Performance is acceptable (< 3 second sync)

### Edge Cases to Test
- [ ] Both users create category simultaneously (conflict resolution)
- [ ] Both users edit same category (last write wins)
- [ ] User B tries to delete while User A is editing (permission/sync test)
- [ ] Network interruption during sync (offline handling)
- [ ] One user deletes category while other is using it (graceful handling)

---

## Advanced Test Scenarios

### Scenario 7: Permission-Based Access Control

**Objective**: Verify viewers cannot create/edit/delete categories, but editors can.

**Priority**: P1 (High)

**Duration**: 8-10 minutes

**Users**: User A (Owner), User B (Viewer)

#### Test Steps

1. **Setup**: User A changes User B's permission to "Viewer"
2. **Browser B**: Verify "Manage Categories" button is hidden or disabled
3. **Browser B**: If accessible, verify all edit/delete buttons are disabled
4. **Browser B**: Verify read-only mode for categories
5. **Browser A**: Change User B's permission back to "Editor"
6. **Browser B**: Verify UI updates to enable editing
7. **Browser B**: Verify can now create/edit/delete categories

#### Expected Results
- Viewers have read-only access to categories
- Editors have full access to category management
- UI updates when permissions change
- API enforces permission checks

---

### Scenario 8: Category with Special Characters

**Objective**: Verify categories can handle special characters in names.

**Priority**: P2 (Medium)

**Duration**: 5-6 minutes

**User**: User A (Owner)

#### Test Steps

1. Create category with name: "Snacks & Treats (Kids)"
2. Create category with name: "Café Items"
3. Create category with emoji in name: "Healthy 💚 Foods"
4. Verify all categories save correctly
5. Verify special characters display properly
6. Use categories with items
7. Filter by categories with special characters

#### Expected Results
- Special characters are preserved
- Unicode characters (emojis, accents) work correctly
- Display is correct throughout app
- Filtering and searching work with special characters

---

### Scenario 9: Category Name Validation

**Objective**: Verify validation prevents duplicate and invalid category names.

**Priority**: P1 (High)

**Duration**: 6-8 minutes

**User**: User A (Owner)

#### Test Steps

1. Create category: "Test Category"
2. Try creating duplicate: "Test Category" (exact match)
   - **Expected**: Error "Category already exists"
3. Try creating duplicate: "test category" (case-insensitive)
   - **Expected**: Error "Category already exists"
4. Try creating: "Produce" (predefined category name)
   - **Expected**: Error "Cannot use predefined category name"
5. Try creating with empty name: ""
   - **Expected**: Error "Category name required"
6. Try creating with very long name (100+ chars)
   - **Expected**: Error "Name too long" or truncation
7. Create valid unique name: "Test Category 2"
   - **Expected**: Success

#### Expected Results
- Duplicate detection is case-insensitive
- Predefined category names are protected
- Empty names are rejected
- Length limits are enforced
- Clear error messages guide user

---

### Scenario 10: Bulk Category Operations

**Objective**: Test performance and functionality with many categories.

**Priority**: P2 (Medium)

**Duration**: 10-12 minutes

**User**: User A (Owner)

#### Test Steps

1. Create 20 custom categories with different names/colors/icons
2. Verify all categories appear in manager
3. Verify all categories appear in dropdown (with scrolling if needed)
4. Create items using various categories
5. Test filtering with many categories
6. Edit multiple categories
7. Delete several categories
8. Verify performance remains acceptable

#### Expected Results
- App handles many custom categories
- UI remains responsive
- Dropdown is usable (scrollable)
- Filtering works with many options
- Performance acceptable (< 2s operations)

---

### Scenario 11: Category Manager UX

**Objective**: Verify user experience and accessibility of category manager.

**Priority**: P2 (Medium)

**Duration**: 8-10 minutes

**User**: User A (Owner)

#### Test Steps

1. **Keyboard Navigation**:
   - Tab through all form fields
   - Press Enter to submit form
   - Press Escape to close modal
   - Use arrow keys in dropdowns

2. **Color Picker**:
   - Click color picker opens palette
   - Select predefined colors
   - Enter custom hex code
   - Verify preview updates

3. **Icon Picker**:
   - Click icon picker opens emoji palette
   - Browse categories (if supported)
   - Search emojis (if supported)
   - Select emoji
   - Verify preview updates

4. **Form Validation**:
   - Submit empty form (errors shown)
   - Submit with only name (succeeds with defaults)
   - Fix validation errors (errors clear)

5. **Loading States**:
   - Verify loading indicators during save
   - Verify disabled state during operations
   - Verify success/error messages

#### Expected Results
- Fully keyboard accessible
- Clear visual feedback for all actions
- Intuitive color and icon pickers
- Immediate validation feedback
- Loading states prevent double-submission
- Messages are clear and helpful

---

### Scenario 12: Category Migration on Import

**Objective**: Verify categories work correctly when importing lists or templates.

**Priority**: P2 (Medium)

**Duration**: 6-8 minutes

**User**: User A (Owner)

#### Test Steps

1. Create list with custom categories
2. Add items using custom categories
3. Export list as CSV/JSON
4. Delete list
5. Import list from exported file
6. Verify categories were recreated
7. Verify items have correct categories
8. Verify no duplicate categories created

#### Expected Results
- Custom categories are preserved in export
- Import recreates categories correctly
- Category relationships maintained
- No data loss during export/import cycle

---

## Test Data

### Standard Test Categories

Use these categories for consistent testing:

| Name | Color | Icon | Use Case |
|------|-------|------|----------|
| Snacks | #FF9800 | 🍿 | General snack items |
| Frozen Foods | #03A9F4 | ❄️ | Frozen section items |
| Beverages | #E91E63 | 🥤 | Drinks category |
| Pet Supplies | #9C27B0 | 🐾 | Pet items |
| Cleaning | #00BCD4 | 🧹 | Cleaning products |
| Pharmacy | #F44336 | 💊 | Medicine and health |
| Baby Items | #FFB6C1 | 👶 | Baby products |
| International | #4CAF50 | 🌍 | International foods |

### Test Items by Category

**Snacks Category**:
- Potato Chips (qty: 2)
- Pretzels (qty: 1)
- Trail Mix (qty: 3)
- Popcorn (qty: 1)

**Frozen Foods Category**:
- Ice Cream (qty: 1)
- Frozen Pizza (qty: 2)
- Frozen Vegetables (qty: 3)
- Ice (qty: 1)

**Predefined Categories** (for comparison):
- Milk (Dairy, qty: 1)
- Bread (Bakery, qty: 1)
- Apples (Produce, qty: 6)
- Chicken (Meat, qty: 2)

### SQL Test Data Script

```sql
-- Clean up existing test data
DELETE FROM grocery_items WHERE list_id IN (
  SELECT id FROM lists WHERE name = 'Category Test List'
);
DELETE FROM custom_categories WHERE list_id IN (
  SELECT id FROM lists WHERE name = 'Category Test List'
);

-- Note: Categories and items should be created through UI during testing
-- This ensures E2E validation of creation flows
```

---

## Verification Checkpoints

### Visual Verification Checklist

After each scenario, verify these visual elements:

- [ ] Category appears in category manager
- [ ] Category has correct name
- [ ] Category has correct color (if specified)
- [ ] Category has correct icon (if specified)
- [ ] Category appears in dropdown menus
- [ ] Items display category badge correctly
- [ ] Category colors render properly
- [ ] Icons/emojis display correctly
- [ ] Success messages appear and auto-hide
- [ ] Error messages are clear and helpful
- [ ] Loading indicators show during operations
- [ ] UI updates immediately after operations

### Database Verification Queries

Run these queries to verify data integrity:

#### Check Custom Categories

```sql
-- List all custom categories for test list
SELECT
  id,
  name,
  color,
  icon,
  list_id,
  created_by,
  created_at,
  updated_at
FROM custom_categories
WHERE list_id = (SELECT id FROM lists WHERE name = 'Category Test List')
ORDER BY created_at;
```

#### Check Items with Categories

```sql
-- List all items with their categories
SELECT
  gi.id,
  gi.name,
  gi.quantity,
  gi.category,
  gi.custom_category_id,
  cc.name as custom_category_name,
  cc.icon as custom_category_icon,
  cc.color as custom_category_color
FROM grocery_items gi
LEFT JOIN custom_categories cc ON gi.custom_category_id = cc.id
WHERE gi.list_id = (SELECT id FROM lists WHERE name = 'Category Test List')
ORDER BY gi.name;
```

#### Check Category Usage

```sql
-- Count items per category
SELECT
  COALESCE(cc.name, gi.category) as category_name,
  COUNT(*) as item_count
FROM grocery_items gi
LEFT JOIN custom_categories cc ON gi.custom_category_id = cc.id
WHERE gi.list_id = (SELECT id FROM lists WHERE name = 'Category Test List')
GROUP BY COALESCE(cc.name, gi.category)
ORDER BY item_count DESC;
```

#### Check Orphaned Items

```sql
-- Find items with invalid category references
SELECT
  gi.id,
  gi.name,
  gi.custom_category_id
FROM grocery_items gi
WHERE gi.custom_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_categories cc
    WHERE cc.id = gi.custom_category_id
  )
  AND gi.list_id = (SELECT id FROM lists WHERE name = 'Category Test List');

-- Expected: 0 rows (no orphaned items)
```

### Console Debugging Commands

Use these in browser DevTools console:

```javascript
// Check custom categories in app state
console.log('Custom categories:',
  Array.from(document.querySelectorAll('.custom-category-item'))
    .map(el => el.textContent.trim())
);

// Check item categories
console.log('Item categories:',
  Array.from(document.querySelectorAll('.category-badge'))
    .map(el => el.textContent.trim())
);

// Check for errors
console.log('Errors:',
  document.querySelectorAll('.error-message, .alert-error')
);

// Check WebSocket status
console.log('WebSocket status:',
  performance.getEntriesByType('resource')
    .filter(r => r.name.includes('4848'))
);

// Check local storage
console.log('Auth token present:',
  !!localStorage.getItem('authToken')
);
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Categories Not Appearing

**Symptoms**:
- Created category doesn't show in manager
- Category not in dropdown

**Diagnostic Steps**:
1. Check browser console for errors
2. Verify database with SQL query
3. Check network tab for failed requests
4. Verify user permissions

**Solutions**:
- Refresh page (Ctrl+R or Cmd+R)
- Clear browser cache
- Check database connection
- Verify Zero sync is running
- Check for validation errors in console

---

#### Issue 2: Real-Time Sync Not Working

**Symptoms**:
- Changes in Browser A don't appear in Browser B
- Delay > 5 seconds

**Diagnostic Steps**:
1. Check WebSocket connection in Network tab
2. Verify Zero sync server is running
3. Check for console errors in both browsers
4. Verify both users are on same list

**Solutions**:
```bash
# Restart Zero sync server
pkill -f zero-cache
pnpm zero:dev

# Clear browser cache
# In DevTools Console:
indexedDB.deleteDatabase('zero-cache');
location.reload();
```

---

#### Issue 3: Category Deletion Doesn't Reassign Items

**Symptoms**:
- Items disappear after category deletion
- Items show broken category reference

**Diagnostic Steps**:
```sql
-- Check for orphaned items
SELECT * FROM grocery_items
WHERE custom_category_id IS NOT NULL
  AND custom_category_id NOT IN (SELECT id FROM custom_categories);
```

**Solutions**:
```sql
-- Manually fix orphaned items
UPDATE grocery_items
SET category = 'Other',
    custom_category_id = NULL
WHERE custom_category_id IS NOT NULL
  AND custom_category_id NOT IN (SELECT id FROM custom_categories);
```

---

#### Issue 4: Duplicate Category Created

**Symptoms**:
- Same category appears multiple times
- Validation didn't catch duplicate

**Diagnostic Steps**:
```sql
-- Check for duplicates
SELECT name, COUNT(*) as count
FROM custom_categories
WHERE list_id = 'your-list-id'
GROUP BY name
HAVING COUNT(*) > 1;
```

**Solutions**:
```sql
-- Remove duplicate, keep oldest
DELETE FROM custom_categories
WHERE id NOT IN (
  SELECT MIN(id)
  FROM custom_categories
  GROUP BY list_id, LOWER(name)
)
AND list_id = 'your-list-id';
```

---

#### Issue 5: Permission Errors

**Symptoms**:
- "Permission denied" when editing
- Viewer can somehow edit categories

**Diagnostic Steps**:
```sql
-- Check user's permission level
SELECT
  u.email,
  lm.permission_level
FROM list_members lm
JOIN users u ON lm.user_id = u.id
WHERE lm.list_id = 'your-list-id';
```

**Solutions**:
- Verify user has correct permission level
- Logout and login again
- Check API permission middleware
- Verify permission sync from database

---

#### Issue 6: UI Not Updating After Operation

**Symptoms**:
- Success message shows but UI unchanged
- Need to refresh to see changes

**Diagnostic Steps**:
1. Check if operation actually succeeded (database query)
2. Check console for React errors
3. Verify Zero sync is updating local cache

**Solutions**:
- Hard refresh: Ctrl+Shift+R or Cmd+Shift+R
- Clear IndexedDB cache
- Check for React component update issues
- Verify optimistic updates in code

---

### Performance Issues

#### Slow Category Operations

If operations take > 3 seconds:

1. Check database indexes:
```sql
-- Verify indexes exist
SELECT * FROM pg_indexes
WHERE tablename = 'custom_categories';
```

2. Check network latency:
```javascript
// Measure API response time
const start = performance.now();
// Make API call
const end = performance.now();
console.log('API latency:', end - start, 'ms');
```

3. Check database query performance:
```sql
EXPLAIN ANALYZE
SELECT * FROM custom_categories
WHERE list_id = 'your-list-id';
```

#### Slow Real-Time Sync

If sync takes > 3 seconds:

1. Check Zero sync server logs
2. Verify WebSocket connection is stable
3. Check network conditions
4. Verify no CPU/memory bottlenecks

---

### Test Failure Recovery

If a test fails:

1. **Document the failure**:
   - Screenshot the error
   - Copy error messages
   - Note the step that failed
   - Record browser/environment details

2. **Check logs**:
   - Browser console errors
   - API server logs
   - Zero sync logs
   - Database logs

3. **Verify environment**:
   - All services running?
   - Database accessible?
   - Network connectivity?
   - Correct user permissions?

4. **Reset and retry**:
   - Clean database state
   - Clear browser cache
   - Restart services if needed
   - Re-run the test

5. **Report the bug**:
   - Create detailed bug report
   - Include reproduction steps
   - Attach screenshots/logs
   - Tag as E2E test failure

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] All services running (DB, Zero, API, Frontend)
- [ ] Database cleaned of previous test data
- [ ] Test users created
- [ ] Multiple browser sessions ready
- [ ] DevTools open in each browser

### During Testing
- [ ] Follow test steps in order
- [ ] Check pass/fail for each step
- [ ] Run verification queries after scenarios
- [ ] Take screenshots of failures
- [ ] Note any unexpected behavior
- [ ] Monitor sync timing

### Post-Test Cleanup
- [ ] Document all test results
- [ ] File bug reports for failures
- [ ] Clean up test data
- [ ] Logout test users
- [ ] Clear browser caches

---

## Test Results Template

Use this template to record test results:

```
# Custom Categories E2E Test Results

**Date**: YYYY-MM-DD
**Tester**: [Your Name]
**Environment**: [Local/Test/Staging]
**Build/Commit**: [Git commit hash]

## Test Summary
- Total Scenarios: 12
- Passed: X
- Failed: Y
- Blocked: Z
- Duration: XX minutes

## Scenario Results

### Scenario 1: Create Custom Category
- **Status**: PASS / FAIL / BLOCKED
- **Duration**: X minutes
- **Notes**: [Any observations]
- **Screenshots**: [Attach if failed]

### Scenario 2: Use Custom Category When Adding Item
- **Status**: PASS / FAIL / BLOCKED
- **Duration**: X minutes
- **Notes**: [Any observations]

[Continue for all scenarios...]

## Issues Found
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce: [...]
   - Expected: [...]
   - Actual: [...]
   - Screenshot: [...]

## Overall Assessment
[Summary of test execution and app quality]

## Recommendations
[Any improvements or follow-up needed]
```

---

## Continuous Improvement

### Test Suite Maintenance

Review and update this test plan:
- After each major feature release
- When new category features are added
- When bugs are found via testing
- Based on user feedback

### Automation Opportunities

Consider automating these scenarios with Playwright or Cypress:
- Scenario 1-5 (Core functionality)
- Permission testing (Scenario 7)
- Validation testing (Scenario 9)

### Metrics to Track

- Test execution time (target: < 60 minutes)
- Pass rate (target: > 95%)
- Bug detection rate
- Time to find critical bugs
- Sync latency (target: < 2 seconds)

---

## Resources

### Related Documentation
- [Custom Categories Feature Guide](/home/adam/grocery/docs/CUSTOM_CATEGORIES.md)
- [Unit Test README](/home/adam/grocery/tests/categories/README.md)
- [General E2E Test Plan](/home/adam/grocery/docs/E2E_TESTS.md)
- [Real-Time Sync Tests](/home/adam/grocery/docs/REALTIME_TESTS.md)

### Tools
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Zero Sync](https://zero.rocicorp.dev/)

### Support
- File issues in project repository
- Contact: [Team lead/maintainer]
- Slack channel: #grocery-list-testing

---

**Document Version**: 1.0
**Last Updated**: 2025-10-26
**Maintained By**: QA Team
**Status**: Active
