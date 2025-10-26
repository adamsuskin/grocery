/**
 * NotificationPrompt Component
 *
 * Displays a user-friendly prompt to request notification permissions.
 * Features:
 * - Explains the benefits of enabling notifications
 * - "Allow" and "Not now" buttons
 * - Remembers user choice in localStorage
 * - Only shows at appropriate times (not on first visit)
 * - Non-intrusive banner design
 *
 * ## Usage
 * ```tsx
 * import { NotificationPrompt } from './components/NotificationPrompt';
 *
 * function App() {
 *   return (
 *     <div>
 *       <NotificationPrompt />
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import {
  isPushNotificationSupported,
  hasNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
} from '../utils/pushNotifications';
import './NotificationPrompt.css';

// LocalStorage keys
const STORAGE_KEY_DISMISSED = 'notificationPromptDismissed';
const STORAGE_KEY_FIRST_VISIT = 'firstVisitTimestamp';
const STORAGE_KEY_DISMISS_COUNT = 'notificationPromptDismissCount';

// Wait time before showing prompt (in milliseconds)
const WAIT_TIME_FIRST_VISIT = 2 * 60 * 1000; // 2 minutes after first visit
const WAIT_TIME_BETWEEN_PROMPTS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_DISMISS_COUNT = 3; // Stop showing after 3 dismissals

export interface NotificationPromptProps {
  /**
   * Custom callback when notifications are enabled
   */
  onEnabled?: () => void;

  /**
   * Custom callback when prompt is dismissed
   */
  onDismissed?: () => void;

  /**
   * Force show the prompt (ignores localStorage checks)
   */
  forceShow?: boolean;
}

export function NotificationPrompt({
  onEnabled,
  onDismissed,
  forceShow = false,
}: NotificationPromptProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we should show the prompt
    if (forceShow) {
      setVisible(true);
      return;
    }

    // Don't show if notifications aren't supported
    if (!isPushNotificationSupported()) {
      return;
    }

    // Don't show if user already has permission
    if (hasNotificationPermission()) {
      return;
    }

    // Don't show if permission was explicitly denied
    if (Notification.permission === 'denied') {
      return;
    }

    // Check if user has dismissed too many times
    const dismissCount = parseInt(localStorage.getItem(STORAGE_KEY_DISMISS_COUNT) || '0', 10);
    if (dismissCount >= MAX_DISMISS_COUNT) {
      return;
    }

    // Check when prompt was last dismissed
    const lastDismissed = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      const timeSinceDismiss = Date.now() - dismissedTime;

      // Don't show if dismissed recently
      if (timeSinceDismiss < WAIT_TIME_BETWEEN_PROMPTS) {
        return;
      }
    }

    // Check if this is a new user
    let firstVisit = localStorage.getItem(STORAGE_KEY_FIRST_VISIT);
    if (!firstVisit) {
      // First time user - record timestamp and don't show yet
      localStorage.setItem(STORAGE_KEY_FIRST_VISIT, Date.now().toString());
      return;
    }

    // Check if enough time has passed since first visit
    const firstVisitTime = parseInt(firstVisit, 10);
    const timeSinceFirstVisit = Date.now() - firstVisitTime;

    if (timeSinceFirstVisit >= WAIT_TIME_FIRST_VISIT) {
      // Show the prompt
      setVisible(true);
    }
  }, [forceShow]);

  const handleAllow = async () => {
    setLoading(true);
    setError(null);

    try {
      // Request permission
      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        // Subscribe to push notifications
        await subscribeToPushNotifications();

        // Clear dismiss tracking since user enabled
        localStorage.removeItem(STORAGE_KEY_DISMISSED);
        localStorage.removeItem(STORAGE_KEY_DISMISS_COUNT);

        // Hide the prompt
        setVisible(false);

        // Call callback
        if (onEnabled) {
          onEnabled();
        }
      } else if (permission === 'denied') {
        setError('Notification permission was denied. You can enable it later in your browser settings.');
        // Still hide the prompt after a delay
        setTimeout(() => {
          setVisible(false);
        }, 3000);
      } else {
        setError('Permission request was cancelled.');
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
      setError('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // Record dismissal
    localStorage.setItem(STORAGE_KEY_DISMISSED, Date.now().toString());

    // Increment dismiss count
    const currentCount = parseInt(localStorage.getItem(STORAGE_KEY_DISMISS_COUNT) || '0', 10);
    localStorage.setItem(STORAGE_KEY_DISMISS_COUNT, (currentCount + 1).toString());

    // Hide the prompt
    setVisible(false);

    // Call callback
    if (onDismissed) {
      onDismissed();
    }
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  return (
    <div className="notification-prompt-overlay">
      <div className="notification-prompt" role="dialog" aria-labelledby="notification-prompt-title">
        <div className="notification-prompt-icon">
          <span className="notification-icon-bell">🔔</span>
        </div>

        <div className="notification-prompt-content">
          <h3 id="notification-prompt-title" className="notification-prompt-title">
            Stay Updated with Notifications
          </h3>

          <p className="notification-prompt-description">
            Get instant notifications when:
          </p>

          <ul className="notification-prompt-benefits">
            <li>Someone adds or edits items in your shared lists</li>
            <li>You're invited to collaborate on a list</li>
            <li>You're approaching or over budget</li>
            <li>A sync conflict needs your attention</li>
          </ul>

          {error && (
            <div className="notification-prompt-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="notification-prompt-actions">
          <button
            className="notification-prompt-button notification-prompt-button-primary"
            onClick={handleAllow}
            disabled={loading}
          >
            {loading ? 'Enabling...' : 'Allow Notifications'}
          </button>

          <button
            className="notification-prompt-button notification-prompt-button-secondary"
            onClick={handleDismiss}
            disabled={loading}
          >
            Not Now
          </button>
        </div>

        <button
          className="notification-prompt-close"
          onClick={handleDismiss}
          aria-label="Close notification prompt"
          disabled={loading}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Hook to manually trigger the notification prompt
 * Useful for showing the prompt from settings or other UI
 */
export function useNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const trigger = () => {
    setShowPrompt(true);
  };

  const reset = () => {
    setShowPrompt(false);
  };

  return {
    showPrompt,
    trigger,
    reset,
  };
}
