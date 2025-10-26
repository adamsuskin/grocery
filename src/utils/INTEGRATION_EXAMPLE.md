# Integration Example

This document shows how to integrate the new utility functions with the existing AuthContext.

## Refactoring AuthContext to Use New Utilities

Here's how you can refactor the existing `AuthContext.tsx` to use the new utility functions:

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  AuthContextValue,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types/auth';

// Import the new utilities
import {
  saveAuthData,
  clearAuthData,
  getAuthData,
  isTokenExpired,
  getTimeUntilExpiry,
  hasValidAuthState,
} from '../utils/auth';

import { apiClient } from '../utils/api';

// Create the context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing refresh timeout
  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Schedule automatic token refresh
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    clearRefreshTimeout();

    const refreshIn = Math.max(0, getTimeUntilExpiry(expiresAt) - 5 * 60 * 1000);

    refreshTimeoutRef.current = setTimeout(() => {
      refreshToken();
    }, refreshIn);
  }, [clearRefreshTimeout]);

  // Load auth data from storage on mount
  const loadAuthData = useCallback(() => {
    try {
      const { user, accessToken, expiresAt } = getAuthData();

      if (hasValidAuthState()) {
        setState({
          user: user!,
          token: accessToken!,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
        scheduleTokenRefresh(expiresAt!);
      } else if (expiresAt && isTokenExpired(expiresAt)) {
        // Token expired, try to refresh
        refreshToken();
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      clearAuthData();
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [scheduleTokenRefresh]);

  // Initialize auth state on mount
  useEffect(() => {
    loadAuthData();

    return () => {
      clearRefreshTimeout();
    };
  }, [loadAuthData, clearRefreshTimeout]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.auth.login(credentials);

      // Save using utility function
      saveAuthData(response.user, response.tokens);

      setState({
        user: response.user,
        token: response.tokens.accessToken,
        loading: false,
        error: null,
        isAuthenticated: true,
      });

      scheduleTokenRefresh(response.tokens.expiresAt);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [scheduleTokenRefresh]);

  // Register function
  const register = useCallback(async (credentials: RegisterCredentials): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.auth.register(credentials);

      // Save using utility function
      saveAuthData(response.user, response.tokens);

      setState({
        user: response.user,
        token: response.tokens.accessToken,
        loading: false,
        error: null,
        isAuthenticated: true,
      });

      scheduleTokenRefresh(response.tokens.expiresAt);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [scheduleTokenRefresh]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      await apiClient.auth.logout();
    } finally {
      // Clear using utility function
      clearAuthData();
      clearRefreshTimeout();

      setState({
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    }
  }, [clearRefreshTimeout]);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      // The API client handles token refresh automatically
      // Just need to update the state
      const { user, accessToken, expiresAt } = getAuthData();

      if (user && accessToken && expiresAt) {
        setState(prev => ({
          ...prev,
          user,
          token: accessToken,
          error: null,
          isAuthenticated: true,
        }));

        scheduleTokenRefresh(expiresAt);
      } else {
        throw new Error('No valid auth data after refresh');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      clearRefreshTimeout();

      setState({
        user: null,
        token: null,
        loading: false,
        error: 'Session expired. Please login again.',
        isAuthenticated: false,
      });
    }
  }, [scheduleTokenRefresh, clearRefreshTimeout]);

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Helper hook to get auth token for API calls
export function useAuthToken(): string | null {
  const { token } = useAuth();
  return token;
}

// Helper hook to get authenticated user
export function useAuthUser(): User | null {
  const { user } = useAuth();
  return user;
}
```

## Using the API Client Directly

For components that need to make API calls without using the AuthContext:

```typescript
import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import type { GroceryItem } from '../types';

function GroceryListComponent() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<GroceryItem[]>('/items');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (name: string) => {
    try {
      const newItem = await apiClient.post<GroceryItem>('/items', { name });
      setItems(prev => [...prev, newItem]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await apiClient.delete(`/items/${id}`);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  // Render component...
}
```

## Password Validation in Registration Form

```typescript
import React, { useState, useEffect } from 'react';
import { validatePassword } from '../utils/auth';
import type { PasswordValidationResult } from '../utils/auth';

function RegistrationForm() {
  const [password, setPassword] = useState('');
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);

  useEffect(() => {
    if (password) {
      const result = validatePassword(password);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [password]);

  const getStrengthColor = () => {
    if (!validation) return 'gray';
    switch (validation.strength) {
      case 'weak': return 'red';
      case 'medium': return 'orange';
      case 'strong': return 'yellow';
      case 'very-strong': return 'green';
    }
  };

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      {validation && (
        <div>
          {/* Password strength meter */}
          <div className="strength-meter">
            <div
              className="strength-bar"
              style={{
                width: `${validation.score}%`,
                backgroundColor: getStrengthColor(),
              }}
            />
          </div>

          {/* Validation errors */}
          {validation.errors.length > 0 && (
            <ul className="errors">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          )}

          {/* Strength indicator */}
          <p>
            Password strength: <strong>{validation.strength}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
```

## Protected Route Component

```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasValidAuthState } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  if (!hasValidAuthState()) {
    // Redirect to login while saving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
```

## Using Error Handling Utilities

```typescript
import React from 'react';
import { apiClient } from '../utils/api';
import {
  handleAuthError,
  isTokenExpiredError,
  isUnauthorizedError,
  clearAuthData,
} from '../utils/auth';
import { useNavigate } from 'react-router-dom';

function DataFetchingComponent() {
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const data = await apiClient.get('/protected-data');
      return data;
    } catch (error) {
      // Handle specific error types
      if (isTokenExpiredError(error) || isUnauthorizedError(error)) {
        clearAuthData();
        navigate('/login', {
          state: { message: 'Your session has expired. Please login again.' },
        });
        return;
      }

      // Use helper for other errors
      const message = handleAuthError(error, {
        clearOnUnauthorized: true,
        clearOnExpired: true,
        logErrors: true,
      });

      // Show error to user (e.g., toast notification)
      showErrorToast(message);
    }
  };

  // ...
}
```

## Axios Alternative (if you prefer Axios)

While the utilities use fetch, you can easily create an Axios instance:

```typescript
// src/utils/axios.ts
import axios from 'axios';
import { getAccessToken, clearAuthData } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearAuthData();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

## Migration Checklist

When migrating existing code to use these utilities:

- [ ] Replace manual localStorage calls with utility functions
- [ ] Update API calls to use `apiClient` instead of raw fetch
- [ ] Add password validation to registration/password change forms
- [ ] Update error handling to use AuthError utilities
- [ ] Replace token validation logic with utility functions
- [ ] Update protected routes to use `hasValidAuthState()`
- [ ] Add retry logic for transient failures
- [ ] Implement automatic token refresh
- [ ] Add comprehensive error handling
- [ ] Write unit tests using the examples in README.md
