# Category Audit Log Implementation

## Overview

This document describes the comprehensive audit log system for tracking all category-related changes in the grocery list application. The system logs all category operations and displays them in activity feeds.

## Features Implemented

### 1. Database Schema Updates

**Migration File:** `/home/adam/grocery/server/migrations/012_add_category_activities.sql`

Added support for 6 new activity types to the `list_activities` table:
- `category_created` - When a custom category is created
- `category_updated` - When category properties are modified (name, color, icon, display order)
- `category_archived` - When a category is soft-deleted (archived)
- `category_restored` - When an archived category is restored
- `category_deleted` - When a category is permanently deleted
- `category_merged` - When multiple categories are merged into one

**Activity Details Structure:**
```json
{
  "category_id": "uuid",
  "category_name": "string",
  "changes": [
    {
      "field": "name|color|icon|display_order",
      "old_value": "string",
      "new_value": "string"
    }
  ],
  "merged_into": "category_id",
  "source_categories": ["category_id"]
}
```

### 2. Backend Activity Logging

**Updated Files:**
- `/home/adam/grocery/server/activities/controller.ts`
  - Extended `ActivityAction` type with category actions
  - Updated `formatActivityMessage()` to handle category activities
  - Added `createActivity()` endpoint for logging activities

- `/home/adam/grocery/server/activities/routes.ts`
  - Added POST endpoint: `POST /api/lists/:id/activities`
  - Requires editor or owner permission to log activities

### 3. Frontend Activity Logger

**New File:** `/home/adam/grocery/src/utils/categoryActivityLogger.ts`

Provides helper functions for logging category activities:

#### Core Functions:
- `logCategoryActivity()` - Main function to log activities to the server
- `detectCategoryChanges()` - Detects which fields changed during updates
- `createCategoryCreatedDetails()` - Format details for creation
- `createCategoryUpdatedDetails()` - Format details with change tracking
- `createCategoryArchivedDetails()` - Format details for archiving
- `createCategoryRestoredDetails()` - Format details for restoration
- `createCategoryDeletedDetails()` - Format details for deletion
- `createCategoryMergedDetails()` - Format details for merge operations

**Example Usage:**
```typescript
import {
  logCategoryActivity,
  createCategoryCreatedDetails
} from '../utils/categoryActivityLogger';

// Log category creation
await logCategoryActivity(
  listId,
  'category_created',
  createCategoryCreatedDetails(categoryId, categoryName),
  authToken
);

// Log category update with changes
await logCategoryActivity(
  listId,
  'category_updated',
  createCategoryUpdatedDetails(
    categoryId,
    categoryName,
    [
      { field: 'name', old_value: 'Snacks', new_value: 'Healthy Snacks' },
      { field: 'color', old_value: '#FF5733', new_value: '#4CAF50' }
    ]
  ),
  authToken
);
```

### 4. Category Mutations with Activity Logging

**Updated File:** `/home/adam/grocery/src/hooks/useCustomCategories.ts`

All category mutation functions now log activities:

#### `addCustomCategory()`
- Logs `category_created` after successful creation
- Records category ID and name

#### `updateCustomCategory()`
- Detects changes between old and new values
- Logs `category_updated` with detailed change list
- Only logs if actual changes are detected

#### `archiveCategory()`
- Logs `category_archived` when category is soft-deleted
- Preserves category name for historical reference

#### `restoreCategory()`
- Logs `category_restored` when archived category is reactivated
- Records restoration action

#### `deleteCustomCategory()`
- Logs `category_deleted` when category is permanently removed
- Only logs for categories that are already archived

#### `mergeCategories()`
- Logs `category_merged` with source and target information
- Records how many categories were merged

### 5. ListActivity Component Enhancements

**Updated File:** `/home/adam/grocery/src/components/ListActivity.tsx`

#### New Features:
1. **Category Activity Display**
   - Added formatting for all 6 category activity types
   - Shows detailed change information for updates
   - Uses appropriate icons for each activity type

2. **Activity Filtering**
   - Filter by "All", "Categories", "Items", or "Members"
   - Real-time filtering without server requests
   - Shows activity count per filter

3. **Category Activity Icons**
   - 🏷️ Category Created
   - ✏️ Category Updated
   - 📦 Category Archived
   - ♻️ Category Restored
   - 🗑️ Category Deleted
   - 🔀 Category Merged

**Activity Message Examples:**
- "John created category 'Snacks'"
- "Sarah updated category 'Healthy Snacks' (name, color)"
- "Mike archived category 'Old Category'"
- "Emily merged 3 categories into 'Pantry Items'"

### 6. CategoryStatistics Component Integration

**Updated File:** `/home/adam/grocery/src/components/CategoryStatistics.tsx`

#### New Section: Recent Category Changes
- Displays last 5 category-related activities
- Shows activity icon, message, and timestamp
- Formatted relative time (e.g., "2h ago", "3d ago")
- Link hint to view all activities in Activity Log

**Features:**
- Fetches activities on component mount
- Filters for category activities only
- Responsive time formatting
- Visual consistency with ListActivity component

**CSS Styling:** `/home/adam/grocery/src/components/CategoryStatistics.css`
- Activity list with hover effects
- Consistent icon and message formatting
- Responsive layout for mobile devices

## Activity Log Data Flow

```
1. User Action (e.g., create category)
   ↓
2. useCustomCategoryMutations hook
   ↓
3. Zero database mutation (optimistic update)
   ↓
4. categoryActivityLogger helper
   ↓
5. POST /api/lists/:id/activities
   ↓
6. Server validates and stores activity
   ↓
7. Activity appears in ListActivity component
   ↓
8. Activity shows in CategoryStatistics (recent changes)
```

## Type Definitions

**Updated File:** `/home/adam/grocery/src/types.ts`

Extended `ActivityAction` type:
```typescript
export type ActivityAction =
  | 'list_created'
  | 'list_renamed'
  | 'list_deleted'
  | 'list_archived'
  | 'list_unarchived'
  | 'list_shared'
  | 'member_added'
  | 'member_removed'
  | 'member_permission_changed'
  | 'ownership_transferred'
  | 'item_added'
  | 'item_updated'
  | 'item_deleted'
  | 'item_checked'
  | 'item_unchecked'
  | 'items_cleared'
  | 'items_bulk_deleted'
  | 'category_created'
  | 'category_updated'
  | 'category_archived'
  | 'category_restored'
  | 'category_deleted'
  | 'category_merged';
```

## API Endpoints

### GET /api/lists/:id/activities
Retrieve activities for a list
- **Query Params:** `limit` (default: 50), `offset` (default: 0)
- **Access:** List viewer or higher
- **Returns:** Array of activities with user details

### POST /api/lists/:id/activities
Create a new activity entry
- **Body:** `{ action: ActivityAction, details?: Record<string, any> }`
- **Access:** List editor or higher
- **Returns:** `{ id: string }`

## Usage Examples

### Creating a Category with Activity Logging
```typescript
const { addCustomCategory } = useCustomCategoryMutations();

try {
  await addCustomCategory({
    name: 'Snacks',
    listId: 'list-123',
    color: '#FF5733',
    icon: '🍿'
  });
  // Activity is automatically logged
} catch (error) {
  console.error('Failed to create category:', error);
}
```

### Updating a Category with Change Tracking
```typescript
const { updateCustomCategory } = useCustomCategoryMutations();

try {
  await updateCustomCategory({
    id: 'cat-456',
    name: 'Healthy Snacks',
    color: '#4CAF50'
  });
  // Activity logged with changes: name, color
} catch (error) {
  console.error('Failed to update category:', error);
}
```

### Viewing Category Activities
```typescript
// In ListActivity component
<ListActivity listId={listId} limit={20} />

// Filter to show only category activities
// Click "Categories" filter button

// In CategoryStatistics modal
// View "Recent Category Changes" section at the bottom
```

## Error Handling

Activity logging is designed to be non-blocking:
- If activity logging fails, the main operation still succeeds
- Errors are logged to console but not thrown
- User experience is not interrupted by logging failures

## Performance Considerations

1. **Optimistic Updates:** Category mutations use Zero's optimistic update strategy
2. **Lazy Loading:** Activities are fetched only when needed
3. **Caching:** Activity logger silently fails without blocking operations
4. **Filtering:** Activity filtering happens client-side for instant results

## Testing Checklist

- [x] Database migration applies successfully
- [x] Activity logging for category creation
- [x] Activity logging for category updates with change tracking
- [x] Activity logging for category archiving
- [x] Activity logging for category restoration
- [x] Activity logging for category deletion
- [x] Activity logging for category merging
- [x] ListActivity component displays category activities
- [x] Activity filtering by type works correctly
- [x] CategoryStatistics shows recent category changes
- [x] Icons display correctly for each activity type
- [x] Activity messages are formatted properly
- [x] Relative time formatting works
- [x] Activity logging doesn't block main operations
- [x] Error handling for failed activity logging

## Migration Instructions

1. **Apply Database Migration:**
   ```bash
   psql -U postgres -d grocery_app -f server/migrations/012_add_category_activities.sql
   ```

2. **Restart Server:**
   ```bash
   cd server
   npm run dev
   ```

3. **Clear Client Cache (if needed):**
   ```bash
   cd ..
   npm run dev
   ```

## Future Enhancements

Potential improvements for the audit log system:

1. **Detailed Change Views:** Show before/after values in expandable sections
2. **Activity Search:** Search activities by category name or user
3. **Activity Export:** Export activity log as CSV or JSON
4. **Activity Notifications:** Real-time notifications for category changes
5. **Undo/Redo:** Allow undoing recent category changes
6. **Bulk Operations Logging:** Better tracking of bulk category operations
7. **Activity Permissions:** Control who can view activity logs
8. **Activity Retention:** Configurable retention period for old activities

## Related Files

### Backend
- `/home/adam/grocery/server/migrations/012_add_category_activities.sql`
- `/home/adam/grocery/server/migrations/012_add_category_activities_rollback.sql`
- `/home/adam/grocery/server/activities/controller.ts`
- `/home/adam/grocery/server/activities/routes.ts`

### Frontend
- `/home/adam/grocery/src/utils/categoryActivityLogger.ts`
- `/home/adam/grocery/src/hooks/useCustomCategories.ts`
- `/home/adam/grocery/src/components/ListActivity.tsx`
- `/home/adam/grocery/src/components/ListActivity.css`
- `/home/adam/grocery/src/components/CategoryStatistics.tsx`
- `/home/adam/grocery/src/components/CategoryStatistics.css`
- `/home/adam/grocery/src/types.ts`

## Summary

The category audit log implementation provides comprehensive tracking of all category-related operations. Every category change is logged with detailed information, including what changed, who made the change, and when it occurred. The system is designed to be non-blocking, performant, and user-friendly, with intuitive displays in both the ListActivity component and CategoryStatistics modal.
