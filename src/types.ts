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
  notes: string;
  user_id: string;
  created_at: number;
}

// Application types (with proper boolean)
export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  gotten: boolean;
  category: Category;
  notes: string;
  userId: string;
  createdAt: number;
}

// Input types for mutations
export interface AddItemInput {
  name: string;
  quantity: number;
  category: Category;
  notes: string;
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

// Authentication types

/**
 * Represents a user in the system
 */
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}

/**
 * Authentication state for the application
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: AuthError | null;
}

/**
 * Credentials required for user login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Credentials required for user registration
 */
export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

/**
 * Authentication error with code and message
 */
export interface AuthError {
  code: string;
  message: string;
}

/**
 * Response from authentication endpoints
 */
export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Authentication context type for React context
 */
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}
