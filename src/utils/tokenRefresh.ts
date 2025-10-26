/**
 * Token Refresh Manager
 *
 * This module provides automatic JWT token refresh functionality with:
 * - Proactive token refresh before expiration
 * - Request queuing during refresh operations
 * - Automatic retry logic for failed refreshes
 * - Event-based notifications for auth state changes
 * - Thread-safe refresh operations (prevents concurrent refreshes)
 *
 * Features:
 * - Check token expiration before API calls
 * - Automatically refresh tokens when near expiry
 * - Handle refresh failures (logout user)
 * - Queue requests during refresh
 * - Retry failed requests after refresh
 *
 * @module utils/tokenRefresh
 */

import {
  getAccessToken,
  getRefreshToken,
  getTokenExpiry,
  saveAccessToken,
  saveTokenExpiry,
  clearAuthData,
  isTokenExpired,
  isValidTokenFormat,
  AuthError,
  AuthErrorType,
  createAuthErrorFromResponse,
} from './auth';

/**
 * Configuration for token refresh behavior
 */
export interface TokenRefreshConfig {
  // Time before expiry (in minutes) to trigger proactive refresh
  refreshBufferMinutes: number;

  // Maximum number of retry attempts for failed refreshes
  maxRetries: number;

  // Base delay between retries (in milliseconds)
  retryDelayMs: number;

  // Whether to use exponential backoff for retries
  exponentialBackoff: boolean;

  // API endpoint for token refresh
  refreshEndpoint: string;
}

/**
 * Default configuration
 */
export const DEFAULT_REFRESH_CONFIG: TokenRefreshConfig = {
  refreshBufferMinutes: 5, // Refresh 5 minutes before expiry
  maxRetries: 3,
  retryDelayMs: 1000,
  exponentialBackoff: true,
  refreshEndpoint: '/api/auth/refresh',
};

/**
 * Token refresh state
 */
interface RefreshState {
  // Whether a refresh is currently in progress
  isRefreshing: boolean;

  // Promise for the current refresh operation (if any)
  refreshPromise: Promise<string> | null;

  // Queue of pending requests waiting for refresh
  queue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }>;

  // Timer ID for scheduled refresh
  scheduledRefreshTimer: NodeJS.Timeout | null;

  // Number of consecutive refresh failures
  failureCount: number;

  // Timestamp of last successful refresh
  lastRefreshTime: number | null;
}

/**
 * Global refresh state
 */
const refreshState: RefreshState = {
  isRefreshing: false,
  refreshPromise: null,
  queue: [],
  scheduledRefreshTimer: null,
  failureCount: 0,
  lastRefreshTime: null,
};

/**
 * Configuration (can be updated via setTokenRefreshConfig)
 */
let config: TokenRefreshConfig = { ...DEFAULT_REFRESH_CONFIG };

/**
 * Event listeners for token refresh events
 */
type TokenRefreshEventType = 'refreshSuccess' | 'refreshFailure' | 'tokenExpired' | 'scheduleRefresh';
type TokenRefreshEventListener = (data?: unknown) => void;

const eventListeners: Map<TokenRefreshEventType, Set<TokenRefreshEventListener>> = new Map([
  ['refreshSuccess', new Set()],
  ['refreshFailure', new Set()],
  ['tokenExpired', new Set()],
  ['scheduleRefresh', new Set()],
]);

// =============================================================================
// EVENT SYSTEM
// =============================================================================

/**
 * Adds an event listener for token refresh events
 *
 * @param event - Event type to listen for
 * @param listener - Callback function to execute on event
 *
 * @example
 * ```typescript
 * addEventListener('refreshSuccess', (data) => {
 *   console.log('Token refreshed successfully');
 * });
 *
 * addEventListener('refreshFailure', (error) => {
 *   console.error('Token refresh failed:', error);
 *   // Redirect to login page
 *   window.location.href = '/login';
 * });
 * ```
 */
export function addEventListener(
  event: TokenRefreshEventType,
  listener: TokenRefreshEventListener
): void {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.add(listener);
  }
}

/**
 * Removes an event listener
 *
 * @param event - Event type
 * @param listener - Callback function to remove
 */
export function removeEventListener(
  event: TokenRefreshEventType,
  listener: TokenRefreshEventListener
): void {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.delete(listener);
  }
}

/**
 * Dispatches an event to all registered listeners
 *
 * @param event - Event type to dispatch
 * @param data - Optional data to pass to listeners
 */
function dispatchEvent(event: TokenRefreshEventType, data?: unknown): void {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in token refresh event listener (${event}):`, error);
      }
    });
  }
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Updates the token refresh configuration
 *
 * @param newConfig - Partial configuration to merge with defaults
 *
 * @example
 * ```typescript
 * setTokenRefreshConfig({
 *   refreshBufferMinutes: 10, // Refresh 10 minutes before expiry
 *   maxRetries: 5,
 * });
 * ```
 */
export function setTokenRefreshConfig(newConfig: Partial<TokenRefreshConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Gets the current token refresh configuration
 *
 * @returns Current configuration
 */
export function getTokenRefreshConfig(): Readonly<TokenRefreshConfig> {
  return { ...config };
}

// =============================================================================
// TOKEN VALIDATION
// =============================================================================

/**
 * Checks if the current token needs to be refreshed
 * Returns true if token is expired or will expire within the buffer time
 *
 * @returns true if token needs refresh
 *
 * @example
 * ```typescript
 * if (shouldRefreshToken()) {
 *   await refreshToken();
 * }
 * ```
 */
export function shouldRefreshToken(): boolean {
  const expiresAt = getTokenExpiry();

  if (!expiresAt) {
    // No expiry stored, can't determine if refresh is needed
    return false;
  }

  // Check if token is expired or will expire within buffer time
  return isTokenExpired(expiresAt, config.refreshBufferMinutes);
}

/**
 * Checks if the current access token is valid and not expired
 *
 * @returns true if token is valid and not expired
 */
export function hasValidToken(): boolean {
  const token = getAccessToken();
  const expiresAt = getTokenExpiry();

  if (!token || !expiresAt) {
    return false;
  }

  if (!isValidTokenFormat(token)) {
    return false;
  }

  // Check if token is expired (no buffer)
  return !isTokenExpired(expiresAt, 0);
}

// =============================================================================
// REFRESH SCHEDULING
// =============================================================================

/**
 * Cancels any scheduled token refresh
 */
export function cancelScheduledRefresh(): void {
  if (refreshState.scheduledRefreshTimer) {
    clearTimeout(refreshState.scheduledRefreshTimer);
    refreshState.scheduledRefreshTimer = null;
  }
}

/**
 * Schedules automatic token refresh before expiration
 * Cancels any existing scheduled refresh
 *
 * @param expiresAt - Token expiry timestamp (milliseconds)
 *
 * @example
 * ```typescript
 * // After login or token refresh
 * const { accessToken, expiresAt } = loginResponse.tokens;
 * scheduleTokenRefresh(expiresAt);
 * ```
 */
export function scheduleTokenRefresh(expiresAt: number): void {
  cancelScheduledRefresh();

  const now = Date.now();
  const expiresIn = expiresAt - now;

  // Calculate when to refresh (buffer minutes before expiry)
  const refreshIn = Math.max(
    0,
    expiresIn - config.refreshBufferMinutes * 60 * 1000
  );

  // Schedule the refresh
  refreshState.scheduledRefreshTimer = setTimeout(() => {
    refreshToken().catch(error => {
      console.error('Scheduled token refresh failed:', error);
      dispatchEvent('refreshFailure', error);
    });
  }, refreshIn);

  const refreshDate = new Date(now + refreshIn);
  console.debug(`Token refresh scheduled for ${refreshDate.toISOString()}`);
  dispatchEvent('scheduleRefresh', { refreshAt: refreshDate, expiresAt: new Date(expiresAt) });
}

// =============================================================================
// CORE REFRESH LOGIC
// =============================================================================

/**
 * Delays execution for specified milliseconds with exponential backoff
 *
 * @param retryAttempt - Current retry attempt number (0-based)
 * @returns Promise that resolves after delay
 */
function getRetryDelay(retryAttempt: number): number {
  if (config.exponentialBackoff) {
    // Exponential backoff: delay * (2 ^ retryAttempt)
    return config.retryDelayMs * Math.pow(2, retryAttempt);
  }
  return config.retryDelayMs;
}

/**
 * Performs the actual token refresh API call
 *
 * @param retryAttempt - Current retry attempt number
 * @returns New access token
 * @throws {AuthError} If refresh fails
 */
async function performRefresh(retryAttempt: number = 0): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new AuthError('No refresh token available', AuthErrorType.REFRESH_FAILED);
  }

  try {
    // Build the full URL
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const url = config.refreshEndpoint.startsWith('http')
      ? config.refreshEndpoint
      : `${apiBaseUrl}${config.refreshEndpoint.startsWith('/') ? config.refreshEndpoint.slice(4) : config.refreshEndpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Handle refresh token expiration or invalidation
      if (response.status === 401 || response.status === 403) {
        throw await createAuthErrorFromResponse(
          response,
          'Refresh token expired or invalid'
        );
      }

      // Handle retryable errors
      if (response.status >= 500 && retryAttempt < config.maxRetries) {
        const delay = getRetryDelay(retryAttempt);
        console.warn(
          `Token refresh failed (attempt ${retryAttempt + 1}/${config.maxRetries + 1}), ` +
          `retrying in ${delay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        return performRefresh(retryAttempt + 1);
      }

      throw await createAuthErrorFromResponse(response, 'Token refresh failed');
    }

    const result = await response.json();

    // Handle different response formats
    let accessToken: string;
    let expiresAt: number;

    if (result.success && result.data) {
      // Format: { success: true, data: { accessToken, expiresAt } }
      accessToken = result.data.accessToken;
      expiresAt = result.data.expiresAt;
    } else if (result.accessToken) {
      // Format: { accessToken, expiresAt }
      accessToken = result.accessToken;
      expiresAt = result.expiresAt;
    } else {
      throw new AuthError(
        'Invalid refresh response format',
        AuthErrorType.REFRESH_FAILED
      );
    }

    if (!accessToken || !expiresAt) {
      throw new AuthError(
        'Missing access token or expiry in refresh response',
        AuthErrorType.REFRESH_FAILED
      );
    }

    // Save new token
    saveAccessToken(accessToken);
    saveTokenExpiry(expiresAt);

    // Schedule next refresh
    scheduleTokenRefresh(expiresAt);

    // Update state
    refreshState.failureCount = 0;
    refreshState.lastRefreshTime = Date.now();

    return accessToken;
  } catch (error) {
    // If it's a refresh token expiration, don't retry
    if (error instanceof AuthError &&
        (error.type === AuthErrorType.UNAUTHORIZED ||
         error.statusCode === 401 ||
         error.statusCode === 403)) {
      throw error;
    }

    // Retry on network errors
    if (retryAttempt < config.maxRetries) {
      const delay = getRetryDelay(retryAttempt);
      console.warn(
        `Token refresh error (attempt ${retryAttempt + 1}/${config.maxRetries + 1}), ` +
        `retrying in ${delay}ms...`,
        error
      );
      await new Promise(resolve => setTimeout(resolve, delay));
      return performRefresh(retryAttempt + 1);
    }

    throw error instanceof AuthError
      ? error
      : new AuthError(
          'Token refresh failed',
          AuthErrorType.REFRESH_FAILED,
          undefined,
          error
        );
  }
}

/**
 * Refreshes the access token using the refresh token
 * Handles concurrent refresh requests by queuing them
 *
 * This function is thread-safe and ensures only one refresh happens at a time.
 * If a refresh is already in progress, subsequent calls will wait for the
 * same refresh operation to complete.
 *
 * @returns Promise that resolves with the new access token
 * @throws {AuthError} If refresh fails after all retries
 *
 * @example
 * ```typescript
 * try {
 *   const newToken = await refreshToken();
 *   console.log('Token refreshed successfully');
 *   // Use newToken for subsequent requests
 * } catch (error) {
 *   if (error instanceof AuthError) {
 *     console.error('Refresh failed:', error.message);
 *     // Redirect to login
 *   }
 * }
 * ```
 */
export async function refreshToken(): Promise<string> {
  // If already refreshing, add to queue and wait
  if (refreshState.isRefreshing && refreshState.refreshPromise) {
    return new Promise<string>((resolve, reject) => {
      refreshState.queue.push({ resolve, reject });
    });
  }

  // Mark as refreshing
  refreshState.isRefreshing = true;

  // Create and store the refresh promise
  refreshState.refreshPromise = performRefresh()
    .then(accessToken => {
      // Resolve all queued requests
      const queue = [...refreshState.queue];
      refreshState.queue = [];
      queue.forEach(({ resolve }) => resolve(accessToken));

      // Dispatch success event
      dispatchEvent('refreshSuccess', { accessToken });

      return accessToken;
    })
    .catch(error => {
      // Reject all queued requests
      const queue = [...refreshState.queue];
      refreshState.queue = [];
      queue.forEach(({ reject }) => reject(error));

      // Increment failure count
      refreshState.failureCount++;

      // Clear auth data on refresh failure
      clearAuthData();
      cancelScheduledRefresh();

      // Dispatch failure event
      dispatchEvent('refreshFailure', error);
      dispatchEvent('tokenExpired');

      throw error;
    })
    .finally(() => {
      // Reset refreshing state
      refreshState.isRefreshing = false;
      refreshState.refreshPromise = null;
    });

  return refreshState.refreshPromise;
}

/**
 * Ensures a valid token is available, refreshing if necessary
 * This is the main function to call before making authenticated API requests
 *
 * @returns Promise that resolves with a valid access token
 * @throws {AuthError} If no token available or refresh fails
 *
 * @example
 * ```typescript
 * // Before making an API request
 * try {
 *   const token = await ensureValidToken();
 *   const response = await fetch('/api/data', {
 *     headers: {
 *       'Authorization': `Bearer ${token}`,
 *     },
 *   });
 * } catch (error) {
 *   // Handle token error (likely need to re-login)
 * }
 * ```
 */
export async function ensureValidToken(): Promise<string> {
  const token = getAccessToken();

  // No token at all
  if (!token) {
    throw new AuthError('No access token available', AuthErrorType.INVALID_TOKEN);
  }

  // Check if token needs refresh
  if (shouldRefreshToken()) {
    console.debug('Token needs refresh, refreshing...');
    return await refreshToken();
  }

  // Token is valid
  return token;
}

// =============================================================================
// REFRESH STATE UTILITIES
// =============================================================================

/**
 * Gets the current refresh state (for debugging/monitoring)
 *
 * @returns Current refresh state information
 */
export function getRefreshState(): Readonly<{
  isRefreshing: boolean;
  queueLength: number;
  failureCount: number;
  lastRefreshTime: number | null;
  hasScheduledRefresh: boolean;
}> {
  return {
    isRefreshing: refreshState.isRefreshing,
    queueLength: refreshState.queue.length,
    failureCount: refreshState.failureCount,
    lastRefreshTime: refreshState.lastRefreshTime,
    hasScheduledRefresh: refreshState.scheduledRefreshTimer !== null,
  };
}

/**
 * Resets the refresh state
 * Useful for testing or when manually clearing auth state
 */
export function resetRefreshState(): void {
  cancelScheduledRefresh();
  refreshState.isRefreshing = false;
  refreshState.refreshPromise = null;
  refreshState.queue = [];
  refreshState.failureCount = 0;
  refreshState.lastRefreshTime = null;
}

// =============================================================================
// INITIALIZATION & CLEANUP
// =============================================================================

/**
 * Initializes the token refresh manager
 * Checks current token and schedules refresh if needed
 *
 * Call this once when your app initializes (after auth state is loaded)
 *
 * @example
 * ```typescript
 * // In your app initialization
 * initializeTokenRefresh();
 * ```
 */
export function initializeTokenRefresh(): void {
  const expiresAt = getTokenExpiry();

  if (expiresAt) {
    // Check if token is already expired
    if (isTokenExpired(expiresAt, 0)) {
      console.debug('Token is expired, attempting refresh...');
      refreshToken().catch(error => {
        console.error('Initial token refresh failed:', error);
        dispatchEvent('tokenExpired');
      });
    } else {
      // Schedule refresh
      scheduleTokenRefresh(expiresAt);
    }
  }
}

/**
 * Cleans up token refresh resources
 * Call this when logging out or unmounting the app
 *
 * @example
 * ```typescript
 * // On logout
 * cleanupTokenRefresh();
 * clearAuthData();
 * ```
 */
export function cleanupTokenRefresh(): void {
  resetRefreshState();

  // Clear all event listeners
  eventListeners.forEach(listeners => listeners.clear());
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Token refresh manager instance with all utilities
 */
export const tokenRefreshManager = {
  // Core functions
  refreshToken,
  ensureValidToken,
  shouldRefreshToken,
  hasValidToken,

  // Scheduling
  scheduleTokenRefresh,
  cancelScheduledRefresh,

  // Configuration
  setConfig: setTokenRefreshConfig,
  getConfig: getTokenRefreshConfig,

  // Events
  addEventListener,
  removeEventListener,

  // State
  getState: getRefreshState,
  resetState: resetRefreshState,

  // Lifecycle
  initialize: initializeTokenRefresh,
  cleanup: cleanupTokenRefresh,
};

/**
 * Default export
 */
export default tokenRefreshManager;
