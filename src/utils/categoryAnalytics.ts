/**
 * Category Analytics Tracking System
 *
 * This module provides comprehensive analytics tracking for custom category usage.
 * It tracks user interactions with custom categories and stores events for analysis.
 *
 * ## Features
 * - Track custom category creation, editing, and deletion
 * - Track custom category usage in item creation
 * - Track category filter usage
 * - Store events in localStorage with automatic cleanup
 * - Export analytics data for reporting
 * - Calculate usage statistics and trends
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   logCategoryCreated,
 *   logCategoryUsed,
 *   getCategoryAnalytics,
 * } from './categoryAnalytics';
 *
 * // Track category creation
 * logCategoryCreated('list-123', 'Snacks', { color: '#FF5733', icon: '🍿' });
 *
 * // Track category usage
 * logCategoryUsed('list-123', 'Snacks');
 *
 * // Get analytics
 * const analytics = getCategoryAnalytics('list-123');
 * console.log(analytics.mostUsedCategories);
 * ```
 */

// Event types for category analytics
export type CategoryEventType =
  | 'category_created'
  | 'category_edited'
  | 'category_deleted'
  | 'category_used_in_item'
  | 'category_filter_applied';

// Category event interface
export interface CategoryEvent {
  id: string;
  type: CategoryEventType;
  listId: string;
  categoryName: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

// Analytics storage key
const ANALYTICS_STORAGE_KEY = 'grocery_category_analytics';
const MAX_EVENTS = 10000; // Maximum events to store
const MAX_AGE_DAYS = 90; // Keep events for 90 days

/**
 * Get all stored analytics events
 * @returns Array of all category events
 */
function getAllEvents(): CategoryEvent[] {
  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!stored) return [];

    const events = JSON.parse(stored) as CategoryEvent[];

    // Filter out old events (older than MAX_AGE_DAYS)
    const cutoffDate = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    return events.filter(event => event.timestamp > cutoffDate);
  } catch (error) {
    console.error('[CategoryAnalytics] Error loading events:', error);
    return [];
  }
}

/**
 * Save analytics events to localStorage
 * @param events - Array of events to save
 */
function saveEvents(events: CategoryEvent[]): void {
  try {
    // Keep only the most recent MAX_EVENTS
    const recentEvents = events.slice(-MAX_EVENTS);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(recentEvents));
  } catch (error) {
    console.error('[CategoryAnalytics] Error saving events:', error);
  }
}

/**
 * Add a new analytics event
 * @param event - Event to add (without id and timestamp)
 */
function addEvent(event: Omit<CategoryEvent, 'id' | 'timestamp'>): void {
  const events = getAllEvents();

  const newEvent: CategoryEvent = {
    ...event,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  events.push(newEvent);
  saveEvents(events);
}

/**
 * Log when a custom category is created
 * @param listId - ID of the list
 * @param categoryName - Name of the category
 * @param metadata - Optional metadata (color, icon, etc.)
 */
export function logCategoryCreated(
  listId: string,
  categoryName: string,
  metadata?: { color?: string; icon?: string; userId?: string }
): void {
  addEvent({
    type: 'category_created',
    listId,
    categoryName,
    userId: metadata?.userId,
    metadata: {
      color: metadata?.color,
      icon: metadata?.icon,
    },
  });

  console.log(`[CategoryAnalytics] Category created: ${categoryName} in list ${listId}`);
}

/**
 * Log when a custom category is edited
 * @param listId - ID of the list
 * @param categoryName - Name of the category
 * @param metadata - Optional metadata about changes
 */
export function logCategoryEdited(
  listId: string,
  categoryName: string,
  metadata?: {
    oldName?: string;
    newName?: string;
    colorChanged?: boolean;
    iconChanged?: boolean;
    userId?: string;
  }
): void {
  addEvent({
    type: 'category_edited',
    listId,
    categoryName,
    userId: metadata?.userId,
    metadata,
  });

  console.log(`[CategoryAnalytics] Category edited: ${categoryName} in list ${listId}`);
}

/**
 * Log when a custom category is deleted
 * @param listId - ID of the list
 * @param categoryName - Name of the category
 * @param metadata - Optional metadata about deletion
 */
export function logCategoryDeleted(
  listId: string,
  categoryName: string,
  metadata?: { itemCount?: number; userId?: string }
): void {
  addEvent({
    type: 'category_deleted',
    listId,
    categoryName,
    userId: metadata?.userId,
    metadata,
  });

  console.log(`[CategoryAnalytics] Category deleted: ${categoryName} in list ${listId}`);
}

/**
 * Log when a custom category is used in item creation
 * @param listId - ID of the list
 * @param categoryName - Name of the category
 * @param metadata - Optional metadata about the item
 */
export function logCategoryUsed(
  listId: string,
  categoryName: string,
  metadata?: { itemName?: string; userId?: string }
): void {
  addEvent({
    type: 'category_used_in_item',
    listId,
    categoryName,
    userId: metadata?.userId,
    metadata,
  });

  // Don't log every usage to console to avoid spam
}

/**
 * Log when a category filter is applied
 * @param listId - ID of the list
 * @param categoryName - Name of the category
 * @param metadata - Optional metadata about filter state
 */
export function logCategoryFilterApplied(
  listId: string,
  categoryName: string,
  metadata?: { isActive?: boolean; userId?: string }
): void {
  addEvent({
    type: 'category_filter_applied',
    listId,
    categoryName,
    userId: metadata?.userId,
    metadata,
  });

  // Don't log every filter change to console
}

// Analytics result types

export interface CategoryUsageStats {
  categoryName: string;
  usageCount: number;
  lastUsed: number;
  createdAt?: number;
}

export interface CategoryAnalytics {
  totalCustomCategories: number;
  totalCategoryUsage: number;
  totalFilterUsage: number;
  mostUsedCategories: CategoryUsageStats[];
  recentlyCreatedCategories: Array<{
    categoryName: string;
    createdAt: number;
    metadata?: Record<string, any>;
  }>;
  categoryCreationTrend: Array<{
    date: string;
    count: number;
  }>;
  deletedCategories: Array<{
    categoryName: string;
    deletedAt: number;
    itemCount?: number;
  }>;
  filterUsageByCategory: Array<{
    categoryName: string;
    filterCount: number;
  }>;
}

/**
 * Get analytics for a specific list
 * @param listId - ID of the list
 * @returns Analytics data for the list
 */
export function getCategoryAnalytics(listId: string): CategoryAnalytics {
  const events = getAllEvents().filter(event => event.listId === listId);

  // Get custom categories created
  const createdCategories = events.filter(e => e.type === 'category_created');
  const deletedCategories = events.filter(e => e.type === 'category_deleted');

  // Calculate usage stats
  const usageEvents = events.filter(e => e.type === 'category_used_in_item');
  const usageByCategory = new Map<string, { count: number; lastUsed: number }>();

  usageEvents.forEach(event => {
    const current = usageByCategory.get(event.categoryName) || { count: 0, lastUsed: 0 };
    usageByCategory.set(event.categoryName, {
      count: current.count + 1,
      lastUsed: Math.max(current.lastUsed, event.timestamp),
    });
  });

  // Get filter usage
  const filterEvents = events.filter(e => e.type === 'category_filter_applied');
  const filterByCategory = new Map<string, number>();

  filterEvents.forEach(event => {
    const current = filterByCategory.get(event.categoryName) || 0;
    filterByCategory.set(event.categoryName, current + 1);
  });

  // Build most used categories
  const mostUsedCategories: CategoryUsageStats[] = Array.from(usageByCategory.entries())
    .map(([categoryName, stats]) => {
      const createdEvent = createdCategories.find(e => e.categoryName === categoryName);
      return {
        categoryName,
        usageCount: stats.count,
        lastUsed: stats.lastUsed,
        createdAt: createdEvent?.timestamp,
      };
    })
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10);

  // Build creation trend (last 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentCreations = createdCategories.filter(e => e.timestamp > thirtyDaysAgo);

  const trendMap = new Map<string, number>();
  recentCreations.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    trendMap.set(date, (trendMap.get(date) || 0) + 1);
  });

  const categoryCreationTrend = Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalCustomCategories: createdCategories.length,
    totalCategoryUsage: usageEvents.length,
    totalFilterUsage: filterEvents.length,
    mostUsedCategories,
    recentlyCreatedCategories: createdCategories
      .slice(-10)
      .reverse()
      .map(e => ({
        categoryName: e.categoryName,
        createdAt: e.timestamp,
        metadata: e.metadata,
      })),
    categoryCreationTrend,
    deletedCategories: deletedCategories.map(e => ({
      categoryName: e.categoryName,
      deletedAt: e.timestamp,
      itemCount: e.metadata?.itemCount,
    })),
    filterUsageByCategory: Array.from(filterByCategory.entries())
      .map(([categoryName, filterCount]) => ({ categoryName, filterCount }))
      .sort((a, b) => b.filterCount - a.filterCount),
  };
}

/**
 * Get global analytics across all lists
 * @returns Global analytics data
 */
export function getGlobalCategoryAnalytics(): {
  totalEvents: number;
  totalLists: number;
  totalCustomCategories: number;
  totalCategoryUsage: number;
  globalMostUsedCategories: CategoryUsageStats[];
  listsWithCustomCategories: string[];
} {
  const events = getAllEvents();

  const listsWithCategories = new Set<string>();
  const usageByCategory = new Map<string, { count: number; lastUsed: number }>();

  let totalCustomCategories = 0;
  let totalCategoryUsage = 0;

  events.forEach(event => {
    if (event.type === 'category_created') {
      totalCustomCategories++;
      listsWithCategories.add(event.listId);
    }

    if (event.type === 'category_used_in_item') {
      totalCategoryUsage++;
      const current = usageByCategory.get(event.categoryName) || { count: 0, lastUsed: 0 };
      usageByCategory.set(event.categoryName, {
        count: current.count + 1,
        lastUsed: Math.max(current.lastUsed, event.timestamp),
      });
    }
  });

  const globalMostUsedCategories: CategoryUsageStats[] = Array.from(usageByCategory.entries())
    .map(([categoryName, stats]) => ({
      categoryName,
      usageCount: stats.count,
      lastUsed: stats.lastUsed,
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 20);

  return {
    totalEvents: events.length,
    totalLists: listsWithCategories.size,
    totalCustomCategories,
    totalCategoryUsage,
    globalMostUsedCategories,
    listsWithCustomCategories: Array.from(listsWithCategories),
  };
}

/**
 * Export all analytics events as JSON
 * @returns JSON string of all events
 */
export function exportAnalyticsData(): string {
  const events = getAllEvents();
  const analytics = {
    exportDate: new Date().toISOString(),
    totalEvents: events.length,
    events,
  };
  return JSON.stringify(analytics, null, 2);
}

/**
 * Clear all analytics data
 * WARNING: This action cannot be undone
 */
export function clearAnalyticsData(): void {
  try {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    console.log('[CategoryAnalytics] All analytics data cleared');
  } catch (error) {
    console.error('[CategoryAnalytics] Error clearing analytics data:', error);
  }
}

/**
 * Get events for a specific date range
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param listId - Optional list ID to filter by
 * @returns Array of events in the date range
 */
export function getEventsByDateRange(
  startDate: number,
  endDate: number,
  listId?: string
): CategoryEvent[] {
  const events = getAllEvents();
  return events.filter(event => {
    const inDateRange = event.timestamp >= startDate && event.timestamp <= endDate;
    const matchesList = !listId || event.listId === listId;
    return inDateRange && matchesList;
  });
}

/**
 * Calculate which predefined categories are being replaced by custom categories
 * This can help understand if custom categories are filling gaps in the predefined set
 *
 * @param listId - ID of the list
 * @returns Array of insights about category replacements
 */
export function getCategoryReplacementInsights(listId: string): Array<{
  customCategory: string;
  usageCount: number;
  similarPredefinedCategories: string[];
}> {
  const analytics = getCategoryAnalytics(listId);
  const insights: Array<{
    customCategory: string;
    usageCount: number;
    similarPredefinedCategories: string[];
  }> = [];

  // Simple similarity matching based on common terms
  const categoryKeywords: Record<string, string[]> = {
    'Produce': ['fruit', 'vegetable', 'produce', 'fresh', 'veggie'],
    'Dairy': ['dairy', 'milk', 'cheese', 'yogurt', 'cream'],
    'Meat': ['meat', 'chicken', 'beef', 'pork', 'fish', 'seafood', 'protein'],
    'Bakery': ['bread', 'bakery', 'baked', 'pastry', 'cake'],
    'Pantry': ['pantry', 'staple', 'canned', 'dry', 'pasta'],
    'Frozen': ['frozen', 'ice', 'cold'],
    'Beverages': ['drink', 'beverage', 'juice', 'soda', 'water', 'tea', 'coffee'],
    'Other': ['other', 'misc', 'miscellaneous'],
  };

  analytics.mostUsedCategories.forEach(catStats => {
    const categoryLower = catStats.categoryName.toLowerCase();
    const similar: string[] = [];

    // Check if custom category name contains keywords from predefined categories
    Object.entries(categoryKeywords).forEach(([predefinedCat, keywords]) => {
      if (keywords.some(keyword => categoryLower.includes(keyword))) {
        similar.push(predefinedCat);
      }
    });

    insights.push({
      customCategory: catStats.categoryName,
      usageCount: catStats.usageCount,
      similarPredefinedCategories: similar,
    });
  });

  return insights;
}

/**
 * Get summary statistics for display
 * @param listId - Optional list ID to filter by
 * @returns Summary statistics
 */
export function getCategorySummaryStats(listId?: string): {
  totalCreated: number;
  totalDeleted: number;
  totalUsage: number;
  averageUsagePerCategory: number;
  mostActiveDay: { date: string; count: number } | null;
} {
  const events = listId
    ? getAllEvents().filter(e => e.listId === listId)
    : getAllEvents();

  const created = events.filter(e => e.type === 'category_created');
  const deleted = events.filter(e => e.type === 'category_deleted');
  const usage = events.filter(e => e.type === 'category_used_in_item');

  // Calculate average usage per category
  const categoryUsage = new Map<string, number>();
  usage.forEach(event => {
    categoryUsage.set(event.categoryName, (categoryUsage.get(event.categoryName) || 0) + 1);
  });

  const averageUsagePerCategory = categoryUsage.size > 0
    ? Array.from(categoryUsage.values()).reduce((a, b) => a + b, 0) / categoryUsage.size
    : 0;

  // Find most active day
  const dayActivity = new Map<string, number>();
  events.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    dayActivity.set(date, (dayActivity.get(date) || 0) + 1);
  });

  let mostActiveDay: { date: string; count: number } | null = null;
  dayActivity.forEach((count, date) => {
    if (!mostActiveDay || count > mostActiveDay.count) {
      mostActiveDay = { date, count };
    }
  });

  return {
    totalCreated: created.length,
    totalDeleted: deleted.length,
    totalUsage: usage.length,
    averageUsagePerCategory: Math.round(averageUsagePerCategory * 10) / 10,
    mostActiveDay,
  };
}
