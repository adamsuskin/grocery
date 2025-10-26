# Authentication Testing Setup Guide

## Overview
This guide provides step-by-step instructions for setting up and running authentication tests in the grocery list application.

---

## Prerequisites

### Required Dependencies
```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

### Optional Dependencies (for enhanced testing)
```bash
pnpm add -D @vitest/coverage-c8 msw @faker-js/faker
```

---

## 1. Install Testing Dependencies

### Basic Testing Stack
```bash
# Vitest - Fast unit test framework
pnpm add -D vitest

# Vitest UI - Visual test runner
pnpm add -D @vitest/ui

# React Testing Library - Component testing utilities
pnpm add -D @testing-library/react

# Jest DOM - Custom matchers for DOM
pnpm add -D @testing-library/jest-dom

# User Event - Simulate user interactions
pnpm add -D @testing-library/user-event

# JSDOM - DOM implementation for tests
pnpm add -D jsdom
```

### Coverage Tools
```bash
# Coverage reporting
pnpm add -D @vitest/coverage-c8
```

### API Mocking (Optional but Recommended)
```bash
# Mock Service Worker - API mocking
pnpm add -D msw
```

### Test Data Generation (Optional)
```bash
# Faker - Generate realistic test data
pnpm add -D @faker-js/faker
```

---

## 2. Configuration Files

### vitest.config.ts
Create or update `/home/adam/grocery/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./tests/auth/setup.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
      lines: 85,
      branches: 80,
      functions: 85,
      statements: 85,
    },

    // Test matching patterns
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Test timeout
    testTimeout: 10000,

    // Disable watch mode in CI
    watch: false,

    // Reporter
    reporter: ['verbose', 'html'],

    // Mock reset
    clearMocks: true,
    restoreMocks: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
```

### tsconfig.json Updates
Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "paths": {
      "@/*": ["./src/*"],
      "@tests/*": ["./tests/*"]
    }
  },
  "include": [
    "src",
    "tests"
  ]
}
```

---

## 3. Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:auth": "vitest run tests/auth",
    "test:auth:watch": "vitest tests/auth",
    "test:auth:coverage": "vitest run --coverage tests/auth",
    "test:debug": "vitest --inspect-brk --inspect --single-thread"
  }
}
```

---

## 4. Project Structure

Ensure your test directory structure looks like this:

```
/home/adam/grocery/
├── tests/
│   └── auth/
│       ├── setup.ts              # Global test setup
│       ├── mocks.ts              # Mock data and helpers
│       ├── register.test.ts      # Registration tests
│       ├── login.test.ts         # Login tests
│       ├── integration.test.ts   # Integration tests
│       ├── TEST_PLAN.md          # Test plan documentation
│       └── SETUP.md              # This file
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── types/
│   │   └── auth.ts
│   └── utils/
│       └── auth.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Running Tests

### Run All Tests
```bash
pnpm test
```

### Run Tests in Watch Mode
```bash
pnpm test
# or
pnpm test:auth:watch
```

### Run Tests Once (CI Mode)
```bash
pnpm test:run
```

### Run with Coverage
```bash
pnpm test:coverage
```

### Run Auth Tests Only
```bash
pnpm test:auth
```

### Run Specific Test File
```bash
pnpm test tests/auth/login.test.ts
```

### Run with UI
```bash
pnpm test:ui
# Opens browser with interactive test runner
```

### Debug Tests
```bash
pnpm test:debug
# Attach debugger to Node process
```

---

## 6. Writing Your First Test

Create a simple test to verify setup:

```typescript
// tests/auth/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to DOM', () => {
    const div = document.createElement('div');
    expect(div).toBeInstanceOf(HTMLDivElement);
  });
});
```

Run it:
```bash
pnpm test tests/auth/example.test.ts
```

---

## 7. Common Issues and Solutions

### Issue: "Cannot find module '@testing-library/jest-dom'"
**Solution**: Install the package
```bash
pnpm add -D @testing-library/jest-dom
```

### Issue: "ReferenceError: fetch is not defined"
**Solution**: Ensure `setup.ts` is configured in `vitest.config.ts` and contains fetch mock

### Issue: "localStorage is not defined"
**Solution**: Make sure `environment: 'jsdom'` is set in vitest.config.ts

### Issue: Tests timeout
**Solution**: Increase timeout in vitest.config.ts:
```typescript
testTimeout: 20000, // 20 seconds
```

### Issue: Coverage not generating
**Solution**: Install coverage provider:
```bash
pnpm add -D @vitest/coverage-c8
```

---

## 8. Test Coverage

### View Coverage Report
After running tests with coverage:
```bash
pnpm test:coverage
```

View the HTML report:
```bash
open coverage/index.html
```

### Coverage Thresholds
Configured in `vitest.config.ts`:
- Statements: 85%
- Branches: 80%
- Functions: 85%
- Lines: 85%

Tests will fail if coverage drops below these thresholds.

---

## 9. Mock Service Worker Setup (Optional)

If you want to use MSW for API mocking:

### Install MSW
```bash
pnpm add -D msw
```

### Create MSW Handlers
```typescript
// tests/auth/msw-handlers.ts
import { rest } from 'msw';
import { mockApiResponses } from './mocks';

const API_URL = 'http://localhost:3000/api';

export const handlers = [
  // Login
  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    return res(ctx.json(mockApiResponses.loginSuccess));
  }),

  // Register
  rest.post(`${API_URL}/auth/register`, (req, res, ctx) => {
    return res(ctx.json(mockApiResponses.registerSuccess));
  }),

  // Logout
  rest.post(`${API_URL}/auth/logout`, (req, res, ctx) => {
    return res(ctx.json(mockApiResponses.logoutSuccess));
  }),

  // Refresh token
  rest.post(`${API_URL}/auth/refresh`, (req, res, ctx) => {
    return res(ctx.json(mockApiResponses.refreshSuccess));
  }),
];
```

### Setup MSW Server
```typescript
// tests/auth/msw-server.ts
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

export const server = setupServer(...handlers);
```

### Configure in Setup File
```typescript
// tests/auth/setup.ts
import { server } from './msw-server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 10. IDE Configuration

### VS Code
Install extensions:
- **Vitest** by ZixuanChen
- **Testing Library** by Testing Library

Add to `.vscode/settings.json`:
```json
{
  "vitest.enable": true,
  "vitest.commandLine": "pnpm test",
  "testing.automaticallyOpenPeekView": "never"
}
```

### WebStorm/IntelliJ
1. Go to Settings > Languages & Frameworks > JavaScript > Test Runner
2. Select Vitest
3. Set test file patterns: `tests/**/*.{test,spec}.{ts,tsx}`

---

## 11. Continuous Integration

### GitHub Actions Example
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 12. Best Practices

### Test Organization
- One test file per component/feature
- Group related tests with `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Mocking
- Mock at the appropriate level (component vs API)
- Use MSW for API mocking when possible
- Keep mocks in separate files
- Reset mocks between tests

### Assertions
- Use specific matchers
- Test user-visible behavior
- Avoid testing implementation details
- Use accessible queries (getByRole, getByLabelText)

### Performance
- Use `screen` from @testing-library/react
- Avoid unnecessary `waitFor` calls
- Clean up after tests
- Use fake timers when testing time-based code

---

## 13. Resources

### Documentation
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW](https://mswjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Example Commands
```bash
# Watch mode with UI
pnpm test:ui

# Run specific test
pnpm test login

# Run tests with coverage in watch mode
vitest --coverage --watch

# Run tests matching pattern
vitest --grep="login"

# Run tests in specific file with debugging
node --inspect-brk ./node_modules/.bin/vitest tests/auth/login.test.ts
```

---

## Troubleshooting

### Clear Vitest Cache
```bash
rm -rf node_modules/.vitest
```

### Verbose Output
```bash
pnpm test -- --reporter=verbose
```

### See Which Tests Ran
```bash
pnpm test -- --reporter=verbose --run
```

---

## Next Steps

1. ✅ Install all dependencies
2. ✅ Create vitest.config.ts
3. ✅ Run example test to verify setup
4. ✅ Run existing auth tests
5. ✅ Check coverage report
6. ✅ Add more tests as needed
7. ✅ Set up CI/CD pipeline
8. ✅ Configure IDE for testing

---

## Quick Start Checklist

- [ ] Install dependencies (`pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`)
- [ ] Create `vitest.config.ts`
- [ ] Update `tsconfig.json` with test types
- [ ] Add test scripts to `package.json`
- [ ] Run `pnpm test:auth` to verify setup
- [ ] Check coverage with `pnpm test:coverage`
- [ ] Review test output and fix any failures
- [ ] Set up CI/CD (optional)

---

**Ready to test!** 🎉

If you encounter any issues, refer to the Troubleshooting section or check the official documentation.
