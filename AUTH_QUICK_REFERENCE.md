# Authentication Quick Reference

## Import Statements

```typescript
// Main auth hook
import { useAuth, useAuthToken, useAuthUser } from './contexts/AuthContext';

// Types
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthState,
  AuthContextValue
} from './types/auth';

// Zero integration (if needed)
import {
  syncZeroWithLogin,
  syncZeroWithLogout,
  syncZeroWithTokenRefresh
} from './utils/authZeroIntegration';
```

## useAuth Hook API

```typescript
const {
  // State
  user,              // User | null - Current user data
  token,             // string | null - JWT access token
  loading,           // boolean - Operation in progress
  error,             // string | null - Error message
  isAuthenticated,   // boolean - Is user logged in

  // Methods
  login,             // (credentials: LoginCredentials) => Promise<void>
  register,          // (credentials: RegisterCredentials) => Promise<void>
  logout,            // () => Promise<void>
  refreshToken,      // () => Promise<void>
  clearError,        // () => void
} = useAuth();
```

## Common Patterns

### Login
```typescript
const { login, loading, error } = useAuth();

await login({
  email: 'user@example.com',
  password: 'password123'
});
```

### Register
```typescript
const { register, loading, error } = useAuth();

await register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
});
```

### Logout
```typescript
const { logout } = useAuth();

await logout();
```

### Check Auth Status
```typescript
const { isAuthenticated, user } = useAuth();

if (isAuthenticated) {
  console.log('Logged in as:', user?.name);
}
```

### Get User Data
```typescript
const user = useAuthUser(); // Helper hook

if (user) {
  console.log(user.id, user.email, user.name);
}
```

### Get Token for API Calls
```typescript
const token = useAuthToken(); // Helper hook

const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### Protected Route
```typescript
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPage />;

  return <>{children}</>;
}
```

### Conditional Rendering
```typescript
const { isAuthenticated } = useAuth();

return (
  <div>
    {isAuthenticated ? (
      <AuthenticatedContent />
    ) : (
      <GuestContent />
    )}
  </div>
);
```

### Error Handling
```typescript
const { error, clearError } = useAuth();

{error && (
  <div className="error">
    {error}
    <button onClick={clearError}>Dismiss</button>
  </div>
)}
```

### Loading States
```typescript
const { loading, login } = useAuth();

<button onClick={handleLogin} disabled={loading}>
  {loading ? 'Logging in...' : 'Login'}
</button>
```

## User Object Structure

```typescript
{
  id: string;         // Unique user identifier
  email: string;      // User email address
  name: string;       // User display name
  createdAt: number;  // Account creation timestamp
}
```

## LocalStorage Keys

```typescript
'grocery_auth_access_token'   // JWT access token
'grocery_auth_refresh_token'  // JWT refresh token
'grocery_auth_token_expiry'   // Token expiration timestamp
'grocery_auth_user'           // Serialized user object
```

## Environment Variables

```bash
VITE_API_URL=http://localhost:3000/api  # Auth API base URL
VITE_ZERO_SERVER=http://localhost:4848  # Zero server URL
```

## API Endpoints

```
POST /api/auth/login       # Login with email/password
POST /api/auth/register    # Create new account
POST /api/auth/logout      # Logout (invalidate tokens)
POST /api/auth/refresh     # Refresh access token
```

## Setup in main.tsx

```typescript
import { AuthProvider } from './contexts/AuthContext';
import { ZeroProvider } from '@rocicorp/zero/react';
import { zeroInstance } from './zero-store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ZeroProvider zero={zeroInstance}>
        <App />
      </ZeroProvider>
    </AuthProvider>
  </StrictMode>
);
```

## Zero Integration Options

### Option 1: Automatic (Recommended)
```typescript
// Use AuthContextWithZero - handles everything automatically
import { useAuth } from './contexts/AuthContextWithZero';

const { login, logout } = useAuth();
// Zero syncs automatically!
```

### Option 2: Manual
```typescript
// Use base AuthContext and manually sync
import { useAuth } from './contexts/AuthContext';
import { initializeZeroWithAuth, logoutZero } from './zero-store';

const { login, logout, user, token } = useAuth();

const handleLogin = async (creds) => {
  await login(creds);
  if (user && token) {
    await initializeZeroWithAuth({ userID: user.id, token });
  }
};

const handleLogout = async () => {
  await logout();
  await logoutZero();
};
```

## TypeScript Tips

```typescript
// Type-safe login
const credentials: LoginCredentials = {
  email: 'user@example.com',
  password: 'password123',
};
await login(credentials);

// Type-safe user access
const user: User | null = useAuthUser();
if (user) {
  const userId: string = user.id;
  const userEmail: string = user.email;
}

// Type-safe context value
const authContext: AuthContextValue = useAuth();
```

## Error Messages

Common errors you might see:
- `"Login failed"` - Invalid credentials
- `"Registration failed"` - Account creation error
- `"Session expired. Please login again."` - Token refresh failed
- `"useAuth must be used within an AuthProvider"` - Missing provider

## Token Refresh

Tokens automatically refresh:
- 5 minutes before expiry
- On app startup if stored token is valid
- Can be manually triggered with `refreshToken()`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Not authenticated after login | Check API response format matches `LoginResponse` |
| Token refresh not working | Verify refresh endpoint returns `RefreshTokenResponse` |
| Zero not syncing | Use `AuthContextWithZero` or call `initializeZeroWithAuth()` |
| User logged out unexpectedly | Check token expiry times in API response |

## Full Example Component

```typescript
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';

function AuthPage() {
  const { login, logout, user, isAuthenticated, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (isAuthenticated && user) {
    return (
      <div>
        <h1>Welcome, {user.name}!</h1>
        <p>Email: {user.email}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      {error && (
        <div className="error">
          {error}
          <button type="button" onClick={clearError}>×</button>
        </div>
      )}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Resources

- **Full Documentation**: `/docs/AUTHENTICATION.md`
- **Usage Examples**: `/src/examples/AuthUsageExample.tsx`
- **Implementation Summary**: `/AUTH_IMPLEMENTATION_SUMMARY.md`
- **Type Definitions**: `/src/types/auth.ts`
