import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import type { LoginCredentials } from '../types/auth';
import { ErrorBanner } from './ErrorDisplay';
import { handleAuthError } from '../utils/authErrors';
import './LoginForm.css';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm({ onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  const { login, loading, clearError } = useAuth();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [authError, setAuthError] = useState<unknown>(null);

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    return undefined;
  };

  // Password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: FormErrors = {
      email: validateEmail(credentials.email),
      password: validatePassword(credentials.password),
    };

    setFormErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear server error when user starts typing
    if (authError) {
      setAuthError(null);
      clearError();
    }

    // Validate field if it has been touched
    if (touched[name as keyof typeof touched]) {
      if (name === 'email') {
        setFormErrors(prev => ({
          ...prev,
          email: validateEmail(value),
        }));
      } else if (name === 'password') {
        setFormErrors(prev => ({
          ...prev,
          password: validatePassword(value),
        }));
      }
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur
    if (name === 'email') {
      setFormErrors(prev => ({
        ...prev,
        email: validateEmail(credentials.email),
      }));
    } else if (name === 'password') {
      setFormErrors(prev => ({
        ...prev,
        password: validatePassword(credentials.password),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await login(credentials);
      // Success - the AuthContext will handle state updates
      // Parent component should handle navigation
    } catch (err) {
      // Handle error with comprehensive error handling
      const errorInfo = handleAuthError(err, {
        clearAuthOnUnauthorized: false, // Don't clear on login failure
        logToConsole: true,
      });
      setAuthError(err);
      console.error('Login failed:', errorInfo);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <div className="login-form-header">
          <h2>Welcome Back</h2>
          <p className="login-form-subtitle">Sign in to access your grocery list</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Server Error Display */}
          <ErrorBanner
            error={authError}
            onClose={() => {
              setAuthError(null);
              clearError();
            }}
          />

          {/* Email Field */}
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`input ${formErrors.email && touched.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!formErrors.email && touched.email}
              aria-describedby={formErrors.email && touched.email ? 'email-error' : undefined}
              disabled={loading}
            />
            {formErrors.email && touched.email && (
              <span id="email-error" className="field-error" role="alert">
                {formErrors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-field">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input ${formErrors.password && touched.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={!!formErrors.password && touched.password}
                aria-describedby={formErrors.password && touched.password ? 'password-error' : undefined}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formErrors.password && touched.password && (
              <span id="password-error" className="field-error" role="alert">
                {formErrors.password}
              </span>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="form-links">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                if (onForgotPassword) {
                  onForgotPassword();
                } else {
                  // Fallback: navigate to forgot password page
                  window.location.href = '/forgot-password';
                }
              }}
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-login"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Register Link */}
          <div className="form-footer">
            <p className="register-prompt">
              Don't have an account?{' '}
              <button
                type="button"
                className="link-button link-primary"
                onClick={onSwitchToRegister}
                disabled={loading}
              >
                Create account
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
