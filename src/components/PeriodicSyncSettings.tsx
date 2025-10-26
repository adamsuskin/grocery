/**
 * PeriodicSyncSettings Component
 *
 * Provides a comprehensive UI for managing Periodic Background Sync settings.
 * Features:
 * - Enable/disable periodic sync
 * - Configure sync frequency (hourly, daily, weekly, adaptive)
 * - Battery-aware and network-aware options
 * - Display sync statistics and last/next sync times
 * - Manual sync trigger
 * - Browser support detection with fallback information
 * - Loading states and visual feedback
 *
 * Usage:
 * ```tsx
 * import { PeriodicSyncSettings } from './components/PeriodicSyncSettings';
 *
 * function Settings() {
 *   return <PeriodicSyncSettings />;
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { useSyncStatus } from '../contexts/SyncContext';
import { usePeriodicSync, SYNC_INTERVALS, type SyncInterval } from '../contexts/PeriodicSyncContext';
import './PeriodicSyncSettings.css';

/**
 * Get browser compatibility information
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
  const isEdge = /Edg/.test(ua);
  const isOpera = /OPR/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);

  return {
    isChrome,
    isEdge,
    isOpera,
    isFirefox,
    isSafari,
    name: isChrome ? 'Chrome' : isEdge ? 'Edge' : isOpera ? 'Opera' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Unknown',
  };
}

export function PeriodicSyncSettings() {
  const syncStatus = useSyncStatus();
  const browserInfo = getBrowserInfo();
  const {
    isSupported,
    isEnabled,
    syncInterval,
    isRegistered,
    lastSyncTime,
    isUpdating,
    error: periodicSyncError,
    nextSyncIn,
    enable,
    disable,
    updateInterval,
    triggerSync: triggerPeriodicSync,
  } = usePeriodicSync();

  // UI state
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  /**
   * Show temporary message
   */
  const showMessage = useCallback((type: 'success' | 'error' | 'info', text: string, duration = 5000) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), duration);
  }, []);

  /**
   * Handle enable/disable toggle
   */
  const handleToggleEnabled = useCallback(async (enabled: boolean) => {
    try {
      if (enabled) {
        await enable();
        showMessage('success', 'Periodic sync enabled! Your grocery list will sync automatically in the background.');
      } else {
        await disable();
        showMessage('info', 'Periodic sync disabled. You can still sync manually.');
      }
    } catch (error) {
      console.error('[PeriodicSync] Toggle failed:', error);
      showMessage('error', 'Failed to update periodic sync settings.');
    }
  }, [enable, disable, showMessage]);

  /**
   * Handle interval change
   */
  const handleIntervalChange = useCallback(async (interval: SyncInterval) => {
    try {
      await updateInterval(interval);
      showMessage('success', `Sync interval updated to ${formatInterval(interval)}.`);
    } catch (error) {
      console.error('[PeriodicSync] Interval change failed:', error);
      showMessage('error', 'Failed to update sync interval.');
    }
  }, [updateInterval, showMessage]);

  /**
   * Handle manual sync
   */
  const handleManualSync = useCallback(async () => {
    setIsManualSyncing(true);

    try {
      // Trigger both regular sync and periodic sync
      await Promise.all([
        syncStatus.triggerSync(),
        triggerPeriodicSync(),
      ]);

      showMessage('success', 'Manual sync completed successfully!');
    } catch (error) {
      console.error('[PeriodicSync] Manual sync failed:', error);
      showMessage('error', 'Manual sync failed. Please check your connection and try again.');
    } finally {
      setIsManualSyncing(false);
    }
  }, [syncStatus, triggerPeriodicSync, showMessage]);

  /**
   * Format interval for display
   */
  const formatInterval = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = minutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  };

  /**
   * Format timestamp for display
   */
  const formatTime = useCallback((timestamp: number | null) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // For future times (next sync)
    if (diff < 0) {
      const absDiff = Math.abs(diff);
      const absSeconds = Math.floor(absDiff / 1000);
      const absMinutes = Math.floor(absSeconds / 60);
      const absHours = Math.floor(absMinutes / 60);
      const absDays = Math.floor(absHours / 24);

      if (absDays > 0) return `in ${absDays}d`;
      if (absHours > 0) return `in ${absHours}h`;
      if (absMinutes > 0) return `in ${absMinutes}m`;
      return 'very soon';
    }

    // For past times (last sync)
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }, []);


  return (
    <div className="periodic-sync-settings">
      <div className="settings-header">
        <h2>Background Sync Settings</h2>
        <p className="settings-description">
          Configure automatic background synchronization for your grocery list
        </p>
      </div>

      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="support-warning" role="alert">
          <div className="warning-icon">!</div>
          <div className="warning-content">
            <h3>Periodic Background Sync Not Supported</h3>
            <p>
              Your browser ({browserInfo.name}) doesn't support Periodic Background Sync API.
            </p>
            <div className="browser-compatibility">
              <h4>Supported Browsers:</h4>
              <ul>
                <li className={browserInfo.isChrome ? 'supported' : ''}>
                  Chrome 80+ {browserInfo.isChrome && '(Your browser)'}
                </li>
                <li className={browserInfo.isEdge ? 'supported' : ''}>
                  Edge 80+ {browserInfo.isEdge && '(Your browser)'}
                </li>
                <li className={browserInfo.isOpera ? 'supported' : ''}>
                  Opera 67+ {browserInfo.isOpera && '(Your browser)'}
                </li>
                <li className="not-supported">Firefox (Not supported)</li>
                <li className="not-supported">Safari (Not supported)</li>
              </ul>
            </div>
            <p className="fallback-info">
              <strong>Fallback:</strong> Your app will continue to sync when open and when you reconnect to the internet.
              Regular Background Sync (not periodic) is still available for offline changes.
            </p>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Periodic_Background_Synchronization_API"
              target="_blank"
              rel="noopener noreferrer"
              className="docs-link"
            >
              Learn more about browser compatibility
            </a>
          </div>
        </div>
      )}

      {/* Message Display */}
      {(message || periodicSyncError) && (
        <div className={`message message-${message?.type || 'error'}`} role="status">
          <span className="message-icon">
            {message?.type === 'success' || !periodicSyncError ? '✓' : message?.type === 'error' || periodicSyncError ? '✕' : 'ℹ'}
          </span>
          <span className="message-text">{message?.text || periodicSyncError}</span>
        </div>
      )}

      {/* Main Settings */}
      <div className="settings-section">
        <div className="setting-item setting-item-primary">
          <div className="setting-info">
            <label htmlFor="enable-sync" className="setting-label">
              Enable Periodic Sync
            </label>
            <p className="setting-description">
              Automatically sync your grocery list in the background, even when the app is closed
            </p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                id="enable-sync"
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                disabled={!isSupported || isUpdating}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {isEnabled && isSupported && (
          <>
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="sync-frequency" className="setting-label">
                  Sync Frequency
                </label>
                <p className="setting-description">
                  How often should we sync in the background?
                </p>
              </div>
              <div className="setting-control">
                <select
                  id="sync-frequency"
                  className="frequency-select"
                  value={syncInterval}
                  onChange={(e) => handleIntervalChange(parseInt(e.target.value, 10) as SyncInterval)}
                  disabled={isUpdating}
                >
                  <option value={SYNC_INTERVALS.MINUTES_15}>{formatInterval(SYNC_INTERVALS.MINUTES_15)}</option>
                  <option value={SYNC_INTERVALS.MINUTES_30}>{formatInterval(SYNC_INTERVALS.MINUTES_30)}</option>
                  <option value={SYNC_INTERVALS.HOUR_1}>{formatInterval(SYNC_INTERVALS.HOUR_1)}</option>
                  <option value={SYNC_INTERVALS.HOURS_2}>{formatInterval(SYNC_INTERVALS.HOURS_2)}</option>
                  <option value={SYNC_INTERVALS.HOURS_4}>{formatInterval(SYNC_INTERVALS.HOURS_4)}</option>
                  <option value={SYNC_INTERVALS.HOURS_6}>{formatInterval(SYNC_INTERVALS.HOURS_6)}</option>
                  <option value={SYNC_INTERVALS.HOURS_12}>{formatInterval(SYNC_INTERVALS.HOURS_12)}</option>
                  <option value={SYNC_INTERVALS.HOURS_24}>{formatInterval(SYNC_INTERVALS.HOURS_24)}</option>
                </select>
              </div>
            </div>

          </>
        )}
      </div>

      {/* Sync Status */}
      <div className="settings-section">
        <h3 className="section-title">Sync Status</h3>

        <div className="status-grid">
          <div className="status-item">
            <div className="status-label">Last Sync</div>
            <div className="status-value">
              {formatTime(lastSyncTime)}
            </div>
          </div>

          {isEnabled && isSupported && nextSyncIn !== null && (
            <div className="status-item">
              <div className="status-label">Next Sync</div>
              <div className="status-value status-next-sync">
                {nextSyncIn === 0 ? 'Soon' : `In ${nextSyncIn} minute${nextSyncIn !== 1 ? 's' : ''}`}
              </div>
            </div>
          )}

          <div className="status-item">
            <div className="status-label">Current Interval</div>
            <div className="status-value">
              {isEnabled ? formatInterval(syncInterval) : 'Disabled'}
            </div>
          </div>

          <div className="status-item">
            <div className="status-label">Status</div>
            <div className="status-value">
              <span className={`connection-badge ${isRegistered ? 'connection-online' : 'connection-offline'}`}>
                {isRegistered ? '● Registered' : '○ Not Registered'}
              </span>
            </div>
          </div>
        </div>

        <button
          className="btn-manual-sync"
          onClick={handleManualSync}
          disabled={isManualSyncing || syncStatus.isSyncing || syncStatus.connectionState === 'offline'}
        >
          {isManualSyncing || syncStatus.isSyncing ? (
            <>
              <span className="spinner-small"></span>
              Syncing...
            </>
          ) : (
            <>
              <span className="sync-icon">⟳</span>
              Sync Now
            </>
          )}
        </button>
      </div>


      {/* Additional Info */}
      <div className="settings-footer">
        <p className="footer-note">
          <strong>Note:</strong> Background sync requires an active service worker and appropriate permissions.
          The browser may adjust sync frequency based on your app usage patterns and device conditions.
        </p>
        <p className="footer-note">
          Periodic sync helps keep your grocery list up-to-date even when the app is closed, ensuring you always have the latest items from your collaborators.
        </p>
      </div>
    </div>
  );
}
