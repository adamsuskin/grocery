# Authentication Error Handling Guide

This guide provides comprehensive documentation for the authentication error handling system implemented in the grocery list application.

## Overview

The authentication error handling system provides:

1. **Centralized Error Management** - All authentication errors are handled consistently
2. **User-Friendly Messages** - Technical errors are translated to user-friendly language
3. **Error Classification** - Errors are categorized by type and severity
4. **Recovery Strategies** - Automatic suggestions for error recovery
5. **Visual Components** - Pre-built UI components for displaying errors
6. **Logging & Monitoring** - Comprehensive error logging for debugging

## Architecture

### Core Files

```
src/
├── utils/
│   ├── authErrors.ts       # Error handling utilities and logic
│   └── auth.ts             # Base authentication utilities
├── components/
│   ├── ErrorDisplay.tsx    # Error display components
│   └── ErrorDisplay.css    # Error display styles
```

## Error Types

The system handles the following error types:

### 1. Network Errors (`NETWORK_ERROR`)

**Triggers:**
- Connection timeout
- Server unavailable (500, 502, 503, 504)
- Network offline
- DNS resolution failures

**User Message:**
```
"Network error. Please check your connection and try again."
```

**Recovery Strategy:**
- Check connection
- Retry the request
- Wait and retry for rate limiting

### 2. Invalid Credentials (`UNAUTHORIZED`)

**Triggers:**
- Wrong email/password combination
- Account not found
- Invalid login attempt

**User Message:**
```
"Invalid email or password. Please try again."
```

**Recovery Strategy:**
- Retry with correct credentials
- Password reset option
- Account creation option

### 3. Expired Token (`TOKEN_EXPIRED`)

**Triggers:**
- Access token has expired
- Session timeout

**User Message:**
```
"Your session has expired. Please sign in again."
```

**Recovery Strategy:**
- Automatic token refresh (if refresh token valid)
- Redirect to login page
- Clear authentication data

### 4. Invalid Token (`INVALID_TOKEN`)

**Triggers:**
- Malformed JWT token
- Token signature verification failed
- Token tampering detected

**User Message:**
```
"Your session is invalid. Please sign in again."
```

**Recovery Strategy:**
- Clear authentication data
- Redirect to login

### 5. Validation Errors (`VALIDATION_ERROR`)

**Triggers:**
- Invalid email format
- Password too weak
- Missing required fields
- Email already taken

**User Message:**
```
"Invalid input. Please check your information and try again."
```

**Recovery Strategy:**
- Correct the input
- Field-level error display

### 6. Forbidden Access (`UNAUTHORIZED` with 403)

**Triggers:**
- Insufficient permissions
- Accessing restricted resources

**User Message:**
```
"You do not have permission to perform this action."
```

**Recovery Strategy:**
- Contact support
- Sign in with different account

### 7. Server Errors (500)

**Triggers:**
- Internal server error
- Database connection failed
- Unhandled exceptions

**User Message:**
```
"A server error occurred. Please try again later."
```

**Recovery Strategy:**
- Wait and retry
- Contact support if persists

## Using Error Handling

### Basic Usage

```typescript
import { handleAuthError } from '../utils/authErrors';

try {
  await login(credentials);
} catch (error) {
  const errorInfo = handleAuthError(error, {
    clearAuthOnUnauthorized: true,
    logToConsole: true,
  });

  // Display error to user
  setErrorMessage(errorInfo.message);
}
```

### Error Display Components

#### 1. ErrorBanner

Full-width banner for prominent errors at the top of forms:

```tsx
import { ErrorBanner } from '../components/ErrorDisplay';

<ErrorBanner
  error={authError}
  onClose={() => setAuthError(null)}
  showCloseButton={true}
/>
```

#### 2. ErrorToast

Temporary notification that auto-dismisses:

```tsx
import { ErrorToast } from '../components/ErrorDisplay';

<ErrorToast
  error={error}
  duration={5000}
  position="top-right"
  onClose={() => setError(null)}
/>
```

#### 3. ErrorAlert

Inline alert with recovery actions:

```tsx
import { ErrorAlert } from '../components/ErrorDisplay';

<ErrorAlert
  error={error}
  showRecoveryAction={true}
  onRecoveryAction={(strategy) => {
    // Handle recovery
  }}
/>
```

#### 4. FieldError

Small error message for form fields:

```tsx
import { FieldError } from '../components/ErrorDisplay';

<FieldError
  error={fieldError}
  show={touched.email}
/>
```

### Error Handling Options

```typescript
interface HandleAuthErrorOptions {
  // Automatic actions
  clearAuthOnUnauthorized?: boolean; // Clear auth data on 401/403
  clearAuthOnExpired?: boolean;      // Clear auth data on expired token
  redirectToLogin?: boolean;         // Redirect to login page

  // Logging
  logToConsole?: boolean;            // Log error to console
  logToServer?: boolean;             // Send error to logging service

  // User notification
  showToast?: boolean;               // Show error in toast notification
  toastDuration?: number;            // Toast display duration in ms

  // Recovery
  autoRetry?: boolean;               // Automatically retry the operation
  maxRetries?: number;               // Maximum retry attempts
  retryDelay?: number;               // Delay between retries in ms

  // Custom handlers
  onError?: (errorInfo: AuthErrorInfo) => void;
  onRecovery?: (strategy: RecoveryStrategy) => void;
}
```

### Custom Error Handlers

```typescript
const errorInfo = handleAuthError(error, {
  logToConsole: true,
  onError: (info) => {
    // Custom error handling
    analytics.trackError({
      type: info.type,
      severity: info.severity,
      message: info.message,
    });
  },
  onRecovery: (strategy) => {
    // Custom recovery handling
    if (strategy === RecoveryStrategy.RELOGIN) {
      navigate('/login');
    }
  },
});
```

## Error Classification

Errors are automatically classified with the following information:

```typescript
interface AuthErrorInfo {
  // Core error data
  type: AuthErrorType;              // Error type enum
  message: string;                  // User-friendly message
  technicalMessage?: string;        // Technical details for logging
  statusCode?: number;              // HTTP status code

  // Classification
  severity: ErrorSeverity;          // info, warning, error, critical
  recoveryStrategy: RecoveryStrategy; // Suggested recovery action

  // User guidance
  userAction?: string;              // Suggested action for user
  retryable: boolean;               // Can this error be retried?

  // Additional context
  timestamp: number;                // Error timestamp
  originalError?: unknown;          // Original error object
}
```

## Error Severity Levels

### INFO
- Informational messages
- Non-critical issues
- **Color:** Blue

### WARNING
- User input errors
- Validation failures
- Temporary issues
- **Color:** Orange

### ERROR
- Authentication failures
- Network errors
- Server errors
- **Color:** Red

### CRITICAL
- System failures
- Security issues
- Data corruption
- **Color:** Purple

## Recovery Strategies

### RETRY
User can retry the operation immediately
```typescript
RecoveryStrategy.RETRY
```

### REFRESH_TOKEN
Attempt to refresh the authentication token
```typescript
RecoveryStrategy.REFRESH_TOKEN
```

### RELOGIN
User must sign in again
```typescript
RecoveryStrategy.RELOGIN
```

### CHECK_CONNECTION
User should check their internet connection
```typescript
RecoveryStrategy.CHECK_CONNECTION
```

### WAIT_AND_RETRY
Wait a moment before retrying (rate limiting)
```typescript
RecoveryStrategy.WAIT_AND_RETRY
```

### CONTACT_SUPPORT
User should contact support
```typescript
RecoveryStrategy.CONTACT_SUPPORT
```

## Validation Errors

### Field-Level Errors

Extract field-specific errors for form display:

```typescript
import { extractValidationErrors } from '../utils/authErrors';

const validationErrors = extractValidationErrors(error);
// Returns: [{ field: 'email', message: 'Email is required' }]
```

### Grouped Errors

Group errors by field:

```typescript
import { groupValidationErrors } from '../utils/authErrors';

const grouped = groupValidationErrors(validationErrors);
// Returns: { email: ['Email is required'], password: [...] }
```

## React Hooks

### useErrorState

Manage error state with auto-clear:

```typescript
import { useErrorState } from '../components/ErrorDisplay';

const { error, setError, clearError } = useErrorState(5000); // Auto-clear after 5s
```

### useErrorToast

Manage toast notifications:

```typescript
import { useErrorToast } from '../components/ErrorDisplay';

const { toast, showToast, hideToast } = useErrorToast();

// Show toast
showToast(error, 'Custom message');

// Display toast
{toast.visible && (
  <ErrorToast
    error={toast.error}
    message={toast.message}
    onClose={hideToast}
  />
)}
```

## Error Boundary Integration

```tsx
import { ErrorBoundaryFallback } from '../components/ErrorDisplay';
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  FallbackComponent={ErrorBoundaryFallback}
  onReset={() => {
    // Reset app state
  }}
>
  <App />
</ErrorBoundary>
```

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad
await login(credentials);

// ✅ Good
try {
  await login(credentials);
} catch (error) {
  handleAuthError(error, { logToConsole: true });
}
```

### 2. Clear Errors on User Input

```typescript
const handleInputChange = (e) => {
  setCredentials(e.target.value);

  // Clear error when user starts typing
  if (error) {
    setError(null);
    clearError();
  }
};
```

### 3. Show Specific Error Messages

```typescript
// ❌ Bad
<div>{error ? 'Error occurred' : null}</div>

// ✅ Good
<ErrorBanner error={error} />
```

### 4. Provide Recovery Actions

```typescript
<ErrorAlert
  error={error}
  showRecoveryAction={true}
  onRecoveryAction={(strategy) => {
    if (strategy === RecoveryStrategy.RETRY) {
      retryLogin();
    }
  }}
/>
```

### 5. Log Errors for Debugging

```typescript
handleAuthError(error, {
  logToConsole: true,
  logToServer: process.env.NODE_ENV === 'production',
});
```

## Testing Errors

### Simulate Network Errors

```typescript
// In development, simulate network errors
if (process.env.NODE_ENV === 'development') {
  throw new AuthError(
    'Network error',
    AuthErrorType.NETWORK_ERROR
  );
}
```

### Test Error Display

```tsx
// Create test component with error
<ErrorBanner
  message="Test error message"
/>

<ErrorToast
  message="Test toast notification"
  position="top-right"
/>
```

## Accessibility

All error components follow accessibility best practices:

- `role="alert"` for important errors
- `aria-live="polite"` for non-critical notifications
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- Focus management

## Customization

### Custom Error Messages

```typescript
import { AUTH_ERROR_MESSAGES, AuthErrorType } from '../utils/authErrors';

// Override default messages
AUTH_ERROR_MESSAGES[AuthErrorType.UNAUTHORIZED] = 'Custom message';
```

### Custom Styles

```css
/* Override error display styles */
.error-banner-error {
  background-color: #custom-color;
}
```

### Custom Recovery Actions

```typescript
<ErrorAlert
  error={error}
  showRecoveryAction={true}
  onRecoveryAction={(strategy) => {
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        customRetryHandler();
        break;
      case RecoveryStrategy.RELOGIN:
        customLoginHandler();
        break;
    }
  }}
/>
```

## API Reference

See the inline documentation in:
- `src/utils/authErrors.ts` - Complete API documentation
- `src/components/ErrorDisplay.tsx` - Component props and usage

## Examples

### Complete Login Form with Error Handling

```tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ErrorBanner } from '../components/ErrorDisplay';
import { handleAuthError } from '../utils/authErrors';

export function LoginForm() {
  const { login, loading } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState<unknown>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(credentials);
      // Success - navigate to app
    } catch (err) {
      handleAuthError(err, {
        clearAuthOnUnauthorized: false,
        logToConsole: true,
      });
      setError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ErrorBanner
        error={error}
        onClose={() => setError(null)}
      />

      <input
        type="email"
        value={credentials.email}
        onChange={(e) => {
          setCredentials({ ...credentials, email: e.target.value });
          if (error) setError(null);
        }}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## Support

For questions or issues with error handling:
1. Check this documentation
2. Review inline code comments
3. Examine the example implementations
4. Create an issue in the project repository
