import { useState, useEffect } from 'react';
import './SyncStatus.css';

interface SyncStatusProps {
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  lastSyncTime: Date | null;
  onRetrySync: () => void;
}

type ConnectionQuality = 'good' | 'poor';

export function SyncStatus({
  isOnline,
  isSyncing,
  queuedCount,
  lastSyncTime,
  onRetrySync,
}: SyncStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('good');
  const [shouldAutoHide, setShouldAutoHide] = useState(false);

  // Determine connection quality based on sync time
  useEffect(() => {
    if (!lastSyncTime || !isOnline) {
      setConnectionQuality('poor');
      return;
    }

    const timeSinceSync = Date.now() - lastSyncTime.getTime();
    // If last sync was more than 5 minutes ago, consider connection poor
    if (timeSinceSync > 5 * 60 * 1000) {
      setConnectionQuality('poor');
    } else {
      setConnectionQuality('good');
    }
  }, [lastSyncTime, isOnline]);

  // Auto-hide logic: hide when online, not syncing, and no queued items
  useEffect(() => {
    if (isOnline && !isSyncing && queuedCount === 0) {
      // Wait 3 seconds after sync completes before hiding
      const timer = setTimeout(() => {
        setShouldAutoHide(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShouldAutoHide(false);
    }
  }, [isOnline, isSyncing, queuedCount]);

  // Get status indicator
  const getStatusIndicator = () => {
    if (isSyncing) return { color: 'yellow', label: 'Syncing' };
    if (!isOnline) return { color: 'red', label: 'Offline' };
    return { color: 'green', label: 'Online' };
  };

  const status = getStatusIndicator();

  // Format last sync time
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';

    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Don't render if should auto-hide
  if (shouldAutoHide && !isExpanded) {
    return null;
  }

  return (
    <div
      className={`sync-status ${isExpanded ? 'expanded' : 'compact'}`}
      onClick={() => setIsExpanded(!isExpanded)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }
      }}
      aria-label="Sync status"
      aria-expanded={isExpanded}
    >
      {/* Compact view */}
      <div className="sync-status-compact">
        <div className={`status-indicator status-${status.color}`} title={status.label}>
          <div className="status-dot"></div>
        </div>

        {(isSyncing || queuedCount > 0) && (
          <span className="sync-status-text">
            {isSyncing ? `Syncing${queuedCount > 0 ? ` ${queuedCount} items` : ''}...` :
             queuedCount > 0 ? `${queuedCount} queued` : ''}
          </span>
        )}

        {!isExpanded && (
          <div className="expand-icon" aria-hidden="true">
            ▼
          </div>
        )}
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="sync-status-expanded" onClick={(e) => e.stopPropagation()}>
          <div className="sync-status-header">
            <h3>Sync Status</h3>
            <button
              className="close-btn"
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="sync-status-details">
            {/* Connection Status */}
            <div className="detail-row">
              <span className="detail-label">Connection:</span>
              <span className="detail-value">
                <span className={`status-badge status-badge-${status.color}`}>
                  {status.label}
                </span>
              </span>
            </div>

            {/* Connection Quality */}
            {isOnline && (
              <div className="detail-row">
                <span className="detail-label">Quality:</span>
                <span className="detail-value">
                  <span className={`quality-badge quality-${connectionQuality}`}>
                    {connectionQuality === 'good' ? '● Good' : '◐ Poor'}
                  </span>
                </span>
              </div>
            )}

            {/* Sync Status */}
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">
                {isSyncing ? (
                  <span className="syncing-text">
                    <span className="spinner"></span>
                    Syncing...
                  </span>
                ) : (
                  'Idle'
                )}
              </span>
            </div>

            {/* Queued Items */}
            {queuedCount > 0 && (
              <div className="detail-row">
                <span className="detail-label">Queued:</span>
                <span className="detail-value queued-count">
                  {queuedCount} {queuedCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            )}

            {/* Last Sync */}
            <div className="detail-row">
              <span className="detail-label">Last sync:</span>
              <span className="detail-value">{formatLastSync(lastSyncTime)}</span>
            </div>

            {/* Retry Button */}
            {(!isOnline || queuedCount > 0) && (
              <button
                className="btn-retry-sync"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetrySync();
                }}
                disabled={isSyncing}
              >
                {isSyncing ? 'Syncing...' : 'Retry Sync'}
              </button>
            )}
          </div>

          {/* Tooltip/Help Text */}
          <div className="sync-status-help">
            {!isOnline && (
              <p className="help-text offline">
                You're offline. Changes will sync when connection is restored.
              </p>
            )}
            {isOnline && queuedCount > 0 && (
              <p className="help-text warning">
                Some changes are waiting to sync. Click "Retry Sync" if needed.
              </p>
            )}
            {isOnline && queuedCount === 0 && !isSyncing && (
              <p className="help-text success">
                All changes are synced!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
