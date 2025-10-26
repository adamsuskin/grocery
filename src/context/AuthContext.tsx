import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  AuthContextValue,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  User,
  AuthTokens,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
} from '../types/auth';
import { AUTH_STORAGE_KEYS } from '../types/auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Mock API endpoints - replace with actual API calls
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
        const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
        const expiryStr = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY);

        if (accessToken && userStr && expiryStr) {
          const expiry = parseInt(expiryStr, 10);
          const now = Date.now();

          // Check if token is expired
          if (expiry > now) {
            const user: User = JSON.parse(userStr);
            setAuthState({
              user,
              token: accessToken,
              loading: false,
              error: null,
              isAuthenticated: true,
            });
          } else {
            // Token expired, try to refresh
            handleRefreshToken();
          }
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, []);

  const saveAuthData = (user: User, tokens: AuthTokens) => {
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY, tokens.expiresAt.toString());
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));

    setAuthState({
      user,
      token: tokens.accessToken,
      loading: false,
      error: null,
      isAuthenticated: true,
    });
  };

  const clearAuthData = () => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);

    setAuthState({
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Invalid email or password');
      }

      const data: LoginResponse = await response.json();
      saveAuthData(data.user, data.tokens);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

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
      saveAuthData(data.user, data.tokens);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);

      // Optional: Call logout endpoint
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {
          // Ignore errors - clear local data anyway
        });
      }

      clearAuthData();
    } catch (error) {
      // Even if logout fails on server, clear local data
      clearAuthData();
    }
  };

  const handleRefreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        clearAuthData();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAuthData();
        return;
      }

      const data: RefreshTokenResponse = await response.json();

      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY, data.expiresAt.toString());

      setAuthState(prev => ({
        ...prev,
        token: data.accessToken,
        loading: false,
      }));
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextValue = {
    ...authState,
    login,
    register,
    logout,
    refreshToken: handleRefreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
