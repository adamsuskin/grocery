/**
 * Rate Limiting Configuration
 * Centralized configuration for all rate limiting settings
 */

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Failed login tracking configuration
 */
export interface FailedLoginConfig {
  maxAttempts: number;
  windowMinutes: number;
  lockoutDurationMinutes: number;
  cleanupIntervalHours: number;
}

/**
 * Rate limiting configurations for different endpoints
 */
export const rateLimitConfigs = {
  /**
   * Login endpoint - Strict limit to prevent brute force attacks
   * 5 attempts per 15 minutes per IP
   */
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all login attempts
  } as RateLimitConfig,

  /**
   * Registration endpoint - Prevent automated account creation
   * 3 attempts per hour per IP
   */
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many registration attempts from this IP. Please try again in 1 hour.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  } as RateLimitConfig,

  /**
   * Password reset request - Prevent abuse of password reset
   * 3 attempts per hour per IP
   */
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset requests. Please try again in 1 hour.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  } as RateLimitConfig,

  /**
   * Change password endpoint - Prevent brute force on password change
   * 5 attempts per 15 minutes per IP
   */
  changePassword: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many password change attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
  } as RateLimitConfig,

  /**
   * Token refresh endpoint - Moderate limit
   * 10 attempts per 15 minutes per IP
   */
  tokenRefresh: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many token refresh requests. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  } as RateLimitConfig,

  /**
   * General auth operations - More lenient
   * 20 attempts per 15 minutes per IP
   */
  generalAuth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: 'Too many requests. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  } as RateLimitConfig,

  /**
   * Profile update endpoint - Moderate limit
   * 10 attempts per 15 minutes per IP
   */
  profileUpdate: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many profile update attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  } as RateLimitConfig,
};

/**
 * Failed login tracking configuration
 * Account lockout after X failed attempts
 */
export const failedLoginConfig: FailedLoginConfig = {
  /**
   * Maximum failed login attempts before account lockout
   */
  maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),

  /**
   * Time window (in minutes) to track failed attempts
   */
  windowMinutes: parseInt(process.env.LOGIN_ATTEMPT_WINDOW_MINUTES || '15', 10),

  /**
   * Duration (in minutes) to lock the account after max attempts reached
   */
  lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30', 10),

  /**
   * Interval (in hours) to clean up old failed login records
   */
  cleanupIntervalHours: parseInt(process.env.CLEANUP_INTERVAL_HOURS || '24', 10),
};

/**
 * Security headers to include in rate limit responses
 */
export const rateLimitHeaders = {
  /**
   * Standard rate limit headers (RFC 6585)
   */
  standard: {
    limit: 'RateLimit-Limit',
    remaining: 'RateLimit-Remaining',
    reset: 'RateLimit-Reset',
  },

  /**
   * Legacy headers (X-RateLimit-*)
   */
  legacy: {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    retryAfter: 'Retry-After',
  },
};

/**
 * IP extraction configuration
 * For applications behind proxies (nginx, load balancers, etc.)
 */
export const ipConfig = {
  /**
   * Trust proxy settings - enables req.ip to work correctly
   * Set to true if behind a proxy
   */
  trustProxy: process.env.TRUST_PROXY === 'true',

  /**
   * Headers to check for real client IP (in order of preference)
   */
  ipHeaders: [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'x-cluster-client-ip',
  ],
};

/**
 * Rate limit store options
 * For production, consider using Redis or Memcached instead of memory store
 */
export const storeConfig = {
  /**
   * Store type: 'memory' | 'redis' | 'memcached'
   * Memory store is fine for single-instance deployments
   * Use Redis/Memcached for multi-instance deployments
   */
  type: process.env.RATE_LIMIT_STORE || 'memory',

  /**
   * Redis configuration (if using Redis store)
   */
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
};

/**
 * Logging configuration for rate limit events
 */
export const loggingConfig = {
  /**
   * Log rate limit hits to database
   */
  logToDatabase: process.env.LOG_RATE_LIMITS === 'true',

  /**
   * Log rate limit hits to console
   */
  logToConsole: process.env.NODE_ENV !== 'production',

  /**
   * Log only when rate limit is exceeded (vs all requests)
   */
  logOnlyExceeded: true,
};

export default {
  rateLimitConfigs,
  failedLoginConfig,
  rateLimitHeaders,
  ipConfig,
  storeConfig,
  loggingConfig,
};
