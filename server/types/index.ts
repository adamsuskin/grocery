import { Request } from 'express';

/**
 * User entity representing a registered user in the system
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  reset_token?: string;
  reset_token_expires?: Date;
}

/**
 * User data returned to client (without sensitive fields)
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Token pair for authentication
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Registration request body
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Refresh token request body
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  details?: unknown;
  statusCode: number;
}

/**
 * Standard API success response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Forgot password request body
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request body
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
