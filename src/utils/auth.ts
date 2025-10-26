/**
 * Authentication Utility Functions
 *
 * This module provides core authentication utilities including:
 * - Token storage management (localStorage with error handling)
 * - Token validation (expiry checks, format validation)
 * - Password validation (strength requirements)
 * - Auth header generation
 * - Error handling for common auth scenarios
 *
 * @module utils/auth
 */

import type { User, AuthTokens } from '../types/auth';

/**
 * Storage keys for authentication data
 * Centralized to prevent typos and maintain consistency
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'grocery_auth_access_token',
  REFRESH_TOKEN: 'grocery_auth_refresh_token',
  TOKEN_EXPIRY: 'grocery_auth_token_expiry',
  USER: 'grocery_auth_user',
} as const;

/**
 * Auth error types for better error handling
 */
export enum AuthErrorType {
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom AuthError class for typed error handling
 */
export class AuthError extends Error {
  type: AuthErrorType;
  statusCode?: number;
  originalError?: unknown;

  constructor(message: string, type: AuthErrorType, statusCode?: number, originalError?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
}

// =============================================================================
// TOKEN STORAGE UTILITIES
// =============================================================================

/**
 * Safely saves the access token to localStorage
 *
 * @param token - JWT access token
 * @throws {AuthError} If storage operation fails
 *
 * @example
 * ```typescript
 * try {
 *   saveAccessToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * } catch (error) {
 *   if (error instanceof AuthError) {
 *     console.error('Storage failed:', error.message);
 *   }
 * }
 * ```
 */
export function saveAccessToken(token: string): void {
  try {
    if (!token || typeof token !== 'string') {
      throw new AuthError('Invalid token provided', AuthErrorType.VALIDATION_ERROR);
    }
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, token);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      'Failed to save access token to storage',
      AuthErrorType.STORAGE_ERROR,
      undefined,
      error
    );
  }
}

/**
 * Safely saves the refresh token to localStorage
 *
 * @param token - JWT refresh token
 * @throws {AuthError} If storage operation fails
 */
export function saveRefreshToken(token: string): void {
  try {
    if (!token || typeof token !== 'string') {
      throw new AuthError('Invalid token provided', AuthErrorType.VALIDATION_ERROR);
    }
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      'Failed to save refresh token to storage',
      AuthErrorType.STORAGE_ERROR,
      undefined,
      error
    );
  }
}

/**
 * Saves token expiry timestamp to localStorage
 *
 * @param expiresAt - Unix timestamp in milliseconds when token expires
 * @throws {AuthError} If storage operation fails
 */
export function saveTokenExpiry(expiresAt: number): void {
  try {
    if (!expiresAt || typeof expiresAt !== 'number' || expiresAt <= 0) {
      throw new AuthError('Invalid expiry timestamp', AuthErrorType.VALIDATION_ERROR);
    }
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString());
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      'Failed to save token expiry to storage',
      AuthErrorType.STORAGE_ERROR,
      undefined,
      error
    );
  }
}

/**
 * Saves user data to localStorage
 *
 * @param user - User object to store
 * @throws {AuthError} If storage operation fails
 */
export function saveUser(user: User): void {
  try {
    if (!user || typeof user !== 'object') {
      throw new AuthError('Invalid user data provided', AuthErrorType.VALIDATION_ERROR);
    }
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      'Failed to save user data to storage',
      AuthErrorType.STORAGE_ERROR,
      undefined,
      error
    );
  }
}

/**
 * Saves all authentication data in a single transaction
 * Useful after login or registration to ensure all data is saved atomically
 *
 * @param user - User object
 * @param tokens - Authentication tokens object
 * @throws {AuthError} If any storage operation fails
 *
 * @example
 * ```typescript
 * const loginResponse = await api.login({ email, password });
 * saveAuthData(loginResponse.user, loginResponse.tokens);
 * ```
 */
export function saveAuthData(user: User, tokens: AuthTokens): void {
  try {
    saveUser(user);
    saveAccessToken(tokens.accessToken);
    saveRefreshToken(tokens.refreshToken);
    saveTokenExpiry(tokens.expiresAt);
  } catch (error) {
    // If any save fails, clear all to maintain consistency
    clearAuthData();
    throw error;
  }
}

/**
 * Retrieves the access token from localStorage
 *
 * @returns Access token string or null if not found
 *
 * @example
 * ```typescript
 * const token = getAccessToken();
 * if (token) {
 *   // Token exists, use it for API calls
 * }
 * ```
 */
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Failed to get access token from storage:', error);
    return null;
  }
}

/**
 * Retrieves the refresh token from localStorage
 *
 * @returns Refresh token string or null if not found
 */
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Failed to get refresh token from storage:', error);
    return null;
  }
}

/**
 * Retrieves the token expiry timestamp from localStorage
 *
 * @returns Unix timestamp in milliseconds or null if not found
 */
export function getTokenExpiry(): number | null {
  try {
    const expiry = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (error) {
    console.error('Failed to get token expiry from storage:', error);
    return null;
  }
}

/**
 * Retrieves the user data from localStorage
 *
 * @returns User object or null if not found or invalid
 */
export function getUser(): User | null {
  try {
    const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to get user from storage:', error);
    return null;
  }
}

/**
 * Retrieves all authentication data from storage
 *
 * @returns Object containing all auth data or null values if not found
 *
 * @example
 * ```typescript
 * const { user, accessToken, refreshToken, expiresAt } = getAuthData();
 * if (user && accessToken) {
 *   // User is authenticated
 * }
 * ```
 */
export function getAuthData(): {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
} {
  return {
    user: getUser(),
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    expiresAt: getTokenExpiry(),
  };
}

/**
 * Removes the access token from localStorage
 */
export function removeAccessToken(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Failed to remove access token from storage:', error);
  }
}

/**
 * Removes the refresh token from localStorage
 */
export function removeRefreshToken(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Failed to remove refresh token from storage:', error);
  }
}

/**
 * Removes the token expiry from localStorage
 */
export function removeTokenExpiry(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY);
  } catch (error) {
    console.error('Failed to remove token expiry from storage:', error);
  }
}

/**
 * Removes the user data from localStorage
 */
export function removeUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Failed to remove user from storage:', error);
  }
}

/**
 * Clears all authentication data from localStorage
 * Should be called on logout or when auth state becomes invalid
 *
 * @example
 * ```typescript
 * // On logout
 * clearAuthData();
 * ```
 */
export function clearAuthData(): void {
  removeAccessToken();
  removeRefreshToken();
  removeTokenExpiry();
  removeUser();
}

// =============================================================================
// TOKEN VALIDATION UTILITIES
// =============================================================================

/**
 * Checks if a token is expired based on the expiry timestamp
 *
 * @param expiresAt - Unix timestamp in milliseconds when token expires
 * @param bufferMinutes - Optional buffer time in minutes to consider token expired early (default: 0)
 * @returns true if token is expired (or will expire within buffer time)
 *
 * @example
 * ```typescript
 * const expiresAt = getTokenExpiry();
 * if (expiresAt && isTokenExpired(expiresAt)) {
 *   // Token is expired, refresh it
 *   await refreshToken();
 * }
 *
 * // Check with 5-minute buffer (useful for proactive refresh)
 * if (expiresAt && isTokenExpired(expiresAt, 5)) {
 *   // Token will expire within 5 minutes
 *   await refreshToken();
 * }
 * ```
 */
export function isTokenExpired(expiresAt: number, bufferMinutes: number = 0): boolean {
  const now = Date.now();
  const bufferMs = bufferMinutes * 60 * 1000;
  return now >= (expiresAt - bufferMs);
}

/**
 * Checks if the currently stored token is expired
 *
 * @param bufferMinutes - Optional buffer time in minutes (default: 0)
 * @returns true if token is expired, false if valid, null if no token found
 *
 * @example
 * ```typescript
 * const expired = isStoredTokenExpired(5); // Check with 5-minute buffer
 * if (expired) {
 *   await refreshToken();
 * } else if (expired === null) {
 *   // No token, redirect to login
 *   redirectToLogin();
 * }
 * ```
 */
export function isStoredTokenExpired(bufferMinutes: number = 0): boolean | null {
  const expiresAt = getTokenExpiry();
  if (expiresAt === null) {
    return null;
  }
  return isTokenExpired(expiresAt, bufferMinutes);
}

/**
 * Calculates milliseconds until token expiry
 *
 * @param expiresAt - Unix timestamp in milliseconds when token expires
 * @returns Milliseconds until expiry (0 if already expired)
 *
 * @example
 * ```typescript
 * const expiresAt = getTokenExpiry();
 * if (expiresAt) {
 *   const msUntilExpiry = getTimeUntilExpiry(expiresAt);
 *   console.log(`Token expires in ${Math.floor(msUntilExpiry / 60000)} minutes`);
 * }
 * ```
 */
export function getTimeUntilExpiry(expiresAt: number): number {
  const now = Date.now();
  return Math.max(0, expiresAt - now);
}

/**
 * Calculates seconds until token expiry
 *
 * @param expiresAt - Unix timestamp in milliseconds when token expires
 * @returns Seconds until expiry (0 if already expired)
 */
export function getSecondsUntilExpiry(expiresAt: number): number {
  return Math.floor(getTimeUntilExpiry(expiresAt) / 1000);
}

/**
 * Calculates minutes until token expiry
 *
 * @param expiresAt - Unix timestamp in milliseconds when token expires
 * @returns Minutes until expiry (0 if already expired)
 */
export function getMinutesUntilExpiry(expiresAt: number): number {
  return Math.floor(getTimeUntilExpiry(expiresAt) / 60000);
}

/**
 * Validates JWT token format (basic structure check, not signature verification)
 * Checks if token has the correct JWT structure: header.payload.signature
 *
 * @param token - JWT token string to validate
 * @returns true if token has valid JWT structure
 *
 * @example
 * ```typescript
 * const token = getAccessToken();
 * if (token && isValidTokenFormat(token)) {
 *   // Token has valid structure
 * } else {
 *   // Invalid token format
 *   clearAuthData();
 * }
 * ```
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // JWT tokens should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Each part should be non-empty
  return parts.every(part => part.length > 0);
}

/**
 * Decodes JWT payload without verification (client-side only, for display purposes)
 * WARNING: This does NOT verify the token signature. Never trust this data for security decisions.
 *
 * @param token - JWT token string
 * @returns Decoded payload object or null if invalid
 *
 * @example
 * ```typescript
 * const token = getAccessToken();
 * if (token) {
 *   const payload = decodeToken(token);
 *   console.log('Token expires at:', new Date(payload.exp * 1000));
 * }
 * ```
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    if (!isValidTokenFormat(token)) {
      return null;
    }

    const parts = token.split('.');
    const payload = parts[1];

    // Decode base64url
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Checks if the authentication state is valid
 * Validates that all required auth data exists and token is not expired
 *
 * @param bufferMinutes - Optional buffer time in minutes (default: 0)
 * @returns true if auth state is valid and complete
 *
 * @example
 * ```typescript
 * if (hasValidAuthState()) {
 *   // User is authenticated and token is valid
 *   proceedWithAuthenticatedAction();
 * } else {
 *   // Redirect to login
 *   redirectToLogin();
 * }
 * ```
 */
export function hasValidAuthState(bufferMinutes: number = 0): boolean {
  const { user, accessToken, refreshToken, expiresAt } = getAuthData();

  // All required data must be present
  if (!user || !accessToken || !refreshToken || !expiresAt) {
    return false;
  }

  // Token must have valid format
  if (!isValidTokenFormat(accessToken)) {
    return false;
  }

  // Token must not be expired
  if (isTokenExpired(expiresAt, bufferMinutes)) {
    return false;
  }

  return true;
}

// =============================================================================
// PASSWORD VALIDATION UTILITIES
// =============================================================================

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number; // 0-100
}

/**
 * Password requirements configuration
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength?: number;
}

/**
 * Default password requirements
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
};

/**
 * Validates password strength and requirements
 *
 * @param password - Password string to validate
 * @param requirements - Optional custom requirements (uses defaults if not provided)
 * @returns Validation result with errors and strength score
 *
 * @example
 * ```typescript
 * const result = validatePassword('MyP@ssw0rd');
 * if (!result.isValid) {
 *   console.error('Password errors:', result.errors);
 * } else {
 *   console.log('Password strength:', result.strength);
 * }
 *
 * // Custom requirements
 * const result = validatePassword('password', {
 *   minLength: 6,
 *   requireUppercase: false,
 *   requireLowercase: true,
 *   requireNumbers: false,
 *   requireSpecialChars: false,
 * });
 * ```
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check if password exists
  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
      score: 0,
    };
  }

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  } else {
    score += 20;
  }

  // Check maximum length
  if (requirements.maxLength && password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }

  // Check uppercase requirement
  const hasUppercase = /[A-Z]/.test(password);
  if (requirements.requireUppercase && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (hasUppercase) {
    score += 20;
  }

  // Check lowercase requirement
  const hasLowercase = /[a-z]/.test(password);
  if (requirements.requireLowercase && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (hasLowercase) {
    score += 20;
  }

  // Check numbers requirement
  const hasNumbers = /\d/.test(password);
  if (requirements.requireNumbers && !hasNumbers) {
    errors.push('Password must contain at least one number');
  } else if (hasNumbers) {
    score += 20;
  }

  // Check special characters requirement
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (requirements.requireSpecialChars && !hasSpecialChars) {
    errors.push('Password must contain at least one special character');
  } else if (hasSpecialChars) {
    score += 20;
  }

  // Bonus points for length
  if (password.length >= 12) {
    score += 10;
  }
  if (password.length >= 16) {
    score += 10;
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Determine strength
  let strength: PasswordValidationResult['strength'];
  if (score >= 80) {
    strength = 'very-strong';
  } else if (score >= 60) {
    strength = 'strong';
  } else if (score >= 40) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Checks if password meets minimum requirements (simple boolean check)
 *
 * @param password - Password to validate
 * @param requirements - Optional custom requirements
 * @returns true if password is valid
 */
export function isPasswordValid(
  password: string,
  requirements?: PasswordRequirements
): boolean {
  return validatePassword(password, requirements).isValid;
}

/**
 * Gets password strength without validation
 * Useful for password strength meters
 *
 * @param password - Password to check
 * @returns Strength level and score
 *
 * @example
 * ```typescript
 * const { strength, score } = getPasswordStrength('MyP@ssw0rd123');
 * // Display strength meter based on score
 * ```
 */
export function getPasswordStrength(password: string): {
  strength: PasswordValidationResult['strength'];
  score: number;
} {
  const result = validatePassword(password, {
    minLength: 0,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
  });
  return {
    strength: result.strength,
    score: result.score,
  };
}

// =============================================================================
// AUTH HEADER UTILITIES
// =============================================================================

/**
 * Generates Authorization header value for Bearer token
 *
 * @param token - JWT access token
 * @returns Bearer token header value
 *
 * @example
 * ```typescript
 * const token = getAccessToken();
 * if (token) {
 *   const authHeader = getAuthorizationHeader(token);
 *   // Use in fetch: headers: { 'Authorization': authHeader }
 * }
 * ```
 */
export function getAuthorizationHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Generates headers object with authentication
 *
 * @param token - JWT access token
 * @param additionalHeaders - Optional additional headers to include
 * @returns Headers object with Authorization and Content-Type
 *
 * @example
 * ```typescript
 * const token = getAccessToken();
 * const headers = getAuthHeaders(token);
 *
 * fetch('/api/data', {
 *   method: 'GET',
 *   headers,
 * });
 *
 * // With additional headers
 * const headers = getAuthHeaders(token, {
 *   'X-Custom-Header': 'value',
 * });
 * ```
 */
export function getAuthHeaders(
  token: string,
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  return {
    'Authorization': getAuthorizationHeader(token),
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
}

/**
 * Generates headers object with authentication from stored token
 * Returns null if no valid token is available
 *
 * @param additionalHeaders - Optional additional headers to include
 * @returns Headers object or null if no token available
 *
 * @example
 * ```typescript
 * const headers = getStoredAuthHeaders();
 * if (headers) {
 *   fetch('/api/data', { headers });
 * } else {
 *   // No token, redirect to login
 * }
 * ```
 */
export function getStoredAuthHeaders(
  additionalHeaders: Record<string, string> = {}
): Record<string, string> | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }
  return getAuthHeaders(token, additionalHeaders);
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Determines if an error is an authentication error
 *
 * @param error - Error object to check
 * @returns true if error is auth-related
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Determines if an error indicates an expired token
 *
 * @param error - Error object to check
 * @returns true if error indicates token expiration
 */
export function isTokenExpiredError(error: unknown): boolean {
  if (error instanceof AuthError) {
    return error.type === AuthErrorType.TOKEN_EXPIRED;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('expired') || message.includes('token') && message.includes('invalid');
  }
  return false;
}

/**
 * Determines if an error indicates unauthorized access
 *
 * @param error - Error object to check
 * @returns true if error indicates unauthorized
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof AuthError) {
    return error.type === AuthErrorType.UNAUTHORIZED || error.statusCode === 401;
  }
  return false;
}

/**
 * Converts HTTP response error to AuthError
 *
 * @param response - Fetch Response object
 * @param fallbackMessage - Optional fallback error message
 * @returns AuthError instance
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/endpoint', { headers });
 * if (!response.ok) {
 *   throw await createAuthErrorFromResponse(response);
 * }
 * ```
 */
export async function createAuthErrorFromResponse(
  response: Response,
  fallbackMessage: string = 'Authentication error'
): Promise<AuthError> {
  let message = fallbackMessage;
  let type = AuthErrorType.UNKNOWN_ERROR;

  // Try to extract error message from response
  try {
    const data = await response.json();
    message = data.message || data.error || fallbackMessage;
  } catch {
    // If JSON parsing fails, use status text
    message = response.statusText || fallbackMessage;
  }

  // Determine error type from status code
  switch (response.status) {
    case 401:
      type = AuthErrorType.UNAUTHORIZED;
      break;
    case 403:
      type = AuthErrorType.UNAUTHORIZED;
      break;
    case 400:
      type = AuthErrorType.VALIDATION_ERROR;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      type = AuthErrorType.NETWORK_ERROR;
      break;
    default:
      type = AuthErrorType.UNKNOWN_ERROR;
  }

  return new AuthError(message, type, response.status);
}

/**
 * Handles common auth errors with automatic cleanup
 *
 * @param error - Error to handle
 * @param options - Error handling options
 * @returns Formatted error message
 *
 * @example
 * ```typescript
 * try {
 *   await makeAuthenticatedRequest();
 * } catch (error) {
 *   const message = handleAuthError(error, {
 *     clearOnUnauthorized: true,
 *     logErrors: true,
 *   });
 *   showErrorToast(message);
 * }
 * ```
 */
export function handleAuthError(
  error: unknown,
  options: {
    clearOnUnauthorized?: boolean;
    clearOnExpired?: boolean;
    logErrors?: boolean;
  } = {}
): string {
  const {
    clearOnUnauthorized = false,
    clearOnExpired = false,
    logErrors = true,
  } = options;

  if (logErrors) {
    console.error('Auth error:', error);
  }

  if (error instanceof AuthError) {
    // Handle specific auth error types
    if (error.type === AuthErrorType.TOKEN_EXPIRED && clearOnExpired) {
      clearAuthData();
    }
    if (error.type === AuthErrorType.UNAUTHORIZED && clearOnUnauthorized) {
      clearAuthData();
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected authentication error occurred';
}
