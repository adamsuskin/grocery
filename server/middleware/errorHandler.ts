/**
 * Centralized error handling middleware
 * Provides consistent error responses across the application
 */

import { Request, Response, NextFunction } from 'express';
import { serverConfig } from '../config/env';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  stack?: string;
  statusCode?: number;
}

/**
 * Format error response
 */
function formatErrorResponse(err: Error | AppError, includeStack: boolean = false): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: err.name || 'Error',
    message: err.message || 'An unexpected error occurred',
  };

  // Add status code for AppError instances
  if (err instanceof AppError) {
    response.statusCode = err.statusCode;
    if (err.details) {
      response.details = err.details;
    }
  }

  // Include stack trace in development
  if (includeStack && err.stack) {
    response.stack = err.stack;
  }

  return response;
}

/**
 * Main error handler middleware
 * Should be the last middleware in the chain
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  console.error('Error handler caught error:', {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    stack: serverConfig.isDevelopment ? err.stack : undefined,
  });

  // Determine status code
  let statusCode = 500;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
  }

  // Format error response
  const errorResponse = formatErrorResponse(err, serverConfig.isDevelopment);

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * Handles routes that don't exist
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new NotFoundError(
    `Route ${req.method} ${req.path} not found`,
    {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
    }
  );

  res.status(404).json(formatErrorResponse(error, false));
}

/**
 * Async handler wrapper
 * Catches errors from async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle unhandled promise rejections
 */
export function handleUnhandledRejection(): void {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, log and continue
  });
}

/**
 * Handle uncaught exceptions
 */
export function handleUncaughtException(): void {
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    // Exit gracefully
    process.exit(1);
  });
}

/**
 * Initialize error handlers
 */
export function initializeErrorHandlers(): void {
  handleUnhandledRejection();
  handleUncaughtException();
}

export default errorHandler;
