// Category types
export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Pantry',
  'Frozen',
  'Beverages',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

// Database types
export interface Database {
  grocery_items: GroceryItemTable;
}

export interface GroceryItemTable {
  id: string;
  name: string;
  quantity: number;
  gotten: number; // SQLite uses INTEGER for boolean (0 = false, 1 = true)
  category: string;
  created_at: number;
}

// Application types (with proper boolean)
export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  gotten: boolean;
  category: Category;
  createdAt: number;
}

// Input types for mutations
export interface AddItemInput {
  name: string;
  quantity: number;
  category: Category;
}

export interface UpdateItemInput {
  id: string;
  gotten: boolean;
}

// Filter types
export interface FilterState {
  searchText: string;
  showGotten: boolean;
  categories: Category[];
}

export interface FilterOptions {
  searchText?: string;
  showGotten?: boolean;
  categories?: Category[];
}

export type FilterChangeHandler = (filters: Partial<FilterState>) => void;

export interface FilterBarProps {
  filters: FilterState;
  onChange: FilterChangeHandler;
  totalCount: number;
  filteredCount: number;
}

// Sort types
export type SortField = 'name' | 'quantity' | 'date';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export type SortChangeHandler = (sort: SortState) => void;

export interface SortControlsProps {
  sort: SortState;
  onChange: SortChangeHandler;
}

// Bulk operation types
export interface BulkOperationsProps {
  itemCount: number;
  gottenCount: number;
  onMarkAllGotten: () => Promise<void>;
  onDeleteAllGotten: () => Promise<void>;
}
