import { Component, ErrorInfo, ReactNode } from 'react';
import './ListErrorBoundary.css';

interface Props {
  children: ReactNode;
  componentName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary for list components
 * Catches React errors and displays a user-friendly fallback UI
 */
export class ListErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('Error caught by ListErrorBoundary:', {
      component: this.props.componentName || 'Unknown component',
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Optional: Send error to logging service
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Log error to external service (placeholder for future implementation)
   */
  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
    // For now, just log to console
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  /**
   * Reset error boundary state
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  /**
   * Go back to previous page
   */
  handleGoBack = (): void => {
    window.history.back();
  };

  /**
   * Reload the current page
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { componentName } = this.props;
      const { error, errorInfo } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="list-error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 className="error-title">Oops! Something went wrong</h2>

            <p className="error-message">
              {componentName
                ? `The ${componentName} encountered an error and couldn't load properly.`
                : 'This component encountered an error and couldn\'t load properly.'}
            </p>

            <div className="error-actions">
              <button onClick={this.handleReset} className="btn btn-primary">
                Try Again
              </button>
              <button onClick={this.handleGoBack} className="btn btn-secondary">
                Go Back
              </button>
              <button onClick={this.handleReload} className="btn btn-secondary">
                Reload Page
              </button>
            </div>

            {isDevelopment && error && (
              <details className="error-details">
                <summary className="error-details-summary">
                  Developer Information (Development Only)
                </summary>
                <div className="error-details-content">
                  <div className="error-section">
                    <h4>Error Message:</h4>
                    <pre className="error-pre">{error.message}</pre>
                  </div>

                  {error.stack && (
                    <div className="error-section">
                      <h4>Stack Trace:</h4>
                      <pre className="error-pre">{error.stack}</pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div className="error-section">
                      <h4>Component Stack:</h4>
                      <pre className="error-pre">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="error-help">
              <p className="error-help-text">
                If this problem persists, please try refreshing the page or contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
