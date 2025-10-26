# Authentication System Documentation

This documentation covers the authentication system implementation for the Grocery List app.

## Overview

The authentication system consists of:
- **AuthContext** - React Context providing authentication state and functions
- **LoginForm** - User login interface
- **RegisterForm** - User registration interface  
- **Auth Types** - TypeScript type definitions for authentication

## File Structure

```
src/
├── context/
│   └── AuthContext.tsx          # Authentication context and provider
├── types/
│   └── auth.ts                  # Authentication type definitions
└── components/
    ├── LoginForm.tsx            # Login form component
    ├── LoginForm.css            # Shared authentication styles
    ├── RegisterForm.tsx         # Registration form component
    └── AuthPage.tsx             # Example: Combines login/register views
```

## Setup & Integration

### 1. Wrap your app with AuthProvider

In `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
```

### 2. Use authentication in your App

In `src/App.tsx`:

```tsx
import { useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { GroceryListApp } from './components/GroceryListApp'; // Your main app

function App() {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show main app if authenticated
  return <GroceryListApp user={user} />;
}

export default App;
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3000/api
```

This sets the base URL for authentication API calls.

## API Integration

The AuthContext expects the following API endpoints:

### POST /api/auth/login
```typescript
Request:
{
  email: string;
  password: string;
}

Response:
{
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: number;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // Unix timestamp
  };
}
```

### POST /api/auth/register
```typescript
Request:
{
  email: string;
  password: string;
  name: string;
}

Response:
{
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: number;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}
```

### POST /api/auth/refresh
```typescript
Request:
{
  refreshToken: string;
}

Response:
{
  accessToken: string;
  expiresAt: number;
}
```

### POST /api/auth/logout
```typescript
Headers:
Authorization: Bearer {accessToken}

Response:
200 OK
```

## Components

### LoginForm

A complete login form with validation and error handling.

**Props:**
- `onSwitchToRegister?: () => void` - Callback when user clicks "Create account"

**Features:**
- Email and password validation
- Show/hide password toggle
- Loading state during authentication
- Server error display
- Accessible form elements (ARIA labels, error descriptions)
- "Forgot password" link placeholder

**Example:**
```tsx
import { LoginForm } from './components/LoginForm';

function MyAuthPage() {
  return <LoginForm onSwitchToRegister={() => console.log('Switch to register')} />;
}
```

### RegisterForm

A complete registration form with validation.

**Props:**
- `onSwitchToLogin?: () => void` - Callback when user clicks "Sign in"

**Features:**
- Name, email, password, and confirm password fields
- Strong password validation (8+ chars, uppercase, lowercase, number)
- Password matching validation
- Show/hide password toggles
- Loading state during registration
- Server error display
- Accessible form elements
- Helpful password requirements text

**Example:**
```tsx
import { RegisterForm } from './components/RegisterForm';

function MyAuthPage() {
  return <RegisterForm onSwitchToLogin={() => console.log('Switch to login')} />;
}
```

### AuthPage

Example component that combines LoginForm and RegisterForm with view switching.

**Features:**
- Toggle between login and register views
- State management for current view
- Ready to use in your app

## useAuth Hook

Access authentication state and functions anywhere in your app:

```tsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const {
    user,              // Current user object or null
    token,             // Access token or null
    isAuthenticated,   // Boolean: is user logged in?
    loading,           // Boolean: is auth operation in progress?
    error,             // String: error message or null
    login,             // Function: login(credentials)
    register,          // Function: register(credentials)
    logout,            // Function: logout()
    refreshToken,      // Function: refreshToken()
    clearError,        // Function: clearError()
  } = useAuth();

  // Use auth state and functions...
}
```

### Auth Functions

**login(credentials: LoginCredentials): Promise<void>**
- Authenticates user with email and password
- Saves tokens to localStorage
- Updates auth state on success
- Throws error on failure

**register(credentials: RegisterCredentials): Promise<void>**
- Creates new user account
- Automatically logs in on success
- Saves tokens to localStorage
- Throws error on failure

**logout(): Promise<void>**
- Calls logout API endpoint
- Clears local storage
- Resets auth state
- Always succeeds (clears local data even if API fails)

**refreshToken(): Promise<void>**
- Refreshes expired access token
- Uses stored refresh token
- Updates access token in storage
- Clears auth data if refresh fails

**clearError(): void**
- Clears current error message
- Useful when user starts typing after an error

## Validation Rules

### Login Form
- **Email**: Required, must be valid email format
- **Password**: Required, minimum 6 characters

### Register Form
- **Name**: Required, minimum 2 characters
- **Email**: Required, must be valid email format
- **Password**: Required, minimum 8 characters, must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **Confirm Password**: Must match password field

## Storage

Authentication data is stored in localStorage:
- `grocery_auth_access_token` - Access token
- `grocery_auth_refresh_token` - Refresh token
- `grocery_auth_token_expiry` - Token expiration timestamp
- `grocery_auth_user` - User object (JSON)

## Styling

The authentication forms use styles from:
- `src/components/LoginForm.css` - Specific auth component styles
- `src/App.css` - Shared CSS variables and base styles

### CSS Variables Used
- `--primary-color` - Primary buttons and links
- `--primary-hover` - Primary button hover state
- `--danger-color` - Error messages and borders
- `--bg-color` - Page background
- `--card-bg` - Form card background
- `--text-color` - Primary text color
- `--text-muted` - Secondary text color
- `--border-color` - Input borders

### Customization

To customize the appearance:

1. Override CSS variables in your `App.css`:
```css
:root {
  --primary-color: #your-color;
  --danger-color: #your-color;
  /* etc. */
}
```

2. Or modify `LoginForm.css` directly for auth-specific styles.

## Accessibility

Both forms are fully accessible:
- Semantic HTML elements (`<form>`, `<label>`, `<input>`)
- Proper ARIA attributes (`aria-required`, `aria-invalid`, `aria-describedby`)
- Screen reader-friendly error messages
- Keyboard navigation support
- Focus indicators
- Loading states announced via `aria-busy`

## Error Handling

The authentication system handles errors at multiple levels:

1. **Client-side validation** - Immediate feedback for invalid input
2. **Server errors** - Displayed in a banner at the top of the form
3. **Network errors** - Caught and displayed as server errors
4. **Token expiration** - Automatic refresh attempt or logout

Error messages are:
- Clear and user-friendly
- Displayed inline for field errors
- Shown in a banner for server errors
- Accessible to screen readers

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
2. **HTTPS**: Always use HTTPS in production to protect credentials
3. **Token Expiration**: Access tokens should have short expiration times
4. **Refresh Tokens**: Should be invalidated on logout
5. **Password Requirements**: Enforce strong passwords on both client and server
6. **CORS**: Configure proper CORS headers on your API
7. **Rate Limiting**: Implement rate limiting on authentication endpoints

## Testing

To test the authentication system without a backend:

1. Modify `AuthContext.tsx` to use mock data:
```tsx
const login = async (credentials: LoginCredentials) => {
  // Mock successful login
  const mockUser = {
    id: '1',
    email: credentials.email,
    name: 'Test User',
    createdAt: Date.now(),
  };
  
  const mockTokens = {
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    expiresAt: Date.now() + 3600000, // 1 hour
  };
  
  saveAuthData(mockUser, mockTokens);
};
```

2. Or use a mock API service like MSW (Mock Service Worker)

## Troubleshooting

**Issue: "useAuth must be used within an AuthProvider"**
- Ensure `<AuthProvider>` wraps your `<App />` in `main.tsx`

**Issue: Login/Register not working**
- Check browser console for errors
- Verify API_BASE_URL is correct in `.env`
- Ensure backend is running and accessible
- Check network tab for API responses

**Issue: Token refresh not working**
- Verify refresh token is stored in localStorage
- Check if refresh endpoint is implemented correctly
- Ensure token expiry times are set properly

**Issue: User logged out unexpectedly**
- Check token expiration times
- Verify refresh token is still valid
- Check if logout was called elsewhere

**Issue: Styling looks wrong**
- Ensure `LoginForm.css` is imported
- Check if CSS variables are defined in `App.css`
- Verify no conflicting styles in parent components

## Future Enhancements

Potential improvements for the auth system:

1. **Password Reset** - Implement forgot password flow
2. **Email Verification** - Verify email addresses after registration
3. **Social Login** - Add Google, GitHub, etc. authentication
4. **Two-Factor Authentication** - Add 2FA support
5. **Remember Me** - Optional longer session duration
6. **Session Management** - View and manage active sessions
7. **Account Settings** - Change password, update profile
8. **httpOnly Cookies** - More secure token storage
9. **Biometric Auth** - WebAuthn/Face ID/Touch ID support
10. **Account Lockout** - Prevent brute force attacks

## License

This authentication system is part of the Grocery List app.
