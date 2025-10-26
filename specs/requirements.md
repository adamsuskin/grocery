# Grocery List App Requirements

## Overview
A collaborative grocery list application that allows multiple users to manage a shared grocery list in real-time.

## Key Features

### 1. Add Item
- User can add a new grocery item
- Each item has:
  - Name (string, required)
  - Quantity (number, required)
  - Gotten status (boolean, default: false)
  - ID (auto-generated UUID)
  - Created timestamp

### 2. Mark Item as Gotten
- User can toggle the "gotten" status of an item
- Visual indication when item is marked as gotten
- Does not remove item from list

### 3. Delete Item
- User can permanently remove an item from the list
- Confirmation may be needed for safety

### 4. View List of Items
- Display all grocery items
- Show item name, quantity, and gotten status
- Sort by creation time (newest first)
- Real-time updates when other users make changes

## Technologies

### Frontend
- **TypeScript**: Type-safe JavaScript
- **React**: UI framework
- **Vite**: Build tool and dev server
- **pnpm**: Package manager

### Backend/Data
- **Zero**: Real-time sync framework from Rocicorp
- **SQLite**: Local database
- **Kysely**: Type-safe SQL query builder

## Data Schema

```sql
CREATE TABLE grocery_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  gotten INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
```

## Architecture

1. **Local-First**: Data stored locally in SQLite
2. **Real-Time Sync**: Zero handles synchronization between clients
3. **Type Safety**: Kysely provides typed queries, TypeScript ensures type safety throughout
4. **Reactive UI**: React components automatically update when data changes
