# Authentication System Documentation

This document describes the authentication system for the Grocery List app, including the registration form component and related features.

## Overview

The authentication system includes:
- **RegisterForm Component**: Full-featured user registration form
- **LoginForm Component**: User login form
- **AuthContext**: React context for authentication state management
- **Type Definitions**: TypeScript types for auth-related data
- **AuthPage Component**: Container component for auth UI

## Components

### RegisterForm

Located at: `/home/adam/grocery/src/components/RegisterForm.tsx`

A comprehensive registration form component with the following features:

#### Features
- ✅ Username/name validation
- ✅ Email validation with format checking
- ✅ Password strength validation (min 8 chars, uppercase, lowercase, number)
- ✅ Confirm password matching
- ✅ Real-time validation feedback
- ✅ Touch-based error display (errors show after field blur)
- ✅ Loading state during registration
- ✅ Server error display
- ✅ Accessible form elements (ARIA labels, roles, descriptions)
- ✅ Password visibility toggle
- ✅ Link to switch to login form
- ✅ Consistent styling with app design
- ✅ Integration with AuthContext

#### Props

```typescript
interface RegisterFormProps {
  onSwitchToLogin?: () => void;  // Callback to switch to login view
}
```

#### Usage Example

```tsx
import { RegisterForm } from './components/RegisterForm';

function MyAuthPage() {
  const handleSwitchToLogin = () => {
    // Navigate to login page or switch view
  };

  return <RegisterForm onSwitchToLogin={handleSwitchToLogin} />;
}
```

#### Validation Rules

**Name:**
- Required field
- Minimum 2 characters

**Email:**
- Required field
- Must be valid email format (name@domain.com)

**Password:**
- Required field
- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Special characters optional (not enforced)

**Confirm Password:**
- Required field
- Must exactly match password field

### LoginForm

Located at: `/home/adam/grocery/src/components/LoginForm.tsx`

A user login form with email and password fields.

#### Features
- ✅ Email validation
- ✅ Password visibility toggle
- ✅ Remember me checkbox
- ✅ Forgot password link (placeholder)
- ✅ Loading state
- ✅ Error display
- ✅ Accessible form elements
- ✅ Link to registration form

#### Props

```typescript
interface LoginFormProps {
  onSwitchToRegister?: () => void;  // Callback to switch to register view
}
```

### AuthPage

Located at: `/home/adam/grocery/src/components/AuthPage.tsx`

Container component that switches between LoginForm and RegisterForm.

#### Usage Example

```tsx
import { AuthPage } from './components/AuthPage';

// In your main App component
function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <YourMainApp />;
}
```

## AuthContext

Located at: `/home/adam/grocery/src/contexts/AuthContext.tsx`

Provides authentication state and methods throughout the app.

### Context Value

```typescript
interface AuthContextValue {
  user: User | null;              // Current user
  token: string | null;           // Auth token
  loading: boolean;               // Loading state
  error: string | null;           // Error message
  isAuthenticated: boolean;       // Auth status
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}
```

### Hook Usage

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use auth state and methods
}
```

### Setup in main.tsx

```tsx
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

## Type Definitions

Located at: `/home/adam/grocery/src/types/auth.ts`

### Key Types

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}
```

## Styling

### CSS Files

- **RegisterForm.css**: Specific styles for registration form
- **LoginForm.css**: Shared styles for both login and register forms
- **AuthPage.css**: Container styles for auth pages

### Design System Integration

The forms use CSS variables from the main App.css:

```css
--primary-color: #4caf50;
--primary-hover: #45a049;
--danger-color: #f44336;
--bg-color: #f5f5f5;
--card-bg: #ffffff;
--text-color: #333;
--border-color: #ddd;
```

### Responsive Design

- Mobile-first approach
- Breakpoint at 600px for small screens
- Stacks form fields vertically on mobile
- Adjusts padding and font sizes

## Accessibility Features

### ARIA Attributes

- `aria-required`: Marks required fields
- `aria-invalid`: Indicates validation errors
- `aria-describedby`: Links fields to error messages
- `aria-label`: Provides labels for icon buttons
- `role="alert"`: Announces errors to screen readers
- `aria-busy`: Indicates loading state

### Keyboard Navigation

- Tab order follows logical flow
- Password toggle buttons: `tabIndex={-1}` to skip in tab order
- Enter key submits form
- All interactive elements keyboard accessible

### Visual Indicators

- Color is not the only indicator (icons + text for errors)
- High contrast mode support
- Focus outlines on interactive elements
- Clear loading states

## Integration with Backend

The AuthContext currently uses mock API calls. To integrate with a real backend:

### 1. Update AuthContext

Replace mock implementations in `/home/adam/grocery/src/contexts/AuthContext.tsx`:

```typescript
// Replace this:
await new Promise((resolve) => setTimeout(resolve, 1500));

// With actual API calls:
const response = await fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message || 'Registration failed');
}

const data: RegisterResponse = await response.json();
```

### 2. API Endpoints Expected

**POST /api/register**
```typescript
Request: {
  email: string;
  password: string;
  name: string;
}

Response: {
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

**POST /api/login**
```typescript
Request: {
  email: string;
  password: string;
}

Response: {
  user: User;
  tokens: AuthTokens;
}
```

**POST /api/logout**
```typescript
Request: {
  refreshToken: string;
}

Response: {
  success: boolean;
}
```

### 3. Token Management

Tokens are stored in localStorage:
- `grocery_auth_access_token`
- `grocery_auth_refresh_token`
- `grocery_auth_token_expiry`
- `grocery_auth_user`

Update these keys in `AUTH_STORAGE_KEYS` if needed.

## Security Considerations

### Current Implementation

- ✅ Client-side password validation
- ✅ Passwords never stored in state longer than needed
- ✅ Token storage in localStorage
- ✅ Input sanitization via React

### Recommended Improvements

1. **HTTPS Only**: Ensure all requests use HTTPS in production
2. **Token Refresh**: Implement automatic token refresh before expiry
3. **CSRF Protection**: Add CSRF tokens for state-changing requests
4. **Rate Limiting**: Implement on backend to prevent brute force
5. **Password Hashing**: Backend must hash passwords (bcrypt, argon2)
6. **Secure Storage**: Consider more secure token storage (httpOnly cookies)
7. **Input Validation**: Always validate on backend, not just client

## Testing Checklist

### Manual Testing

- [ ] Register with valid data succeeds
- [ ] Register with invalid email shows error
- [ ] Register with weak password shows validation
- [ ] Passwords must match to submit
- [ ] Loading state shows during submission
- [ ] Server errors display properly
- [ ] Switch to login link works
- [ ] All fields clear on successful registration
- [ ] Tab order is logical
- [ ] Screen reader announces errors
- [ ] Works on mobile viewport
- [ ] Password toggle buttons work

### Unit Testing

```typescript
// Example tests to implement

describe('RegisterForm', () => {
  it('validates email format', () => {
    // Test email validation
  });

  it('requires password to match confirmation', () => {
    // Test password matching
  });

  it('enforces password strength requirements', () => {
    // Test password rules
  });

  it('displays server errors', () => {
    // Test error display
  });

  it('calls register function on valid submit', () => {
    // Test form submission
  });
});
```

## File Structure

```
src/
├── components/
│   ├── RegisterForm.tsx          # Registration form component
│   ├── RegisterForm.css          # Registration form styles
│   ├── LoginForm.tsx             # Login form component
│   ├── LoginForm.css             # Login/Register shared styles
│   ├── AuthPage.tsx              # Auth container component
│   └── AuthPage.css              # Auth page styles
├── contexts/
│   └── AuthContext.tsx           # Authentication context
├── types/
│   └── auth.ts                   # Auth-related TypeScript types
└── App.css                       # Global styles (CSS variables)
```

## Common Issues and Solutions

### Issue: Form not submitting

**Solution**: Check validation - all fields must be valid before submission. Open browser console to check for errors.

### Issue: Errors not showing

**Solution**: Errors only show after a field is "touched" (blurred). Click into and out of a field to trigger validation.

### Issue: Password toggle not working

**Solution**: Ensure JavaScript is enabled. Check browser console for errors.

### Issue: Styles not applying

**Solution**: Verify CSS files are imported. Check that App.css with CSS variables loads first.

### Issue: AuthContext errors

**Solution**: Ensure AuthProvider wraps your app in main.tsx. Use useAuth() only within components that are children of AuthProvider.

## Future Enhancements

Potential improvements for the authentication system:

1. **Social Login**: Add OAuth providers (Google, GitHub, etc.)
2. **Email Verification**: Require email confirmation before activation
3. **Password Reset**: Implement forgot password flow
4. **2FA**: Add two-factor authentication option
5. **Session Management**: Show active sessions, allow logout from all devices
6. **Password History**: Prevent password reuse
7. **Account Settings**: Allow users to update profile
8. **Progressive Enhancement**: Graceful degradation without JavaScript

## Support

For questions or issues with the authentication system:
1. Check this documentation first
2. Review the inline code comments
3. Check the TypeScript types for API contracts
4. Inspect browser console for errors

---

**Last Updated**: 2025-10-26
**Version**: 1.0.0
