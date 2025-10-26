/**
 * Error Display Component
 *
 * Provides various error display components for authentication errors:
 * - ErrorBanner: Full-width banner for important errors
 * - ErrorToast: Temporary notification that auto-dismisses
 * - ErrorAlert: Inline alert with optional actions
 * - FieldError: Small error message for form fields
 *
 * @module components/ErrorDisplay
 */

import { ReactNode, useEffect, useState } from 'react';
import {
  ErrorSeverity,
  RecoveryStrategy,
  classifyAuthError,
  formatErrorForDisplay,
  toErrorBoundaryInfo,
} from '../utils/authErrors';
import './ErrorDisplay.css';

// =============================================================================
// ERROR BANNER
// =============================================================================

export interface ErrorBannerProps {
  error?: unknown;
  message?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

/**
 * Full-width error banner for displaying prominent errors
 * Typically shown at the top of forms or pages
 */
export function ErrorBanner({
  error,
  message,
  onClose,
  showCloseButton = true,
  className = '',
}: ErrorBannerProps) {
  if (!error && !message) return null;

  const displayMessage = message || (error ? formatErrorForDisplay(error) : '');
  const errorInfo = error ? classifyAuthError(error) : null;

  const severityClass = errorInfo
    ? `error-banner-${errorInfo.severity}`
    : 'error-banner-error';

  return (
    <div
      className={`error-banner ${severityClass} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="error-banner-icon">
        {getIconForSeverity(errorInfo?.severity || ErrorSeverity.ERROR)}
      </div>

      <div className="error-banner-content">
        <div className="error-banner-message">{displayMessage}</div>

        {errorInfo?.userAction && (
          <div className="error-banner-action">{errorInfo.userAction}</div>
        )}
      </div>

      {showCloseButton && onClose && (
        <button
          type="button"
          className="error-banner-close"
          onClick={onClose}
          aria-label="Close error message"
        >
          ×
        </button>
      )}
    </div>
  );
}

// =============================================================================
// ERROR TOAST
// =============================================================================

export interface ErrorToastProps {
  error?: unknown;
  message?: string;
  duration?: number; // Auto-dismiss after duration (ms)
  onClose?: () => void;
  position?: 'top' | 'bottom' | 'top-right' | 'bottom-right';
}

/**
 * Temporary error notification that auto-dismisses
 * Appears as a floating toast message
 */
export function ErrorToast({
  error,
  message,
  duration = 5000,
  onClose,
  position = 'top-right',
}: ErrorToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) {
          onClose();
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible || (!error && !message)) return null;

  const displayMessage = message || (error ? formatErrorForDisplay(error) : '');
  const errorInfo = error ? classifyAuthError(error) : null;

  const severityClass = errorInfo
    ? `error-toast-${errorInfo.severity}`
    : 'error-toast-error';

  return (
    <div
      className={`error-toast error-toast-${position} ${severityClass}`}
      role="alert"
      aria-live="polite"
    >
      <div className="error-toast-icon">
        {getIconForSeverity(errorInfo?.severity || ErrorSeverity.ERROR)}
      </div>

      <div className="error-toast-message">{displayMessage}</div>

      <button
        type="button"
        className="error-toast-close"
        onClick={() => {
          setVisible(false);
          if (onClose) {
            onClose();
          }
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

// =============================================================================
// ERROR ALERT
// =============================================================================

export interface ErrorAlertProps {
  error?: unknown;
  message?: string;
  title?: string;
  showIcon?: boolean;
  showRecoveryAction?: boolean;
  onRecoveryAction?: (strategy: RecoveryStrategy) => void;
  className?: string;
}

/**
 * Inline error alert with optional recovery actions
 * Can display custom title and recovery buttons
 */
export function ErrorAlert({
  error,
  message,
  title,
  showIcon = true,
  showRecoveryAction = false,
  onRecoveryAction,
  className = '',
}: ErrorAlertProps) {
  if (!error && !message) return null;

  const displayMessage = message || (error ? formatErrorForDisplay(error) : '');
  const errorInfo = error ? classifyAuthError(error) : null;
  const boundaryInfo = error ? toErrorBoundaryInfo(error) : null;

  const severityClass = errorInfo
    ? `error-alert-${errorInfo.severity}`
    : 'error-alert-error';

  const alertTitle = title || boundaryInfo?.title || 'Error';

  return (
    <div
      className={`error-alert ${severityClass} ${className}`}
      role="alert"
    >
      {showIcon && (
        <div className="error-alert-icon">
          {getIconForSeverity(errorInfo?.severity || ErrorSeverity.ERROR)}
        </div>
      )}

      <div className="error-alert-content">
        <div className="error-alert-title">{alertTitle}</div>
        <div className="error-alert-message">{displayMessage}</div>

        {errorInfo?.userAction && (
          <div className="error-alert-user-action">{errorInfo.userAction}</div>
        )}

        {showRecoveryAction && errorInfo && errorInfo.recoveryStrategy !== RecoveryStrategy.NONE && (
          <div className="error-alert-actions">
            <button
              type="button"
              className="error-alert-action-btn"
              onClick={() => {
                if (onRecoveryAction) {
                  onRecoveryAction(errorInfo.recoveryStrategy);
                } else if (boundaryInfo?.action) {
                  boundaryInfo.action.handler();
                }
              }}
            >
              {getRecoveryActionLabel(errorInfo.recoveryStrategy)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// FIELD ERROR
// =============================================================================

export interface FieldErrorProps {
  error?: string;
  show?: boolean;
  className?: string;
}

/**
 * Small error message for form fields
 * Typically displayed below input fields
 */
export function FieldError({ error, show = true, className = '' }: FieldErrorProps) {
  if (!error || !show) return null;

  return (
    <span
      className={`field-error ${className}`}
      role="alert"
      aria-live="polite"
    >
      {error}
    </span>
  );
}

// =============================================================================
// ERROR BOUNDARY FALLBACK
// =============================================================================

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

/**
 * Fallback UI for React Error Boundaries
 * Displays a full-page error state with recovery options
 */
export function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
  const boundaryInfo = toErrorBoundaryInfo(error);

  return (
    <div className="error-boundary-fallback">
      <div className="error-boundary-content">
        <div className="error-boundary-icon">
          {getIconForSeverity(ErrorSeverity.ERROR)}
        </div>

        <h1 className="error-boundary-title">{boundaryInfo.title}</h1>
        <p className="error-boundary-message">{boundaryInfo.message}</p>

        <div className="error-boundary-actions">
          {resetErrorBoundary && (
            <button
              type="button"
              className="error-boundary-btn error-boundary-btn-primary"
              onClick={resetErrorBoundary}
            >
              Try Again
            </button>
          )}

          {boundaryInfo.action && (
            <button
              type="button"
              className="error-boundary-btn error-boundary-btn-secondary"
              onClick={boundaryInfo.action.handler}
            >
              {boundaryInfo.action.label}
            </button>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="error-boundary-details">
            <summary>Error Details (Development Only)</summary>
            <pre className="error-boundary-stack">
              {error.stack || error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets icon element for error severity
 */
function getIconForSeverity(severity: ErrorSeverity): ReactNode {
  switch (severity) {
    case ErrorSeverity.INFO:
      return <span className="icon-info">ℹ️</span>;
    case ErrorSeverity.WARNING:
      return <span className="icon-warning">⚠️</span>;
    case ErrorSeverity.ERROR:
      return <span className="icon-error">❌</span>;
    case ErrorSeverity.CRITICAL:
      return <span className="icon-critical">🚨</span>;
    default:
      return <span className="icon-error">❌</span>;
  }
}

/**
 * Gets user-friendly label for recovery action
 */
function getRecoveryActionLabel(strategy: RecoveryStrategy): string {
  switch (strategy) {
    case RecoveryStrategy.RETRY:
      return 'Try Again';
    case RecoveryStrategy.REFRESH_TOKEN:
      return 'Refresh Session';
    case RecoveryStrategy.RELOGIN:
      return 'Sign In Again';
    case RecoveryStrategy.CONTACT_SUPPORT:
      return 'Contact Support';
    case RecoveryStrategy.CHECK_CONNECTION:
      return 'Check Connection';
    case RecoveryStrategy.WAIT_AND_RETRY:
      return 'Wait and Retry';
    default:
      return 'OK';
  }
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for managing error state with auto-clear
 */
export function useErrorState(autoClearDuration?: number) {
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (error && autoClearDuration) {
      const timer = setTimeout(() => {
        setError(null);
      }, autoClearDuration);

      return () => clearTimeout(timer);
    }
  }, [error, autoClearDuration]);

  const clearError = () => setError(null);

  return { error, setError, clearError };
}

/**
 * Hook for managing toast notifications
 */
export function useErrorToast() {
  const [toast, setToast] = useState<{
    error?: unknown;
    message?: string;
    visible: boolean;
  }>({ visible: false });

  const showToast = (error?: unknown, message?: string) => {
    setToast({ error, message, visible: true });
  };

  const hideToast = () => {
    setToast({ visible: false });
  };

  return { toast, showToast, hideToast };
}
