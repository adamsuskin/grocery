# Authentication Test Suite

Comprehensive test suite for authentication functionality in the Grocery List application.

## Overview

This test suite covers all authentication flows including registration, login, logout, token refresh, and protected route access. Tests are written using Vitest, React Testing Library, and follow best practices for component and integration testing.

## Test Coverage

### 📝 Test Files

- **`register.test.ts`** - User registration flow tests
  - Successful registration
  - Form validation (name, email, password, confirm password)
  - Duplicate email handling
  - UI/UX behavior (loading states, password visibility)
  - Network error handling

- **`login.test.ts`** - User login flow tests
  - Successful login
  - Invalid credentials
  - Form validation
  - Session persistence
  - Network error handling

- **`integration.test.ts`** - Integration and end-to-end tests
  - Logout flow
  - Token refresh (automatic and manual)
  - Protected route access
  - Auth context state management
  - Complete user journeys (register → login → logout)

### 📊 Test Scenarios

Total test scenarios: **80+**

- ✅ Registration: 15 scenarios
- ✅ Login: 18 scenarios
- ✅ Logout: 5 scenarios
- ✅ Token Refresh: 8 scenarios
- ✅ Protected Routes: 6 scenarios
- ✅ Context State: 10 scenarios
- ✅ Integration: 18+ scenarios

## Quick Start

### Prerequisites
```bash
# Install dependencies
pnpm install
```

### Run Tests
```bash
# Run all auth tests
pnpm test:auth

# Run in watch mode
pnpm test:auth:watch

# Run with coverage
pnpm test:auth:coverage

# Run with UI
pnpm test:ui
```

## Test Structure

### File Organization
```
tests/auth/
├── README.md              # This file
├── SETUP.md              # Setup instructions
├── TEST_PLAN.md          # Detailed test plan
├── setup.ts              # Global test configuration
├── mocks.ts              # Mock data and helpers
├── register.test.ts      # Registration tests
├── login.test.ts         # Login tests
└── integration.test.ts   # Integration tests
```

### Test Pattern

Each test follows the AAA pattern:

```typescript
it('should do something', async () => {
  // Arrange - Set up test data and mocks
  global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockData),
  }));

  // Act - Perform user actions
  const user = userEvent.setup();
  render(<Component />);
  await user.type(screen.getByLabelText(/input/i), 'value');
  await user.click(screen.getByRole('button'));

  // Assert - Verify expected outcomes
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

## Mock Data

The `mocks.ts` file provides:

### Mock Users
```typescript
mockUsers.valid        // Standard test user
mockUsers.existing     // Pre-existing user for duplicate tests
mockUsers.anotherValid // Secondary user for multi-user tests
```

### Mock Tokens
```typescript
mockTokens.valid        // Valid, non-expired token
mockTokens.expired      // Expired token
mockTokens.expiringSoon // Token expiring in 4 minutes
mockTokens.refreshed    // Freshly refreshed token
```

### Mock API Responses
```typescript
mockApiResponses.loginSuccess
mockApiResponses.registerSuccess
mockApiResponses.invalidCredentials
mockApiResponses.userExists
mockApiResponses.validationError
// ... and more
```

### Helper Functions
```typescript
setupValidAuthState()      // Populate localStorage with valid auth
setupExpiredAuthState()    // Populate with expired auth
clearAuthState()           // Clear all auth data
createMockResponse()       // Create mock fetch response
expectAuthStateCleared()   // Assert auth cleared
expectAuthStateValid()     // Assert auth valid
```

## Writing Tests

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { LoginForm } from '../../src/components/LoginForm';

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Tests

```typescript
import { renderWithAuth } from '../setup';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';

describe('Protected Routes', () => {
  it('should render protected content when authenticated', async () => {
    setupValidAuthState(); // Helper from mocks.ts

    renderWithAuth(
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });
});
```

## Test Utilities

### Custom Render
```typescript
import { renderWithAuth } from '../setup';

// Renders with AuthProvider wrapper
renderWithAuth(<Component />);

// Render without auth wrapper
renderWithAuth(<Component />, { withAuth: false });
```

### Custom Matchers
```typescript
// Check if auth state is authenticated
expect(authState).toBeAuthenticated();

// Check if auth state is unauthenticated
expect(authState).toBeUnauthenticated();
```

### Async Helpers
```typescript
import { flushPromises, wait } from '../setup';

// Wait for all promises to resolve
await flushPromises();

// Wait specific time
await wait(100);
```

## Best Practices

### 1. Query Priority
Use queries in this order:
1. `getByRole` - Most accessible
2. `getByLabelText` - Form fields
3. `getByPlaceholderText` - When no label
4. `getByText` - For non-interactive elements
5. `getByTestId` - Last resort

### 2. User Interactions
Always use `userEvent` over `fireEvent`:
```typescript
// ✅ Good
const user = userEvent.setup();
await user.type(input, 'text');
await user.click(button);

// ❌ Avoid
fireEvent.change(input, { target: { value: 'text' } });
fireEvent.click(button);
```

### 3. Async Testing
```typescript
// ✅ Good - Wait for specific condition
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// ❌ Avoid - Arbitrary timeouts
await new Promise(resolve => setTimeout(resolve, 1000));
```

### 4. Test Isolation
```typescript
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});
```

### 5. Descriptive Test Names
```typescript
// ✅ Good
it('should show error when email is invalid', () => {});
it('should store tokens after successful login', () => {});

// ❌ Avoid
it('works correctly', () => {});
it('test login', () => {});
```

## Coverage Reports

### View Coverage
```bash
# Generate and view coverage
pnpm test:coverage
open coverage/index.html
```

### Coverage Goals
- Statements: 85%
- Branches: 80%
- Functions: 85%
- Lines: 85%

### Current Coverage
Check the latest coverage report in `coverage/` directory after running tests with `--coverage` flag.

## Debugging Tests

### Debug in VS Code
1. Set breakpoint in test file
2. Run "Debug Test" from test file
3. Or use command: `pnpm test:debug`

### Console Logging
```typescript
import { screen, debug } from '@testing-library/react';

// Print DOM tree
debug();

// Print specific element
debug(screen.getByRole('button'));

// Print to console
console.log(screen.getByRole('button').innerHTML);
```

### Test-Specific Debugging
```bash
# Run single test
pnpm test -- -t "should login user"

# Run single file
pnpm test tests/auth/login.test.ts

# Run with verbose output
pnpm test -- --reporter=verbose
```

## Common Issues

### Issue: "Unable to find element"
**Solution**: Element might not be rendered yet. Use `waitFor`:
```typescript
await waitFor(() => {
  expect(screen.getByText(/text/i)).toBeInTheDocument();
});
```

### Issue: "Test timeout"
**Solution**: Increase timeout or fix async handling:
```typescript
it('test', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Issue: "localStorage is not defined"
**Solution**: Ensure jsdom environment is configured in vitest.config.ts

### Issue: "Cannot find module"
**Solution**: Check path aliases in vitest.config.ts and tsconfig.json

## Contributing

### Adding New Tests
1. Follow existing test patterns
2. Use descriptive names
3. Include both success and error cases
4. Test user-visible behavior
5. Add to appropriate test file or create new one

### Test Checklist
- [ ] Test has descriptive name
- [ ] Uses correct queries (prefer getByRole)
- [ ] Tests user behavior, not implementation
- [ ] Handles async correctly (waitFor)
- [ ] Cleans up after itself
- [ ] Includes error cases
- [ ] Has good coverage
- [ ] Passes in CI

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [User Event API](https://testing-library.com/docs/user-event/intro)

## Support

For questions or issues:
1. Check SETUP.md for configuration help
2. Review TEST_PLAN.md for scenario details
3. Look at existing tests for examples
4. Consult official documentation

---

**Happy Testing!** 🧪
