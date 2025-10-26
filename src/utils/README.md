# Authentication Utilities Documentation

This directory contains comprehensive authentication utilities for the Grocery List application.

## Files

### `auth.ts` - Core Authentication Utilities
Provides essential authentication functions including:
- Token storage management
- Token validation
- Password validation
- Auth header generation
- Error handling

### `api.ts` - API Client with Authentication
A fully-featured API client with:
- Automatic authentication header injection
- Token refresh on 401 errors
- Request/response interceptors
- Retry logic for transient failures
- Typed error handling

### `authZeroIntegration.ts` - Zero Store Integration
Utilities for synchronizing authentication state with the Zero store.

---

## Usage Examples

### Basic Authentication Flow

```typescript
import { apiClient } from './utils/api';
import { saveAuthData, clearAuthData, hasValidAuthState } from './utils/auth';

// Login
async function handleLogin(email: string, password: string) {
  try {
    const response = await apiClient.auth.login({ email, password });
    saveAuthData(response.user, response.tokens);

    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Logout
async function handleLogout() {
  await apiClient.auth.logout();
  clearAuthData();
  navigate('/login');
}

// Check auth state
function checkAuth() {
  if (!hasValidAuthState()) {
    navigate('/login');
  }
}
```

### Making Authenticated API Requests

```typescript
import { apiClient } from './utils/api';

// GET request
async function getUsers() {
  try {
    const users = await apiClient.get<User[]>('/users');
    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

// POST request
async function createItem(data: CreateItemData) {
  try {
    const newItem = await apiClient.post<Item>('/items', data);
    return newItem;
  } catch (error) {
    console.error('Failed to create item:', error);
  }
}

// PUT request
async function updateItem(id: string, data: UpdateItemData) {
  try {
    const updated = await apiClient.put<Item>(`/items/${id}`, data);
    return updated;
  } catch (error) {
    console.error('Failed to update item:', error);
  }
}

// DELETE request
async function deleteItem(id: string) {
  try {
    await apiClient.delete(`/items/${id}`);
  } catch (error) {
    console.error('Failed to delete item:', error);
  }
}
```

### Token Management

```typescript
import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  getTimeUntilExpiry,
  getAuthData,
} from './utils/auth';

// Get current token
const token = getAccessToken();

// Check if token is expired
const expiresAt = getTokenExpiry();
if (expiresAt && isTokenExpired(expiresAt)) {
  // Token is expired, refresh it
  await apiClient.auth.refreshToken();
}

// Check with buffer (5 minutes before expiry)
if (expiresAt && isTokenExpired(expiresAt, 5)) {
  // Token will expire in 5 minutes, proactively refresh
  await apiClient.auth.refreshToken();
}

// Get time until expiry
if (expiresAt) {
  const minutesLeft = getMinutesUntilExpiry(expiresAt);
  console.log(`Token expires in ${minutesLeft} minutes`);
}

// Get all auth data at once
const { user, accessToken, refreshToken, expiresAt } = getAuthData();
```

### Password Validation

```typescript
import { validatePassword, getPasswordStrength } from './utils/auth';

// Validate password with default requirements
function handlePasswordChange(password: string) {
  const result = validatePassword(password);

  if (!result.isValid) {
    console.error('Password errors:', result.errors);
    return;
  }

  console.log('Password strength:', result.strength); // weak, medium, strong, very-strong
  console.log('Password score:', result.score); // 0-100
}

// Custom validation requirements
const result = validatePassword(password, {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  maxLength: 128,
});

// Get strength without validation (for password strength meter)
function updatePasswordMeter(password: string) {
  const { strength, score } = getPasswordStrength(password);
  // Update UI meter based on score (0-100)
}
```

### Error Handling

```typescript
import {
  AuthError,
  AuthErrorType,
  isAuthError,
  isTokenExpiredError,
  isUnauthorizedError,
  handleAuthError,
} from './utils/auth';

async function makeRequest() {
  try {
    const data = await apiClient.get('/protected-endpoint');
    return data;
  } catch (error) {
    // Check if it's an auth error
    if (isAuthError(error)) {
      console.error('Auth error type:', error.type);
      console.error('Status code:', error.statusCode);
    }

    // Check for specific error types
    if (isTokenExpiredError(error)) {
      // Redirect to login
      navigate('/login');
    }

    if (isUnauthorizedError(error)) {
      // Clear auth data and redirect
      clearAuthData();
      navigate('/login');
    }

    // Use helper to handle common cases
    const message = handleAuthError(error, {
      clearOnUnauthorized: true,
      clearOnExpired: true,
      logErrors: true,
    });

    // Show error to user
    showToast(message);
  }
}
```

### Custom API Requests

```typescript
import { apiRequest, getApiUrl } from './utils/api';

// Advanced request with custom options
async function customRequest() {
  try {
    const data = await apiRequest<CustomResponse>('/custom-endpoint', {
      method: 'POST',
      body: JSON.stringify({ data: 'value' }),
      timeout: 10000, // 10 second timeout
      retries: 3, // Retry up to 3 times
      skipAuth: false, // Include auth headers (default)
      skipRefresh: false, // Allow automatic token refresh (default)
    });

    return data;
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Public endpoint (no auth)
async function getPublicData() {
  const data = await apiRequest('/public/data', {
    skipAuth: true,
  });
  return data;
}
```

### Auth Headers for External Use

```typescript
import { getAuthHeaders, getStoredAuthHeaders } from './utils/auth';

// Get headers with specific token
const token = getAccessToken();
if (token) {
  const headers = getAuthHeaders(token);

  // Use with fetch
  fetch('/api/endpoint', {
    method: 'GET',
    headers,
  });
}

// Get headers with custom additions
const headers = getAuthHeaders(token, {
  'X-Custom-Header': 'value',
});

// Get headers from stored token
const headers = getStoredAuthHeaders();
if (headers) {
  // Make request
} else {
  // No token, redirect to login
}
```

---

## API Client Features

### Automatic Token Refresh

The API client automatically handles token refresh when receiving 401 errors:

```typescript
// This request will automatically refresh the token if it's expired
const data = await apiClient.get('/protected-data');
```

### Request Retry Logic

Failed requests are automatically retried for transient errors (5xx, timeouts):

```typescript
// Will retry up to 2 times with exponential backoff
const data = await apiClient.get('/endpoint');

// Custom retry count
const data = await apiClient.get('/endpoint', { retries: 5 });
```

### Request Timeout

All requests have a default 30-second timeout:

```typescript
// Use default timeout
const data = await apiClient.get('/endpoint');

// Custom timeout (10 seconds)
const data = await apiClient.get('/endpoint', { timeout: 10000 });
```

---

## Unit Testing Recommendations

### Testing `auth.ts` Functions

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveAccessToken,
  getAccessToken,
  removeAccessToken,
  clearAuthData,
  isTokenExpired,
  validatePassword,
  hasValidAuthState,
  AuthError,
  AuthErrorType,
} from './auth';

describe('Token Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save and retrieve access token', () => {
    const token = 'test-token-123';
    saveAccessToken(token);
    expect(getAccessToken()).toBe(token);
  });

  it('should remove access token', () => {
    saveAccessToken('test-token');
    removeAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('should clear all auth data', () => {
    saveAccessToken('token');
    saveRefreshToken('refresh');
    saveTokenExpiry(Date.now() + 3600000);
    saveUser({ id: '1', email: 'test@test.com', name: 'Test', createdAt: Date.now() });

    clearAuthData();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getTokenExpiry()).toBeNull();
    expect(getUser()).toBeNull();
  });

  it('should throw AuthError for invalid token', () => {
    expect(() => saveAccessToken('')).toThrow(AuthError);
    expect(() => saveAccessToken(null as any)).toThrow(AuthError);
  });
});

describe('Token Validation', () => {
  it('should detect expired tokens', () => {
    const expiredTime = Date.now() - 1000;
    expect(isTokenExpired(expiredTime)).toBe(true);
  });

  it('should detect valid tokens', () => {
    const futureTime = Date.now() + 3600000;
    expect(isTokenExpired(futureTime)).toBe(false);
  });

  it('should respect buffer time', () => {
    const almostExpired = Date.now() + 4 * 60 * 1000; // 4 minutes
    expect(isTokenExpired(almostExpired, 5)).toBe(true); // 5 minute buffer
    expect(isTokenExpired(almostExpired, 3)).toBe(false); // 3 minute buffer
  });

  it('should validate JWT token format', () => {
    expect(isValidTokenFormat('header.payload.signature')).toBe(true);
    expect(isValidTokenFormat('invalid')).toBe(false);
    expect(isValidTokenFormat('')).toBe(false);
  });

  it('should check valid auth state', () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test', createdAt: Date.now() };
    const token = 'header.payload.signature';
    const expiresAt = Date.now() + 3600000;

    saveUser(user);
    saveAccessToken(token);
    saveRefreshToken('refresh.token.here');
    saveTokenExpiry(expiresAt);

    expect(hasValidAuthState()).toBe(true);
  });
});

describe('Password Validation', () => {
  it('should validate strong passwords', () => {
    const result = validatePassword('MyP@ssw0rd123');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('strong');
  });

  it('should reject weak passwords', () => {
    const result = validatePassword('weak');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should check minimum length', () => {
    const result = validatePassword('Short1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  it('should require uppercase letters', () => {
    const result = validatePassword('myp@ssw0rd');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
  });

  it('should respect custom requirements', () => {
    const result = validatePassword('simple', {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: false,
      requireSpecialChars: false,
    });
    expect(result.isValid).toBe(true);
  });
});

describe('Auth Errors', () => {
  it('should create AuthError with correct properties', () => {
    const error = new AuthError('Test error', AuthErrorType.UNAUTHORIZED, 401);
    expect(error.message).toBe('Test error');
    expect(error.type).toBe(AuthErrorType.UNAUTHORIZED);
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('AuthError');
  });

  it('should detect auth errors', () => {
    const authError = new AuthError('Test', AuthErrorType.UNAUTHORIZED);
    const normalError = new Error('Test');

    expect(isAuthError(authError)).toBe(true);
    expect(isAuthError(normalError)).toBe(false);
  });
});
```

### Testing `api.ts` Functions

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient, getApiUrl } from './api';
import * as authUtils from './auth';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getApiUrl', () => {
    it('should construct correct API URL', () => {
      const url = getApiUrl('/auth/login');
      expect(url).toContain('/api/auth/login');
    });

    it('should handle URLs with and without leading slash', () => {
      expect(getApiUrl('/endpoint')).toBe(getApiUrl('endpoint'));
    });
  });

  describe('Authentication Methods', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', email: 'test@test.com', name: 'Test', createdAt: Date.now() },
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresAt: Date.now() + 3600000,
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.auth.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Invalid credentials' }),
      });

      await expect(
        apiClient.auth.login({
          email: 'test@test.com',
          password: 'wrong',
        })
      ).rejects.toThrow();
    });
  });

  describe('Request Methods', () => {
    it('should make GET request', async () => {
      const mockData = { id: '1', name: 'Test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: mockData }),
      });

      const result = await apiClient.get('/endpoint');
      expect(result).toEqual(mockData);
    });

    it('should make POST request', async () => {
      const postData = { name: 'New Item' };
      const mockResponse = { id: '1', ...postData };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: mockResponse }),
      });

      const result = await apiClient.post('/items', postData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token on 401 error', async () => {
      vi.spyOn(authUtils, 'getAccessToken').mockReturnValue('expired-token');
      vi.spyOn(authUtils, 'getRefreshToken').mockReturnValue('refresh-token');

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call returns 401
          return Promise.resolve({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Unauthorized' }),
          });
        } else if (callCount === 2) {
          // Refresh token call
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              success: true,
              data: {
                accessToken: 'new-token',
                expiresAt: Date.now() + 3600000,
              },
            }),
          });
        } else {
          // Retry with new token
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ success: true, data: { message: 'Success' } }),
          });
        }
      });

      const result = await apiClient.get('/protected');
      expect(result).toBeTruthy();
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on 500 error', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, data: { message: 'Success' } }),
        });
      });

      const result = await apiClient.get('/endpoint', { retries: 2 });
      expect(result).toBeTruthy();
      expect(callCount).toBe(2);
    });
  });
});
```

### Test Setup (Vitest Configuration)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
});
```

```typescript
// src/test/setup.ts
import { beforeAll, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
```

---

## Integration with React Components

### Using in a Login Form

```typescript
import React, { useState } from 'react';
import { apiClient } from '../utils/api';
import { saveAuthData, validatePassword } from '../utils/auth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.auth.login({ email, password });
      saveAuthData(response.user, response.tokens);
      // Redirect to dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Protected Route Component

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasValidAuthState } from '../utils/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!hasValidAuthState()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

## Environment Variables

Configure the API base URL in your `.env` file:

```env
VITE_API_URL=http://localhost:3001/api
```

For production:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Best Practices

1. **Always use the API client** - Don't make raw fetch calls for authenticated endpoints
2. **Handle errors properly** - Use try/catch and the error handling utilities
3. **Validate passwords** - Use `validatePassword()` before submitting registration/change password forms
4. **Check auth state** - Use `hasValidAuthState()` before rendering protected content
5. **Clear auth on logout** - Always call `clearAuthData()` when logging out
6. **Use TypeScript types** - Import and use the types from `types/auth.ts`
7. **Test your auth flows** - Write comprehensive tests for authentication logic

---

## Troubleshooting

### Token keeps expiring
- Check if the server is setting the correct expiry time
- Verify token refresh is working properly
- Check for clock skew between client and server

### 401 errors after login
- Ensure tokens are being saved correctly
- Check if the Authorization header is being sent
- Verify the token format is correct (Bearer token)

### Password validation too strict
- Customize password requirements using the `PasswordRequirements` parameter
- Adjust the validation rules in `validatePassword()`

### CORS errors
- Ensure the server has proper CORS configuration
- Check if the API URL is correct in environment variables

---

## License

MIT
