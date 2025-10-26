# Custom Categories E2E Testing Reference

This document provides a quick reference for end-to-end testing of custom categories functionality.

## E2E Test Documentation

**Full E2E Test Plan**: [/home/adam/grocery/docs/CUSTOM_CATEGORIES_E2E_TESTS.md](/home/adam/grocery/docs/CUSTOM_CATEGORIES_E2E_TESTS.md)

The comprehensive E2E test plan includes:
- Detailed step-by-step test procedures
- 6 core test scenarios + 6 advanced scenarios
- Test data and verification checkpoints
- Troubleshooting guides
- Real-time synchronization tests

## Quick Start

### What is E2E Testing?

End-to-end testing validates the entire user workflow from start to finish, testing the complete system (frontend, backend, database, real-time sync) as a user would experience it.

**Why Manual E2E Tests?**
Currently, the project uses Vitest for unit and integration tests. Manual E2E tests provide:
- Complete user journey validation
- Real browser interaction testing
- Multi-user collaboration testing
- Real-time sync verification across sessions

**Future**: Consider implementing automated E2E tests with Playwright or Cypress.

### Prerequisites for Running E2E Tests

1. **All services running**:
   ```bash
   docker compose up -d postgres    # Database
   pnpm zero:dev                    # Zero sync (Terminal 1)
   cd server && pnpm dev            # API server (Terminal 2)
   pnpm dev                         # Frontend (Terminal 3)
   ```

2. **Two test users created**:
   - User A: category-test-a@e2etest.com
   - User B: category-test-b@e2etest.com

3. **Multiple browser sessions**:
   - Two Chrome profiles, OR
   - Different browsers, OR
   - Regular + Incognito windows

4. **Clean test data**:
   ```sql
   -- Run before testing
   DELETE FROM custom_categories WHERE list_id IN (
     SELECT id FROM lists WHERE name LIKE '%Category Test%'
   );
   ```

## Core E2E Test Scenarios

### Priority P0 (Must Pass Before Release)

#### 1. Create Custom Category
**Duration**: 5-7 minutes
- Open category manager
- Fill in name, color, icon
- Submit form
- Verify category appears in list
- Verify category saved to database

#### 2. Use Custom Category When Adding Item
**Duration**: 5-7 minutes
- Open add item form
- Verify custom category in dropdown
- Select custom category
- Add item
- Verify item has correct category badge

#### 3. Filter by Custom Category
**Duration**: 4-5 minutes
- Open filter menu
- Select custom category
- Verify only matching items shown
- Clear filter
- Verify all items return

#### 4. Edit Custom Category
**Duration**: 6-8 minutes
- Open category manager
- Click edit on category
- Change name, color, icon
- Save changes
- Verify updates applied everywhere (manager, items, dropdowns)

#### 5. Delete Custom Category
**Duration**: 6-8 minutes
- Open category manager
- Click delete on category
- Confirm deletion
- Verify category removed
- Verify items reassigned to 'Other'

#### 6. Real-Time Sync (Multi-User)
**Duration**: 10-12 minutes
- User A creates category → User B sees it
- User B creates item with category → User A sees it
- User B edits category → User A sees updates
- User A deletes category → User B sees removal and item reassignment

## Test Relationship to Unit Tests

### Unit Tests (Vitest)
- **Location**: `/home/adam/grocery/tests/categories/`
- **Coverage**: Functions, hooks, components in isolation
- **Run**: `npx vitest tests/categories`
- **Purpose**: Fast feedback, code coverage, regression detection

**Unit test files**:
- `useCustomCategories.test.ts` - Hook logic
- `categoryUtils.test.ts` - Utility functions
- `categoryValidation.test.ts` - Validation rules
- `CustomCategoryManager.test.tsx` - Component behavior

### E2E Tests (Manual)
- **Location**: `/home/adam/grocery/docs/CUSTOM_CATEGORIES_E2E_TESTS.md`
- **Coverage**: Complete user workflows end-to-end
- **Run**: Manual execution following test plan
- **Purpose**: Validate real user experience, integration, sync

**E2E test scenarios**:
- Complete user journeys (create → use → edit → delete)
- Real-time synchronization across users
- Permission enforcement
- Data integrity across system

### Testing Pyramid

```
        /\
       /  \    E2E Tests (Manual)
      /____\   - 12 scenarios
     /      \  - Full system integration
    /________\ - User journey validation

    /--------\ Integration Tests
   /----------\ - API + Database
  /------------\ - Component + Hooks

  /------------\ Unit Tests (Vitest)
 /--------------\ - ~182 tests
/----------------\ - Functions, utils, components
```

## Running Different Test Types

### Unit Tests (Fast - Minutes)
```bash
# Run all category unit tests
npx vitest tests/categories

# Run specific test file
npx vitest tests/categories/useCustomCategories.test.ts

# Run with coverage
npx vitest tests/categories --coverage

# Watch mode for development
npx vitest tests/categories --watch
```

### E2E Tests (Slow - Hour)
```bash
# 1. Start all services
docker compose up -d && pnpm zero:dev & cd server && pnpm dev & pnpm dev

# 2. Follow manual test plan
# See: /home/adam/grocery/docs/CUSTOM_CATEGORIES_E2E_TESTS.md

# 3. Record results in test results template
```

## When to Run Each Test Type

### During Development
- **Unit tests**: After every code change (watch mode)
- **E2E tests**: Not needed for every change

### Before Committing
- **Unit tests**: All must pass
- **E2E tests**: Quick smoke test (Scenarios 1-3) if touching category code

### Before Pull Request
- **Unit tests**: All must pass with coverage > 85%
- **E2E tests**: Core scenarios (1-6) should pass

### Before Release
- **Unit tests**: All must pass
- **E2E tests**: All scenarios (1-12) must pass

### After Bug Report
- **Unit tests**: Add test to reproduce bug
- **E2E tests**: Verify bug in full context

## Common E2E Test Patterns

### Pattern 1: Create → Verify Flow
```
1. Perform action (create category)
2. Visual verification (see in UI)
3. Console verification (check DOM)
4. Database verification (query DB)
```

### Pattern 2: Multi-User Sync Flow
```
1. Browser A: Perform action
2. Browser A: Verify locally
3. Wait 1-3 seconds for sync
4. Browser B: Verify synced data
```

### Pattern 3: Edit → Check Propagation
```
1. Edit entity (category)
2. Check entity view (manager)
3. Check related views (items)
4. Check dropdowns (selectors)
5. Check filters (category filters)
```

## E2E Test Checklist

Before starting E2E tests:
- [ ] All services running and healthy
- [ ] Database in clean state
- [ ] Test users created
- [ ] Multiple browsers ready
- [ ] DevTools open for debugging

During E2E tests:
- [ ] Follow test steps exactly
- [ ] Mark pass/fail for each step
- [ ] Take screenshots of failures
- [ ] Run verification queries
- [ ] Monitor sync timing

After E2E tests:
- [ ] Document results
- [ ] File bugs for failures
- [ ] Clean up test data
- [ ] Update test plan if needed

## Quick Troubleshooting

### Sync not working?
```bash
# Check WebSocket connection
curl http://localhost:4848/health

# Restart Zero sync
pkill -f zero-cache
pnpm zero:dev
```

### Categories not appearing?
```sql
-- Check database
SELECT * FROM custom_categories
WHERE list_id = 'your-list-id';

-- Clear browser cache
indexedDB.deleteDatabase('zero-cache');
location.reload();
```

### Permission errors?
```sql
-- Check user permissions
SELECT u.email, lm.permission_level
FROM list_members lm
JOIN users u ON lm.user_id = u.id
WHERE lm.list_id = 'your-list-id';
```

## Future Automation

### Candidate Scenarios for Playwright/Cypress

**High Priority**:
1. Create category (happy path)
2. Edit category (happy path)
3. Delete category (happy path)
4. Validation errors (duplicate, empty name)

**Medium Priority**:
5. Real-time sync (basic)
6. Permission enforcement
7. Filter by category

**Lower Priority**:
8. Bulk operations
9. Special characters
10. Performance tests

### Setup for Automation

If implementing automated E2E tests:

1. **Install Playwright**:
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Create test file**:
   ```typescript
   // tests/e2e/custom-categories.spec.ts
   import { test, expect } from '@playwright/test';

   test('create custom category', async ({ page }) => {
     await page.goto('http://localhost:5173');
     await page.click('[data-testid="manage-categories"]');
     await page.fill('[data-testid="category-name"]', 'Snacks');
     await page.click('[data-testid="add-category"]');
     await expect(page.locator('text=Snacks')).toBeVisible();
   });
   ```

3. **Add data-testid attributes** to components for reliable selection

4. **Setup test database** seeding and teardown

5. **Add to CI/CD** pipeline

## Resources

### Documentation
- [E2E Test Plan (Full)](/home/adam/grocery/docs/CUSTOM_CATEGORIES_E2E_TESTS.md)
- [Unit Tests README](./README.md)
- [Test Scenarios](./TEST_SCENARIOS.md)
- [Quick Start Guide](./QUICK_START.md)
- [Custom Categories Guide](/home/adam/grocery/docs/CUSTOM_CATEGORIES.md)

### Testing Tools
- [Vitest](https://vitest.dev/) - Current unit test framework
- [Playwright](https://playwright.dev/) - Recommended for automation
- [Cypress](https://www.cypress.io/) - Alternative E2E framework
- [Testing Library](https://testing-library.com/) - Used in unit tests

### Learning Resources
- [Testing Trophy Model](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [E2E Testing Best Practices](https://testautomationu.applitools.com/)
- [Zero Sync Testing Patterns](https://zero.rocicorp.dev/docs/testing)

## Contact

For questions about E2E testing:
- Check the [full E2E test plan](/home/adam/grocery/docs/CUSTOM_CATEGORIES_E2E_TESTS.md)
- Review [troubleshooting section](#quick-troubleshooting)
- File an issue in the project repository
- Contact the QA team

---

**Quick Links**:
- [Full E2E Test Plan →](/home/adam/grocery/docs/CUSTOM_CATEGORIES_E2E_TESTS.md)
- [Unit Tests README →](./README.md)
- [Custom Categories Docs →](/home/adam/grocery/docs/CUSTOM_CATEGORIES.md)
