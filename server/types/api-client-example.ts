/**
 * Example API Client for Frontend Integration
 *
 * This is a reference implementation showing how to integrate the auth API
 * with your React frontend. Copy this to your src/ directory and customize.
 *
 * Usage:
 * 1. Copy this file to src/api/authClient.ts
 * 2. Install axios if not already installed: pnpm add axios
 * 3. Import and use in your React components
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_STORAGE_KEY = 'auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

// Types (should match server types)
interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Auth API Client Class
 */
class AuthClient {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Create axios instance with base configuration
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/auth`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load tokens from localStorage
    this.loadTokens();

    // Add request interceptor to attach token
    this.api.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config;

        // If error is 401 and we have a refresh token, try to refresh
        if (
          error.response?.status === 401 &&
          this.refreshToken &&
          originalRequest &&
          !originalRequest.headers['X-Retry']
        ) {
          try {
            // Try to refresh the token
            const newTokens = await this.refreshAccessToken();

            // Retry the original request with new token
            originalRequest.headers['X-Retry'] = 'true';
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokens(): void {
    this.accessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }

  /**
   * Clear tokens from memory and localStorage
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Register a new user
   */
  public async register(data: RegisterRequest): Promise<User> {
    const response = await this.api.post<LoginResponse>('/register', data);
    const { user, accessToken, refreshToken } = response.data.data;
    this.saveTokens(accessToken, refreshToken);
    return user;
  }

  /**
   * Login user
   */
  public async login(data: LoginRequest): Promise<User> {
    const response = await this.api.post<LoginResponse>('/login', data);
    const { user, accessToken, refreshToken } = response.data.data;
    this.saveTokens(accessToken, refreshToken);
    return user;
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      await this.api.post('/logout');
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current authenticated user
   */
  public async getCurrentUser(): Promise<User> {
    const response = await this.api.get<{ success: boolean; data: { user: User } }>('/me');
    return response.data.data.user;
  }

  /**
   * Update user profile
   */
  public async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    const response = await this.api.patch<{ success: boolean; data: { user: User } }>(
      '/profile',
      data
    );
    return response.data.data.user;
  }

  /**
   * Change password
   */
  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.post('/change-password', {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.api.post<{
      success: boolean;
      data: { accessToken: string; refreshToken: string };
    }>('/refresh', {
      refreshToken: this.refreshToken,
    });

    const { accessToken, refreshToken } = response.data.data;
    this.saveTokens(accessToken, refreshToken);
    return { accessToken, refreshToken };
  }
}

// Export singleton instance
export const authClient = new AuthClient();

/**
 * React Hook Example
 *
 * Copy this to src/hooks/useAuth.ts
 */

/*
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authClient } from '../api/authClient';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user on mount if authenticated
    const loadUser = async () => {
      if (authClient.isAuthenticated()) {
        try {
          const currentUser = await authClient.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to load user:', error);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await authClient.login({ email, password });
    setUser(user);
  };

  const register = async (email: string, password: string, name: string) => {
    const user = await authClient.register({ email, password, name });
    setUser(user);
  };

  const logout = async () => {
    await authClient.logout();
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    const updatedUser = await authClient.updateProfile(data);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
*/

/**
 * Component Usage Example
 */

/*
// In your App.tsx
import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      <YourAppComponents />
    </AuthProvider>
  );
}

// In your Login component
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect to dashboard or home
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}

// Protected Route Example
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
*/

export default authClient;
