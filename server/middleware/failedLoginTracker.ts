/**
 * Failed Login Tracker
 * Tracks failed login attempts per user and implements account lockout
 */

import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { failedLoginConfig } from '../config/rateLimitConfig';
import { getClientIp } from './rateLimiter';

/**
 * Failed login attempt interface
 */
interface FailedLoginAttempt {
  id: string;
  user_id: string | null;
  email: string;
  ip_address: string;
  attempt_time: Date;
  created_at: Date;
}

/**
 * Account lockout interface
 */
interface AccountLockout {
  id: string;
  user_id: string | null;
  email: string;
  locked_at: Date;
  unlock_at: Date;
  reason: string;
  is_active: boolean;
  created_at: Date;
}

/**
 * Check if an account is currently locked
 */
export async function isAccountLocked(email: string): Promise<{
  locked: boolean;
  unlockAt?: Date;
  remainingMinutes?: number;
}> {
  try {
    // First, clean up expired lockouts
    await cleanupExpiredLockouts();

    // Check for active lockout
    const lockouts = await query<AccountLockout>(
      `SELECT * FROM account_lockouts
       WHERE email = $1 AND is_active = TRUE AND unlock_at > NOW()
       ORDER BY unlock_at DESC
       LIMIT 1`,
      [email.toLowerCase()]
    );

    if (lockouts.length === 0) {
      return { locked: false };
    }

    const lockout = lockouts[0];
    const unlockAt = new Date(lockout.unlock_at);
    const now = new Date();
    const remainingMs = unlockAt.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return {
      locked: true,
      unlockAt,
      remainingMinutes,
    };
  } catch (error) {
    console.error('Error checking account lockout:', error);
    // Fail open - don't lock users out if there's a database error
    return { locked: false };
  }
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(
  email: string,
  userId: string | null,
  req: Request
): Promise<void> {
  try {
    const ip = getClientIp(req);

    await query(
      `INSERT INTO failed_login_attempts (user_id, email, ip_address, attempt_time)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [userId, email.toLowerCase(), ip]
    );

    console.log(`Failed login attempt recorded - Email: ${email}, IP: ${ip}`);
  } catch (error) {
    console.error('Error recording failed login attempt:', error);
  }
}

/**
 * Get count of recent failed login attempts
 */
export async function getRecentFailedAttempts(email: string): Promise<number> {
  try {
    const windowMinutes = failedLoginConfig.windowMinutes;

    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM failed_login_attempts
       WHERE email = $1
       AND attempt_time > NOW() - INTERVAL '${windowMinutes} minutes'`,
      [email.toLowerCase()]
    );

    return parseInt(result[0]?.count || '0', 10);
  } catch (error) {
    console.error('Error getting failed login attempts:', error);
    return 0;
  }
}

/**
 * Lock an account after too many failed attempts
 */
export async function lockAccount(
  email: string,
  userId: string | null,
  reason?: string
): Promise<void> {
  try {
    const lockoutMinutes = failedLoginConfig.lockoutDurationMinutes;

    await query(
      `INSERT INTO account_lockouts (user_id, email, locked_at, unlock_at, reason, is_active)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '${lockoutMinutes} minutes', $3, TRUE)`,
      [userId, email.toLowerCase(), reason || 'Too many failed login attempts']
    );

    console.warn(
      `Account locked - Email: ${email}, Duration: ${lockoutMinutes} minutes, Reason: ${reason || 'Too many failed login attempts'}`
    );
  } catch (error) {
    console.error('Error locking account:', error);
  }
}

/**
 * Clear failed login attempts for a user (called after successful login)
 */
export async function clearFailedAttempts(email: string): Promise<void> {
  try {
    await query(
      'DELETE FROM failed_login_attempts WHERE email = $1',
      [email.toLowerCase()]
    );
  } catch (error) {
    console.error('Error clearing failed login attempts:', error);
  }
}

/**
 * Manually unlock an account (admin function)
 */
export async function unlockAccount(email: string): Promise<void> {
  try {
    await query(
      `UPDATE account_lockouts
       SET is_active = FALSE
       WHERE email = $1 AND is_active = TRUE`,
      [email.toLowerCase()]
    );

    // Also clear failed attempts
    await clearFailedAttempts(email);

    console.log(`Account manually unlocked - Email: ${email}`);
  } catch (error) {
    console.error('Error unlocking account:', error);
    throw error;
  }
}

/**
 * Clean up old failed login attempts
 */
export async function cleanupOldFailedAttempts(): Promise<void> {
  try {
    const hours = failedLoginConfig.cleanupIntervalHours;

    const result = await query(
      `DELETE FROM failed_login_attempts
       WHERE attempt_time < NOW() - INTERVAL '${hours} hours'`
    );

    console.log(`Cleaned up old failed login attempts (older than ${hours} hours)`);
  } catch (error) {
    console.error('Error cleaning up old failed attempts:', error);
  }
}

/**
 * Clean up expired account lockouts
 */
export async function cleanupExpiredLockouts(): Promise<void> {
  try {
    await query(
      `UPDATE account_lockouts
       SET is_active = FALSE
       WHERE unlock_at < NOW() AND is_active = TRUE`
    );
  } catch (error) {
    console.error('Error cleaning up expired lockouts:', error);
  }
}

/**
 * Middleware to check if account is locked before processing login
 */
export async function checkAccountLockout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      next();
      return;
    }

    const lockStatus = await isAccountLocked(email);

    if (lockStatus.locked) {
      res.status(423).json({
        success: false,
        error: 'Account locked',
        message: `Account temporarily locked due to too many failed login attempts. Please try again in ${lockStatus.remainingMinutes} minute(s).`,
        unlockAt: lockStatus.unlockAt,
        remainingMinutes: lockStatus.remainingMinutes,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in checkAccountLockout middleware:', error);
    // Fail open - allow request to proceed if there's an error
    next();
  }
}

/**
 * Middleware to handle failed login attempt tracking
 * Should be called after login validation but before success response
 */
export async function handleFailedLogin(
  email: string,
  userId: string | null,
  req: Request
): Promise<void> {
  // Record the failed attempt
  await recordFailedLogin(email, userId, req);

  // Check if we should lock the account
  const attemptCount = await getRecentFailedAttempts(email);
  const maxAttempts = failedLoginConfig.maxAttempts;

  if (attemptCount >= maxAttempts) {
    await lockAccount(email, userId);
  }
}

/**
 * Middleware to clear failed attempts after successful login
 */
export async function handleSuccessfulLogin(email: string): Promise<void> {
  await clearFailedAttempts(email);
}

/**
 * Get account lockout statistics (for admin/monitoring)
 */
export async function getLockoutStats(): Promise<{
  totalLockouts: number;
  activeLockouts: number;
  recentAttempts24h: number;
}> {
  try {
    const [lockouts, active, attempts] = await Promise.all([
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM account_lockouts'
      ),
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM account_lockouts WHERE is_active = TRUE'
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM failed_login_attempts
         WHERE attempt_time > NOW() - INTERVAL '24 hours'`
      ),
    ]);

    return {
      totalLockouts: parseInt(lockouts[0]?.count || '0', 10),
      activeLockouts: parseInt(active[0]?.count || '0', 10),
      recentAttempts24h: parseInt(attempts[0]?.count || '0', 10),
    };
  } catch (error) {
    console.error('Error getting lockout stats:', error);
    return {
      totalLockouts: 0,
      activeLockouts: 0,
      recentAttempts24h: 0,
    };
  }
}

/**
 * Get failed login history for a user (for admin/support)
 */
export async function getFailedLoginHistory(
  email: string,
  limit: number = 10
): Promise<FailedLoginAttempt[]> {
  try {
    const attempts = await query<FailedLoginAttempt>(
      `SELECT * FROM failed_login_attempts
       WHERE email = $1
       ORDER BY attempt_time DESC
       LIMIT $2`,
      [email.toLowerCase(), limit]
    );

    return attempts;
  } catch (error) {
    console.error('Error getting failed login history:', error);
    return [];
  }
}

/**
 * Get lockout history for a user (for admin/support)
 */
export async function getLockoutHistory(
  email: string,
  limit: number = 10
): Promise<AccountLockout[]> {
  try {
    const lockouts = await query<AccountLockout>(
      `SELECT * FROM account_lockouts
       WHERE email = $1
       ORDER BY locked_at DESC
       LIMIT $2`,
      [email.toLowerCase(), limit]
    );

    return lockouts;
  } catch (error) {
    console.error('Error getting lockout history:', error);
    return [];
  }
}

export default {
  isAccountLocked,
  recordFailedLogin,
  getRecentFailedAttempts,
  lockAccount,
  clearFailedAttempts,
  unlockAccount,
  cleanupOldFailedAttempts,
  cleanupExpiredLockouts,
  checkAccountLockout,
  handleFailedLogin,
  handleSuccessfulLogin,
  getLockoutStats,
  getFailedLoginHistory,
  getLockoutHistory,
};
