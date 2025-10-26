# Authentication Test Plan

## Overview
Comprehensive test plan for authentication functionality covering all user flows, edge cases, and integration scenarios.

---

## 1. User Registration Flow

### Test Scenarios

#### 1.1 Successful Registration
- **Test**: User can register with valid credentials
- **Expected**:
  - API POST request to `/api/auth/register` with correct payload
  - Tokens stored in localStorage
  - Auth context updated with user data
  - `isAuthenticated` becomes `true`
  - User redirected to dashboard/home

#### 1.2 Form Validation
- **Name Validation**
  - Empty name shows error: "Name is required"
  - Name < 2 characters shows error: "Name must be at least 2 characters"

- **Email Validation**
  - Empty email shows error: "Email is required"
  - Invalid format (e.g., "invalid-email") shows error: "Please enter a valid email address"
  - Email must match regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

- **Password Validation**
  - Empty password shows error: "Password is required"
  - Password < 8 characters shows error: "Password must be at least 8 characters"
  - Missing uppercase shows error: "Password must contain at least one uppercase letter"
  - Missing lowercase shows error: "Password must contain at least one lowercase letter"
  - Missing number shows error: "Password must contain at least one number"

- **Confirm Password Validation**
  - Empty shows error: "Please confirm your password"
  - Mismatch shows error: "Passwords do not match"

#### 1.3 Server Error Handling
- **Duplicate Email** (409 Conflict)
  - Shows error: "An account with this email already exists"
  - No tokens stored
  - User remains unauthenticated

- **Server Error** (500)
  - Shows generic error message
  - Form remains interactive for retry

- **Network Error**
  - Graceful error handling
  - User can retry

#### 1.4 UI/UX Behavior
- Form fields disabled during submission
- Button shows loading state: "Creating account..."
- Spinner displayed during loading
- Password visibility toggle works
- Error messages clear when user starts typing
- Validation errors only shown after field touched/blur
- All fields validated on form submission

---

## 2. Login Flow

### Test Scenarios

#### 2.1 Successful Login
- **Test**: User can login with valid credentials
- **Expected**:
  - API POST request to `/api/auth/login`
  - Tokens stored in localStorage
  - Auth context updated
  - User data available in context
  - Session persists across page refreshes

#### 2.2 Invalid Credentials
- **Test**: Login fails with wrong password
- **Expected**:
  - Error message: "Invalid email or password"
  - No tokens stored
  - User remains unauthenticated
  - Can retry with different credentials

#### 2.3 Form Validation
- **Email Validation**
  - Empty: "Email is required"
  - Invalid format: "Please enter a valid email address"

- **Password Validation**
  - Empty: "Password is required"
  - Too short (< 6 chars): "Password must be at least 6 characters"

- **Form Submission**
  - Prevented when validation fails
  - All errors shown on submit attempt
  - No API call made if validation fails

#### 2.4 UI/UX Behavior
- Password visibility toggle
- Loading state during login
- Form disabled during submission
- Error clears when typing
- Remember Me functionality (future)
- Forgot password link (future)

#### 2.5 Session Persistence
- **Test**: Session restored from localStorage on mount
- **Setup**: Pre-populate localStorage with valid tokens
- **Expected**: User authenticated without login

- **Test**: Expired session cleared on mount
- **Setup**: Pre-populate with expired tokens
- **Expected**:
  - Refresh token attempted
  - If refresh fails, logout user
  - Tokens cleared from localStorage

---

## 3. Logout Flow

### Test Scenarios

#### 3.1 Successful Logout
- **Test**: User can logout
- **Expected**:
  - API POST request to `/api/auth/logout`
  - All tokens cleared from localStorage
  - Auth context reset to unauthenticated
  - User redirected to login page

#### 3.2 Logout with API Failure
- **Test**: Logout works even if API call fails
- **Expected**:
  - Local state cleared regardless
  - User logged out client-side
  - Error logged but doesn't block logout

#### 3.3 Context State Update
- `isAuthenticated` becomes `false`
- `user` becomes `null`
- `token` becomes `null`
- `loading` becomes `false`
- All consumers updated

---

## 4. Token Refresh Flow

### Test Scenarios

#### 4.1 Automatic Token Refresh
- **Test**: Token refreshes 5 minutes before expiry
- **Setup**: Token expiring in 4 minutes
- **Expected**:
  - API POST to `/api/auth/refresh` called automatically
  - New access token received and stored
  - User remains authenticated
  - No interruption to user experience

#### 4.2 Manual Token Refresh
- **Test**: `refreshToken()` function can be called manually
- **Expected**: Same as automatic refresh

#### 4.3 Refresh Failure Handling
- **Test**: Failed refresh logs user out
- **Expected**:
  - Error: "Session expired. Please login again."
  - All tokens cleared
  - User becomes unauthenticated
  - Redirected to login

#### 4.4 Refresh with Invalid Token
- **Test**: Invalid refresh token rejected
- **Expected**: Same as refresh failure

#### 4.5 Token Refresh During Active Request
- **Test**: Pending requests should retry with new token
- **Expected**: Seamless continuation (future enhancement)

---

## 5. Protected Route Access

### Test Scenarios

#### 5.1 Authenticated Access
- **Test**: Authenticated user sees protected content
- **Setup**: Valid tokens in localStorage
- **Expected**: Protected component renders

#### 5.2 Unauthenticated Access
- **Test**: Unauthenticated user redirected to login
- **Setup**: No tokens in localStorage
- **Expected**: Login form displayed, not protected content

#### 5.3 Loading State
- **Test**: Loading indicator shown while checking auth
- **Expected**: "Checking authentication..." message

#### 5.4 Custom Fallback
- **Test**: Custom fallback component used when provided
- **Expected**: Custom component renders instead of default login

#### 5.5 Token Expiry During Session
- **Test**: Expired token during protected route access
- **Expected**:
  - Refresh attempted
  - If successful, content shown
  - If failed, login shown

---

## 6. Auth Context State Management

### Test Scenarios

#### 6.1 Initial State
- `loading`: `true`
- `isAuthenticated`: `false`
- `user`: `null`
- `token`: `null`
- `error`: `null`

#### 6.2 State Transitions
```
Initial (loading) → Unauthenticated (loaded, no token)
Initial (loading) → Authenticated (loaded, valid token)
Unauthenticated → Authenticated (login)
Authenticated → Unauthenticated (logout)
Authenticated → Loading → Authenticated (token refresh)
Authenticated → Loading → Unauthenticated (refresh failed)
```

#### 6.3 Multiple Consumers
- **Test**: All consumers receive same state
- **Expected**: State consistent across all useAuth() calls

#### 6.4 Error State Management
- `error` set on failed operations
- `clearError()` clears error
- Error auto-clears on retry
- Error messages user-friendly

#### 6.5 Loading State Management
- Loading during login
- Loading during register
- Loading during logout
- Loading during token refresh
- Not loading during normal operation

---

## 7. Edge Cases and Error Handling

### Test Scenarios

#### 7.1 Network Errors
- Offline scenario
- Timeout scenario
- DNS failure
- CORS errors

#### 7.2 Malformed Responses
- Invalid JSON
- Missing required fields
- Unexpected response structure

#### 7.3 Token Edge Cases
- Expired token on page load
- Token expires during idle session
- Invalid token format
- Missing token parts
- Corrupted localStorage data

#### 7.4 Race Conditions
- Multiple login attempts
- Logout during login
- Token refresh during logout
- Rapid login/logout cycles

#### 7.5 Browser Issues
- localStorage unavailable
- localStorage quota exceeded
- Private/incognito mode
- Multiple tabs/windows

---

## 8. Security Test Scenarios

### Test Scenarios

#### 8.1 Token Security
- Tokens not exposed in URL
- Tokens not logged to console (production)
- Tokens cleared on logout
- XSS prevention in user data

#### 8.2 Password Security
- Password not stored in state
- Password cleared after submission
- Password field type="password"
- Password validation enforced

#### 8.3 CSRF Protection
- (Future) CSRF tokens implemented
- (Future) SameSite cookie attributes

---

## 9. Integration Test Scenarios

### Test Scenarios

#### 9.1 Complete User Journeys
1. **New User Journey**
   - Visit site → See login → Click register
   - Fill registration form → Submit
   - Authenticated → See dashboard
   - Logout → Back to login

2. **Returning User Journey**
   - Visit site with expired session
   - See login → Enter credentials
   - Authenticated → Token auto-refreshes
   - Navigate protected routes → All work
   - Idle → Token refreshes → No interruption
   - Close tab → Reopen → Still authenticated

3. **Error Recovery Journey**
   - Try login with wrong password → Error
   - Retry with correct password → Success
   - Network error during operation → Retry succeeds

#### 9.2 Multi-Tab Scenarios
- Login in tab A → Tab B updates
- Logout in tab A → Tab B updates
- Token refresh in tab A → Tab B gets new token

---

## 10. Performance Test Scenarios

### Test Scenarios

#### 10.1 Initialization Performance
- Context initializes within 100ms
- Token validation fast (<50ms)
- No unnecessary re-renders

#### 10.2 Operation Performance
- Login completes in <2s (with network)
- Logout completes immediately
- Token refresh silent and fast

---

## 11. Accessibility Test Scenarios

### Test Scenarios

#### 11.1 Keyboard Navigation
- All forms keyboard accessible
- Tab order logical
- Enter submits forms
- Escape clears modals

#### 11.2 Screen Reader Support
- Form labels properly associated
- Error messages announced
- Loading states announced
- Success confirmations announced

#### 11.3 ARIA Attributes
- `role="alert"` on errors
- `aria-busy` during loading
- `aria-invalid` on validation errors
- `aria-describedby` for error messages

---

## Test Coverage Goals

- **Unit Tests**: 90%+ coverage of auth utilities
- **Component Tests**: 85%+ coverage of auth components
- **Integration Tests**: 100% coverage of critical paths
- **E2E Tests**: All user journeys covered

---

## Test Data Requirements

### Mock Users
```typescript
const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'Test@1234',
    name: 'Test User',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'WrongPassword',
  },
  existingUser: {
    email: 'existing@example.com',
    password: 'Existing@123',
  },
};
```

### Mock Tokens
```typescript
const mockTokens = {
  valid: {
    accessToken: 'mock-access-token-valid',
    refreshToken: 'mock-refresh-token-valid',
    expiresAt: Date.now() + 3600000, // 1 hour
  },
  expired: {
    accessToken: 'mock-access-token-expired',
    refreshToken: 'mock-refresh-token-expired',
    expiresAt: Date.now() - 1000, // Expired
  },
  expiringSoon: {
    accessToken: 'mock-access-token-expiring',
    refreshToken: 'mock-refresh-token-expiring',
    expiresAt: Date.now() + 4 * 60 * 1000, // 4 minutes
  },
};
```

### Mock API Responses
See `tests/auth/mocks.ts` for complete mock data

---

## Testing Tools and Libraries

- **Test Framework**: Vitest
- **React Testing**: @testing-library/react
- **User Interactions**: @testing-library/user-event
- **API Mocking**: Mock Service Worker (MSW) or fetch mocks
- **Coverage**: vitest coverage (c8/istanbul)

---

## Running Tests

```bash
# Run all auth tests
npm run test:auth

# Run with coverage
npm run test:auth:coverage

# Run in watch mode
npm run test:auth:watch

# Run specific test file
npm run test tests/auth/login.test.ts
```

---

## Continuous Integration

Tests should run on:
- Every commit (pre-commit hook)
- Every pull request
- Before deployment
- Scheduled nightly runs

Minimum coverage thresholds:
- Statements: 85%
- Branches: 80%
- Functions: 85%
- Lines: 85%
