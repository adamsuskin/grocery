/**
 * Test Setup Configuration
 *
 * Global setup for authentication tests
 */

import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// =============================================================================
// GLOBAL TEST SETUP
// =============================================================================

// Extend Vitest matchers with jest-dom
declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void, any> {}
}

// =============================================================================
// CLEANUP
// =============================================================================

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// =============================================================================
// GLOBAL MOCKS
// =============================================================================

// Mock window.fetch globally
global.fetch = vi.fn();

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

// Set test environment variables
process.env.VITE_API_URL = 'http://localhost:3000/api';
process.env.NODE_ENV = 'test';

// =============================================================================
// LOCALSTORAGE MOCK
// =============================================================================

// Enhanced localStorage mock with quota simulation
class LocalStorageMock {
  private store: Record<string, string> = {};
  private quota = 5 * 1024 * 1024; // 5MB quota
  private bytesUsed = 0;

  get length() {
    return Object.keys(this.store).length;
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    const newSize = new Blob([value]).size;
    const oldSize = this.store[key] ? new Blob([this.store[key]]).size : 0;
    const sizeDiff = newSize - oldSize;

    if (this.bytesUsed + sizeDiff > this.quota) {
      throw new Error('QuotaExceededError: localStorage quota exceeded');
    }

    this.store[key] = value;
    this.bytesUsed += sizeDiff;
  }

  removeItem(key: string): void {
    if (this.store[key]) {
      const size = new Blob([this.store[key]]).size;
      delete this.store[key];
      this.bytesUsed -= size;
    }
  }

  clear(): void {
    this.store = {};
    this.bytesUsed = 0;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  // Test helper to check bytes used
  getBytesUsed(): number {
    return this.bytesUsed;
  }

  // Test helper to set quota
  setQuota(quota: number): void {
    this.quota = quota;
  }
}

// Replace global localStorage with mock
const localStorageMock = new LocalStorageMock();
global.localStorage = localStorageMock as Storage;

// Also mock sessionStorage
global.sessionStorage = new LocalStorageMock() as Storage;

// =============================================================================
// CONSOLE MOCKS
// =============================================================================

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Only suppress React/Testing Library warnings
    const message = args[0]?.toString() || '';
    if (
      message.includes('Warning: ReactDOM.render') ||
      message.includes('Warning: useLayoutEffect') ||
      message.includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress specific warnings
    if (message.includes('componentWillReceiveProps')) {
      return;
    }
    originalWarn.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// =============================================================================
// TIMER MOCKS
// =============================================================================

// Enable fake timers for tests that need it
export function useFakeTimers() {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });
}

// =============================================================================
// NETWORK MOCKS
// =============================================================================

// Mock fetch with delay simulation
export function mockFetchWithDelay(response: any, delay: number = 100) {
  return vi.fn(() =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(response),
          } as Response),
        delay
      )
    )
  );
}

// Mock fetch with error
export function mockFetchWithError(error: Error) {
  return vi.fn(() => Promise.reject(error));
}

// Mock fetch with timeout
export function mockFetchWithTimeout(timeout: number = 5000) {
  return vi.fn(
    () =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
  );
}

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Wait for async updates to complete
 */
export async function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Wait for specified milliseconds
 */
export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a custom render function with providers
 */
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { AuthProvider } from '../../src/contexts/AuthContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withAuth?: boolean;
}

export function renderWithAuth(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { withAuth = true, ...renderOptions } = options || {};

  if (withAuth) {
    return rtlRender(<AuthProvider>{ui}</AuthProvider>, renderOptions);
  }

  return rtlRender(ui, renderOptions);
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// =============================================================================
// CUSTOM MATCHERS
// =============================================================================

// Add custom matchers if needed
expect.extend({
  toBeAuthenticated(received: any) {
    const pass =
      received.isAuthenticated === true &&
      received.user !== null &&
      received.token !== null;

    return {
      pass,
      message: () =>
        pass
          ? 'Expected auth state not to be authenticated'
          : 'Expected auth state to be authenticated',
    };
  },

  toBeUnauthenticated(received: any) {
    const pass =
      received.isAuthenticated === false &&
      received.user === null &&
      received.token === null;

    return {
      pass,
      message: () =>
        pass
          ? 'Expected auth state not to be unauthenticated'
          : 'Expected auth state to be unauthenticated',
    };
  },
});

// Extend types for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeAuthenticated(): T;
    toBeUnauthenticated(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeAuthenticated(): any;
    toBeUnauthenticated(): any;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  useFakeTimers,
  mockFetchWithDelay,
  mockFetchWithError,
  mockFetchWithTimeout,
  flushPromises,
  wait,
  renderWithAuth,
};
