# Authentication Testing Quick Reference

Quick reference guide for running and writing authentication tests.

## 🚀 Quick Commands

```bash
# Run all auth tests
pnpm test:auth

# Watch mode (auto-rerun on changes)
pnpm test:auth:watch

# With coverage report
pnpm test:auth:coverage

# Interactive UI
pnpm test:ui

# Run specific test file
pnpm test tests/auth/login.test.ts

# Run tests matching pattern
pnpm test -- -t "should login"

# Debug mode
pnpm test:debug
```

## 📁 Test Files

| File | Purpose | Test Count |
|------|---------|-----------|
| `register.test.ts` | Registration flow | 15+ |
| `login.test.ts` | Login flow | 18+ |
| `integration.test.ts` | End-to-end flows | 25+ |
| `setup.ts` | Global configuration | - |
| `mocks.ts` | Mock data & helpers | - |

## 🎯 Common Test Patterns

### Basic Component Test
```typescript
it('should render component', async () => {
  const user = userEvent.setup();

  render(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### With Mock API
```typescript
it('should call API', async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.loginSuccess),
    } as Response)
  );

  // ... rest of test

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/auth/login'),
    expect.objectContaining({ method: 'POST' })
  );
});
```

### With LocalStorage
```typescript
it('should store tokens', async () => {
  // Setup
  setupValidAuthState();

  // ... test actions

  // Verify
  expect(localStorage.getItem('grocery_auth_access_token')).toBe('token');
});
```

## 🔍 Query Selectors (Priority Order)

```typescript
// 1. By Role (most accessible)
screen.getByRole('button', { name: /sign in/i })
screen.getByRole('textbox', { name: /email/i })

// 2. By Label Text (for forms)
screen.getByLabelText(/email address/i)
screen.getByLabelText(/password/i)

// 3. By Placeholder
screen.getByPlaceholderText(/enter email/i)

// 4. By Text
screen.getByText(/welcome back/i)

// 5. By Test ID (last resort)
screen.getByTestId('login-form')
```

## 🎭 User Interactions

```typescript
const user = userEvent.setup();

// Type text
await user.type(input, 'text');

// Click
await user.click(button);

// Clear input
await user.clear(input);

// Tab to next field
await user.tab();

// Hover
await user.hover(element);

// Keyboard
await user.keyboard('{Enter}');
```

## ⏳ Async Testing

```typescript
// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});

// Find (built-in wait)
const element = await screen.findByText(/success/i);

// Custom timeout
await waitFor(() => {
  expect(condition).toBe(true);
}, { timeout: 5000 });
```

## 🎨 Custom Matchers

```typescript
// Jest DOM matchers
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveAttribute('type', 'password')
expect(element).toHaveTextContent('text')
expect(input).toHaveValue('value')

// Custom auth matchers
expect(authState).toBeAuthenticated()
expect(authState).toBeUnauthenticated()
```

## 🧪 Mock Helpers

```typescript
import {
  mockUsers,
  mockTokens,
  mockApiResponses,
  setupValidAuthState,
  clearAuthState,
  expectAuthStateCleared
} from './mocks';

// Setup valid auth state
setupValidAuthState();
setupValidAuthState(mockUsers.valid, mockTokens.valid);

// Clear auth
clearAuthState();

// Verify
expectAuthStateCleared();
expectAuthStateValid();

// Mock fetch
global.fetch = createMockFetchSuccess(mockApiResponses.loginSuccess);
global.fetch = createMockFetchError('Error message', 500);
```

## 📊 Coverage Commands

```bash
# Generate coverage
pnpm test:coverage

# View HTML report
open coverage/index.html

# Check coverage thresholds
pnpm test:coverage -- --coverage.lines=85
```

## 🐛 Debugging

```typescript
import { debug } from '@testing-library/react';

// Print entire DOM
debug();

// Print specific element
debug(screen.getByRole('button'));

// Pretty print with colors
screen.debug();

// Log query results
screen.logTestingPlaygroundURL();
```

## ⚙️ Setup & Teardown

```typescript
beforeEach(() => {
  // Clear state before each test
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  cleanup();
  vi.restoreAllMocks();
});

beforeAll(() => {
  // One-time setup
  server.listen();
});

afterAll(() => {
  // One-time cleanup
  server.close();
});
```

## 🎯 Test Organization

```typescript
describe('Feature Name', () => {
  describe('Success Cases', () => {
    it('should do X', () => {});
    it('should do Y', () => {});
  });

  describe('Error Cases', () => {
    it('should handle error A', () => {});
    it('should handle error B', () => {});
  });

  describe('Edge Cases', () => {
    it('should handle edge case', () => {});
  });
});
```

## 🔧 Mock API Responses

```typescript
// Success response
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: 'value' }),
  } as Response)
);

// Error response
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: false,
    status: 401,
    json: () => Promise.resolve({ message: 'Error' }),
  } as Response)
);

// Network error
global.fetch = vi.fn(() =>
  Promise.reject(new Error('Network error'))
);

// With delay
global.fetch = vi.fn(() =>
  new Promise((resolve) =>
    setTimeout(() =>
      resolve({
        ok: true,
        json: () => Promise.resolve(data),
      } as Response),
      100
    )
  )
);
```

## ✅ Testing Checklist

### Before Writing Test
- [ ] Know what behavior to test
- [ ] Have necessary mock data ready
- [ ] Understand expected outcome

### While Writing Test
- [ ] Use descriptive test name
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Use correct query selectors
- [ ] Handle async properly
- [ ] Test user behavior, not implementation

### After Writing Test
- [ ] Test passes reliably
- [ ] Test fails when it should
- [ ] No console errors/warnings
- [ ] Good coverage
- [ ] Code is readable

## 🔍 Finding Elements

```typescript
// Query variants
getBy*    // Throws error if not found
queryBy*  // Returns null if not found
findBy*   // Async, waits for element

// Multiple elements
getAllBy*
queryAllBy*
findAllBy*

// Common queries
screen.getByRole('button')
screen.getByLabelText('Email')
screen.getByText('Submit')
screen.getByPlaceholderText('Enter text')
screen.getByTestId('my-element')
```

## 📈 Coverage Thresholds

```typescript
// vitest.config.ts
coverage: {
  lines: 85,      // Statement coverage
  branches: 80,   // Branch coverage
  functions: 85,  // Function coverage
  statements: 85, // Statement coverage
}
```

## 🚨 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Unable to find element" | Use `waitFor` or `findBy` |
| "Test timeout" | Increase timeout or fix async |
| "localStorage not defined" | Check jsdom config |
| "Cannot find module" | Check import paths |
| "Multiple elements found" | Use more specific query |

## 📚 Useful Resources

- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Vitest API](https://vitest.dev/api/)
- [User Event API](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## 🎓 Pro Tips

1. **Use `screen` queries** - More maintainable than destructuring
2. **Prefer `userEvent` over `fireEvent`** - More realistic
3. **Test behavior, not implementation** - Don't test internal state
4. **Use accessible queries** - Better UX and tests
5. **Keep tests simple** - One concept per test
6. **Mock at boundaries** - API, not components
7. **Clean up after tests** - Prevent test pollution
8. **Use TypeScript** - Catch errors early

---

**Need more help?** Check the full documentation:
- `README.md` - Overview and examples
- `SETUP.md` - Installation and configuration
- `TEST_PLAN.md` - Complete test scenarios
