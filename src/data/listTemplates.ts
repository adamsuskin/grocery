import type { Category } from '../types';

/**
 * Template item for pre-populating lists
 */
export interface TemplateItem {
  name: string;
  quantity: number;
  category: Category;
  notes?: string;
}

/**
 * List template with name, description, and default items
 */
export interface ListTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: TemplateItem[];
}

/**
 * Pre-defined list templates for common grocery shopping scenarios
 */
export const LIST_TEMPLATES: ListTemplate[] = [
  {
    id: 'weekly-groceries',
    name: 'Weekly Groceries',
    description: 'Essential items for a week of meals',
    icon: '🛒',
    items: [
      { name: 'Milk', quantity: 1, category: 'Dairy' },
      { name: 'Eggs', quantity: 12, category: 'Dairy' },
      { name: 'Bread', quantity: 1, category: 'Bakery' },
      { name: 'Butter', quantity: 1, category: 'Dairy' },
      { name: 'Chicken Breast', quantity: 2, category: 'Meat' },
      { name: 'Ground Beef', quantity: 1, category: 'Meat' },
      { name: 'Bananas', quantity: 6, category: 'Produce' },
      { name: 'Apples', quantity: 6, category: 'Produce' },
      { name: 'Carrots', quantity: 1, category: 'Produce', notes: 'Baby carrots' },
      { name: 'Lettuce', quantity: 1, category: 'Produce' },
      { name: 'Tomatoes', quantity: 4, category: 'Produce' },
      { name: 'Onions', quantity: 2, category: 'Produce' },
      { name: 'Rice', quantity: 1, category: 'Pantry', notes: '5 lb bag' },
      { name: 'Pasta', quantity: 2, category: 'Pantry' },
      { name: 'Olive Oil', quantity: 1, category: 'Pantry' },
      { name: 'Orange Juice', quantity: 1, category: 'Beverages' },
    ],
  },
  {
    id: 'party-supplies',
    name: 'Party Supplies',
    description: 'Everything you need for hosting a party',
    icon: '🎉',
    items: [
      { name: 'Chips', quantity: 3, category: 'Pantry', notes: 'Assorted flavors' },
      { name: 'Salsa', quantity: 2, category: 'Pantry' },
      { name: 'Guacamole', quantity: 2, category: 'Produce' },
      { name: 'Soda', quantity: 6, category: 'Beverages', notes: '2L bottles' },
      { name: 'Beer', quantity: 12, category: 'Beverages' },
      { name: 'Ice', quantity: 2, category: 'Frozen', notes: '10 lb bags' },
      { name: 'Paper Plates', quantity: 1, category: 'Other', notes: 'Pack of 50' },
      { name: 'Plastic Cups', quantity: 1, category: 'Other', notes: 'Pack of 50' },
      { name: 'Napkins', quantity: 1, category: 'Other' },
      { name: 'Hot Dogs', quantity: 2, category: 'Meat', notes: 'Packs of 8' },
      { name: 'Hamburger Buns', quantity: 2, category: 'Bakery' },
      { name: 'Cheese Slices', quantity: 1, category: 'Dairy' },
      { name: 'Ketchup', quantity: 1, category: 'Pantry' },
      { name: 'Mustard', quantity: 1, category: 'Pantry' },
    ],
  },
  {
    id: 'breakfast-essentials',
    name: 'Breakfast Essentials',
    description: 'Start your day right with breakfast staples',
    icon: '🍳',
    items: [
      { name: 'Eggs', quantity: 12, category: 'Dairy' },
      { name: 'Bacon', quantity: 1, category: 'Meat' },
      { name: 'Sausage', quantity: 1, category: 'Meat' },
      { name: 'Bread', quantity: 1, category: 'Bakery' },
      { name: 'Bagels', quantity: 6, category: 'Bakery' },
      { name: 'Cream Cheese', quantity: 1, category: 'Dairy' },
      { name: 'Butter', quantity: 1, category: 'Dairy' },
      { name: 'Milk', quantity: 1, category: 'Dairy' },
      { name: 'Orange Juice', quantity: 1, category: 'Beverages' },
      { name: 'Coffee', quantity: 1, category: 'Beverages', notes: 'Ground coffee' },
      { name: 'Cereal', quantity: 2, category: 'Pantry', notes: 'Assorted' },
      { name: 'Oatmeal', quantity: 1, category: 'Pantry' },
      { name: 'Pancake Mix', quantity: 1, category: 'Pantry' },
      { name: 'Maple Syrup', quantity: 1, category: 'Pantry' },
      { name: 'Yogurt', quantity: 6, category: 'Dairy', notes: 'Individual cups' },
      { name: 'Bananas', quantity: 6, category: 'Produce' },
      { name: 'Strawberries', quantity: 1, category: 'Produce' },
    ],
  },
  {
    id: 'healthy-snacks',
    name: 'Healthy Snacks',
    description: 'Nutritious snacks for the whole family',
    icon: '🥗',
    items: [
      { name: 'Greek Yogurt', quantity: 4, category: 'Dairy' },
      { name: 'String Cheese', quantity: 12, category: 'Dairy' },
      { name: 'Hummus', quantity: 2, category: 'Pantry' },
      { name: 'Baby Carrots', quantity: 2, category: 'Produce', notes: 'Pre-cut' },
      { name: 'Celery', quantity: 1, category: 'Produce' },
      { name: 'Apples', quantity: 6, category: 'Produce' },
      { name: 'Bananas', quantity: 6, category: 'Produce' },
      { name: 'Grapes', quantity: 2, category: 'Produce', notes: 'Seedless' },
      { name: 'Almonds', quantity: 1, category: 'Pantry', notes: 'Unsalted' },
      { name: 'Trail Mix', quantity: 1, category: 'Pantry' },
      { name: 'Protein Bars', quantity: 12, category: 'Pantry' },
      { name: 'Rice Cakes', quantity: 1, category: 'Pantry' },
      { name: 'Peanut Butter', quantity: 1, category: 'Pantry', notes: 'Natural' },
      { name: 'Whole Wheat Crackers', quantity: 1, category: 'Pantry' },
    ],
  },
  {
    id: 'bbq-cookout',
    name: 'BBQ Cookout',
    description: 'Fire up the grill with these BBQ essentials',
    icon: '🍖',
    items: [
      { name: 'Burgers', quantity: 2, category: 'Meat', notes: 'Patties' },
      { name: 'Hot Dogs', quantity: 2, category: 'Meat', notes: 'Packs of 8' },
      { name: 'Chicken Thighs', quantity: 2, category: 'Meat' },
      { name: 'Ribs', quantity: 1, category: 'Meat', notes: 'Rack' },
      { name: 'Hamburger Buns', quantity: 2, category: 'Bakery' },
      { name: 'Hot Dog Buns', quantity: 2, category: 'Bakery' },
      { name: 'Lettuce', quantity: 1, category: 'Produce' },
      { name: 'Tomatoes', quantity: 4, category: 'Produce' },
      { name: 'Onions', quantity: 2, category: 'Produce' },
      { name: 'Corn on the Cob', quantity: 8, category: 'Produce' },
      { name: 'BBQ Sauce', quantity: 2, category: 'Pantry', notes: 'Assorted flavors' },
      { name: 'Ketchup', quantity: 1, category: 'Pantry' },
      { name: 'Mustard', quantity: 1, category: 'Pantry' },
      { name: 'Pickles', quantity: 1, category: 'Pantry' },
      { name: 'Potato Salad', quantity: 1, category: 'Dairy', notes: 'From deli' },
      { name: 'Coleslaw', quantity: 1, category: 'Produce', notes: 'Pre-made or ingredients' },
      { name: 'Chips', quantity: 2, category: 'Pantry' },
      { name: 'Soda', quantity: 6, category: 'Beverages' },
      { name: 'Beer', quantity: 12, category: 'Beverages' },
    ],
  },
  {
    id: 'baking-basics',
    name: 'Baking Basics',
    description: 'Stock up on baking essentials for your next recipe',
    icon: '🧁',
    items: [
      { name: 'All-Purpose Flour', quantity: 1, category: 'Pantry', notes: '5 lb bag' },
      { name: 'Sugar', quantity: 1, category: 'Pantry', notes: 'Granulated' },
      { name: 'Brown Sugar', quantity: 1, category: 'Pantry' },
      { name: 'Butter', quantity: 2, category: 'Dairy', notes: 'Sticks' },
      { name: 'Eggs', quantity: 12, category: 'Dairy' },
      { name: 'Milk', quantity: 1, category: 'Dairy' },
      { name: 'Vanilla Extract', quantity: 1, category: 'Pantry' },
      { name: 'Baking Powder', quantity: 1, category: 'Pantry' },
      { name: 'Baking Soda', quantity: 1, category: 'Pantry' },
      { name: 'Salt', quantity: 1, category: 'Pantry' },
      { name: 'Chocolate Chips', quantity: 1, category: 'Pantry' },
      { name: 'Cocoa Powder', quantity: 1, category: 'Pantry' },
      { name: 'Powdered Sugar', quantity: 1, category: 'Pantry' },
      { name: 'Vegetable Oil', quantity: 1, category: 'Pantry' },
      { name: 'Honey', quantity: 1, category: 'Pantry' },
    ],
  },
];
