/**
 * Comprehensive Authentication Error Handling
 *
 * This module provides:
 * - Centralized error handling for all authentication scenarios
 * - User-friendly error messages
 * - Error recovery strategies
 * - Error categorization and mapping
 * - Automatic retry logic
 * - Toast/notification integration
 *
 * @module utils/authErrors
 */

import { AuthError, AuthErrorType, clearAuthData } from './auth';

// =============================================================================
// ERROR MESSAGE MAPPINGS
// =============================================================================

/**
 * User-friendly error messages for each error type
 * These messages are safe to display to end users
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  [AuthErrorType.INVALID_TOKEN]: 'Your session is invalid. Please sign in again.',
  [AuthErrorType.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AuthErrorType.REFRESH_FAILED]: 'Unable to refresh your session. Please sign in again.',
  [AuthErrorType.UNAUTHORIZED]: 'Invalid email or password. Please try again.',
  [AuthErrorType.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [AuthErrorType.STORAGE_ERROR]: 'Unable to save authentication data. Please check your browser settings.',
  [AuthErrorType.VALIDATION_ERROR]: 'Invalid input. Please check your information and try again.',
  [AuthErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * HTTP status code to error type mapping
 */
export const STATUS_CODE_ERROR_MAP: Record<number, AuthErrorType> = {
  400: AuthErrorType.VALIDATION_ERROR,
  401: AuthErrorType.UNAUTHORIZED,
  403: AuthErrorType.UNAUTHORIZED,
  404: AuthErrorType.VALIDATION_ERROR,
  408: AuthErrorType.NETWORK_ERROR,
  429: AuthErrorType.NETWORK_ERROR, // Rate limiting
  500: AuthErrorType.NETWORK_ERROR,
  502: AuthErrorType.NETWORK_ERROR,
  503: AuthErrorType.NETWORK_ERROR,
  504: AuthErrorType.NETWORK_ERROR,
};

/**
 * Detailed error messages for specific scenarios
 */
export const DETAILED_ERROR_MESSAGES = {
  // Network errors
  NETWORK_OFFLINE: 'You appear to be offline. Please check your internet connection.',
  NETWORK_TIMEOUT: 'Request timed out. Please check your connection and try again.',
  NETWORK_CONNECTION_REFUSED: 'Unable to connect to the server. Please try again later.',

  // Authentication errors
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect.',
  ACCOUNT_NOT_FOUND: 'No account found with this email address.',
  ACCOUNT_DISABLED: 'This account has been disabled. Please contact support.',
  ACCOUNT_LOCKED: 'Too many failed login attempts. Please try again later.',

  // Token errors
  TOKEN_INVALID: 'Your session is invalid. Please sign in again.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  TOKEN_REFRESH_FAILED: 'Unable to refresh your session. Please sign in again.',

  // Validation errors
  EMAIL_INVALID: 'Please enter a valid email address.',
  EMAIL_REQUIRED: 'Email is required.',
  EMAIL_TAKEN: 'An account with this email already exists.',
  PASSWORD_REQUIRED: 'Password is required.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORD_TOO_WEAK: 'Password must include uppercase, lowercase, numbers, and special characters.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  NAME_REQUIRED: 'Name is required.',

  // Server errors
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  MAINTENANCE_MODE: 'The service is under maintenance. Please check back soon.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',

  // Permission errors
  FORBIDDEN: 'You do not have permission to perform this action.',
  UNAUTHORIZED_ACCESS: 'Please sign in to access this feature.',
} as const;

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  RETRY = 'retry', // User can retry the operation
  REFRESH_TOKEN = 'refresh_token', // Attempt to refresh the token
  RELOGIN = 'relogin', // User must log in again
  CONTACT_SUPPORT = 'contact_support', // User should contact support
  CHECK_CONNECTION = 'check_connection', // User should check their connection
  WAIT_AND_RETRY = 'wait_and_retry', // Wait a moment before retrying
  NONE = 'none', // No recovery action available
}

/**
 * Complete error information with context and recovery options
 */
export interface AuthErrorInfo {
  // Core error data
  type: AuthErrorType;
  message: string; // User-friendly message
  technicalMessage?: string; // Technical details for logging
  statusCode?: number;

  // Classification
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;

  // User guidance
  userAction?: string; // Suggested action for the user
  retryable: boolean; // Can this error be retried?

  // Additional context
  timestamp: number;
  originalError?: unknown;
}

/**
 * Classifies an error and provides recovery information
 */
export function classifyAuthError(error: unknown): AuthErrorInfo {
  const timestamp = Date.now();

  // Handle AuthError instances
  if (error instanceof AuthError) {
    const { type, message, statusCode, originalError } = error;

    switch (type) {
      case AuthErrorType.TOKEN_EXPIRED:
        return {
          type,
          message: AUTH_ERROR_MESSAGES[type],
          technicalMessage: message,
          statusCode,
          severity: ErrorSeverity.WARNING,
          recoveryStrategy: RecoveryStrategy.RELOGIN,
          userAction: 'Please sign in again to continue.',
          retryable: false,
          timestamp,
          originalError,
        };

      case AuthErrorType.INVALID_TOKEN:
        return {
          type,
          message: AUTH_ERROR_MESSAGES[type],
          technicalMessage: message,
          statusCode,
          severity: ErrorSeverity.ERROR,
          recoveryStrategy: RecoveryStrategy.RELOGIN,
          userAction: 'Please sign in again.',
          retryable: false,
          timestamp,
          originalError,
        };

      case AuthErrorType.REFRESH_FAILED:
        return {
          type,
          message: AUTH_ERROR_MESSAGES[type],
          technicalMessage: message,
          statusCode,
          severity: ErrorSeverity.ERROR,
          recoveryStrategy: RecoveryStrategy.RELOGIN,
          userAction: 'Your session could not be refreshed. Please sign in again.',
          retryable: false,
          timestamp,
          originalError,
        };

      case AuthErrorType.UNAUTHORIZED:
        return {
          type,
          message: getDetailedUnauthorizedMessage(message),
          technicalMessage: message,
          statusCode: statusCode || 401,
          severity: ErrorSeverity.WARNING,
          recoveryStrategy: RecoveryStrategy.RETRY,
          userAction: 'Please check your credentials and try again.',
          retryable: true,
          timestamp,
          originalError,
        };

      case AuthErrorType.NETWORK_ERROR:
        return {
          type,
          message: getDetailedNetworkMessage(message, statusCode),
          technicalMessage: message,
          statusCode,
          severity: statusCode && statusCode >= 500 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
          recoveryStrategy: statusCode === 429 ? RecoveryStrategy.WAIT_AND_RETRY : RecoveryStrategy.CHECK_CONNECTION,
          userAction: statusCode === 429
            ? 'Please wait a moment before trying again.'
            : 'Please check your connection and try again.',
          retryable: true,
          timestamp,
          originalError,
        };

      case AuthErrorType.VALIDATION_ERROR:
        return {
          type,
          message: getDetailedValidationMessage(message),
          technicalMessage: message,
          statusCode: statusCode || 400,
          severity: ErrorSeverity.WARNING,
          recoveryStrategy: RecoveryStrategy.RETRY,
          userAction: 'Please check your input and try again.',
          retryable: true,
          timestamp,
          originalError,
        };

      case AuthErrorType.STORAGE_ERROR:
        return {
          type,
          message: AUTH_ERROR_MESSAGES[type],
          technicalMessage: message,
          statusCode,
          severity: ErrorSeverity.ERROR,
          recoveryStrategy: RecoveryStrategy.CONTACT_SUPPORT,
          userAction: 'Please check your browser settings or try a different browser.',
          retryable: false,
          timestamp,
          originalError,
        };

      default:
        return {
          type,
          message: AUTH_ERROR_MESSAGES[type] || 'An error occurred',
          technicalMessage: message,
          statusCode,
          severity: ErrorSeverity.ERROR,
          recoveryStrategy: RecoveryStrategy.RETRY,
          userAction: 'Please try again.',
          retryable: true,
          timestamp,
          originalError,
        };
    }
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return {
        type: AuthErrorType.NETWORK_ERROR,
        message: DETAILED_ERROR_MESSAGES.NETWORK_TIMEOUT,
        technicalMessage: error.message,
        severity: ErrorSeverity.WARNING,
        recoveryStrategy: RecoveryStrategy.CHECK_CONNECTION,
        userAction: 'Please check your connection and try again.',
        retryable: true,
        timestamp,
        originalError: error,
      };
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('abort')) {
      return {
        type: AuthErrorType.NETWORK_ERROR,
        message: DETAILED_ERROR_MESSAGES.NETWORK_TIMEOUT,
        technicalMessage: error.message,
        severity: ErrorSeverity.WARNING,
        recoveryStrategy: RecoveryStrategy.RETRY,
        userAction: 'The request timed out. Please try again.',
        retryable: true,
        timestamp,
        originalError: error,
      };
    }

    // Generic error
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: 'An unexpected error occurred. Please try again.',
      technicalMessage: error.message,
      severity: ErrorSeverity.ERROR,
      recoveryStrategy: RecoveryStrategy.RETRY,
      userAction: 'Please try again or contact support if the problem persists.',
      retryable: true,
      timestamp,
      originalError: error,
    };
  }

  // Unknown error type
  return {
    type: AuthErrorType.UNKNOWN_ERROR,
    message: 'An unexpected error occurred.',
    technicalMessage: String(error),
    severity: ErrorSeverity.ERROR,
    recoveryStrategy: RecoveryStrategy.RETRY,
    userAction: 'Please try again.',
    retryable: true,
    timestamp,
    originalError: error,
  };
}

// =============================================================================
// DETAILED MESSAGE HELPERS
// =============================================================================

/**
 * Gets a detailed message for unauthorized errors
 */
function getDetailedUnauthorizedMessage(technicalMessage: string): string {
  const msg = technicalMessage.toLowerCase();

  if (msg.includes('invalid credentials') || msg.includes('incorrect')) {
    return DETAILED_ERROR_MESSAGES.INVALID_CREDENTIALS;
  }
  if (msg.includes('not found') || msg.includes('no account')) {
    return DETAILED_ERROR_MESSAGES.ACCOUNT_NOT_FOUND;
  }
  if (msg.includes('disabled')) {
    return DETAILED_ERROR_MESSAGES.ACCOUNT_DISABLED;
  }
  if (msg.includes('locked') || msg.includes('too many attempts')) {
    return DETAILED_ERROR_MESSAGES.ACCOUNT_LOCKED;
  }

  return AUTH_ERROR_MESSAGES[AuthErrorType.UNAUTHORIZED];
}

/**
 * Gets a detailed message for network errors
 */
function getDetailedNetworkMessage(technicalMessage: string, statusCode?: number): string {
  if (statusCode === 429) {
    return DETAILED_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  }
  if (statusCode === 503) {
    return DETAILED_ERROR_MESSAGES.SERVICE_UNAVAILABLE;
  }
  if (statusCode && statusCode >= 500) {
    return DETAILED_ERROR_MESSAGES.SERVER_ERROR;
  }

  const msg = technicalMessage.toLowerCase();

  if (msg.includes('offline') || msg.includes('no connection')) {
    return DETAILED_ERROR_MESSAGES.NETWORK_OFFLINE;
  }
  if (msg.includes('timeout')) {
    return DETAILED_ERROR_MESSAGES.NETWORK_TIMEOUT;
  }
  if (msg.includes('refused')) {
    return DETAILED_ERROR_MESSAGES.NETWORK_CONNECTION_REFUSED;
  }

  return AUTH_ERROR_MESSAGES[AuthErrorType.NETWORK_ERROR];
}

/**
 * Gets a detailed message for validation errors
 */
function getDetailedValidationMessage(technicalMessage: string): string {
  const msg = technicalMessage.toLowerCase();

  if (msg.includes('email')) {
    if (msg.includes('required')) return DETAILED_ERROR_MESSAGES.EMAIL_REQUIRED;
    if (msg.includes('invalid')) return DETAILED_ERROR_MESSAGES.EMAIL_INVALID;
    if (msg.includes('taken') || msg.includes('exists')) return DETAILED_ERROR_MESSAGES.EMAIL_TAKEN;
  }

  if (msg.includes('password')) {
    if (msg.includes('required')) return DETAILED_ERROR_MESSAGES.PASSWORD_REQUIRED;
    if (msg.includes('short') || msg.includes('length')) return DETAILED_ERROR_MESSAGES.PASSWORD_TOO_SHORT;
    if (msg.includes('weak') || msg.includes('strength')) return DETAILED_ERROR_MESSAGES.PASSWORD_TOO_WEAK;
    if (msg.includes('match')) return DETAILED_ERROR_MESSAGES.PASSWORD_MISMATCH;
  }

  if (msg.includes('name') && msg.includes('required')) {
    return DETAILED_ERROR_MESSAGES.NAME_REQUIRED;
  }

  return technicalMessage || AUTH_ERROR_MESSAGES[AuthErrorType.VALIDATION_ERROR];
}

// =============================================================================
// ERROR HANDLING STRATEGIES
// =============================================================================

/**
 * Options for error handling
 */
export interface HandleAuthErrorOptions {
  // Automatic actions
  clearAuthOnUnauthorized?: boolean; // Clear auth data on 401/403
  clearAuthOnExpired?: boolean; // Clear auth data on expired token
  redirectToLogin?: boolean; // Redirect to login page

  // Logging
  logToConsole?: boolean; // Log error to console
  logToServer?: boolean; // Send error to logging service

  // User notification
  showToast?: boolean; // Show error in toast notification
  toastDuration?: number; // Toast display duration in ms

  // Recovery
  autoRetry?: boolean; // Automatically retry the operation
  maxRetries?: number; // Maximum retry attempts
  retryDelay?: number; // Delay between retries in ms

  // Custom handlers
  onError?: (errorInfo: AuthErrorInfo) => void; // Custom error handler
  onRecovery?: (strategy: RecoveryStrategy) => void; // Recovery strategy handler
}

/**
 * Default error handling options
 */
export const DEFAULT_ERROR_OPTIONS: HandleAuthErrorOptions = {
  clearAuthOnUnauthorized: true,
  clearAuthOnExpired: true,
  redirectToLogin: false,
  logToConsole: true,
  logToServer: false,
  showToast: false,
  toastDuration: 5000,
  autoRetry: false,
  maxRetries: 0,
  retryDelay: 1000,
};

/**
 * Handles authentication errors with configurable strategies
 *
 * @param error - The error to handle
 * @param options - Error handling options
 * @returns Error information object
 *
 * @example
 * ```typescript
 * try {
 *   await login(credentials);
 * } catch (error) {
 *   const errorInfo = handleAuthError(error, {
 *     clearAuthOnUnauthorized: true,
 *     showToast: true,
 *     logToConsole: true,
 *     onError: (info) => {
 *       // Custom handling
 *       analytics.trackError(info);
 *     },
 *   });
 *
 *   // Display error to user
 *   setErrorMessage(errorInfo.message);
 * }
 * ```
 */
export function handleAuthError(
  error: unknown,
  options: HandleAuthErrorOptions = {}
): AuthErrorInfo {
  const opts = { ...DEFAULT_ERROR_OPTIONS, ...options };
  const errorInfo = classifyAuthError(error);

  // Log to console
  if (opts.logToConsole) {
    console.error('[Auth Error]', {
      type: errorInfo.type,
      message: errorInfo.message,
      technicalMessage: errorInfo.technicalMessage,
      severity: errorInfo.severity,
      recoveryStrategy: errorInfo.recoveryStrategy,
      statusCode: errorInfo.statusCode,
      timestamp: new Date(errorInfo.timestamp).toISOString(),
    });

    if (errorInfo.originalError) {
      console.error('[Original Error]', errorInfo.originalError);
    }
  }

  // Log to server (if configured)
  if (opts.logToServer) {
    logErrorToServer(errorInfo).catch(err => {
      console.warn('Failed to log error to server:', err);
    });
  }

  // Clear auth data if needed
  if (opts.clearAuthOnUnauthorized &&
      (errorInfo.type === AuthErrorType.UNAUTHORIZED || errorInfo.statusCode === 401 || errorInfo.statusCode === 403)) {
    clearAuthData();
  }

  if (opts.clearAuthOnExpired && errorInfo.type === AuthErrorType.TOKEN_EXPIRED) {
    clearAuthData();
  }

  // Call custom error handler
  if (opts.onError) {
    try {
      opts.onError(errorInfo);
    } catch (handlerError) {
      console.error('Error in custom error handler:', handlerError);
    }
  }

  // Call recovery handler
  if (opts.onRecovery && errorInfo.recoveryStrategy !== RecoveryStrategy.NONE) {
    try {
      opts.onRecovery(errorInfo.recoveryStrategy);
    } catch (handlerError) {
      console.error('Error in recovery handler:', handlerError);
    }
  }

  return errorInfo;
}

/**
 * Logs error to server-side logging service
 */
async function logErrorToServer(errorInfo: AuthErrorInfo): Promise<void> {
  try {
    // In a real application, this would send to your logging service
    // For now, we'll just create a placeholder
    const logData = {
      type: errorInfo.type,
      message: errorInfo.technicalMessage || errorInfo.message,
      severity: errorInfo.severity,
      statusCode: errorInfo.statusCode,
      timestamp: errorInfo.timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Example: await fetch('/api/logs/error', { method: 'POST', body: JSON.stringify(logData) });
    console.debug('[Would log to server]', logData);
  } catch (error) {
    console.warn('Failed to log error to server:', error);
  }
}

// =============================================================================
// ERROR DISPLAY HELPERS
// =============================================================================

/**
 * Formats an error for display in a form
 * Returns a simple, user-friendly message
 */
export function formatErrorForDisplay(error: unknown): string {
  const errorInfo = classifyAuthError(error);
  return errorInfo.message;
}

/**
 * Gets error details for debugging
 * Returns technical information (not for display to end users)
 */
export function getErrorDetails(error: unknown): {
  message: string;
  type: string;
  statusCode?: number;
  stack?: string;
} {
  if (error instanceof AuthError) {
    return {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.name,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
    type: 'Unknown',
  };
}

/**
 * Checks if an error should trigger a redirect to login
 */
export function shouldRedirectToLogin(error: unknown): boolean {
  const errorInfo = classifyAuthError(error);
  return errorInfo.recoveryStrategy === RecoveryStrategy.RELOGIN;
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorInfo = classifyAuthError(error);
  return errorInfo.retryable;
}

/**
 * Gets the appropriate recovery action for an error
 */
export function getRecoveryAction(error: unknown): RecoveryStrategy {
  const errorInfo = classifyAuthError(error);
  return errorInfo.recoveryStrategy;
}

// =============================================================================
// ERROR BOUNDARY HELPERS
// =============================================================================

/**
 * Error information for React Error Boundaries
 */
export interface ErrorBoundaryInfo {
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Converts an auth error to error boundary info
 */
export function toErrorBoundaryInfo(error: unknown): ErrorBoundaryInfo {
  const errorInfo = classifyAuthError(error);

  const info: ErrorBoundaryInfo = {
    title: getSeverityTitle(errorInfo.severity),
    message: errorInfo.message,
  };

  // Add recovery action if available
  switch (errorInfo.recoveryStrategy) {
    case RecoveryStrategy.RETRY:
      info.action = {
        label: 'Try Again',
        handler: () => window.location.reload(),
      };
      break;

    case RecoveryStrategy.RELOGIN:
      info.action = {
        label: 'Sign In',
        handler: () => {
          clearAuthData();
          window.location.href = '/login';
        },
      };
      break;

    case RecoveryStrategy.CHECK_CONNECTION:
      info.action = {
        label: 'Retry',
        handler: () => window.location.reload(),
      };
      break;

    case RecoveryStrategy.WAIT_AND_RETRY:
      info.action = {
        label: 'Try Again',
        handler: () => {
          setTimeout(() => window.location.reload(), 2000);
        },
      };
      break;
  }

  return info;
}

/**
 * Gets a title based on error severity
 */
function getSeverityTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'Information';
    case ErrorSeverity.WARNING:
      return 'Warning';
    case ErrorSeverity.ERROR:
      return 'Error';
    case ErrorSeverity.CRITICAL:
      return 'Critical Error';
    default:
      return 'Error';
  }
}

// =============================================================================
// VALIDATION ERROR HELPERS
// =============================================================================

/**
 * Validation error details for form fields
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Extracts field-level validation errors from an error
 * Useful for displaying errors next to form fields
 */
export function extractValidationErrors(error: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (error instanceof AuthError && error.type === AuthErrorType.VALIDATION_ERROR) {
    const message = error.message.toLowerCase();

    // Email errors
    if (message.includes('email')) {
      errors.push({ field: 'email', message: error.message });
    }

    // Password errors
    if (message.includes('password')) {
      errors.push({ field: 'password', message: error.message });
    }

    // Name errors
    if (message.includes('name')) {
      errors.push({ field: 'name', message: error.message });
    }

    // If no specific field detected, treat as general error
    if (errors.length === 0) {
      errors.push({ field: 'general', message: error.message });
    }
  }

  return errors;
}

/**
 * Groups validation errors by field
 */
export function groupValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  errors.forEach(error => {
    if (!grouped[error.field]) {
      grouped[error.field] = [];
    }
    grouped[error.field].push(error.message);
  });

  return grouped;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  AuthError,
  AuthErrorType,
} from './auth';
