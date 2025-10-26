# Category Analytics System

## Overview

The Category Analytics system tracks user interactions with custom categories to provide insights into feature adoption and usage patterns. This helps understand how users are organizing their grocery items and which custom categories are most valuable.

## Features

- **Automatic Event Tracking**: All category interactions are automatically logged
- **LocalStorage Persistence**: Events are stored in localStorage for privacy and offline support
- **Automatic Cleanup**: Old events (>90 days) are automatically removed
- **Privacy-First**: All data stays on the user's device unless explicitly sent to a backend
- **Zero Configuration**: Analytics work out-of-the-box without setup

## Tracked Events

### 1. Category Created
Logged when a user creates a new custom category.

**Event Data:**
- Category name
- List ID
- Color (optional)
- Icon (optional)
- Timestamp

### 2. Category Edited
Logged when a user edits an existing custom category.

**Event Data:**
- Category name (new)
- Old name (if changed)
- Whether color changed
- Whether icon changed
- List ID
- Timestamp

### 3. Category Deleted
Logged when a user deletes a custom category.

**Event Data:**
- Category name
- List ID
- Timestamp

### 4. Category Used in Item
Logged when a user adds an item using a custom category.

**Event Data:**
- Category name
- List ID
- Item name (optional)
- Timestamp

### 5. Category Filter Applied
Logged when a user filters items by a custom category.

**Event Data:**
- Category name
- List ID
- Filter state (active/inactive)
- Timestamp

## Integration Points

### CustomCategoryManager Component
- Tracks category creation in `handleAddCategory`
- Tracks category edits in `handleSaveEdit`
- Tracks category deletion in `handleConfirmDelete`

### AddItemForm Component
- Tracks category usage when items are created with custom categories
- Only tracks custom categories (not predefined ones)

### SearchFilterBar Component
- Tracks when users filter by custom categories
- Only tracks activation (not deactivation)

## Usage Examples

### Basic Analytics Queries

```typescript
import {
  getCategoryAnalytics,
  getGlobalCategoryAnalytics,
  getCategorySummaryStats,
} from '../utils/categoryAnalytics';

// Get analytics for a specific list
const analytics = getCategoryAnalytics('list-123');
console.log('Total custom categories:', analytics.totalCustomCategories);
console.log('Most used categories:', analytics.mostUsedCategories);

// Get global analytics across all lists
const globalAnalytics = getGlobalCategoryAnalytics();
console.log('Total events:', globalAnalytics.totalEvents);
console.log('Lists using custom categories:', globalAnalytics.totalLists);

// Get summary statistics
const summary = getCategorySummaryStats('list-123');
console.log('Average usage per category:', summary.averageUsagePerCategory);
```

### Category Analytics Dashboard

```typescript
import { getCategoryAnalytics } from '../utils/categoryAnalytics';

function CategoryAnalyticsDashboard({ listId }) {
  const analytics = getCategoryAnalytics(listId);

  return (
    <div>
      <h2>Category Analytics</h2>

      <div>
        <h3>Overview</h3>
        <p>Total Custom Categories: {analytics.totalCustomCategories}</p>
        <p>Total Category Usage: {analytics.totalCategoryUsage}</p>
        <p>Total Filter Usage: {analytics.totalFilterUsage}</p>
      </div>

      <div>
        <h3>Most Used Categories</h3>
        <ul>
          {analytics.mostUsedCategories.map(cat => (
            <li key={cat.categoryName}>
              {cat.categoryName}: {cat.usageCount} uses
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Recent Creations</h3>
        <ul>
          {analytics.recentlyCreatedCategories.map(cat => (
            <li key={cat.categoryName}>
              {cat.categoryName} - {new Date(cat.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### Export Analytics Data

```typescript
import { exportAnalyticsData } from '../utils/categoryAnalytics';

// Export all analytics as JSON
const jsonData = exportAnalyticsData();

// Download as file
const blob = new Blob([jsonData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'category-analytics.json';
a.click();
```

## Data Structure

### CategoryEvent
```typescript
interface CategoryEvent {
  id: string;                    // Unique event ID
  type: CategoryEventType;       // Event type
  listId: string;                // Associated list ID
  categoryName: string;          // Category name
  timestamp: number;             // Event timestamp (ms)
  userId?: string;               // User ID (if available)
  metadata?: Record<string, any>; // Additional event data
}
```

### CategoryAnalytics
```typescript
interface CategoryAnalytics {
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
```

## Storage Management

Analytics events are stored in localStorage under the key `grocery_category_analytics`.

### Storage Limits
- **Maximum Events**: 10,000 (older events are automatically removed)
- **Maximum Age**: 90 days (events older than 90 days are automatically cleaned up)
- **Automatic Cleanup**: Happens on every read operation

### Clearing Data

```typescript
import { clearAnalyticsData } from '../utils/categoryAnalytics';

// Clear all analytics data (WARNING: cannot be undone)
clearAnalyticsData();
```

## Advanced Features

### Category Replacement Insights

Understand which predefined categories users are replacing with custom ones:

```typescript
import { getCategoryReplacementInsights } from '../utils/categoryAnalytics';

const insights = getCategoryReplacementInsights('list-123');
insights.forEach(insight => {
  console.log(`Custom category "${insight.customCategory}"`);
  console.log(`Used ${insight.usageCount} times`);
  console.log(`Similar to: ${insight.similarPredefinedCategories.join(', ')}`);
});
```

### Date Range Queries

Get events for a specific time period:

```typescript
import { getEventsByDateRange } from '../utils/categoryAnalytics';

const startDate = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
const endDate = Date.now();

const recentEvents = getEventsByDateRange(startDate, endDate, 'list-123');
console.log(`Events in the last 7 days: ${recentEvents.length}`);
```

## Privacy Considerations

1. **Local Storage Only**: All analytics data is stored in the user's browser localStorage
2. **No Automatic Transmission**: Data is never automatically sent to any server
3. **User Control**: Users can clear analytics data at any time
4. **No Personal Information**: Only category names, usage counts, and timestamps are stored
5. **Optional Backend Integration**: If you want to send analytics to a backend, you must implement it explicitly

## Backend Integration (Optional)

To send analytics to a backend API, create a service that periodically sends events:

```typescript
import { getAllEvents } from '../utils/categoryAnalytics';
import { api } from './api';

async function syncAnalytics() {
  const events = getAllEvents();

  // Send to your backend
  await api.post('/analytics/category-events', {
    events,
    timestamp: Date.now(),
  });
}

// Sync every hour
setInterval(syncAnalytics, 60 * 60 * 1000);
```

## Testing

```typescript
import {
  logCategoryCreated,
  logCategoryUsed,
  getCategoryAnalytics,
  clearAnalyticsData,
} from '../utils/categoryAnalytics';

// Clear existing data for testing
clearAnalyticsData();

// Create test data
logCategoryCreated('test-list', 'Test Category', { color: '#FF0000' });
logCategoryUsed('test-list', 'Test Category', { itemName: 'Test Item' });

// Verify
const analytics = getCategoryAnalytics('test-list');
expect(analytics.totalCustomCategories).toBe(1);
expect(analytics.totalCategoryUsage).toBe(1);
```

## Future Enhancements

Possible future improvements to the analytics system:

1. **Category Suggestions**: Use analytics to suggest popular categories to users
2. **Usage Reports**: Generate weekly/monthly usage reports
3. **Trend Analysis**: Identify growing or declining category usage
4. **Cross-List Analysis**: Find common categories across multiple lists
5. **Export Formats**: Support CSV and Excel exports
6. **Visualization**: Add charts and graphs for analytics display
7. **Comparison Metrics**: Compare usage before/after custom category creation

## API Reference

See the inline documentation in `/home/adam/grocery/src/utils/categoryAnalytics.ts` for complete API reference.

### Main Functions

- `logCategoryCreated()` - Track category creation
- `logCategoryEdited()` - Track category edits
- `logCategoryDeleted()` - Track category deletion
- `logCategoryUsed()` - Track category usage in items
- `logCategoryFilterApplied()` - Track category filter usage
- `getCategoryAnalytics()` - Get analytics for a list
- `getGlobalCategoryAnalytics()` - Get global analytics
- `getCategorySummaryStats()` - Get summary statistics
- `exportAnalyticsData()` - Export all data as JSON
- `clearAnalyticsData()` - Clear all analytics data
- `getCategoryReplacementInsights()` - Analyze category replacements
- `getEventsByDateRange()` - Query events by date range

## Troubleshooting

### Events Not Being Tracked

1. Check browser console for errors
2. Verify localStorage is not disabled
3. Check that functions are being called in the right places

### Storage Quota Exceeded

If localStorage quota is exceeded:
1. Clear old analytics data with `clearAnalyticsData()`
2. Reduce `MAX_EVENTS` constant in the analytics module
3. Export data before clearing if needed

### Analytics Not Showing Recent Events

Events are cached in memory. Try:
1. Refresh the page
2. Check the timestamp on events
3. Verify the date range queries

## Support

For questions or issues with the analytics system, please check:
1. This README
2. Inline code documentation
3. The codebase examples above
