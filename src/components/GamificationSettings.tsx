import { useState, useEffect } from 'react';
import {
  GamificationSettings as Settings,
  getGamificationSettings,
  updateGamificationSettings,
  resetGamificationData,
  exportGamificationData,
} from '../utils/categoryGamification';
import './GamificationSettings.css';

export interface GamificationSettingsProps {
  currentListId?: string;
  onClose?: () => void;
}

export function GamificationSettings({ currentListId, onClose }: GamificationSettingsProps) {
  const [settings, setSettings] = useState<Settings>(getGamificationSettings());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    setSettings(getGamificationSettings());
  }, []);

  const handleToggle = (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    updateGamificationSettings(newSettings);
    showSavedMessage();
  };

  const showSavedMessage = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleExport = () => {
    if (!currentListId) return;

    try {
      const data = exportGamificationData(currentListId);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamification-data-${currentListId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export gamification data');
    }
  };

  const handleReset = () => {
    if (!currentListId) return;

    resetGamificationData(currentListId);
    setShowResetConfirm(false);
    alert('Gamification data has been reset for this list');
  };

  return (
    <div className="gamification-settings">
      {onClose && (
        <div className="settings-header">
          <h2>
            <span className="settings-icon">⚙️</span>
            Gamification Settings
          </h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      )}

      <div className="settings-body">
        <div className="settings-section">
          <h3>Display Preferences</h3>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <span className="setting-icon">🎮</span>
                Fun Mode
              </div>
              <p className="setting-description">
                Enable gamification features like achievements, challenges, and progress tracking
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.funModeEnabled}
                onChange={() => handleToggle('funModeEnabled')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {settings.funModeEnabled && (
            <>
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">
                    <span className="setting-icon">🔔</span>
                    Achievement Notifications
                  </div>
                  <p className="setting-description">
                    Show celebration animations when you unlock new achievements
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.showNotifications}
                    onChange={() => handleToggle('showNotifications')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">
                    <span className="setting-icon">🎯</span>
                    Challenges & Tips
                  </div>
                  <p className="setting-description">
                    Display helpful challenges and tips to improve your organization
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.showChallenges}
                    onChange={() => handleToggle('showChallenges')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">
                    <span className="setting-icon">🏆</span>
                    Leaderboard
                  </div>
                  <p className="setting-description">
                    Show leaderboard on shared lists to see top contributors
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.showLeaderboard}
                    onChange={() => handleToggle('showLeaderboard')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </>
          )}
        </div>

        {savedMessage && (
          <div className="settings-saved-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Settings saved
          </div>
        )}

        {currentListId && (
          <div className="settings-section">
            <h3>Data Management</h3>

            <div className="settings-actions">
              <button
                className="btn btn-secondary"
                onClick={handleExport}
                title="Export gamification data for this list"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Data
              </button>

              <button
                className="btn btn-danger"
                onClick={() => setShowResetConfirm(true)}
                title="Reset all gamification data for this list"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Reset Progress
              </button>
            </div>

            <p className="settings-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Resetting progress will delete all achievements and statistics for this list. This cannot be undone.
            </p>
          </div>
        )}

        <div className="settings-section">
          <h3>About Gamification</h3>
          <p className="settings-about">
            Gamification makes organizing your grocery lists more fun and rewarding!
            Track your progress, unlock achievements, and compete with friends on shared lists.
          </p>
          <div className="settings-features">
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <span>10 unique achievements to unlock</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Track organization scores</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Personalized challenges</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤝</span>
              <span>Collaborative leaderboards</span>
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="confirmation-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Reset Gamification Data?</h3>
            <p>
              This will permanently delete all achievements, statistics, and progress for this list.
              You cannot undo this action.
            </p>
            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleReset}>
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function GamificationToggle() {
  const [funMode, setFunMode] = useState(false);

  useEffect(() => {
    const settings = getGamificationSettings();
    setFunMode(settings.funModeEnabled);
  }, []);

  const handleToggle = () => {
    const newValue = !funMode;
    setFunMode(newValue);
    updateGamificationSettings({ funModeEnabled: newValue });
  };

  return (
    <div className="gamification-toggle-compact">
      <label className="toggle-label">
        <span className="toggle-icon">🎮</span>
        <span className="toggle-text">Fun Mode</span>
        <input
          type="checkbox"
          checked={funMode}
          onChange={handleToggle}
          className="toggle-checkbox"
        />
        <span className="toggle-slider-small" />
      </label>
    </div>
  );
}
