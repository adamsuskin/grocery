import { useGroceryStore } from '../store';

// Hook to get all grocery items
export function useGroceryItems() {
  const { items } = useGroceryStore();
  return items;
}

// Hook for grocery item mutations
export function useGroceryMutations() {
  const { addItem, markItemGotten, deleteItem } = useGroceryStore();

  return {
    addItem,
    markItemGotten,
    deleteItem,
  };
}
