import { useState } from 'react';
import type { BulkOperationsProps } from '../types';

export function BulkOperations({
  itemCount,
  gottenCount,
  onMarkAllGotten,
  onDeleteAllGotten,
  disabled = false
}: BulkOperationsProps) {
  const [showMarkConfirm, setShowMarkConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const ungottenCount = itemCount - gottenCount;

  const handleMarkAllGotten = () => {
    onMarkAllGotten();
    setShowMarkConfirm(false);
  };

  const handleDeleteAllGotten = () => {
    onDeleteAllGotten();
    setShowDeleteConfirm(false);
  };

  // Don't show bulk operations if there are no items
  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="bulk-operations">
      <h3>Bulk Actions</h3>
      <div className="bulk-operations-buttons">
        <button
          className="bulk-btn bulk-btn-mark"
          onClick={() => setShowMarkConfirm(true)}
          disabled={disabled || ungottenCount === 0}
          title={
            disabled
              ? 'View-only access'
              : ungottenCount === 0
              ? 'All items already marked'
              : `Mark ${ungottenCount} items as gotten`
          }
        >
          ✓ Mark All Gotten ({ungottenCount})
        </button>

        <button
          className="bulk-btn bulk-btn-delete"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={disabled || gottenCount === 0}
          title={
            disabled
              ? 'View-only access'
              : gottenCount === 0
              ? 'No gotten items to delete'
              : `Delete ${gottenCount} gotten items`
          }
        >
          🗑️ Delete All Gotten ({gottenCount})
        </button>
      </div>

      {/* Mark All Confirmation Dialog */}
      {showMarkConfirm && (
        <div className="confirmation-overlay" onClick={() => setShowMarkConfirm(false)}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Mark All as Gotten?</h4>
            <p>This will mark {ungottenCount} item{ungottenCount !== 1 ? 's' : ''} as gotten.</p>
            <div className="confirmation-buttons">
              <button
                className="confirm-btn confirm-yes"
                onClick={handleMarkAllGotten}
              >
                Yes, Mark All
              </button>
              <button
                className="confirm-btn confirm-no"
                onClick={() => setShowMarkConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="confirmation-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Delete All Gotten Items?</h4>
            <p>This will permanently delete {gottenCount} gotten item{gottenCount !== 1 ? 's' : ''}.</p>
            <p className="warning-text">⚠️ This action cannot be undone.</p>
            <div className="confirmation-buttons">
              <button
                className="confirm-btn confirm-yes confirm-danger"
                onClick={handleDeleteAllGotten}
              >
                Yes, Delete All
              </button>
              <button
                className="confirm-btn confirm-no"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
