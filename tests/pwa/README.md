# PWA Test Suite

This directory contains automated tests for Progressive Web App (PWA) features.

## Test Files

### serviceWorker.test.ts
Tests for service worker registration, lifecycle, caching, and offline functionality.

**Test Coverage:**
- Service worker registration (success and failure cases)
- Browser support detection
- Service worker lifecycle (activation, claiming clients)
- Service worker updates and skip waiting
- Cache strategies (cache-first, network-first, stale-while-revalidate)
- Offline mode functionality
- Service worker messaging
- Cache management (cleanup, size limits, statistics)
- Error handling and retry logic

**Lines:** 660 tests

### backgroundSync.test.ts
Tests for Background Sync API, sync queue management, and fallback mechanisms.

**Test Coverage:**
- Background Sync API detection
- Sync registration for add/update/delete operations
- Sync queue management (FIFO, retry counts)
- Sync event handling and processing
- Conflict resolution
- Fallback to polling when Background Sync unavailable
- Retry logic with exponential backoff
- Queue persistence across app restarts
- Integration with app state (optimistic updates)
- Network state handling

**Lines:** 792 tests

## Running Tests

### Run All PWA Tests
```bash
pnpm test tests/pwa
```

### Run Specific Test File
```bash
pnpm test tests/pwa/serviceWorker.test.ts
pnpm test tests/pwa/backgroundSync.test.ts
```

### Run with Coverage
```bash
pnpm test:coverage tests/pwa
```

### Watch Mode
```bash
pnpm test:watch tests/pwa
```

## Test Framework

Tests use **Vitest** with the following utilities:
- `describe`: Group related tests
- `it`: Individual test cases
- `expect`: Assertions
- `beforeEach`: Setup before each test
- `afterEach`: Cleanup after each test
- `vi`: Vitest mocking utilities

## Mock Objects

The tests include comprehensive mocks for:
- `ServiceWorkerRegistration`
- `ServiceWorker`
- `ServiceWorkerContainer`
- `SyncManager`
- `Cache` and `CacheStorage`
- Sync queue (IndexedDB simulation)

## Test Structure

Each test file follows this structure:

1. **Imports**: Testing utilities and mocks
2. **Mock Classes**: Service worker API mocks
3. **Test Suites**: Organized by feature/functionality
4. **Setup/Teardown**: `beforeEach` and `afterEach` hooks
5. **Test Cases**: Individual scenarios with assertions

## Manual Testing

For tests that require manual execution (e.g., on real devices, testing background sync when app closed), see:
- [PWA Manual Testing Guide](../../docs/PWA_MANUAL_TESTING.md)

## Debugging Tests

If tests fail:

1. Check console output for error messages
2. Run tests individually to isolate issues
3. Use `--reporter=verbose` for detailed output
4. Check mock implementations match real APIs
5. Verify test environment setup

## Related Documentation

- [PWA Test Plan](../../docs/PWA_TEST_PLAN.md) - Comprehensive test scenarios (76 scenarios)
- [PWA Manual Testing](../../docs/PWA_MANUAL_TESTING.md) - Step-by-step manual test procedures
- [PWA Debugging Guide](../../docs/PWA_DEBUGGING.md) - Debugging tools and techniques

## Contributing

When adding new PWA features:

1. Write automated tests in this directory
2. Update the test plan with manual test scenarios
3. Document debugging procedures if needed
4. Ensure tests pass before committing
5. Aim for high test coverage (>80%)

## Test Coverage Goals

- **Service Worker**: >90% coverage
- **Background Sync**: >85% coverage
- **Cache Management**: >85% coverage
- **Push Notifications**: >80% coverage (when implemented)

## CI/CD Integration

These tests run automatically in CI/CD pipeline:
- On pull requests
- Before merging to main
- On deployment builds

Ensure all tests pass before submitting PRs.

---

**Test Suite Version:** 1.0
**Last Updated:** 2025-10-26
**Total Test Scenarios:** 57 automated + 19 manual = 76 total
