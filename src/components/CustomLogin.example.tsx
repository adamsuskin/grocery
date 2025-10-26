/**
 * Example Custom Login Component
 *
 * This demonstrates how to create a custom login component
 * to use as a fallback for ProtectedRoute.
 *
 * Usage:
 * <ProtectedRoute fallback={<CustomLogin />}>
 *   <YourApp />
 * </ProtectedRoute>
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function CustomLogin() {
  const { login, register, loading, error, clearError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isLoginMode) {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
      }
    } catch (err) {
      console.error('Authentication error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearError();
    setFormData({ email: '', password: '', name: '' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          {isLoginMode ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p style={styles.subtitle}>
          {isLoginMode
            ? 'Sign in to access your grocery list'
            : 'Register to start managing your groceries'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLoginMode && (
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Your name"
                disabled={loading}
                required={!isLoginMode}
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="you@example.com"
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter your password"
              disabled={loading}
              required
              autoComplete={isLoginMode ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div style={styles.error} role="alert">
              {error}
            </div>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading
              ? 'Please wait...'
              : isLoginMode
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          <button
            type="button"
            onClick={toggleMode}
            style={styles.toggleButton}
            disabled={loading}
          >
            {isLoginMode
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline styles for the example
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
    padding: '1rem',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    padding: '3rem',
    width: '100%',
    maxWidth: '450px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: '0 0 0.5rem 0',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '1rem',
    color: '#718096',
    margin: '0 0 2rem 0',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#2d3748',
    margin: 0,
  },
  input: {
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  error: {
    padding: '0.875rem 1rem',
    backgroundColor: '#fff5f5',
    border: '1px solid #fc8181',
    borderRadius: '8px',
    color: '#c53030',
    fontSize: '0.875rem',
  },
  button: {
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
  },
  footer: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e2e8f0',
    textAlign: 'center' as const,
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#6B73FF',
    fontSize: '0.875rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '0.5rem',
  },
};
