# 🛒 Grocery List App

A collaborative grocery list application built with React, TypeScript, and Vite. Features real-time synchronization across browser tabs using localStorage events.

## Features

- ✅ **Add Items**: Add grocery items with name and quantity
- ✅ **Mark as Gotten**: Toggle items as gotten/not gotten
- ✅ **Delete Items**: Remove items from the list
- ✅ **View List**: See all items sorted by creation time (newest first)
- 🔄 **Real-time Sync**: Changes sync automatically across browser tabs
- 💾 **Persistent**: Data saved to localStorage
- 📱 **Responsive**: Works on desktop and mobile

## Tech Stack

- **TypeScript**: Type-safe JavaScript
- **React 18**: UI framework with hooks
- **Vite**: Fast build tool and dev server
- **pnpm**: Efficient package manager
- **localStorage**: Local data persistence
- **Storage Events**: Cross-tab synchronization

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

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (install with `npm install -g pnpm`)

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Open your browser to `http://localhost:3000`

### Available Scripts

- `pnpm dev` - Start development server
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

### Cross-Tab Sync

Open the app in multiple browser tabs and watch changes sync in real-time!

## Implementation Notes

### Current Implementation

The app currently uses `localStorage` for data persistence and the Storage Events API for cross-tab synchronization. This provides:

- ✅ Local-first architecture
- ✅ Real-time sync across tabs
- ✅ No server required
- ✅ Offline-first by default

### Future Enhancements

The architecture is designed to support adding Zero/Replicache for true collaborative sync:

1. **Zero Integration**: The original plan included @rocicorp/zero for sync
2. **Schema Ready**: Database schema and types are defined in `schema.sql` and `types.ts`
3. **Kysely Support**: Type-safe SQL query builder is included in dependencies
4. **Server Sync**: Can be enhanced to sync across devices/users with a sync server

To upgrade to Zero:
- Implement Zero client and schema
- Replace `store.ts` with Zero mutations
- Add Zero server configuration
- Keep the same React component structure

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

Requires localStorage and Storage Events API support.

## License

MIT

## Contributing

Feel free to submit issues and pull requests!