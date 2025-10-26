import { Zero } from '@rocicorp/zero';
import { useQuery } from '@rocicorp/zero/react';
import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { schema, type Schema } from './zero-schema';
import type { GroceryItem, FilterState } from './types';

// Create singleton Zero instance
export const zeroInstance = new Zero<Schema>({
  userID: 'demo-user', // For now, since we don't have auth yet
  auth: '', // Empty for now
  server: import.meta.env.VITE_ZERO_SERVER || 'http://localhost:4848',
  schema,
  kvStore: 'idb', // IndexedDB persistence
});

// React hook to get all grocery items with optional filtering
export function useGroceryItems(filters?: FilterState) {
  const query = useQuery(zeroInstance.query.grocery_items);

  // Sort by createdAt descending and map to application types
  const allItems: GroceryItem[] = query
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      gotten: item.gotten,
      createdAt: item.createdAt,
    }));

  // Apply filters with memoization for performance
  const filteredItems = useMemo(() => {
    if (!filters) {
      return allItems;
    }

    let items = allItems;

    // Filter by gotten status
    if (!filters.showGotten) {
      items = items.filter(item => !item.gotten);
    }

    // Filter by search text
    if (filters.searchText.trim() !== '') {
      const searchLower = filters.searchText.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    return items;
  }, [allItems, filters]);

  return filteredItems;
}

// React hook for grocery mutations
export function useGroceryMutations() {
  const addItem = async (name: string, quantity: number): Promise<string> => {
    const id = nanoid();
    await zeroInstance.mutate.grocery_items.create({
      id,
      name,
      quantity,
      gotten: false,
      createdAt: Date.now(),
    });
    return id;
  };

  const markItemGotten = async (id: string, gotten: boolean): Promise<void> => {
    await zeroInstance.mutate.grocery_items.update({
      id,
      gotten,
    });
  };

  const deleteItem = async (id: string): Promise<void> => {
    await zeroInstance.mutate.grocery_items.delete({ id });
  };

  return {
    addItem,
    markItemGotten,
    deleteItem,
  };
}
