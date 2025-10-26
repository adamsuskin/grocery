/**
 * Authentication Integration Test Suite
 *
 * Tests complete authentication flows including:
 * - Logout flow
 * - Token refresh
 * - Protected route access
 * - Auth context state management
 * - Complete user journeys
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { LoginForm } from '../../src/components/LoginForm';
import { RegisterForm } from '../../src/components/RegisterForm';

// Test component to access auth context
function TestAuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-state">{JSON.stringify(auth)}</div>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

// Mock responses
const mockUser = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: Date.now(),
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Date.now() + 3600000,
};

const mockLoginResponse = {
  user: mockUser,
  tokens: mockTokens,
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Logout Flow', () => {
    it('should clear all auth data on logout', async () => {
      // Setup authenticated state
      localStorage.setItem('grocery_auth_access_token', 'test-token');
      localStorage.setItem('grocery_auth_refresh_token', 'test-refresh');
      localStorage.setItem('grocery_auth_token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(localStorage.getItem('grocery_auth_access_token')).toBeNull();
        expect(localStorage.getItem('grocery_auth_refresh_token')).toBeNull();
        expect(localStorage.getItem('grocery_auth_token_expiry')).toBeNull();
        expect(localStorage.getItem('grocery_auth_user')).toBeNull();
      });
    });

    it('should update context state to unauthenticated on logout', async () => {
      localStorage.setItem('grocery_auth_access_token', 'test-token');
      localStorage.setItem('grocery_auth_refresh_token', 'test-refresh');
      localStorage.setItem('grocery_auth_token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.user).toBeNull();
        expect(authState.token).toBeNull();
      });
    });

    it('should call logout API endpoint', async () => {
      localStorage.setItem('grocery_auth_access_token', 'test-token');
      localStorage.setItem('grocery_auth_refresh_token', 'test-refresh');
      localStorage.setItem('grocery_auth_token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/logout'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
            }),
          })
        );
      });
    });

    it('should clear local state even if logout API fails', async () => {
      localStorage.setItem('grocery_auth_access_token', 'test-token');
      localStorage.setItem('grocery_auth_refresh_token', 'test-refresh');
      localStorage.setItem('grocery_auth_token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(localStorage.getItem('grocery_auth_access_token')).toBeNull();
      });
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh expired token automatically', async () => {
      // Set token expiring in 4 minutes (should trigger refresh which happens 5 min before expiry)
      const expiresAt = Date.now() + 4 * 60 * 1000;
      localStorage.setItem('grocery_auth_access_token', 'old-token');
      localStorage.setItem('grocery_auth_refresh_token', 'refresh-token');
      localStorage.setItem('grocery_auth_token_expiry', expiresAt.toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              accessToken: 'new-access-token',
              expiresAt: Date.now() + 3600000,
            }),
        } as Response)
      );

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(
        () => {
          expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/refresh'),
            expect.objectContaining({
              method: 'POST',
              body: JSON.stringify({ refreshToken: 'refresh-token' }),
            })
          );
        },
        { timeout: 5000 }
      );
    });

    it('should update access token after refresh', async () => {
      const expiresAt = Date.now() + 4 * 60 * 1000;
      localStorage.setItem('grocery_auth_access_token', 'old-token');
      localStorage.setItem('grocery_auth_refresh_token', 'refresh-token');
      localStorage.setItem('grocery_auth_token_expiry', expiresAt.toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              accessToken: 'new-access-token',
              expiresAt: Date.now() + 3600000,
            }),
        } as Response)
      );

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(
        () => {
          expect(localStorage.getItem('grocery_auth_access_token')).toBe('new-access-token');
        },
        { timeout: 5000 }
      );
    });

    it('should logout user when refresh fails', async () => {
      const expiresAt = Date.now() - 1000; // Expired token
      localStorage.setItem('grocery_auth_access_token', 'expired-token');
      localStorage.setItem('grocery_auth_refresh_token', 'refresh-token');
      localStorage.setItem('grocery_auth_token_expiry', expiresAt.toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid refresh token' }),
        } as Response)
      );

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(localStorage.getItem('grocery_auth_access_token')).toBeNull();
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
        expect(authState.isAuthenticated).toBe(false);
      });
    });

    it('should show session expired error when refresh fails', async () => {
      const expiresAt = Date.now() - 1000;
      localStorage.setItem('grocery_auth_access_token', 'expired-token');
      localStorage.setItem('grocery_auth_refresh_token', 'refresh-token');
      localStorage.setItem('grocery_auth_token_expiry', expiresAt.toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid refresh token' }),
        } as Response)
      );

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
        expect(authState.error).toMatch(/session expired/i);
      });
    });
  });

  describe('Protected Route Access', () => {
    it('should render protected content when authenticated', async () => {
      localStorage.setItem('grocery_auth_access_token', 'valid-token');
      localStorage.setItem('grocery_auth_refresh_token', 'refresh-token');
      localStorage.setItem('grocery_auth_token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      render(
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Dashboard</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should show login when not authenticated', async () => {
      render(
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Dashboard</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('should show loading state while checking auth', () => {
      render(
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Dashboard</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
    });

    it('should use custom fallback when provided', async () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Login</div>;

      render(
        <AuthProvider>
          <ProtectedRoute fallback={<CustomFallback />}>
            <div data-testid="protected-content">Protected Dashboard</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Auth Context State Management', () => {
    it('should initialize with loading state', () => {
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.loading).toBe(true);
    });

    it('should update to authenticated state after login', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLoginResponse),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
          <TestAuthConsumer />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.user).toMatchObject({
          email: 'test@example.com',
          name: 'Test User',
        });
        expect(authState.token).toBe('mock-access-token');
      });
    });

    it('should maintain consistent state across multiple consumers', async () => {
      localStorage.setItem('grocery_auth_access_token', 'valid-token');
      localStorage.setItem('grocery_auth_refresh_token', 'refresh-token');
      localStorage.setItem('grocery_auth_token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      function ConsumerA() {
        const { user } = useAuth();
        return <div data-testid="consumer-a">{user?.email}</div>;
      }

      function ConsumerB() {
        const { isAuthenticated } = useAuth();
        return <div data-testid="consumer-b">{isAuthenticated ? 'yes' : 'no'}</div>;
      }

      render(
        <AuthProvider>
          <ConsumerA />
          <ConsumerB />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('consumer-a')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('consumer-b')).toHaveTextContent('yes');
      });
    });

    it('should clear error when clearError is called', async () => {
      function ErrorTestComponent() {
        const { error, clearError } = useAuth();
        return (
          <div>
            <div data-testid="error-message">{error || 'no error'}</div>
            <button onClick={clearError}>Clear Error</button>
          </div>
        );
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
          <ErrorTestComponent />
        </AuthProvider>
      );

      // Trigger error
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrong');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
      });

      // Clear error
      await user.click(screen.getByText('Clear Error'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('no error');
      });
    });
  });

  describe('Complete User Journeys', () => {
    it('should complete full registration -> login -> logout cycle', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // Register
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLoginResponse),
          } as Response);
        } else if (callCount === 2) {
          // Logout
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          } as Response);
        }
        return Promise.reject(new Error('Unexpected call'));
      });

      const user = userEvent.setup();

      // Start with registration
      const { rerender } = render(
        <AuthProvider>
          <RegisterForm />
          <TestAuthConsumer />
        </AuthProvider>
      );

      // Register
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Test@1234');
      await user.type(screen.getByLabelText(/confirm password/i), 'Test@1234');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should be authenticated
      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
        expect(authState.isAuthenticated).toBe(true);
      });

      // Logout
      await user.click(screen.getByText('Logout'));

      // Should be unauthenticated
      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
        expect(authState.isAuthenticated).toBe(false);
      });
    });

    it('should handle login after failed attempt', async () => {
      let attemptCount = 0;
      global.fetch = vi.fn(() => {
        attemptCount++;
        if (attemptCount === 1) {
          // First attempt fails
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: 'Invalid credentials' }),
          } as Response);
        } else {
          // Second attempt succeeds
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLoginResponse),
          } as Response);
        }
      });

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
          <TestAuthConsumer />
        </AuthProvider>
      );

      // First attempt with wrong password
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrong');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Clear and retry with correct credentials
      await user.clear(screen.getByLabelText(/password/i));
      await user.type(screen.getByLabelText(/password/i), 'correct123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
        expect(authState.isAuthenticated).toBe(true);
      });
    });

    it('should maintain session across page refreshes', async () => {
      // Simulate initial auth
      localStorage.setItem('grocery_auth_access_token', 'persisted-token');
      localStorage.setItem('grocery_auth_refresh_token', 'persisted-refresh');
      localStorage.setItem('grocery_auth_token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));

      // First render (simulating initial page load)
      const { unmount } = render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.user?.email).toBe('test@example.com');
      });

      unmount();

      // Second render (simulating page refresh)
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.user?.email).toBe('test@example.com');
      });
    });
  });
});
