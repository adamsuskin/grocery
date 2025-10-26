# Custom Categories Tests

Comprehensive unit tests for the custom category functionality in the grocery list application.

## Test Files

### 1. `useCustomCategories.test.ts`
Tests the React hooks for managing custom categories:
- **Query Hook Tests**: `useCustomCategories`
  - Querying categories by list ID
  - Data transformation from database to application format
  - Sorting by creation date
  - Handling optional fields

- **Mutation Hook Tests**: `useCustomCategoryMutations`
  - Creating categories with validation
  - Updating categories (name, color, icon)
  - Deleting categories
  - Permission checks (owner, editor, viewer)
  - Error handling and edge cases

### 2. `categoryUtils.test.ts`
Tests utility functions for category management:
- **Validation Functions**:
  - `isValidCategory()` - Checking if a category exists
  - `getCategoryOrFallback()` - Fallback to 'Other' for deleted categories
  - `validateCategoryName()` - Name validation with duplicate detection

- **Category Combination**:
  - `getAllCategories()` - Combining predefined and custom categories
  - Alphabetical sorting of custom categories

- **Database Operations**:
  - `updateItemCategoriesOnDelete()` - Moving items to 'Other' on delete
  - `getItemCountByCategory()` - Counting items using a category
  - `migrateCategoryItems()` - Moving items between categories

### 3. `categoryValidation.test.ts`
Tests validation logic for custom category fields:
- **Name Validation**:
  - Empty string detection
  - Length constraints (1-100 characters)
  - Predefined category conflicts (case-insensitive)
  - Duplicate detection (case-insensitive)
  - Special character handling
  - Whitespace trimming

- **Color Validation**:
  - Hex format validation (#RRGGBB, #RGB)
  - Case-insensitive hex codes
  - Optional field handling
  - Invalid format rejection

- **Icon Validation**:
  - Length constraints (1-10 characters)
  - Emoji support
  - Optional field handling

- **Combined Validation**:
  - `validateCategoryFields()` - Validates all fields together
  - Field-specific error messages

- **Helper Functions**:
  - `normalizeCategoryName()` - Lowercase and trim
  - `isPredefinedCategory()` - Check if name is predefined
  - `getValidationErrorMessage()` - User-friendly error messages

### 4. `CustomCategoryManager.test.tsx`
Tests the React component for managing categories:
- **Rendering**:
  - Displaying predefined categories
  - Displaying custom categories with colors/icons
  - Empty state when no categories
  - Form elements

- **Adding Categories**:
  - Form submission with validation
  - Success messages
  - Error handling
  - Form clearing after success
  - Loading states

- **Editing Categories**:
  - Entering/exiting edit mode
  - Updating name, color, and icon
  - Validation during edit
  - Success/error messages

- **Deleting Categories**:
  - Confirmation dialog
  - Deletion with permission checks
  - Warning about items using category
  - Loading states

- **Modal Interactions**:
  - Close button
  - Overlay click
  - Escape key handling
  - Preventing close during operations

## Running Tests

### Install Dependencies (if needed)

The tests require the following dependencies:
```bash
npm install --save-dev vitest @vitest/ui
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install --save-dev jsdom
```

### Run All Category Tests
```bash
npx vitest tests/categories
```

### Run Specific Test File
```bash
# Hook tests
npx vitest tests/categories/useCustomCategories.test.ts

# Utility tests
npx vitest tests/categories/categoryUtils.test.ts

# Validation tests
npx vitest tests/categories/categoryValidation.test.ts

# Component tests
npx vitest tests/categories/CustomCategoryManager.test.tsx
```

### Run Tests in Watch Mode
```bash
npx vitest tests/categories --watch
```

### Run Tests with Coverage
```bash
npx vitest tests/categories --coverage
```

### Run Tests in UI Mode
```bash
npx vitest tests/categories --ui
```

## Test Coverage

The test suite covers:

### Functional Coverage
- ✅ Creating custom categories
- ✅ Updating custom categories
- ✅ Deleting custom categories
- ✅ Duplicate name detection (case-insensitive)
- ✅ Validation (name, color, icon)
- ✅ Permission checks (owner, editor, viewer)
- ✅ Combining predefined and custom categories
- ✅ Fallback behavior for deleted categories
- ✅ Item category updates on delete
- ✅ Category migration between categories

### Edge Cases
- ✅ Empty strings and whitespace
- ✅ Maximum length validation
- ✅ Special characters in names
- ✅ Invalid color formats
- ✅ Invalid icon formats
- ✅ Non-existent categories
- ✅ Unauthenticated users
- ✅ Missing permissions
- ✅ Database errors
- ✅ Network failures
- ✅ Concurrent operations

### User Interactions
- ✅ Form submission
- ✅ Button clicks
- ✅ Input typing
- ✅ Modal interactions
- ✅ Keyboard navigation (Escape key)
- ✅ Loading states
- ✅ Success/error messages
- ✅ Auto-hiding messages

## Test Structure

Each test file follows this structure:

```typescript
// 1. Imports
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 2. Mocks
const mockZero = { ... };
vi.mock('../../src/zero-store', () => ({ ... }));

// 3. Test Data
const mockCategories = [ ... ];

// 4. Test Suites
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Mock Strategy

### Zero Database Mocking
- Mock `getZeroInstance()` to return a fake Zero instance
- Mock query methods (`where`, `run`)
- Mock mutation methods (`create`, `update`, `delete`)
- Return realistic data structures

### React Hook Mocking
- Mock `useQuery` from `@rocicorp/zero/react`
- Return test data that matches expected format
- Support different scenarios (empty, single, multiple items)

### Component Mocking
- Mock custom category hooks
- Mock mutation functions
- Return promises for async operations
- Support success and error scenarios

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Clear Names**: Test names describe what is being tested
3. **AAA Pattern**: Arrange, Act, Assert structure
4. **Mock Reset**: Clear mocks between tests
5. **Async Handling**: Use `waitFor` for async operations
6. **User Events**: Use `@testing-library/user-event` for realistic interactions
7. **Accessibility**: Query by role and label when possible
8. **Coverage**: Test happy paths, error paths, and edge cases

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
```bash
# Solution: Ensure all dependencies are installed
npm install
```

**Issue**: Tests timeout
```bash
# Solution: Increase timeout in vitest.config.ts
testTimeout: 10000
```

**Issue**: Mock not working
```bash
# Solution: Ensure mock is called before importing the module
vi.mock('module-path', () => ({ ... }));
// Import must come after vi.mock
import { function } from 'module-path';
```

**Issue**: Async tests failing
```bash
# Solution: Use waitFor for async assertions
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

## Integration with CI/CD

Add to your CI pipeline:
```yaml
# .github/workflows/test.yml
- name: Run Category Tests
  run: npx vitest tests/categories --run
```

## Future Enhancements

Potential additions to the test suite:
- [ ] Integration tests with real Zero database
- [ ] E2E tests with Playwright/Cypress
- [ ] Performance tests for large category lists
- [ ] Accessibility tests with axe-core
- [ ] Visual regression tests
- [ ] Load testing for concurrent users

## Contributing

When adding new category features:
1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add tests for new functionality
4. Update this README with new test scenarios
5. Maintain minimum 85% code coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mock Service Worker (MSW)](https://mswjs.io/) - For API mocking if needed
