// Database types
export interface Database {
  grocery_items: GroceryItemTable;
}

export interface GroceryItemTable {
  id: string;
  name: string;
  quantity: number;
  gotten: number; // SQLite uses INTEGER for boolean (0 = false, 1 = true)
  created_at: number;
}

// Application types (with proper boolean)
export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  gotten: boolean;
  createdAt: number;
}

// Input types for mutations
export interface AddItemInput {
  name: string;
  quantity: number;
}

export interface UpdateItemInput {
  id: string;
  gotten: boolean;
}
