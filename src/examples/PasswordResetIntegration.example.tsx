/**
 * Password Reset Integration Example
 *
 * This file demonstrates how to integrate the password reset components
 * into your application. Choose one of the integration methods below based
 * on your routing setup.
 */

// =============================================================================
// METHOD 1: Using React Router (Recommended)
// =============================================================================

import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { ResetPasswordForm } from '../components/ResetPasswordForm';

/**
 * Main App component with React Router
 */
export function AppWithRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Forgot Password Route */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Reset Password Route */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Other routes... */}
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Login Page Component
 */
function LoginPage() {
  const navigate = useNavigate();

  return (
    <LoginForm
      onSwitchToRegister={() => navigate('/register')}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  );
}

/**
 * Forgot Password Page Component
 */
function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <ForgotPasswordForm
      onBackToLogin={() => navigate('/login')}
    />
  );
}

/**
 * Reset Password Page Component
 * Extracts token from URL query parameters
 */
function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  return (
    <ResetPasswordForm
      token={token}
      onSuccess={() => {
        // Redirect to login after successful reset
        navigate('/login');
      }}
      onBackToLogin={() => navigate('/login')}
    />
  );
}

// Placeholder components
function HomePage() {
  return <div>Home Page</div>;
}

// =============================================================================
// METHOD 2: Using State-Based Routing (Simple Apps)
// =============================================================================

import { useState } from 'react';

type ViewState = 'login' | 'forgot-password' | 'reset-password';

/**
 * Main App component with state-based routing
 * Useful for simple apps without React Router
 */
export function AppWithStateRouting() {
  const [view, setView] = useState<ViewState>('login');
  const [resetToken, setResetToken] = useState('');

  // Parse token from URL on mount
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setView('reset-password');
    }
  });

  return (
    <>
      {view === 'login' && (
        <LoginForm
          onSwitchToRegister={() => {
            // Handle register view
            console.log('Switch to register');
          }}
          onForgotPassword={() => setView('forgot-password')}
        />
      )}

      {view === 'forgot-password' && (
        <ForgotPasswordForm
          onBackToLogin={() => setView('login')}
        />
      )}

      {view === 'reset-password' && (
        <ResetPasswordForm
          token={resetToken}
          onSuccess={() => setView('login')}
          onBackToLogin={() => setView('login')}
        />
      )}
    </>
  );
}

// =============================================================================
// METHOD 3: Standalone Pages (No Routing Library)
// =============================================================================

/**
 * Create separate page files for each view
 */

// File: src/pages/LoginPage.tsx
export function StandaloneLoginPage() {
  return (
    <LoginForm
      onSwitchToRegister={() => {
        window.location.href = '/register.html';
      }}
      onForgotPassword={() => {
        window.location.href = '/forgot-password.html';
      }}
    />
  );
}

// File: src/pages/ForgotPasswordPage.tsx
export function StandaloneForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      onBackToLogin={() => {
        window.location.href = '/login.html';
      }}
    />
  );
}

// File: src/pages/ResetPasswordPage.tsx
export function StandaloneResetPasswordPage() {
  // Extract token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  return (
    <ResetPasswordForm
      token={token}
      onSuccess={() => {
        // Show success message and redirect
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 2000);
      }}
      onBackToLogin={() => {
        window.location.href = '/login.html';
      }}
    />
  );
}

// =============================================================================
// METHOD 4: With Authentication Context
// =============================================================================

import { useAuth } from '../context/AuthContext';

/**
 * Enhanced Login Page with Auth Context
 * Automatically redirects after successful login
 */
function LoginPageWithAuth() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useState(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  });

  return (
    <LoginForm
      onSwitchToRegister={() => navigate('/register')}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  );
}

/**
 * Protected Route Example
 * Redirects to login if not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useState(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  });

  return isAuthenticated ? <>{children}</> : null;
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/**
 * Example 1: Simple integration with minimal features
 */
export function MinimalIntegration() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <LoginForm
            onForgotPassword={() => window.location.href = '/forgot-password'}
          />
        } />

        <Route path="/forgot-password" element={
          <ForgotPasswordForm
            onBackToLogin={() => window.location.href = '/login'}
          />
        } />

        <Route path="/reset-password" element={
          <ResetPasswordForm
            token={new URLSearchParams(window.location.search).get('token') || ''}
            onBackToLogin={() => window.location.href = '/login'}
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Example 2: Full-featured integration with custom styling
 */
export function CustomStyledIntegration() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <header className="auth-header">
        <h1>Grocery List App</h1>
      </header>

      <main className="auth-main">
        <Routes>
          <Route path="/login" element={
            <LoginForm
              onSwitchToRegister={() => navigate('/register')}
              onForgotPassword={() => navigate('/forgot-password')}
            />
          } />

          <Route path="/forgot-password" element={
            <ForgotPasswordForm
              onBackToLogin={() => navigate('/login')}
            />
          } />

          <Route path="/reset-password" element={
            <ResetPasswordPageWrapper />
          } />
        </Routes>
      </main>

      <footer className="auth-footer">
        <p>&copy; 2025 Grocery List App. All rights reserved.</p>
      </footer>
    </div>
  );
}

function ResetPasswordPageWrapper() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  // Handle missing token
  if (!token) {
    return (
      <div className="error-container">
        <h2>Invalid Reset Link</h2>
        <p>This password reset link is invalid or has expired.</p>
        <button onClick={() => navigate('/forgot-password')}>
          Request New Reset Link
        </button>
      </div>
    );
  }

  return (
    <ResetPasswordForm
      token={token}
      onSuccess={() => {
        // Show success notification
        alert('Password reset successful! You can now log in.');
        navigate('/login');
      }}
      onBackToLogin={() => navigate('/login')}
    />
  );
}

/**
 * Example 3: Integration with toast notifications
 */
export function IntegrationWithToasts() {
  const navigate = useNavigate();
  // Assuming you have a toast notification system
  const { showToast } = useToastNotifications();

  return (
    <Routes>
      <Route path="/reset-password" element={
        <ResetPasswordForm
          token={new URLSearchParams(window.location.search).get('token') || ''}
          onSuccess={() => {
            showToast({
              type: 'success',
              message: 'Password reset successful! Please log in with your new password.',
              duration: 5000
            });
            navigate('/login');
          }}
          onBackToLogin={() => navigate('/login')}
        />
      } />
    </Routes>
  );
}

// Mock toast hook for example
function useToastNotifications() {
  return {
    showToast: (options: any) => console.log('Toast:', options)
  };
}

// =============================================================================
// TESTING UTILITIES
// =============================================================================

/**
 * Mock component for testing
 * Shows all password reset states without making API calls
 */
export function PasswordResetTestComponent() {
  const [view, setView] = useState<'forgot' | 'reset' | 'success'>('forgot');

  return (
    <div>
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0', marginBottom: '20px' }}>
        <h3>Testing Controls</h3>
        <button onClick={() => setView('forgot')}>Show Forgot Password</button>
        <button onClick={() => setView('reset')}>Show Reset Password</button>
        <button onClick={() => setView('success')}>Show Success</button>
      </div>

      {view === 'forgot' && (
        <ForgotPasswordForm
          onBackToLogin={() => console.log('Back to login')}
        />
      )}

      {view === 'reset' && (
        <ResetPasswordForm
          token="test-token-123"
          onSuccess={() => setView('success')}
          onBackToLogin={() => console.log('Back to login')}
        />
      )}

      {view === 'success' && (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>✓ Password Reset Successful</h2>
          <p>You can now log in with your new password.</p>
          <button onClick={() => console.log('Go to login')}>
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CONFIGURATION EXAMPLES
// =============================================================================

/**
 * Example API configuration
 * Create this in a separate config file
 */
export const authConfig = {
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  endpoints: {
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    login: '/api/auth/login',
    register: '/api/auth/register',
  },
  resetTokenExpiry: 3600, // 1 hour in seconds
  frontend: {
    loginPath: '/login',
    resetPath: '/reset-password',
    forgotPasswordPath: '/forgot-password',
  }
};

/**
 * Custom API client example
 * Wrap components with custom API calls
 */
export class PasswordResetAPI {
  static async requestReset(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${authConfig.apiBaseUrl}${authConfig.endpoints.forgotPassword}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    return response.json();
  }

  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${authConfig.apiBaseUrl}${authConfig.endpoints.resetPassword}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    return response.json();
  }
}

// =============================================================================
// NOTES
// =============================================================================

/**
 * Quick Start Guide:
 *
 * 1. Choose your routing method (React Router recommended)
 * 2. Copy the relevant example code above
 * 3. Adjust the navigation paths to match your app
 * 4. Test the flow:
 *    - Login page → Click "Forgot password?"
 *    - Enter email → Check server console for reset link
 *    - Copy reset link → Paste in browser
 *    - Enter new password → Submit
 *    - Verify redirect to login
 *    - Login with new password
 *
 * 5. Customize styling by modifying LoginForm.css
 * 6. Add your own error handling and notifications
 * 7. Configure real email service in production
 */
