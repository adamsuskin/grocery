/**
 * Budget Utilities
 *
 * Provides utility functions for budget management and price calculations:
 * - Currency formatting and symbol mapping
 * - Price calculations and totals
 * - Budget status and percentage tracking
 * - Input parsing and validation
 * - Budget report generation
 *
 * @module utils/budgetUtils
 */

import type { GroceryItem, List } from '../types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Budget status levels based on spending
 */
export type BudgetStatus = 'safe' | 'warning' | 'over';

/**
 * Supported currency codes
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CNY' | 'INR';

/**
 * Currency symbol mapping
 */
export interface CurrencySymbolMap {
  [key: string]: string;
}

/**
 * Budget report data structure
 */
export interface BudgetReportData {
  listName: string;
  totalItems: number;
  totalSpent: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
    category: string;
  }>;
  categoryTotals: Array<{
    category: string;
    total: number;
    itemCount: number;
  }>;
  exportDate: string;
}

// =============================================================================
// CURRENCY SYMBOLS
// =============================================================================

/**
 * Map of currency codes to symbols
 */
const CURRENCY_SYMBOLS: CurrencySymbolMap = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
};

/**
 * Gets the symbol for a currency code
 *
 * @param currency - ISO currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol (e.g., '$', '€')
 *
 * @example
 * ```typescript
 * getCurrencySymbol('USD'); // Returns: '$'
 * getCurrencySymbol('EUR'); // Returns: '€'
 * getCurrencySymbol('XYZ'); // Returns: 'XYZ' (fallback)
 * ```
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
}

// =============================================================================
// PRICE FORMATTING
// =============================================================================

/**
 * Formats a price with currency symbol
 * Simple formatting without locale-specific rules
 *
 * @param price - Price value to format
 * @param currency - Currency code
 * @returns Formatted price string
 *
 * @example
 * ```typescript
 * formatPrice(10.5, 'USD');  // Returns: '$10.50'
 * formatPrice(1000, 'EUR');  // Returns: '€1000.00'
 * formatPrice(0, 'GBP');     // Returns: '£0.00'
 * ```
 */
export function formatPrice(price: number, currency: string): string {
  if (!isFinite(price)) {
    return `${getCurrencySymbol(currency)}0.00`;
  }

  const symbol = getCurrencySymbol(currency);
  const rounded = roundToDecimal(price, 2);
  const formatted = rounded.toFixed(2);

  return `${symbol}${formatted}`;
}

/**
 * Formats a price with full currency formatting
 * Uses locale-specific formatting with thousands separators
 *
 * @param amount - Amount to format
 * @param currency - ISO currency code
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56, 'USD');  // Returns: '$1,234.56'
 * formatCurrency(1000.5, 'EUR');   // Returns: '€1,000.50'
 * formatCurrency(0, 'GBP');        // Returns: '£0.00'
 * ```
 */
export function formatCurrency(amount: number, currency: string): string {
  if (!isFinite(amount)) {
    return formatPrice(0, currency);
  }

  try {
    // Use Intl.NumberFormat for locale-aware formatting
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  } catch (error) {
    // Fallback to simple formatting if currency code is invalid
    console.warn(`Invalid currency code: ${currency}. Using simple format.`);
    return formatPrice(amount, currency);
  }
}

// =============================================================================
// CALCULATIONS
// =============================================================================

/**
 * Rounds a number to specified decimal places
 * Handles floating point precision issues
 *
 * @param num - Number to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 *
 * @example
 * ```typescript
 * roundToDecimal(10.125, 2);    // Returns: 10.13
 * roundToDecimal(10.124, 2);    // Returns: 10.12
 * roundToDecimal(10.5, 0);      // Returns: 11
 * ```
 */
export function roundToDecimal(num: number, decimals: number): number {
  if (!isFinite(num)) {
    return 0;
  }

  if (!isFinite(decimals) || decimals < 0) {
    decimals = 0;
  }

  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
}

/**
 * Calculates total cost of all items
 * Multiplies price by quantity for each item and sums
 *
 * @param items - Array of grocery items with prices
 * @returns Total cost
 *
 * @example
 * ```typescript
 * const items = [
 *   { name: 'Apples', quantity: 3, price: 1.5 },
 *   { name: 'Bread', quantity: 2, price: 2.5 },
 * ];
 * calculateTotal(items); // Returns: 9.5 (3*1.5 + 2*2.5)
 * ```
 */
export function calculateTotal(items: GroceryItem[]): number {
  if (!items || items.length === 0) {
    return 0;
  }

  const total = items.reduce((sum, item) => {
    // Only include items with valid prices
    if (item.price !== null && item.price !== undefined && isFinite(item.price)) {
      const quantity = isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
      const price = item.price >= 0 ? item.price : 0;
      return sum + (price * quantity);
    }
    return sum;
  }, 0);

  return roundToDecimal(total, 2);
}

/**
 * Calculates budget usage percentage
 *
 * @param spent - Amount spent
 * @param budget - Total budget
 * @returns Percentage of budget used (0-100+)
 *
 * @example
 * ```typescript
 * calculateBudgetPercentage(50, 100);   // Returns: 50
 * calculateBudgetPercentage(150, 100);  // Returns: 150
 * calculateBudgetPercentage(0, 100);    // Returns: 0
 * calculateBudgetPercentage(50, 0);     // Returns: 0
 * ```
 */
export function calculateBudgetPercentage(spent: number, budget: number): number {
  // Validate inputs
  if (!isFinite(spent) || !isFinite(budget) || spent < 0 || budget <= 0) {
    return 0;
  }

  const percentage = (spent / budget) * 100;
  return roundToDecimal(percentage, 1);
}

/**
 * Determines budget status based on spending
 * - safe: Under 80% of budget
 * - warning: 80-100% of budget
 * - over: Over 100% of budget
 *
 * @param spent - Amount spent
 * @param budget - Total budget
 * @returns Budget status level
 *
 * @example
 * ```typescript
 * getBudgetStatus(50, 100);   // Returns: 'safe'
 * getBudgetStatus(85, 100);   // Returns: 'warning'
 * getBudgetStatus(110, 100);  // Returns: 'over'
 * ```
 */
export function getBudgetStatus(spent: number, budget: number): BudgetStatus {
  // Validate inputs
  if (!isFinite(spent) || !isFinite(budget) || spent < 0 || budget <= 0) {
    return 'safe';
  }

  const percentage = calculateBudgetPercentage(spent, budget);

  if (percentage >= 100) {
    return 'over';
  } else if (percentage >= 80) {
    return 'warning';
  } else {
    return 'safe';
  }
}

// =============================================================================
// INPUT PARSING
// =============================================================================

/**
 * Parses user price input safely
 * Handles various input formats:
 * - Numbers: 10, 10.5
 * - Currency symbols: $10, €10.50
 * - Thousands separators: 1,000.50
 * - Negative values (returns null)
 * - Invalid input (returns null)
 *
 * @param input - User input string
 * @returns Parsed price or null if invalid
 *
 * @example
 * ```typescript
 * parsePriceInput('10');        // Returns: 10
 * parsePriceInput('10.50');     // Returns: 10.5
 * parsePriceInput('$10.50');    // Returns: 10.5
 * parsePriceInput('1,000.50');  // Returns: 1000.5
 * parsePriceInput('€10,50');    // Returns: 10.5 (handles comma decimals)
 * parsePriceInput('-10');       // Returns: null (negative)
 * parsePriceInput('abc');       // Returns: null (invalid)
 * parsePriceInput('');          // Returns: null (empty)
 * ```
 */
export function parsePriceInput(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Trim whitespace
  let cleaned = input.trim();

  if (cleaned === '') {
    return null;
  }

  // Remove currency symbols and spaces
  cleaned = cleaned.replace(/[$€£¥₹\s]/g, '');

  // Handle European decimal comma format (e.g., "10,50" -> "10.50")
  // Only if there's no thousands separator
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  } else {
    // Remove thousands separators (commas)
    cleaned = cleaned.replace(/,/g, '');
  }

  // Try to parse as number
  const parsed = parseFloat(cleaned);

  // Validate result
  if (!isFinite(parsed) || parsed < 0) {
    return null;
  }

  // Round to 2 decimal places
  return roundToDecimal(parsed, 2);
}

// =============================================================================
// BUDGET REPORT
// =============================================================================

/**
 * Generates a CSV budget report for a list
 * Includes item details, subtotals, and category breakdown
 *
 * @param list - The grocery list
 * @param items - Array of grocery items with prices
 * @returns CSV formatted budget report string
 *
 * @example
 * ```typescript
 * const list = { id: '1', name: 'Weekly Groceries', ... };
 * const items = [
 *   { name: 'Apples', quantity: 3, price: 1.5, category: 'Produce' },
 *   { name: 'Bread', quantity: 2, price: 2.5, category: 'Bakery' },
 * ];
 * const csv = exportBudgetReport(list, items);
 * // Returns CSV with headers, items, and totals
 * ```
 */
export function exportBudgetReport(list: List, items: GroceryItem[]): string {
  const lines: string[] = [];
  const currency = 'USD'; // Default currency - could be made configurable

  // Header
  lines.push('# Budget Report');
  lines.push(`# List: ${list.name}`);
  lines.push(`# Generated: ${new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`);
  lines.push('');

  // Items section
  lines.push('# Items');
  lines.push('Item Name,Quantity,Price,Subtotal,Category');

  // Calculate item totals
  const itemsWithPrices = items.filter(item =>
    item.price !== null && item.price !== undefined && isFinite(item.price)
  );

  const categoryTotals = new Map<string, { total: number; count: number }>();

  for (const item of itemsWithPrices) {
    const quantity = isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
    const price = item.price || 0;
    const subtotal = roundToDecimal(price * quantity, 2);

    // Track category totals
    const categoryData = categoryTotals.get(item.category) || { total: 0, count: 0 };
    categoryData.total += subtotal;
    categoryData.count += 1;
    categoryTotals.set(item.category, categoryData);

    // Escape CSV fields
    const name = escapeCSVField(item.name);
    const cat = escapeCSVField(item.category);

    lines.push(`${name},${quantity},${price.toFixed(2)},${subtotal.toFixed(2)},${cat}`);
  }

  lines.push('');

  // Category breakdown
  lines.push('# Category Breakdown');
  lines.push('Category,Total,Item Count,Percentage');

  const grandTotal = calculateTotal(items);
  const sortedCategories = Array.from(categoryTotals.entries()).sort((a, b) =>
    b[1].total - a[1].total
  );

  for (const [category, data] of sortedCategories) {
    const percentage = grandTotal > 0
      ? roundToDecimal((data.total / grandTotal) * 100, 1)
      : 0;
    const cat = escapeCSVField(category);
    lines.push(`${cat},${data.total.toFixed(2)},${data.count},${percentage.toFixed(1)}%`);
  }

  lines.push('');

  // Summary
  lines.push('# Summary');
  lines.push(`Total Items,${itemsWithPrices.length}`);
  lines.push(`Total Spent,${formatCurrency(grandTotal, currency)}`);
  lines.push(`Items with Price,${itemsWithPrices.length}`);
  lines.push(`Items without Price,${items.length - itemsWithPrices.length}`);

  return lines.join('\n');
}

/**
 * Escapes a field for CSV format
 * Handles commas, quotes, and newlines
 *
 * @param value - Value to escape
 * @returns Escaped CSV field
 */
function escapeCSVField(value: string | number | boolean): string {
  const stringValue = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

// =============================================================================
// EXPORT API
// =============================================================================

/**
 * Budget utilities API
 */
export const budgetUtils = {
  // Currency
  getCurrencySymbol,
  formatPrice,
  formatCurrency,

  // Calculations
  calculateTotal,
  calculateBudgetPercentage,
  getBudgetStatus,
  roundToDecimal,

  // Parsing
  parsePriceInput,

  // Reports
  exportBudgetReport,
};

/**
 * Default export for convenience
 */
export default budgetUtils;
