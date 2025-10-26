# 🛒 Grocery List App

A collaborative grocery list application built with React, TypeScript, and Vite. Features real-time synchronization across devices and users using Zero.

## Features

- ✅ **Add Items**: Add grocery items with name and quantity
- ✅ **Mark as Gotten**: Toggle items as gotten/not gotten
- ✅ **Delete Items**: Remove items from the list
- ✅ **View List**: See all items sorted by creation time (newest first)
- 🔍 **Search**: Search for items by name with real-time filtering
- 🎛️ **Filter**: Toggle visibility of gotten items
- 📊 **Results Counter**: See the number of items matching your filters
- 🔄 **Real-time Sync**: Changes sync automatically across all devices and users
- 💾 **Persistent**: Data stored in PostgreSQL with local caching
- 📱 **Responsive**: Works on desktop and mobile
- 🔌 **Offline Support**: Works offline and syncs when reconnected

## Tech Stack

- **TypeScript**: Type-safe JavaScript
- **React 18**: UI framework with hooks
- **Vite**: Fast build tool and dev server
- **pnpm**: Efficient package manager
- **Zero**: Real-time sync and collaboration framework
- **PostgreSQL**: Database backend for Zero
- **zero-cache**: Local caching server for offline support

## Project Structure

```
grocery/
├── src/
│   ├── components/
│   │   ├── AddItemForm.tsx      # Form to add new items
│   │   ├── GroceryItem.tsx      # Single item display
│   │   └── GroceryList.tsx      # List of all items
│   ├── hooks/
│   │   └── useGroceryItems.ts   # Custom hooks for items
│   ├── types.ts                  # TypeScript type definitions
│   ├── store.ts                  # Data store with sync
│   ├── App.tsx                   # Main app component
│   ├── App.css                   # App styles
│   ├── main.tsx                  # App entry point
│   └── index.css                 # Global styles
├── specs/
│   └── requirements.md           # Detailed requirements
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## Real-Time Sync with Zero

This application uses [Zero](https://zero.rocicorp.dev/) for real-time collaborative synchronization across multiple devices and users. Zero provides:

- **Real-time Sync**: Changes propagate instantly across all connected clients
- **Offline Support**: Works offline and automatically syncs when reconnected
- **Conflict Resolution**: Handles concurrent edits gracefully
- **Type Safety**: Fully typed queries with TypeScript
- **Local-First**: Fast, responsive UI with local caching via zero-cache

Zero replaces the localStorage-based sync with a robust, production-ready synchronization system backed by PostgreSQL.

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm (install with `npm install -g pnpm`)
- Docker and Docker Compose (for PostgreSQL)

### Setup Steps

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start PostgreSQL database:
   ```bash
   docker compose up -d
   ```
   This starts a PostgreSQL container for Zero's backend storage.

3. Start zero-cache server:
   ```bash
   pnpm zero:dev
   ```
   The zero-cache server handles real-time sync between clients and the database.

4. In a separate terminal, start the development server:
   ```bash
   pnpm dev
   ```

5. Open your browser to `http://localhost:3000`

**Quick Start (All-in-One):**
```bash
pnpm dev:full
```
This command starts PostgreSQL, zero-cache, and the Vite dev server all at once.

### Available Scripts

- `pnpm dev` - Start Vite development server only
- `pnpm dev:full` - Start PostgreSQL, zero-cache, and Vite dev server
- `pnpm zero:dev` - Start zero-cache server only
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm type-check` - Run TypeScript type checking

## Usage

### Adding Items

1. Enter the item name in the text field
2. Enter the quantity (default is 1)
3. Click "Add Item"

### Marking Items as Gotten

Click the checkbox next to an item to toggle its "gotten" status. Gotten items will have a strikethrough style.

### Deleting Items

Click the trash icon (🗑️) next to an item to delete it. A confirmation dialog will appear.

### Search and Filter

The app includes powerful search and filter capabilities to help you quickly find items:

**Search by Name:**
- Type in the search box at the top of the list to filter items by name
- Search is case-insensitive and matches partial names
- Results update in real-time as you type (debounced for performance)
- Clear the search box to show all items again

**Show/Hide Gotten Items:**
- Use the "Hide gotten items" toggle to filter out items you've already gotten
- Checked: Only shows items that haven't been gotten yet
- Unchecked: Shows all items (both gotten and not gotten)

**Filter Combinations:**
- Search and the gotten items filter work together
- For example, you can search for "apple" while hiding gotten items to find only apples you still need to buy
- The results counter shows how many items match your current filters (e.g., "Showing 3 of 10 items")

**Results Counter:**
- Displays at the top of the list when filters are active
- Shows the number of visible items vs. total items
- Updates automatically as you add, remove, or modify items
- Helps you quickly see how many items match your search and filter criteria

### Real-Time Collaboration

Open the app in multiple browser tabs or on different devices and watch changes sync in real-time! All users see updates instantly thanks to Zero's real-time synchronization.

## Implementation Notes

The app uses Zero for real-time collaborative synchronization, providing:

- ✅ Local-first architecture with zero-cache
- ✅ Real-time sync across devices and users
- ✅ Offline-first with automatic sync when reconnected
- ✅ Type-safe queries with TypeScript
- ✅ Conflict-free collaborative editing
- ✅ PostgreSQL backend for persistence

## Data Schema

```typescript
interface GroceryItem {
  id: string;          // UUID
  name: string;        // Item name
  quantity: number;    // Quantity to buy
  gotten: boolean;     // Whether item is gotten
  createdAt: number;   // Timestamp
}
```

## Browser Compatibility

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Opera: ✅

Requires modern browser with WebSocket support for real-time sync.

## License

MIT

## Contributing

Feel free to submit issues and pull requests!