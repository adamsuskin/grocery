import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import type { RegisterCredentials } from '../types/auth';
import { ErrorBanner } from './ErrorDisplay';
import { handleAuthError } from '../utils/authErrors';
import './LoginForm.css';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  confirmPassword?: string;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register, loading, clearError } = useAuth();

  const [credentials, setCredentials] = useState<RegisterCredentials & { confirmPassword: string }>({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    name: false,
    confirmPassword: false,
  });
  const [authError, setAuthError] = useState<unknown>(null);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return undefined;
  };

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

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      name: validateName(credentials.name),
      email: validateEmail(credentials.email),
      password: validatePassword(credentials.password),
      confirmPassword: validateConfirmPassword(credentials.confirmPassword, credentials.password),
    };

    setFormErrors(errors);
    return !errors.name && !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));

    if (authError) {
      setAuthError(null);
      clearError();
    }

    // Validate field if touched
    if (touched[name as keyof typeof touched]) {
      let fieldError: string | undefined;
      if (name === 'name') {
        fieldError = validateName(value);
      } else if (name === 'email') {
        fieldError = validateEmail(value);
      } else if (name === 'password') {
        fieldError = validatePassword(value);
        // Also revalidate confirm password if it's been filled
        if (credentials.confirmPassword) {
          setFormErrors(prev => ({
            ...prev,
            confirmPassword: validateConfirmPassword(credentials.confirmPassword, value),
          }));
        }
      } else if (name === 'confirmPassword') {
        fieldError = validateConfirmPassword(value, credentials.password);
      }

      setFormErrors(prev => ({
        ...prev,
        [name]: fieldError,
      }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur
    let fieldError: string | undefined;
    if (name === 'name') {
      fieldError = validateName(credentials.name);
    } else if (name === 'email') {
      fieldError = validateEmail(credentials.email);
    } else if (name === 'password') {
      fieldError = validatePassword(credentials.password);
    } else if (name === 'confirmPassword') {
      fieldError = validateConfirmPassword(credentials.confirmPassword, credentials.password);
    }

    setFormErrors(prev => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setTouched({
      email: true,
      password: true,
      name: true,
      confirmPassword: true,
    });

    if (!validateForm()) {
      return;
    }

    try {
      const { confirmPassword, ...registerData } = credentials;
      await register(registerData);
    } catch (err) {
      // Handle error with comprehensive error handling
      const errorInfo = handleAuthError(err, {
        clearAuthOnUnauthorized: false,
        logToConsole: true,
      });
      setAuthError(err);
      console.error('Registration failed:', errorInfo);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <div className="login-form-header">
          <h2>Create Account</h2>
          <p className="login-form-subtitle">Join to start managing your grocery list</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <ErrorBanner
            error={authError}
            onClose={() => {
              setAuthError(null);
              clearError();
            }}
          />

          {/* Name Field */}
          <div className="form-field">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={credentials.name}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`input ${formErrors.name && touched.name ? 'input-error' : ''}`}
              placeholder="John Doe"
              autoComplete="name"
              aria-required="true"
              aria-invalid={!!formErrors.name && touched.name}
              aria-describedby={formErrors.name && touched.name ? 'name-error' : undefined}
              disabled={loading}
            />
            {formErrors.name && touched.name && (
              <span id="name-error" className="field-error" role="alert">
                {formErrors.name}
              </span>
            )}
          </div>

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
                placeholder="Create a strong password"
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={!!formErrors.password && touched.password}
                aria-describedby={formErrors.password && touched.password ? 'password-error password-help' : 'password-help'}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(prev => !prev)}
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
            {!formErrors.password && (
              <span id="password-help" className="field-help">
                Must be 8+ characters with uppercase, lowercase, and number
              </span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-field">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={credentials.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input ${formErrors.confirmPassword && touched.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={!!formErrors.confirmPassword && touched.confirmPassword}
                aria-describedby={formErrors.confirmPassword && touched.confirmPassword ? 'confirm-password-error' : undefined}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
                tabIndex={-1}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formErrors.confirmPassword && touched.confirmPassword && (
              <span id="confirm-password-error" className="field-error" role="alert">
                {formErrors.confirmPassword}
              </span>
            )}
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
                <span>Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Login Link */}
          <div className="form-footer">
            <p className="register-prompt">
              Already have an account?{' '}
              <button
                type="button"
                className="link-button link-primary"
                onClick={onSwitchToLogin}
                disabled={loading}
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
