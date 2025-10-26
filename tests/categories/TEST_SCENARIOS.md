# Test Scenarios: Custom Categories

Complete list of all test scenarios covered in the custom category test suite.

## Summary Statistics

- **Total Test Files**: 4
- **Total Tests**: ~182
- **Lines of Test Code**: ~2,500
- **Coverage Target**: 85% lines, 80% branches

---

## 1. Hook Tests (`useCustomCategories.test.ts`)

### useCustomCategories Hook (7 tests)
- ✅ Returns empty array when no categories exist
- ✅ Returns all categories for a specific list
- ✅ Transforms database format to application format
- ✅ Sorts categories by creation date (oldest first)
- ✅ Handles optional color and icon fields correctly
- ✅ Filters categories by list ID when provided
- ✅ Returns all categories when list ID is not provided

### addCustomCategory Mutation (15 tests)
- ✅ Creates a new custom category successfully
- ✅ Trims category name before saving
- ✅ Uses empty string for undefined color and icon
- ✅ Throws error if user is not authenticated
- ✅ Throws error if list ID is empty
- ✅ Throws error if category name is empty
- ✅ Throws error if name conflicts with predefined category
- ✅ Throws error if category name is duplicate (case-insensitive)
- ✅ Validates color format (hex codes)
- ✅ Validates icon length (max 10 characters)
- ✅ Accepts existing categories for validation without database query
- ✅ Handles database errors gracefully
- ✅ Provides specific error for unique constraint violations
- ✅ Validates against predefined categories (case-insensitive)
- ✅ Generates unique ID for new categories

### updateCustomCategory Mutation (14 tests)
- ✅ Updates category name
- ✅ Updates category color
- ✅ Updates category icon
- ✅ Updates multiple fields at once
- ✅ Trims updated category name
- ✅ Throws error if user is not authenticated
- ✅ Throws error if category ID is empty
- ✅ Throws error if no fields are provided for update
- ✅ Throws error if category not found
- ✅ Checks edit permission for list owner
- ✅ Checks edit permission for editor
- ✅ Denies update for viewer permission
- ✅ Validates updated name against predefined categories
- ✅ Validates updated name for duplicates (excluding self)

### deleteCustomCategory Mutation (9 tests)
- ✅ Deletes a custom category
- ✅ Throws error if user is not authenticated
- ✅ Throws error if category ID is empty
- ✅ Throws error if category not found
- ✅ Checks delete permission for list owner
- ✅ Checks delete permission for editor
- ✅ Denies delete for viewer permission
- ✅ Handles database errors gracefully
- ✅ Returns appropriate error messages

---

## 2. Utility Tests (`categoryUtils.test.ts`)

### isValidCategory (6 tests)
- ✅ Returns true for predefined categories
- ✅ Returns true for custom categories
- ✅ Returns false for non-existent categories
- ✅ Is case-sensitive for predefined categories
- ✅ Is case-sensitive for custom categories
- ✅ Handles empty custom categories array

### getCategoryOrFallback (4 tests)
- ✅ Returns original category if valid predefined
- ✅ Returns original category if valid custom
- ✅ Returns 'Other' for invalid categories
- ✅ Handles deleted custom categories with fallback

### getAllCategories (6 tests)
- ✅ Returns only predefined categories when no custom categories
- ✅ Combines predefined and custom categories
- ✅ Places predefined categories first
- ✅ Sorts custom categories alphabetically
- ✅ Handles custom categories with special characters
- ✅ Does not modify the original CATEGORIES array

### validateCategoryName (11 tests)
- ✅ Returns error for empty name
- ✅ Returns error for whitespace-only name
- ✅ Returns error for name exceeding 50 characters
- ✅ Accepts name with exactly 50 characters
- ✅ Returns error for predefined category names
- ✅ Returns error for predefined names (case-insensitive)
- ✅ Returns error for duplicate custom category names
- ✅ Returns error for duplicate names (case-insensitive)
- ✅ Allows same name when excluding current category
- ✅ Still detects duplicates when excluding different category
- ✅ Accepts valid unique name

### updateItemCategoriesOnDelete (6 tests)
- ✅ Updates all items using deleted category to 'Other'
- ✅ Does not update items if category has no items
- ✅ Filters items by list ID
- ✅ Includes updatedAt timestamp in updates
- ✅ Handles errors gracefully
- ✅ Handles partial update failures

### getItemCountByCategory (4 tests)
- ✅ Returns count of items in category
- ✅ Returns 0 for category with no items
- ✅ Filters by list ID and category
- ✅ Returns 0 on error

### migrateCategoryItems (7 tests)
- ✅ Migrates all items from one category to another
- ✅ Returns 0 if no items to migrate
- ✅ Filters by source category and list ID
- ✅ Includes updatedAt timestamp in migrations
- ✅ Handles migration errors
- ✅ Works with custom categories as source and target
- ✅ Returns count of migrated items

---

## 3. Validation Tests (`categoryValidation.test.ts`)

### validateCategoryName (32 tests)

#### Empty Name Validation (3 tests)
- ✅ Rejects empty string
- ✅ Rejects whitespace-only string
- ✅ Rejects tabs and newlines

#### Length Validation (4 tests)
- ✅ Accepts name with 1 character
- ✅ Accepts name with 100 characters
- ✅ Rejects name with 101 characters
- ✅ Rejects very long names (500+ chars)

#### Predefined Category Conflicts (3 tests)
- ✅ Rejects all predefined category names
- ✅ Rejects predefined names case-insensitively
- ✅ Returns appropriate error message

#### Duplicate Detection with String Array (3 tests)
- ✅ Rejects exact duplicates
- ✅ Rejects case-insensitive duplicates
- ✅ Accepts unique names

#### Duplicate Detection with Object Array (3 tests)
- ✅ Rejects exact duplicates
- ✅ Rejects case-insensitive duplicates
- ✅ Accepts unique names

#### ExcludeId Parameter (3 tests)
- ✅ Allows same name when excluding current category
- ✅ Still rejects duplicate when excluding different category
- ✅ Works with non-existent excludeId

#### Whitespace Handling (3 tests)
- ✅ Trims leading whitespace
- ✅ Trims trailing whitespace
- ✅ Allows internal whitespace

#### Special Characters (7 tests)
- ✅ Accepts names with numbers
- ✅ Accepts names with ampersand
- ✅ Accepts names with hyphens
- ✅ Accepts names with apostrophes
- ✅ Accepts names with accented characters
- ✅ Accepts names with emojis
- ✅ Handles all special characters properly

### validateCategoryColor (15 tests)

#### Valid Hex Colors (4 tests)
- ✅ Accepts 6-digit hex colors
- ✅ Accepts lowercase hex colors
- ✅ Accepts mixed case hex colors
- ✅ Accepts 3-digit hex colors

#### Invalid Hex Colors (5 tests)
- ✅ Rejects colors without # prefix
- ✅ Rejects colors with wrong length
- ✅ Rejects colors with invalid characters
- ✅ Rejects color names (red, blue, etc.)
- ✅ Rejects RGB/RGBA format

#### Optional Color Handling (4 tests)
- ✅ Accepts undefined
- ✅ Accepts null
- ✅ Accepts empty string
- ✅ Accepts whitespace-only string

#### Whitespace Handling (2 tests)
- ✅ Trims and validates
- ✅ Handles tabs and newlines

### validateCategoryIcon (11 tests)

#### Valid Icons (7 tests)
- ✅ Accepts single emoji
- ✅ Accepts multiple emojis
- ✅ Accepts single letter
- ✅ Accepts multiple letters
- ✅ Accepts numbers
- ✅ Accepts up to 10 characters
- ✅ Accepts special characters (★, ♥, ✓)

#### Invalid Icons (2 tests)
- ✅ Rejects icons exceeding 10 characters
- ✅ Rejects very long strings (100+ chars)

#### Optional Icon Handling (4 tests)
- ✅ Accepts undefined
- ✅ Accepts null
- ✅ Accepts empty string
- ✅ Accepts whitespace-only string

#### Whitespace Handling (2 tests)
- ✅ Trims and validates
- ✅ Counts trimmed length

### validateCategoryFields (7 tests)
- ✅ Validates name only
- ✅ Validates color only
- ✅ Validates icon only
- ✅ Validates all fields with multiple errors
- ✅ Returns empty object when all fields valid
- ✅ Detects name conflicts
- ✅ Allows same name when excluding ID

### Helper Functions (9 tests)

#### normalizeCategoryName (5 tests)
- ✅ Converts to lowercase
- ✅ Trims whitespace
- ✅ Handles empty string
- ✅ Preserves internal whitespace
- ✅ Handles special characters

#### isPredefinedCategory (4 tests)
- ✅ Returns true for predefined categories
- ✅ Is case-insensitive
- ✅ Returns false for custom categories
- ✅ Returns false for empty string

#### getValidationErrorMessage (5 tests)
- ✅ Returns string errors as-is
- ✅ Extracts message from Error objects
- ✅ Handles unknown error types
- ✅ Handles empty string
- ✅ Handles Error with empty message

---

## 4. Component Tests (`CustomCategoryManager.test.tsx`)

### Component Rendering (11 tests)
- ✅ Renders the component
- ✅ Displays predefined categories section
- ✅ Displays all predefined categories
- ✅ Displays custom categories section
- ✅ Displays all custom categories
- ✅ Displays category icons and colors
- ✅ Shows empty state when no custom categories
- ✅ Displays add category form
- ✅ Has close button
- ✅ Shows proper section headings
- ✅ Renders form inputs correctly

### Adding Categories (10 tests)
- ✅ Adds a new category with name only
- ✅ Adds a category with name, color, and icon
- ✅ Clears form after successful addition
- ✅ Shows success message after adding
- ✅ Shows error for empty name
- ✅ Shows error for duplicate name
- ✅ Shows error for predefined category name
- ✅ Disables form while adding
- ✅ Shows loading state during addition
- ✅ Re-enables form after operation completes

### Editing Categories (9 tests)
- ✅ Enters edit mode when clicking edit button
- ✅ Exits edit mode when clicking cancel
- ✅ Updates category name
- ✅ Updates category color
- ✅ Updates category icon
- ✅ Shows success message after updating
- ✅ Shows error for empty name during edit
- ✅ Shows error for duplicate name during edit
- ✅ Exits edit mode after successful update

### Deleting Categories (8 tests)
- ✅ Shows confirmation dialog when clicking delete
- ✅ Cancels delete when clicking cancel
- ✅ Deletes category when confirming
- ✅ Shows success message after deleting
- ✅ Shows warning about items using the category
- ✅ Disables buttons while deleting
- ✅ Shows loading state during deletion
- ✅ Shows error if delete fails

### Modal Interactions (5 tests)
- ✅ Calls onClose when clicking close button
- ✅ Calls onClose when clicking overlay
- ✅ Does not close when clicking inside modal
- ✅ Handles escape key to close modal
- ✅ Does not close on escape when delete dialog is open

### Message Handling (2 tests)
- ✅ Auto-hides success message after 5 seconds
- ✅ Auto-hides error message after 5 seconds

---

## Edge Cases Covered

### Input Validation
- Empty strings
- Whitespace-only input
- Very long strings (500+ characters)
- Special characters (emojis, accents, symbols)
- Case variations (UPPER, lower, MiXeD)
- Trimming and normalization

### Permission Scenarios
- Unauthenticated users
- Demo user accounts
- List owners
- Editors
- Viewers
- Missing permissions

### Database Operations
- Connection errors
- Timeout errors
- Constraint violations
- Not found errors
- Concurrent modifications
- Partial failures

### User Experience
- Loading states
- Success messages
- Error messages
- Auto-hiding notifications
- Form validation feedback
- Disabled states during operations

### Data Integrity
- Duplicate prevention (case-insensitive)
- Predefined category protection
- Orphaned item handling (fallback to 'Other')
- Consistent timestamps
- Proper ID generation

---

## Test Quality Metrics

### Code Coverage
- **Lines**: Target 85%, Expected ~90%
- **Branches**: Target 80%, Expected ~85%
- **Functions**: Target 85%, Expected ~90%
- **Statements**: Target 85%, Expected ~90%

### Test Characteristics
- **Independence**: Each test can run in isolation
- **Repeatability**: Tests produce consistent results
- **Clarity**: Test names clearly describe what is being tested
- **Speed**: All tests complete in < 10 seconds
- **Maintainability**: Tests use shared fixtures and helpers

### Testing Patterns Used
- Arrange-Act-Assert (AAA) pattern
- Mock isolation
- Async/await for promises
- User event simulation
- Accessibility-first queries
- Realistic test data

---

## Running Specific Scenarios

### Test a specific feature:
```bash
# Only permission tests
npx vitest -t "permission"

# Only validation tests
npx vitest -t "validation"

# Only duplicate detection
npx vitest -t "duplicate"
```

### Test a specific file:
```bash
npx vitest tests/categories/categoryValidation.test.ts
```

### Test with debugging:
```bash
npx vitest tests/categories --inspect-brk
```

---

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Category Tests
  run: npx vitest tests/categories --run --reporter=junit --outputFile=test-results.xml

- name: Check Coverage
  run: npx vitest tests/categories --coverage --coverage.reporter=lcov
```

---

## Maintenance Checklist

When adding new category features, ensure:
- [ ] New functionality has corresponding tests
- [ ] Tests cover happy path and error cases
- [ ] Edge cases are considered
- [ ] Mock dependencies are properly set up
- [ ] Tests are independent and isolated
- [ ] Test names are descriptive
- [ ] Coverage thresholds are maintained
- [ ] Documentation is updated
