/**
 * ServiceWorkerUpdate Component
 *
 * Displays update notifications when a new version of the service worker is available.
 * Provides user controls for:
 * - Updating immediately (skipWaiting + reload)
 * - Dismissing/postponing the update
 * - Viewing installation/activation progress
 *
 * ## Features
 * - Shows banner when update is available
 * - "Update Now" button to apply update immediately
 * - "Dismiss" button to postpone update
 * - Loading states for installing/activating
 * - Auto-dismisses after successful activation
 * - Smooth animations for banner appearance
 *
 * ## Usage
 * ```tsx
 * import ServiceWorkerUpdate from './components/ServiceWorkerUpdate';
 *
 * function App() {
 *   return (
 *     <>
 *       <ServiceWorkerUpdate />
 *       {/* Rest of your app *\/}
 *     </>
 *   );
 * }
 * ```
 */
import { useState, useEffect } from 'react';
import { useServiceWorker } from '../contexts/ServiceWorkerContext';
import './ServiceWorkerUpdate.css';

export interface ServiceWorkerUpdateProps {
  /** Position of the update banner */
  position?: 'top' | 'bottom';
  /** Auto-hide delay in ms after successful update (0 to disable) */
  autoHideDelay?: number;
}

export default function ServiceWorkerUpdate({
  position = 'top',
  autoHideDelay = 3000,
}: ServiceWorkerUpdateProps) {
  const {
    updateAvailable,
    lifecycleState,
    isUpdating,
    update,
    dismissUpdate,
  } = useServiceWorker();

  const [visible, setVisible] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Show/hide banner based on update availability
  useEffect(() => {
    if (updateAvailable) {
      setVisible(true);
    }
  }, [updateAvailable]);

  // Show progress indicator when updating
  useEffect(() => {
    if (isUpdating || lifecycleState === 'installing' || lifecycleState === 'activating') {
      setShowProgress(true);
    }
  }, [isUpdating, lifecycleState]);

  // Auto-hide after successful activation
  useEffect(() => {
    if (lifecycleState === 'activated' && showProgress && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setShowProgress(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [lifecycleState, showProgress, autoHideDelay]);

  // Handle update button click
  const handleUpdate = async () => {
    setShowProgress(true);
    try {
      await update();
      // Page will reload after update
    } catch (error) {
      console.error('Update failed:', error);
      setShowProgress(false);
    }
  };

  // Handle dismiss button click
  const handleDismiss = () => {
    setVisible(false);
    dismissUpdate();
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  // Determine message based on state
  let message = 'A new version is available';
  let showActions = true;

  if (lifecycleState === 'installing') {
    message = 'Installing update...';
    showActions = false;
  } else if (lifecycleState === 'activating' || isUpdating) {
    message = 'Activating update...';
    showActions = false;
  } else if (lifecycleState === 'activated' && showProgress) {
    message = 'Update complete! Reloading...';
    showActions = false;
  }

  return (
    <div
      className={`sw-update-banner sw-update-${position}`}
      role="alert"
      aria-live="polite"
    >
      <div className="sw-update-content">
        {/* Icon */}
        <div className="sw-update-icon">
          {showProgress ? (
            <div className="sw-update-spinner" aria-hidden="true" />
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                fill="currentColor"
              />
              <path
                d="M12 6V14L16 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className="sw-update-message">
          <p className="sw-update-title">{message}</p>
          {updateAvailable && !showProgress && (
            <p className="sw-update-description">
              Update now to get the latest features and improvements.
            </p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="sw-update-actions">
            <button
              onClick={handleUpdate}
              className="sw-update-button sw-update-button-primary"
              disabled={isUpdating}
              aria-label="Update now"
            >
              Update Now
            </button>
            <button
              onClick={handleDismiss}
              className="sw-update-button sw-update-button-secondary"
              disabled={isUpdating}
              aria-label="Dismiss update notification"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {showProgress && (
          <div className="sw-update-progress">
            <div className="sw-update-progress-bar" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version of the update banner
 * Shows a smaller notification with minimal UI
 */
export function ServiceWorkerUpdateCompact({
  position = 'bottom',
}: ServiceWorkerUpdateProps) {
  const { updateAvailable, update, dismissUpdate } = useServiceWorker();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setVisible(true);
    }
  }, [updateAvailable]);

  const handleUpdate = async () => {
    try {
      await update();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    dismissUpdate();
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`sw-update-compact sw-update-${position}`}
      role="alert"
      aria-live="polite"
    >
      <span className="sw-update-compact-message">
        New version available
      </span>
      <button
        onClick={handleUpdate}
        className="sw-update-compact-button"
        aria-label="Update now"
      >
        Update
      </button>
      <button
        onClick={handleDismiss}
        className="sw-update-compact-close"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Inline update prompt
 * Can be embedded within other components
 */
export function ServiceWorkerUpdateInline() {
  const { updateAvailable, update, dismissUpdate } = useServiceWorker();

  if (!updateAvailable) {
    return null;
  }

  const handleUpdate = async () => {
    try {
      await update();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div className="sw-update-inline" role="alert">
      <div className="sw-update-inline-content">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="sw-update-inline-icon"
          aria-hidden="true"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
            fill="currentColor"
          />
          <path
            d="M12 6V14"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="17" r="1" fill="white" />
        </svg>
        <span>A new version is available.</span>
      </div>
      <div className="sw-update-inline-actions">
        <button onClick={handleUpdate} className="sw-update-inline-button">
          Update
        </button>
        <button
          onClick={dismissUpdate}
          className="sw-update-inline-button-secondary"
        >
          Later
        </button>
      </div>
    </div>
  );
}
