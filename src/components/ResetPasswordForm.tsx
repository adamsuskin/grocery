import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import './LoginForm.css';

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export function ResetPasswordForm({ token, onSuccess, onBackToLogin }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if no token provided
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  // Password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }

    return undefined;
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string): string | undefined => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }

    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }

    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: FormErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword),
    };

    setFormErrors(errors);
    return !errors.password && !errors.confirmPassword;
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setPassword(value);

    // Clear server error when user starts typing
    if (error) {
      setError(null);
    }

    // Validate field if it has been touched
    if (touched.password) {
      setFormErrors(prev => ({
        ...prev,
        password: validatePassword(value),
      }));
    }

    // Re-validate confirm password if it's been touched
    if (touched.confirmPassword) {
      setFormErrors(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(confirmPassword),
      }));
    }
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setConfirmPassword(value);

    // Clear server error when user starts typing
    if (error) {
      setError(null);
    }

    // Validate field if it has been touched
    if (touched.confirmPassword) {
      setFormErrors(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value),
      }));
    }
  };

  const handleBlur = (field: 'password' | 'confirmPassword') => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));

    // Validate field on blur
    if (field === 'password') {
      setFormErrors(prev => ({
        ...prev,
        password: validatePassword(password),
      }));
    } else {
      setFormErrors(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(confirmPassword),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      password: true,
      confirmPassword: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call reset password API
      const response = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      // Show success message
      setSuccess(true);

      // Call success callback after a short delay
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  if (success) {
    return (
      <div className="login-form-container">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2>Password Reset Successful</h2>
            <p className="login-form-subtitle">Your password has been updated</p>
          </div>

          <div className="success-message">
            <div className="success-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p>
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-login"
            onClick={onBackToLogin}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <div className="login-form-header">
          <h2>Reset Password</h2>
          <p className="login-form-subtitle">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Server Error Display */}
          {error && (
            <div className="login-error-banner" role="alert">
              <span className="error-icon">⚠</span>
              <span className="error-message">{error}</span>
            </div>
          )}

          {/* Password Field */}
          <div className="form-field">
            <label htmlFor="password" className="form-label">
              New Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                className={`input ${formErrors.password && touched.password ? 'input-error' : ''}`}
                placeholder="Enter new password"
                autoComplete="new-password"
                autoFocus
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
            <div className="password-requirements">
              <p className="text-muted">Password must contain:</p>
              <ul className="text-muted">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form-field">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm New Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={() => handleBlur('confirmPassword')}
                className={`input ${formErrors.confirmPassword && touched.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm new password"
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={!!formErrors.confirmPassword && touched.confirmPassword}
                aria-describedby={formErrors.confirmPassword && touched.confirmPassword ? 'confirm-password-error' : undefined}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
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
            disabled={loading || !token}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                <span>Resetting Password...</span>
              </>
            ) : (
              'Reset Password'
            )}
          </button>

          {/* Back to Login Link */}
          <div className="form-footer">
            <p className="register-prompt">
              Remember your password?{' '}
              <button
                type="button"
                className="link-button link-primary"
                onClick={onBackToLogin}
                disabled={loading}
              >
                Back to login
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
