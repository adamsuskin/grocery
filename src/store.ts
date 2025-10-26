import { useState, useEffect } from 'react';
import type { GroceryItem } from './types';

const STORAGE_KEY = 'grocery-items';

// Generate UUID v4
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Simple event emitter for cross-tab sync
const storageEventTarget = new EventTarget();

export class GroceryStore {
  private items: Map<string, GroceryItem> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
    // Listen for changes from other tabs
    window.addEventListener('storage', this.handleStorageChange);
    storageEventTarget.addEventListener('update', this.handleCustomUpdate as EventListener);
  }

  private handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      this.load();
      this.notifyListeners();
    }
  };

  private handleCustomUpdate = () => {
    this.load();
    this.notifyListeners();
  };

  private load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const items: GroceryItem[] = JSON.parse(stored);
        this.items = new Map(items.map((item) => [item.id, item]));
      } catch (e) {
        console.error('Failed to load items:', e);
      }
    }
  }

  private save() {
    const items = Array.from(this.items.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Notify other components in the same tab
    storageEventTarget.dispatchEvent(new Event('update'));
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  getItems(): GroceryItem[] {
    return Array.from(this.items.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  addItem(name: string, quantity: number, category: string = 'Other', notes: string = '', userId: string = 'demo-user', listId: string = ''): string {
    const id = generateId();
    const item: GroceryItem = {
      id,
      name,
      quantity,
      gotten: false,
      category: category as GroceryItem['category'],
      notes,
      userId,
      listId,
      createdAt: Date.now(),
    };
    this.items.set(id, item);
    this.save();
    this.notifyListeners();
    return id;
  }

  markItemGotten(id: string, gotten: boolean): void {
    const item = this.items.get(id);
    if (item) {
      this.items.set(id, { ...item, gotten });
      this.save();
      this.notifyListeners();
    }
  }

  deleteItem(id: string): void {
    this.items.delete(id);
    this.save();
    this.notifyListeners();
  }

  destroy() {
    window.removeEventListener('storage', this.handleStorageChange);
    storageEventTarget.removeEventListener('update', this.handleCustomUpdate as EventListener);
  }
}

// Singleton instance
let store: GroceryStore | null = null;

export function getStore(): GroceryStore {
  if (!store) {
    store = new GroceryStore();
  }
  return store;
}

// React hook to use the store
export function useGroceryStore() {
  const [items, setItems] = useState<GroceryItem[]>(() => getStore().getItems());

  useEffect(() => {
    const store = getStore();
    const unsubscribe = store.subscribe(() => {
      setItems(store.getItems());
    });

    return unsubscribe;
  }, []);

  return {
    items,
    addItem: (name: string, quantity: number, category?: string, notes?: string, userId?: string) => getStore().addItem(name, quantity, category, notes, userId),
    markItemGotten: (id: string, gotten: boolean) => getStore().markItemGotten(id, gotten),
    deleteItem: (id: string) => getStore().deleteItem(id),
  };
}
