/**
 * AuthContext with Zero Integration
 *
 * This is an enhanced version of AuthContext that automatically synchronizes
 * authentication state with the Zero client. Use this file as a reference for
 * integrating Zero with your authentication flow.
 *
 * To use this instead of the base AuthContext:
 * 1. Import from this file instead of AuthContext.tsx
 * 2. The Zero client will automatically update when users login/logout
 * 3. Token refreshes will keep Zero in sync
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  AuthContextValue,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  User,
} from '../types/auth';
import { syncZeroWithLogin, syncZeroWithLogout, syncZeroWithTokenRefresh } from '../utils/authZeroIntegration';

// Storage keys
const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'grocery_auth_access_token',
  REFRESH_TOKEN: 'grocery_auth_refresh_token',
  TOKEN_EXPIRY: 'grocery_auth_token_expiry',
  USER: 'grocery_auth_user',
} as const;

// Storage utility functions
const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  clear: (): void => {
    try {
      const keys = Object.values(AUTH_STORAGE_KEYS);
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

    const now = Date.now();
    const expiresIn = expiresAt - now;

    // Refresh 5 minutes before expiry (or immediately if already expired)
    const refreshIn = Math.max(0, expiresIn - 5 * 60 * 1000);

    refreshTimeoutRef.current = setTimeout(() => {
      refreshToken();
    }, refreshIn);
  }, [clearRefreshTimeout]);

  // Save auth data to storage and sync with Zero
  const saveAuthData = useCallback(async (user: User, accessToken: string, refreshToken: string, expiresAt: number) => {
    storage.set(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    storage.set(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    storage.set(AUTH_STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString());
    storage.set(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    scheduleTokenRefresh(expiresAt);

    // Sync Zero with login credentials
    try {
      await syncZeroWithLogin(user, accessToken);
    } catch (error) {
      console.error('Failed to sync Zero with login:', error);
      // Continue anyway - auth succeeded even if Zero sync failed
    }
  }, [scheduleTokenRefresh]);

  // Clear auth data from storage and sync with Zero
  const clearAuthData = useCallback(async () => {
    storage.clear();
    clearRefreshTimeout();

    // Reset Zero to demo mode
    try {
      await syncZeroWithLogout();
    } catch (error) {
      console.error('Failed to sync Zero with logout:', error);
      // Continue anyway - logout succeeded even if Zero sync failed
    }
  }, [clearRefreshTimeout]);

  // Load auth data from storage on mount
  const loadAuthData = useCallback(async () => {
    try {
      const token = storage.get(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
      const refreshTokenValue = storage.get(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      const expiryStr = storage.get(AUTH_STORAGE_KEYS.TOKEN_EXPIRY);
      const userStr = storage.get(AUTH_STORAGE_KEYS.USER);

      if (token && refreshTokenValue && expiryStr && userStr) {
        const expiresAt = parseInt(expiryStr, 10);
        const user = JSON.parse(userStr) as User;
        const now = Date.now();

        // Check if token is expired
        if (expiresAt > now) {
          // Sync Zero with stored credentials
          try {
            await syncZeroWithLogin(user, token);
          } catch (error) {
            console.error('Failed to sync Zero on load:', error);
          }

          setState({
            user,
            token,
            loading: false,
            error: null,
            isAuthenticated: true,
          });
          scheduleTokenRefresh(expiresAt);
        } else {
          // Token expired, try to refresh
          refreshToken();
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      await clearAuthData();
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [scheduleTokenRefresh, clearAuthData]);

  // Initialize auth state on mount
  useEffect(() => {
    loadAuthData();

    // Cleanup on unmount
    return () => {
      clearRefreshTimeout();
    };
  }, [loadAuthData, clearRefreshTimeout]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }

      const data: LoginResponse = await response.json();

      await saveAuthData(
        data.user,
        data.tokens.accessToken,
        data.tokens.refreshToken,
        data.tokens.expiresAt
      );

      setState({
        user: data.user,
        token: data.tokens.accessToken,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [saveAuthData]);

  // Register function
  const register = useCallback(async (credentials: RegisterCredentials): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(errorData.message || 'Registration failed');
      }

      const data: RegisterResponse = await response.json();

      await saveAuthData(
        data.user,
        data.tokens.accessToken,
        data.tokens.refreshToken,
        data.tokens.expiresAt
      );

      setState({
        user: data.user,
        token: data.tokens.accessToken,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [saveAuthData]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const token = storage.get(AUTH_STORAGE_KEYS.ACCESS_TOKEN);

      if (token) {
        // Attempt to notify the server (don't throw on failure)
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(error => {
          console.warn('Logout API call failed:', error);
        });
      }
    } finally {
      // Always clear local state regardless of API call result
      await clearAuthData();
      setState({
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    }
  }, [clearAuthData]);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const refreshTokenValue = storage.get(AUTH_STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data: RefreshTokenResponse = await response.json();

      // Update only the access token and expiry
      storage.set(AUTH_STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      storage.set(AUTH_STORAGE_KEYS.TOKEN_EXPIRY, data.expiresAt.toString());

      // Sync Zero with new token
      try {
        await syncZeroWithTokenRefresh(data.accessToken);
      } catch (error) {
        console.error('Failed to sync Zero with token refresh:', error);
      }

      setState(prev => ({
        ...prev,
        token: data.accessToken,
        error: null,
      }));

      scheduleTokenRefresh(data.expiresAt);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
      await clearAuthData();
      setState({
        user: null,
        token: null,
        loading: false,
        error: 'Session expired. Please login again.',
        isAuthenticated: false,
      });
    }
  }, [scheduleTokenRefresh, clearAuthData]);

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
