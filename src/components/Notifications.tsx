/**
 * Notifications - Toast-style notification component for list sharing events
 *
 * Displays notifications in a toast-style format that:
 * - Appears in the specified corner of the screen
 * - Auto-dismisses after 5 seconds (configurable)
 * - Stacks multiple notifications
 * - Shows different icons based on notification type
 * - Allows manual dismissal by clicking the close button
 *
 * ## Usage
 * ```tsx
 * import { Notifications } from './components/Notifications';
 *
 * function App() {
 *   return (
 *     <div>
 *       <Notifications position="top-right" autoHideDuration={5000} />
 *     </div>
 *   );
 * }
 * ```
 */
import { useNotification } from '../contexts/NotificationContext';
import type { NotificationsProps, Notification, NotificationType } from '../types';
import './Notifications.css';

// Default props
const DEFAULT_POSITION = 'top-right';

// Get icon for notification type
function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'list_shared':
      return '➕';
    case 'permission_changed':
      return '🔄';
    case 'list_removed':
      return '➖';
    case 'list_updated':
      return '📝';
    default:
      return '📢';
  }
}

// Get CSS class for notification type
function getNotificationClass(type: NotificationType): string {
  switch (type) {
    case 'list_shared':
      return 'notification-success';
    case 'permission_changed':
      return 'notification-info';
    case 'list_removed':
      return 'notification-warning';
    case 'list_updated':
      return 'notification-info';
    default:
      return 'notification-default';
  }
}

// Individual notification item component
interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const icon = getNotificationIcon(notification.type);
  const className = getNotificationClass(notification.type);

  return (
    <div className={`notification-item ${className}`} role="alert">
      <div className="notification-icon">{icon}</div>
      <div className="notification-content">
        <p className="notification-message">{notification.message}</p>
        <span className="notification-time">
          {formatTime(notification.timestamp)}
        </span>
      </div>
      <button
        className="notification-close"
        onClick={() => onDismiss(notification.id)}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

// Format timestamp to relative time (e.g., "just now", "2m ago")
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 10) {
    return 'just now';
  } else if (seconds < 60) {
    return `${seconds}s ago`;
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}

// Main Notifications component
export function Notifications({
  position = DEFAULT_POSITION,
}: NotificationsProps) {
  const { notifications, dismissNotification } = useNotification();

  // Don't render if there are no notifications
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`notifications-container notifications-${position}`}>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
}
