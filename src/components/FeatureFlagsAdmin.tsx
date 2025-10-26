/**
 * Feature Flags Admin Panel
 *
 * Provides a UI for managing feature flags at runtime.
 * This allows developers and administrators to:
 * - View all available feature flags
 * - Enable/disable features without redeploying
 * - Test features with specific users
 * - Perform A/B testing
 *
 * Access control should be implemented to restrict access to this panel.
 */

import { useState, useEffect } from 'react';
import {
  getFeatureFlagsWithMetadata,
  setFeatureFlag,
  clearStorageFlags,
  type FeatureFlagMetadata,
} from '../utils/featureFlags';
import './FeatureFlagsAdmin.css';

interface FeatureFlagsAdminProps {
  onClose: () => void;
}

export function FeatureFlagsAdmin({ onClose }: FeatureFlagsAdminProps) {
  const [flags, setFlags] = useState<FeatureFlagMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [hasChanges, setHasChanges] = useState(false);

  // Load flags on mount
  useEffect(() => {
    loadFlags();
  }, []);

  // Listen for flag changes
  useEffect(() => {
    const handleFlagsChanged = () => {
      loadFlags();
    };

    window.addEventListener('featureFlagsChanged', handleFlagsChanged);

    return () => {
      window.removeEventListener('featureFlagsChanged', handleFlagsChanged);
    };
  }, []);

  const loadFlags = () => {
    setFlags(getFeatureFlagsWithMetadata());
  };

  // Get unique groups
  const groups = Array.from(new Set(flags.map(f => f.group)));

  // Filter flags based on search and group
  const filteredFlags = flags.filter(flag => {
    const matchesSearch = searchQuery === '' ||
      flag.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup = selectedGroup === 'all' || flag.group === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  // Group flags by category
  const groupedFlags = filteredFlags.reduce((acc, flag) => {
    if (!acc[flag.group]) {
      acc[flag.group] = [];
    }
    acc[flag.group].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlagMetadata[]>);

  const handleToggleFlag = (flagKey: string, currentValue: boolean) => {
    setFeatureFlag(flagKey, !currentValue);
    setHasChanges(true);
    loadFlags();
  };

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all feature flags to their default values? This will clear all localStorage overrides.')) {
      clearStorageFlags();
      setHasChanges(false);
      loadFlags();
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Changes are saved automatically to localStorage. Close anyway?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleExportConfig = () => {
    const config = flags.reduce((acc, flag) => {
      acc[flag.key] = flag.enabled;
      return acc;
    }, {} as Record<string, boolean>);

    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `feature-flags-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const config = JSON.parse(e.target?.result as string);
            Object.entries(config).forEach(([key, value]) => {
              if (typeof value === 'boolean') {
                setFeatureFlag(key, value);
              }
            });
            setHasChanges(true);
            loadFlags();
            alert('Feature flags imported successfully!');
          } catch (error) {
            alert('Failed to import configuration. Please check the file format.');
            console.error('Import error:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? '#4CAF50' : '#9E9E9E';
  };

  return (
    <div className="feature-flags-admin-overlay" onClick={handleClose}>
      <div className="feature-flags-admin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="feature-flags-admin-header">
          <div className="header-title">
            <h2>Feature Flags Admin</h2>
            <span className="header-subtitle">
              Manage feature flags at runtime
            </span>
          </div>
          <button className="btn-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className="feature-flags-toolbar">
          <div className="toolbar-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search flags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="group-filter"
          >
            <option value="all">All Groups</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          <div className="toolbar-actions">
            <button
              className="btn btn-secondary"
              onClick={handleExportConfig}
              title="Export current configuration"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleImportConfig}
              title="Import configuration from file"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import
            </button>
            <button
              className="btn btn-danger"
              onClick={handleResetAll}
              title="Reset all flags to defaults"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <polyline points="23 20 23 14 17 14" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              Reset All
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="feature-flags-stats">
          <div className="stat">
            <span className="stat-value">{flags.filter(f => f.enabled).length}</span>
            <span className="stat-label">Enabled</span>
          </div>
          <div className="stat">
            <span className="stat-value">{flags.filter(f => !f.enabled).length}</span>
            <span className="stat-label">Disabled</span>
          </div>
          <div className="stat">
            <span className="stat-value">{groups.length}</span>
            <span className="stat-label">Groups</span>
          </div>
        </div>

        {/* Flags List */}
        <div className="feature-flags-body">
          {Object.keys(groupedFlags).length === 0 ? (
            <div className="no-results">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p>No feature flags found matching your search.</p>
            </div>
          ) : (
            Object.entries(groupedFlags).map(([group, groupFlags]) => (
              <div key={group} className="flag-group">
                <h3 className="flag-group-title">{group}</h3>
                <div className="flag-list">
                  {groupFlags.map(flag => (
                    <div
                      key={flag.key}
                      className={`flag-item ${flag.parentFlag ? 'flag-item-child' : ''}`}
                    >
                      <div className="flag-info">
                        <div className="flag-header">
                          <span className="flag-label">{flag.label}</span>
                          <span
                            className="flag-status"
                            style={{ backgroundColor: getStatusColor(flag.enabled) }}
                          >
                            {flag.enabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <p className="flag-description">{flag.description}</p>
                        <code className="flag-key">{flag.key}</code>
                      </div>

                      <div className="flag-controls">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={flag.enabled}
                            onChange={() => handleToggleFlag(flag.key, flag.enabled)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="feature-flags-footer">
          <div className="footer-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              Changes are saved automatically to localStorage and take effect immediately.
              {hasChanges && <strong> You have unsaved changes.</strong>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
