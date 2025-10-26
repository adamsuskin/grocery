import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken, extractTokenFromHeader } from './utils';

/**
 * Middleware to authenticate JWT tokens
 * Verifies the JWT token in the Authorization header and attaches user info to request
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No token provided',
      });
      return;
    }

    // Verify and decode the token
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid token';
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: errorMessage,
      });
      return;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error processing authentication',
    });
    return;
  }
}

/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't fail if no token is provided
 * Useful for endpoints that have different behavior for authenticated vs anonymous users
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid, but we don't fail - just proceed without user
        console.log('Optional auth: Invalid token provided');
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even on error
  }
}

/**
 * Middleware to check if user is authenticated
 * Simpler version that just checks if req.user exists
 * Use this after authenticateToken middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }
  next();
}

/**
 * Middleware to validate request body contains required fields
 * @param requiredFields - Array of required field names
 * @returns Express middleware function
 */
export function validateRequiredFields(requiredFields: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter(
      (field) => !req.body || req.body[field] === undefined || req.body[field] === ''
    );

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        details: { missingFields },
      });
      return;
    }

    next();
  };
}

/**
 * Error handling middleware for authentication errors
 * Should be added after all routes
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function authErrorHandler(
  err: Error,
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  console.error('Auth error:', err);

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: err.message,
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      message: 'Your session has expired. Please login again.',
    });
    return;
  }

  // Pass to next error handler if not auth-related
  next(err);
}
