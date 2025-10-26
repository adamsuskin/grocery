# Category Collaboration Features

Comprehensive guide for collaborative category management in shared lists.

## Overview

Category collaboration enables multiple users to work together on managing custom categories for shared grocery lists. The system includes:

1. **Real-time Category Sync** - See category changes immediately
2. **Category Permissions** - Lock categories to prevent editing
3. **Category Notifications** - Stay informed about category changes
4. **Category Suggestions** - Viewers can suggest new categories
5. **Category Discussion** - Comment and discuss categories
6. **Category Voting** - Vote to keep or remove categories
7. **Conflict Resolution** - Handle simultaneous category creation

## Architecture

### Database Schema

#### custom_categories (Enhanced)
- `is_locked` - Boolean flag to prevent editing by non-owners
- `last_edited_by` - UUID of user who last edited the category

#### category_suggestions
- Viewers can suggest categories for approval
- Owners/editors can approve or reject suggestions
- Track suggester, reviewer, and timestamps

#### category_comments
- Threaded discussions on categories
- Support for replies (parent_id)
- Max 1000 characters per comment

#### category_votes
- Members vote to keep or remove categories
- One vote per user per category
- Vote types: 'keep' or 'remove'

#### category_suggestion_votes
- Vote on category suggestions
- Vote types: 'upvote' or 'downvote'
- Helps prioritize suggestions

### Real-time Synchronization

All category operations are synchronized in real-time using Zero's reactive queries:

```typescript
// Real-time category updates
const categories = useCustomCategories(listId);

// Real-time suggestion updates
const suggestions = useCategorySuggestions(listId, 'pending');

// Real-time comment updates
const comments = useCategoryComments(categoryId);

// Real-time vote updates
const votes = useCategoryVotes(categoryId);
```

## Features

### 1. Category Permissions & Locking

**Lock Categories**: Owners can lock categories to prevent editing or deletion by editors.

```typescript
import { useCategoryLocking } from '../hooks/useCategoryCollaboration';

const { lockCategory, unlockCategory } = useCategoryLocking();

// Lock a category (only owner can edit)
await lockCategory(categoryId);

// Unlock a category
await unlockCategory(categoryId);
```

**Permission Checks**:
- **Owner**: Can create, edit, delete, lock/unlock all categories
- **Editor**: Can create, edit, delete unlocked categories
- **Viewer**: Can only view categories and make suggestions

### 2. Category Suggestions

Viewers can suggest new categories for list owners/editors to review.

```typescript
import {
  useCategorySuggestions,
  useCategorySuggestionMutations
} from '../hooks/useCategoryCollaboration';

// Get pending suggestions for a list
const suggestions = useCategorySuggestions(listId, 'pending');

// Suggest a new category
const { suggestCategory } = useCategorySuggestionMutations();
await suggestCategory({
  listId: 'list-123',
  name: 'Organic Produce',
  color: '#4CAF50',
  icon: '🥬',
  reason: 'We buy a lot of organic items'
});

// Review a suggestion (owner/editor only)
const { reviewSuggestion } = useCategorySuggestionMutations();
await reviewSuggestion({
  suggestionId: 'suggestion-456',
  action: 'approve' // or 'reject'
});
```

**Suggestion Workflow**:
1. Viewer suggests a category with optional reason
2. Owners/editors see pending suggestions count
3. Can approve (creates category) or reject
4. Suggester gets notification of decision

### 3. Category Discussion & Comments

Members can discuss categories with threaded comments.

```typescript
import {
  useCategoryComments,
  useCategoryCommentMutations
} from '../hooks/useCategoryCollaboration';

// Get comments for a category
const comments = useCategoryComments(categoryId);

// Add a comment
const { addComment } = useCategoryCommentMutations();
await addComment({
  categoryId: 'category-789',
  commentText: 'Do we really need this category?',
  parentId: undefined // or parent comment ID for replies
});

// Update a comment
const { updateComment } = useCategoryCommentMutations();
await updateComment(commentId, 'Updated comment text');

// Delete a comment
const { deleteComment } = useCategoryCommentMutations();
await deleteComment(commentId);
```

**Comment Features**:
- Max 1000 characters per comment
- Threaded replies
- Real-time updates
- User can edit/delete own comments

### 4. Category Voting

Members can vote to keep or remove categories.

```typescript
import {
  useCategoryVotes,
  useCategoryVoteMutations
} from '../hooks/useCategoryCollaboration';

// Get vote counts for a category
const { keepVotes, removeVotes, totalVotes } = useCategoryVotes(categoryId);

// Cast a vote
const { castVote } = useCategoryVoteMutations();
await castVote({
  categoryId: 'category-789',
  voteType: 'remove' // or 'keep'
});

// Remove your vote
const { removeVote } = useCategoryVoteMutations();
await removeVote(categoryId);
```

**Vote Suggestion Support**:
```typescript
import {
  useSuggestionVotes,
  useSuggestionVoteMutations
} from '../hooks/useCategoryCollaboration';

// Get vote counts for a suggestion
const { upvotes, downvotes, score } = useSuggestionVotes(suggestionId);

// Vote on a suggestion
const { voteSuggestion } = useSuggestionVoteMutations();
await voteSuggestion({
  suggestionId: 'suggestion-456',
  voteType: 'upvote' // or 'downvote'
});
```

### 5. Category Notifications

Real-time notifications for category events:

**Category Events**:
- `CATEGORY_CREATED` - New category created
- `CATEGORY_EDITED` - Category updated
- `CATEGORY_DELETED` - Category removed
- `CATEGORY_LOCKED` - Category locked by owner
- `CATEGORY_UNLOCKED` - Category unlocked

**Suggestion Events**:
- `CATEGORY_SUGGESTED` - New suggestion (to owners/editors)
- `CATEGORY_SUGGESTION_APPROVED` - Suggestion approved (to suggester)
- `CATEGORY_SUGGESTION_REJECTED` - Suggestion rejected (to suggester)

**Discussion Events**:
- `CATEGORY_COMMENT_ADDED` - New comment on category
- `CATEGORY_VOTED` - Vote cast on category

**Notification Integration**:
```typescript
import {
  createCategoryNotification,
  createCategorySuggestionNotification,
  createCategoryCommentNotification,
  notifyListMembers
} from '../server/notifications/controller';
import { NotificationType } from '../server/notifications/types';

// Notify about new category
const payload = createCategoryNotification(
  NotificationType.CATEGORY_CREATED,
  {
    listId: 'list-123',
    listName: 'Weekly Groceries',
    categoryId: 'category-789',
    categoryName: 'Organic Produce',
    actorName: 'John Doe',
    actorId: 'user-456'
  }
);
await notifyListMembers(listId, payload, actorUserId);

// Notify about suggestion
const suggestionPayload = createCategorySuggestionNotification(
  NotificationType.CATEGORY_SUGGESTED,
  {
    listId: 'list-123',
    listName: 'Weekly Groceries',
    suggestionId: 'suggestion-456',
    categoryName: 'Organic Produce',
    suggestedBy: 'user-789',
    suggesterName: 'Jane Smith'
  }
);
await notifyListMembers(listId, suggestionPayload, suggestedByUserId);
```

### 6. Conflict Resolution

When two users create categories with the same name simultaneously:

**Conflict Detection**:
- Unique constraint on `(list_id, LOWER(name))` in database
- Client-side detection of duplicate names
- Real-time sync shows conflicts immediately

**Resolution Strategies**:
1. **Auto-merge**: Keep first created, notify second user
2. **Manual resolution**: Show conflict dialog to user
3. **Rename**: Suggest appending number (e.g., "Snacks (2)")

**Implementation**:
```typescript
try {
  await addCustomCategory({
    name: categoryName,
    listId: listId,
    color: '#4CAF50'
  });
} catch (error) {
  if (error.message.includes('already exists')) {
    // Show conflict resolution dialog
    showCategoryConflictDialog({
      attemptedName: categoryName,
      existingCategory: existingCategories.find(c =>
        c.name.toLowerCase() === categoryName.toLowerCase()
      )
    });
  }
}
```

### 7. Activity Tracking

All category operations are logged in `list_activities`:

- `category_created`
- `category_edited`
- `category_deleted`
- `category_locked`
- `category_unlocked`
- `category_suggested`
- `category_suggestion_approved`
- `category_suggestion_rejected`
- `category_comment_added`
- `category_voted`

```sql
-- Example activity log entry
INSERT INTO list_activities (list_id, user_id, action, details)
VALUES (
  'list-123',
  'user-456',
  'category_created',
  '{"category_id": "cat-789", "category_name": "Organic Produce"}'
);
```

## UI Components

### CategoryCollaboration Component

Main component for category collaboration features:

```typescript
interface CategoryCollaborationProps {
  listId: string;
  category: CustomCategory;
  permission: ListPermission;
  onClose: () => void;
}
```

**Features**:
- Show creator and last editor
- Display vote counts
- Show comments with threading
- Lock/unlock button (owner only)
- Delete with confirmation

### CategorySuggestions Component

Component for managing category suggestions:

```typescript
interface CategorySuggestionsProps {
  listId: string;
  permission: ListPermission;
  onClose: () => void;
}
```

**Features**:
- List pending suggestions
- Show vote counts on each suggestion
- Approve/reject actions (owner/editor)
- Suggest new category form (viewer)
- Batch approve/reject

### CategoryConflictResolver Component

Component for resolving category name conflicts:

```typescript
interface CategoryConflictResolverProps {
  conflict: CategoryConflict;
  onResolve: (resolution: 'local' | 'remote' | 'merge') => void;
  onCancel: () => void;
}
```

## Best Practices

### 1. Permission Checking

Always check permissions before allowing operations:

```typescript
const canEdit = permission === 'owner' ||
  (permission === 'editor' && !category.isLocked);

const canLock = permission === 'owner';

const canSuggest = permission === 'viewer' ||
  permission === 'editor' ||
  permission === 'owner';
```

### 2. Optimistic Updates

Use optimistic updates for better UX:

```typescript
// Show update immediately
setCategories(prev => prev.map(c =>
  c.id === categoryId ? { ...c, name: newName } : c
));

// Then sync with server
try {
  await updateCustomCategory({ id: categoryId, name: newName });
} catch (error) {
  // Revert on error
  setCategories(prev => prev.map(c =>
    c.id === categoryId ? { ...c, name: oldName } : c
  ));
}
```

### 3. Notification Throttling

Throttle notifications to avoid spam:

```typescript
// Only notify if significant changes
if (changedFields.includes('name') || changedFields.includes('color')) {
  await notifyListMembers(listId, payload, actorId);
}

// Batch notifications for bulk operations
const bulkPayload = {
  ...payload,
  body: `${actorName} approved ${approvedCount} category suggestions`
};
```

### 4. Error Handling

Provide clear error messages:

```typescript
try {
  await suggestCategory(input);
} catch (error) {
  if (error.message.includes('already exists')) {
    showError('A category with this name already exists');
  } else if (error.message.includes('permission')) {
    showError('You do not have permission to perform this action');
  } else {
    showError('Failed to suggest category. Please try again.');
  }
}
```

## Migration Guide

### Applying the Migration

```bash
# Run the migration
psql -U postgres -d grocery_db -f server/db/migrations/006_add_category_collaboration.sql

# Verify tables were created
psql -U postgres -d grocery_db -c "\dt category_*"
```

### Updating Zero Schema

The Zero schema version has been incremented to 12. Clear the cache if needed:

```bash
# Clear Zero cache
rm -rf .zero-cache
```

### Updating Existing Categories

Existing categories will have default values:
- `is_locked = false`
- `last_edited_by = NULL`

## Testing

### Unit Tests

```typescript
describe('Category Collaboration', () => {
  it('should allow viewer to suggest category', async () => {
    const { suggestCategory } = useCategorySuggestionMutations();
    await suggestCategory({
      listId: 'test-list',
      name: 'Test Category',
      reason: 'Testing'
    });
    // Verify suggestion was created
  });

  it('should prevent editor from editing locked category', async () => {
    // Lock category as owner
    await lockCategory(categoryId);

    // Try to edit as editor
    await expect(
      updateCustomCategory({ id: categoryId, name: 'New Name' })
    ).rejects.toThrow('permission');
  });

  it('should handle duplicate category names', async () => {
    // Create category with name "Snacks"
    await addCustomCategory({ name: 'Snacks', listId });

    // Try to create another with same name
    await expect(
      addCustomCategory({ name: 'Snacks', listId })
    ).rejects.toThrow('already exists');
  });
});
```

### Integration Tests

```typescript
describe('Real-time Category Sync', () => {
  it('should sync category changes between users', async () => {
    // User A creates category
    const categoryId = await userA.addCustomCategory({
      name: 'Organic',
      listId
    });

    // User B should see it immediately
    await waitFor(() => {
      const categories = userB.useCustomCategories(listId);
      expect(categories.find(c => c.id === categoryId)).toBeDefined();
    });
  });
});
```

## Performance Considerations

### Indexing

All collaboration tables have appropriate indexes:
- `category_suggestions(list_id, status)`
- `category_comments(category_id)`
- `category_votes(category_id, user_id)`
- `category_suggestion_votes(suggestion_id, user_id)`

### Query Optimization

Use `WHERE` clauses to limit data:

```typescript
// Only fetch pending suggestions
const pendingSuggestions = useCategorySuggestions(listId, 'pending');

// Only fetch comments for visible categories
const comments = useCategoryComments(visibleCategoryId);
```

### Caching

Zero automatically caches queries. Clear cache when needed:

```typescript
// Force refresh
await zero.query.category_suggestions.run();
```

## Security

### Permission Enforcement

All mutations check permissions server-side via database functions:

- `user_can_edit_category()` - Respects locking
- `approve_category_suggestion()` - Checks owner/editor permission
- `reject_category_suggestion()` - Checks owner/editor permission

### SQL Injection Protection

All queries use parameterized statements:

```sql
-- Safe
SELECT * FROM custom_categories WHERE list_id = $1;

-- Unsafe (never do this)
SELECT * FROM custom_categories WHERE list_id = '${listId}';
```

### Input Validation

All inputs are validated:
- Category name: 1-100 characters, trimmed
- Comment text: 1-1000 characters, trimmed
- Color: Valid hex code format
- Icon: Valid emoji or max 50 characters

## Future Enhancements

1. **Category Templates**: Save and share category sets
2. **Category Analytics**: Track category usage over time
3. **Category Tags**: Add tags to categories for filtering
4. **Category Merging UI**: Graphical interface for merging categories
5. **Category Import/Export**: Bulk import from CSV/JSON
6. **Category Permissions Per User**: Fine-grained permissions
7. **Category History**: Track all changes to categories
8. **Category Approval Workflow**: Multi-step approval process

## Support

For issues or questions:
- Check the [main documentation](/docs/README.md)
- Review [custom categories guide](/docs/CUSTOM_CATEGORIES.md)
- See [notification setup](/docs/PUSH_NOTIFICATIONS_SETUP.md)
