import { useState, useEffect, useMemo } from 'react';
import type { GroceryItem, Category } from '../types';
import './ConflictResolutionModal.css';

/**
 * Simplified conflict interface for the resolution modal
 * Represents a conflict between local and remote versions of an item
 */
export interface ConflictData {
  itemId: string;
  itemName: string;
  local: GroceryItem;
  remote: GroceryItem;
  timestamp: number;
}

/**
 * Field selection state for conflict resolution
 */
interface FieldSelection {
  name: 'local' | 'remote';
  quantity: 'local' | 'remote';
  category: 'local' | 'remote';
  notes: 'local' | 'remote';
  gotten: 'local' | 'remote';
}

/**
 * Props for ConflictResolutionModal
 */
export interface ConflictResolutionModalProps {
  /** Conflict to resolve */
  conflict: ConflictData;
  /** Callback when conflict is resolved */
  onResolve: (resolvedItem: GroceryItem) => void;
  /** Callback when resolution is cancelled */
  onCancel: () => void;
  /** Current user's name for display */
  currentUserName?: string;
  /** Remote user's name for display */
  remoteUserName?: string;
}

/**
 * ConflictResolutionModal Component
 *
 * Provides a detailed interface for manually resolving conflicts between
 * local and remote versions of a grocery item:
 * - Side-by-side comparison of all fields
 * - Field-level selection with radio buttons
 * - Visual diff highlighting
 * - Live preview of merged result
 * - Quick resolution buttons (use all mine/theirs)
 * - Mobile-responsive layout
 * - Keyboard shortcuts (Enter to apply, Escape to cancel)
 *
 * @example
 * ```tsx
 * <ConflictResolutionModal
 *   conflict={conflict}
 *   onResolve={handleResolve}
 *   onCancel={handleCancel}
 *   currentUserName="John"
 *   remoteUserName="Jane"
 * />
 * ```
 */
export function ConflictResolutionModal({
  conflict,
  onResolve,
  onCancel,
  currentUserName = 'You',
  remoteUserName = 'Other User',
}: ConflictResolutionModalProps) {
  // Field selection state - default to remote (newest) version
  const [selection, setSelection] = useState<FieldSelection>({
    name: 'remote',
    quantity: 'remote',
    category: 'remote',
    notes: 'remote',
    gotten: 'remote',
  });

  // Track if user has made any manual selections
  const [_hasManualSelection, setHasManualSelection] = useState(false);

  /**
   * Checks if a field has differences between local and remote
   */
  const hasFieldDifference = (field: keyof FieldSelection): boolean => {
    return conflict.local[field] !== conflict.remote[field];
  };

  /**
   * Gets the merged item based on current field selections
   */
  const mergedItem = useMemo<GroceryItem>(() => {
    return {
      id: conflict.itemId,
      name: selection.name === 'local' ? conflict.local.name : conflict.remote.name,
      quantity: selection.quantity === 'local' ? conflict.local.quantity : conflict.remote.quantity,
      category: selection.category === 'local' ? conflict.local.category : conflict.remote.category,
      notes: selection.notes === 'local' ? conflict.local.notes : conflict.remote.notes,
      gotten: selection.gotten === 'local' ? conflict.local.gotten : conflict.remote.gotten,
      userId: conflict.remote.userId, // Preserve remote user info
      listId: conflict.remote.listId,
      createdAt: conflict.local.createdAt,
    };
  }, [selection, conflict]);

  /**
   * Handles field selection change
   */
  const handleFieldSelection = (field: keyof FieldSelection, source: 'local' | 'remote') => {
    setSelection(prev => ({ ...prev, [field]: source }));
    setHasManualSelection(true);
  };

  /**
   * Selects all local (your) changes
   */
  const handleUseAllMine = () => {
    setSelection({
      name: 'local',
      quantity: 'local',
      category: 'local',
      notes: 'local',
      gotten: 'local',
    });
    setHasManualSelection(true);
  };

  /**
   * Selects all remote (their) changes
   */
  const handleUseAllTheirs = () => {
    setSelection({
      name: 'remote',
      quantity: 'remote',
      category: 'remote',
      notes: 'remote',
      gotten: 'remote',
    });
    setHasManualSelection(true);
  };

  /**
   * Applies the resolution
   */
  const handleApplyResolution = () => {
    onResolve(mergedItem);
  };

  /**
   * Handles clicking outside modal to close
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  /**
   * Gets initials for avatar display
   */
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        handleApplyResolution();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, mergedItem]);

  /**
   * Renders a field comparison row
   */
  const renderFieldComparison = (
    field: keyof FieldSelection,
    label: string,
    localValue: any,
    remoteValue: any,
    formatValue?: (value: any) => string
  ) => {
    const isDifferent = hasFieldDifference(field);
    const formatter = formatValue || ((v: any) => String(v));

    return (
      <div className={`conflict-field ${isDifferent ? 'field-different' : 'field-same'}`}>
        <div className="field-label">{label}</div>
        <div className="field-comparison">
          {/* Local Version */}
          <div className={`field-version field-local ${selection[field] === 'local' ? 'version-selected' : ''}`}>
            <div className="version-header">
              <div className="version-avatar local-avatar">{getInitials(currentUserName)}</div>
              <div className="version-info">
                <div className="version-title">Your Changes</div>
                <div className="version-subtitle">{currentUserName}</div>
              </div>
              <input
                type="radio"
                name={`field-${field}`}
                checked={selection[field] === 'local'}
                onChange={() => handleFieldSelection(field, 'local')}
                className="version-radio"
                aria-label={`Select your ${label.toLowerCase()}`}
              />
            </div>
            <div className={`field-value ${isDifferent ? 'value-changed' : ''}`}>
              {formatter(localValue)}
            </div>
          </div>

          {/* Remote Version */}
          <div className={`field-version field-remote ${selection[field] === 'remote' ? 'version-selected' : ''}`}>
            <div className="version-header">
              <div className="version-avatar remote-avatar">{getInitials(remoteUserName)}</div>
              <div className="version-info">
                <div className="version-title">Their Changes</div>
                <div className="version-subtitle">{remoteUserName}</div>
              </div>
              <input
                type="radio"
                name={`field-${field}`}
                checked={selection[field] === 'remote'}
                onChange={() => handleFieldSelection(field, 'remote')}
                className="version-radio"
                aria-label={`Select their ${label.toLowerCase()}`}
              />
            </div>
            <div className={`field-value ${isDifferent ? 'value-changed' : ''}`}>
              {formatter(remoteValue)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="conflict-modal-overlay" onClick={handleOverlayClick}>
      <div className="conflict-modal-content" role="dialog" aria-labelledby="conflict-modal-title">
        {/* Header */}
        <div className="conflict-modal-header">
          <div className="conflict-header-content">
            <h2 id="conflict-modal-title">Resolve Conflict</h2>
            <div className="conflict-item-name">{conflict.itemName}</div>
          </div>
          <button
            className="conflict-modal-close"
            onClick={onCancel}
            aria-label="Cancel and close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Instructions */}
        <div className="conflict-instructions">
          <div className="instruction-icon">⚠️</div>
          <div className="instruction-text">
            <strong>Conflict detected!</strong> The item "{conflict.itemName}" was modified both locally and remotely.
            Choose which version to keep for each field, or use the quick actions below.
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="conflict-quick-actions">
          <button
            type="button"
            className="btn btn-quick-action btn-use-mine"
            onClick={handleUseAllMine}
            aria-label="Use all your changes"
          >
            <span className="quick-action-icon">👤</span>
            <span className="quick-action-text">Use All Mine</span>
          </button>
          <button
            type="button"
            className="btn btn-quick-action btn-use-theirs"
            onClick={handleUseAllTheirs}
            aria-label="Use all their changes"
          >
            <span className="quick-action-icon">👥</span>
            <span className="quick-action-text">Use All Theirs</span>
          </button>
        </div>

        {/* Field Comparisons */}
        <div className="conflict-fields">
          {renderFieldComparison(
            'name',
            'Item Name',
            conflict.local.name,
            conflict.remote.name
          )}

          {renderFieldComparison(
            'quantity',
            'Quantity',
            conflict.local.quantity,
            conflict.remote.quantity,
            (v) => `×${v}`
          )}

          {renderFieldComparison(
            'category',
            'Category',
            conflict.local.category,
            conflict.remote.category,
            (v: Category) => v
          )}

          {renderFieldComparison(
            'notes',
            'Notes',
            conflict.local.notes,
            conflict.remote.notes,
            (v) => v || '(no notes)'
          )}

          {renderFieldComparison(
            'gotten',
            'Status',
            conflict.local.gotten,
            conflict.remote.gotten,
            (v) => v ? 'Checked ✓' : 'Unchecked'
          )}
        </div>

        {/* Preview Section */}
        <div className="conflict-preview">
          <h3 className="preview-title">Preview Merged Result</h3>
          <div className="preview-content">
            <div className="preview-item">
              <div className="preview-field">
                <span className="preview-label">Name:</span>
                <span className="preview-value">{mergedItem.name}</span>
              </div>
              <div className="preview-field">
                <span className="preview-label">Quantity:</span>
                <span className="preview-value">×{mergedItem.quantity}</span>
              </div>
              <div className="preview-field">
                <span className="preview-label">Category:</span>
                <span className={`preview-value category-badge category-${mergedItem.category.toLowerCase()}`}>
                  {mergedItem.category}
                </span>
              </div>
              {mergedItem.notes && (
                <div className="preview-field">
                  <span className="preview-label">Notes:</span>
                  <span className="preview-value">{mergedItem.notes}</span>
                </div>
              )}
              <div className="preview-field">
                <span className="preview-label">Status:</span>
                <span className={`preview-value status-badge ${mergedItem.gotten ? 'status-gotten' : 'status-pending'}`}>
                  {mergedItem.gotten ? 'Checked ✓' : 'Unchecked'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="conflict-modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-apply"
            onClick={handleApplyResolution}
          >
            Apply Resolution
          </button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="conflict-shortcuts">
          <span className="shortcut-hint">
            <kbd>Esc</kbd> to cancel
          </span>
          <span className="shortcut-hint">
            <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd> to apply
          </span>
        </div>
      </div>
    </div>
  );
}
