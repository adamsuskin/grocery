/**
 * Category Backup and Restore Component
 *
 * Provides UI for backing up and restoring custom categories:
 * - Download category backups
 * - Upload and restore from backup files
 * - View automatic backup history
 * - Manage backup settings
 * - Handle conflicts with preview
 *
 * @module components/CategoryBackupRestore
 */

import { useState, useRef, useEffect } from 'react';
import type { CustomCategory } from '../types';
import {
  downloadCategoryBackup,
  importFromFile,
  getListBackups,
  deleteStoredBackup,
  restoreFromBackup,
  getAutoBackupConfig,
  setAutoBackupConfig,
  createAutoBackup,
  type ImportResult,
  type ConflictResolution,
  type StoredBackup,
  type CategoryConflict,
} from '../utils/categoryBackup';
import './CategoryBackupRestore.css';

interface CategoryBackupRestoreProps {
  listId: string;
  listName: string;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

type ViewMode = 'main' | 'import' | 'history' | 'settings';

export function CategoryBackupRestore({
  listId,
  listName,
  onClose,
  onImportSuccess,
}: CategoryBackupRestoreProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('skip');
  const [importPreview, setImportPreview] = useState<ImportResult | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History state
  const [backupHistory, setBackupHistory] = useState<StoredBackup[]>([]);

  // Settings state
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [maxBackups, setMaxBackups] = useState(5);

  // Load initial data
  useEffect(() => {
    loadBackupHistory();
    loadSettings();
  }, [listId]);

  // Auto-hide messages
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const loadBackupHistory = () => {
    const history = getListBackups(listId);
    setBackupHistory(history);
  };

  const loadSettings = () => {
    const config = getAutoBackupConfig();
    setAutoBackupEnabled(config.enabled);
    setMaxBackups(config.maxBackups);
  };

  // =============================================================================
  // EXPORT HANDLERS
  // =============================================================================

  const handleExportBackup = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      await downloadCategoryBackup(listId, true);
      setSuccessMessage('Categories exported successfully!');

      // Create auto backup too
      await createAutoBackup(listId);
      loadBackupHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export categories');
    } finally {
      setIsProcessing(false);
    }
  };

  // =============================================================================
  // IMPORT HANDLERS
  // =============================================================================

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleImportPreview = async () => {
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const result = await importFromFile(selectedFile, {
        listId,
        listName,
        conflictResolution: 'skip', // Just preview, don't import yet
      });

      setImportPreview(result);

      if (result.conflicts.length > 0) {
        setShowConflictDialog(true);
      } else if (result.success) {
        // No conflicts, show preview
        setViewMode('import');
      } else {
        setError(result.errors.join(', ') || 'Failed to preview import');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview import');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const result = await importFromFile(selectedFile, {
        listId,
        listName,
        conflictResolution,
      });

      if (result.success) {
        setSuccessMessage(
          `Successfully imported ${result.imported} categor${result.imported === 1 ? 'y' : 'ies'}!`
        );
        if (result.skipped > 0) {
          setSuccessMessage(prev =>
            `${prev} (${result.skipped} skipped due to conflicts)`
          );
        }

        // Create auto backup after successful import
        await createAutoBackup(listId);
        loadBackupHistory();

        // Notify parent
        onImportSuccess(result.imported);

        // Reset state
        setSelectedFile(null);
        setImportPreview(null);
        setShowConflictDialog(false);
        setViewMode('main');

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(result.errors.join(', ') || 'Failed to import categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import categories');
    } finally {
      setIsProcessing(false);
    }
  };

  // =============================================================================
  // BACKUP HISTORY HANDLERS
  // =============================================================================

  const handleRestoreBackup = async (backupId: string) => {
    setError(null);
    setIsProcessing(true);

    try {
      const result = await restoreFromBackup(backupId, {
        listId,
        conflictResolution: 'skip',
      });

      if (result.success) {
        setSuccessMessage(
          `Successfully restored ${result.imported} categor${result.imported === 1 ? 'y' : 'ies'}!`
        );
        onImportSuccess(result.imported);
        setViewMode('main');
      } else {
        setError(result.errors.join(', ') || 'Failed to restore backup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    try {
      deleteStoredBackup(backupId);
      loadBackupHistory();
      setSuccessMessage('Backup deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete backup');
    }
  };

  // =============================================================================
  // SETTINGS HANDLERS
  // =============================================================================

  const handleSaveSettings = () => {
    try {
      setAutoBackupConfig({
        enabled: autoBackupEnabled,
        maxBackups: Math.max(1, Math.min(10, maxBackups)),
      });
      setSuccessMessage('Settings saved successfully');
      setViewMode('main');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderMain = () => (
    <div className="backup-main">
      <div className="backup-actions-grid">
        <button
          className="backup-action-card"
          onClick={handleExportBackup}
          disabled={isProcessing}
        >
          <div className="backup-action-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3>Export Backup</h3>
          <p>Download all categories as a JSON file</p>
        </button>

        <button
          className="backup-action-card"
          onClick={() => {
            setViewMode('import');
            setImportPreview(null);
          }}
          disabled={isProcessing}
        >
          <div className="backup-action-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <h3>Restore Backup</h3>
          <p>Import categories from a backup file</p>
        </button>

        <button
          className="backup-action-card"
          onClick={() => setViewMode('history')}
          disabled={isProcessing}
        >
          <div className="backup-action-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>Backup History</h3>
          <p>View and restore automatic backups ({backupHistory.length})</p>
        </button>

        <button
          className="backup-action-card"
          onClick={() => setViewMode('settings')}
          disabled={isProcessing}
        >
          <div className="backup-action-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2" />
            </svg>
          </div>
          <h3>Settings</h3>
          <p>Configure automatic backups</p>
        </button>
      </div>
    </div>
  );

  const renderImport = () => (
    <div className="backup-import">
      {!importPreview ? (
        <>
          <div className="import-file-section">
            <h3>Select Backup File</h3>
            <p className="section-description">
              Choose a JSON backup file to restore categories from.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="file-input"
              id="backup-file-input"
            />
            <label htmlFor="backup-file-input" className="file-input-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {selectedFile ? selectedFile.name : 'Choose File'}
            </label>
          </div>

          {selectedFile && (
            <div className="import-preview-section">
              <button
                className="btn btn-primary"
                onClick={handleImportPreview}
                disabled={isProcessing}
              >
                {isProcessing ? 'Analyzing...' : 'Preview Import'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="import-preview">
          <h3>Import Preview</h3>

          <div className="preview-stats">
            <div className="preview-stat">
              <span className="stat-label">Categories to Import:</span>
              <span className="stat-value">{importPreview.categories.length}</span>
            </div>
            <div className="preview-stat">
              <span className="stat-label">Conflicts Found:</span>
              <span className="stat-value conflict">{importPreview.conflicts.length}</span>
            </div>
          </div>

          {importPreview.conflicts.length > 0 && (
            <div className="conflict-resolution-section">
              <h4>Conflict Resolution</h4>
              <p className="section-description">
                How should we handle categories that already exist?
              </p>

              <div className="resolution-options">
                <label className="resolution-option">
                  <input
                    type="radio"
                    name="resolution"
                    value="skip"
                    checked={conflictResolution === 'skip'}
                    onChange={() => setConflictResolution('skip')}
                  />
                  <div className="option-content">
                    <strong>Skip</strong>
                    <span>Keep existing categories, skip imported duplicates</span>
                  </div>
                </label>

                <label className="resolution-option">
                  <input
                    type="radio"
                    name="resolution"
                    value="overwrite"
                    checked={conflictResolution === 'overwrite'}
                    onChange={() => setConflictResolution('overwrite')}
                  />
                  <div className="option-content">
                    <strong>Overwrite</strong>
                    <span>Replace existing with imported categories</span>
                  </div>
                </label>

                <label className="resolution-option">
                  <input
                    type="radio"
                    name="resolution"
                    value="rename"
                    checked={conflictResolution === 'rename'}
                    onChange={() => setConflictResolution('rename')}
                  />
                  <div className="option-content">
                    <strong>Rename</strong>
                    <span>Import as new categories with "(Imported)" suffix</span>
                  </div>
                </label>

                <label className="resolution-option">
                  <input
                    type="radio"
                    name="resolution"
                    value="merge"
                    checked={conflictResolution === 'merge'}
                    onChange={() => setConflictResolution('merge')}
                  />
                  <div className="option-content">
                    <strong>Merge</strong>
                    <span>Update properties (color, icon) of existing categories</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="preview-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setImportPreview(null);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmImport}
              disabled={isProcessing}
            >
              {isProcessing ? 'Importing...' : 'Confirm Import'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="backup-history">
      <h3>Automatic Backup History</h3>
      <p className="section-description">
        Restore categories from automatic backups. Backups are created periodically to protect your data.
      </p>

      {backupHistory.length === 0 ? (
        <div className="empty-history">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>No automatic backups found for this list</p>
          <button
            className="btn btn-primary"
            onClick={async () => {
              await createAutoBackup(listId);
              loadBackupHistory();
            }}
          >
            Create Backup Now
          </button>
        </div>
      ) : (
        <div className="backup-list">
          {backupHistory.map(backup => (
            <div key={backup.id} className="backup-item">
              <div className="backup-info">
                <div className="backup-title">{backup.listName}</div>
                <div className="backup-meta">
                  <span>{new Date(backup.timestamp).toLocaleString()}</span>
                  <span>{backup.categoryCount} categories</span>
                </div>
              </div>
              <div className="backup-actions">
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => handleRestoreBackup(backup.id)}
                  disabled={isProcessing}
                  title="Restore this backup"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Restore
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteBackup(backup.id)}
                  disabled={isProcessing}
                  title="Delete this backup"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="backup-settings">
      <h3>Backup Settings</h3>
      <p className="section-description">
        Configure automatic backup behavior for your categories.
      </p>

      <div className="settings-form">
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoBackupEnabled}
              onChange={e => setAutoBackupEnabled(e.target.checked)}
            />
            <span>Enable automatic backups</span>
          </label>
          <p className="form-help">
            Automatically create backups when categories are modified
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="max-backups">Maximum Backups to Keep</label>
          <input
            id="max-backups"
            type="number"
            min="1"
            max="10"
            value={maxBackups}
            onChange={e => setMaxBackups(parseInt(e.target.value) || 5)}
            className="input"
          />
          <p className="form-help">
            Number of automatic backups to keep per list (1-10)
          </p>
        </div>

        <div className="settings-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setViewMode('main')}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveSettings}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="backup-overlay" onClick={onClose}>
      <div className="backup-modal" onClick={e => e.stopPropagation()}>
        <div className="backup-header">
          <div className="backup-header-content">
            {viewMode !== 'main' && (
              <button
                className="btn-back"
                onClick={() => setViewMode('main')}
                aria-label="Back to main menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            )}
            <h2>Category Backup & Restore</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && (
          <div className="message message-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="message message-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {successMessage}
          </div>
        )}

        <div className="backup-body">
          {viewMode === 'main' && renderMain()}
          {viewMode === 'import' && renderImport()}
          {viewMode === 'history' && renderHistory()}
          {viewMode === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
}
