import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ProtectedRoute.css';

export interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Ensures users are authenticated before rendering protected content.
 * - Checks authentication status from AuthContext
 * - Shows loading state while checking auth
 * - Redirects to login if not authenticated
 * - Can wrap any React component/children
 * - Works without react-router using conditional rendering
 *
 * @example
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * @example With custom fallback
 * <ProtectedRoute fallback={<CustomLogin />}>
 *   <Dashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // If not authenticated, show login fallback or default login UI
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : <DefaultLoginUI />;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}

/**
 * Default Login UI
 * Simple login form shown when no custom fallback is provided
 */
function DefaultLoginUI() {
  const { login, loading, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      await login({ email, password });
    } catch (err) {
      setLocalError('Login failed. Please try again.');
      console.error('Login error:', err);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Please sign in to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
              autoComplete="current-password"
            />
          </div>

          {displayError && (
            <div className="error-message" role="alert">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-note">
            Demo mode: Enter any email and password
          </p>
        </div>
      </div>
    </div>
  );
}
