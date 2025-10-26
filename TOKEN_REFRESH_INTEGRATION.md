# Token Refresh Integration Guide

This document explains the automatic token refresh implementation for handling JWT expiration gracefully in the grocery app.

## Overview

The token refresh system provides:

1. **Proactive Token Refresh** - Automatically refreshes tokens before they expire
2. **Request Queueing** - Queues API requests during refresh operations
3. **Automatic Retry** - Retries failed requests after successful token refresh
4. **Graceful Degradation** - Logs out users when refresh tokens expire
5. **Event System** - Notifies components of auth state changes
6. **Thread Safety** - Prevents concurrent refresh operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Components use API client - token refresh is transparent)  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Client (api.ts)                       │
│  • Checks if token needs refresh before each request        │
│  • Handles 401 errors with automatic token refresh          │
│  • Retries failed requests with new token                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Token Refresh Manager (tokenRefresh.ts)         │
│  • Central refresh logic with queue management              │
│  • Prevents concurrent refreshes                            │
│  • Schedules automatic refresh before expiry                │
│  • Event system for state changes                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 AuthContext (AuthContext.tsx)                │
│  • Integrates with token refresh manager                    │
│  • Updates React state on refresh events                    │
│  • Handles logout on refresh failure                        │
└─────────────────────────────────────────────────────────────┘
```

## Files Modified/Created

### 1. **src/utils/tokenRefresh.ts** (NEW)

Central token refresh manager with:

- **Token validation** - Check expiration and format
- **Refresh scheduling** - Automatic refresh before expiry (default: 5 minutes before)
- **Queue management** - Single refresh operation for multiple concurrent requests
- **Event system** - Notify listeners of refresh success/failure
- **Configuration** - Customizable refresh behavior

Key Functions:
```typescript
// Ensure valid token (refresh if needed)
const token = await ensureValidToken();

// Check if refresh needed
if (shouldRefreshToken()) {
  await refreshToken();
}

// Schedule automatic refresh
scheduleTokenRefresh(expiresAt);

// Listen for events
addEventListener('refreshSuccess', () => {
  console.log('Token refreshed!');
});
```

### 2. **src/utils/api.ts** (UPDATED)

Enhanced API client with:

- **Proactive refresh** - Checks token before making requests
- **Automatic retry** - Retries 401 requests after refresh
- **Queue integration** - Uses token refresh manager's queue

Changes:
- Added proactive token check in `apiRequest()`
- Integrated with token refresh manager
- Improved error handling and logging

### 3. **src/contexts/AuthContext.tsx** (UPDATED)

AuthContext integration:

- **Event listeners** - Reacts to token refresh events
- **State updates** - Updates React state on refresh
- **Initialization** - Sets up token refresh on app load
- **Cleanup** - Proper cleanup on unmount

Changes:
- Delegates refresh to token refresh manager
- Listens for refresh events to update state
- Initializes token refresh manager on mount

## How It Works

### Flow 1: Proactive Token Refresh

```
1. User makes API request
2. API client checks token expiry
3. If token expires within 5 minutes:
   a. API client calls ensureValidToken()
   b. Token refresh manager refreshes token
   c. New token saved to storage
   d. Event dispatched to notify AuthContext
   e. AuthContext updates React state
4. API request proceeds with valid token
```

### Flow 2: Reactive Token Refresh (401 Response)

```
1. User makes API request with expired token
2. Server responds with 401 Unauthorized
3. API client intercepts 401 response
4. API client calls token refresh manager
5. Token refresh manager:
   a. Checks if refresh already in progress
   b. If yes: queues the request
   c. If no: starts refresh operation
6. Refresh completes:
   a. New token saved to storage
   b. All queued requests resolved with new token
   c. Events dispatched
7. Original request retried with new token
8. Response returned to caller
```

### Flow 3: Scheduled Automatic Refresh

```
1. After login/token refresh:
   a. Token expiry timestamp saved
   b. Refresh scheduled for (expiresAt - 5 minutes)
2. When scheduled time arrives:
   a. Token refresh manager automatically refreshes
   b. New token saved to storage
   c. New refresh scheduled
   d. Events dispatched to AuthContext
3. This continues until logout or refresh failure
```

### Flow 4: Refresh Failure (Logout)

```
1. Refresh token expires or becomes invalid
2. Token refresh manager attempts refresh
3. Server responds with 401/403
4. Token refresh manager:
   a. Clears all auth data from storage
   b. Rejects all queued requests
   c. Dispatches 'refreshFailure' and 'tokenExpired' events
5. AuthContext receives events:
   a. Updates state to logged out
   b. Displays "Session expired" message
6. User redirected to login
```

## Configuration

### Token Refresh Config

```typescript
import { setTokenRefreshConfig } from './utils/tokenRefresh';

setTokenRefreshConfig({
  refreshBufferMinutes: 10,      // Refresh 10 min before expiry (default: 5)
  maxRetries: 5,                 // Max retry attempts (default: 3)
  retryDelayMs: 2000,            // Retry delay (default: 1000ms)
  exponentialBackoff: true,      // Use exponential backoff (default: true)
  refreshEndpoint: '/api/auth/refresh', // Refresh endpoint
});
```

### Event Listeners

```typescript
import { addEventListener } from './utils/tokenRefresh';

// Listen for successful refresh
addEventListener('refreshSuccess', (data) => {
  console.log('Token refreshed:', data);
  // Update UI, show notification, etc.
});

// Listen for refresh failure
addEventListener('refreshFailure', (error) => {
  console.error('Refresh failed:', error);
  // Redirect to login, show error, etc.
  window.location.href = '/login';
});

// Listen for token expiration
addEventListener('tokenExpired', () => {
  console.log('Token expired');
  // Clean up user session, clear caches, etc.
});

// Listen for scheduled refresh
addEventListener('scheduleRefresh', (data) => {
  console.log('Refresh scheduled:', data);
  // Update UI with next refresh time, etc.
});
```

## Usage in Components

### Basic Usage (Automatic)

Components don't need to do anything! Token refresh is completely transparent:

```typescript
import { apiClient } from '../utils/api';

function MyComponent() {
  const fetchData = async () => {
    // Token refresh happens automatically if needed
    const data = await apiClient.get('/api/data');
    return data;
  };

  return <div>{/* component JSX */}</div>;
}
```

### Manual Token Check

If you need to manually check token status:

```typescript
import { shouldRefreshToken, hasValidToken } from '../utils/tokenRefresh';

function MyComponent() {
  const checkAuth = () => {
    // Check if token is valid
    if (!hasValidToken()) {
      console.log('No valid token');
      return;
    }

    // Check if refresh is needed
    if (shouldRefreshToken()) {
      console.log('Token needs refresh soon');
    }
  };

  return <div>{/* component JSX */}</div>;
}
```

### Using Auth Context

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, token, isAuthenticated, error } = useAuth();

  useEffect(() => {
    if (error) {
      // Handle auth errors (e.g., "Session expired")
      console.error('Auth error:', error);
    }
  }, [error]);

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome {user?.name}!</div>;
}
```

## Edge Cases Handled

### 1. Concurrent Requests During Refresh

**Scenario**: Multiple API calls happen while token is being refreshed

**Solution**: Token refresh manager queues all refresh requests and resolves them when refresh completes

```typescript
// All three requests will use the same refresh operation
Promise.all([
  apiClient.get('/api/users'),
  apiClient.get('/api/products'),
  apiClient.get('/api/orders'),
]);
```

### 2. Expired Refresh Token

**Scenario**: Refresh token itself has expired

**Solution**:
- Server returns 401/403
- Token refresh manager clears all auth data
- Dispatches 'tokenExpired' event
- AuthContext logs out user
- User sees "Session expired" message

### 3. Network Failure During Refresh

**Scenario**: Network error occurs during token refresh

**Solution**:
- Retry up to `maxRetries` times with exponential backoff
- If all retries fail, treat as refresh failure
- Clear auth data and log out user

### 4. Token Refresh on Page Load

**Scenario**: User returns to app with expired token

**Solution**:
- AuthContext loads token on mount
- Checks expiration
- If expired, calls token refresh manager
- Refresh happens before any API calls
- If refresh succeeds, user stays logged in
- If refresh fails, user is logged out

### 5. Multiple Tabs/Windows

**Scenario**: User has app open in multiple tabs

**Solution**:
- Token refresh happens independently in each tab
- LocalStorage is shared, so new token is available to all tabs
- Each tab maintains its own refresh schedule
- If refresh fails in one tab, others are unaffected initially
- Each tab will eventually detect expired token and log out

### 6. Refresh During Logout

**Scenario**: Token refresh is triggered while user is logging out

**Solution**:
- API calls during logout skip refresh (`skipRefresh: true`)
- Logout clears all auth data immediately
- Token refresh manager cleanup prevents pending refreshes

## Testing

### Test Scenarios

1. **Normal Operation**
   - Login → Make API calls → Token refreshes automatically → Continue working

2. **Token Near Expiry**
   - Wait until token is within refresh buffer → Next API call triggers refresh

3. **Token Expired**
   - Wait until token expires → Next API call gets 401 → Automatic refresh and retry

4. **Refresh Token Expired**
   - Invalidate refresh token on server → Next refresh fails → User logged out

5. **Network Error**
   - Disconnect network → API call fails → Retry logic activates

6. **Concurrent Requests**
   - Make multiple API calls simultaneously → Single refresh operation → All succeed

### Manual Testing

```typescript
// In browser console

// Check current token status
import { getRefreshState, hasValidToken } from './utils/tokenRefresh';
console.log('Valid token:', hasValidToken());
console.log('Refresh state:', getRefreshState());

// Force token refresh
import { refreshToken } from './utils/tokenRefresh';
await refreshToken();

// Clear auth (to test logout)
import { clearAuthData } from './utils/auth';
clearAuthData();
```

## Troubleshooting

### Issue: Token not refreshing automatically

**Check**:
1. Verify `expiresAt` is stored correctly in localStorage
2. Check console for `scheduleTokenRefresh` logs
3. Verify `initializeTokenRefresh()` is called on app load

### Issue: User logged out unexpectedly

**Check**:
1. Check console for "refresh failed" errors
2. Verify refresh token is valid on server
3. Check server logs for refresh endpoint errors
4. Verify `refreshEndpoint` configuration is correct

### Issue: 401 errors still reaching components

**Check**:
1. Verify API calls use `apiClient` from `api.ts`
2. Check that `skipRefresh` is not set to `true`
3. Verify token refresh manager is initialized
4. Check console for refresh operation logs

### Issue: Multiple refreshes happening

**Check**:
1. Verify only one `AuthProvider` in component tree
2. Check for multiple calls to `initializeTokenRefresh()`
3. Verify cleanup is happening on unmount

## Best Practices

1. **Always use apiClient** - Don't use raw `fetch()` for authenticated requests
2. **Don't skip refresh** - Only use `skipRefresh: true` for logout/public endpoints
3. **Handle error states** - Display appropriate messages when session expires
4. **Test edge cases** - Test with expired tokens, network failures, etc.
5. **Monitor events** - Add event listeners for important auth state changes
6. **Configure appropriately** - Adjust refresh buffer based on your token TTL

## Performance Considerations

1. **Queue Management** - Only one refresh operation at a time prevents thundering herd
2. **Proactive Refresh** - Reduces user-facing 401 errors
3. **Event System** - Lightweight pub/sub for state updates
4. **LocalStorage** - Fast token retrieval without network calls
5. **Exponential Backoff** - Reduces server load on retry failures

## Security Considerations

1. **LocalStorage** - Tokens stored in localStorage (XSS risk mitigation via CSP recommended)
2. **Token Validation** - Basic format validation before use
3. **Automatic Cleanup** - Auth data cleared on refresh failure
4. **No Token Sharing** - Each request gets fresh token from storage
5. **HTTPS Required** - Always use HTTPS in production

## Migration from Old System

The old system had basic token refresh in both AuthContext and api.ts. The new system:

1. **Centralizes logic** - Single source of truth in tokenRefresh.ts
2. **Adds proactive refresh** - Prevents 401 errors
3. **Better queue management** - More robust concurrent request handling
4. **Event system** - Better component integration
5. **More configurable** - Easy to customize behavior

No breaking changes - existing code continues to work!

## Future Enhancements

Potential improvements:

1. **Refresh token rotation** - Server returns new refresh token with each refresh
2. **Token fingerprinting** - Bind tokens to device/browser
3. **Silent refresh iframe** - For stricter CORS environments
4. **Offline support** - Grace period for offline token validation
5. **Analytics** - Track refresh success/failure rates
6. **Adaptive refresh** - Adjust buffer based on user activity

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review this documentation
3. Check the inline code comments
4. Test with the debugging utilities provided
