import { useState, memo } from 'react';
import type { GroceryItem as GroceryItemType } from '../types';
import { useGroceryMutations } from '../hooks/useGroceryItems';

interface GroceryItemProps {
  item: GroceryItemType;
  canEdit: boolean;
}

export const GroceryItem = memo(function GroceryItem({ item, canEdit }: GroceryItemProps) {
  const { markItemGotten, deleteItem } = useGroceryMutations();
  const [showNotes, setShowNotes] = useState(false);

  const handleToggleGotten = () => {
    if (!canEdit) return;
    markItemGotten(item.id, !item.gotten);
  };

  const handleDelete = () => {
    if (!canEdit) return;
    if (confirm(`Delete "${item.name}"?`)) {
      deleteItem(item.id);
    }
  };

  return (
    <div className={`grocery-item ${item.gotten ? 'gotten' : ''} ${!canEdit ? 'read-only' : ''}`}>
      <div className="item-content">
        <input
          type="checkbox"
          checked={item.gotten}
          onChange={handleToggleGotten}
          className="checkbox"
          disabled={!canEdit}
          title={!canEdit ? 'View-only access' : ''}
        />
        <div className="item-details">
          <span className="item-name">{item.name}</span>
          <span className={`category-badge category-${item.category.toLowerCase()}`}>
            {item.category}
          </span>
          {item.notes && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="notes-toggle"
              aria-label="Toggle notes"
            >
              {showNotes ? '📝' : '📋'}
            </button>
          )}
          {!canEdit && (
            <span className="read-only-badge" title="View-only access">
              👁️
            </span>
          )}
        </div>
        <span className="item-quantity">×{item.quantity}</span>
      </div>
      {item.notes && showNotes && (
        <div className={`notes-content ${showNotes ? 'notes-expanded' : ''}`}>
          {item.notes}
        </div>
      )}
      <button
        onClick={handleDelete}
        className="btn btn-delete"
        aria-label="Delete item"
        disabled={!canEdit}
        title={!canEdit ? 'View-only access' : 'Delete item'}
      >
        🗑️
      </button>
    </div>
  );
});
