import { BudgetTracker } from './BudgetTracker';
import type { GroceryItem } from '../types';

/**
 * Example usage of the BudgetTracker component
 *
 * This file demonstrates how to integrate the BudgetTracker component
 * into your grocery list application.
 */

// Example: Sample grocery items with prices
// Note: The GroceryItem type doesn't include a price field by default,
// so you'll need to extend it or use type casting as shown below
const sampleItems: GroceryItem[] = [
  {
    id: '1',
    name: 'Milk',
    quantity: 2,
    gotten: false,
    category: 'Dairy',
    notes: '',
    userId: 'user1',
    listId: 'list1',
    createdAt: Date.now(),
    // @ts-ignore - Adding price field for demonstration
    price: 3.99
  },
  {
    id: '2',
    name: 'Bread',
    quantity: 1,
    gotten: false,
    category: 'Bakery',
    notes: '',
    userId: 'user1',
    listId: 'list1',
    createdAt: Date.now(),
    // @ts-ignore - Adding price field for demonstration
    price: 2.49
  },
  {
    id: '3',
    name: 'Apples',
    quantity: 5,
    gotten: true,
    category: 'Produce',
    notes: 'Organic',
    userId: 'user1',
    listId: 'list1',
    createdAt: Date.now(),
    // @ts-ignore - Adding price field for demonstration
    price: 0.99
  },
  {
    id: '4',
    name: 'Chicken Breast',
    quantity: 2,
    gotten: false,
    category: 'Meat',
    notes: '',
    userId: 'user1',
    listId: 'list1',
    createdAt: Date.now(),
    // @ts-ignore - Adding price field for demonstration
    price: 8.99
  },
  {
    id: '5',
    name: 'Rice',
    quantity: 1,
    gotten: false,
    category: 'Pantry',
    notes: '',
    userId: 'user1',
    listId: 'list1',
    createdAt: Date.now()
    // No price set - demonstrates handling of items without prices
  }
];

/**
 * Example 1: Basic usage with budget
 */
export function BudgetTrackerExample1() {
  const handleUpdateBudget = (newBudget: number) => {
    console.log('Budget updated to:', newBudget);
    // In a real application, you would save this to your state management or database
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Example 1: With Budget Set</h2>
      <BudgetTracker
        items={sampleItems}
        budget={50.00}
        currency="$"
        onUpdateBudget={handleUpdateBudget}
      />
    </div>
  );
}

/**
 * Example 2: No budget set
 */
export function BudgetTrackerExample2() {
  const handleUpdateBudget = (newBudget: number) => {
    console.log('Budget set to:', newBudget);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Example 2: No Budget Set</h2>
      <BudgetTracker
        items={sampleItems}
        onUpdateBudget={handleUpdateBudget}
      />
    </div>
  );
}

/**
 * Example 3: Near budget limit (>80%)
 */
export function BudgetTrackerExample3() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Example 3: Near Budget Limit</h2>
      <BudgetTracker
        items={sampleItems}
        budget={30.00}
        currency="$"
      />
    </div>
  );
}

/**
 * Example 4: Over budget
 */
export function BudgetTrackerExample4() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Example 4: Over Budget</h2>
      <BudgetTracker
        items={sampleItems}
        budget={20.00}
        currency="$"
      />
    </div>
  );
}

/**
 * Example 5: Different currency
 */
export function BudgetTrackerExample5() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Example 5: Euro Currency</h2>
      <BudgetTracker
        items={sampleItems}
        budget={45.00}
        currency="€"
      />
    </div>
  );
}

/**
 * Example 6: Empty items list
 */
export function BudgetTrackerExample6() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Example 6: No Items</h2>
      <BudgetTracker
        items={[]}
        budget={100.00}
        currency="$"
      />
    </div>
  );
}

/**
 * Integration example with a parent component
 */
export function IntegrationExample() {
  // In a real application, this would come from your state management
  const items = sampleItems;
  const budget = 50.00;

  const handleBudgetUpdate = (newBudget: number) => {
    // Update your state management here
    console.log('Updating budget to:', newBudget);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>My Grocery List</h1>
      </header>

      <main className="main">
        {/* Budget Tracker at the top */}
        <BudgetTracker
          items={items}
          budget={budget}
          currency="$"
          onUpdateBudget={handleBudgetUpdate}
        />

        {/* Your grocery list would go here */}
        <section>
          <h2>Items</h2>
          {/* GroceryList component */}
        </section>
      </main>
    </div>
  );
}

/**
 * Note: To add price support to GroceryItem, you can either:
 *
 * 1. Extend the GroceryItem type:
 *
 * interface GroceryItemWithPrice extends GroceryItem {
 *   price?: number;
 * }
 *
 * 2. Update the GroceryItem type in types.ts to include:
 *
 * export interface GroceryItem {
 *   // ... existing fields
 *   price?: number;
 * }
 *
 * 3. Update your database schema to include a price column
 */
