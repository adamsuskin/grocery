# Integration Guide - Adding Auth to Your App

This guide shows exactly how to integrate the authentication system into your existing grocery list application.

## Step 1: Update main.tsx

Add the AuthProvider wrapper around your app:

```tsx
// Before
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ZeroProvider } from '@rocicorp/zero/react';
import App from './App';
import './index.css';
import { zeroInstance } from './zero-store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ZeroProvider zero={zeroInstance}>
      <App />
    </ZeroProvider>
  </StrictMode>
);
```

```tsx
// After
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ZeroProvider } from '@rocicorp/zero/react';
import { AuthProvider } from './contexts/AuthContextWithZero'; // ⭐ Add this
import App from './App';
import './index.css';
import { zeroInstance } from './zero-store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>  {/* ⭐ Add this wrapper */}
      <ZeroProvider zero={zeroInstance}>
        <App />
      </ZeroProvider>
    </AuthProvider>
  </StrictMode>
);
```

## Step 2: Add Login/Register UI to App.tsx

Update your App component to show login when not authenticated:

```tsx
// Add to imports
import { useAuth } from './contexts/AuthContextWithZero';

// Inside App component
function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    showGotten: true,
    categories: [...CATEGORIES],
  });
  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc',
  });

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app">
        <div className="loading">Checking authentication...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app">
        <header className="header">
          <h1>🛒 Grocery List</h1>
          <p className="subtitle">Please login to continue</p>
        </header>
        <main className="main">
          <LoginForm />
        </main>
      </div>
    );
  }

  // Original app content for authenticated users
  return (
    <div className="app">
      <header className="header">
        <h1>🛒 Grocery List</h1>
        <p className="subtitle">Welcome, {user?.name}!</p>
        <LogoutButton />
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
```

## Step 3: Create Login Form Component

Create a simple login form component:

```tsx
// src/components/LoginForm.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContextWithZero';

export function LoginForm() {
  const { login, register, loading, error, clearError } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isRegistering) {
        await register({ email, password, name });
      } else {
        await login({ email, password });
      }
      // Success - auth context will update and redirect
    } catch (err) {
      // Error is already in context
      console.error('Auth failed:', err);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>

      {error && (
        <div style={{
          padding: '10px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
          <button
            onClick={clearError}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>
              Name:
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email:
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Login')}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        {isRegistering ? (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setIsRegistering(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Login here
            </button>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <button
              onClick={() => setIsRegistering(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Register here
            </button>
          </>
        )}
      </p>
    </div>
  );
}
```

## Step 4: Create Logout Button Component

```tsx
// src/components/LogoutButton.tsx
import { useAuth } from '../contexts/AuthContextWithZero';

export function LogoutButton() {
  const { logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: '8px 16px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '14px'
      }}
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
```

## Step 5: Update App.tsx Imports

Add the new components to your imports:

```tsx
import { useState } from 'react';
import { useAuth } from './contexts/AuthContextWithZero';
import { AddItemForm } from './components/AddItemForm';
import { GroceryList } from './components/GroceryList';
import { LoginForm } from './components/LoginForm';
import { LogoutButton } from './components/LogoutButton';
import type { FilterState, SortState } from './types';
import { CATEGORIES } from './types';
import './App.css';
```

## Step 6: Create Environment File

Create a `.env` file in the root directory:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# Zero Server URL (already configured)
VITE_ZERO_SERVER=http://localhost:4848
```

## Step 7: Backend API Implementation

Your backend needs to implement these endpoints. Here's a basic Express.js example:

```javascript
// server/auth/routes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock user database (replace with real database)
const users = [];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      createdAt: Date.now(),
    };

    users.push(user);

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 3600000, // 1 hour
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 3600000,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Generate new access token
    const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      accessToken,
      expiresAt: Date.now() + 3600000,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // In a real app, you'd invalidate the token here
  res.json({ success: true });
});

export default router;
```

## Testing the Integration

1. **Start your development servers:**
   ```bash
   # Terminal 1: Start Zero cache
   pnpm zero:dev

   # Terminal 2: Start backend API (if you have one)
   node server.js

   # Terminal 3: Start Vite dev server
   pnpm dev
   ```

2. **Test the flow:**
   - Visit the app - you should see the login form
   - Try registering a new account
   - Login with your credentials
   - You should see the grocery list
   - Add some items (they're scoped to your user!)
   - Logout and login again - your items persist
   - Try refreshing the page - you stay logged in

3. **Verify Zero integration:**
   - Open browser console
   - Look for messages like: `[Zero] Initialized with authenticated user: {userId}`
   - Check that grocery items are user-specific

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"
**Solution**: Make sure AuthProvider wraps your entire app in main.tsx

### Issue: Login successful but still showing login form
**Solution**: Check that your API response matches the expected format in `LoginResponse` type

### Issue: Token keeps expiring
**Solution**: Check that your backend returns the correct `expiresAt` timestamp

### Issue: Zero not syncing with auth
**Solution**: Verify you're using `AuthContextWithZero` not the base `AuthContext`

## Next Steps

1. Style the login form to match your app design
2. Add "Remember Me" functionality
3. Implement password reset flow
4. Add social login (Google, GitHub, etc.)
5. Implement proper error messages
6. Add loading states throughout the app
7. Set up proper backend with database

## Summary

You now have a complete authentication system integrated with:
- ✅ Login/Register UI
- ✅ Protected routes
- ✅ User-scoped data via Zero
- ✅ Automatic token refresh
- ✅ Persistent sessions
- ✅ Logout functionality

All your grocery list data is now properly scoped to the authenticated user!
