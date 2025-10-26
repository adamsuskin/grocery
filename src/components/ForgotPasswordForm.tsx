import { useState, FormEvent, ChangeEvent } from 'react';
import './LoginForm.css';

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
}

interface FormErrors {
  email?: string;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {
      email: validateEmail(email),
    };

    setFormErrors(errors);
    return !errors.email;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmail(value);

    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }

    // Validate field if it has been touched
    if (touched) {
      setFormErrors({
        email: validateEmail(value),
      });
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setFormErrors({
      email: validateEmail(email),
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark field as touched
    setTouched(true);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call forgot password API
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to request password reset');
      }

      // Show success message
      setSuccess(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-form-container">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2>Check Your Email</h2>
            <p className="login-form-subtitle">Password reset link sent</p>
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
              If an account exists with <strong>{email}</strong>, you will receive a password
              reset link shortly.
            </p>
            <p className="text-muted">Please check your email inbox and spam folder.</p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-login"
            onClick={onBackToLogin}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <div className="login-form-header">
          <h2>Forgot Password?</h2>
          <p className="login-form-subtitle">
            Enter your email address and we'll send you a link to reset your password
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

          {/* Email Field */}
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`input ${formErrors.email && touched ? 'input-error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              aria-required="true"
              aria-invalid={!!formErrors.email && touched}
              aria-describedby={formErrors.email && touched ? 'email-error' : undefined}
              disabled={loading}
            />
            {formErrors.email && touched && (
              <span id="email-error" className="field-error" role="alert">
                {formErrors.email}
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
                <span>Sending...</span>
              </>
            ) : (
              'Send Reset Link'
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
