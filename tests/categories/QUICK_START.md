# Quick Start: Custom Category Tests

Get up and running with the custom category tests in under 5 minutes.

## 1. Install Dependencies (First Time Only)

Run the setup script from the project root:

```bash
cd /home/adam/grocery
./tests/categories/setup-tests.sh
```

Or manually install:

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitest/coverage-v8
```

## 2. Run Tests

### Quick Test Run
```bash
npx vitest tests/categories --run
```

### Watch Mode (Recommended for Development)
```bash
npx vitest tests/categories --watch
```

### With Coverage Report
```bash
npx vitest tests/categories --coverage
```

### Interactive UI
```bash
npx vitest tests/categories --ui
```

## 3. What Gets Tested

✅ **Hook Tests** (`useCustomCategories.test.ts`)
- Creating, updating, deleting categories
- Permission checks
- Validation

✅ **Utility Tests** (`categoryUtils.test.ts`)
- Category validation
- Fallback behavior
- Item migration

✅ **Validation Tests** (`categoryValidation.test.ts`)
- Name, color, icon validation
- Duplicate detection
- Edge cases

✅ **Component Tests** (`CustomCategoryManager.test.tsx`)
- UI interactions
- Form submission
- Error handling

## 4. Expected Output

When all tests pass, you should see:

```
✓ tests/categories/useCustomCategories.test.ts (45 tests)
✓ tests/categories/categoryUtils.test.ts (38 tests)
✓ tests/categories/categoryValidation.test.ts (67 tests)
✓ tests/categories/CustomCategoryManager.test.tsx (32 tests)

Test Files  4 passed (4)
     Tests  182 passed (182)
```

## 5. Troubleshooting

**Problem**: Tests won't run
```bash
# Solution: Make sure you're in the project root
cd /home/adam/grocery

# Check vitest is installed
npx vitest --version
```

**Problem**: Import errors
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Module not found errors
```bash
# Solution: Install missing dependencies
npm install --save-dev @testing-library/react @testing-library/user-event jsdom
```

## 6. Next Steps

- Read the full [README.md](./README.md) for detailed test documentation
- Add tests when creating new features
- Run tests before committing changes
- Check coverage reports to identify untested code

## Test Commands Summary

| Command | Description |
|---------|-------------|
| `npx vitest tests/categories --run` | Run all tests once |
| `npx vitest tests/categories --watch` | Watch mode (re-run on changes) |
| `npx vitest tests/categories --ui` | Interactive UI |
| `npx vitest tests/categories --coverage` | Generate coverage report |
| `npx vitest tests/categories/useCustomCategories.test.ts` | Run single file |

## File Structure

```
tests/categories/
├── README.md                           # Comprehensive documentation
├── QUICK_START.md                      # This file
├── setup-tests.sh                      # Setup script
├── useCustomCategories.test.ts         # Hook tests (45 tests)
├── categoryUtils.test.ts               # Utility tests (38 tests)
├── categoryValidation.test.ts          # Validation tests (67 tests)
└── CustomCategoryManager.test.tsx      # Component tests (32 tests)
```

## Coverage Goals

Current targets from `vitest.config.ts`:
- Lines: 85%
- Branches: 80%
- Functions: 85%
- Statements: 85%

Run `npx vitest tests/categories --coverage` to check actual coverage.
