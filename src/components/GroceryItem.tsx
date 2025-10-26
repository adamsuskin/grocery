import { useState } from 'react';
import type { GroceryItem as GroceryItemType } from '../types';
import { useGroceryMutations } from '../hooks/useGroceryItems';

interface GroceryItemProps {
  item: GroceryItemType;
}

export function GroceryItem({ item }: GroceryItemProps) {
  const { markItemGotten, deleteItem } = useGroceryMutations();
  const [showNotes, setShowNotes] = useState(false);

  const handleToggleGotten = () => {
    markItemGotten(item.id, !item.gotten);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${item.name}"?`)) {
      deleteItem(item.id);
    }
  };

  return (
    <div className={`grocery-item ${item.gotten ? 'gotten' : ''}`}>
      <div className="item-content">
        <input
          type="checkbox"
          checked={item.gotten}
          onChange={handleToggleGotten}
          className="checkbox"
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
        </div>
        <span className="item-quantity">×{item.quantity}</span>
      </div>
      {item.notes && showNotes && (
        <div className={`notes-content ${showNotes ? 'notes-expanded' : ''}`}>
          {item.notes}
        </div>
      )}
      <button onClick={handleDelete} className="btn btn-delete" aria-label="Delete item">
        🗑️
      </button>
    </div>
  );
}
