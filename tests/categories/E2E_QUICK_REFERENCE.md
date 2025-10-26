# Custom Categories E2E Testing - Quick Reference Card

**Quick cheat sheet for running E2E tests on custom categories.**

## Before You Start (5 minutes)

### 1. Start Services
```bash
# Terminal 1 - Database
docker compose up -d postgres

# Terminal 2 - Zero Sync
pnpm zero:dev

# Terminal 3 - API Server
cd server && pnpm dev

# Terminal 4 - Frontend
pnpm dev
```

### 2. Verify Services Running
```bash
curl http://localhost:3001/health  # ✓ API
curl http://localhost:4848/health  # ✓ Zero
curl http://localhost:5173         # ✓ Frontend
```

### 3. Create Test Users

| User | Email | Password |
|------|-------|----------|
| User A | category-test-a@e2etest.com | TestPass123! |
| User B | category-test-b@e2etest.com | TestPass123! |

### 4. Clean Database
```sql
DELETE FROM custom_categories
WHERE list_id IN (SELECT id FROM lists WHERE name LIKE '%Category Test%');
```

### 5. Open Two Browsers
- Browser A: User A (Owner)
- Browser B: User B (Editor)

---

## 6 Core Test Scenarios (40 minutes)

### ✅ Scenario 1: Create Category (7 min)
```
1. Login as User A
2. Create list: "Category Test List"
3. Open "Manage Categories"
4. Add category:
   - Name: "Snacks"
   - Color: Orange (#FF9800)
   - Icon: 🍿
5. ✓ Category appears in list
```

### ✅ Scenario 2: Use Category with Item (7 min)
```
1. Add item:
   - Name: "Potato Chips"
   - Quantity: 2
   - Category: "Snacks"
2. Add item:
   - Name: "Pretzels"
   - Quantity: 1
   - Category: "Snacks"
3. ✓ Items show "Snacks" badge with 🍿
```

### ✅ Scenario 3: Filter by Category (5 min)
```
1. Open category filter
2. Select "Snacks"
3. ✓ Only 2 Snacks items shown
4. Clear filter
5. ✓ All items return
```

### ✅ Scenario 4: Edit Category (8 min)
```
1. Open "Manage Categories"
2. Edit "Snacks":
   - Name: "Snacks & Treats"
   - Color: Blue (#2196F3)
   - Icon: 🍪
3. ✓ Category updated in manager
4. ✓ Items show new name/icon/color
5. ✓ Dropdown shows new name
```

### ✅ Scenario 5: Delete Category (8 min)
```
1. Open "Manage Categories"
2. Delete "Snacks & Treats"
3. Confirm deletion
4. ✓ Category removed
5. ✓ Items moved to "Other" category
6. ✓ No orphaned items
```

### ✅ Scenario 6: Real-Time Sync (12 min)
```
Setup:
- Browser A: User A logged in
- Browser B: User B logged in
- Share list with User B as Editor

Test:
1. Browser A: Create category "Frozen Foods" ❄️
   → Browser B: Sees new category (1-3s)

2. Browser B: Add item "Ice Cream" with "Frozen Foods"
   → Browser A: Sees new item (1-3s)

3. Browser B: Edit category to "Frozen & Cold" 🧊
   → Browser A: Sees updated name/icon (1-3s)

4. Browser A: Delete category
   → Browser B: Category removed, item → "Other" (1-3s)
```

---

## Quick Verification Queries

### Check Categories
```sql
SELECT id, name, color, icon
FROM custom_categories
WHERE list_id = (SELECT id FROM lists WHERE name = 'Category Test List');
```

### Check Items with Categories
```sql
SELECT gi.name, gi.category, cc.name as custom_cat
FROM grocery_items gi
LEFT JOIN custom_categories cc ON gi.custom_category_id = cc.id
WHERE gi.list_id = (SELECT id FROM lists WHERE name = 'Category Test List');
```

### Check for Orphans
```sql
SELECT gi.name, gi.custom_category_id
FROM grocery_items gi
WHERE gi.custom_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_categories cc
    WHERE cc.id = gi.custom_category_id
  );
-- Should return 0 rows
```

---

## Console Debugging

```javascript
// Check categories in DOM
document.querySelectorAll('.custom-category-item').length

// Check item categories
Array.from(document.querySelectorAll('.category-badge'))
  .map(el => el.textContent.trim())

// Check WebSocket connection
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('4848'))
```

---

## Common Issues

### Sync Not Working
```bash
# Restart Zero sync
pkill -f zero-cache
pnpm zero:dev

# Clear browser cache
indexedDB.deleteDatabase('zero-cache');
location.reload();
```

### Categories Not Appearing
```javascript
// Hard refresh
Ctrl+Shift+R  (Windows/Linux)
Cmd+Shift+R   (Mac)
```

### Permission Errors
```sql
-- Check user permission
SELECT u.email, lm.permission_level
FROM list_members lm
JOIN users u ON lm.user_id = u.id
WHERE lm.list_id = (SELECT id FROM lists WHERE name = 'Category Test List');
```

---

## Test Result Template

```
# E2E Test Results - YYYY-MM-DD

Environment: Local
Tester: [Name]
Duration: XX minutes

Scenario 1: Create Category         [ PASS / FAIL ]
Scenario 2: Use Category with Item  [ PASS / FAIL ]
Scenario 3: Filter by Category      [ PASS / FAIL ]
Scenario 4: Edit Category           [ PASS / FAIL ]
Scenario 5: Delete Category         [ PASS / FAIL ]
Scenario 6: Real-Time Sync          [ PASS / FAIL ]

Issues Found:
- [Issue description]

Notes:
- [Any observations]
```

---

## Success Criteria

All scenarios should:
- ✓ Complete without errors
- ✓ Show success messages
- ✓ Update UI immediately
- ✓ Sync within 1-3 seconds
- ✓ Maintain data integrity
- ✓ Pass database verification

---

## Time Estimates

| Task | Time |
|------|------|
| Setup | 5 min |
| Scenario 1 | 7 min |
| Scenario 2 | 7 min |
| Scenario 3 | 5 min |
| Scenario 4 | 8 min |
| Scenario 5 | 8 min |
| Scenario 6 | 12 min |
| **Total** | **~50 min** |

---

## Full Documentation

For detailed step-by-step instructions, see:
- **[Full E2E Test Plan](../../docs/CUSTOM_CATEGORIES_E2E_TESTS.md)** (47 KB, 1518 lines)
- **[E2E Test Reference](./E2E_TEST_REFERENCE.md)** (10 KB, 367 lines)

---

**Quick Links**:
- [Full E2E Test Plan →](../../docs/CUSTOM_CATEGORIES_E2E_TESTS.md)
- [E2E Test Reference →](./E2E_TEST_REFERENCE.md)
- [Unit Tests README →](./README.md)
- [Custom Categories Guide →](../../docs/CUSTOM_CATEGORIES.md)
