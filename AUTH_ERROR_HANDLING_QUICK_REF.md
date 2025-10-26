# Authentication Error Handling - Quick Reference

## Quick Start

### 1. Handle Errors in Try-Catch

```typescript
import { handleAuthError } from '../utils/authErrors';

try {
  await login(credentials);
} catch (error) {
  handleAuthError(error, { logToConsole: true });
  setError(error);
}
```

### 2. Display Errors to Users

```tsx
import { ErrorBanner } from '../components/ErrorDisplay';

<ErrorBanner
  error={error}
  onClose={() => setError(null)}
/>
```

## Error Display Components

### ErrorBanner - Full-width banner
```tsx
<ErrorBanner error={error} onClose={() => setError(null)} />
```

### ErrorToast - Floating notification
```tsx
<ErrorToast error={error} duration={5000} position="top-right" />
```

### ErrorAlert - Inline alert with actions
```tsx
<ErrorAlert error={error} showRecoveryAction={true} />
```

### FieldError - Form field error
```tsx
<FieldError error={fieldError} show={touched.email} />
```

## Error Types

| Type | HTTP Status | User Message |
|------|-------------|--------------|
| `NETWORK_ERROR` | 500, 502, 503, 504 | "Network error. Please check your connection..." |
| `UNAUTHORIZED` | 401, 403 | "Invalid email or password..." |
| `TOKEN_EXPIRED` | 401 | "Your session has expired..." |
| `VALIDATION_ERROR` | 400 | "Invalid input. Please check your information..." |
| `INVALID_TOKEN` | 401 | "Your session is invalid..." |

## Common Patterns

### Login Form Error Handling

```tsx
const [error, setError] = useState<unknown>(null);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  try {
    await login(credentials);
  } catch (err) {
    handleAuthError(err, { logToConsole: true });
    setError(err);
  }
};

// Clear error on input change
const handleInputChange = (e) => {
  setCredentials(e.target.value);
  if (error) setError(null);
};
```

### API Request Error Handling

```tsx
try {
  const data = await apiClient.get('/endpoint');
} catch (error) {
  const errorInfo = handleAuthError(error, {
    clearAuthOnUnauthorized: true,
    redirectToLogin: true,
  });
  showErrorToast(errorInfo.message);
}
```

### Field Validation

```tsx
import { extractValidationErrors } from '../utils/authErrors';

catch (error) {
  const validationErrors = extractValidationErrors(error);
  validationErrors.forEach(({ field, message }) => {
    setFieldError(field, message);
  });
}
```

## Error Handling Options

```typescript
handleAuthError(error, {
  // Auto-clear auth
  clearAuthOnUnauthorized: true,
  clearAuthOnExpired: true,

  // Logging
  logToConsole: true,
  logToServer: false,

  // Custom handlers
  onError: (errorInfo) => {
    // Your custom logic
  },
});
```

## Hooks

### useErrorState - Auto-clear errors
```tsx
import { useErrorState } from '../components/ErrorDisplay';

const { error, setError, clearError } = useErrorState(5000); // Auto-clear after 5s
```

### useErrorToast - Toast notifications
```tsx
import { useErrorToast } from '../components/ErrorDisplay';

const { toast, showToast, hideToast } = useErrorToast();

showToast(error);
```

## Recovery Strategies

| Strategy | When to Use | User Action |
|----------|-------------|-------------|
| `RETRY` | Temporary failures | Try Again button |
| `RELOGIN` | Expired/invalid tokens | Sign In Again |
| `CHECK_CONNECTION` | Network issues | Check connection |
| `WAIT_AND_RETRY` | Rate limiting | Wait message |
| `CONTACT_SUPPORT` | Persistent issues | Contact Support link |

## Severity Levels

- 🔵 **INFO** - Informational
- 🟠 **WARNING** - User input errors
- 🔴 **ERROR** - System/auth failures
- 🟣 **CRITICAL** - Security/system failures

## Helper Functions

```typescript
import {
  formatErrorForDisplay,
  shouldRedirectToLogin,
  isRetryableError,
  getRecoveryAction,
} from '../utils/authErrors';

// Get user-friendly message
const message = formatErrorForDisplay(error);

// Check if should redirect
if (shouldRedirectToLogin(error)) {
  navigate('/login');
}

// Check if retryable
if (isRetryableError(error)) {
  // Show retry button
}
```

## TypeScript Types

```typescript
import {
  AuthErrorType,
  ErrorSeverity,
  RecoveryStrategy,
  AuthErrorInfo,
  ValidationError,
} from '../utils/authErrors';
```

## Testing

```typescript
import { AuthError, AuthErrorType } from '../utils/authErrors';

// Simulate error
throw new AuthError(
  'Test error',
  AuthErrorType.NETWORK_ERROR,
  500
);
```

## Files

- `/src/utils/authErrors.ts` - Error handling logic
- `/src/components/ErrorDisplay.tsx` - UI components
- `/src/components/ErrorDisplay.css` - Styles
- `/docs/AUTH_ERROR_HANDLING.md` - Full documentation

## Common Issues

### Error not displaying
✅ Check that error state is set
✅ Verify error component is rendered
✅ Check console for error details

### Wrong error message
✅ Use `handleAuthError()` to classify
✅ Check error type mapping
✅ Verify HTTP status code

### Error persists
✅ Clear error on user input
✅ Clear error after successful action
✅ Check error auto-clear duration

## Best Practices

1. ✅ Always handle errors in try-catch
2. ✅ Use handleAuthError() for classification
3. ✅ Display errors with UI components
4. ✅ Clear errors on user input
5. ✅ Log errors in development
6. ✅ Provide recovery actions
7. ✅ Use TypeScript types

## Quick Example - Complete Form

```tsx
import { useState, FormEvent } from 'react';
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
    } catch (err) {
      handleAuthError(err, { logToConsole: true });
      setError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ErrorBanner error={error} onClose={() => setError(null)} />

      <input
        type="email"
        value={credentials.email}
        onChange={(e) => {
          setCredentials({ ...credentials, email: e.target.value });
          if (error) setError(null); // Clear error on input
        }}
      />

      <input
        type="password"
        value={credentials.password}
        onChange={(e) => {
          setCredentials({ ...credentials, password: e.target.value });
          if (error) setError(null); // Clear error on input
        }}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## Need More Help?

📚 Read the full documentation: `/docs/AUTH_ERROR_HANDLING.md`
💬 Check inline code comments
🔍 Review example implementations in LoginForm and RegisterForm
