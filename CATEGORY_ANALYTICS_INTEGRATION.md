# Category Analytics - Quick Integration Guide

## What Was Added

Analytics tracking has been integrated into the grocery app to monitor custom category usage. This document provides a quick overview of what was added and how to use it.

## New Files

1. **`/home/adam/grocery/src/utils/categoryAnalytics.ts`** - Core analytics utility
2. **`/home/adam/grocery/src/utils/CATEGORY_ANALYTICS_README.md`** - Full documentation
3. **`/home/adam/grocery/src/components/CategoryAnalyticsViewer.tsx`** - Optional UI component
4. **`/home/adam/grocery/CATEGORY_ANALYTICS_SUMMARY.md`** - Implementation summary

## Modified Files

1. **`/home/adam/grocery/src/components/CustomCategoryManager.tsx`**
   - Added analytics tracking for create/edit/delete operations
   - No UI changes, tracking happens in background

2. **`/home/adam/grocery/src/components/AddItemForm.tsx`**
   - Added analytics tracking when items are created with custom categories
   - No UI changes, tracking happens automatically

3. **`/home/adam/grocery/src/components/SearchFilterBar.tsx`**
   - Added analytics tracking when users filter by custom categories
   - No UI changes, tracking happens automatically

## How It Works

### 1. Automatic Tracking
All category interactions are automatically tracked:
- Creating a custom category
- Editing a custom category
- Deleting a custom category
- Adding an item with a custom category
- Filtering items by a custom category

### 2. Local Storage
All analytics data is stored in the browser's localStorage:
- Key: `grocery_category_analytics`
- Format: JSON array of events
- Automatic cleanup: Events older than 90 days are removed
- Max events: 10,000 (oldest removed first)

### 3. Privacy-First
- Data never leaves the user's device
- No automatic transmission to any server
- Users can clear data anytime
- No personal information stored

## Using the Analytics

### Option 1: Programmatic Access

```typescript
import { getCategoryAnalytics } from './utils/categoryAnalytics';

// Get analytics for a specific list
const analytics = getCategoryAnalytics('list-123');

console.log('Total custom categories:', analytics.totalCustomCategories);
console.log('Total usage:', analytics.totalCategoryUsage);
console.log('Most used:', analytics.mostUsedCategories);
```

### Option 2: Analytics Viewer Component

```typescript
import { CategoryAnalyticsViewer } from './components/CategoryAnalyticsViewer';
import { useState } from 'react';

function MyComponent({ listId }) {
  const [showAnalytics, setShowAnalytics] = useState(false);

  return (
    <>
      <button onClick={() => setShowAnalytics(true)}>
        View Category Analytics
      </button>

      {showAnalytics && (
        <CategoryAnalyticsViewer
          listId={listId}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </>
  );
}
```

### Option 3: Export Data

```typescript
import { exportAnalyticsData } from './utils/categoryAnalytics';

// Export as JSON
const jsonData = exportAnalyticsData();

// Download as file
const blob = new Blob([jsonData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'category-analytics.json';
a.click();
```

## Available Analytics

### Per-List Analytics
```typescript
const analytics = getCategoryAnalytics('list-123');
```

Returns:
- `totalCustomCategories` - Count of categories created
- `totalCategoryUsage` - Total times categories used in items
- `totalFilterUsage` - Total times categories used in filters
- `mostUsedCategories` - Array of categories ranked by usage
- `recentlyCreatedCategories` - Latest categories created
- `categoryCreationTrend` - Daily creation counts (last 30 days)
- `deletedCategories` - Categories that were removed
- `filterUsageByCategory` - Filter usage breakdown

### Global Analytics
```typescript
const global = getGlobalCategoryAnalytics();
```

Returns:
- `totalEvents` - Total number of events tracked
- `totalLists` - Number of lists with custom categories
- `totalCustomCategories` - Total categories across all lists
- `totalCategoryUsage` - Total usage across all lists
- `globalMostUsedCategories` - Most used categories globally
- `listsWithCustomCategories` - Array of list IDs

### Summary Statistics
```typescript
const summary = getCategorySummaryStats('list-123');
```

Returns:
- `totalCreated` - Categories created
- `totalDeleted` - Categories deleted
- `totalUsage` - Total usage count
- `averageUsagePerCategory` - Average usage per category
- `mostActiveDay` - Day with most activity

## Integration Points

### Where Tracking Happens

1. **Category Creation** - `CustomCategoryManager.tsx:handleAddCategory()`
2. **Category Edit** - `CustomCategoryManager.tsx:handleSaveEdit()`
3. **Category Delete** - `CustomCategoryManager.tsx:handleConfirmDelete()`
4. **Category Usage** - `AddItemForm.tsx:handleSubmit()`
5. **Filter Usage** - `SearchFilterBar.tsx:handleCategoryToggle()`

### What's Tracked

Each event includes:
- Event type (created, edited, deleted, used, filtered)
- Category name
- List ID
- Timestamp
- Metadata (varies by event type)

## Viewing Analytics in UI

To add a "View Analytics" button to your app:

```typescript
// In your ListDashboard or similar component
import { useState } from 'react';
import { CategoryAnalyticsViewer } from './components/CategoryAnalyticsViewer';

function ListDashboard({ listId }) {
  const [showAnalytics, setShowAnalytics] = useState(false);

  return (
    <div>
      {/* Your existing UI */}

      <button
        onClick={() => setShowAnalytics(true)}
        className="btn btn-secondary"
      >
        📊 View Category Analytics
      </button>

      {showAnalytics && (
        <CategoryAnalyticsViewer
          listId={listId}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  );
}
```

## Backend Integration (Optional)

If you want to send analytics to a backend:

```typescript
import { getAllEvents } from './utils/categoryAnalytics';
import { api } from './api';

// Send events to backend
async function syncAnalytics() {
  const events = getAllEvents();

  try {
    await api.post('/analytics/category-events', {
      events,
      userId: getCurrentUser().id,
      timestamp: Date.now(),
    });
    console.log('Analytics synced successfully');
  } catch (error) {
    console.error('Failed to sync analytics:', error);
  }
}

// Sync periodically
setInterval(syncAnalytics, 60 * 60 * 1000); // Every hour
```

## Clearing Analytics

```typescript
import { clearAnalyticsData } from './utils/categoryAnalytics';

// Clear all analytics (cannot be undone)
if (confirm('Clear all analytics data?')) {
  clearAnalyticsData();
  alert('Analytics data cleared');
}
```

## Testing

To verify analytics are working:

1. Open browser console
2. Create a custom category
3. Look for: `[CategoryAnalytics] Category created: [name]`
4. Add an item with that category
5. Filter by that category
6. Check localStorage: `localStorage.getItem('grocery_category_analytics')`

## Performance Impact

- **Minimal**: Events are logged asynchronously
- **Storage**: ~1KB per 10 events
- **Cleanup**: Automatic, runs on read operations
- **No UI changes**: Zero visual impact

## Privacy Compliance

- ✅ Data stored locally only
- ✅ No automatic transmission
- ✅ User can clear data
- ✅ No personal information
- ✅ No third-party services
- ✅ GDPR/CCPA compliant

## Troubleshooting

### Analytics Not Working
1. Check console for errors
2. Verify localStorage is enabled
3. Check that integration points are called

### Storage Quota Exceeded
1. Export and clear old data
2. Reduce MAX_EVENTS in analytics module

### Events Not Showing
1. Refresh the page
2. Check event timestamps
3. Verify listId matches

## Next Steps

1. **Add UI Integration**: Add analytics viewer to your dashboard
2. **Backend Sync** (optional): Send events to your analytics service
3. **Reports** (optional): Generate weekly/monthly reports
4. **Visualizations** (optional): Add charts and graphs

## Documentation

For complete documentation, see:
- `/home/adam/grocery/src/utils/CATEGORY_ANALYTICS_README.md` - Full documentation
- `/home/adam/grocery/CATEGORY_ANALYTICS_SUMMARY.md` - Implementation details
- `/home/adam/grocery/src/utils/categoryAnalytics.ts` - Inline code docs

## Support

All analytics functions include JSDoc comments with examples. Check the source code for detailed API documentation.
