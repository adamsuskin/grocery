/**
 * Mock Data for Authentication Tests
 *
 * Centralized mock data and helper functions for auth testing
 */

import type { User, AuthTokens, LoginResponse, RegisterResponse, RefreshTokenResponse } from '../../src/types/auth';

// =============================================================================
// MOCK USERS
// =============================================================================

export const mockUsers = {
  valid: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: Date.now(),
  },
  anotherValid: {
    id: 'user-456',
    email: 'another@example.com',
    name: 'Another User',
    createdAt: Date.now(),
  },
  existing: {
    id: 'user-789',
    email: 'existing@example.com',
    name: 'Existing User',
    createdAt: Date.now() - 86400000, // 1 day ago
  },
} as const;

// =============================================================================
// MOCK TOKENS
// =============================================================================

export const mockTokens = {
  valid: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid',
    refreshToken: 'refresh-token-valid',
    expiresAt: Date.now() + 3600000, // 1 hour from now
  },
  expired: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired',
    refreshToken: 'refresh-token-expired',
    expiresAt: Date.now() - 1000, // 1 second ago
  },
  expiringSoon: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expiring',
    refreshToken: 'refresh-token-expiring',
    expiresAt: Date.now() + 4 * 60 * 1000, // 4 minutes (triggers refresh)
  },
  refreshed: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshed',
    refreshToken: 'refresh-token-refreshed',
    expiresAt: Date.now() + 3600000, // Fresh 1 hour
  },
} as const;

// =============================================================================
// MOCK CREDENTIALS
// =============================================================================

export const mockCredentials = {
  valid: {
    email: 'test@example.com',
    password: 'Test@1234',
  },
  validRegister: {
    email: 'newuser@example.com',
    password: 'NewUser@123',
    name: 'New User',
  },
  invalid: {
    email: 'test@example.com',
    password: 'WrongPassword',
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'Test@1234',
  },
  weakPassword: {
    email: 'test@example.com',
    password: 'weak',
  },
} as const;

// =============================================================================
// MOCK API RESPONSES
// =============================================================================

export const mockApiResponses = {
  // Successful login
  loginSuccess: {
    success: true,
    message: 'Login successful',
    data: {
      user: mockUsers.valid,
      tokens: mockTokens.valid,
    },
  } as { success: boolean; message: string; data: LoginResponse },

  // Successful registration
  registerSuccess: {
    success: true,
    message: 'User registered successfully',
    data: {
      user: mockUsers.valid,
      tokens: mockTokens.valid,
    },
  } as { success: boolean; message: string; data: RegisterResponse },

  // Invalid credentials (401)
  invalidCredentials: {
    success: false,
    error: 'Invalid credentials',
    message: 'Invalid email or password',
  },

  // User already exists (409)
  userExists: {
    success: false,
    error: 'User already exists',
    message: 'An account with this email already exists',
  },

  // Validation error (400)
  validationError: {
    success: false,
    error: 'Validation error',
    message: 'Email and password are required',
  },

  // Password validation error (400)
  passwordValidationError: {
    success: false,
    error: 'Validation error',
    message: 'Password must be at least 8 characters long',
  },

  // Email validation error (400)
  emailValidationError: {
    success: false,
    error: 'Validation error',
    message: 'Invalid email format',
  },

  // Successful token refresh
  refreshSuccess: {
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: mockTokens.refreshed.accessToken,
      expiresAt: mockTokens.refreshed.expiresAt,
    },
  } as { success: boolean; message: string; data: RefreshTokenResponse },

  // Invalid refresh token (401)
  refreshFailed: {
    success: false,
    error: 'Invalid refresh token',
    message: 'Refresh token is invalid or expired',
  },

  // Successful logout
  logoutSuccess: {
    success: true,
    message: 'Logout successful',
    data: {
      message: 'Please delete tokens from client storage',
    },
  },

  // Server error (500)
  serverError: {
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred',
  },

  // Network error
  networkError: new Error('Network error'),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a mock successful Response object
 */
export function createMockResponse<T>(data: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    statusText: status === 200 ? 'OK' : 'Error',
  } as Response;
}

/**
 * Creates a mock error Response object
 */
export function createMockErrorResponse(message: string, status = 500): Response {
  return createMockResponse({ message }, status);
}

/**
 * Populates localStorage with valid auth data
 */
export function setupValidAuthState(user: User = mockUsers.valid, tokens: AuthTokens = mockTokens.valid): void {
  localStorage.setItem('grocery_auth_access_token', tokens.accessToken);
  localStorage.setItem('grocery_auth_refresh_token', tokens.refreshToken);
  localStorage.setItem('grocery_auth_token_expiry', tokens.expiresAt.toString());
  localStorage.setItem('grocery_auth_user', JSON.stringify(user));
}

/**
 * Populates localStorage with expired auth data
 */
export function setupExpiredAuthState(user: User = mockUsers.valid): void {
  setupValidAuthState(user, mockTokens.expired);
}

/**
 * Clears all auth data from localStorage
 */
export function clearAuthState(): void {
  localStorage.removeItem('grocery_auth_access_token');
  localStorage.removeItem('grocery_auth_refresh_token');
  localStorage.removeItem('grocery_auth_token_expiry');
  localStorage.removeItem('grocery_auth_user');
}

/**
 * Creates a mock fetch function that returns success response
 */
export function createMockFetchSuccess<T>(data: T, delay = 0): jest.Mock | typeof vi.fn {
  return vi.fn(() => {
    if (delay > 0) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(createMockResponse(data)), delay)
      );
    }
    return Promise.resolve(createMockResponse(data));
  });
}

/**
 * Creates a mock fetch function that returns error response
 */
export function createMockFetchError(message: string, status = 500, delay = 0): jest.Mock | typeof vi.fn {
  return vi.fn(() => {
    if (delay > 0) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(createMockErrorResponse(message, status)), delay)
      );
    }
    return Promise.resolve(createMockErrorResponse(message, status));
  });
}

/**
 * Creates a mock fetch function that rejects with network error
 */
export function createMockFetchNetworkError(delay = 0): jest.Mock | typeof vi.fn {
  return vi.fn(() => {
    if (delay > 0) {
      return new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network error')), delay)
      );
    }
    return Promise.reject(new Error('Network error'));
  });
}

/**
 * Waits for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Gets current auth state from localStorage
 */
export function getStoredAuthState() {
  return {
    accessToken: localStorage.getItem('grocery_auth_access_token'),
    refreshToken: localStorage.getItem('grocery_auth_refresh_token'),
    tokenExpiry: localStorage.getItem('grocery_auth_token_expiry'),
    user: localStorage.getItem('grocery_auth_user'),
  };
}

/**
 * Verifies auth state is cleared
 */
export function expectAuthStateCleared() {
  const state = getStoredAuthState();
  expect(state.accessToken).toBeNull();
  expect(state.refreshToken).toBeNull();
  expect(state.tokenExpiry).toBeNull();
  expect(state.user).toBeNull();
}

/**
 * Verifies auth state matches expected values
 */
export function expectAuthStateValid(
  user: User = mockUsers.valid,
  tokens: AuthTokens = mockTokens.valid
) {
  const state = getStoredAuthState();
  expect(state.accessToken).toBe(tokens.accessToken);
  expect(state.refreshToken).toBe(tokens.refreshToken);
  expect(state.tokenExpiry).toBe(tokens.expiresAt.toString());
  expect(state.user).toBe(JSON.stringify(user));
}

// =============================================================================
// TEST UTILITIES
// =============================================================================

/**
 * Mock localStorage for tests that need it unavailable
 */
export function mockLocalStorageUnavailable() {
  const originalLocalStorage = global.localStorage;

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: () => {
        throw new Error('localStorage not available');
      },
      setItem: () => {
        throw new Error('localStorage not available');
      },
      removeItem: () => {
        throw new Error('localStorage not available');
      },
      clear: () => {
        throw new Error('localStorage not available');
      },
    },
    writable: true,
  });

  return () => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  };
}

/**
 * Mock console methods to suppress expected errors/warnings in tests
 */
export function suppressConsoleErrors() {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = vi.fn();
  console.warn = vi.fn();

  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  users: mockUsers,
  tokens: mockTokens,
  credentials: mockCredentials,
  responses: mockApiResponses,
  helpers: {
    createMockResponse,
    createMockErrorResponse,
    setupValidAuthState,
    setupExpiredAuthState,
    clearAuthState,
    createMockFetchSuccess,
    createMockFetchError,
    createMockFetchNetworkError,
    waitForCondition,
    getStoredAuthState,
    expectAuthStateCleared,
    expectAuthStateValid,
    mockLocalStorageUnavailable,
    suppressConsoleErrors,
  },
};
