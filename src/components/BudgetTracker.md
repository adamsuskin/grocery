# BudgetTracker Component

A comprehensive React component for tracking and managing budget information for grocery lists. Provides real-time spending visualization, budget alerts, and detailed price statistics.

## Features

### Core Features
1. **Total Budget Display** - Shows the total budget set for the list
2. **Current Spending** - Calculates and displays the sum of all item prices
3. **Remaining Budget** - Shows how much budget is left or overspent
4. **Progress Bar** - Visual indicator of budget usage with color-coding
5. **Budget Status Alerts** - Highlights when over budget (red) or near budget (yellow, >80%)
6. **Percentage Display** - Shows the exact percentage of budget used
7. **Item Price Status** - Displays count of items with and without prices
8. **Price Statistics** - Shows average, minimum, and maximum prices
9. **View Toggle** - Compact and expanded view modes
10. **Edge Case Handling** - Properly handles missing budgets and prices

### Visual States

- **Within Budget** (< 80%) - Green border and progress bar
- **Near Budget** (80-100%) - Yellow/orange border and progress bar
- **Over Budget** (> 100%) - Red border and progress bar

## Props

```typescript
interface BudgetTrackerProps {
  items: GroceryItem[];           // Array of grocery items
  budget?: number;                // Total budget amount (optional)
  currency?: string;              // Currency symbol (default: '$')
  onUpdateBudget?: (budget: number) => void;  // Callback for budget updates
}
```

### Prop Details

#### `items` (required)
- Type: `GroceryItem[]`
- Description: Array of grocery items to track
- Note: Items should have a `price` property (even if optional in the type)

#### `budget` (optional)
- Type: `number`
- Description: Total budget amount
- Default: `undefined` (shows "Budget not set" message)

#### `currency` (optional)
- Type: `string`
- Description: Currency symbol to display
- Default: `'$'`
- Examples: `'$'`, `'€'`, `'£'`, `'¥'`

#### `onUpdateBudget` (optional)
- Type: `(budget: number) => void`
- Description: Callback function when budget is updated
- Note: If not provided, the budget edit button won't be shown

## Usage

### Basic Usage

```tsx
import { BudgetTracker } from './components/BudgetTracker';

function MyGroceryList() {
  const [budget, setBudget] = useState(100);
  const items = [...]; // Your grocery items

  return (
    <BudgetTracker
      items={items}
      budget={budget}
      currency="$"
      onUpdateBudget={setBudget}
    />
  );
}
```

### Without Budget (Shows "Set Budget" Prompt)

```tsx
<BudgetTracker
  items={items}
  onUpdateBudget={handleSetBudget}
/>
```

### Read-Only Mode (No Budget Updates)

```tsx
<BudgetTracker
  items={items}
  budget={50}
  currency="€"
/>
```

### With Different Currency

```tsx
<BudgetTracker
  items={items}
  budget={5000}
  currency="¥"
  onUpdateBudget={handleBudgetUpdate}
/>
```

## Price Field Requirement

The component expects items to have a `price` field. Since the default `GroceryItem` type doesn't include this, you have several options:

### Option 1: Extend the Type

```typescript
interface GroceryItemWithPrice extends GroceryItem {
  price?: number;
}

const items: GroceryItemWithPrice[] = [...];
```

### Option 2: Update the Base Type

In `src/types.ts`:

```typescript
export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  gotten: boolean;
  category: Category;
  notes: string;
  userId: string;
  listId: string;
  createdAt: number;
  price?: number;  // Add this field
}
```

### Option 3: Database Schema Update

Add a `price` column to your grocery_items table:

```sql
ALTER TABLE grocery_items ADD COLUMN price REAL DEFAULT NULL;
```

## Calculations

### Total Spending
```
totalSpending = sum(item.price * item.quantity) for all items
```

### Remaining Budget
```
remaining = budget - totalSpending
```

### Percentage Used
```
percentageUsed = (totalSpending / budget) * 100
```

### Price Statistics
- **Average**: Mean price of all items with prices
- **Min**: Lowest item price
- **Max**: Highest item price

## Component Structure

### Compact View (Default)
- Budget icon with status indicator
- Current spending / Total budget
- Remaining amount or overspent amount
- Percentage used
- Expand/collapse button
- Progress bar

### Expanded View
Includes everything from compact view plus:
- Budget editor (if `onUpdateBudget` provided)
- Spending overview breakdown
- Item price status (items with/without prices)
- Price statistics (avg, min, max)
- Warning and info alerts

## Styling

The component uses CSS classes with the `budget-` prefix. All styles are in `BudgetTracker.css`.

### CSS Variables Used
- `--card-bg` - Background color
- `--border-color` - Border color
- `--primary-color` - Success/on-track color
- `--danger-color` - Over budget color
- `--text-color` - Primary text color
- `--text-muted` - Secondary text color

### Custom Styling

You can override styles by targeting the classes:

```css
.budget-tracker {
  /* Custom styles */
}

.budget-tracker.over-budget {
  /* Styles when over budget */
}
```

## Accessibility

### Keyboard Navigation
- Expand/collapse button is keyboard accessible
- Budget input supports Enter (save) and Escape (cancel)
- All interactive elements are focusable

### ARIA Attributes
- Progress bar has proper `role="progressbar"` and `aria-*` attributes
- Buttons have descriptive `aria-label` attributes
- Form inputs have proper labeling

### Screen Reader Support
- Status messages are announced
- Budget changes are clear and descriptive
- Warnings and alerts are properly conveyed

### Responsive Design
- Fully responsive on all screen sizes
- Mobile-optimized layout (< 600px)
- Touch-friendly tap targets

### Reduced Motion
- Respects `prefers-reduced-motion` media query
- Disables animations when requested

### High Contrast Mode
- Supports `prefers-contrast: high`
- Increased border widths for visibility

## Examples

See `BudgetTracker.example.tsx` for comprehensive usage examples including:
- Basic usage with budget set
- No budget set
- Near budget limit (>80%)
- Over budget
- Different currencies
- Empty items list
- Integration with parent components

## Edge Cases Handled

1. **No Budget Set** - Shows helpful message and set budget button
2. **No Items** - Shows all values as zero, no errors
3. **Items Without Prices** - Counted separately, shows in alerts
4. **All Items Without Prices** - No price statistics shown
5. **Zero Budget** - Handled gracefully (shows 0% if spending is also 0)
6. **Negative Prices** - Filtered out (treated as no price)
7. **Over Budget** - Shows negative remaining as positive "over" amount

## Performance

- Uses `useMemo` for expensive calculations
- Only recalculates when `items` or `budget` change
- Efficient re-renders with React best practices

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox support required
- ES6+ JavaScript features used

## Future Enhancements

Potential improvements for future versions:
1. Budget history tracking
2. Category-level budgets
3. Budget sharing between lists
4. Budget templates
5. Spending trends over time
6. Export budget reports
7. Multi-currency support with conversion
8. Budget goals and milestones

## Troubleshooting

### Prices Not Showing
- Ensure items have a `price` property
- Check that prices are numbers, not strings
- Verify items are being passed correctly

### Budget Updates Not Working
- Ensure `onUpdateBudget` callback is provided
- Check that callback is properly updating state
- Verify no TypeScript errors in console

### Styling Issues
- Confirm `BudgetTracker.css` is imported
- Check CSS variable definitions in `App.css`
- Verify no conflicting styles

## License

This component is part of the grocery list application and follows the same license.
