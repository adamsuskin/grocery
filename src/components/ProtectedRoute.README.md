# ProtectedRoute / RequireAuth Component

A React component that ensures users are authenticated before accessing protected content.

## Features

- Checks authentication status from AuthContext
- Shows loading state while checking auth
- Redirects to login if not authenticated
- Can wrap any React component/children
- Works without react-router (uses conditional rendering)
- Full TypeScript support
- Responsive design
- Built-in default login UI
- Support for custom login components

## Quick Start

### Basic Usage

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <ProtectedRoute>
      <YourProtectedContent />
    </ProtectedRoute>
  );
}
```

### With Custom Login

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';
import { CustomLogin } from './components/CustomLogin';

function App() {
  return (
    <ProtectedRoute fallback={<CustomLogin />}>
      <YourProtectedContent />
    </ProtectedRoute>
  );
}
```

### Using RequireAuth (Alternative Name)

```tsx
import { RequireAuth } from './components/RequireAuth';

function App() {
  return (
    <RequireAuth>
      <YourProtectedContent />
    </RequireAuth>
  );
}
```

## Props

```typescript
interface ProtectedRouteProps {
  children: ReactNode;       // The content to protect
  fallback?: ReactNode;       // Optional custom login component
}
```

### children
The protected content that should only be visible to authenticated users.

### fallback (optional)
A custom component to show when the user is not authenticated. If not provided, the default login UI will be displayed.

## States

The component handles three authentication states:

1. **Loading**: Shows a loading spinner while checking authentication
2. **Not Authenticated**: Shows the login UI (default or custom)
3. **Authenticated**: Renders the protected content

## Default Login UI

When no `fallback` is provided, ProtectedRoute displays a beautiful default login form with:

- Email and password fields
- Form validation
- Loading states during login
- Error message display
- Responsive design with gradient background
- Accessibility features (ARIA labels, proper autocomplete)

## Integration with AuthContext

The component uses the `useAuth()` hook from AuthContext:

```typescript
const { isAuthenticated, loading } = useAuth();
```

### Required AuthContext Properties

- `isAuthenticated`: boolean - Whether the user is logged in
- `loading`: boolean - Whether auth state is being checked
- `login`: function - Method to log in a user
- `error`: string | null - Any authentication errors
- `clearError`: function - Method to clear errors

## Examples

### Example 1: Protect Entire App

```tsx
// main.tsx
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// App.tsx
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <ProtectedRoute>
      <MainApp />
    </ProtectedRoute>
  );
}
```

### Example 2: Protect Specific Routes

```tsx
function App() {
  return (
    <div>
      {/* Public content */}
      <Header />
      <HomePage />

      {/* Protected content */}
      <ProtectedRoute>
        <Dashboard />
        <Settings />
      </ProtectedRoute>
    </div>
  );
}
```

### Example 3: With User Info Display

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div>
        <header>
          <h1>Welcome, {user?.name}!</h1>
          <button onClick={logout}>Logout</button>
        </header>
        <main>
          <YourContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

### Example 4: Multiple Protected Sections

```tsx
function App() {
  return (
    <div>
      <PublicSection />

      <ProtectedRoute>
        <AdminPanel />
      </ProtectedRoute>

      <ProtectedRoute fallback={<SubscriptionPrompt />}>
        <PremiumFeatures />
      </ProtectedRoute>
    </div>
  );
}
```

## Styling

The component includes a complete CSS file (`ProtectedRoute.css`) with:

- Loading spinner animation
- Modern login form design
- Gradient backgrounds
- Responsive layouts
- Form input states
- Error message styling
- Button animations

### Custom Styling

To override the default styles, you can:

1. Modify `ProtectedRoute.css` directly
2. Use CSS modules
3. Add custom classes via your theme

## Loading State

The loading state shows:
- Animated spinner
- "Checking authentication..." message
- Centered layout
- Smooth animations

## Error Handling

Errors are displayed in the login form:
- Red error message box
- Shake animation on error
- Clear error button integration
- Accessible error alerts (ARIA)

## TypeScript

Fully typed with TypeScript:

```typescript
import { ProtectedRoute, ProtectedRouteProps } from './components/ProtectedRoute';
import { RequireAuth, RequireAuthProps } from './components/RequireAuth';
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires ES6+ support

## Dependencies

- React 18+
- AuthContext (from `src/contexts/AuthContext.tsx`)

## Notes

- Does not require react-router
- Works with any routing library or no router at all
- Uses conditional rendering instead of route guards
- Handles session persistence via AuthContext
- Automatically shows appropriate UI based on auth state

## See Also

- [AUTHENTICATION_GUIDE.md](/home/adam/grocery/AUTHENTICATION_GUIDE.md) - Complete authentication system guide
- [AuthContext.tsx](/home/adam/grocery/src/contexts/AuthContext.tsx) - Authentication context
- [CustomLogin.example.tsx](/home/adam/grocery/src/components/CustomLogin.example.tsx) - Custom login example
