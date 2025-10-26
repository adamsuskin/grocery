/**
 * Category Suggestions System
 *
 * This module provides smart category suggestions when adding grocery items.
 * It combines keyword matching with user's historical preferences to suggest
 * the most appropriate category for an item.
 *
 * ## Features
 * - Predefined keyword map for common grocery items
 * - Learning from user's past item-category associations
 * - Confidence scoring for suggestions
 * - Support for custom categories
 * - Local storage persistence for user preferences
 *
 * ## Usage
 *
 * ```typescript
 * import { getCategorySuggestions, trackItemCategory } from './categorySuggestions';
 *
 * // Get suggestions for an item
 * const suggestions = getCategorySuggestions('milk', 'list-123', customCategories);
 * console.log(suggestions); // [{ category: 'Dairy', confidence: 0.95 }, ...]
 *
 * // Track user's choice to improve future suggestions
 * trackItemCategory('milk', 'Dairy', 'list-123');
 * ```
 */

import { CATEGORIES, type CustomCategory } from '../types';

// Storage key for user's item-category history
const HISTORY_STORAGE_KEY = 'grocery_item_category_history';
const MAX_HISTORY_ENTRIES = 1000; // Maximum history entries to store

// Suggestion confidence thresholds
const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.5;

/**
 * Predefined keyword map for category suggestions
 * Maps common grocery items to their most likely categories
 */
const categoryKeywords: Record<string, string[]> = {
  'Dairy': [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream',
    'cottage cheese', 'cheddar', 'mozzarella', 'parmesan', 'brie',
    'gouda', 'swiss', 'feta', 'ricotta', 'whey', 'kefir', 'buttermilk',
    'half and half', 'creamer', 'ice cream', 'gelato', 'frozen yogurt'
  ],
  'Produce': [
    'apple', 'banana', 'orange', 'lettuce', 'tomato', 'carrot', 'potato',
    'onion', 'garlic', 'broccoli', 'cauliflower', 'cucumber', 'pepper',
    'spinach', 'kale', 'celery', 'avocado', 'lemon', 'lime', 'strawberry',
    'blueberry', 'raspberry', 'grape', 'watermelon', 'melon', 'mango',
    'pineapple', 'pear', 'peach', 'plum', 'cherry', 'berry', 'berries',
    'cabbage', 'zucchini', 'squash', 'eggplant', 'mushroom', 'corn',
    'green bean', 'asparagus', 'artichoke', 'radish', 'turnip', 'beet',
    'sweet potato', 'yam', 'ginger', 'herbs', 'basil', 'cilantro',
    'parsley', 'mint', 'thyme', 'rosemary', 'salad', 'greens', 'fruit',
    'vegetable', 'veggie', 'fresh'
  ],
  'Meat': [
    'chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'tuna',
    'shrimp', 'crab', 'lobster', 'bacon', 'sausage', 'ham', 'steak',
    'ground beef', 'ground turkey', 'chicken breast', 'chicken thigh',
    'pork chop', 'ribs', 'brisket', 'roast', 'lamb', 'veal', 'duck',
    'venison', 'meat', 'protein', 'seafood', 'shellfish', 'tilapia',
    'cod', 'halibut', 'mahi mahi', 'catfish', 'trout', 'wings', 'drumstick',
    'tenderloin', 'sirloin', 'ribeye', 'filet', 'mignon', 'chops', 'cutlet',
    'hot dog', 'deli', 'cold cuts', 'pepperoni', 'salami', 'pastrami'
  ],
  'Bakery': [
    'bread', 'roll', 'bun', 'bagel', 'croissant', 'muffin', 'donut',
    'cake', 'cookie', 'pie', 'pastry', 'danish', 'scone', 'biscuit',
    'tortilla', 'pita', 'naan', 'ciabatta', 'sourdough', 'wheat bread',
    'white bread', 'rye', 'pumpernickel', 'baguette', 'english muffin',
    'pretzel', 'crackers', 'wafer', 'tart', 'brownies', 'cupcake'
  ],
  'Pantry': [
    'pasta', 'rice', 'beans', 'flour', 'sugar', 'salt', 'pepper',
    'oil', 'olive oil', 'vegetable oil', 'vinegar', 'sauce', 'ketchup',
    'mustard', 'mayo', 'mayonnaise', 'salsa', 'dressing', 'cereal',
    'oatmeal', 'granola', 'nuts', 'peanut', 'almond', 'cashew', 'walnut',
    'peanut butter', 'jelly', 'jam', 'honey', 'syrup', 'maple syrup',
    'canned', 'soup', 'broth', 'stock', 'tomato sauce', 'pasta sauce',
    'spaghetti', 'macaroni', 'noodles', 'quinoa', 'couscous', 'lentils',
    'chickpeas', 'black beans', 'kidney beans', 'pinto beans', 'spices',
    'seasoning', 'herb', 'dried', 'baking', 'chocolate', 'chips',
    'coconut', 'raisins', 'dried fruit', 'crackers', 'chips', 'snacks',
    'popcorn', 'pretzels', 'pickles', 'olives', 'condiments'
  ],
  'Frozen': [
    'frozen', 'ice', 'popsicle', 'frozen pizza', 'frozen dinner',
    'frozen vegetables', 'frozen fruit', 'tv dinner', 'frozen meal',
    'frozen chicken', 'frozen fish', 'frozen shrimp', 'frozen fries',
    'french fries', 'tater tots', 'hash browns', 'frozen waffles',
    'frozen pancakes', 'hot pockets', 'bagel bites', 'ice cream bars',
    'freezer', 'sorbet'
  ],
  'Beverages': [
    'water', 'soda', 'juice', 'coffee', 'tea', 'beer', 'wine', 'liquor',
    'milk', 'almond milk', 'soy milk', 'oat milk', 'coconut milk',
    'sports drink', 'energy drink', 'lemonade', 'iced tea', 'cola',
    'sprite', 'pepsi', 'coke', 'dr pepper', 'mountain dew', 'gatorade',
    'powerade', 'vitamin water', 'sparkling water', 'seltzer', 'tonic',
    'orange juice', 'apple juice', 'grape juice', 'cranberry juice',
    'smoothie', 'shake', 'drink', 'beverage', 'bottle', 'can', 'espresso',
    'cappuccino', 'latte', 'hot chocolate', 'cocoa', 'kombucha'
  ],
  'Other': [
    'miscellaneous', 'misc', 'other', 'various', 'supplies', 'household',
    'cleaning', 'toiletries', 'personal care', 'paper', 'tissue', 'napkin',
    'soap', 'shampoo', 'toothpaste', 'detergent', 'bleach', 'sponge'
  ]
};

/**
 * Interface for item-category history entry
 */
interface CategoryHistoryEntry {
  itemName: string;
  itemNameLower: string;
  category: string;
  listId: string;
  timestamp: number;
  count: number; // How many times this association was used
}

/**
 * Interface for category suggestion
 */
export interface CategorySuggestion {
  category: string;
  confidence: number; // 0.0 to 1.0
  source: 'keyword' | 'history' | 'custom-keyword' | 'default';
  reason?: string; // Human-readable explanation
}

/**
 * Get all history entries from localStorage
 */
function getHistory(): CategoryHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as CategoryHistoryEntry[];
  } catch (error) {
    console.error('[CategorySuggestions] Error loading history:', error);
    return [];
  }
}

/**
 * Save history entries to localStorage
 */
function saveHistory(history: CategoryHistoryEntry[]): void {
  try {
    // Keep only the most recent MAX_HISTORY_ENTRIES
    const trimmedHistory = history.slice(-MAX_HISTORY_ENTRIES);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('[CategorySuggestions] Error saving history:', error);
  }
}

/**
 * Track user's item-category choice to improve future suggestions
 * This is the learning mechanism for personalized suggestions
 *
 * @param itemName - Name of the item
 * @param category - Category selected by user
 * @param listId - ID of the list
 *
 * @example
 * ```typescript
 * // Track after user adds an item
 * trackItemCategory('organic milk', 'Dairy', 'list-123');
 * ```
 */
export function trackItemCategory(
  itemName: string,
  category: string,
  listId: string
): void {
  const history = getHistory();
  const itemNameLower = itemName.toLowerCase().trim();

  // Find existing entry for this item in this list
  const existingIndex = history.findIndex(
    entry => entry.itemNameLower === itemNameLower && entry.listId === listId
  );

  if (existingIndex >= 0) {
    // Update existing entry
    history[existingIndex] = {
      ...history[existingIndex],
      category, // Update to latest category
      timestamp: Date.now(),
      count: history[existingIndex].count + 1,
    };
  } else {
    // Add new entry
    history.push({
      itemName,
      itemNameLower,
      category,
      listId,
      timestamp: Date.now(),
      count: 1,
    });
  }

  saveHistory(history);
}

/**
 * Find category suggestions based on keywords
 * @param itemName - Name of the item to match
 * @returns Array of matching categories with confidence
 */
function findKeywordMatches(itemName: string): Array<{ category: string; confidence: number }> {
  const nameLower = itemName.toLowerCase().trim();
  const matches: Array<{ category: string; matchCount: number; bestMatch: string }> = [];

  // Check each category's keywords
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    let matchCount = 0;
    let bestMatch = '';

    keywords.forEach(keyword => {
      if (nameLower.includes(keyword)) {
        matchCount++;
        if (keyword.length > bestMatch.length) {
          bestMatch = keyword;
        }
      }
    });

    if (matchCount > 0) {
      matches.push({ category, matchCount, bestMatch });
    }
  });

  // Sort by match count (more matches = higher confidence)
  matches.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    // If same match count, prefer longer matching keyword
    return b.bestMatch.length - a.bestMatch.length;
  });

  // Convert to confidence scores
  return matches.map((match, index) => {
    // First match gets highest confidence (0.7-0.95)
    // Subsequent matches get progressively lower confidence
    let confidence = 0.95 - (index * 0.15);

    // Boost confidence if the keyword exactly matches the item name
    if (match.bestMatch === nameLower) {
      confidence = Math.min(0.98, confidence + 0.1);
    }

    // Boost confidence for multiple keyword matches
    if (match.matchCount > 1) {
      confidence = Math.min(0.95, confidence + (match.matchCount - 1) * 0.05);
    }

    return {
      category: match.category,
      confidence: Math.max(0.5, Math.min(1.0, confidence))
    };
  });
}

/**
 * Find category suggestions based on user's history
 * @param itemName - Name of the item
 * @param listId - ID of the list
 * @returns Historical match if found
 */
function findHistoricalMatch(
  itemName: string,
  listId: string
): { category: string; confidence: number } | null {
  const history = getHistory();
  const nameLower = itemName.toLowerCase().trim();

  // Look for exact match first (within the same list)
  const exactMatch = history.find(
    entry => entry.itemNameLower === nameLower && entry.listId === listId
  );

  if (exactMatch) {
    // High confidence for exact match, boosted by usage count
    const usageBoost = Math.min(0.1, exactMatch.count * 0.02);
    return {
      category: exactMatch.category,
      confidence: Math.min(1.0, 0.95 + usageBoost)
    };
  }

  // Look for partial match (item name contains or is contained by historical item)
  const partialMatches = history.filter(entry => {
    const isInSameList = entry.listId === listId;
    const contains = entry.itemNameLower.includes(nameLower) ||
                     nameLower.includes(entry.itemNameLower);
    return isInSameList && contains;
  });

  if (partialMatches.length > 0) {
    // Sort by usage count and timestamp
    partialMatches.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.timestamp - a.timestamp;
    });

    const bestMatch = partialMatches[0];
    // Medium-high confidence for partial match
    const usageBoost = Math.min(0.05, bestMatch.count * 0.01);
    return {
      category: bestMatch.category,
      confidence: Math.min(0.9, 0.75 + usageBoost)
    };
  }

  // Look for similar items across all lists (lower confidence)
  const crossListMatches = history.filter(entry =>
    entry.itemNameLower.includes(nameLower) || nameLower.includes(entry.itemNameLower)
  );

  if (crossListMatches.length > 0) {
    crossListMatches.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.timestamp - a.timestamp;
    });

    const bestMatch = crossListMatches[0];
    return {
      category: bestMatch.category,
      confidence: 0.65 // Lower confidence for cross-list matches
    };
  }

  return null;
}

/**
 * Check if item name matches custom category keywords
 * Custom categories might have obvious names that should match
 * @param itemName - Name of the item
 * @param customCategories - Array of custom categories
 * @returns Custom category match if found
 */
function findCustomCategoryMatch(
  itemName: string,
  customCategories: CustomCategory[]
): { category: string; confidence: number } | null {
  const nameLower = itemName.toLowerCase().trim();

  for (const customCat of customCategories) {
    const categoryLower = customCat.name.toLowerCase();

    // Check if item name contains category name or vice versa
    if (nameLower.includes(categoryLower) || categoryLower.includes(nameLower)) {
      return {
        category: customCat.name,
        confidence: 0.85
      };
    }
  }

  return null;
}

/**
 * Get category suggestions for an item name
 * Returns up to 3 suggestions sorted by confidence
 *
 * @param itemName - Name of the item to get suggestions for
 * @param listId - ID of the list (for personalized suggestions)
 * @param customCategories - Array of custom categories for this list
 * @returns Array of category suggestions with confidence scores
 *
 * @example
 * ```typescript
 * const suggestions = getCategorySuggestions('milk', 'list-123', customCategories);
 * // [
 * //   { category: 'Dairy', confidence: 0.95, source: 'keyword', reason: 'Matched keyword: milk' },
 * //   { category: 'Beverages', confidence: 0.70, source: 'keyword', reason: 'Matched keyword: milk' }
 * // ]
 * ```
 */
export function getCategorySuggestions(
  itemName: string,
  listId: string,
  customCategories: CustomCategory[] = []
): CategorySuggestion[] {
  const suggestions: CategorySuggestion[] = [];
  const trimmedName = itemName.trim();

  // Return empty if item name is too short
  if (trimmedName.length < 2) {
    return [];
  }

  // 1. Check user's history first (highest priority)
  const historicalMatch = findHistoricalMatch(trimmedName, listId);
  if (historicalMatch) {
    suggestions.push({
      category: historicalMatch.category,
      confidence: historicalMatch.confidence,
      source: 'history',
      reason: 'Based on your previous choices'
    });
  }

  // 2. Check custom category name matching
  const customMatch = findCustomCategoryMatch(trimmedName, customCategories);
  if (customMatch) {
    // Only add if not already suggested from history
    if (!suggestions.find(s => s.category === customMatch.category)) {
      suggestions.push({
        category: customMatch.category,
        confidence: customMatch.confidence,
        source: 'custom-keyword',
        reason: 'Matches custom category name'
      });
    }
  }

  // 3. Check keyword matching
  const keywordMatches = findKeywordMatches(trimmedName);
  keywordMatches.forEach(match => {
    // Only add if not already suggested
    if (!suggestions.find(s => s.category === match.category)) {
      suggestions.push({
        category: match.category,
        confidence: match.confidence,
        source: 'keyword',
        reason: 'Common item in this category'
      });
    }
  });

  // 4. Sort by confidence and take top 3
  suggestions.sort((a, b) => b.confidence - a.confidence);
  const topSuggestions = suggestions.slice(0, 3);

  // 5. If no suggestions with high confidence, add "Other" as fallback
  if (topSuggestions.length === 0 || topSuggestions[0].confidence < 0.5) {
    topSuggestions.push({
      category: 'Other',
      confidence: 0.3,
      source: 'default',
      reason: 'Default category'
    });
  }

  return topSuggestions;
}

/**
 * Get the best (highest confidence) category suggestion
 * @param itemName - Name of the item
 * @param listId - ID of the list
 * @param customCategories - Array of custom categories
 * @returns Best suggestion or null if no good match
 *
 * @example
 * ```typescript
 * const best = getBestCategorySuggestion('milk', 'list-123', customCategories);
 * if (best && best.confidence > 0.8) {
 *   // Auto-select this category
 *   setCategory(best.category);
 * }
 * ```
 */
export function getBestCategorySuggestion(
  itemName: string,
  listId: string,
  customCategories: CustomCategory[] = []
): CategorySuggestion | null {
  const suggestions = getCategorySuggestions(itemName, listId, customCategories);
  return suggestions.length > 0 ? suggestions[0] : null;
}

/**
 * Check if a suggestion has high confidence (should auto-select)
 * @param confidence - Confidence score (0-1)
 * @returns true if confidence is high enough for auto-selection
 */
export function isHighConfidence(confidence: number): boolean {
  return confidence >= HIGH_CONFIDENCE_THRESHOLD;
}

/**
 * Check if a suggestion has medium confidence
 * @param confidence - Confidence score (0-1)
 * @returns true if confidence is medium
 */
export function isMediumConfidence(confidence: number): boolean {
  return confidence >= MEDIUM_CONFIDENCE_THRESHOLD && confidence < HIGH_CONFIDENCE_THRESHOLD;
}

/**
 * Get confidence level as a string
 * @param confidence - Confidence score (0-1)
 * @returns Confidence level string
 */
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'high';
  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return 'medium';
  return 'low';
}

/**
 * Clear all history data
 * WARNING: This cannot be undone
 */
export function clearCategoryHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    console.log('[CategorySuggestions] History cleared');
  } catch (error) {
    console.error('[CategorySuggestions] Error clearing history:', error);
  }
}

/**
 * Get category history statistics
 * @param listId - Optional list ID to filter by
 * @returns Statistics about category history
 */
export function getCategoryHistoryStats(listId?: string): {
  totalItems: number;
  mostCommonCategories: Array<{ category: string; count: number }>;
  totalLists: number;
} {
  const history = getHistory();
  const filteredHistory = listId
    ? history.filter(entry => entry.listId === listId)
    : history;

  // Count by category
  const categoryCount = new Map<string, number>();
  const listIds = new Set<string>();

  filteredHistory.forEach(entry => {
    categoryCount.set(entry.category, (categoryCount.get(entry.category) || 0) + entry.count);
    listIds.add(entry.listId);
  });

  // Convert to array and sort
  const mostCommon = Array.from(categoryCount.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalItems: filteredHistory.length,
    mostCommonCategories: mostCommon,
    totalLists: listIds.size,
  };
}

/**
 * Export history data as JSON
 * @returns JSON string of all history
 */
export function exportCategoryHistory(): string {
  const history = getHistory();
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    totalEntries: history.length,
    history,
  }, null, 2);
}
