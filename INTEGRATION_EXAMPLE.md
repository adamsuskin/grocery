# Quick Integration Guide

This guide shows how to quickly integrate the authentication system into your Grocery List app.

## Step 1: Wrap App with AuthProvider

Update `/home/adam/grocery/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

## Step 2: Update App.tsx to Handle Auth State

```tsx
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { AddItemForm } from './components/AddItemForm';
import { GroceryList } from './components/GroceryList';
import type { FilterState, SortState } from './types';
import { CATEGORIES } from './types';
import './App.css';

function App() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    showGotten: true,
    categories: [...CATEGORIES],
  });

  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc',
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (newSort: SortState) => {
    setSort(newSort);
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show main app if authenticated
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>🛒 Grocery List</h1>
            <p className="subtitle">Collaborative shopping list</p>
          </div>
          <div className="user-menu">
            <span className="user-name">Welcome, {user?.name}!</span>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="add-section">
          <h2>Add Item</h2>
          <AddItemForm />
        </section>

        <section className="list-section">
          <h2>Shopping List</h2>
          <GroceryList
            filters={filters}
            onFilterChange={handleFilterChange}
            sort={sort}
            onSortChange={handleSortChange}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
```

## Step 3: Add Loading and User Menu Styles

Add to `/home/adam/grocery/src/App.css`:

```css
/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  color: var(--text-muted);
  font-size: 1.1rem;
}

/* Header Updates */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-size: 0.95rem;
  color: var(--text-color);
  font-weight: 500;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: var(--text-color);
}

.btn-secondary:hover {
  background-color: #d0d0d0;
}

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-menu {
    width: 100%;
    justify-content: space-between;
  }
}
```

## Step 4: Test the Integration

1. Start the development server:
```bash
pnpm dev
```

2. Navigate to http://localhost:5173

3. You should see the registration form

4. Test the flow:
   - Register a new account
   - Verify validation works
   - After successful registration, you should see the main app
   - Try logging out
   - Switch between login and registration forms

## Step 5: Connect to Backend API (When Ready)

When you have a backend API, update the AuthContext methods:

In `/home/adam/grocery/src/contexts/AuthContext.tsx`, find the `register` function and replace the mock implementation:

```typescript
const register = async (credentials: RegisterCredentials): Promise<void> => {
  setAuthState(prev => ({ ...prev, loading: true, error: null }));

  try {
    const response = await fetch('YOUR_API_URL/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data: RegisterResponse = await response.json();

    // Store tokens
    storage.set(AUTH_STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
    storage.set(AUTH_STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
    storage.set(AUTH_STORAGE_KEYS.TOKEN_EXPIRY, data.tokens.expiresAt.toString());
    storage.set(AUTH_STORAGE_KEYS.USER, JSON.stringify(data.user));

    setAuthState({
      user: data.user,
      token: data.tokens.accessToken,
      loading: false,
      error: null,
      isAuthenticated: true,
    });
  } catch (error) {
    setAuthState(prev => ({
      ...prev,
      loading: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    }));
    throw error;
  }
};
```

Do the same for the `login` function.

## Alternative: Simple Testing Mode

If you want to test the UI without a backend, the current mock implementation works out of the box:

- Registration always succeeds after 1.5 seconds
- User data is stored in localStorage
- Logout clears the data
- Refresh the page to see persistence

## Troubleshooting

### "useAuth must be used within an AuthProvider"

**Problem**: Trying to use useAuth() outside of AuthProvider
**Solution**: Ensure AuthProvider wraps your entire App in main.tsx

### Form doesn't show validation errors

**Problem**: Errors only show after fields are "touched"
**Solution**: This is intentional - interact with fields (click in/out) to see errors

### Styles look broken

**Problem**: CSS not loading or CSS variables missing
**Solution**: Ensure App.css is imported and contains all CSS variables

### Page refreshes and user is logged out

**Problem**: Auth state not persisting
**Solution**: Check browser localStorage - tokens should be saved. Check AuthContext's useEffect for loading logic.

## Next Steps

1. ✅ Complete this integration
2. 🔄 Test thoroughly in development
3. 🔄 Connect to your backend API
4. 🔄 Add password reset flow
5. 🔄 Add email verification
6. 🔄 Implement token refresh logic
7. 🔄 Add proper error handling
8. 🔄 Set up production environment variables
9. 🔄 Deploy to production

---

**Need Help?** See AUTHENTICATION_GUIDE.md for detailed documentation.
