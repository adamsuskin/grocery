# Authentication Implementation Guide

This document describes the complete JWT-based authentication system implemented for the Grocery List application.

## Architecture Overview

The authentication system consists of several interconnected components:

1. **AuthContext** - React context for managing authentication state
2. **Auth Types** - TypeScript type definitions for auth-related data
3. **Zero Integration** - Utilities to sync Zero client with auth state
4. **Storage Layer** - LocalStorage-based token persistence

## File Structure

```
src/
├── contexts/
│   ├── AuthContext.tsx              # Base auth context (standalone)
│   └── AuthContextWithZero.tsx      # Auth context with Zero integration
├── types/
│   └── auth.ts                      # TypeScript type definitions
├── utils/
│   └── authZeroIntegration.ts       # Zero sync utilities
└── examples/
    └── AuthUsageExample.tsx         # Usage examples and patterns
```

## Core Features

### 1. Authentication State Management
- User authentication status
- Loading states for async operations
- Error handling and display
- Token storage and retrieval

### 2. Authentication Operations
- **Login**: Authenticate with email/password
- **Register**: Create new user account
- **Logout**: Clear session and reset state
- **Token Refresh**: Automatic token renewal

### 3. Token Management
- JWT access tokens and refresh tokens
- Automatic token refresh 5 minutes before expiry
- Secure localStorage persistence
- Token expiry validation

### 4. Zero Client Integration
- Automatic Zero initialization on login
- User-scoped data access
- Seamless transition between authenticated/demo mode
- Token sync on refresh

## Quick Start

### 1. Wrap Your App with AuthProvider

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ZeroProvider } from '@rocicorp/zero/react';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
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

### 2. Use Authentication in Components

```tsx
import { useAuth } from './contexts/AuthContext';

function LoginComponent() {
  const { login, loading, error } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      // Success! User is authenticated
    } catch (err) {
      // Error is already in context
      console.error('Login failed:', err);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={() => handleLogin('user@example.com', 'password')}
              disabled={loading}>
        Login
      </button>
    </div>
  );
}
```

### 3. Access User Data

```tsx
import { useAuthUser, useAuthToken } from './contexts/AuthContext';

function UserProfile() {
  const user = useAuthUser();
  const token = useAuthToken();

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <h2>Welcome, {user.name}!</h2>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

## API Integration

### Expected Backend Endpoints

Your backend should implement the following REST API endpoints:

#### POST /api/auth/login
```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": 1635724800000
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": 1635811200000
  }
}
```

#### POST /api/auth/register
```json
// Request
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe"
}

// Response - Same as login
{
  "user": { ... },
  "tokens": { ... }
}
```

#### POST /api/auth/refresh
```json
// Request
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": 1635811200000
}
```

#### POST /api/auth/logout
```json
// Request Headers
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Response
{ "success": true }
```

### Configuration

Set your API base URL via environment variable:

```bash
# .env
VITE_API_URL=http://localhost:3000/api
```

## Zero Integration

### Option 1: Base AuthContext (No Zero Integration)

Use `AuthContext.tsx` if you want to manually manage Zero sync:

```tsx
import { useAuth } from './contexts/AuthContext';
import { initializeZeroWithAuth, logoutZero } from './zero-store';

function MyComponent() {
  const { login, logout, user, token } = useAuth();

  const handleLogin = async (credentials) => {
    await login(credentials);
    // Manually sync Zero
    if (user && token) {
      await initializeZeroWithAuth({ userID: user.id, token });
    }
  };

  const handleLogout = async () => {
    await logout();
    // Manually reset Zero
    await logoutZero();
  };
}
```

### Option 2: AuthContextWithZero (Automatic Zero Integration)

Use `AuthContextWithZero.tsx` for automatic Zero synchronization:

```tsx
// Just import from the Zero-integrated version
import { useAuth } from './contexts/AuthContextWithZero';

function MyComponent() {
  const { login, logout } = useAuth();

  // Zero is automatically synchronized!
  const handleLogin = async (credentials) => {
    await login(credentials); // Zero updates automatically
  };

  const handleLogout = async () => {
    await logout(); // Zero resets automatically
  };
}
```

## Security Best Practices

### 1. Token Storage
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- All storage operations are wrapped in try-catch for error handling
- Tokens are cleared on logout and authentication errors

### 2. Token Expiry
- Access tokens automatically refresh 5 minutes before expiry
- Expired tokens trigger automatic logout
- Refresh token failures force re-authentication

### 3. Error Handling
- All API errors are caught and displayed to users
- Network errors are handled gracefully
- Failed operations don't leave app in inconsistent state

### 4. API Communication
- All requests use HTTPS in production (configure via VITE_API_URL)
- Bearer token authentication
- Proper Content-Type headers

## TypeScript Types

All authentication-related types are strongly typed:

```typescript
// User data
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

// Authentication tokens
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

// Auth context state
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Login/Register credentials
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}
```

## Common Patterns

### Protected Routes

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

### Authenticated API Calls

```tsx
function DataComponent() {
  const token = useAuthToken();

  const fetchData = async () => {
    const response = await fetch('/api/data', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  };
}
```

### Conditional Rendering

```tsx
function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user?.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </header>
  );
}
```

## Testing

### Mock AuthContext for Tests

```tsx
const mockAuthContext = {
  user: { id: '1', email: 'test@example.com', name: 'Test User' },
  token: 'mock-token',
  loading: false,
  error: null,
  isAuthenticated: true,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  clearError: jest.fn(),
};

// Use in tests
<AuthContext.Provider value={mockAuthContext}>
  <YourComponent />
</AuthContext.Provider>
```

## Troubleshooting

### Issue: Token refresh loop
**Solution**: Check that your refresh endpoint returns a new expiry time, not the same one.

### Issue: Zero not syncing with auth
**Solution**: Use `AuthContextWithZero.tsx` or manually call `initializeZeroWithAuth()` after login.

### Issue: User logged out unexpectedly
**Solution**: Check token expiry times and ensure refresh endpoint is working.

### Issue: Login successful but user state not updating
**Solution**: Verify API response matches expected `LoginResponse` type structure.

## Future Enhancements

- [ ] OAuth2/Social login integration
- [ ] Remember me functionality
- [ ] Session timeout warnings
- [ ] Multiple device management
- [ ] Two-factor authentication
- [ ] Password reset flow
- [ ] Email verification

## Support

For questions or issues:
1. Check the examples in `/src/examples/AuthUsageExample.tsx`
2. Review this documentation
3. Check the inline code comments
4. Consult the Zero documentation for data sync issues

## License

This implementation is part of the Grocery List application.
