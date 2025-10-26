// Auth-related types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

// API response types
export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresAt: number;
}

// Storage keys
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'grocery_auth_access_token',
  REFRESH_TOKEN: 'grocery_auth_refresh_token',
  TOKEN_EXPIRY: 'grocery_auth_token_expiry',
  USER: 'grocery_auth_user',
} as const;
