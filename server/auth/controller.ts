import { Response } from 'express';
import crypto from 'crypto';
import { query } from '../db/pool';
import {
  AuthRequest,
  User,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  UserResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types';
import {
  hashPassword,
  comparePassword,
  generateTokenPair,
  verifyRefreshToken,
  sanitizeUser,
  isValidEmail,
  validatePassword,
} from './utils';
import {
  sendEmail,
  generatePasswordResetEmail,
  generatePasswordResetSuccessEmail,
} from '../utils/email';
import {
  handleFailedLogin,
  handleSuccessfulLogin,
} from '../middleware/failedLoginTracker';

/**
 * Register a new user
 * POST /api/auth/register
 * @param req - Express request with RegisterRequest body
 * @param res - Express response
 */
export async function register(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { email, password, name } = req.body as RegisterRequest;

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email, password, and name are required',
      });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid email format',
      });
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: passwordValidation.error,
      });
      return;
    }

    // Validate name length
    if (name.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Name must be at least 2 characters long',
      });
      return;
    }

    // Check if user already exists
    const existingUsers = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email already exists',
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUsers = await query<User>(
      `INSERT INTO users (email, password_hash, name, created_at, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [email.toLowerCase(), passwordHash, name.trim()]
    );

    const newUser = newUsers[0];

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Generate tokens
    const tokens = generateTokenPair(newUser);

    // Return user data and tokens
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: sanitizeUser(newUser),
        ...tokens,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to register user',
    });
  }
}

/**
 * Login user and return JWT tokens
 * POST /api/auth/login
 * @param req - Express request with LoginRequest body
 * @param res - Express response
 */
export async function login(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email and password are required',
      });
      return;
    }

    // Find user by email
    const users = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = users[0];

    if (!user) {
      // Record failed login attempt even if user doesn't exist
      await handleFailedLogin(email, null, req);

      // Don't reveal whether user exists or not
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      // Record failed login attempt for existing user
      await handleFailedLogin(email, user.id, req);

      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
      return;
    }

    // Clear failed login attempts on successful login
    await handleSuccessfulLogin(email);

    // Update last login time
    await query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Return user data and tokens
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        ...tokens,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to login',
    });
  }
}

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 * @param req - Express request with RefreshTokenRequest body
 * @param res - Express response
 */
export async function refreshToken(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid token';
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: errorMessage,
      });
      return;
    }

    // Get user from database
    const users = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = users[0];

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User associated with token does not exist',
      });
      return;
    }

    // Generate new token pair
    const tokens = generateTokenPair(user);

    // Return new tokens
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to refresh token',
    });
  }
}

/**
 * Logout user (client-side token deletion)
 * POST /api/auth/logout
 * @param req - Express request
 * @param res - Express response
 */
export async function logout(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    // In a JWT-based system, logout is primarily client-side
    // The client should delete the tokens from storage
    // Optionally, you could implement token blacklisting here

    // If using refresh token table, you could revoke the tokens
    // For now, we'll just return a success message

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: {
        message: 'Please delete tokens from client storage',
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to logout',
    });
  }
}

/**
 * Get current authenticated user info
 * GET /api/auth/me
 * @param req - Express request with authenticated user
 * @param res - Express response
 */
export async function getCurrentUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Get user from database
    const users = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [req.user.userId]
    );

    const user = users[0];

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
      return;
    }

    // Return user data
    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get user information',
    });
  }
}

/**
 * Update user profile
 * PATCH /api/auth/profile
 * @param req - Express request with authenticated user
 * @param res - Express response
 */
export async function updateProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const { name, email } = req.body;

    // Validate at least one field is provided
    if (!name && !email) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'At least one field (name or email) is required',
      });
      return;
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (name) {
      if (name.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Name must be at least 2 characters long',
        });
        return;
      }
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
      paramCount++;
    }

    if (email) {
      if (!isValidEmail(email)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Invalid email format',
        });
        return;
      }

      // Check if email is already taken by another user
      const existingUsers = await query<User>(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), req.user.userId]
      );

      if (existingUsers.length > 0) {
        res.status(409).json({
          success: false,
          error: 'Email already exists',
          message: 'This email is already associated with another account',
        });
        return;
      }

      updates.push(`email = $${paramCount}`);
      values.push(email.toLowerCase());
      paramCount++;
    }

    // Add user ID to values
    values.push(req.user.userId);

    // Update user
    const updatedUsers = await query<User>(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    const updatedUser = updatedUsers[0];

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
      return;
    }

    // Return updated user data
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: sanitizeUser(updatedUser),
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update profile',
    });
  }
}

/**
 * Change user password
 * POST /api/auth/change-password
 * @param req - Express request with authenticated user
 * @param res - Express response
 */
export async function changePassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Current password and new password are required',
      });
      return;
    }

    // Get user from database
    const users = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [req.user.userId]
    );

    const user = users[0];

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect',
      });
      return;
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: passwordValidation.error,
      });
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.userId]
    );

    // Return success
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to change password',
    });
  }
}

/**
 * Request password reset token
 * POST /api/auth/forgot-password
 * @param req - Express request with ForgotPasswordRequest body
 * @param res - Express response
 */
export async function forgotPassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { email } = req.body as ForgotPasswordRequest;

    // Validate input
    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email is required',
      });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid email format',
      });
      return;
    }

    // Find user by email
    const users = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = users[0];

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, return success message
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent',
      });
      return;
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store hashed token in database
    await query(
      `UPDATE users
       SET reset_token = $1,
           reset_token_expires = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [resetTokenHash, expiresAt, user.id]
    );

    // Send password reset email
    const emailContent = generatePasswordResetEmail(
      user.email,
      resetToken, // Send unhashed token in email
      user.name
    );

    await sendEmail(emailContent);

    // Return success
    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process password reset request',
    });
  }
}

/**
 * Reset password using token
 * POST /api/auth/reset-password
 * @param req - Express request with ResetPasswordRequest body
 * @param res - Express response
 */
export async function resetPassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { token, newPassword } = req.body as ResetPasswordRequest;

    // Validate input
    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Token and new password are required',
      });
      return;
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: passwordValidation.error,
      });
      return;
    }

    // Hash the token to match stored hash
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by reset token and check expiration
    const users = await query<User>(
      `SELECT * FROM users
       WHERE reset_token = $1
       AND reset_token_expires > CURRENT_TIMESTAMP`,
      [resetTokenHash]
    );

    const user = users[0];

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Password reset token is invalid or has expired',
      });
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await query(
      `UPDATE users
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    // Send password reset success email
    const emailContent = generatePasswordResetSuccessEmail(
      user.email,
      user.name
    );

    await sendEmail(emailContent);

    // Return success
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to reset password',
    });
  }
}
