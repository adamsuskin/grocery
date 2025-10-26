import { useGroceryItems } from '../hooks/useGroceryItems';
import { GroceryItem } from './GroceryItem';

export function GroceryList() {
  const items = useGroceryItems();

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No items in your grocery list yet.</p>
        <p>Add your first item above!</p>
      </div>
    );
  }

  return (
    <div className="grocery-list">
      {items.map((item) => (
        <GroceryItem key={item.id} item={item} />
      ))}
    </div>
  );
}
