/**
 * Login Flow Test Suite
 *
 * Tests user login functionality including:
 * - Successful login
 * - Invalid credentials
 * - Form validation
 * - Token storage
 * - Session persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../src/components/LoginForm';
import { AuthProvider } from '../../src/contexts/AuthContext';

// Mock API responses
const mockSuccessResponse = {
  user: {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: Date.now(),
  },
  tokens: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000,
  },
};

describe('User Login Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Successful Login', () => {
    it('should login user with valid credentials', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSuccessResponse),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
            }),
          })
        );
      });
    });

    it('should store tokens in localStorage after successful login', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSuccessResponse),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(localStorage.getItem('grocery_auth_access_token')).toBe('mock-access-token');
        expect(localStorage.getItem('grocery_auth_refresh_token')).toBe('mock-refresh-token');
        expect(localStorage.getItem('grocery_auth_user')).toContain('test@example.com');
      });
    });

    it('should update auth context state after successful login', async () => {
      // Test implementation needed
    });
  });

  describe('Invalid Credentials', () => {
    it('should show error message for invalid email/password', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            message: 'Invalid email or password',
          }),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should not store tokens when login fails', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            message: 'Invalid email or password',
          }),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(localStorage.getItem('grocery_auth_access_token')).toBeNull();
        expect(localStorage.getItem('grocery_auth_refresh_token')).toBeNull();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.click(emailInput);
      await user.tab(); // Blur event

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const passwordInput = screen.getByLabelText(/password/i);
      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/password/i), '12345');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('should prevent form submission when validation fails', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should not make API call
      expect(fetch).not.toHaveBeenCalled();

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI/UX Behavior', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /show password/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should disable form during login attempt', async () => {
      global.fetch = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve(mockSuccessResponse),
                } as Response),
              100
            )
          )
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check if button shows loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it('should clear error message when user starts typing', async () => {
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
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrong');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Start typing again
      await user.type(screen.getByLabelText(/password/i), 'a');

      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should handle server errors (500)', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal server error' }),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Persistence', () => {
    it('should restore session from localStorage on mount', async () => {
      // Pre-populate localStorage
      const futureTimestamp = Date.now() + 3600000;
      localStorage.setItem('grocery_auth_access_token', 'existing-token');
      localStorage.setItem('grocery_auth_refresh_token', 'existing-refresh-token');
      localStorage.setItem('grocery_auth_token_expiry', futureTimestamp.toString());
      localStorage.setItem(
        'grocery_auth_user',
        JSON.stringify({
          id: '123',
          email: 'existing@example.com',
          name: 'Existing User',
          createdAt: Date.now(),
        })
      );

      render(
        <AuthProvider>
          <div data-testid="protected-content">Protected Content</div>
        </AuthProvider>
      );

      // Should be authenticated without login
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should clear expired session on mount', async () => {
      // Pre-populate localStorage with expired token
      const pastTimestamp = Date.now() - 1000;
      localStorage.setItem('grocery_auth_access_token', 'expired-token');
      localStorage.setItem('grocery_auth_refresh_token', 'expired-refresh-token');
      localStorage.setItem('grocery_auth_token_expiry', pastTimestamp.toString());
      localStorage.setItem(
        'grocery_auth_user',
        JSON.stringify({
          id: '123',
          email: 'expired@example.com',
          name: 'Expired User',
          createdAt: Date.now(),
        })
      );

      // Mock refresh token endpoint to fail
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Token expired' }),
        } as Response)
      );

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await waitFor(() => {
        // Should show login form (not authenticated)
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        // Tokens should be cleared
        expect(localStorage.getItem('grocery_auth_access_token')).toBeNull();
      });
    });
  });
});
