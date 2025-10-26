/**
 * Rate Limiting Middleware
 * Comprehensive rate limiting for authentication endpoints to prevent brute force attacks
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';
import { rateLimitConfigs, loggingConfig } from '../config/rateLimitConfig';
import { query } from '../db/pool';

/**
 * Extract client IP address from request
 * Handles various proxy configurations
 */
export function getClientIp(req: Request): string {
  // Try x-forwarded-for header first (common with proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return ips[0].trim();
  }

  // Try other common headers
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp.trim();
  }

  // Cloudflare
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') {
    return cfIp.trim();
  }

  // Fall back to socket remote address
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Log rate limit hit to database (optional)
 */
async function logRateLimitHit(
  endpoint: string,
  ip: string,
  limitType: string,
  userId?: string
): Promise<void> {
  if (!loggingConfig.logToDatabase) return;

  try {
    await query(
      `INSERT INTO rate_limit_logs (endpoint, ip_address, user_id, limit_type, hit_time)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [endpoint, ip, userId || null, limitType]
    );
  } catch (error) {
    // Don't throw error if logging fails
    console.error('Failed to log rate limit hit:', error);
  }
}

/**
 * Custom handler for rate limit exceeded
 */
function onLimitReached(limitType: string) {
  return async (req: Request, res: Response): Promise<void> => {
    const ip = getClientIp(req);
    const endpoint = req.path;

    // Log to console in development
    if (loggingConfig.logToConsole) {
      console.warn(`Rate limit exceeded - Type: ${limitType}, IP: ${ip}, Endpoint: ${endpoint}`);
    }

    // Log to database
    await logRateLimitHit(endpoint, ip, limitType);

    // Response is handled by the rate limiter, this is just for logging
  };
}

/**
 * Create standardized error response for rate limit
 */
function createRateLimitResponse(message: string) {
  return {
    success: false,
    error: 'Rate limit exceeded',
    message: message,
    retryAfter: 'See Retry-After header for wait time',
  };
}

/**
 * Key generator function that uses IP address
 * This ensures rate limiting is per IP address
 */
function keyGenerator(req: Request): string {
  return getClientIp(req);
}

/**
 * Skip function for successful requests (when configured)
 */
function skipSuccessfulRequests(req: Request, res: Response): boolean {
  // Skip counting if response was successful (2xx status code)
  return res.statusCode < 400;
}

/**
 * Skip function for failed requests (when configured)
 */
function skipFailedRequests(req: Request, res: Response): boolean {
  // Skip counting if response was failed (4xx or 5xx status code)
  return res.statusCode >= 400;
}

/**
 * Login rate limiter - Strict limit to prevent brute force attacks
 * 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: rateLimitConfigs.login.windowMs,
  max: rateLimitConfigs.login.max,
  message: createRateLimitResponse(rateLimitConfigs.login.message),
  standardHeaders: rateLimitConfigs.login.standardHeaders,
  legacyHeaders: rateLimitConfigs.login.legacyHeaders,
  keyGenerator,
  handler: async (req, res) => {
    await onLimitReached('login')(req, res);
    res.status(429).json(createRateLimitResponse(rateLimitConfigs.login.message));
  },
  skip: rateLimitConfigs.login.skipSuccessfulRequests ? skipSuccessfulRequests : undefined,
});

/**
 * Registration rate limiter - Prevent automated account creation
 * 3 attempts per hour per IP
 */
export const registerRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: rateLimitConfigs.register.windowMs,
  max: rateLimitConfigs.register.max,
  message: createRateLimitResponse(rateLimitConfigs.register.message),
  standardHeaders: rateLimitConfigs.register.standardHeaders,
  legacyHeaders: rateLimitConfigs.register.legacyHeaders,
  keyGenerator,
  handler: async (req, res) => {
    await onLimitReached('register')(req, res);
    res.status(429).json(createRateLimitResponse(rateLimitConfigs.register.message));
  },
  skip: rateLimitConfigs.register.skipSuccessfulRequests ? skipSuccessfulRequests : undefined,
});

/**
 * Password reset rate limiter - Prevent abuse of password reset
 * 3 attempts per hour per IP
 */
export const passwordResetRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: rateLimitConfigs.passwordReset.windowMs,
  max: rateLimitConfigs.passwordReset.max,
  message: createRateLimitResponse(rateLimitConfigs.passwordReset.message),
  standardHeaders: rateLimitConfigs.passwordReset.standardHeaders,
  legacyHeaders: rateLimitConfigs.passwordReset.legacyHeaders,
  keyGenerator,
  handler: async (req, res) => {
    await onLimitReached('password_reset')(req, res);
    res.status(429).json(createRateLimitResponse(rateLimitConfigs.passwordReset.message));
  },
  skip: rateLimitConfigs.passwordReset.skipSuccessfulRequests ? skipSuccessfulRequests : undefined,
});

/**
 * Change password rate limiter - Prevent brute force on password change
 * 5 attempts per 15 minutes per IP
 */
export const changePasswordRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: rateLimitConfigs.changePassword.windowMs,
  max: rateLimitConfigs.changePassword.max,
  message: createRateLimitResponse(rateLimitConfigs.changePassword.message),
  standardHeaders: rateLimitConfigs.changePassword.standardHeaders,
  legacyHeaders: rateLimitConfigs.changePassword.legacyHeaders,
  keyGenerator,
  handler: async (req, res) => {
    await onLimitReached('change_password')(req, res);
    res.status(429).json(createRateLimitResponse(rateLimitConfigs.changePassword.message));
  },
  skip: rateLimitConfigs.changePassword.skipSuccessfulRequests ? skipSuccessfulRequests : undefined,
});

/**
 * Token refresh rate limiter - Moderate limit
 * 10 attempts per 15 minutes per IP
 */
export const tokenRefreshRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: rateLimitConfigs.tokenRefresh.windowMs,
  max: rateLimitConfigs.tokenRefresh.max,
  message: createRateLimitResponse(rateLimitConfigs.tokenRefresh.message),
  standardHeaders: rateLimitConfigs.tokenRefresh.standardHeaders,
  legacyHeaders: rateLimitConfigs.tokenRefresh.legacyHeaders,
  keyGenerator,
  handler: async (req, res) => {
    await onLimitReached('token_refresh')(req, res);
    res.status(429).json(createRateLimitResponse(rateLimitConfigs.tokenRefresh.message));
  },
  skip: rateLimitConfigs.tokenRefresh.skipSuccessfulRequests ? skipSuccessfulRequests : undefined,
});

/**
 * General auth operations rate limiter - More lenient
 * 20 attempts per 15 minutes per IP
 */
export const generalAuthRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: rateLimitConfigs.generalAuth.windowMs,
  max: rateLimitConfigs.generalAuth.max,
  message: createRateLimitResponse(rateLimitConfigs.generalAuth.message),
  standardHeaders: rateLimitConfigs.generalAuth.standardHeaders,
  legacyHeaders: rateLimitConfigs.generalAuth.legacyHeaders,
  keyGenerator,
  handler: async (req, res) => {
    await onLimitReached('general_auth')(req, res);
    res.status(429).json(createRateLimitResponse(rateLimitConfigs.generalAuth.message));
  },
  skip: rateLimitConfigs.generalAuth.skipSuccessfulRequests ? skipSuccessfulRequests : undefined,
});

/**
 * Profile update rate limiter - Moderate limit
 * 10 attempts per 15 minutes per IP
 */
export const profileUpdateRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: rateLimitConfigs.profileUpdate.windowMs,
  max: rateLimitConfigs.profileUpdate.max,
  message: createRateLimitResponse(rateLimitConfigs.profileUpdate.message),
  standardHeaders: rateLimitConfigs.profileUpdate.standardHeaders,
  legacyHeaders: rateLimitConfigs.profileUpdate.legacyHeaders,
  keyGenerator,
  handler: async (req, res) => {
    await onLimitReached('profile_update')(req, res);
    res.status(429).json(createRateLimitResponse(rateLimitConfigs.profileUpdate.message));
  },
  skip: rateLimitConfigs.profileUpdate.skipSuccessfulRequests ? skipSuccessfulRequests : undefined,
});

/**
 * User search rate limiter - Prevent abuse of search functionality
 * 30 attempts per 15 minutes per IP
 */
export const userSearchRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: rateLimitConfigs.userSearch.windowMs,
  max: rateLimitConfigs.userSearch.max,
  message: createRateLimitResponse(rateLimitConfigs.userSearch.message),
  standardHeaders: rateLimitConfigs.userSearch.standardHeaders,
  legacyHeaders: rateLimitConfigs.userSearch.legacyHeaders,
  keyGenerator,
  handler: async (req, res) => {
    await onLimitReached('user_search')(req, res);
    res.status(429).json(createRateLimitResponse(rateLimitConfigs.userSearch.message));
  },
  skip: rateLimitConfigs.userSearch.skipSuccessfulRequests ? skipSuccessfulRequests : undefined,
});

/**
 * Export all rate limiters
 */
export default {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  changePasswordRateLimiter,
  tokenRefreshRateLimiter,
  generalAuthRateLimiter,
  profileUpdateRateLimiter,
  userSearchRateLimiter,
  getClientIp,
};
