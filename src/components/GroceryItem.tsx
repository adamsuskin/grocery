import type { GroceryItem as GroceryItemType } from '../types';
import { useGroceryMutations } from '../hooks/useGroceryItems';

interface GroceryItemProps {
  item: GroceryItemType;
}

export function GroceryItem({ item }: GroceryItemProps) {
  const { markItemGotten, deleteItem } = useGroceryMutations();

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
        </div>
        <span className="item-quantity">×{item.quantity}</span>
      </div>
      <button onClick={handleDelete} className="btn btn-delete" aria-label="Delete item">
        🗑️
      </button>
    </div>
  );
}
