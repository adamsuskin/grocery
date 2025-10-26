/**
 * Error Handling Example
 *
 * This example demonstrates all error handling features:
 * - Different error types
 * - Error display components
 * - Recovery strategies
 * - Custom error handlers
 * - Hooks usage
 *
 * Use this as a reference for implementing error handling in your components.
 */

import { useState, FormEvent } from 'react';
import {
  ErrorBanner,
  ErrorToast,
  ErrorAlert,
  FieldError,
  useErrorState,
  useErrorToast,
} from '../components/ErrorDisplay';
import {
  handleAuthError,
  AuthError,
  AuthErrorType,
  RecoveryStrategy,
} from '../utils/authErrors';
import './ErrorHandlingExample.css';

export function ErrorHandlingExample() {
  // Basic error state
  const [bannerError, setBannerError] = useState<unknown>(null);
  const [alertError, setAlertError] = useState<unknown>(null);
  const [fieldError, setFieldError] = useState<string>('');

  // Using error hooks
  const { error: autoError, setError: setAutoError } = useErrorState(5000); // Auto-clear after 5s
  const { toast, showToast, hideToast } = useErrorToast();

  // =============================================================================
  // ERROR SIMULATION FUNCTIONS
  // =============================================================================

  const simulateNetworkError = () => {
    const error = new AuthError(
      'Failed to connect to server',
      AuthErrorType.NETWORK_ERROR,
      503
    );

    handleAuthError(error, {
      logToConsole: true,
      onError: (info) => {
        console.log('Error Info:', info);
      },
    });

    setBannerError(error);
  };

  const simulateUnauthorizedError = () => {
    const error = new AuthError(
      'Invalid email or password',
      AuthErrorType.UNAUTHORIZED,
      401
    );

    handleAuthError(error, {
      logToConsole: true,
      clearAuthOnUnauthorized: false, // Don't clear for demo
    });

    setAlertError(error);
  };

  const simulateValidationError = () => {
    const error = new AuthError(
      'Email address is required',
      AuthErrorType.VALIDATION_ERROR,
      400
    );

    handleAuthError(error, { logToConsole: true });
    setFieldError('Email address is required');
  };

  const simulateExpiredToken = () => {
    const error = new AuthError(
      'Your session has expired',
      AuthErrorType.TOKEN_EXPIRED,
      401
    );

    handleAuthError(error, {
      logToConsole: true,
      clearAuthOnExpired: false, // Don't clear for demo
    });

    showToast(error);
  };

  const simulateServerError = () => {
    const error = new AuthError(
      'Internal server error',
      AuthErrorType.NETWORK_ERROR,
      500
    );

    handleAuthError(error, { logToConsole: true });
    setAutoError(error);
  };

  const simulateRateLimitError = () => {
    const error = new AuthError(
      'Too many requests. Please wait.',
      AuthErrorType.NETWORK_ERROR,
      429
    );

    handleAuthError(error, { logToConsole: true });
    showToast(error, 'Rate limit exceeded. Please wait a moment.');
  };

  // =============================================================================
  // FORM HANDLING WITH ERROR RECOVERY
  // =============================================================================

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (loginData.email === 'error@test.com') {
            reject(
              new AuthError(
                'Invalid credentials',
                AuthErrorType.UNAUTHORIZED,
                401
              )
            );
          } else if (loginData.email === 'network@test.com') {
            reject(
              new AuthError(
                'Network error',
                AuthErrorType.NETWORK_ERROR,
                503
              )
            );
          } else {
            resolve('Success');
          }
        }, 1000);
      });

      // Success
      showToast(undefined, 'Login successful!');
      setLoginData({ email: '', password: '' });
    } catch (error) {
      // Handle error with recovery options
      const errorInfo = handleAuthError(error, {
        logToConsole: true,
        onError: (info) => {
          console.log('Login error:', info);
        },
        onRecovery: (strategy) => {
          console.log('Suggested recovery:', strategy);
        },
      });

      setFormError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = (strategy: RecoveryStrategy) => {
    console.log('User selected recovery strategy:', strategy);

    switch (strategy) {
      case RecoveryStrategy.RETRY:
        // Retry the operation
        console.log('Retrying...');
        setFormError(null);
        break;

      case RecoveryStrategy.RELOGIN:
        // Redirect to login
        console.log('Redirecting to login...');
        setFormError(null);
        break;

      case RecoveryStrategy.CHECK_CONNECTION:
        // Show connection check message
        alert('Please check your internet connection');
        break;

      default:
        console.log('No specific recovery action');
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="error-example-container">
      <h1>Error Handling Examples</h1>
      <p className="subtitle">
        Demonstrating comprehensive error handling features
      </p>

      {/* Toast Notification */}
      {toast.visible && (
        <ErrorToast
          error={toast.error}
          message={toast.message}
          duration={5000}
          position="top-right"
          onClose={hideToast}
        />
      )}

      {/* Error Banner Example */}
      <section className="example-section">
        <h2>Error Banner (Full-width)</h2>
        <p>Prominent error display at the top of forms or pages</p>

        <ErrorBanner
          error={bannerError}
          onClose={() => setBannerError(null)}
        />

        <div className="button-group">
          <button onClick={simulateNetworkError} className="btn-example">
            Show Network Error
          </button>
          <button
            onClick={() => setBannerError(null)}
            className="btn-example btn-clear"
          >
            Clear Error
          </button>
        </div>
      </section>

      {/* Error Alert Example */}
      <section className="example-section">
        <h2>Error Alert (With Recovery Actions)</h2>
        <p>Inline alert with suggested recovery actions</p>

        <ErrorAlert
          error={alertError}
          showRecoveryAction={true}
          onRecoveryAction={handleRecovery}
        />

        <div className="button-group">
          <button onClick={simulateUnauthorizedError} className="btn-example">
            Show Unauthorized Error
          </button>
          <button
            onClick={() => setAlertError(null)}
            className="btn-example btn-clear"
          >
            Clear Error
          </button>
        </div>
      </section>

      {/* Field Error Example */}
      <section className="example-section">
        <h2>Field Error (Form Validation)</h2>
        <p>Small error messages for form fields</p>

        <div className="form-field-example">
          <label htmlFor="email-field">Email Address</label>
          <input
            id="email-field"
            type="email"
            placeholder="Enter email"
            className={fieldError ? 'input-error' : ''}
            onChange={() => setFieldError('')}
          />
          <FieldError error={fieldError} show={!!fieldError} />
        </div>

        <div className="button-group">
          <button onClick={simulateValidationError} className="btn-example">
            Show Validation Error
          </button>
          <button
            onClick={() => setFieldError('')}
            className="btn-example btn-clear"
          >
            Clear Error
          </button>
        </div>
      </section>

      {/* Auto-Clear Error Example */}
      <section className="example-section">
        <h2>Auto-Clear Error (5 seconds)</h2>
        <p>Error automatically clears after a timeout</p>

        {autoError && <ErrorBanner error={autoError} showCloseButton={false} />}

        <button onClick={simulateServerError} className="btn-example">
          Show Server Error (Auto-clears)
        </button>
      </section>

      {/* Toast Examples */}
      <section className="example-section">
        <h2>Toast Notifications</h2>
        <p>Temporary floating notifications</p>

        <div className="button-group">
          <button onClick={simulateExpiredToken} className="btn-example">
            Show Expired Token Toast
          </button>
          <button onClick={simulateRateLimitError} className="btn-example">
            Show Rate Limit Toast
          </button>
        </div>
      </section>

      {/* Complete Form Example */}
      <section className="example-section">
        <h2>Complete Form with Error Handling</h2>
        <p>Real-world example with all error handling features</p>

        <div className="form-example">
          <form onSubmit={handleLogin}>
            <ErrorBanner
              error={formError}
              onClose={() => setFormError(null)}
            />

            <div className="form-field-example">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={loginData.email}
                onChange={(e) => {
                  setLoginData({ ...loginData, email: e.target.value });
                  if (formError) setFormError(null); // Clear error on input
                }}
                placeholder="Try: error@test.com or network@test.com"
                required
              />
            </div>

            <div className="form-field-example">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => {
                  setLoginData({ ...loginData, password: e.target.value });
                  if (formError) setFormError(null);
                }}
                placeholder="Any password"
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="form-hints">
              <p>
                <strong>Hint:</strong> Use these emails to test different
                errors:
              </p>
              <ul>
                <li>
                  <code>error@test.com</code> - Unauthorized error
                </li>
                <li>
                  <code>network@test.com</code> - Network error
                </li>
                <li>Any other email - Success</li>
              </ul>
            </div>
          </form>
        </div>
      </section>

      {/* Error Types Reference */}
      <section className="example-section">
        <h2>Error Types Reference</h2>
        <div className="error-types-grid">
          <div className="error-type-card">
            <h3>Network Error</h3>
            <p>Connection issues, timeouts, server errors (500, 502, 503)</p>
            <span className="severity-badge error">ERROR</span>
          </div>

          <div className="error-type-card">
            <h3>Unauthorized (401)</h3>
            <p>Invalid credentials, account not found</p>
            <span className="severity-badge warning">WARNING</span>
          </div>

          <div className="error-type-card">
            <h3>Forbidden (403)</h3>
            <p>Insufficient permissions</p>
            <span className="severity-badge warning">WARNING</span>
          </div>

          <div className="error-type-card">
            <h3>Validation Error (400)</h3>
            <p>Invalid input, missing fields</p>
            <span className="severity-badge warning">WARNING</span>
          </div>

          <div className="error-type-card">
            <h3>Token Expired</h3>
            <p>Session expired, need to login again</p>
            <span className="severity-badge warning">WARNING</span>
          </div>

          <div className="error-type-card">
            <h3>Invalid Token</h3>
            <p>Malformed or tampered token</p>
            <span className="severity-badge error">ERROR</span>
          </div>
        </div>
      </section>
    </div>
  );
}
