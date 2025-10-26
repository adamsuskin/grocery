import { Zero } from '@rocicorp/zero';
import { useQuery } from '@rocicorp/zero/react';
import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { schema, type Schema } from './zero-schema';
import type { GroceryItem, FilterState, SortState } from './types';

// Create singleton Zero instance
export const zeroInstance = new Zero<Schema>({
  userID: 'demo-user', // For now, since we don't have auth yet
  auth: '', // Empty for now
  server: import.meta.env.VITE_ZERO_SERVER || 'http://localhost:4848',
  schema,
  kvStore: 'idb', // IndexedDB persistence
});

// React hook to get all grocery items with optional filtering and sorting
export function useGroceryItems(filters?: FilterState, sort?: SortState) {
  const query = useQuery(zeroInstance.query.grocery_items);

  // Map to application types (no initial sorting)
  const allItems: GroceryItem[] = query.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    gotten: item.gotten,
    category: item.category as GroceryItem['category'],
    createdAt: item.createdAt,
  }));

  // Apply filters and sorting with memoization for performance
  const processedItems = useMemo(() => {
    let items = allItems;

    // Apply filters
    if (filters) {
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

      // Filter by categories (show only selected categories)
      if (filters.categories && filters.categories.length > 0) {
        items = items.filter(item => filters.categories.includes(item.category));
      }
    }

    // Apply sorting
    if (sort) {
      items = [...items].sort((a, b) => {
        let comparison = 0;

        switch (sort.field) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'quantity':
            comparison = a.quantity - b.quantity;
            break;
          case 'date':
            comparison = a.createdAt - b.createdAt;
            break;
        }

        return sort.direction === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default sort: newest first
      items = [...items].sort((a, b) => b.createdAt - a.createdAt);
    }

    return items;
  }, [allItems, filters, sort]);

  return processedItems;
}

// React hook for grocery mutations
export function useGroceryMutations() {
  const addItem = async (name: string, quantity: number, category: string): Promise<string> => {
    const id = nanoid();
    await zeroInstance.mutate.grocery_items.create({
      id,
      name,
      quantity,
      gotten: false,
      category,
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

  const markAllGotten = async (items: GroceryItem[]): Promise<void> => {
    // Update all items that aren't already marked as gotten
    const updatePromises = items
      .filter(item => !item.gotten)
      .map(item => zeroInstance.mutate.grocery_items.update({
        id: item.id,
        gotten: true,
      }));

    await Promise.all(updatePromises);
  };

  const deleteAllGotten = async (items: GroceryItem[]): Promise<void> => {
    // Delete all items that are marked as gotten
    const deletePromises = items
      .filter(item => item.gotten)
      .map(item => zeroInstance.mutate.grocery_items.delete({ id: item.id }));

    await Promise.all(deletePromises);
  };

  return {
    addItem,
    markItemGotten,
    deleteItem,
    markAllGotten,
    deleteAllGotten,
  };
}
