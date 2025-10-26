/**
 * API Client with Authentication
 *
 * This module provides a configured API client for making authenticated requests.
 * Features:
 * - Automatic authentication header injection
 * - Token refresh on 401 errors
 * - Request/response interceptors
 * - Typed error handling
 * - Retry logic for transient failures
 * - Integrated with token refresh manager for proactive token refresh
 *
 * @module utils/api
 */

import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  LoginResponse,
  RegisterResponse,
} from '../types/auth';
import {
  getAccessToken,
  clearAuthData,
  isValidTokenFormat,
  AuthError,
  AuthErrorType,
  createAuthErrorFromResponse,
} from './auth';
import {
  ensureValidToken,
  shouldRefreshToken,
  refreshToken as refreshTokenManager,
} from './tokenRefresh';

/**
 * API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
}

/**
 * Request options for API calls
 */
export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean; // Skip adding auth headers
  skipRefresh?: boolean; // Skip automatic token refresh on 401
  timeout?: number; // Request timeout in milliseconds
  retries?: number; // Number of retry attempts for transient failures
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // Base delay in milliseconds
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

// =============================================================================
// REQUEST UTILITIES
// =============================================================================

/**
 * Creates abort controller with timeout
 *
 * @param timeout - Timeout in milliseconds
 * @returns AbortController that will abort after timeout
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * Delays execution for specified milliseconds
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determines if a request should be retried
 *
 * @param response - Fetch response
 * @param config - Retry configuration
 * @returns true if request should be retried
 */
function shouldRetry(response: Response, config: RetryConfig): boolean {
  return config.retryableStatusCodes.includes(response.status);
}

/**
 * Builds full API URL from endpoint path
 *
 * @param endpoint - API endpoint path (e.g., '/auth/login')
 * @returns Full URL
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

/**
 * Prepares request headers with authentication
 *
 * @param options - Request options
 * @returns Headers object
 */
function prepareHeaders(options: ApiRequestOptions = {}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add authentication header if not skipped
  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token && isValidTokenFormat(token)) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// =============================================================================
// TOKEN REFRESH (Integrated with Token Refresh Manager)
// =============================================================================

/**
 * Refreshes the access token using the token refresh manager
 * This delegates to the centralized token refresh logic for consistency
 *
 * @returns New access token
 * @throws {AuthError} If refresh fails
 */
async function refreshAccessToken(): Promise<string> {
  try {
    return await refreshTokenManager();
  } catch (error) {
    // Ensure auth data is cleared on failure
    clearAuthData();
    throw error;
  }
}

// =============================================================================
// CORE API REQUEST FUNCTION
// =============================================================================

/**
 * Makes an authenticated API request with automatic retry and token refresh
 *
 * @param endpoint - API endpoint path
 * @param options - Request options
 * @returns Parsed response data
 * @throws {AuthError} On authentication errors
 * @throws {Error} On other errors
 *
 * Features:
 * - Proactive token refresh before expiration
 * - Automatic token refresh on 401 errors
 * - Request queuing during refresh
 * - Retry logic for transient failures
 * - Automatic request retry after token refresh
 *
 * @example
 * ```typescript
 * // GET request
 * const users = await apiRequest<User[]>('/users');
 *
 * // POST request
 * const newUser = await apiRequest<User>('/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
 * });
 *
 * // Request without auth
 * const publicData = await apiRequest('/public/data', {
 *   skipAuth: true,
 * });
 * ```
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    skipRefresh = false,
    timeout = API_TIMEOUT,
    retries = DEFAULT_RETRY_CONFIG.maxRetries,
    ...fetchOptions
  } = options;

  const url = getApiUrl(endpoint);
  let attemptCount = 0;

  // STEP 1: Proactive token refresh check (if not skipping auth)
  // This ensures we have a valid token before making the request
  if (!skipAuth && !skipRefresh) {
    try {
      if (shouldRefreshToken()) {
        console.debug('Token needs refresh before request, refreshing proactively...');
        await ensureValidToken();
      }
    } catch (error) {
      // If proactive refresh fails, clear auth and throw
      console.error('Proactive token refresh failed:', error);
      clearAuthData();
      throw error;
    }
  }

  // Retry loop
  while (attemptCount <= retries) {
    try {
      // Create timeout controller
      const controller = createTimeoutController(timeout);

      // Prepare request
      const requestOptions: RequestInit = {
        ...fetchOptions,
        headers: prepareHeaders({ ...options, skipAuth }),
        signal: controller.signal,
      };

      // Make request
      const response = await fetch(url, requestOptions);

      // STEP 2: Handle 401 Unauthorized - attempt token refresh
      // This is a fallback in case the proactive refresh didn't happen
      // or the token was invalidated server-side
      if (response.status === 401 && !skipAuth && !skipRefresh) {
        try {
          console.debug('Received 401 response, attempting token refresh...');

          // Try to refresh token using the token refresh manager
          // This will handle queuing if a refresh is already in progress
          const newToken = await refreshAccessToken();

          // Retry request with new token
          const retryHeaders = {
            ...requestOptions.headers,
            Authorization: `Bearer ${newToken}`,
          } as HeadersInit;

          console.debug('Retrying request with refreshed token...');
          const retryResponse = await fetch(url, {
            ...requestOptions,
            headers: retryHeaders,
          });

          if (!retryResponse.ok) {
            // If retry still fails, don't try to refresh again
            throw await createAuthErrorFromResponse(
              retryResponse,
              'Request failed after token refresh'
            );
          }

          console.debug('Request succeeded after token refresh');
          return parseResponse<T>(retryResponse);
        } catch (refreshError) {
          // If refresh fails, clear auth and throw
          console.error('Token refresh failed on 401 response:', refreshError);
          clearAuthData();
          throw refreshError;
        }
      }

      // Handle retryable errors (5xx, timeouts, etc.)
      if (shouldRetry(response, DEFAULT_RETRY_CONFIG) && attemptCount < retries) {
        attemptCount++;
        const delayMs = DEFAULT_RETRY_CONFIG.retryDelay * Math.pow(2, attemptCount - 1);
        console.warn(`Request failed (attempt ${attemptCount}/${retries + 1}), retrying in ${delayMs}ms...`);
        await delay(delayMs);
        continue;
      }

      // Handle error responses
      if (!response.ok) {
        throw await createAuthErrorFromResponse(response);
      }

      // Parse and return successful response
      return parseResponse<T>(response);
    } catch (error) {
      // Handle network errors and timeouts
      if (error instanceof Error && error.name === 'AbortError') {
        if (attemptCount < retries) {
          attemptCount++;
          console.warn(`Request timeout (attempt ${attemptCount}/${retries + 1}), retrying...`);
          continue;
        }
        throw new AuthError(
          `Request timeout after ${timeout}ms`,
          AuthErrorType.NETWORK_ERROR,
          undefined,
          error
        );
      }

      // If it's already an AuthError, rethrow
      if (error instanceof AuthError) {
        throw error;
      }

      // Wrap other errors
      throw new AuthError(
        error instanceof Error ? error.message : 'Request failed',
        AuthErrorType.NETWORK_ERROR,
        undefined,
        error
      );
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new AuthError('Maximum retries exceeded', AuthErrorType.NETWORK_ERROR);
}

/**
 * Parses API response based on content type
 *
 * @param response - Fetch response
 * @returns Parsed response data
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');

  // Handle JSON responses
  if (contentType?.includes('application/json')) {
    const result: ApiResponse<T> = await response.json();

    // If response has success field and data, return data
    if ('success' in result && result.success && 'data' in result) {
      return result.data as T;
    }

    // Otherwise return entire result
    return result as T;
  }

  // Handle text responses
  if (contentType?.includes('text/')) {
    return (await response.text()) as T;
  }

  // Handle blob responses
  return (await response.blob()) as T;
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * Makes a GET request
 *
 * @param endpoint - API endpoint
 * @param options - Request options
 * @returns Response data
 */
export async function get<T = unknown>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * Makes a POST request
 *
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param options - Request options
 * @returns Response data
 */
export async function post<T = unknown, D = unknown>(
  endpoint: string,
  data?: D,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Makes a PUT request
 *
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param options - Request options
 * @returns Response data
 */
export async function put<T = unknown, D = unknown>(
  endpoint: string,
  data?: D,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Makes a PATCH request
 *
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param options - Request options
 * @returns Response data
 */
export async function patch<T = unknown, D = unknown>(
  endpoint: string,
  data?: D,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Makes a DELETE request
 *
 * @param endpoint - API endpoint
 * @param options - Request options
 * @returns Response data
 */
export async function del<T = unknown>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

// =============================================================================
// AUTHENTICATION API ENDPOINTS
// =============================================================================

/**
 * Authenticates user with email and password
 *
 * @param credentials - Login credentials
 * @returns Login response with user and tokens
 *
 * @example
 * ```typescript
 * try {
 *   const { user, tokens } = await login({
 *     email: 'user@example.com',
 *     password: 'password123',
 *   });
 *   // Save tokens and update app state
 * } catch (error) {
 *   console.error('Login failed:', error);
 * }
 * ```
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await post<ApiResponse<LoginResponse>>('/auth/login', credentials, {
    skipAuth: true,
  });

  if (!response.success || !response.data) {
    throw new AuthError(
      response.message || 'Login failed',
      AuthErrorType.UNAUTHORIZED
    );
  }

  return response.data;
}

/**
 * Registers a new user
 *
 * @param credentials - Registration credentials
 * @returns Registration response with user and tokens
 *
 * @example
 * ```typescript
 * try {
 *   const { user, tokens } = await register({
 *     email: 'newuser@example.com',
 *     password: 'SecureP@ss123',
 *     name: 'New User',
 *   });
 *   // Save tokens and update app state
 * } catch (error) {
 *   console.error('Registration failed:', error);
 * }
 * ```
 */
export async function register(credentials: RegisterCredentials): Promise<RegisterResponse> {
  const response = await post<ApiResponse<RegisterResponse>>('/auth/register', credentials, {
    skipAuth: true,
  });

  if (!response.success || !response.data) {
    throw new AuthError(
      response.message || 'Registration failed',
      AuthErrorType.VALIDATION_ERROR
    );
  }

  return response.data;
}

/**
 * Logs out the current user
 * Clears local tokens and notifies server
 *
 * @example
 * ```typescript
 * await logout();
 * // Redirect to login page
 * ```
 */
export async function logout(): Promise<void> {
  try {
    // Notify server (don't throw on failure)
    await post('/auth/logout', undefined, {
      skipRefresh: true, // Don't try to refresh on logout
    }).catch(error => {
      console.warn('Logout API call failed:', error);
    });
  } finally {
    // Always clear local auth data
    clearAuthData();
  }
}

/**
 * Gets current authenticated user info
 *
 * @returns Current user data
 *
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * console.log('Current user:', user);
 * ```
 */
export async function getCurrentUser(): Promise<User> {
  const response = await get<ApiResponse<{ user: User }>>('/auth/me');

  if (!response.success || !response.data) {
    throw new AuthError(
      response.message || 'Failed to get user',
      AuthErrorType.UNAUTHORIZED
    );
  }

  return response.data.user;
}

/**
 * Updates user profile
 *
 * @param updates - Profile fields to update
 * @returns Updated user data
 *
 * @example
 * ```typescript
 * const updatedUser = await updateProfile({
 *   name: 'New Name',
 *   email: 'newemail@example.com',
 * });
 * ```
 */
export async function updateProfile(updates: {
  name?: string;
  email?: string;
}): Promise<User> {
  const response = await patch<ApiResponse<{ user: User }>>('/auth/profile', updates);

  if (!response.success || !response.data) {
    throw new AuthError(
      response.message || 'Failed to update profile',
      AuthErrorType.VALIDATION_ERROR
    );
  }

  return response.data.user;
}

/**
 * Changes user password
 *
 * @param currentPassword - Current password for verification
 * @param newPassword - New password
 *
 * @example
 * ```typescript
 * await changePassword('oldPassword123', 'newSecureP@ss456');
 * ```
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const response = await post<ApiResponse>('/auth/change-password', {
    currentPassword,
    newPassword,
  });

  if (!response.success) {
    throw new AuthError(
      response.message || 'Failed to change password',
      AuthErrorType.VALIDATION_ERROR
    );
  }
}

// =============================================================================
// API CLIENT INSTANCE (for direct use)
// =============================================================================

/**
 * API client instance with authentication
 * Provides convenient methods for making authenticated requests
 *
 * @example
 * ```typescript
 * // Use the client directly
 * import { apiClient } from './utils/api';
 *
 * // Make requests
 * const users = await apiClient.get('/users');
 * const newUser = await apiClient.post('/users', { name: 'John' });
 * ```
 */
export const apiClient = {
  request: apiRequest,
  get,
  post,
  put,
  patch,
  delete: del,

  // Auth methods
  auth: {
    login,
    register,
    logout,
    getCurrentUser,
    updateProfile,
    changePassword,
  },

  // Utility methods
  getUrl: getApiUrl,
};

/**
 * Default export for convenience
 */
export default apiClient;
