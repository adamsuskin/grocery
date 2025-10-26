# Authentication System - Key Code Snippets

Quick reference for the most important code patterns in the authentication system.

## 1. Using the Auth Hook

```tsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { 
    user,              // Current user or null
    isAuthenticated,   // Boolean
    loading,           // Boolean
    error,             // String or null
    login,             // Function
    logout,            // Function
    clearError         // Function
  } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## 2. Login Form Usage

```tsx
import { LoginForm } from './components/LoginForm';

function AuthView() {
  const [view, setView] = useState('login');

  return (
    <LoginForm 
      onSwitchToRegister={() => setView('register')} 
    />
  );
}
```

## 3. Register Form Usage

```tsx
import { RegisterForm } from './components/RegisterForm';

function AuthView() {
  const [view, setView] = useState('register');

  return (
    <RegisterForm 
      onSwitchToLogin={() => setView('login')} 
    />
  );
}
```

## 4. Combined Auth Page

```tsx
import { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';

export function AuthPage() {
  const [view, setView] = useState<'login' | 'register'>('login');

  return view === 'login' ? (
    <LoginForm onSwitchToRegister={() => setView('register')} />
  ) : (
    <RegisterForm onSwitchToLogin={() => setView('login')} />
  );
}
```

## 5. Protected App Component

```tsx
import { useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { MainApp } from './MainApp';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <MainApp /> : <AuthPage />;
}

export default App;
```

## 6. Main.tsx Setup

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

## 7. Manual Login

```tsx
import { useAuth } from './context/AuthContext';

function ManualLogin() {
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await login({
        email: 'user@example.com',
        password: 'password123'
      });
      // Success! AuthContext updates state automatically
    } catch (err) {
      // Error is in the error state
      console.error('Login failed:', error);
    }
  };

  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </button>
  );
}
```

## 8. Manual Register

```tsx
import { useAuth } from './context/AuthContext';

function ManualRegister() {
  const { register, loading, error } = useAuth();

  const handleRegister = async () => {
    try {
      await register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123'
      });
      // Success! User is automatically logged in
    } catch (err) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <button onClick={handleRegister} disabled={loading}>
      {loading ? 'Creating account...' : 'Register'}
    </button>
  );
}
```

## 9. Logout Button

```tsx
import { useAuth } from './context/AuthContext';

function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Logout
    </button>
  );
}
```

## 10. User Info Display

```tsx
import { useAuth } from './context/AuthContext';

function UserProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="user-profile">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <small>
        Member since: {new Date(user.createdAt).toLocaleDateString()}
      </small>
    </div>
  );
}
```

## 11. Conditional Rendering

```tsx
import { useAuth } from './context/AuthContext';

function ConditionalContent() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h2>Welcome back, {user?.name}!</h2>
          <MainContent />
        </div>
      ) : (
        <div>
          <h2>Please sign in</h2>
          <AuthPage />
        </div>
      )}
    </div>
  );
}
```

## 12. Loading State

```tsx
import { useAuth } from './context/AuthContext';

function AppWithLoading() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <MainApp /> : <AuthPage />;
}
```

## 13. Error Handling

```tsx
import { useAuth } from './context/AuthContext';

function ErrorDisplay() {
  const { error, clearError } = useAuth();

  if (!error) return null;

  return (
    <div className="error-banner">
      <p>{error}</p>
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

## 14. Custom Validation

```tsx
const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return undefined;
};
```

## 15. Mock Authentication (Testing)

Replace the login function in AuthContext.tsx:

```tsx
const login = async (credentials: LoginCredentials) => {
  try {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    // MOCK - Remove in production
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '1',
      email: credentials.email,
      name: credentials.email.split('@')[0],
      createdAt: Date.now(),
    };
    
    const mockTokens: AuthTokens = {
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
      expiresAt: Date.now() + 3600000,
    };
    
    saveAuthData(mockUser, mockTokens);
  } catch (error) {
    setAuthState(prev => ({
      ...prev,
      loading: false,
      error: 'Login failed',
    }));
    throw error;
  }
};
```

## 16. Environment Configuration

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

Access in code:

```tsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

## 17. TypeScript Types

```tsx
import type {
  User,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  AuthContextValue,
} from './types/auth';

// Use in components
const user: User = {
  id: '1',
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: Date.now(),
};

const credentials: LoginCredentials = {
  email: 'user@example.com',
  password: 'password123',
};
```

## 18. Custom Hook for Protected Route

```tsx
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}
```

## 19. Session Check

```tsx
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';

function SessionMonitor() {
  const { isAuthenticated, refreshToken } = useAuth();

  useEffect(() => {
    // Check session every 5 minutes
    const interval = setInterval(() => {
      if (isAuthenticated) {
        refreshToken();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken]);

  return null;
}
```

## 20. API Request with Auth Token

```tsx
import { useAuth } from './context/AuthContext';

function useAuthenticatedFetch() {
  const { token } = useAuth();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response.json();
  };

  return fetchWithAuth;
}

// Usage
function MyComponent() {
  const fetchWithAuth = useAuthenticatedFetch();

  const getData = async () => {
    const data = await fetchWithAuth('/api/data');
    console.log(data);
  };
}
```

---

These snippets cover the most common use cases for the authentication system. For more detailed information, see:
- `AUTH_README.md` - Complete documentation
- `INTEGRATION_EXAMPLE.md` - Step-by-step integration
- `AUTHENTICATION_SUMMARY.md` - Implementation overview
