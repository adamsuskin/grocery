# List Templates - Test Plan

## Overview

This document outlines the test plan for the List Templates feature, which allows users to quickly create grocery lists from pre-built templates with pre-populated items.

## Test Scenarios

### 1. Template Discovery & Browsing

#### 1.1 View Template List
**Test Steps:**
1. Open the app and navigate to list selector
2. Click "Use a Template" button
3. Verify template selector modal opens

**Expected Results:**
- Modal displays with title "Choose a Template"
- 9 templates are visible in grid layout
- Each template shows: icon, name, description, item count
- Close button (X) is visible in header

**Status:** ✅ Pass / ❌ Fail

---

#### 1.2 Template Card Display
**Test Steps:**
1. Open template selector
2. Inspect each template card

**Expected Results:**
- Each card shows appropriate icon (emoji)
- Template name is clearly visible
- Description provides context about the template
- Item count displays (e.g., "16 items")
- Cards have hover effect

**Templates to Verify:**
- [ ] Weekly Groceries (🛒) - 16 items
- [ ] Party Supplies (🎉) - 14 items
- [ ] Breakfast Essentials (🍳) - 17 items
- [ ] Healthy Snacks (🥗) - 14 items
- [ ] BBQ Cookout (🍖) - 19 items
- [ ] Baking Basics (🧁) - 15 items
- [ ] Quick Dinner (🍽️) - 15 items
- [ ] Coffee & Tea Station (☕) - 13 items
- [ ] Camping Trip (🏕️) - 21 items

**Status:** ✅ Pass / ❌ Fail

---

### 2. Template Selection & Preview

#### 2.1 Select Template
**Test Steps:**
1. Open template selector
2. Click on "Weekly Groceries" template card

**Expected Results:**
- Card highlights with blue border and light blue background
- Preview section appears below the grid
- Preview shows "Preview: Weekly Groceries"
- First 5 items are listed with name, quantity, and category
- "+ X more items" message shows remaining count
- "Use This Template" button becomes enabled

**Status:** ✅ Pass / ❌ Fail

---

#### 2.2 Switch Template Selection
**Test Steps:**
1. Select "Weekly Groceries" template
2. Click on "Party Supplies" template

**Expected Results:**
- Previous selection (Weekly Groceries) is deselected
- Party Supplies becomes highlighted
- Preview updates to show Party Supplies items
- Only one template can be selected at a time

**Status:** ✅ Pass / ❌ Fail

---

#### 2.3 Preview Item Details
**Test Steps:**
1. Select "Baking Basics" template
2. Review preview items

**Expected Results:**
- Items show name (e.g., "All-Purpose Flour")
- Quantity is displayed (e.g., "x1")
- Category badge shows (e.g., "Pantry")
- Preview limited to 5 items
- Count shows "+ 10 more items"

**Status:** ✅ Pass / ❌ Fail

---

### 3. Template Search & Filtering

#### 3.1 Search by Template Name
**Test Steps:**
1. Open template selector
2. Type "breakfast" in search box

**Expected Results:**
- Only "Breakfast Essentials" template is shown
- Other templates are hidden
- Search input shows typed text
- Clear button (X) appears in search box

**Status:** ✅ Pass / ❌ Fail

---

#### 3.2 Search by Description
**Test Steps:**
1. Open template selector
2. Type "outdoor" in search box

**Expected Results:**
- "Camping Trip" template appears (description includes "outdoor adventure")
- Other templates are hidden

**Status:** ✅ Pass / ❌ Fail

---

#### 3.3 Search by Item Name
**Test Steps:**
1. Open template selector
2. Type "marshmallows" in search box

**Expected Results:**
- "Camping Trip" template appears (contains marshmallows item)
- Other templates are hidden

**Status:** ✅ Pass / ❌ Fail

---

#### 3.4 Clear Search
**Test Steps:**
1. Type "breakfast" in search box
2. Click the X button in search input

**Expected Results:**
- Search input is cleared
- All 9 templates are visible again
- Selected template (if any) remains selected

**Status:** ✅ Pass / ❌ Fail

---

#### 3.5 No Results Found
**Test Steps:**
1. Type "xyz123notfound" in search box

**Expected Results:**
- No templates are shown
- Message displays: "No templates found matching 'xyz123notfound'"
- "Clear Search" button is displayed
- Clicking "Clear Search" clears the search

**Status:** ✅ Pass / ❌ Fail

---

#### 3.6 Case Insensitive Search
**Test Steps:**
1. Try searching "BREAKFAST", "breakfast", "BrEaKfAsT"

**Expected Results:**
- All variations return "Breakfast Essentials" template
- Search is case-insensitive

**Status:** ✅ Pass / ❌ Fail

---

### 4. Creating List from Template

#### 4.1 Create List - Basic Flow
**Test Steps:**
1. Open template selector
2. Select "Weekly Groceries" template
3. Click "Use This Template" button
4. Wait for list creation

**Expected Results:**
- Modal closes after clicking button
- New list is created with name "Weekly Groceries"
- List contains all 16 items from template
- Items have correct names, quantities, categories
- Notes are preserved (e.g., "Baby carrots" for Carrots)
- User is switched to the new list
- Items appear in the grocery list view

**Status:** ✅ Pass / ❌ Fail

---

#### 4.2 Verify Template Items - Quick Dinner
**Test Steps:**
1. Create list from "Quick Dinner" template
2. Verify all items are present

**Expected Items (15 total):**
- [ ] Pasta (2) - Pantry
- [ ] Pasta Sauce (2) - Pantry
- [ ] Ground Beef (1) - Meat
- [ ] Chicken Breast (2) - Meat
- [ ] Rice (1) - Pantry
- [ ] Canned Beans (2) - Pantry
- [ ] Tortillas (1) - Bakery
- [ ] Shredded Cheese (1) - Dairy
- [ ] Salsa (1) - Pantry
- [ ] Frozen Vegetables (2) - Frozen
- [ ] Garlic (1) - Produce
- [ ] Onions (2) - Produce
- [ ] Soy Sauce (1) - Pantry
- [ ] Olive Oil (1) - Pantry
- [ ] Spices (1) - Pantry

**Status:** ✅ Pass / ❌ Fail

---

#### 4.3 Verify Template Items - Coffee & Tea Station
**Test Steps:**
1. Create list from "Coffee & Tea Station" template
2. Verify all items are present

**Expected Items (13 total):**
- [ ] Coffee Beans (2) - Beverages
- [ ] Tea Bags (2) - Beverages
- [ ] Milk (1) - Dairy
- [ ] Half and Half (1) - Dairy
- [ ] Almond Milk (1) - Beverages
- [ ] Sugar (1) - Pantry
- [ ] Honey (1) - Pantry
- [ ] Cinnamon (1) - Pantry
- [ ] Vanilla Syrup (1) - Pantry
- [ ] Cocoa Powder (1) - Pantry
- [ ] Whipped Cream (1) - Dairy
- [ ] Coffee Filters (1) - Other
- [ ] Biscotti (1) - Bakery

**Status:** ✅ Pass / ❌ Fail

---

#### 4.4 Verify Template Items - Camping Trip
**Test Steps:**
1. Create list from "Camping Trip" template
2. Verify all items are present and in correct categories

**Expected Items (21 total):**
- [ ] Hot Dogs (2) - Meat
- [ ] Hamburger Patties (2) - Meat
- [ ] Buns (2) - Bakery
- [ ] Marshmallows (2) - Pantry - Note: "For s'mores"
- [ ] Graham Crackers (1) - Pantry
- [ ] Chocolate Bars (4) - Pantry - Note: "Hershey's for s'mores"
- [ ] Trail Mix (2) - Pantry
- [ ] Granola Bars (2) - Pantry
- [ ] Bottled Water (12) - Beverages
- [ ] Juice Boxes (12) - Beverages
- [ ] Coffee (1) - Beverages
- [ ] Eggs (12) - Dairy
- [ ] Bacon (1) - Meat
- [ ] Bread (1) - Bakery
- [ ] Peanut Butter (1) - Pantry
- [ ] Jelly (1) - Pantry
- [ ] Chips (2) - Pantry
- [ ] Condiments (1) - Pantry
- [ ] Paper Plates (1) - Other
- [ ] Plastic Utensils (1) - Other
- [ ] Ice (2) - Frozen

**Status:** ✅ Pass / ❌ Fail

---

#### 4.5 Template Icon Preserved
**Test Steps:**
1. Create list from "BBQ Cookout" template (🍖)
2. Check list icon in list selector

**Expected Results:**
- New list shows BBQ icon (🍖)
- Icon is visible in list selector dropdown

**Status:** ✅ Pass / ❌ Fail

---

### 5. Post-Creation Editing

#### 5.1 Edit Template-Created Items
**Test Steps:**
1. Create list from any template
2. Edit an item (change name, quantity, or category)
3. Mark an item as gotten
4. Delete an item
5. Add a new item

**Expected Results:**
- All editing operations work normally
- Template-created lists are fully editable
- No restrictions on modifications
- Changes sync in real-time

**Status:** ✅ Pass / ❌ Fail

---

#### 5.2 Share Template-Created List
**Test Steps:**
1. Create list from template
2. Share list with another user
3. Have other user view/edit items

**Expected Results:**
- List can be shared like any other list
- Permission system works normally
- Other user sees all template items
- Collaboration features work

**Status:** ✅ Pass / ❌ Fail

---

### 6. UI/UX Testing

#### 6.1 Modal Interactions
**Test Steps:**
1. Open template selector
2. Click backdrop (outside modal)

**Expected Results:**
- Modal closes when clicking backdrop
- Changes are not saved

**Status:** ✅ Pass / ❌ Fail

---

#### 6.2 Cancel Button
**Test Steps:**
1. Open template selector
2. Select a template
3. Click "Cancel" button

**Expected Results:**
- Modal closes
- No list is created
- User returns to current list

**Status:** ✅ Pass / ❌ Fail

---

#### 6.3 Close Button (X)
**Test Steps:**
1. Open template selector
2. Click X button in header

**Expected Results:**
- Modal closes immediately
- No list is created

**Status:** ✅ Pass / ❌ Fail

---

#### 6.4 Disabled State
**Test Steps:**
1. Open template selector
2. Don't select any template
3. Try to click "Use This Template"

**Expected Results:**
- Button is disabled (grayed out)
- Button is not clickable
- Selecting a template enables the button

**Status:** ✅ Pass / ❌ Fail

---

### 7. Responsive Design

#### 7.1 Mobile View (< 480px)
**Test Steps:**
1. Resize browser to 400px width
2. Open template selector

**Expected Results:**
- Modal fills screen
- Templates display in single column
- Cards are properly sized
- Search box is full width
- Buttons stack vertically
- All content is readable

**Status:** ✅ Pass / ❌ Fail

---

#### 7.2 Tablet View (480px - 768px)
**Test Steps:**
1. Resize browser to 600px width
2. Open template selector

**Expected Results:**
- Templates display in single column or 2 columns
- Modal uses most of screen width
- Content remains readable
- Touch targets are adequate size

**Status:** ✅ Pass / ❌ Fail

---

#### 7.3 Desktop View (> 768px)
**Test Steps:**
1. View on desktop (1200px+ width)
2. Open template selector

**Expected Results:**
- Templates display in 3+ column grid
- Modal is centered with max-width
- Comfortable spacing and sizing
- Mouse hover effects work

**Status:** ✅ Pass / ❌ Fail

---

### 8. Error Handling

#### 8.1 Network Error During Creation
**Test Steps:**
1. Simulate network failure
2. Select template and click "Use This Template"

**Expected Results:**
- Error message is displayed
- User is notified of failure
- No partial list is created
- User can retry

**Status:** ✅ Pass / ❌ Fail

---

#### 8.2 Missing Template Data
**Test Steps:**
1. Create list when template has empty items array

**Expected Results:**
- Empty list is created (edge case)
- Or error is shown preventing creation
- App doesn't crash

**Status:** ✅ Pass / ❌ Fail

---

### 9. Performance Testing

#### 9.1 Template Load Time
**Test Steps:**
1. Open template selector
2. Measure time to display

**Expected Results:**
- Modal opens instantly (< 100ms)
- All 9 templates render immediately
- No loading spinner needed

**Status:** ✅ Pass / ❌ Fail

---

#### 9.2 Search Performance
**Test Steps:**
1. Type rapidly in search box
2. Try various search terms

**Expected Results:**
- Search results update quickly
- No lag or stuttering
- Filtering is instant

**Status:** ✅ Pass / ❌ Fail

---

#### 9.3 Large Template Creation
**Test Steps:**
1. Create "Camping Trip" template (21 items)
2. Measure creation time

**Expected Results:**
- List creates in < 2 seconds
- All items appear in list
- UI remains responsive

**Status:** ✅ Pass / ❌ Fail

---

### 10. Accessibility Testing

#### 10.1 Keyboard Navigation
**Test Steps:**
1. Open template selector
2. Use Tab key to navigate
3. Use Enter to select template
4. Use Escape to close

**Expected Results:**
- Can tab through all interactive elements
- Focus indicators are visible
- Enter key confirms selection
- Escape key closes modal
- Focus is trapped within modal

**Status:** ✅ Pass / ❌ Fail

---

#### 10.2 Screen Reader Support
**Test Steps:**
1. Use screen reader
2. Navigate through template selector

**Expected Results:**
- Modal title is announced
- Template cards are accessible
- Search input has label
- Button states are announced
- Close button is accessible

**Status:** ✅ Pass / ❌ Fail

---

#### 10.3 ARIA Attributes
**Test Steps:**
1. Inspect modal HTML
2. Check ARIA attributes

**Expected Results:**
- Search input has aria-label
- Buttons have aria-label
- Modal has proper role
- Close button labeled properly

**Status:** ✅ Pass / ❌ Fail

---

## Future Enhancements to Test

### Custom Template Saving (Not Yet Implemented)

The following scenarios would test custom template saving if it gets implemented:

#### Save Current List as Template
**Test Steps:**
1. Create a list with custom items
2. Click "Save as Template" option
3. Enter template name and description
4. Save custom template

**Expected Results:**
- Custom template appears in template selector
- Template includes all items from list
- Can create new lists from custom template

**Status:** ⏸️ Not Implemented

---

#### Edit Custom Template
**Test Steps:**
1. Open custom template
2. Edit template items or metadata
3. Save changes

**Expected Results:**
- Changes are saved
- Future lists use updated template

**Status:** ⏸️ Not Implemented

---

#### Delete Custom Template
**Test Steps:**
1. Select custom template
2. Click delete option
3. Confirm deletion

**Expected Results:**
- Template is removed from list
- Built-in templates cannot be deleted

**Status:** ⏸️ Not Implemented

---

## Test Execution Summary

**Tester:** _______________
**Date:** _______________
**Environment:** _______________
**Browser:** _______________

**Overall Status:**
- Total Tests: 40+
- Passed: _____
- Failed: _____
- Blocked: _____
- Not Implemented: 3

**Critical Issues Found:**
1. _____________________
2. _____________________
3. _____________________

**Notes:**
_________________________________
_________________________________
_________________________________

## Automated Test Recommendations

Consider implementing automated tests for:

1. **Unit Tests:**
   - Template filtering logic
   - Search algorithm
   - Template data validation

2. **Integration Tests:**
   - Template to list creation flow
   - Item creation from template items
   - List switching after template creation

3. **E2E Tests:**
   - Full template selection and creation flow
   - Search and filter functionality
   - Mobile responsiveness

## Code Coverage

Target coverage areas:
- `src/data/listTemplates.ts` - 100%
- `src/components/TemplateSelector.tsx` - 90%+
- `src/components/TemplateSelector.css` - Visual regression tests
- `src/zero-store.ts` (createListFromTemplate) - 100%
