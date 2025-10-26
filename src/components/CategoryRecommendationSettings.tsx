import { useState, useEffect } from 'react';
import {
  getRecommendationPreferences,
  saveRecommendationPreferences,
  clearRecommendationData,
  exportRecommendationStats,
  type RecommendationPreferences,
} from '../utils/categoryRecommendations';
import './CategoryRecommendationSettings.css';

interface CategoryRecommendationSettingsProps {
  onClose: () => void;
}

export function CategoryRecommendationSettings({ onClose }: CategoryRecommendationSettingsProps) {
  const [prefs, setPrefs] = useState<RecommendationPreferences>(() => getRecommendationPreferences());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showClearConfirm) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showClearConfirm]);

  const handleSave = () => {
    saveRecommendationPreferences(prefs);
    setSuccessMessage('Settings saved successfully!');
  };

  const handleExport = () => {
    try {
      const stats = exportRecommendationStats();
      const blob = new Blob([stats], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recommendation-stats-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('Statistics exported successfully!');
    } catch (error) {
      console.error('Failed to export statistics:', error);
    }
  };

  const handleClearData = () => {
    clearRecommendationData();
    setShowClearConfirm(false);
    setSuccessMessage('All recommendation data cleared!');
  };

  const handleReset = () => {
    const defaults: RecommendationPreferences = {
      enabled: true,
      showCreateSuggestions: true,
      showMergeSuggestions: true,
      showArchiveSuggestions: true,
      minConfidence: 0.6,
    };
    setPrefs(defaults);
    saveRecommendationPreferences(defaults);
    setSuccessMessage('Settings reset to defaults!');
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m5.2-14.5l-3 5.2m-3.4 0l-3-5.2M20.7 8l-5.2 3m0 3.4l5.2 3M23 12h-6m-6 0H5m14.5 5.2l-5.2-3m-3.4 0l5.2 3M16 20.7l-3-5.2m-3.4 0l-3 5.2" />
            </svg>
            Recommendation Settings
          </h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {successMessage && (
          <div className="message message-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {successMessage}
          </div>
        )}

        <div className="settings-body">
          <section className="settings-section">
            <h3>General Settings</h3>

            <label className="setting-row setting-checkbox">
              <div className="setting-info">
                <span className="setting-label">Enable Smart Recommendations</span>
                <span className="setting-description">
                  Get intelligent suggestions for managing your categories
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
                className="toggle-checkbox"
              />
            </label>

            {prefs.enabled && (
              <>
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">Minimum Confidence Level</span>
                    <span className="setting-description">
                      Only show recommendations with at least this confidence level ({Math.round(prefs.minConfidence * 100)}%)
                    </span>
                  </div>
                  <div className="setting-control">
                    <input
                      type="range"
                      min="40"
                      max="90"
                      step="10"
                      value={prefs.minConfidence * 100}
                      onChange={(e) => setPrefs({ ...prefs, minConfidence: parseInt(e.target.value) / 100 })}
                      className="confidence-slider"
                    />
                    <span className="confidence-value">{Math.round(prefs.minConfidence * 100)}%</span>
                  </div>
                </div>
              </>
            )}
          </section>

          {prefs.enabled && (
            <section className="settings-section">
              <h3>Recommendation Types</h3>

              <label className="setting-row setting-checkbox">
                <div className="setting-info">
                  <span className="setting-label">
                    <span className="setting-icon">✨</span>
                    Create Category Suggestions
                  </span>
                  <span className="setting-description">
                    Suggest new categories based on patterns in 'Other' items
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.showCreateSuggestions}
                  onChange={(e) => setPrefs({ ...prefs, showCreateSuggestions: e.target.checked })}
                  className="toggle-checkbox"
                />
              </label>

              <label className="setting-row setting-checkbox">
                <div className="setting-info">
                  <span className="setting-label">
                    <span className="setting-icon">🔗</span>
                    Merge Category Suggestions
                  </span>
                  <span className="setting-description">
                    Identify similar categories that could be combined
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.showMergeSuggestions}
                  onChange={(e) => setPrefs({ ...prefs, showMergeSuggestions: e.target.checked })}
                  className="toggle-checkbox"
                />
              </label>

              <label className="setting-row setting-checkbox">
                <div className="setting-info">
                  <span className="setting-label">
                    <span className="setting-icon">📦</span>
                    Archive Unused Suggestions
                  </span>
                  <span className="setting-description">
                    Suggest archiving categories that haven't been used recently
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.showArchiveSuggestions}
                  onChange={(e) => setPrefs({ ...prefs, showArchiveSuggestions: e.target.checked })}
                  className="toggle-checkbox"
                />
              </label>
            </section>
          )}

          <section className="settings-section">
            <h3>Data Management</h3>

            <div className="data-actions">
              <button className="btn btn-secondary btn-small" onClick={handleExport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Statistics
              </button>

              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowClearConfirm(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Clear All Data
              </button>
            </div>

            <div className="privacy-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>
                All recommendation data is stored locally on your device.
                No information is sent to external servers.
              </span>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      {showClearConfirm && (
        <div className="confirmation-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Clear All Data?</h3>
            <p>
              This will permanently delete all recommendation history, feedback, and statistics.
              This action cannot be undone.
            </p>
            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleClearData}>
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
