import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  AuthContextValue,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  LoginResponse,
  RegisterResponse,
  User,
} from '../types/auth';
import {
  initializeTokenRefresh,
  cleanupTokenRefresh,
  scheduleTokenRefresh as scheduleTokenRefreshManager,
  refreshToken as refreshTokenManager,
  addEventListener as addTokenRefreshListener,
  removeEventListener as removeTokenRefreshListener,
} from '../utils/tokenRefresh';

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
  const isInitializedRef = useRef(false);

  // Save auth data to storage
  const saveAuthData = useCallback((user: User, accessToken: string, refreshToken: string, expiresAt: number) => {
    storage.set(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    storage.set(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    storage.set(AUTH_STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString());
    storage.set(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));

    // Schedule token refresh using the token refresh manager
    scheduleTokenRefreshManager(expiresAt);
  }, []);

  // Clear auth data from storage
  const clearAuthDataLocal = useCallback(() => {
    storage.clear();

    // Cleanup token refresh manager
    cleanupTokenRefresh();
  }, []);

  // Load auth data from storage on mount
  const loadAuthData = useCallback(() => {
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
          setState({
            user,
            token,
            loading: false,
            error: null,
            isAuthenticated: true,
          });

          // Initialize token refresh manager
          // This will schedule automatic refresh
          if (!isInitializedRef.current) {
            initializeTokenRefresh();
            isInitializedRef.current = true;
          }
        } else {
          // Token expired, try to refresh using token refresh manager
          refreshToken();
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      clearAuthDataLocal();
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [clearAuthDataLocal]);

  // Initialize auth state on mount and setup event listeners
  useEffect(() => {
    loadAuthData();

    // Listen for token refresh events from the token refresh manager
    const handleRefreshSuccess = () => {
      console.debug('Token refreshed successfully by token refresh manager');

      // Update state with new token
      const newToken = storage.get(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
      if (newToken) {
        setState(prev => ({
          ...prev,
          token: newToken,
          error: null,
        }));
      }
    };

    const handleRefreshFailure = (error: unknown) => {
      console.error('Token refresh failed in token refresh manager:', error);

      // Update state to reflect logout
      setState({
        user: null,
        token: null,
        loading: false,
        error: 'Session expired. Please login again.',
        isAuthenticated: false,
      });
    };

    const handleTokenExpired = () => {
      console.debug('Token expired event received from token refresh manager');

      // Update state to reflect logout
      setState({
        user: null,
        token: null,
        loading: false,
        error: 'Session expired. Please login again.',
        isAuthenticated: false,
      });
    };

    // Register event listeners
    addTokenRefreshListener('refreshSuccess', handleRefreshSuccess);
    addTokenRefreshListener('refreshFailure', handleRefreshFailure);
    addTokenRefreshListener('tokenExpired', handleTokenExpired);

    // Cleanup on unmount
    return () => {
      // Remove event listeners
      removeTokenRefreshListener('refreshSuccess', handleRefreshSuccess);
      removeTokenRefreshListener('refreshFailure', handleRefreshFailure);
      removeTokenRefreshListener('tokenExpired', handleTokenExpired);

      // Cleanup token refresh manager
      cleanupTokenRefresh();
    };
  }, [loadAuthData]);

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

      saveAuthData(
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

      saveAuthData(
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
      clearAuthDataLocal();
      setState({
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    }
  }, [clearAuthDataLocal]);

  // Refresh token function
  // Now delegates to the token refresh manager for consistency
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      // Use the token refresh manager instead of direct API call
      // This ensures all refresh logic is centralized and consistent
      const newToken = await refreshTokenManager();

      // Update state with new token
      setState(prev => ({
        ...prev,
        token: newToken,
        error: null,
      }));
    } catch (error) {
      console.error('Token refresh failed:', error);

      // If refresh fails, logout the user
      // The token refresh manager has already cleared the storage
      setState({
        user: null,
        token: null,
        loading: false,
        error: 'Session expired. Please login again.',
        isAuthenticated: false,
      });
    }
  }, []);

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
