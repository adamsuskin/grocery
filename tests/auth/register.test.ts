/**
 * Registration Flow Test Suite
 *
 * Tests user registration functionality including:
 * - Successful registration
 * - Validation errors
 * - Duplicate email handling
 * - Password requirements
 * - Token generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../../src/components/RegisterForm';
import { AuthProvider } from '../../src/contexts/AuthContext';
import type { RegisterCredentials } from '../../src/types/auth';

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

describe('User Registration Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Successful Registration', () => {
    it('should register a new user with valid credentials', async () => {
      // Mock successful API response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSuccessResponse),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      // Fill in form fields
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Test@1234');
      await user.type(screen.getByLabelText(/confirm password/i), 'Test@1234');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Wait for API call and verify
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/register'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Test User',
              email: 'test@example.com',
              password: 'Test@1234',
            }),
          })
        );
      });
    });

    it('should store tokens in localStorage after successful registration', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSuccessResponse),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Test@1234');
      await user.type(screen.getByLabelText(/confirm password/i), 'Test@1234');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(localStorage.getItem('grocery_auth_access_token')).toBe('mock-access-token');
        expect(localStorage.getItem('grocery_auth_refresh_token')).toBe('mock-refresh-token');
        expect(localStorage.getItem('grocery_auth_user')).toContain('test@example.com');
      });
    });

    it('should update auth context state after successful registration', async () => {
      // Test implementation needed
    });
  });

  describe('Validation Errors', () => {
    it('should show error when name is too short', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/full name/i), 'A');
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
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
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/^password$/i), 'Short1');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when password lacks uppercase letter', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must contain.*uppercase/i)).toBeInTheDocument();
      });
    });

    it('should show error when password lacks lowercase letter', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/^password$/i), 'PASSWORD123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must contain.*lowercase/i)).toBeInTheDocument();
      });
    });

    it('should show error when password lacks number', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/^password$/i), 'PasswordOnly');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must contain.*number/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/^password$/i), 'Test@1234');
      await user.type(screen.getByLabelText(/confirm password/i), 'Test@5678');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should show all validation errors when form is submitted with empty fields', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Duplicate Email Handling', () => {
    it('should show error when email already exists', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            message: 'An account with this email already exists',
          }),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Test@1234');
      await user.type(screen.getByLabelText(/confirm password/i), 'Test@1234');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/account with this email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI/UX Behavior', () => {
    it('should disable form fields during registration', async () => {
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
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Test@1234');
      await user.type(screen.getByLabelText(/confirm password/i), 'Test@1234');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Check if button shows loading state
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const toggleButton = screen.getAllByRole('button', { name: /show password/i })[0];

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should clear server error when user starts typing', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Server error' }),
        } as Response)
      );

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      // Trigger error
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Test@1234');
      await user.type(screen.getByLabelText(/confirm password/i), 'Test@1234');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });

      // Start typing again
      await user.type(screen.getByLabelText(/email/i), '1');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/server error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Test@1234');
      await user.type(screen.getByLabelText(/confirm password/i), 'Test@1234');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
