/**
 * Token Refresh Usage Examples
 *
 * This file demonstrates various ways to use the token refresh system.
 * These are examples only - not meant to be imported into the app.
 */

import React from 'react';
import {
  tokenRefreshManager,
  addEventListener,
  removeEventListener,
  setTokenRefreshConfig,
  shouldRefreshToken,
  hasValidToken,
  ensureValidToken,
  getRefreshState,
} from '../utils/tokenRefresh';
import { apiClient } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// =============================================================================
// EXAMPLE 1: Basic API Usage (Automatic Token Refresh)
// =============================================================================

/**
 * This is the most common use case - just use the API client
 * Token refresh happens automatically behind the scenes
 */
async function example1_BasicAPIUsage() {
  try {
    // Token refresh happens automatically if needed
    const users = await apiClient.get('/users');
    console.log('Users:', users);

    // Multiple requests - token refresh is handled once for all
    const [products, orders] = await Promise.all([
      apiClient.get('/products'),
      apiClient.get('/orders'),
    ]);
    console.log('Products:', products, 'Orders:', orders);
  } catch (error) {
    console.error('API error:', error);
    // If token refresh fails, error is thrown here
  }
}

// =============================================================================
// EXAMPLE 2: Manual Token Validation
// =============================================================================

/**
 * Check token status before performing actions
 */
async function example2_ManualTokenValidation() {
  // Check if we have a valid token
  if (!hasValidToken()) {
    console.log('No valid token, user needs to log in');
    return;
  }

  // Check if token needs refresh soon
  if (shouldRefreshToken()) {
    console.log('Token will expire soon, refreshing proactively...');
    try {
      await tokenRefreshManager.refreshToken();
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Handle error - redirect to login, show message, etc.
    }
  }

  // Continue with authenticated operations
  const data = await apiClient.get('/api/data');
  console.log('Data:', data);
}

// =============================================================================
// EXAMPLE 3: Using ensureValidToken
// =============================================================================

/**
 * Ensure we have a valid token before critical operations
 */
async function example3_EnsureValidToken() {
  try {
    // This will automatically refresh if needed
    const token = await ensureValidToken();
    console.log('Valid token obtained:', token);

    // Now we can safely make API calls
    // or use the token directly
    const response = await fetch('/api/critical-operation', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to ensure valid token:', error);
    // User needs to re-login
    throw error;
  }
}

// =============================================================================
// EXAMPLE 4: Event Listeners for State Changes
// =============================================================================

/**
 * Listen for token refresh events to update UI or perform actions
 */
function example4_EventListeners() {
  // Success listener
  const handleRefreshSuccess = (data: unknown) => {
    console.log('Token refreshed successfully:', data);
    // Update UI - show success toast
    // showToast('Session refreshed', 'success');
  };

  // Failure listener
  const handleRefreshFailure = (error: unknown) => {
    console.error('Token refresh failed:', error);
    // Update UI - show error message
    // showToast('Session expired. Please log in again.', 'error');
    // Redirect to login
    // window.location.href = '/login';
  };

  // Token expired listener
  const handleTokenExpired = () => {
    console.log('Token has expired');
    // Clean up application state
    // clearUserData();
    // Show login modal
    // showLoginModal();
  };

  // Schedule listener
  const handleScheduleRefresh = (data: unknown) => {
    console.log('Token refresh scheduled:', data);
    // Maybe show next refresh time in UI
  };

  // Register listeners
  addEventListener('refreshSuccess', handleRefreshSuccess);
  addEventListener('refreshFailure', handleRefreshFailure);
  addEventListener('tokenExpired', handleTokenExpired);
  addEventListener('scheduleRefresh', handleScheduleRefresh);

  // Cleanup function (call when component unmounts)
  return () => {
    removeEventListener('refreshSuccess', handleRefreshSuccess);
    removeEventListener('refreshFailure', handleRefreshFailure);
    removeEventListener('tokenExpired', handleTokenExpired);
    removeEventListener('scheduleRefresh', handleScheduleRefresh);
  };
}

// =============================================================================
// EXAMPLE 5: Custom Configuration
// =============================================================================

/**
 * Customize token refresh behavior
 */
function example5_CustomConfiguration() {
  // Configure refresh behavior
  setTokenRefreshConfig({
    // Refresh 10 minutes before expiry instead of default 5
    refreshBufferMinutes: 10,

    // Allow up to 5 retry attempts instead of default 3
    maxRetries: 5,

    // Use 2 second base delay for retries
    retryDelayMs: 2000,

    // Use exponential backoff
    exponentialBackoff: true,

    // Custom refresh endpoint
    refreshEndpoint: '/api/v2/auth/refresh',
  });

  console.log('Token refresh configured');
}

// =============================================================================
// EXAMPLE 6: React Component Integration
// =============================================================================

/**
 * Example React component using token refresh
 *
 * Note: This is a TypeScript example showing the pattern.
 * In a real .tsx file, this JSX would work fine.
 */
function Example6_ReactComponent() {
  const { user, isAuthenticated, error } = useAuth();
  const [data, setData] = React.useState<unknown>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Setup event listeners
    const handleRefreshFailure = () => {
      // Show error notification
      alert('Your session has expired. Please log in again.');
    };

    addEventListener('refreshFailure', handleRefreshFailure);

    // Cleanup
    return () => {
      removeEventListener('refreshFailure', handleRefreshFailure);
    };
  }, []);

  const fetchData = async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Token refresh happens automatically
      const result = await apiClient.get('/api/data');
      setData(result);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  // Example component logic - in real .tsx file this would return JSX
  console.log('Component state:', { user, isAuthenticated, error, data, loading });

  // Simulate component behavior
  return {
    fetchData,
    user,
    isAuthenticated,
    error,
    data,
    loading,
  };
}

// =============================================================================
// EXAMPLE 7: Monitoring Refresh State
// =============================================================================

/**
 * Monitor the current state of token refresh
 */
function example7_MonitorRefreshState() {
  const state = getRefreshState();

  console.log('Refresh State:', {
    isRefreshing: state.isRefreshing,
    queueLength: state.queueLength,
    failureCount: state.failureCount,
    lastRefreshTime: state.lastRefreshTime
      ? new Date(state.lastRefreshTime).toISOString()
      : 'Never',
    hasScheduledRefresh: state.hasScheduledRefresh,
  });

  // Example: Show refresh status in UI
  if (state.isRefreshing) {
    console.log('Token refresh in progress...');
  }

  if (state.queueLength > 0) {
    console.log(`${state.queueLength} requests queued during refresh`);
  }

  if (state.failureCount > 0) {
    console.warn(`${state.failureCount} consecutive refresh failures`);
  }
}

// =============================================================================
// EXAMPLE 8: Handling Concurrent Requests
// =============================================================================

/**
 * Multiple concurrent requests - single token refresh
 */
async function example8_ConcurrentRequests() {
  // All these requests might trigger token refresh
  // But only ONE refresh operation will happen
  // All requests will wait for the same refresh to complete
  try {
    const results = await Promise.all([
      apiClient.get('/api/users'),
      apiClient.get('/api/products'),
      apiClient.get('/api/orders'),
      apiClient.get('/api/settings'),
      apiClient.get('/api/notifications'),
    ]);

    console.log('All requests completed:', results);
  } catch (error) {
    console.error('One or more requests failed:', error);
  }
}

// =============================================================================
// EXAMPLE 9: Testing Token Refresh
// =============================================================================

/**
 * Functions for testing token refresh behavior
 */
const example9_TestingHelpers = {
  // Force an immediate token refresh
  async forceRefresh() {
    console.log('Forcing token refresh...');
    try {
      await tokenRefreshManager.refreshToken();
      console.log('Token refresh successful');
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  },

  // Check if token needs refresh
  checkTokenStatus() {
    const hasValid = hasValidToken();
    const needsRefresh = shouldRefreshToken();

    console.log('Token Status:', {
      hasValidToken: hasValid,
      needsRefresh: needsRefresh,
      state: getRefreshState(),
    });
  },

  // Simulate token expiration (for testing)
  simulateTokenExpiration() {
    console.warn('Simulating token expiration...');
    // Set token expiry to past time
    localStorage.setItem('grocery_auth_token_expiry', String(Date.now() - 1000));
    console.log('Token marked as expired. Next API call should trigger refresh.');
  },

  // Reset refresh state (for testing)
  resetState() {
    console.log('Resetting refresh state...');
    tokenRefreshManager.resetState();
    console.log('State reset complete');
  },
};

// =============================================================================
// EXAMPLE 10: Advanced Error Handling
// =============================================================================

/**
 * Handle different types of token refresh errors
 */
async function example10_AdvancedErrorHandling() {
  try {
    const data = await apiClient.get('/api/protected-resource');
    console.log('Data:', data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Check error type
      if (error.message.includes('expired') || error.message.includes('unauthorized')) {
        console.error('Authentication error - user needs to log in');
        // Redirect to login
        // window.location.href = '/login';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        console.error('Network error - retry or show offline message');
        // Show offline message
        // showOfflineMessage();
      } else {
        console.error('Unknown error:', error.message);
        // Show generic error message
        // showErrorMessage('Something went wrong. Please try again.');
      }
    }
  }
}

// =============================================================================
// EXAMPLE 11: Integration with Axios (if migrating from Axios)
// =============================================================================

/**
 * If you're using Axios, here's how to add interceptors
 * Note: The current implementation uses fetch, but this shows the pattern
 */
/*
import axios from 'axios';
import { ensureValidToken } from '../utils/tokenRefresh';

function example11_AxiosIntegration() {
  // Request interceptor - ensure valid token before request
  axios.interceptors.request.use(
    async (config) => {
      try {
        const token = await ensureValidToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        return Promise.reject(error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle 401 errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const token = await tokenRefreshManager.refreshToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}
*/

// =============================================================================
// EXAMPLE 12: Cleanup on Logout
// =============================================================================

/**
 * Proper cleanup when user logs out
 */
async function example12_LogoutCleanup() {
  try {
    // Call logout API
    await apiClient.auth.logout();

    // Cleanup is handled automatically by AuthContext and token refresh manager
    // But if you need to do manual cleanup:
    tokenRefreshManager.cleanup();

    console.log('Logged out successfully');

    // Redirect to login page
    // window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Still cleanup locally even if API call fails
    tokenRefreshManager.cleanup();
  }
}

// =============================================================================
// Export examples for testing in console
// =============================================================================

export const examples = {
  example1_BasicAPIUsage,
  example2_ManualTokenValidation,
  example3_EnsureValidToken,
  example4_EventListeners,
  example5_CustomConfiguration,
  example6_ReactComponent: Example6_ReactComponent,
  example7_MonitorRefreshState,
  example8_ConcurrentRequests,
  example9_TestingHelpers,
  example10_AdvancedErrorHandling,
  example12_LogoutCleanup,
};

// Make available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).tokenRefreshExamples = examples;
  console.log('Token refresh examples available at: window.tokenRefreshExamples');
}

/**
 * Quick Start Guide
 *
 * 1. Basic usage (automatic):
 *    ```typescript
 *    const data = await apiClient.get('/api/data');
 *    ```
 *
 * 2. Manual check:
 *    ```typescript
 *    if (shouldRefreshToken()) {
 *      await tokenRefreshManager.refreshToken();
 *    }
 *    ```
 *
 * 3. Event listeners:
 *    ```typescript
 *    addEventListener('refreshFailure', () => {
 *      window.location.href = '/login';
 *    });
 *    ```
 *
 * 4. Configuration:
 *    ```typescript
 *    setTokenRefreshConfig({
 *      refreshBufferMinutes: 10,
 *      maxRetries: 5,
 *    });
 *    ```
 *
 * 5. React component:
 *    ```typescript
 *    const { isAuthenticated, error } = useAuth();
 *    // Token refresh happens automatically
 *    ```
 */
