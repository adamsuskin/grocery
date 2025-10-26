/**
 * Category Analytics - Usage Examples
 *
 * This file contains practical examples of how to use the category analytics system.
 * Copy and adapt these examples for your specific use cases.
 */

import {
  getCategoryAnalytics,
  getGlobalCategoryAnalytics,
  getCategorySummaryStats,
  getCategoryReplacementInsights,
  exportAnalyticsData,
  clearAnalyticsData,
  getEventsByDateRange,
} from './categoryAnalytics';

// ============================================================================
// Example 1: Display Category Usage Statistics
// ============================================================================

export function displayCategoryStats(listId: string): void {
  const analytics = getCategoryAnalytics(listId);

  console.log('=== Category Statistics ===');
  console.log(`Total Custom Categories: ${analytics.totalCustomCategories}`);
  console.log(`Total Category Usage: ${analytics.totalCategoryUsage}`);
  console.log(`Total Filter Usage: ${analytics.totalFilterUsage}`);

  console.log('\n=== Most Used Categories ===');
  analytics.mostUsedCategories.slice(0, 5).forEach((cat, index) => {
    console.log(
      `${index + 1}. ${cat.categoryName}: ${cat.usageCount} uses ` +
      `(last used: ${new Date(cat.lastUsed).toLocaleDateString()})`
    );
  });
}

// ============================================================================
// Example 2: Generate Weekly Report
// ============================================================================

export function generateWeeklyReport(listId: string): string {
  const analytics = getCategoryAnalytics(listId);
  const summary = getCategorySummaryStats(listId);

  const report = `
# Weekly Category Report

## Overview
- Custom Categories Created: ${summary.totalCreated}
- Custom Categories Deleted: ${summary.totalDeleted}
- Total Category Usage: ${summary.totalUsage}
- Average Usage per Category: ${summary.averageUsagePerCategory}

## Top 5 Most Used Categories
${analytics.mostUsedCategories.slice(0, 5).map((cat, i) =>
  `${i + 1}. ${cat.categoryName} - ${cat.usageCount} uses`
).join('\n')}

## Recently Created Categories
${analytics.recentlyCreatedCategories.slice(0, 5).map(cat =>
  `- ${cat.categoryName} (created ${new Date(cat.createdAt).toLocaleDateString()})`
).join('\n')}

## Most Active Day
${summary.mostActiveDay
  ? `${new Date(summary.mostActiveDay.date).toLocaleDateString()} with ${summary.mostActiveDay.count} events`
  : 'No activity recorded'
}
  `.trim();

  return report;
}

// ============================================================================
// Example 3: Check Category Adoption Rate
// ============================================================================

export function getCategoryAdoptionRate(listId: string): {
  adoptionRate: number;
  message: string;
} {
  const analytics = getCategoryAnalytics(listId);

  if (analytics.totalCustomCategories === 0) {
    return {
      adoptionRate: 0,
      message: 'No custom categories created yet',
    };
  }

  const averageUsage = analytics.totalCategoryUsage / analytics.totalCustomCategories;

  let message: string;
  if (averageUsage === 0) {
    message = 'Custom categories created but not used yet';
  } else if (averageUsage < 3) {
    message = 'Low adoption - custom categories are rarely used';
  } else if (averageUsage < 10) {
    message = 'Moderate adoption - custom categories are being used';
  } else {
    message = 'High adoption - custom categories are frequently used!';
  }

  return {
    adoptionRate: Math.round(averageUsage * 10) / 10,
    message,
  };
}

// ============================================================================
// Example 4: Identify Unused Categories
// ============================================================================

export function getUnusedCategories(listId: string): string[] {
  const analytics = getCategoryAnalytics(listId);

  const usedCategories = new Set(
    analytics.mostUsedCategories.map(cat => cat.categoryName)
  );

  const allCategories = analytics.recentlyCreatedCategories.map(
    cat => cat.categoryName
  );

  return allCategories.filter(name => !usedCategories.has(name));
}

// ============================================================================
// Example 5: Get Category Insights for UI Display
// ============================================================================

export interface CategoryInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
}

export function getCategoryInsights(listId: string): CategoryInsight[] {
  const analytics = getCategoryAnalytics(listId);
  const summary = getCategorySummaryStats(listId);
  const insights: CategoryInsight[] = [];

  // Check if user has created custom categories
  if (analytics.totalCustomCategories === 0) {
    insights.push({
      title: 'No Custom Categories',
      description: 'Create custom categories to better organize your items!',
      type: 'info',
    });
    return insights;
  }

  // Check for highly used categories
  if (analytics.mostUsedCategories.length > 0) {
    const topCategory = analytics.mostUsedCategories[0];
    if (topCategory.usageCount >= 10) {
      insights.push({
        title: `"${topCategory.categoryName}" is Popular!`,
        description: `This category has been used ${topCategory.usageCount} times`,
        type: 'success',
      });
    }
  }

  // Check for unused categories
  const unused = getUnusedCategories(listId);
  if (unused.length > 0) {
    insights.push({
      title: 'Unused Categories',
      description: `${unused.length} categories haven't been used yet. Consider using or removing them.`,
      type: 'warning',
    });
  }

  // Check for recent activity
  if (analytics.recentlyCreatedCategories.length > 0) {
    const recent = analytics.recentlyCreatedCategories[0];
    const daysAgo = Math.floor((Date.now() - recent.createdAt) / (1000 * 60 * 60 * 24));
    if (daysAgo <= 7) {
      insights.push({
        title: 'Recent Activity',
        description: `"${recent.categoryName}" was created ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`,
        type: 'info',
      });
    }
  }

  return insights;
}

// ============================================================================
// Example 6: Export Analytics for Backup
// ============================================================================

export function downloadAnalyticsBackup(): void {
  const jsonData = exportAnalyticsData();
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `category-analytics-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('Analytics backup downloaded successfully');
}

// ============================================================================
// Example 7: Compare Category Usage Across Lists
// ============================================================================

export function compareListAnalytics(listIds: string[]): {
  listId: string;
  totalCategories: number;
  totalUsage: number;
  topCategory: string | null;
}[] {
  return listIds.map(listId => {
    const analytics = getCategoryAnalytics(listId);
    const topCategory = analytics.mostUsedCategories[0]?.categoryName || null;

    return {
      listId,
      totalCategories: analytics.totalCustomCategories,
      totalUsage: analytics.totalCategoryUsage,
      topCategory,
    };
  });
}

// ============================================================================
// Example 8: Track Category Performance Over Time
// ============================================================================

export function getCategoryPerformanceTrend(
  listId: string,
  categoryName: string,
  days: number = 30
): Array<{ date: string; uses: number }> {
  const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
  const endDate = Date.now();

  const events = getEventsByDateRange(startDate, endDate, listId);

  // Filter events for specific category usage
  const categoryEvents = events.filter(
    event => event.type === 'category_used_in_item' && event.categoryName === categoryName
  );

  // Group by date
  const usageByDate = new Map<string, number>();

  categoryEvents.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    usageByDate.set(date, (usageByDate.get(date) || 0) + 1);
  });

  // Convert to array and sort
  return Array.from(usageByDate.entries())
    .map(([date, uses]) => ({ date, uses }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// Example 9: Suggest Category Improvements
// ============================================================================

export function suggestCategoryImprovements(listId: string): string[] {
  const analytics = getCategoryAnalytics(listId);
  const suggestions: string[] = [];

  // Check for low-usage categories
  const lowUsage = analytics.mostUsedCategories.filter(cat => cat.usageCount < 3);
  if (lowUsage.length > 0) {
    suggestions.push(
      `Consider merging low-usage categories: ${lowUsage.map(c => c.categoryName).join(', ')}`
    );
  }

  // Check for similar category names
  const insights = getCategoryReplacementInsights(listId);
  insights.forEach(insight => {
    if (insight.similarPredefinedCategories.length > 0) {
      suggestions.push(
        `"${insight.customCategory}" seems similar to "${insight.similarPredefinedCategories[0]}". ` +
        `Consider using the predefined category instead.`
      );
    }
  });

  // Check for deleted categories
  if (analytics.deletedCategories.length > 2) {
    suggestions.push(
      `You've deleted ${analytics.deletedCategories.length} categories. ` +
      `Consider planning categories more carefully before creating them.`
    );
  }

  return suggestions;
}

// ============================================================================
// Example 10: Global Analytics Dashboard Data
// ============================================================================

export function getGlobalDashboardData(): {
  totalLists: number;
  totalCategories: number;
  totalUsage: number;
  averageUsagePerList: number;
  topCategories: Array<{ name: string; usage: number }>;
} {
  const global = getGlobalCategoryAnalytics();

  return {
    totalLists: global.totalLists,
    totalCategories: global.totalCustomCategories,
    totalUsage: global.totalCategoryUsage,
    averageUsagePerList: global.totalLists > 0
      ? Math.round(global.totalCategoryUsage / global.totalLists)
      : 0,
    topCategories: global.globalMostUsedCategories.slice(0, 10).map(cat => ({
      name: cat.categoryName,
      usage: cat.usageCount,
    })),
  };
}

// ============================================================================
// Example 11: Automated Weekly Email Report (Backend Integration)
// ============================================================================

export async function sendWeeklyAnalyticsEmail(
  listId: string,
  userEmail: string
): Promise<void> {
  const report = generateWeeklyReport(listId);
  const insights = getCategoryInsights(listId);

  // This would call your backend API
  // Example implementation:
  /*
  await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: userEmail,
      subject: 'Your Weekly Category Analytics Report',
      body: report,
      insights,
    }),
  });
  */

  console.log('Weekly report generated:', report);
  console.log('Insights:', insights);
}

// ============================================================================
// Example 12: Cleanup Old Analytics Data
// ============================================================================

export function performAnalyticsCleanup(): {
  eventsBefore: number;
  eventsAfter: number;
  eventsRemoved: number;
} {
  // Note: The analytics system automatically cleans up old events,
  // but you can force a cleanup by reading and writing back the data

  const jsonData = exportAnalyticsData();
  const data = JSON.parse(jsonData);
  const eventsBefore = data.events.length;

  // The next read will trigger automatic cleanup
  clearAnalyticsData();

  // Re-import the data (which will trigger cleanup of old events)
  localStorage.setItem('grocery_category_analytics', JSON.stringify(data.events));

  const jsonDataAfter = exportAnalyticsData();
  const dataAfter = JSON.parse(jsonDataAfter);
  const eventsAfter = dataAfter.events.length;

  return {
    eventsBefore,
    eventsAfter,
    eventsRemoved: eventsBefore - eventsAfter,
  };
}
