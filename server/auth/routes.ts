import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from './controller';
import { authenticateToken, validateRequiredFields } from './middleware';
import {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  changePasswordRateLimiter,
  tokenRefreshRateLimiter,
  generalAuthRateLimiter,
  profileUpdateRateLimiter,
} from '../middleware/rateLimiter';
import { checkAccountLockout } from '../middleware/failedLoginTracker';

/**
 * Create authentication router with all auth endpoints
 */
const router = Router();

/**
 * Input validation middleware using express-validator
 */

const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

const updateProfileValidation = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

/**
 * Public routes (no authentication required)
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email: string, password: string, name: string }
 * @returns { success: boolean, data: { user: UserResponse, accessToken: string, refreshToken: string } }
 */
router.post(
  '/register',
  registerRateLimiter,
  registerValidation,
  validateRequiredFields(['email', 'password', 'name']),
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT tokens
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { success: boolean, data: { user: UserResponse, accessToken: string, refreshToken: string } }
 */
router.post(
  '/login',
  loginRateLimiter,
  checkAccountLockout, // Check if account is locked before processing login
  loginValidation,
  validateRequiredFields(['email', 'password']),
  login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken: string }
 * @returns { success: boolean, data: { accessToken: string, refreshToken: string } }
 */
router.post(
  '/refresh',
  tokenRefreshRateLimiter,
  refreshTokenValidation,
  validateRequiredFields(['refreshToken']),
  refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token deletion)
 * @access  Public
 * @returns { success: boolean, message: string }
 */
router.post('/logout', generalAuthRateLimiter, logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset token
 * @access  Public
 * @body    { email: string }
 * @returns { success: boolean, message: string }
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  forgotPasswordValidation,
  validateRequiredFields(['email']),
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 * @body    { token: string, newPassword: string }
 * @returns { success: boolean, message: string }
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  resetPasswordValidation,
  validateRequiredFields(['token', 'newPassword']),
  resetPassword
);

/**
 * Protected routes (authentication required)
 */

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user info
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @returns { success: boolean, data: { user: UserResponse } }
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile (name and/or email)
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    { name?: string, email?: string }
 * @returns { success: boolean, data: { user: UserResponse } }
 */
router.patch(
  '/profile',
  authenticateToken,
  profileUpdateRateLimiter,
  updateProfileValidation,
  updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    { currentPassword: string, newPassword: string }
 * @returns { success: boolean, message: string }
 */
router.post(
  '/change-password',
  authenticateToken,
  changePasswordRateLimiter,
  changePasswordValidation,
  validateRequiredFields(['currentPassword', 'newPassword']),
  changePassword
);

/**
 * Health check endpoint for auth service
 * @route   GET /api/auth/health
 * @desc    Check if auth service is running
 * @access  Public
 * @returns { success: boolean, message: string, timestamp: string }
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
