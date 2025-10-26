/**
 * Authentication Usage Examples
 *
 * This file demonstrates how to use the AuthContext in various scenarios.
 * Copy these examples into your components as needed.
 */

import React, { useState } from 'react';
import { useAuth, useAuthToken, useAuthUser } from '../contexts/AuthContext';

/**
 * Example 1: Login Form Component
 */
export function LoginForm() {
  const { login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({ email, password });
      // Login successful - user is now authenticated
      // Zero client is automatically synchronized with user credentials
      console.log('Login successful!');
    } catch (error) {
      // Error is already set in context
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>

      {error && (
        <div className="error">
          {error}
          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

/**
 * Example 2: Registration Form Component
 */
export function RegisterForm() {
  const { register, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register({ email, password, name });
      // Registration successful - user is now authenticated
      console.log('Registration successful!');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>

      {error && (
        <div className="error">
          {error}
          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

/**
 * Example 3: User Profile Display
 */
export function UserProfile() {
  const user = useAuthUser(); // Helper hook to get just the user
  const { logout, loading } = useAuth();

  if (!user) {
    return <div>Not logged in</div>;
  }

  const handleLogout = async () => {
    try {
      await logout();
      // Logout successful - user is now logged out
      // Zero client is automatically reset to demo mode
      console.log('Logout successful!');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="user-profile">
      <h2>Welcome, {user.name}!</h2>
      <p>Email: {user.email}</p>
      <p>User ID: {user.id}</p>

      <button onClick={handleLogout} disabled={loading}>
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

/**
 * Example 4: Protected Route Component
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Please log in to access this page</h2>
        <LoginForm />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Example 5: Making Authenticated API Calls
 */
export function DataFetchingComponent() {
  const token = useAuthToken(); // Helper hook to get just the token
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/data', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>

      {error && <div className="error">{error}</div>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

/**
 * Example 6: Auth Status Display
 */
export function AuthStatus() {
  const { user, isAuthenticated, loading, error } = useAuth();

  if (loading) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div className="auth-status">
      <h3>Authentication Status</h3>
      <p>
        Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
      </p>
      {user && (
        <div>
          <p>User: {user.name} ({user.email})</p>
          <p>User ID: {user.id}</p>
        </div>
      )}
      {error && <p className="error">Error: {error}</p>}
    </div>
  );
}

/**
 * Example 7: Conditional Rendering Based on Auth
 */
export function ConditionalContent() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h2>Welcome back, {user?.name}!</h2>
          <p>You have access to all features.</p>
        </div>
      ) : (
        <div>
          <h2>Welcome, Guest!</h2>
          <p>Please log in to access all features.</p>
          <LoginForm />
        </div>
      )}
    </div>
  );
}

/**
 * Example 8: Complete Auth Flow Component
 */
export function AuthenticationPage() {
  const { isAuthenticated, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="auth-page">
        <UserProfile />
      </div>
    );
  }

  return (
    <div className="auth-page">
      {showRegister ? (
        <div>
          <RegisterForm />
          <p>
            Already have an account?{' '}
            <button onClick={() => setShowRegister(false)}>
              Login here
            </button>
          </p>
        </div>
      ) : (
        <div>
          <LoginForm />
          <p>
            Don't have an account?{' '}
            <button onClick={() => setShowRegister(true)}>
              Register here
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 9: Manual Token Refresh
 */
export function TokenRefreshButton() {
  const { refreshToken, loading } = useAuth();
  const [message, setMessage] = useState('');

  const handleRefresh = async () => {
    try {
      await refreshToken();
      setMessage('Token refreshed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to refresh token');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div>
      <button onClick={handleRefresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Token'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
