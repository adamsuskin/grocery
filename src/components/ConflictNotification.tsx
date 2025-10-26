/**
 * ConflictNotification - Alert component for detected conflicts
 *
 * Displays conflict notifications when multiple users edit the same data offline.
 * Provides visual diff preview and resolution options for users to choose how to
 * handle the conflict.
 *
 * ## Features
 * - Visual diff preview (red for removed, green for added)
 * - Three resolution options: Use Mine, Use Theirs, Merge Manually
 * - Auto-dismiss countdown (30 seconds default)
 * - Persistent mode for critical conflicts
 * - Stacks multiple conflicts with priority ordering
 * - Animated entrance from right
 * - Responsive layout
 *
 * ## Usage
 * ```tsx
 * import { ConflictNotification } from './components/ConflictNotification';
 *
 * function App() {
 *   const handleResolve = (conflictId: string, resolution: ConflictResolution) => {
 *     // Handle conflict resolution
 *   };
 *
 *   const handleDismiss = (conflictId: string) => {
 *     // Dismiss notification
 *   };
 *
 *   return (
 *     <ConflictNotification
 *       conflict={conflict}
 *       onResolve={handleResolve}
 *       onDismiss={handleDismiss}
 *       countdown={30}
 *       isPersistent={false}
 *     />
 *   );
 * }
 * ```
 */
import { useState, useEffect } from 'react';
import type {
  ConflictNotificationProps,
  Conflict,
  ConflictResolution,
  FieldChange,
} from '../types';
import './ConflictNotification.css';

// Get icon for conflict type
function getConflictIcon(conflict: Conflict): string {
  switch (conflict.type) {
    case 'concurrent_edit':
      return '⚠️';
    case 'delete_edit':
      return '🗑️';
    case 'edit_edit':
      return '✏️';
    default:
      return '⚠️';
  }
}

// Get human-readable conflict description
function getConflictDescription(conflict: Conflict): string {
  const { type, remoteVersion } = conflict;
  const remoteName = remoteVersion.userName || 'Another user';

  switch (type) {
    case 'concurrent_edit':
      return `Both you and ${remoteName} edited this item`;
    case 'delete_edit':
      return `${remoteName} deleted this item while you were editing it`;
    case 'edit_edit':
      return `You and ${remoteName} edited different fields`;
    default:
      return `Conflict detected with ${remoteName}`;
  }
}

// Format field name for display
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Format field value for display
function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// Format timestamp to relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}

// Field change diff row component
interface FieldDiffProps {
  change: FieldChange;
  localValue: any;
  remoteValue: any;
}

function FieldDiff({ change, localValue, remoteValue }: FieldDiffProps) {
  const fieldName = formatFieldName(change.field);
  const oldValueStr = formatFieldValue(change.oldValue);
  const localValueStr = formatFieldValue(localValue);
  const remoteValueStr = formatFieldValue(remoteValue);

  const hasLocalChange = localValueStr !== oldValueStr;
  const hasRemoteChange = remoteValueStr !== oldValueStr;
  const valuesAreSame = localValueStr === remoteValueStr;

  return (
    <div className="conflict-diff-row">
      <div className="conflict-diff-field">{fieldName}</div>
      <div className="conflict-diff-values">
        {/* Your version */}
        <div className={`conflict-diff-value ${hasLocalChange && !valuesAreSame ? 'conflict-diff-added' : ''}`}>
          <div className="conflict-diff-label">Your Version</div>
          <div className="conflict-diff-text">{localValueStr}</div>
        </div>

        {/* Their version */}
        <div className={`conflict-diff-value ${hasRemoteChange && !valuesAreSame ? 'conflict-diff-removed' : ''}`}>
          <div className="conflict-diff-label">Their Version</div>
          <div className="conflict-diff-text">{remoteValueStr}</div>
        </div>
      </div>
    </div>
  );
}

// Main ConflictNotification component
export function ConflictNotification({
  conflict,
  onResolve,
  onDismiss,
  countdown = 30,
  isPersistent = false,
}: ConflictNotificationProps) {
  const [timeRemaining, setTimeRemaining] = useState(countdown);
  const [isExpanded, setIsExpanded] = useState(false);

  // Countdown timer for auto-dismiss
  useEffect(() => {
    if (isPersistent) {
      return; // Don't auto-dismiss persistent conflicts
    }

    if (timeRemaining <= 0) {
      onDismiss(conflict.id);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isPersistent, conflict.id, onDismiss]);

  const handleResolve = (resolution: ConflictResolution) => {
    onResolve(conflict.id, resolution);
  };

  const handleDismiss = () => {
    onDismiss(conflict.id);
  };

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  const icon = getConflictIcon(conflict);
  const description = getConflictDescription(conflict);
  const progressPercent = isPersistent ? 100 : (timeRemaining / countdown) * 100;

  // Get all changed fields
  const allChangedFields = new Map<string, FieldChange>();
  conflict.localVersion.changes.forEach(change => {
    allChangedFields.set(change.field, change);
  });
  conflict.remoteVersion.changes.forEach(change => {
    if (!allChangedFields.has(change.field)) {
      allChangedFields.set(change.field, change);
    }
  });

  // Get corresponding values from both versions
  const getFieldValue = (version: any, field: string): any => {
    if (typeof version === 'object' && version !== null) {
      return version[field];
    }
    return version;
  };

  return (
    <div
      className={`conflict-notification ${isPersistent ? 'conflict-persistent' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Progress bar for countdown */}
      {!isPersistent && (
        <div className="conflict-progress-bar">
          <div
            className="conflict-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="conflict-header">
        <div className="conflict-icon">{icon}</div>
        <div className="conflict-header-content">
          <div className="conflict-title">Conflict Detected</div>
          <div className="conflict-item-name">{conflict.itemName}</div>
          <div className="conflict-description">{description}</div>
          <div className="conflict-timestamp">
            {formatRelativeTime(conflict.timestamp)}
          </div>
        </div>
        <button
          className="conflict-close"
          onClick={handleDismiss}
          aria-label="Dismiss conflict notification"
        >
          ✕
        </button>
      </div>

      {/* Countdown timer */}
      {!isPersistent && timeRemaining > 0 && (
        <div className="conflict-countdown">
          Auto-dismiss in {timeRemaining}s
        </div>
      )}

      {/* Toggle diff view */}
      <button
        className="conflict-toggle-diff"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        {isExpanded ? '▼ Hide Changes' : '▶ Show Changes'}
      </button>

      {/* Diff preview */}
      {isExpanded && (
        <div className="conflict-diff-container">
          <div className="conflict-diff-header">Changes Preview</div>
          <div className="conflict-diff-list">
            {Array.from(allChangedFields.values()).map(change => (
              <FieldDiff
                key={change.field}
                change={change}
                localValue={getFieldValue(conflict.localVersion.value, change.field)}
                remoteValue={getFieldValue(conflict.remoteVersion.value, change.field)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="conflict-actions">
        <button
          className="conflict-action-button conflict-action-mine"
          onClick={() => handleResolve('mine')}
          aria-label="Keep your version"
        >
          <span className="conflict-action-icon">👤</span>
          <span className="conflict-action-label">Use Mine</span>
        </button>

        <button
          className="conflict-action-button conflict-action-theirs"
          onClick={() => handleResolve('theirs')}
          aria-label="Use their version"
        >
          <span className="conflict-action-icon">👥</span>
          <span className="conflict-action-label">Use Theirs</span>
        </button>

        <button
          className="conflict-action-button conflict-action-manual"
          onClick={() => handleResolve('manual')}
          aria-label="Merge manually"
        >
          <span className="conflict-action-icon">🔀</span>
          <span className="conflict-action-label">Merge Manually</span>
        </button>
      </div>

      {/* Help text */}
      <div className="conflict-help-text">
        Choose how to resolve this conflict. Your choice will be applied immediately.
      </div>
    </div>
  );
}

// Container component for multiple conflict notifications
interface ConflictNotificationsProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, resolution: ConflictResolution) => void;
  onDismiss: (conflictId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

export function ConflictNotifications({
  conflicts,
  onResolve,
  onDismiss,
  position = 'top-right',
  maxVisible = 3,
}: ConflictNotificationsProps) {
  // Sort conflicts by priority (highest first) and timestamp (most recent first)
  const sortedConflicts = [...conflicts].sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return b.timestamp - a.timestamp;
  });

  // Limit visible conflicts
  const visibleConflicts = sortedConflicts.slice(0, maxVisible);
  const hiddenCount = conflicts.length - visibleConflicts.length;

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className={`conflict-notifications-container conflict-notifications-${position}`}>
      {visibleConflicts.map(conflict => (
        <ConflictNotification
          key={conflict.id}
          conflict={conflict}
          onResolve={onResolve}
          onDismiss={onDismiss}
          isPersistent={!conflict.autoResolvable}
        />
      ))}

      {/* Show count of hidden conflicts */}
      {hiddenCount > 0 && (
        <div className="conflict-hidden-count">
          + {hiddenCount} more conflict{hiddenCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
